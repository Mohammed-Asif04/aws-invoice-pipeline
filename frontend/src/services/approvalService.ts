// Approval Service — Exception review operations
// Calls API Gateway endpoints if VITE_API_BASE_URL is configured, else falls back to mocks

import { apiClient } from './api';

export type AnomalyStatus = 'Pending Review' | 'In Progress' | 'Resolved';

export interface ExceptionItem {
  id: string;
  vendor: string;
  issueType: 'Missing GSTIN' | 'Amount Mismatch' | 'Vendor Not Found' | 'Duplicate Invoice' | 'Low Confidence Score';
  confidence: number;
  assignedTo: string;
  status: AnomalyStatus;
  date: string;
  amount: number;
  extractedGstin: string;
  description: string;
  extractedFields: {
    field: string;
    extractedValue: string;
    suggestedValue: string;
    isEditable?: boolean;
    isCorrected?: boolean;
  }[];
}

// ─── Mock Data (Fallback) ─────────────────────────────────────────

// Removed mock exceptions per user request

// Helper to map backend anomalies to frontend ExceptionItem
export function mapBackendInvoiceToExceptionItem(invoice: any): ExceptionItem {
  const primaryAnomaly = invoice.anomalies?.[0] || { type: 'LOW_CONFIDENCE_SCORE', description: 'Low confidence' };
  
  const mapAnomalyType = (type: string): any => {
    switch (type) {
      case 'MISSING_GSTIN': return 'Missing GSTIN';
      case 'AMOUNT_MISMATCH': return 'Amount Mismatch';
      case 'VENDOR_NOT_FOUND': return 'Vendor Not Found';
      case 'DUPLICATE_INVOICE': return 'Duplicate Invoice';
      case 'LOW_CONFIDENCE_SCORE': return 'Low Confidence Score';
      default: return 'Low Confidence Score';
    }
  };

  const mapStatus = (status: string): AnomalyStatus => {
    if (status === 'RESOLVED' || status === 'PROCESSED') return 'Resolved';
    if (status === 'IN_PROGRESS') return 'In Progress';
    return 'Pending Review';
  };

  const extractedFields = (invoice.extractedFields || []).map((f: any) => {
    const mapFieldName = (name: string) => {
      switch (name) {
        case 'vendorName': return 'Vendor Name';
        case 'gstin': return 'GSTIN';
        case 'invoiceNumber': return 'Invoice Number';
        case 'invoiceDate': return 'Invoice Date';
        case 'totalAmount': return 'Total Amount';
        default: return name;
      }
    };
    
    const isEditable = ['gstin', 'totalAmount', 'vendorName', 'invoiceNumber'].includes(f.fieldName);
    
    return {
      field: mapFieldName(f.fieldName),
      extractedValue: f.extractedValue,
      suggestedValue: f.extractedValue,
      isEditable,
      isCorrected: f.validationStatus === 'MATCHED' && isEditable,
    };
  });

  return {
    id: invoice.invoiceId,
    vendor: invoice.vendorName || 'Pending Extraction',
    issueType: mapAnomalyType(primaryAnomaly.type),
    confidence: invoice.extractionConfidence || 0,
    assignedTo: invoice.assignedTo || 'Reviewer Team',
    status: mapStatus(invoice.status),
    date: new Date(invoice.createdAt || invoice.receivedOn).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }),
    amount: invoice.totalAmount || 0,
    extractedGstin: invoice.gstin || 'Not Found',
    description: primaryAnomaly.description || 'Invoice requires manual review.',
    extractedFields,
  };
}

// ─── Service Functions ───────────────────────────────────────────

export interface ExceptionFilters {
  search?: string;
  issueType?: string;
  status?: string;
  assignedTo?: string;
}

export async function getExceptions(
  filters: ExceptionFilters = {}
): Promise<ExceptionItem[]> {
  if (!import.meta.env.VITE_API_BASE_URL) {
    throw new Error('API Base URL is missing. Cannot fetch exceptions.');
  }

  // Real backend call: GET /exceptions
  const response = await apiClient.get<{ items: any[]; total: number }>('/exceptions');
  const items = response.items || [];
  
  const exceptionItems = items.map(mapBackendInvoiceToExceptionItem);

  // Apply filters client-side
  return exceptionItems.filter((item) => {
    const matchesSearch = !filters.search ||
      item.id.toLowerCase().includes(filters.search.toLowerCase()) ||
      item.vendor.toLowerCase().includes(filters.search.toLowerCase()) ||
      item.issueType.toLowerCase().includes(filters.search.toLowerCase());
    const matchesIssue = !filters.issueType || filters.issueType === 'All' || item.issueType === filters.issueType;
    const matchesStatus = !filters.status || filters.status === 'All' || item.status === filters.status;
    const matchesAssignee = !filters.assignedTo || filters.assignedTo === 'All' || item.assignedTo === filters.assignedTo;
    return matchesSearch && matchesIssue && matchesStatus && matchesAssignee;
  });
}

export async function approveException(
  id: string,
  corrections?: Record<string, string>,
  comment?: string
): Promise<void> {
  if (!import.meta.env.VITE_API_BASE_URL) {
    throw new Error('API Base URL is missing. Cannot approve exception.');
  }

  // POST /approvals
  // Backend expects: { invoiceId, action, reviewer, comments, correctedFields }
  await apiClient.post('/approvals', {
    invoiceId: id,
    action: 'APPROVE',
    reviewer: 'web-user',
    comments: comment,
    correctedFields: corrections,
  });
}

export async function rejectException(
  id: string,
  reason?: string
): Promise<void> {
  if (!import.meta.env.VITE_API_BASE_URL) {
    throw new Error('API Base URL is missing. Cannot reject exception.');
  }

  // POST /approvals
  await apiClient.post('/approvals', {
    invoiceId: id,
    action: 'REJECT',
    reviewer: 'web-user',
    comments: reason,
  });
}

export async function reprocessException(
  id: string
): Promise<void> {
  if (!import.meta.env.VITE_API_BASE_URL) {
    throw new Error('API Base URL is missing. Cannot reprocess exception.');
  }

  // POST /approvals
  await apiClient.post('/approvals', {
    invoiceId: id,
    action: 'REPROCESS',
    reviewer: 'web-user',
  });
}

export function getExceptionStats(exceptions: ExceptionItem[]) {
  return {
    total: exceptions.length,
    pending: exceptions.filter((x) => x.status === 'Pending Review').length,
    inProgress: exceptions.filter((x) => x.status === 'In Progress').length,
    resolved: exceptions.filter((x) => x.status === 'Resolved').length,
  };
}
