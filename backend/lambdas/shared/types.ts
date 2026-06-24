// ============================================================================
// AWS Invoice Pipeline — Shared TypeScript Types
// Backend interfaces for DynamoDB, Lambda events, and inter-service contracts
// ============================================================================

// ---------------------------------------------------------------------------
// Invoice Statuses & Exception Types
// ---------------------------------------------------------------------------

export type InvoiceStatus =
  | 'IN_PROGRESS'
  | 'PROCESSED'
  | 'IN_REVIEW'
  | 'PENDING_REVIEW'
  | 'EXCEPTION'
  | 'RESOLVED';

export type ExceptionType =
  | 'MISSING_GSTIN'
  | 'AMOUNT_MISMATCH'
  | 'VENDOR_NOT_FOUND'
  | 'DUPLICATE_INVOICE'
  | 'LOW_CONFIDENCE_SCORE';

export type AuditEventType =
  | 'INGESTION'
  | 'EXTRACTION'
  | 'VALIDATION'
  | 'APPROVAL'
  | 'REJECTION'
  | 'REPROCESS'
  | 'PERSISTENCE'
  | 'ERROR';

// ---------------------------------------------------------------------------
// Line Items
// ---------------------------------------------------------------------------

export interface LineItem {
  description: string;
  hsnSac: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

// ---------------------------------------------------------------------------
// Extracted Fields (from Textract)
// ---------------------------------------------------------------------------

export interface ExtractedField {
  fieldName: string;
  extractedValue: string;
  confidence: number;
  validationStatus: 'MATCHED' | 'MISMATCH' | 'NOT_FOUND' | 'PENDING';
}

// ---------------------------------------------------------------------------
// Anomaly (detected by Bedrock validation)
// ---------------------------------------------------------------------------

export interface Anomaly {
  type: ExceptionType;
  description: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  suggestedValue?: string;
}

// ---------------------------------------------------------------------------
// Invoice Record (DynamoDB)
// ---------------------------------------------------------------------------

export interface InvoiceRecord {
  // Keys
  invoiceId: string;        // PK
  vendorId: string;          // SK

  // Core fields
  vendorName: string;
  vendorAddress?: string;
  gstin?: string;
  invoiceDate: string;
  dueDate?: string;
  poNumber?: string;
  invoiceNumber: string;
  invoiceType?: string;

  // Financial
  lineItems: LineItem[];
  subtotal: number;
  cgst: number;
  sgst: number;
  totalAmount: number;
  currency: string;

  // Processing metadata
  status: InvoiceStatus;
  extractionConfidence: number;
  extractedFields: ExtractedField[];
  anomalies: Anomaly[];

  // Approval
  approvedBy?: string;
  approvalTimestamp?: string;
  approvalComments?: string;
  assignedTo?: string;

  // Audit & traceability
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  receivedOn: string;

  // S3 references
  s3RawKey: string;
  s3AuditKey?: string;
  s3ExtractedJsonKey?: string;

  // Step Functions
  taskToken?: string;
  executionArn?: string;

  // Source
  source: 'EMAIL' | 'UPLOAD';
  sourceEmail?: string;
}

// ---------------------------------------------------------------------------
// Audit Log Entry (DynamoDB)
// ---------------------------------------------------------------------------

export interface AuditEntry {
  auditId: string;           // PK
  invoiceId: string;         // GSI PK
  event: string;
  eventType: AuditEventType;
  timestamp: string;
  user: string;
  details: string;
  metadata?: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Textract Extraction Result
// ---------------------------------------------------------------------------

export interface TextractExtractionResult {
  invoiceId: string;
  s3RawKey: string;
  extractedFields: ExtractedField[];
  lineItems: LineItem[];
  vendorName: string;
  vendorAddress?: string;
  gstin?: string;
  invoiceDate: string;
  dueDate?: string;
  poNumber?: string;
  invoiceNumber: string;
  subtotal: number;
  cgst: number;
  sgst: number;
  totalAmount: number;
  currency: string;
  overallConfidence: number;
  rawTextractResponse?: string; // S3 key to raw Textract JSON
}

// ---------------------------------------------------------------------------
// Bedrock Validation Result
// ---------------------------------------------------------------------------

export interface BedrockValidationResult {
  invoiceId: string;
  status: InvoiceStatus;
  overallConfidence: number;
  anomalies: Anomaly[];
  validatedFields: ExtractedField[];
  validationSummary: string;
  isDuplicate: boolean;
  duplicateInvoiceId?: string;
}

// ---------------------------------------------------------------------------
// Step Functions Payloads
// ---------------------------------------------------------------------------

export interface PipelineInput {
  invoiceId: string;
  s3Bucket: string;
  s3Key: string;
  source: 'EMAIL' | 'UPLOAD';
  sourceEmail?: string;
  metadata?: Record<string, string>;
}

export interface PipelineState {
  invoiceId: string;
  s3Bucket: string;
  s3Key: string;
  source: 'EMAIL' | 'UPLOAD';
  sourceEmail?: string;
  extraction?: TextractExtractionResult;
  validation?: BedrockValidationResult;
  taskToken?: string;
  error?: {
    code: string;
    message: string;
    timestamp: string;
  };
}

// ---------------------------------------------------------------------------
// API Gateway Payloads
// ---------------------------------------------------------------------------

export interface ApprovalCallbackPayload {
  invoiceId: string;
  action: 'APPROVE' | 'REJECT' | 'REPROCESS';
  taskToken: string;
  reviewer: string;
  comments?: string;
  correctedFields?: Record<string, string>;
}

export interface InvoiceListQuery {
  status?: InvoiceStatus;
  vendorName?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  lastEvaluatedKey?: string;
}

// ---------------------------------------------------------------------------
// Lambda Response Helpers
// ---------------------------------------------------------------------------

export interface LambdaResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

// ---------------------------------------------------------------------------
// Environment Configuration
// ---------------------------------------------------------------------------

export interface EnvironmentConfig {
  RAW_BUCKET: string;
  AUDIT_BUCKET: string;
  INVOICE_TABLE: string;
  AUDIT_TABLE: string;
  STATE_MACHINE_ARN: string;
  BEDROCK_MODEL_ID: string;
  APPROVAL_API_URL: string;
  SNS_TOPIC_ARN: string;
  SES_SENDER_EMAIL: string;
  REGION: string;
}
