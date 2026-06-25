// ============================================================================
// Lambda: Audit Logger
// Writes audit trail entries to DynamoDB + S3
// Invoked by Step Functions at each pipeline stage
// Also handles batch audit log queries for the dashboard
// ============================================================================

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createLogger } from '../shared/logger';
import { putAuditEntry, putInvoice, getInvoice, updateInvoice } from '../shared/dynamodb';
import type {
  PipelineState,
  AuditEntry,
  InvoiceRecord,
} from '../shared/types';
import { v4 as uuidv4 } from 'uuid';

const logger = createLogger('audit-logger');

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'ap-south-1' });

const AUDIT_BUCKET = process.env.AUDIT_BUCKET || 'invoice-pipeline-audit';

// ---------------------------------------------------------------------------
// Handler — invoked by Step Functions to persist final results + audit
// ---------------------------------------------------------------------------

interface AuditLoggerEvent {
  // Can be invoked from Step Functions (PipelineState) or directly
  invoiceId: string;
  action: 'PERSIST_RESULTS' | 'LOG_EVENT' | 'GENERATE_REPORT';

  // Step Functions state (when action = PERSIST_RESULTS)
  pipelineState?: PipelineState;

  // Direct audit event (when action = LOG_EVENT)
  event?: string;
  eventType?: string;
  user?: string;
  details?: string;
  metadata?: Record<string, string>;
}

export async function handler(event: AuditLoggerEvent): Promise<any> {
  const { invoiceId, action } = event;
  const log = logger.child({ invoiceId, action });

  log.info('Audit logger invoked');

  try {
    switch (action) {
      case 'PERSIST_RESULTS':
        return await persistPipelineResults(event);

      case 'LOG_EVENT':
        return await logAuditEvent(event);

      case 'GENERATE_REPORT':
        return await generateAuditReport(event);

      default:
        // Default: treat as Step Functions state passthrough for persistence
        if (event.pipelineState) {
          return await persistPipelineResults(event);
        }
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    log.error('Audit logger failed', error);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Persist Final Pipeline Results (DynamoDB + S3 Audit)
// ---------------------------------------------------------------------------

function mapUIFieldToDbField(uiField: string): string {
  switch (uiField) {
    case 'Vendor Name': return 'vendorName';
    case 'GSTIN': return 'gstin';
    case 'Invoice Number': return 'invoiceNumber';
    case 'Invoice Date': return 'invoiceDate';
    case 'Due Date': return 'dueDate';
    case 'PO Number': return 'poNumber';
    case 'Total Amount': return 'totalAmount';
    case 'Subtotal': return 'subtotal';
    case 'tax': return 'cgst';
    default: return uiField;
  }
}

async function persistPipelineResults(
  event: AuditLoggerEvent
): Promise<{ invoiceId: string; s3AuditKey: string; status: string }> {
  const { invoiceId, pipelineState } = event;

  if (!pipelineState) {
    throw new Error('Missing pipelineState for PERSIST_RESULTS action');
  }

  const log = logger.child({ invoiceId });
  const endTimer = log.startTimer('Persisting pipeline results');

  const { extraction, validation, approvalResult } = pipelineState;

  // Build the final invoice record
  const finalStatus = approvalResult?.action === 'APPROVE'
    ? 'PROCESSED'
    : (validation?.status || 'PROCESSED');

  const corrections: Record<string, any> = {};
  if (approvalResult && approvalResult.correctedFields) {
    for (const [key, val] of Object.entries(approvalResult.correctedFields)) {
      if (!key.startsWith(`${invoiceId}-`)) {
        continue;
      }
      const fieldName = key.replace(`${invoiceId}-`, '');
      const dbField = mapUIFieldToDbField(fieldName);
      if (dbField === 'totalAmount' || dbField === 'subtotal') {
        const numericStr = String(val).replace(/[^0-9.]/g, '');
        corrections[dbField] = parseFloat(numericStr) || 0;
      } else {
        corrections[dbField] = val;
      }
    }
  }

  // Update the DynamoDB record with final results
  await updateInvoice(invoiceId, 'PENDING', {
    status: finalStatus,
    vendorName: corrections.vendorName || extraction?.vendorName || 'Unknown',
    vendorAddress: extraction?.vendorAddress,
    gstin: corrections.gstin || extraction?.gstin,
    invoiceNumber: corrections.invoiceNumber || extraction?.invoiceNumber || '',
    invoiceDate: extraction?.invoiceDate || '',
    dueDate: extraction?.dueDate,
    poNumber: extraction?.poNumber,
    lineItems: extraction?.lineItems || [],
    subtotal: corrections.subtotal || extraction?.subtotal || 0,
    cgst: extraction?.cgst || 0,
    sgst: extraction?.sgst || 0,
    totalAmount: corrections.totalAmount || extraction?.totalAmount || 0,
    extractionConfidence: validation?.overallConfidence || extraction?.overallConfidence || 0,
    extractedFields: validation?.validatedFields || extraction?.extractedFields || [],
    anomalies: finalStatus === 'PROCESSED' ? [] : (validation?.anomalies || []),
  });

  // Store comprehensive audit report in S3
  const auditReport = {
    invoiceId,
    processedAt: new Date().toISOString(),
    source: pipelineState.source,
    sourceEmail: pipelineState.sourceEmail,
    s3RawKey: pipelineState.s3Key,
    extraction: {
      fieldsExtracted: extraction?.extractedFields?.length || 0,
      lineItemsExtracted: extraction?.lineItems?.length || 0,
      overallConfidence: extraction?.overallConfidence || 0,
      vendorName: extraction?.vendorName,
      invoiceNumber: extraction?.invoiceNumber,
      totalAmount: extraction?.totalAmount,
    },
    validation: {
      status: validation?.status,
      anomaliesCount: validation?.anomalies?.length || 0,
      anomalies: validation?.anomalies || [],
      confidence: validation?.overallConfidence || 0,
      summary: validation?.validationSummary || '',
      isDuplicate: validation?.isDuplicate || false,
    },
    finalStatus,
    pipelineComplete: true,
  };

  const s3AuditKey = `audit/${invoiceId}/pipeline-report-${Date.now()}.json`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: AUDIT_BUCKET,
      Key: s3AuditKey,
      Body: JSON.stringify(auditReport, null, 2),
      ContentType: 'application/json',
      Metadata: {
        invoiceId,
        status: finalStatus,
        processedAt: new Date().toISOString(),
      },
    })
  );

  // Update S3 audit key reference in DynamoDB
  await updateInvoice(invoiceId, 'PENDING', {
    s3AuditKey,
  });

  // Write final audit entry
  await putAuditEntry({
    auditId: uuidv4(),
    invoiceId,
    event: 'Pipeline processing completed',
    eventType: 'PERSISTENCE',
    timestamp: new Date().toISOString(),
    user: 'system',
    details: `Invoice processed with status: ${finalStatus}. ${validation?.anomalies?.length || 0} anomalies. Confidence: ${validation?.overallConfidence || extraction?.overallConfidence || 0}%`,
    metadata: {
      status: finalStatus,
      s3AuditKey,
      confidence: String(validation?.overallConfidence || 0),
    },
  });

  endTimer();

  log.info('Pipeline results persisted', {
    status: finalStatus,
    s3AuditKey,
  });

  return {
    invoiceId,
    s3AuditKey,
    status: finalStatus,
  };
}

