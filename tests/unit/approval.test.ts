import { describe, it, expect, beforeEach } from 'vitest';
import { mockClient } from 'aws-sdk-client-mock';
import { SFNClient, SendTaskSuccessCommand, SendTaskFailureCommand } from '@aws-sdk/client-sfn';
import { DynamoDBDocumentClient, UpdateCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

// Set environment variables before importing the handler
process.env.AWS_REGION = 'ap-south-1';
process.env.INVOICE_TABLE = 'InvoiceRecords';
process.env.AUDIT_TABLE = 'AuditEntries';

// Import the handler
import { handler } from '../../backend/lambdas/approval-handler/handler';

const sfnMock = mockClient(SFNClient);
const ddbMock = mockClient(DynamoDBDocumentClient);

describe('Approval Handler Lambda', () => {
  beforeEach(() => {
    sfnMock.reset();
    ddbMock.reset();
  });

  it('handles GET /approve callback successfully', async () => {
    // 1. Mock SFN SendTaskSuccessCommand
    sfnMock.on(SendTaskSuccessCommand).resolves({});

    // 2. Mock DynamoDB UpdateCommand and PutCommand
    ddbMock.on(UpdateCommand).resolves({});
    ddbMock.on(PutCommand).resolves({});

    const event = {
      httpMethod: 'GET',
      path: '/approve',
      resource: '/approve',
      queryStringParameters: {
        token: 'taskToken-12345',
        invoiceId: 'inv-100',
      },
      headers: {},
      body: null,
      isBase64Encoded: false,
    };

    const response = await handler(event);

    // Assert SFN SendTaskSuccessCommand was called with the correct task token
    expect(sfnMock.calls().length).toBe(1);
    expect(sfnMock.calls()[0].args[0].input).toEqual({
      taskToken: 'taskToken-12345',
      output: expect.any(String),
    });

    // Assert DynamoDB update invoice status was called
    const updateCalls = ddbMock.calls().filter(c => c.args[0] instanceof UpdateCommand);
    expect(updateCalls.length).toBe(1);
    expect(updateCalls[0].args[0].input.TableName).toBe('InvoiceRecords');
    expect(updateCalls[0].args[0].input.Key).toEqual({ invoiceId: 'inv-100', vendorId: 'PENDING' });

    // Assert audit entry was recorded
    const putCalls = ddbMock.calls().filter(c => c.args[0] instanceof PutCommand);
    expect(putCalls.length).toBe(1);
    expect(putCalls[0].args[0].input.TableName).toBe('AuditEntries');
    expect(putCalls[0].args[0].input.Item.eventType).toBe('APPROVAL');

    // Assert HTTP status code and HTML response body
    expect(response.statusCode).toBe(200);
    expect(response.headers?.['Content-Type']).toBe('text/html');
    expect(response.body).toContain('Invoice Approved');
  });

  it('handles GET /reject callback successfully', async () => {
    // 1. Mock SFN SendTaskFailureCommand
    sfnMock.on(SendTaskFailureCommand).resolves({});

    // 2. Mock DynamoDB UpdateCommand and PutCommand
    ddbMock.on(UpdateCommand).resolves({});
    ddbMock.on(PutCommand).resolves({});

    const event = {
      httpMethod: 'GET',
      path: '/reject',
      resource: '/reject',
      queryStringParameters: {
        token: 'taskToken-54321',
        invoiceId: 'inv-100',
      },
      headers: {},
      body: null,
      isBase64Encoded: false,
    };

    const response = await handler(event);

    // Assert SFN SendTaskFailureCommand was called
    expect(sfnMock.calls().length).toBe(1);
    expect(sfnMock.calls()[0].args[0].input).toEqual({
      taskToken: 'taskToken-54321',
      error: 'REJECTED',
      cause: 'Invoice rejected via email by reviewer',
    });

    // Assert DynamoDB update invoice status was called
    const updateCalls = ddbMock.calls().filter(c => c.args[0] instanceof UpdateCommand);
    expect(updateCalls.length).toBe(1);
    expect(updateCalls[0].args[0].input.TableName).toBe('InvoiceRecords');

    // Assert audit entry was recorded
    const putCalls = ddbMock.calls().filter(c => c.args[0] instanceof PutCommand);
    expect(putCalls.length).toBe(1);
    expect(putCalls[0].args[0].input.TableName).toBe('AuditEntries');
    expect(putCalls[0].args[0].input.Item.eventType).toBe('REJECTION');

    // Assert HTTP status code and HTML response body
    expect(response.statusCode).toBe(200);
    expect(response.headers?.['Content-Type']).toBe('text/html');
    expect(response.body).toContain('Invoice Rejected');
  });

  it('returns 400 Bad Request if token or invoiceId is missing', async () => {
    const event = {
      httpMethod: 'GET',
      path: '/approve',
      resource: '/approve',
      queryStringParameters: {
        invoiceId: 'inv-100',
        // token is missing!
      },
      headers: {},
      body: null,
      isBase64Encoded: false,
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body)).toEqual({ error: 'Missing token or invoiceId' });
    expect(sfnMock.calls().length).toBe(0);
  });
});
