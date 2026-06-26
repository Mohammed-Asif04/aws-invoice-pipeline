// ============================================================================
// Lambda: Textract Processor
// Invoked by Step Functions → calls Amazon Textract AnalyzeExpense API
// Extracts structured invoice data (vendor, amounts, line items, GSTIN, etc.)
// ============================================================================

import {
  TextractClient,
  AnalyzeExpenseCommand,
  ExpenseDocument,
  ExpenseField,
  LineItemGroup,
} from '@aws-sdk/client-textract';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
import { createLogger } from '../shared/logger';
import { updateInvoice, putAuditEntry } from '../shared/dynamodb';
import type {
  PipelineState,
  TextractExtractionResult,
  ExtractedField,
  LineItem,
  AuditEntry,
} from '../shared/types';
import { v4 as uuidv4 } from 'uuid';

const logger = createLogger('textract-processor');

const textractClient = new TextractClient({
  region: process.env.AWS_REGION || 'ap-south-1',
});
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
});
const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'ap-south-1',
});

const AUDIT_BUCKET = process.env.AUDIT_BUCKET || 'invoice-pipeline-audit';
const BEDROCK_MODEL_ID = process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-haiku-20240307-v1:0';

// ---------------------------------------------------------------------------
// Field name mappings for Textract AnalyzeExpense
// ---------------------------------------------------------------------------

const FIELD_MAPPINGS: Record<string, string> = {
  VENDOR_NAME: 'vendorName',
  VENDOR_ADDRESS: 'vendorAddress',
  RECEIVER_NAME: 'receiverName',
  RECEIVER_ADDRESS: 'receiverAddress',
  INVOICE_RECEIPT_ID: 'invoiceNumber',
  INVOICE_RECEIPT_DATE: 'invoiceDate',
  DUE_DATE: 'dueDate',
  PO_NUMBER: 'poNumber',
  SUBTOTAL: 'subtotal',
  TAX: 'tax',
  TOTAL: 'totalAmount',
  AMOUNT_DUE: 'amountDue',
  PAYMENT_TERMS: 'paymentTerms',
  TAX_PAYER_ID: 'gstin',
  ACCOUNT_NUMBER: 'accountNumber',
  NAME: 'name',
};

// ---------------------------------------------------------------------------
// Handler — invoked by Step Functions
// ---------------------------------------------------------------------------

