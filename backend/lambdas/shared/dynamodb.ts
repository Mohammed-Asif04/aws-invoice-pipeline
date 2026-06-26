// ============================================================================
// AWS Invoice Pipeline — DynamoDB Client & Helpers
// CRUD operations for InvoiceRecords and AuditEntries tables
// ============================================================================

import {
  DynamoDBClient,
  ReturnValue,
} from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
  QueryCommand,
  ScanCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import { createLogger } from './logger';
import type {
  InvoiceRecord,
  AuditEntry,
  InvoiceStatus,
  PaginatedResponse,
} from './types';

const logger = createLogger('dynamodb-helper');

// Singleton DynamoDB client (re-used across Lambda container invocations)
const rawClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-south-1',
});

const docClient = DynamoDBDocumentClient.from(rawClient, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  },
});

// Table names from environment
const INVOICE_TABLE = () => process.env.INVOICE_TABLE || 'InvoiceRecords';
const AUDIT_TABLE = () => process.env.AUDIT_TABLE || 'AuditEntries';

// ---------------------------------------------------------------------------
// Invoice CRUD
// ---------------------------------------------------------------------------

/**
 * Create or overwrite an invoice record
 */
export async function putInvoice(invoice: InvoiceRecord): Promise<void> {
  const endTimer = logger.startTimer('putInvoice');

  await docClient.send(
    new PutCommand({
      TableName: INVOICE_TABLE(),
      Item: {
        ...invoice,
        updatedAt: new Date().toISOString(),
      },
    })
  );

  endTimer();
  logger.info('Invoice record saved', { invoiceId: invoice.invoiceId });
}

/**
 * Get a single invoice by ID and vendor ID
 */
export async function getInvoice(
  invoiceId: string,
  vendorId: string
): Promise<InvoiceRecord | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: INVOICE_TABLE(),
      Key: { invoiceId, vendorId },
    })
  );

  return (result.Item as InvoiceRecord) || null;
}

/**
 * Update specific fields on an invoice
 */
export async function updateInvoice(
  invoiceId: string,
  vendorId: string,
  updates: Partial<InvoiceRecord>
): Promise<InvoiceRecord> {
  const updateExpressions: string[] = [];
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, unknown> = {};

  // Always update the updatedAt timestamp
  updates.updatedAt = new Date().toISOString();

  for (const [key, value] of Object.entries(updates)) {
    if (key === 'invoiceId' || key === 'vendorId') continue; // Skip keys
    if (value === undefined) continue;

    const attrName = `#${key}`;
    const attrValue = `:${key}`;
    updateExpressions.push(`${attrName} = ${attrValue}`);
    expressionAttributeNames[attrName] = key;
    expressionAttributeValues[attrValue] = value;
  }

  if (updateExpressions.length === 0) {
    throw new Error('No fields to update');
  }

  const result = await docClient.send(
    new UpdateCommand({
      TableName: INVOICE_TABLE(),
      Key: { invoiceId, vendorId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: ReturnValue.ALL_NEW,
    })
  );

  logger.info('Invoice updated', { invoiceId, fields: Object.keys(updates) });
  return result.Attributes as InvoiceRecord;
}

/**
 * Update invoice status
 */
export async function updateInvoiceStatus(
  invoiceId: string,
  vendorId: string,
  status: InvoiceStatus
): Promise<InvoiceRecord> {
  return updateInvoice(invoiceId, vendorId, { status });
}

/**
 * Query invoices by status (GSI: status-index)
 */
export async function queryInvoicesByStatus(
  status: InvoiceStatus,
  limit: number = 25,
  lastKey?: Record<string, unknown>
): Promise<PaginatedResponse<InvoiceRecord>> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: INVOICE_TABLE(),
      IndexName: 'status-index',
      KeyConditionExpression: '#status = :status',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':status': status },
      Limit: limit,
      ExclusiveStartKey: lastKey as Record<string, any> | undefined,
      ScanIndexForward: false, // newest first
    })
  );

  return {
    items: (result.Items as InvoiceRecord[]) || [],
    total: result.Count || 0,
    page: 1,
    pageSize: limit,
    hasMore: !!result.LastEvaluatedKey,
    lastEvaluatedKey: result.LastEvaluatedKey
      ? JSON.stringify(result.LastEvaluatedKey)
      : undefined,
  };
}