// ---------------------------------------------------------------------------
// Log Individual Audit Events
// ---------------------------------------------------------------------------

async function logAuditEvent(event: AuditLoggerEvent): Promise<AuditEntry> {
  const entry: AuditEntry = {
    auditId: uuidv4(),
    invoiceId: event.invoiceId,
    event: event.event || 'Unknown event',
    eventType: (event.eventType as AuditEntry['eventType']) || 'PERSISTENCE',
    timestamp: new Date().toISOString(),
    user: event.user || 'system',
    details: event.details || '',
    metadata: event.metadata,
  };

  await putAuditEntry(entry);

  if (entry.eventType === 'ERROR') {
    try {
      await updateInvoice(event.invoiceId, 'PENDING', {
        status: 'EXCEPTION',
        anomalies: [
          {
            type: 'LOW_CONFIDENCE_SCORE',
            description: event.details || event.event || 'Pipeline processing failed',
            severity: 'HIGH',
          },
        ],
      });
      logger.info('Updated invoice status to EXCEPTION due to pipeline error', { invoiceId: event.invoiceId });
    } catch (dbError) {
      logger.error('Failed to update invoice status on error logging', dbError);
    }
  }

  logger.info('Audit event logged', {
    invoiceId: event.invoiceId,
    eventType: entry.eventType,
  });

  return entry;
}

// ---------------------------------------------------------------------------
// Generate Audit Report (for a specific invoice)
// ---------------------------------------------------------------------------

async function generateAuditReport(
  event: AuditLoggerEvent
): Promise<{ invoiceId: string; s3ReportKey: string }> {
  const { invoiceId } = event;
  const log = logger.child({ invoiceId });

  log.info('Generating audit report');

  // Fetch invoice record
  const invoice = await getInvoice(invoiceId, 'PENDING');
  if (!invoice) {
    throw new Error(`Invoice ${invoiceId} not found`);
  }

  // Build a comprehensive report
  const report = {
    generatedAt: new Date().toISOString(),
    invoiceId,
    invoice: {
      vendorName: invoice.vendorName,
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate,
      totalAmount: invoice.totalAmount,
      currency: invoice.currency,
      status: invoice.status,
      source: invoice.source,
    },
    extraction: {
      confidence: invoice.extractionConfidence,
      fieldsCount: invoice.extractedFields?.length || 0,
      lineItemsCount: invoice.lineItems?.length || 0,
      fields: invoice.extractedFields,
    },
    anomalies: invoice.anomalies,
    approval: {
      approvedBy: invoice.approvedBy,
      approvalTimestamp: invoice.approvalTimestamp,
      comments: invoice.approvalComments,
    },
    timeline: {
      receivedOn: invoice.receivedOn,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
    },
    s3References: {
      rawPdf: invoice.s3RawKey,
      auditReport: invoice.s3AuditKey,
      extractedJson: invoice.s3ExtractedJsonKey,
    },
  };

  const s3ReportKey = `reports/${invoiceId}/audit-report-${Date.now()}.json`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: AUDIT_BUCKET,
      Key: s3ReportKey,
      Body: JSON.stringify(report, null, 2),
      ContentType: 'application/json',
    })
  );

  log.info('Audit report generated', { s3ReportKey });

  return { invoiceId, s3ReportKey };
}