export async function handler(event: PipelineState): Promise<PipelineState> {
  const { invoiceId, s3Bucket, s3Key } = event;
  const log = logger.child({ invoiceId });

  log.info('Starting Textract extraction', { s3Bucket, s3Key });

  const endTimer = log.startTimer('Textract AnalyzeExpense');

  try {
    // Call Textract AnalyzeExpense passing S3 object directly
    let textractResponse;
    let extraction: TextractExtractionResult = {} as any;
    let isBedrockFallback = false;

    try {
      textractResponse = await textractClient.send(
        new AnalyzeExpenseCommand({
          Document: {
            S3Object: {
              Bucket: s3Bucket,
              Name: s3Key,
            },
          },
        })
      );
    } catch (textractError: any) {
      if (
        textractError.name === 'SubscriptionRequiredException' ||
        textractError.code === 'SubscriptionRequiredException' ||
        textractError.message?.includes('subscription') ||
        textractError.message?.includes('SubscriptionRequiredException')
      ) {
        log.warn('Textract subscription missing, falling back to dynamic Bedrock Claude extraction', {
          errorName: textractError.name,
          errorMessage: textractError.message,
        });
        isBedrockFallback = true;
        const bedrockResult = await extractInvoiceWithBedrock(s3Bucket, s3Key, invoiceId);
        extraction = buildExtractionResultFromBedrock(bedrockResult, invoiceId, s3Key);
        textractResponse = {
          source: 'bedrock-fallback',
          bedrockResult,
        };
      } else {
        throw textractError;
      }
    }

    endTimer();

    if (!isBedrockFallback) {
      // Parse the Textract response
      extraction = parseTextractResponse(
        invoiceId,
        s3Key,
        textractResponse.ExpenseDocuments || []
      );
    }

    log.info('Textract extraction complete', {
      fieldsExtracted: extraction.extractedFields.length,
      lineItemsExtracted: extraction.lineItems.length,
      overallConfidence: extraction.overallConfidence,
    });

    // Store raw Textract response, update DynamoDB, and write audit — all in parallel
    const textractJsonKey = `textract/${invoiceId}/raw-response.json`;

    await Promise.all([
      // Store raw Textract response in audit bucket
      s3Client.send(
        new PutObjectCommand({
          Bucket: AUDIT_BUCKET,
          Key: textractJsonKey,
          Body: JSON.stringify(textractResponse, null, 2),
          ContentType: 'application/json',
        })
      ),

      // Update DynamoDB with extracted data
      updateInvoice(invoiceId, event.extraction?.invoiceId ? extraction.vendorName : 'PENDING', {
        vendorName: extraction.vendorName || 'Unknown Vendor',
        vendorAddress: extraction.vendorAddress,
        gstin: extraction.gstin,
        invoiceNumber: extraction.invoiceNumber,
        invoiceDate: extraction.invoiceDate,
        dueDate: extraction.dueDate,
        poNumber: extraction.poNumber,
        lineItems: extraction.lineItems,
        subtotal: extraction.subtotal,
        cgst: extraction.cgst,
        sgst: extraction.sgst,
        totalAmount: extraction.totalAmount,
        currency: extraction.currency,
        extractionConfidence: extraction.overallConfidence,
        extractedFields: extraction.extractedFields,
        s3ExtractedJsonKey: textractJsonKey,
        status: 'IN_PROGRESS',
      }),

      // Write audit entry
      putAuditEntry({
        auditId: uuidv4(),
        invoiceId,
        event: 'Document extraction completed',
        eventType: 'EXTRACTION',
        timestamp: new Date().toISOString(),
        user: 'system',
        details: `Textract extracted ${extraction.extractedFields.length} fields, ${extraction.lineItems.length} line items. Overall confidence: ${extraction.overallConfidence}%`,
        metadata: {
          fieldsCount: String(extraction.extractedFields.length),
          lineItemsCount: String(extraction.lineItems.length),
          confidence: String(extraction.overallConfidence),
        },
      } as AuditEntry),
    ]);

    // Return updated pipeline state
    return {
      ...event,
      extraction,
    };
  } catch (error) {
    log.error('Textract extraction failed', error);

    // Write error audit entry
    await putAuditEntry({
      auditId: uuidv4(),
      invoiceId,
      event: 'Document extraction failed',
      eventType: 'ERROR',
      timestamp: new Date().toISOString(),
      user: 'system',
      details: error instanceof Error ? error.message : 'Unknown extraction error',
    });

    throw error;
  }
}

// ---------------------------------------------------------------------------
// Parse Textract AnalyzeExpense response
// ---------------------------------------------------------------------------

