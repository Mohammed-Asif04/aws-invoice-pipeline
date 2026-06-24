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
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
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

const AUDIT_BUCKET = process.env.AUDIT_BUCKET || 'invoice-pipeline-audit';

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
    // Fetch the document from S3
    const s3Response = await s3Client.send(
      new GetObjectCommand({ Bucket: s3Bucket, Key: s3Key })
    );

    const documentBytes = await s3Response.Body?.transformToByteArray();
    if (!documentBytes) {
      throw new Error('Failed to read document from S3');
    }

    // Call Textract AnalyzeExpense
    const textractResponse = await textractClient.send(
      new AnalyzeExpenseCommand({
        Document: {
          Bytes: documentBytes,
        },
      })
    );

    endTimer();

    // Parse the Textract response
    const extraction = parseTextractResponse(
      invoiceId,
      s3Key,
      textractResponse.ExpenseDocuments || []
    );

    log.info('Textract extraction complete', {
      fieldsExtracted: extraction.extractedFields.length,
      lineItemsExtracted: extraction.lineItems.length,
      overallConfidence: extraction.overallConfidence,
    });

    // Store raw Textract response in audit bucket
    const textractJsonKey = `textract/${invoiceId}/raw-response.json`;
    await s3Client.send(
      new PutObjectCommand({
        Bucket: AUDIT_BUCKET,
        Key: textractJsonKey,
        Body: JSON.stringify(textractResponse, null, 2),
        ContentType: 'application/json',
      })
    );

    // Update DynamoDB with extracted data
    await updateInvoice(invoiceId, event.extraction?.invoiceId ? extraction.vendorName : 'PENDING', {
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
    });

    // Write audit entry
    const auditEntry: AuditEntry = {
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
    };
    await putAuditEntry(auditEntry);

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
        extracted[mappedName] = fieldValue;

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
    vendorName: extracted.vendorName || '',
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