/**
 * Check for duplicate invoice numbers
 */
export async function findDuplicateInvoice(
  invoiceNumber: string,
  vendorName: string,
  currentInvoiceId?: string
): Promise<InvoiceRecord | null> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: INVOICE_TABLE(),
      IndexName: 'invoiceNumber-index',
      KeyConditionExpression: '#invoiceNumber = :invoiceNumber',
      ExpressionAttributeNames: {
        '#invoiceNumber': 'invoiceNumber',
      },
      ExpressionAttributeValues: {
        ':invoiceNumber': invoiceNumber,
      }
    })
  );

  if (!result.Items || result.Items.length === 0) return null;
  
  let items = result.Items as InvoiceRecord[];
  
  // Filter out the current invoice if updating
  if (currentInvoiceId) {
    items = items.filter(item => item.invoiceId !== currentInvoiceId);
  }
  
  // Case-insensitive check for vendorName (if provided)
  if (items.length > 0 && vendorName && vendorName !== 'Unknown') {
    const normalizedVendor = vendorName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const duplicate = items.find(item => {
      const dbVendor = (item.vendorName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      return dbVendor.includes(normalizedVendor) || normalizedVendor.includes(dbVendor);
    });
    return duplicate || items[0]; // If invoice numbers match, it's highly likely a duplicate anyway
  }
  
  return items.length > 0 ? items[0] : null;
}

/**
 * Scan all invoices (for list page — use with pagination)
 */
export async function scanInvoices(
  limit: number = 25,
  lastKey?: Record<string, unknown>
): Promise<PaginatedResponse<InvoiceRecord>> {
  const result = await docClient.send(
    new ScanCommand({
      TableName: INVOICE_TABLE(),
      Limit: limit,
      ExclusiveStartKey: lastKey as Record<string, any> | undefined,
    })
  );

  return {
    items: (result.Items as InvoiceRecord[]) || [],
    total: result.Count || 0,
    page: 1,
    pageSize: limit,
    hasMore: !!result.LastEvaluatedKey,
    lastEvaluatedKey: result.LastEvaluatedKey
      ? JSON.stringify(result.LastEvaluatedKey)
      : undefined,
  };
}

// ---------------------------------------------------------------------------
// Audit Log CRUD
// ---------------------------------------------------------------------------

/**
 * Write an audit log entry
 */
export async function putAuditEntry(entry: AuditEntry): Promise<void> {
  const endTimer = logger.startTimer('putAuditEntry');

  await docClient.send(
    new PutCommand({
      TableName: AUDIT_TABLE(),
      Item: entry,
    })
  );

  endTimer();
  logger.info('Audit entry written', {
    auditId: entry.auditId,
    invoiceId: entry.invoiceId,
    eventType: entry.eventType,
  });
}

/**
 * Query audit entries for a specific invoice
 */
export async function getAuditEntriesForInvoice(
  invoiceId: string,
  limit: number = 50
): Promise<AuditEntry[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: AUDIT_TABLE(),
      IndexName: 'invoiceId-index',
      KeyConditionExpression: '#invoiceId = :invoiceId',
      ExpressionAttributeNames: { '#invoiceId': 'invoiceId' },
      ExpressionAttributeValues: { ':invoiceId': invoiceId },
      Limit: limit,
      ScanIndexForward: false, // newest first
    })
  );

  return (result.Items as AuditEntry[]) || [];
}

export { docClient, rawClient };