function parseTextractResponse(
  invoiceId: string,
  s3RawKey: string,
  expenseDocuments: ExpenseDocument[]
): TextractExtractionResult {
  const extractedFields: ExtractedField[] = [];
  const lineItems: LineItem[] = [];
  let confidenceScores: number[] = [];

  // Extracted values
  const extracted: Record<string, string> = {};

  for (const doc of expenseDocuments) {
    // Process summary fields
    if (doc.SummaryFields) {
      for (const field of doc.SummaryFields) {
        const fieldType = field.Type?.Text || '';
        const fieldValue = field.ValueDetection?.Text || '';
        const confidence = field.ValueDetection?.Confidence || 0;

        // Map Textract field names to our schema
        const mappedName = FIELD_MAPPINGS[fieldType] || fieldType;
        
        if (mappedName === 'tax') {
          const currentTax = parseFloat(extracted.tax?.replace(/,/g, '') || '0');
          const newTax = parseFloat(fieldValue.replace(/,/g, '') || '0');
          extracted.tax = (currentTax + newTax).toString();
        } else if (!extracted[mappedName]) {
          extracted[mappedName] = fieldValue;
        }

        extractedFields.push({
          fieldName: mappedName,
          extractedValue: fieldValue,
          confidence: Math.round(confidence * 100) / 100,
          validationStatus: 'PENDING',
        });

        confidenceScores.push(confidence);
      }
    }

    // Process line item groups
    if (doc.LineItemGroups) {
      for (const group of doc.LineItemGroups) {
        if (group.LineItems) {
          for (const lineItem of group.LineItems) {
            const item = parseLineItem(lineItem.LineItemExpenseFields || []);
            if (item) {
              lineItems.push(item);
            }
          }
        }
      }
    }
  }

  // Calculate overall confidence
  const overallConfidence =
    confidenceScores.length > 0
      ? Math.round(
          (confidenceScores.reduce((a, b) => a + b, 0) /
            confidenceScores.length) *
            100
        ) / 100
      : 0;

  // Parse financial values
  const subtotal = parseAmount(extracted.subtotal);
  const totalAmount = parseAmount(extracted.totalAmount);
  const tax = parseAmount(extracted.tax);

  // Split tax into CGST/SGST (common for Indian invoices — assume 50/50 split)
  const cgst = Math.round((tax / 2) * 100) / 100;
  const sgst = Math.round((tax / 2) * 100) / 100;

  // Detect GSTIN pattern (15-character alphanumeric)
  let gstin = extracted.gstin || '';
  if (!gstin) {
    // Try to find GSTIN in other fields
    for (const field of extractedFields) {
      if (/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}Z[A-Z0-9]{1}$/.test(field.extractedValue)) {
        gstin = field.extractedValue;
        break;
      }
    }
  }

  return {
    invoiceId,
    s3RawKey,
    extractedFields,
    lineItems,
    vendorName: extracted.vendorName || extracted.name || extracted.receiverName || '',
    vendorAddress: extracted.vendorAddress,
    gstin,
    invoiceDate: extracted.invoiceDate || '',
    dueDate: extracted.dueDate,
    poNumber: extracted.poNumber,
    invoiceNumber: extracted.invoiceNumber || '',
    subtotal,
    cgst,
    sgst,
    totalAmount: totalAmount || subtotal + cgst + sgst,
    currency: 'INR',
    overallConfidence,
  };
}

// ---------------------------------------------------------------------------
// Parse individual line items from Textract
// ---------------------------------------------------------------------------

function parseLineItem(fields: ExpenseField[]): LineItem | null {
  const item: Partial<LineItem> = {};

  for (const field of fields) {
    const type = field.Type?.Text || '';
    const value = field.ValueDetection?.Text || '';

    switch (type) {
      case 'ITEM':
      case 'DESCRIPTION':
        item.description = value;
        break;
      case 'QUANTITY':
        item.quantity = parseFloat(value) || 0;
        break;
      case 'UNIT_PRICE':
      case 'PRICE':
        item.unitPrice = parseAmount(value);
        break;
      case 'EXPENSE_ROW_AMOUNT':
      case 'AMOUNT':
        item.amount = parseAmount(value);
        break;
      case 'PRODUCT_CODE':
        item.hsnSac = value;
        break;
    }
  }

  // Only return if we have at least a description
  if (!item.description) return null;

  return {
    description: item.description || '',
    hsnSac: item.hsnSac || '',
    quantity: item.quantity || 1,
    unitPrice: item.unitPrice || 0,
    amount: item.amount || item.unitPrice || 0,
  };
}

// ---------------------------------------------------------------------------
// Parse currency amounts (handles commas, currency symbols)
// ---------------------------------------------------------------------------

function parseAmount(value: string | undefined): number {
  if (!value) return 0;

  // Remove currency symbols, commas, whitespace
  const cleaned = value.replace(/[₹$€£,\s]/g, '').trim();
  const amount = parseFloat(cleaned);

  return isNaN(amount) ? 0 : Math.round(amount * 100) / 100;
}

// ---------------------------------------------------------------------------
// Bedrock Converse API — Dynamic Invoice Extraction (Textract fallback)
// ---------------------------------------------------------------------------

