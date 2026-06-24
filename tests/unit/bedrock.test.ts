import { describe, it, expect, beforeEach } from 'vitest';
import { mockClient } from 'aws-sdk-client-mock';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { DynamoDBDocumentClient, PutCommand, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

// Set environment variables before importing the handler
process.env.AWS_REGION = 'ap-south-1';
process.env.INVOICE_TABLE = 'InvoiceRecords';
process.env.AUDIT_TABLE = 'AuditEntries';

// Import the handler
import { handler } from '../../backend/lambdas/bedrock-validator/handler';

const bedrockMock = mockClient(BedrockRuntimeClient);
const ddbMock = mockClient(DynamoDBDocumentClient);

describe('Bedrock Validator Lambda', () => {
  beforeEach(() => {
    bedrockMock.reset();
    ddbMock.reset();
  });

  it('successfully validates an invoice without anomalies', async () => {
    // 1. Mock DynamoDB query for duplicates (no duplicate found)
    ddbMock.on(QueryCommand).resolves({ Items: [] });

    // 2. Mock Bedrock InvokeModelCommand for Claude
    const mockClaudeResponse = {
      confidence: 98,
      summary: 'Invoice contains all required Indian tax fields and is mathematically correct.',
      additionalAnomalies: [],
      fieldValidations: {
        vendorName: 'MATCHED',
        invoiceNumber: 'MATCHED',
        totalAmount: 'MATCHED',
        gstin: 'MATCHED',
      },
    };

    const encoder = new TextEncoder();
    bedrockMock.on(InvokeModelCommand).resolves({
      body: encoder.encode(
        JSON.stringify({
          content: [
            {
              text: JSON.stringify(mockClaudeResponse),
            },
          ],
        })
      ),
    });

    // 3. Mock DynamoDB update/put commands
    ddbMock.on(UpdateCommand).resolves({});
    ddbMock.on(PutCommand).resolves({});

    const event = {
      invoiceId: 'inv_abc',
      s3Bucket: 'invoice-pipeline-raw-bucket',
      s3Key: 'invoices/sample.pdf',
      retryCount: 0,
      source: 'upload',
      status: 'IN_PROGRESS' as const,
      extraction: {
        invoiceId: 'inv_abc',
        s3RawKey: 'invoices/sample.pdf',
        vendorName: 'Acme Software Solutions Ltd',
        vendorAddress: '101, Tech Park, Pune',
        gstin: '27AAAAA1111A1Z1', // Valid GSTIN format
        invoiceNumber: 'INV-2026-001',
        invoiceDate: '2026-06-20',
        dueDate: '2026-07-20',
        poNumber: 'PO-9988',
        subtotal: 1000,
        cgst: 90,
        sgst: 90,
        totalAmount: 1180,
        currency: 'INR',
        overallConfidence: 94,
        extractedFields: [
          { fieldName: 'vendorName', value: 'Acme Software Solutions Ltd', confidence: 95 },
          { fieldName: 'invoiceNumber', value: 'INV-2026-001', confidence: 92 },
          { fieldName: 'totalAmount', value: '1180', confidence: 96 },
          { fieldName: 'gstin', value: '27AAAAA1111A1Z1', confidence: 93 },
        ],
        lineItems: [
          { description: 'Cloud Consulting', quantity: 10, unitPrice: 100, amount: 1000, hsnSac: '998311' }
        ],
      },
    };

    const result = await handler(event);

    // Verify Bedrock was invoked
    expect(bedrockMock.calls().length).toBe(1);

    // Verify status is PROCESSED since there are no anomalies
    expect(result.validation).toBeDefined();
    expect(result.validation?.status).toBe('PROCESSED');
    expect(result.validation?.overallConfidence).toBe(94); // Minimum of extraction (94) and bedrock (98)
    expect(result.validation?.anomalies.length).toBe(0);

    // Verify DynamoDB record was updated with status and anomalies
    const updateCalls = ddbMock.calls().filter(c => c.args[0] instanceof UpdateCommand);
    expect(updateCalls.length).toBe(1);
    expect(updateCalls[0].args[0].input.TableName).toBe('InvoiceRecords');
    expect(updateCalls[0].args[0].input.Key).toEqual({ invoiceId: 'inv_abc', vendorId: 'PENDING' });
  });

  it('flags EXCEPTION when a duplicate invoice is found in DynamoDB', async () => {
    // 1. Mock DynamoDB query to return an existing invoice (duplicate)
    ddbMock.on(QueryCommand).resolves({
      Items: [
        {
          invoiceId: 'inv_original_999',
          vendorId: 'Acme Software Solutions Ltd',
          invoiceNumber: 'INV-2026-001',
          receivedOn: '2026-06-15',
        },
      ],
    });

    // 2. Mock Bedrock InvokeModelCommand for Claude
    const mockClaudeResponse = {
      confidence: 80,
      summary: 'Invoice duplicate identified via reference lookup.',
      additionalAnomalies: [],
      fieldValidations: {
        vendorName: 'MATCHED',
        invoiceNumber: 'MATCHED',
        totalAmount: 'MATCHED',
        gstin: 'MATCHED',
      },
    };

    const encoder = new TextEncoder();
    bedrockMock.on(InvokeModelCommand).resolves({
      body: encoder.encode(
        JSON.stringify({
          content: [
            {
              text: JSON.stringify(mockClaudeResponse),
            },
          ],
        })
      ),
    });

    ddbMock.on(UpdateCommand).resolves({});
    ddbMock.on(PutCommand).resolves({});

    const event = {
      invoiceId: 'inv_duplicate_123',
      s3Bucket: 'invoice-pipeline-raw-bucket',
      s3Key: 'invoices/sample.pdf',
      retryCount: 0,
      source: 'upload',
      status: 'IN_PROGRESS' as const,
      extraction: {
        invoiceId: 'inv_duplicate_123',
        s3RawKey: 'invoices/sample.pdf',
        vendorName: 'Acme Software Solutions Ltd',
        vendorAddress: '101, Tech Park, Pune',
        gstin: '27AAAAA1111A1Z1',
        invoiceNumber: 'INV-2026-001',
        invoiceDate: '2026-06-20',
        dueDate: '2026-07-20',
        poNumber: 'PO-9988',
        subtotal: 1000,
        cgst: 90,
        sgst: 90,
        totalAmount: 1180,
        currency: 'INR',
        overallConfidence: 94,
        extractedFields: [
          { fieldName: 'vendorName', value: 'Acme Software Solutions Ltd', confidence: 95 },
          { fieldName: 'invoiceNumber', value: 'INV-2026-001', confidence: 92 },
          { fieldName: 'totalAmount', value: '1180', confidence: 96 },
          { fieldName: 'gstin', value: '27AAAAA1111A1Z1', confidence: 93 },
        ],
        lineItems: [
          { description: 'Cloud Consulting', quantity: 10, unitPrice: 100, amount: 1000, hsnSac: '998311' }
        ],
      },
    };

    const result = await handler(event);

    expect(result.validation?.status).toBe('EXCEPTION');
    const duplicateAnomaly = result.validation?.anomalies.find(a => a.type === 'DUPLICATE_INVOICE');
    expect(duplicateAnomaly).toBeDefined();
    expect(duplicateAnomaly?.severity).toBe('HIGH');
    expect(result.validation?.isDuplicate).toBe(true);
  });
});
