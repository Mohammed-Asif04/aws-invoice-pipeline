import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockClient } from 'aws-sdk-client-mock';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { TextractClient, AnalyzeExpenseCommand } from '@aws-sdk/client-textract';
import { DynamoDBDocumentClient, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

// Set environment variables before importing the handler
process.env.AWS_REGION = 'ap-south-1';
process.env.INVOICE_TABLE = 'InvoiceRecords';
process.env.AUDIT_TABLE = 'AuditEntries';
process.env.AUDIT_BUCKET = 'invoice-pipeline-audit';

// Import the handler
import { handler } from '../../backend/lambdas/textract-processor/handler';
import mockTextractResponse from '../fixtures/mock-textract-response.json';

const s3Mock = mockClient(S3Client);
const textractMock = mockClient(TextractClient);
const ddbMock = mockClient(DynamoDBDocumentClient);

describe('Textract Processor Lambda', () => {
  beforeEach(() => {
    s3Mock.reset();
    textractMock.reset();
    ddbMock.reset();
  });

  it('successfully extracts data from a document in S3 and updates DynamoDB', async () => {
    // 1. Mock S3 GetObject to return a dummy file payload
    const mockS3Stream = {
      transformToByteArray: async () => new Uint8Array([1, 2, 3, 4]),
    };
    s3Mock.on(GetObjectCommand).resolves({
      Body: mockS3Stream as any,
    });

    // 2. Mock Textract AnalyzeExpense API
    textractMock.on(AnalyzeExpenseCommand).resolves(mockTextractResponse as any);

    // 3. Mock S3 PutObject (raw Textract JSON storage)
    s3Mock.on(PutObjectCommand).resolves({});

    // 4. Mock DynamoDB update/put commands
    ddbMock.on(UpdateCommand).resolves({});
    ddbMock.on(PutCommand).resolves({});

    const event = {
      invoiceId: 'inv_101',
      s3Bucket: 'invoice-pipeline-raw-bucket',
      s3Key: 'invoices/sample.pdf',
      retryCount: 0,
      source: 'upload',
      status: 'IN_PROGRESS' as const,
    };

    const result = await handler(event);

    // Assert S3 was read
    expect(s3Mock.calls()[0].args[0].input).toEqual({
      Bucket: 'invoice-pipeline-raw-bucket',
      Key: 'invoices/sample.pdf',
    });

    // Assert S3 was written with raw output
    const putObjectCalls = s3Mock.calls().filter(c => c.args[0] instanceof PutObjectCommand);
    expect(putObjectCalls.length).toBe(1);
    expect(putObjectCalls[0].args[0].input.Bucket).toBe('invoice-pipeline-audit');
    expect(putObjectCalls[0].args[0].input.Key).toBe('textract/inv_101/raw-response.json');

    // Assert Textract AnalyzeExpense was invoked
    expect(textractMock.calls().length).toBe(1);

    // Assert DynamoDB was updated with extracted results
    const updateCalls = ddbMock.calls().filter(c => c.args[0] instanceof UpdateCommand);
    expect(updateCalls.length).toBe(1);
    const ddbUpdatePayload = updateCalls[0].args[0].input;
    expect(ddbUpdatePayload.TableName).toBe('InvoiceRecords');
    expect(ddbUpdatePayload.Key).toEqual({ invoiceId: 'inv_101', vendorId: 'PENDING' });

    // Assert output state contains extraction values
    expect(result.extraction).toBeDefined();
    expect(result.extraction?.vendorName).toBe('ACME Corp');
    expect(result.extraction?.invoiceNumber).toBe('INV-12345');
    expect(result.extraction?.totalAmount).toBe(1180);
    expect(result.extraction?.overallConfidence).toBeGreaterThan(90);
  });

  it('fails gracefully, records failure audit entry and throws error if S3 fails', async () => {
    // Mock S3 failure
    s3Mock.on(GetObjectCommand).rejects(new Error('S3 Access Denied'));
    ddbMock.on(PutCommand).resolves({});

    const event = {
      invoiceId: 'inv_102',
      s3Bucket: 'invoice-pipeline-raw-bucket',
      s3Key: 'invoices/missing.pdf',
      retryCount: 0,
      source: 'upload',
      status: 'IN_PROGRESS' as const,
    };

    await expect(handler(event)).rejects.toThrow('S3 Access Denied');

    // Verify audit entry for error was created
    const putCalls = ddbMock.calls().filter(c => c.args[0] instanceof PutCommand);
    expect(putCalls.length).toBe(1);
    expect(putCalls[0].args[0].input.TableName).toBe('AuditEntries');
    expect(putCalls[0].args[0].input.Item.eventType).toBe('ERROR');
    expect(putCalls[0].args[0].input.Item.invoiceId).toBe('inv_102');
  });
});