interface BedrockExtractedInvoice {
  vendorName: string;
  vendorAddress: string;
  gstin: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  poNumber: string;
  subtotal: number;
  cgst: number;
  sgst: number;
  totalAmount: number;
  currency: string;
  lineItems: Array<{
    description: string;
    hsnSac: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
  confidence: number;
}

async function extractInvoiceWithBedrock(
  s3Bucket: string,
  s3Key: string,
  invoiceId: string
): Promise<BedrockExtractedInvoice> {
  const log = logger.child({ invoiceId, method: 'extractInvoiceWithBedrock' });

  // 1. Download the document from S3
  log.info('Downloading document from S3 for Bedrock extraction', { s3Bucket, s3Key });
  const s3Response = await s3Client.send(
    new GetObjectCommand({ Bucket: s3Bucket, Key: s3Key })
  );
  const bodyBytes = await s3Response.Body?.transformToByteArray();
  if (!bodyBytes || bodyBytes.length === 0) {
    throw new Error(`Failed to download document from S3: ${s3Bucket}/${s3Key}`);
  }

  // 2. Detect the file format from the S3 key extension
  const extension = s3Key.split('.').pop()?.toLowerCase() || '';
  const isPdf = extension === 'pdf';
  const imageFormats: Record<string, string> = {
    png: 'png',
    jpg: 'jpeg',
    jpeg: 'jpeg',
    gif: 'gif',
    webp: 'webp',
  };

  // 3. Build the Converse API content block
  let documentContent: any;
  if (isPdf) {
    documentContent = {
      document: {
        format: 'pdf',
        name: `invoice-${invoiceId}`,
        source: {
          bytes: bodyBytes,
        },
      },
    };
  } else if (imageFormats[extension]) {
    documentContent = {
      image: {
        format: imageFormats[extension],
        source: {
          bytes: bodyBytes,
        },
      },
    };
  } else {
    // Default to PDF for unknown extensions
    documentContent = {
      document: {
        format: 'pdf',
        name: `invoice-${invoiceId}`,
        source: {
          bytes: bodyBytes,
        },
      },
    };
  }

  const extractionPrompt = `You are an expert invoice data extraction system. Analyze the provided invoice document and extract ALL fields accurately.

IMPORTANT RULES:
- Extract EXACTLY what is written in the document. Do NOT invent, guess, or hallucinate any data.
- If a field is not present in the document, return an empty string "" for text fields or 0 for numeric fields.
- For GSTIN: Only extract if you see a valid 15-character Indian GSTIN (format: 2 digits + 5 letters + 4 digits + 1 letter + 1 alphanumeric + Z + 1 alphanumeric). If no GSTIN is present, return "".
- For amounts: Extract the exact numeric values shown. Remove currency symbols but preserve the actual numbers.
- For line items: Extract every line item row visible in the invoice.

Return ONLY a valid JSON object with this exact structure (no markdown, no explanation, no extra text):

{
  "vendorName": "<exact name of the vendor/company who issued this invoice (look at the header/logo area)>",
  "vendorAddress": "<full vendor address if present>",
  "gstin": "<15-char GSTIN if present, otherwise empty string>",
  "invoiceNumber": "<invoice number/ID>",
  "invoiceDate": "<invoice date in YYYY-MM-DD format>",
  "dueDate": "<due date in YYYY-MM-DD format if present>",
  "poNumber": "<PO number if present>",
  "subtotal": <numeric subtotal before tax>,
  "cgst": <numeric CGST amount>,
  "sgst": <numeric SGST amount>,
  "totalAmount": <numeric grand total>,
  "currency": "INR",
  "lineItems": [
    {
      "description": "<item description>",
      "hsnSac": "<HSN/SAC code if present>",
      "quantity": <numeric quantity>,
      "unitPrice": <numeric unit price>,
      "amount": <numeric line total>
    }
  ],
  "confidence": <number 0-100 representing your confidence in the extraction accuracy>
}`;

  // 4. Call Bedrock Converse API
  log.info('Invoking Bedrock Converse API for document extraction', { modelId: BEDROCK_MODEL_ID });

  const converseResponse = await bedrockClient.send(
    new ConverseCommand({
      modelId: BEDROCK_MODEL_ID,
      messages: [
        {
          role: 'user',
          content: [
            documentContent,
            { text: extractionPrompt },
          ],
        },
      ],
      inferenceConfig: {
        maxTokens: 4096,
        temperature: 0.0,
      },
    })
  );

  // 5. Parse the response
  const outputContent = converseResponse.output?.message?.content;
  if (!outputContent || outputContent.length === 0) {
    throw new Error('Empty response from Bedrock Converse API');
  }

  const responseText = outputContent
    .filter((block: any) => block.text)
    .map((block: any) => block.text)
    .join('');

  log.info('Bedrock extraction response received', {
    responseLength: responseText.length,
    responsePreview: responseText.substring(0, 200),
  });

  // 6. Parse JSON from response
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON object found in Bedrock response');
    }

