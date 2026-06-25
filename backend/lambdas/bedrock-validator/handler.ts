// ============================================================================
// Lambda: Bedrock Validator
// Invoked by Step Functions → validates Textract extraction with Claude
// Detects anomalies: duplicates, amount mismatches, missing GSTIN, etc.
// ============================================================================

import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';
import { createLogger } from '../shared/logger';
import {
  updateInvoice,
  putAuditEntry,
  findDuplicateInvoice,
} from '../shared/dynamodb';
import type {
  PipelineState,
  BedrockValidationResult,
  Anomaly,
  ExtractedField,
  AuditEntry,
  InvoiceStatus,
  TextractExtractionResult,
} from '../shared/types';
import { v4 as uuidv4 } from 'uuid';

const logger = createLogger('bedrock-validator');

const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'ap-south-1',
});

const BEDROCK_MODEL_ID =
  process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-haiku-20240307-v1:0';
const CONFIDENCE_THRESHOLD = parseFloat(
  process.env.CONFIDENCE_THRESHOLD || '85'
);

// ---------------------------------------------------------------------------
// Handler — invoked by Step Functions after Textract extraction
// ---------------------------------------------------------------------------

export async function handler(event: PipelineState): Promise<PipelineState> {
  const { invoiceId, extraction } = event;
  const log = logger.child({ invoiceId });

  if (!extraction) {
    throw new Error('No extraction data provided — Textract step may have failed');
  }

  log.info('Starting Bedrock validation', {
    fieldsCount: extraction.extractedFields.length,
    lineItemsCount: extraction.lineItems.length,
  });

  try {
    const anomalies: Anomaly[] = [];

    // --- Rule 1: Check for duplicate invoices ---
    const duplicateCheck = await checkDuplicateInvoice(
      extraction.invoiceNumber,
      extraction.vendorName,
      invoiceId
    );
    if (duplicateCheck) {
      anomalies.push(duplicateCheck);
    }

    // --- Rule 2: Check for missing GSTIN ---
    if (!extraction.gstin || extraction.gstin.trim() === '') {
      anomalies.push({
        type: 'MISSING_GSTIN',
        description:
          'GSTIN field is empty or not detected in the invoice. Indian tax compliance requires a valid 15-character GSTIN.',
        severity: 'HIGH',
      });
    } else if (
      !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}Z[A-Z0-9]{1}$/.test(
        extraction.gstin
      )
    ) {
      anomalies.push({
        type: 'MISSING_GSTIN',
        description: `Extracted GSTIN "${extraction.gstin}" does not match the valid 15-character format.`,
        severity: 'MEDIUM',
        suggestedValue: 'Verify GSTIN manually',
      });
    }

    // --- Rule 3: Amount mismatch (line items vs total) ---
    const amountMismatch = checkAmountMismatch(extraction);
    if (amountMismatch) {
      anomalies.push(amountMismatch);
    }

    // --- Rule 4: Low confidence score ---
    if (extraction.overallConfidence < CONFIDENCE_THRESHOLD) {
      anomalies.push({
        type: 'LOW_CONFIDENCE_SCORE',
        description: `Overall extraction confidence (${extraction.overallConfidence}%) is below the threshold (${CONFIDENCE_THRESHOLD}%). Manual review recommended.`,
        severity: extraction.overallConfidence < 60 ? 'HIGH' : 'MEDIUM',
      });
    }

    // --- Rule 5: Call Bedrock Claude for deeper validation ---
    const bedrockValidation = await invokeBedrockValidation(
      extraction,
      anomalies
    );

    // Merge Bedrock's detected anomalies with our rule-based ones
    const allAnomalies = [...anomalies, ...bedrockValidation.additionalAnomalies];

    // Update extracted fields with validation status
    const validatedFields = updateFieldValidationStatus(
      extraction.extractedFields,
      bedrockValidation.fieldValidations
    );

    // Determine final status
    const status = determineStatus(allAnomalies);

    log.info('Bedrock validation complete', {
      anomaliesCount: allAnomalies.length,
      status,
      bedrockConfidence: bedrockValidation.confidence,
    });

    // Build validation result
    const validationResult: BedrockValidationResult = {
      invoiceId,
      status,
      overallConfidence: Math.min(
        extraction.overallConfidence,
        bedrockValidation.confidence
      ),
      anomalies: allAnomalies,
      validatedFields,
      validationSummary: bedrockValidation.summary,
      isDuplicate: anomalies.some((a) => a.type === 'DUPLICATE_INVOICE'),
      duplicateInvoiceId: duplicateCheck
        ? (duplicateCheck as any).duplicateInvoiceId
        : undefined,
    };

    // Write DynamoDB update + audit entry in parallel for speed
    const auditEntry: AuditEntry = {
      auditId: uuidv4(),
      invoiceId,
      event: 'AI validation completed',
      eventType: 'VALIDATION',
      timestamp: new Date().toISOString(),
      user: 'system',
      details: `Bedrock validation: ${status}. ${allAnomalies.length} anomalies detected. Confidence: ${validationResult.overallConfidence}%`,
      metadata: {
        status,
        anomaliesCount: String(allAnomalies.length),
        anomalyTypes: allAnomalies.map((a) => a.type).join(', '),
        confidence: String(validationResult.overallConfidence),
      },
    };

    await Promise.all([
      updateInvoice(invoiceId, 'PENDING', {
        status,
        anomalies: allAnomalies,
        extractedFields: validatedFields,
        extractionConfidence: validationResult.overallConfidence,
      }),
      putAuditEntry(auditEntry),
    ]);

    return {
      ...event,
      validation: validationResult,
    };
  } catch (error) {
    log.error('Bedrock validation failed', error);

    await putAuditEntry({
      auditId: uuidv4(),
      invoiceId,
      event: 'AI validation failed',
      eventType: 'ERROR',
      timestamp: new Date().toISOString(),
      user: 'system',
      details: error instanceof Error ? error.message : 'Unknown validation error',
    });

    throw error;
  }
}

