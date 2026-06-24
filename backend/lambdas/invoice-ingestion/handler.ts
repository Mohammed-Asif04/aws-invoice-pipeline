// ============================================================================
// Lambda: Invoice Ingestion Handler
// Receives SES email events → parses MIME → extracts PDF → stores in S3
// Also handles direct upload from the React frontend via API Gateway
// ============================================================================

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { SFNClient, StartExecutionCommand } from '@aws-sdk/client-sfn';
import { createLogger } from '../shared/logger';
import { putInvoice, putAuditEntry } from '../shared/dynamodb';
import type {
  InvoiceRecord,
  AuditEntry,
  PipelineInput,
} from '../shared/types';
import { simpleParser, ParsedMail } from 'mailparser';
import { v4 as uuidv4 } from 'uuid';

const logger = createLogger('invoice-ingestion');

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'ap-south-1' });
const sfnClient = new SFNClient({ region: process.env.AWS_REGION || 'ap-south-1' });

const RAW_BUCKET = process.env.RAW_BUCKET || 'invoice-pipeline-raw';
const STATE_MACHINE_ARN = process.env.STATE_MACHINE_ARN || '';

// ---------------------------------------------------------------------------
// SES Email Ingestion (S3 event after SES stores the email)
// ---------------------------------------------------------------------------

interface SESEvent {
  Records: Array<{
    eventSource: string;
    eventVersion: string;
    ses: {
      mail: {
        messageId: string;
        source: string;
        timestamp: string;
        commonHeaders: {
          from: string[];
          subject: string;
          date: string;
        };
      };
      receipt: {
        action: {
          type: string;
          bucketName: string;
          objectKey: string;
        };
      };
    };
  }>;
}

interface S3Event {
  Records: Array<{
    eventSource: string;
    s3: {
      bucket: { name: string };
      object: { key: string; size: number };
    };
  }>;
}

interface APIGatewayEvent {
  httpMethod: string;
  path: string;
  body: string | null;
  isBase64Encoded: boolean;
  headers: Record<string, string>;
  queryStringParameters?: Record<string, string>;
}

type LambdaEvent = SESEvent | S3Event | APIGatewayEvent;

export async function handler(event: LambdaEvent): Promise<any> {
  logger.info('Invoice ingestion handler invoked', { eventType: detectEventType(event) });

  try {
    const eventType = detectEventType(event);

    switch (eventType) {
      case 'SES':
        return await handleSESEvent(event as SESEvent);
      case 'S3':
        return await handleS3Event(event as S3Event);
      case 'API_GATEWAY':
        return await handleAPIUpload(event as APIGatewayEvent);
      default:
        throw new Error(`Unknown event type: ${eventType}`);
    }
  } catch (error) {
    logger.error('Invoice ingestion failed', error);
    throw error;
  }
}

function detectEventType(event: LambdaEvent): string {
  if ('Records' in event && event.Records.length > 0) {
    const firstRecord = event.Records[0];
    if ('ses' in firstRecord) return 'SES';
    if ('s3' in firstRecord) return 'S3';
  }
  if ('httpMethod' in event) return 'API_GATEWAY';
  return 'UNKNOWN';
}

// ---------------------------------------------------------------------------
// Handle SES Email → Parse MIME → Extract PDF → Store in S3
// ---------------------------------------------------------------------------