    const parsed = JSON.parse(jsonMatch[0]) as BedrockExtractedInvoice;

    log.info('Bedrock extraction parsed successfully', {
      vendorName: parsed.vendorName,
      totalAmount: parsed.totalAmount,
      gstin: parsed.gstin || '(not found)',
      lineItemsCount: parsed.lineItems?.length || 0,
      confidence: parsed.confidence,
    });

    return parsed;
  } catch (parseError) {
    log.error('Failed to parse Bedrock extraction response', {
      error: String(parseError),
      responseText: responseText.substring(0, 500),
    });
    throw new Error(`Failed to parse Bedrock extraction: ${parseError}`);
  }
}

// ---------------------------------------------------------------------------
// Build TextractExtractionResult from Bedrock extracted data
// ---------------------------------------------------------------------------

function buildExtractionResultFromBedrock(
  bedrockResult: BedrockExtractedInvoice,
  invoiceId: string,
  s3RawKey: string
): TextractExtractionResult {
  const confidence = bedrockResult.confidence || 85;

  // Build extracted fields array for audit/display
  const extractedFields: ExtractedField[] = [];
  const fieldMap: Record<string, string> = {
    vendorName: bedrockResult.vendorName || '',
    vendorAddress: bedrockResult.vendorAddress || '',
    gstin: bedrockResult.gstin || '',
    invoiceNumber: bedrockResult.invoiceNumber || '',
    invoiceDate: bedrockResult.invoiceDate || '',
    dueDate: bedrockResult.dueDate || '',
    poNumber: bedrockResult.poNumber || '',
    subtotal: String(bedrockResult.subtotal || 0),
    totalAmount: String(bedrockResult.totalAmount || 0),
  };

  for (const [fieldName, value] of Object.entries(fieldMap)) {
    extractedFields.push({
      fieldName,
      extractedValue: value,
      confidence,
      validationStatus: 'PENDING',
    });
  }

  // Build line items
  const lineItems: LineItem[] = (bedrockResult.lineItems || []).map((item) => ({
    description: item.description || '',
    hsnSac: item.hsnSac || '',
    quantity: item.quantity || 1,
    unitPrice: item.unitPrice || 0,
    amount: item.amount || 0,
  }));

  // Calculate tax split if not provided
  const subtotal = bedrockResult.subtotal || 0;
  const totalAmount = bedrockResult.totalAmount || 0;
  let cgst = bedrockResult.cgst || 0;
  let sgst = bedrockResult.sgst || 0;

  // If cgst/sgst are both 0 but total > subtotal, derive tax
  if (cgst === 0 && sgst === 0 && totalAmount > subtotal && subtotal > 0) {
    const totalTax = totalAmount - subtotal;
    cgst = Math.round((totalTax / 2) * 100) / 100;
    sgst = Math.round((totalTax / 2) * 100) / 100;
  }

  return {
    invoiceId,
    s3RawKey,
    extractedFields,
    lineItems,
    vendorName: bedrockResult.vendorName || '',
    vendorAddress: bedrockResult.vendorAddress || undefined,
    gstin: bedrockResult.gstin || '',
    invoiceDate: bedrockResult.invoiceDate || '',
    dueDate: bedrockResult.dueDate || undefined,
    poNumber: bedrockResult.poNumber || undefined,
    invoiceNumber: bedrockResult.invoiceNumber || '',
    subtotal,
    cgst,
    sgst,
    totalAmount: totalAmount || subtotal + cgst + sgst,
    currency: bedrockResult.currency || 'INR',
    overallConfidence: confidence,
  };
}