// ---------------------------------------------------------------------------
// Duplicate Invoice Check (DynamoDB query)
// ---------------------------------------------------------------------------

async function checkDuplicateInvoice(
  invoiceNumber: string,
  vendorName: string,
  currentInvoiceId: string
): Promise<Anomaly | null> {
  if (!invoiceNumber) return null;

  const existing = await findDuplicateInvoice(invoiceNumber, vendorName);

  if (existing && existing.invoiceId !== currentInvoiceId) {
    return {
      type: 'DUPLICATE_INVOICE',
      description: `Invoice number "${invoiceNumber}" from vendor "${vendorName}" already exists as ${existing.invoiceId} (received ${existing.receivedOn}).`,
      severity: 'HIGH',
      suggestedValue: existing.invoiceId,
    };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Amount Mismatch Check
// ---------------------------------------------------------------------------

function checkAmountMismatch(
  extraction: TextractExtractionResult
): Anomaly | null {
  if (extraction.lineItems.length === 0) return null;

  const lineItemsTotal = extraction.lineItems.reduce(
    (sum, item) => sum + item.amount,
    0
  );
  const roundedLineTotal = Math.round(lineItemsTotal * 100) / 100;
  const expectedTotal = extraction.subtotal || extraction.totalAmount;

  // Allow 1% tolerance for rounding differences
  const tolerance = expectedTotal * 0.01;
  const difference = Math.abs(roundedLineTotal - expectedTotal);

  if (difference > tolerance && difference > 1) {
    return {
      type: 'AMOUNT_MISMATCH',
      description: `Sum of line items (₹${roundedLineTotal.toLocaleString('en-IN')}) does not match the stated ${extraction.subtotal ? 'subtotal' : 'total'} (₹${expectedTotal.toLocaleString('en-IN')}). Difference: ₹${difference.toFixed(2)}.`,
      severity: difference > expectedTotal * 0.05 ? 'HIGH' : 'MEDIUM',
      suggestedValue: `₹${roundedLineTotal.toLocaleString('en-IN')}`,
    };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Bedrock Claude Validation
// ---------------------------------------------------------------------------

interface BedrockValidationResponse {
  confidence: number;
  summary: string;
  additionalAnomalies: Anomaly[];
  fieldValidations: Record<string, 'MATCHED' | 'MISMATCH' | 'NOT_FOUND'>;
}

async function invokeBedrockValidation(
  extraction: TextractExtractionResult,
  existingAnomalies: Anomaly[]
): Promise<BedrockValidationResponse> {
  const endTimer = logger.startTimer('Bedrock Claude invocation');

  const prompt = buildValidationPrompt(extraction, existingAnomalies);

  try {
    const response = await bedrockClient.send(
      new InvokeModelCommand({
        modelId: BEDROCK_MODEL_ID,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: 1024,
          temperature: 0.0, // Zero temperature for deterministic, fast validation
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      })
    );

    endTimer();

    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const content = responseBody.content?.[0]?.text || '';

    // Parse the structured JSON response from Claude
    return parseBedrockResponse(content);
  } catch (error) {
    logger.error('Bedrock invocation failed, falling back to rule-based only', error);

    // Graceful degradation — return empty if Bedrock fails
    return {
      confidence: extraction.overallConfidence,
      summary: 'Bedrock validation unavailable — rule-based validation only.',
      additionalAnomalies: [],
      fieldValidations: {},
    };
  }
}

// ---------------------------------------------------------------------------
// Build the validation prompt for Claude
// ---------------------------------------------------------------------------

function buildValidationPrompt(
  extraction: TextractExtractionResult,
  existingAnomalies: Anomaly[]
): string {
  return `You are an invoice validation expert. Analyze the following extracted invoice data and validate it for accuracy, completeness, and potential issues.

## Extracted Invoice Data

**Vendor**: ${extraction.vendorName || 'NOT FOUND'}
**Vendor Address**: ${extraction.vendorAddress || 'NOT FOUND'}
**GSTIN**: ${extraction.gstin || 'NOT FOUND'}
**Invoice Number**: ${extraction.invoiceNumber || 'NOT FOUND'}
**Invoice Date**: ${extraction.invoiceDate || 'NOT FOUND'}
**Due Date**: ${extraction.dueDate || 'NOT FOUND'}
**PO Number**: ${extraction.poNumber || 'NOT FOUND'}

**Financial Summary**:
- Subtotal: ₹${extraction.subtotal}
- CGST: ₹${extraction.cgst}
- SGST: ₹${extraction.sgst}
- Total: ₹${extraction.totalAmount}

**Line Items** (${extraction.lineItems.length} items):
${extraction.lineItems
  .map(
    (item, i) =>
      `${i + 1}. ${item.description} | HSN: ${item.hsnSac} | Qty: ${item.quantity} | Unit Price: ₹${item.unitPrice} | Amount: ₹${item.amount}`
  )
  .join('\n')}

**Extraction Confidence**: ${extraction.overallConfidence}%

**Already Detected Anomalies**:
${existingAnomalies.length > 0
  ? existingAnomalies.map((a) => `- ${a.type}: ${a.description}`).join('\n')
  : 'None'}

## Your Task

1. Validate field completeness (are required fields present and reasonable?)
2. Check if vendor name looks like a legitimate business entity
3. Verify mathematical consistency (line items × quantity = amount, sum = subtotal, subtotal + taxes = total)
4. Check date formatting and reasonableness
5. Identify any additional concerns not already flagged

## Response Format (JSON only)

Respond with ONLY a JSON object (no markdown, no explanation):

{
  "confidence": <number 0-100>,
  "summary": "<one paragraph validation summary>",
  "additionalAnomalies": [
    {
      "type": "VENDOR_NOT_FOUND" | "AMOUNT_MISMATCH" | "MISSING_GSTIN" | "LOW_CONFIDENCE_SCORE" | "DUPLICATE_INVOICE",
      "description": "<detailed description>",
      "severity": "HIGH" | "MEDIUM" | "LOW"
    }
  ],
  "fieldValidations": {
    "<fieldName>": "MATCHED" | "MISMATCH" | "NOT_FOUND"
  }
}`;
}

// ---------------------------------------------------------------------------
// Parse Claude's response
// ---------------------------------------------------------------------------

function parseBedrockResponse(content: string): BedrockValidationResponse {
  try {
    // Try to extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in Bedrock response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      confidence: parsed.confidence || 0,
      summary: parsed.summary || '',
      additionalAnomalies: (parsed.additionalAnomalies || []).map(
        (a: any) => ({
          type: a.type || 'LOW_CONFIDENCE_SCORE',
          description: a.description || '',
          severity: a.severity || 'MEDIUM',
          suggestedValue: a.suggestedValue,
        })
      ),
      fieldValidations: parsed.fieldValidations || {},
    };
  } catch (error) {
    logger.warn('Failed to parse Bedrock response, using defaults', {
      error: String(error),
      contentPreview: content.substring(0, 200),
    });

    return {
      confidence: 0,
      summary: 'Unable to parse validation response.',
      additionalAnomalies: [],
      fieldValidations: {},
    };
  }
}

// ---------------------------------------------------------------------------
// Update field validation statuses
// ---------------------------------------------------------------------------

function updateFieldValidationStatus(
  fields: ExtractedField[],
  validations: Record<string, 'MATCHED' | 'MISMATCH' | 'NOT_FOUND'>
): ExtractedField[] {
  return fields.map((field) => ({
    ...field,
    validationStatus: validations[field.fieldName] || field.validationStatus,
  }));
}

// ---------------------------------------------------------------------------
// Determine invoice status based on anomalies
// ---------------------------------------------------------------------------

function determineStatus(anomalies: Anomaly[]): InvoiceStatus {
  if (anomalies.length === 0) {
    return 'PROCESSED';
  }

  const hasHighSeverity = anomalies.some((a) => a.severity === 'HIGH');

  if (hasHighSeverity) {
    return 'EXCEPTION';
  }

  return 'IN_REVIEW';
}
