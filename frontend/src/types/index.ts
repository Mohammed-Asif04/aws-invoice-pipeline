// Invoice Processing System - Shared TypeScript Interfaces

export type InvoiceStatus = 'Processed' | 'In Progress' | 'In Review' | 'Pending Review' | 'Exception' | 'Resolved';

export type ExceptionType = 'Missing GSTIN' | 'Amount Mismatch' | 'Vendor Not Found' | 'Duplicate Invoice' | 'Low Confidence Score';

export interface LineItem {
  description: string;
  hsnSac: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface ExtractedField {
  fieldName: string;
  extractedValue: string;
  confidence: number;
  validationStatus: 'Matched' | 'Mismatch' | 'Not Found' | 'Pending';
}

export interface Invoice {
  invoiceId: string;
  vendorName: string;
  vendorAddress?: string;
  gstin?: string;
  invoiceDate: string;
  dueDate?: string;
  poNumber?: string;
  invoiceNumber: string;
  invoiceType?: string;
  lineItems: LineItem[];
  subtotal: number;
  cgst: number;
  sgst: number;
  totalAmount: number;
  currency: string;
  status: InvoiceStatus;
  extractionConfidence: number;
  anomalies: Anomaly[];
  approvedBy?: string;
  approvalTimestamp?: string;
  createdBy?: string;
  createdAt: string;
  receivedOn: string;
  s3RawKey?: string;
  s3AuditKey?: string;
}

export interface Anomaly {
  type: ExceptionType;
  description: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface UploadedFile {
  name: string;
  size: number;
  type: string;
  file: File;
  uploadStatus: 'uploading' | 'complete' | 'error';
  progress: number;
}

export interface UserProfile {
  name: string;
  role: string;
  initials: string;
  avatarUrl?: string;
}

export interface NavItem {
  label: string;
  path: string;
  icon: string;
}

export interface AuditEntry {
  id: string;
  invoiceId: string;
  event: string;
  eventType: 'ingestion' | 'extraction' | 'validation' | 'approval' | 'rejection' | 'reprocess' | 'persistence';
  timestamp: string;
  user: string;
  details: string;
  metadata?: Record<string, string>;
}

export interface ProcessingTrend {
  date: string;
  processed: number;
  exceptions: number;
  inProgress: number;
}

export interface ExceptionBreakdown {
  type: ExceptionType;
  count: number;
  percentage: number;
}

export interface VendorMetric {
  vendor: string;
  totalInvoices: number;
  totalValue: number;
  avgConfidence: number;
  successRate: number;
}

export interface StageMetric {
  stage: string;
  avgTimeMs: number;
  p95TimeMs: number;
}
