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

const mockExceptions: ExceptionItem[] = [
  {
    id: 'INV-2025-1243', vendor: 'Office Needs Co.', issueType: 'Missing GSTIN',
    confidence: 65, assignedTo: 'Ananya Sharma', status: 'Pending Review',
    date: 'May 17, 2025', amount: 15680.00, extractedGstin: 'Not Found',
    description: 'GSTIN is missing or not detected in the invoice.',
    extractedFields: [
      { field: 'Vendor Name', extractedValue: 'Office Needs Co.', suggestedValue: 'Office Needs Co.' },
      { field: 'GSTIN', extractedValue: 'Not Found', suggestedValue: '29ABCDE1234F1Z5', isEditable: true },
      { field: 'Invoice Number', extractedValue: 'INV-2025-1243', suggestedValue: 'INV-2025-1243' },
      { field: 'Invoice Date', extractedValue: 'May 17, 2025', suggestedValue: 'May 17, 2025' },
      { field: 'Total Amount', extractedValue: '₹ 15,680.00', suggestedValue: '₹ 15,680.00' },
    ],
  },
  {
    id: 'INV-2025-1239', vendor: 'Data Experts', issueType: 'Amount Mismatch',
    confidence: 72, assignedTo: 'Rohit Mehta', status: 'Pending Review',
    date: 'May 16, 2025', amount: 45900.00, extractedGstin: '29DTEXP1234A1Z0',
    description: 'Line items sum (₹ 45,000.00) does not match stated total (₹ 45,900.00).',
    extractedFields: [
      { field: 'Vendor Name', extractedValue: 'Data Experts', suggestedValue: 'Data Experts' },
      { field: 'GSTIN', extractedValue: '29DTEXP1234A1Z0', suggestedValue: '29DTEXP1234A1Z0' },
      { field: 'Invoice Number', extractedValue: 'INV-2025-1239', suggestedValue: 'INV-2025-1239' },
      { field: 'Invoice Date', extractedValue: 'May 16, 2025', suggestedValue: 'May 16, 2025' },
      { field: 'Total Amount', extractedValue: '₹ 45,900.00', suggestedValue: '₹ 45,000.00', isEditable: true },
    ],
  },
  {
    id: 'INV-2025-1228', vendor: 'Global Supplies', issueType: 'Vendor Not Found',
    confidence: 60, assignedTo: 'Priya Nair', status: 'Pending Review',
    date: 'May 15, 2025', amount: 89000.00, extractedGstin: '29GLSUP9876D1Z1',
    description: 'Vendor name extracted does not match any registered vendor in the vendor database.',
    extractedFields: [
      { field: 'Vendor Name', extractedValue: 'Global Supplies', suggestedValue: 'Global Supplies LLC', isEditable: true },
      { field: 'GSTIN', extractedValue: '29GLSUP9876D1Z1', suggestedValue: '29GLSUP9876D1Z1' },
      { field: 'Invoice Number', extractedValue: 'INV-2025-1228', suggestedValue: 'INV-2025-1228' },
      { field: 'Invoice Date', extractedValue: 'May 15, 2025', suggestedValue: 'May 15, 2025' },
      { field: 'Total Amount', extractedValue: '₹ 89,000.00', suggestedValue: '₹ 89,000.00' },
    ],
  },
];

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
    return mockExceptions.filter((item) => {
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
    await new Promise((res) => setTimeout(res, 500));
    return;
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
    await new Promise((res) => setTimeout(res, 500));
    return;
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
    await new Promise((res) => setTimeout(res, 800));
    return;
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