async function handleSESEvent(event: SESEvent): Promise<void> {
  for (const record of event.Records) {
    const { mail } = record.ses;
    const emailBucket = record.ses.receipt.action.bucketName;
    const emailKey = record.ses.receipt.action.objectKey;

    const log = logger.child({
      messageId: mail.messageId,
      from: mail.source,
    });

    log.info('Processing SES email', {
      subject: mail.commonHeaders.subject,
    });

    // Fetch the raw email from S3
    const { GetObjectCommand } = await import('@aws-sdk/client-s3');
    const emailResponse = await s3Client.send(
      new GetObjectCommand({
        Bucket: emailBucket,
        Key: emailKey,
      })
    );

    const emailBody = await emailResponse.Body?.transformToString();
    if (!emailBody) {
      log.error('Empty email body', undefined, { emailKey });
      return;
    }

    // Parse MIME content
    const parsed: ParsedMail = await simpleParser(emailBody);

    // Extract PDF attachments
    const pdfAttachments = (parsed.attachments || []).filter(
      (att) =>
        att.contentType === 'application/pdf' ||
        att.filename?.toLowerCase().endsWith('.pdf')
    );

    if (pdfAttachments.length === 0) {
      log.warn('No PDF attachments found in email', {
        attachmentCount: parsed.attachments?.length || 0,
      });
      return;
    }

    // Process each PDF attachment
    for (const attachment of pdfAttachments) {
      const invoiceId = `INV-${new Date().getFullYear()}-${uuidv4().slice(0, 8).toUpperCase()}`;
      const s3Key = `invoices/${invoiceId}/${attachment.filename || 'invoice.pdf'}`;

      log.info('Storing PDF attachment in S3', {
        invoiceId,
        filename: attachment.filename,
        size: attachment.size,
      });

      // Upload PDF to raw bucket
      await s3Client.send(
        new PutObjectCommand({
          Bucket: RAW_BUCKET,
          Key: s3Key,
          Body: attachment.content,
          ContentType: 'application/pdf',
          Metadata: {
            invoiceId,
            sourceEmail: mail.source,
            receivedAt: mail.timestamp,
          },
        })
      );

      // Create initial invoice record in DynamoDB
      const invoiceRecord: InvoiceRecord = {
        invoiceId,
        vendorId: 'PENDING',
        vendorName: 'Pending Extraction',
        invoiceNumber: '',
        invoiceDate: '',
        lineItems: [],
        subtotal: 0,
        cgst: 0,
        sgst: 0,
        totalAmount: 0,
        currency: 'INR',
        status: 'IN_PROGRESS',
        extractionConfidence: 0,
        extractedFields: [],
        anomalies: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        receivedOn: mail.timestamp,
        s3RawKey: s3Key,
        source: 'EMAIL',
        sourceEmail: mail.source,
      };

      await putInvoice(invoiceRecord);

      // Write audit entry
      const auditEntry: AuditEntry = {
        auditId: uuidv4(),
        invoiceId,
        event: 'Invoice received via email',
        eventType: 'INGESTION',
        timestamp: new Date().toISOString(),
        user: 'system',
        details: `PDF "${attachment.filename}" (${attachment.size} bytes) received from ${mail.source}`,
        metadata: {
          sourceEmail: mail.source,
          filename: attachment.filename || '',
          size: String(attachment.size),
        },
      };

      await putAuditEntry(auditEntry);

      // Start Step Functions execution
      await startPipelineExecution({
        invoiceId,
        s3Bucket: RAW_BUCKET,
        s3Key,
        source: 'EMAIL',
        sourceEmail: mail.source,
      });

      log.info('Invoice ingestion complete, pipeline started', { invoiceId });
    }
  }
}

// ---------------------------------------------------------------------------
// Handle S3 direct upload event (manual uploads bypass SES)
// ---------------------------------------------------------------------------

async function handleS3Event(event: S3Event): Promise<void> {
  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

    // Skip if this isn't a PDF
    if (!key.toLowerCase().endsWith('.pdf')) {
      logger.info('Skipping non-PDF file', { key });
      return;
    }

    // Skip if already in our managed prefix (avoid re-triggering)
    if (key.startsWith('invoices/INV-')) {
      logger.info('Skipping already-managed file', { key });
      return;
    }

    const invoiceId = `INV-${new Date().getFullYear()}-${uuidv4().slice(0, 8).toUpperCase()}`;

    logger.info('Processing S3 upload event', { invoiceId, bucket, key });

    // Create initial invoice record
    const invoiceRecord: InvoiceRecord = {
      invoiceId,
      vendorId: 'PENDING',
      vendorName: 'Pending Extraction',
      invoiceNumber: '',
      invoiceDate: '',
      lineItems: [],
      subtotal: 0,
      cgst: 0,
      sgst: 0,
      totalAmount: 0,
      currency: 'INR',
      status: 'IN_PROGRESS',
      extractionConfidence: 0,
      extractedFields: [],
      anomalies: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      receivedOn: new Date().toISOString(),
      s3RawKey: key,
      source: 'UPLOAD',
    };

    await putInvoice(invoiceRecord);

    // Audit entry
    await putAuditEntry({
      auditId: uuidv4(),
      invoiceId,
      event: 'Invoice uploaded via S3',
      eventType: 'INGESTION',
      timestamp: new Date().toISOString(),
      user: 'system',
      details: `PDF uploaded to s3://${bucket}/${key} (${record.s3.object.size} bytes)`,
    });

    // Start pipeline
    await startPipelineExecution({
      invoiceId,
      s3Bucket: bucket,
      s3Key: key,
      source: 'UPLOAD',
    });
  }
}

