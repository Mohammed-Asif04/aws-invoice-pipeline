import { describe, it, expect, beforeEach } from 'vitest';
import { mockClient } from 'aws-sdk-client-mock';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { TextractClient, AnalyzeExpenseCommand } from '@aws-sdk/client-textract';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { DynamoDBDocumentClient, PutCommand, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

// Set environment variables before importing handlers
process.env.AWS_REGION = 'ap-south-1';
process.env.INVOICE_TABLE = 'InvoiceRecords';
process.env.AUDIT_TABLE = 'AuditEntries';
process.env.AUDIT_BUCKET = 'invoice-pipeline-audit';

// Import handlers
import { handler as textractHandler } from '../../backend/lambdas/textract-processor/handler';
import { handler as bedrockHandler } from '../../backend/lambdas/bedrock-validator/handler';
import mockTextractResponse from '../fixtures/mock-textract-response.json';

const s3Mock = mockClient(S3Client);
const textractMock = mockClient(TextractClient);
const bedrockMock = mockClient(BedrockRuntimeClient);
const ddbMock = mockClient(DynamoDBDocumentClient);

describe('Invoice Processing Pipeline Integration', () => {
  beforeEach(() => {
    s3Mock.reset();
    textractMock.reset();
    bedrockMock.reset();
    ddbMock.reset();
  });

  it('runs the end-to-end local data pipeline flow successfully', async () => {
    // === Setup Mocks for Stage 1: Textract Processor ===
    textractMock.on(AnalyzeExpenseCommand).resolves(mockTextractResponse as any);
    s3Mock.on(PutObjectCommand).resolves({});
    ddbMock.on(UpdateCommand).resolves({});
    ddbMock.on(PutCommand).resolves({});

    // === Setup Mocks for Stage 2: Bedrock Validator ===
    ddbMock.on(QueryCommand).resolves({ Items: [] }); // No duplicates

    const mockClaudeResponse = {
      confidence: 95,
      summary: 'Invoice matches perfectly with standard patterns.',
      additionalAnomalies: [],
      fieldValidations: {
        vendorName: 'MATCHED',
        invoiceNumber: 'MATCHED',
        totalAmount: 'MATCHED',
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

    // === Execution ===
    const initialState = {
      invoiceId: 'inv-integration-99',
      s3Bucket: 'raw-invoices',
      s3Key: 'invoices/invoice-99.pdf',
      retryCount: 0,
      source: 'upload',
      status: 'IN_PROGRESS' as const,
    };

    // 1. Execute Textract Processor
    const stateAfterTextract = await textractHandler(initialState);
    expect(stateAfterTextract.extraction).toBeDefined();
    expect(stateAfterTextract.extraction?.vendorName).toBe('ACME Corp');

    // 2. Execute Bedrock Validator
    const finalState = await bedrockHandler(stateAfterTextract);

    // === Assertions ===
    // Check that bedrock validation completed and returned PROCESSED status
    expect(finalState.validation).toBeDefined();
    expect(finalState.validation?.status).toBe('PROCESSED');
    expect(finalState.validation?.overallConfidence).toBe(95); // Minimum of extraction (98.3) and bedrock (95)
    expect(finalState.validation?.anomalies.length).toBe(0);

    // Verify S3, Textract, Bedrock, and DynamoDB SDK interactions
    expect(s3Mock.calls().length).toBe(1); // 1 putObject (audit raw response)
    expect(textractMock.calls().length).toBe(1);
    expect(bedrockMock.calls().length).toBe(1);

    // 2 updates from textractHandler and bedrockHandler
    const updateCalls = ddbMock.calls().filter(c => c.args[0] instanceof UpdateCommand);
    expect(updateCalls.length).toBe(2);
  });
});