// ---------------------------------------------------------------------------
// Handle API Gateway upload (from React frontend)
// ---------------------------------------------------------------------------

async function handleAPIUpload(event: APIGatewayEvent): Promise<any> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Parse the upload payload
    const body = event.isBase64Encoded
      ? Buffer.from(event.body || '', 'base64')
      : Buffer.from(event.body || '');

    // For multipart form data, we expect the frontend to send:
    // - file: the PDF binary
    // - metadata: JSON string with optional vendor, date, PO number, etc.
    const invoiceId = `INV-${new Date().getFullYear()}-${uuidv4().slice(0, 8).toUpperCase()}`;
    const filename = event.headers?.['x-filename'] || 'invoice.pdf';
    const s3Key = `invoices/${invoiceId}/${filename}`;

    // Parse optional metadata from headers
    const metadataHeader = event.headers?.['x-invoice-metadata'];
    const metadata = metadataHeader ? JSON.parse(metadataHeader) : {};

    logger.info('Processing API upload', {
      invoiceId,
      filename,
      size: body.length,
    });

    // Upload to S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: RAW_BUCKET,
        Key: s3Key,
        Body: body,
        ContentType: 'application/pdf',
        Metadata: {
          invoiceId,
          uploadedBy: metadata.uploadedBy || 'unknown',
          ...metadata,
        },
      })
    );

    // Create invoice record with any pre-filled metadata
    const invoiceRecord: InvoiceRecord = {
      invoiceId,
      vendorId: metadata.vendorId || 'PENDING',
      vendorName: metadata.vendorName || 'Pending Extraction',
      invoiceNumber: metadata.invoiceNumber || '',
      invoiceDate: metadata.invoiceDate || '',
      poNumber: metadata.poNumber || undefined,
      lineItems: [],
      subtotal: 0,
      cgst: 0,
      sgst: 0,
      totalAmount: 0,
      currency: 'INR',
      status: 'IN_PROGRESS',
      extractionConfidence: 0,
      extractedFields: [],
      anomalies: [],
      createdBy: metadata.uploadedBy || 'web-user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      receivedOn: new Date().toISOString(),
      s3RawKey: s3Key,
      source: 'UPLOAD',
    };

    await putInvoice(invoiceRecord);

    // Audit entry
    await putAuditEntry({
      auditId: uuidv4(),
      invoiceId,
      event: 'Invoice uploaded via web dashboard',
      eventType: 'INGESTION',
      timestamp: new Date().toISOString(),
      user: metadata.uploadedBy || 'web-user',
      details: `PDF "${filename}" uploaded via React dashboard`,
      metadata: { filename, size: String(body.length) },
    });

    // Start pipeline
    await startPipelineExecution({
      invoiceId,
      s3Bucket: RAW_BUCKET,
      s3Key,
      source: 'UPLOAD',
      metadata,
    });

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        invoiceId,
        message: 'Invoice uploaded and processing started',
        s3Key,
      }),
    };
  } catch (error) {
    logger.error('API upload failed', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Upload failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
}

// ---------------------------------------------------------------------------
// Start Step Functions Execution
// ---------------------------------------------------------------------------

async function startPipelineExecution(input: PipelineInput): Promise<void> {
  if (!STATE_MACHINE_ARN) {
    logger.warn('STATE_MACHINE_ARN not set, skipping pipeline execution');
    return;
  }

  const endTimer = logger.startTimer('Starting Step Functions execution');

  await sfnClient.send(
    new StartExecutionCommand({
      stateMachineArn: STATE_MACHINE_ARN,
      name: `${input.invoiceId}-${Date.now()}`,
      input: JSON.stringify(input),
    })
  );

  endTimer();
  logger.info('Pipeline execution started', {
    invoiceId: input.invoiceId,
    stateMachineArn: STATE_MACHINE_ARN,
  });
}
