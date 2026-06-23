// Approval Service — Exception review operations
// Currently uses mock data; swap to apiClient when backend is ready

// import { apiClient } from './api';  // Uncomment when API is ready

export type AnomalyStatus = 'Pending Review' | 'In Progress' | 'Resolved';

export interface ExceptionItem {
  id: string;
  vendor: string;
  issueType: 'Missing GSTIN' | 'Amount Mismatch' | 'Vendor Not Found' | 'Duplicate Invoice';
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

// ─── Mock Data ───────────────────────────────────────────────────

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
  {
    id: 'INV-2025-1207', vendor: 'TechCorp India', issueType: 'Duplicate Invoice',
    confidence: 85, assignedTo: 'Rohit Mehta', status: 'In Progress',
    date: 'May 14, 2025', amount: 142190.00, extractedGstin: '29AAECT1234F1Z5',
    description: 'An invoice with the same vendor, number, and amount was already processed on May 12, 2025.',
    extractedFields: [
      { field: 'Vendor Name', extractedValue: 'TechCorp India', suggestedValue: 'TechCorp India' },
      { field: 'GSTIN', extractedValue: '29AAECT1234F1Z5', suggestedValue: '29AAECT1234F1Z5' },
      { field: 'Invoice Number', extractedValue: 'INV-2025-1207', suggestedValue: 'INV-2025-1207' },
      { field: 'Invoice Date', extractedValue: 'May 14, 2025', suggestedValue: 'May 14, 2025' },
      { field: 'Total Amount', extractedValue: '₹ 1,42,190.00', suggestedValue: '₹ 1,42,190.00' },
    ],
  },
  {
    id: 'INV-2025-1198', vendor: 'ABC Solutions Ltd.', issueType: 'Missing GSTIN',
    confidence: 68, assignedTo: 'Ananya Sharma', status: 'In Progress',
    date: 'May 13, 2025', amount: 120500.00, extractedGstin: 'Not Found',
    description: 'GSTIN is missing or not detected in the invoice.',
    extractedFields: [
      { field: 'Vendor Name', extractedValue: 'ABC Solutions Ltd.', suggestedValue: 'ABC Solutions Ltd.' },
      { field: 'GSTIN', extractedValue: 'Not Found', suggestedValue: '29ABCDE1234F1Z5', isEditable: true },
      { field: 'Invoice Number', extractedValue: 'INV-2025-1198', suggestedValue: 'INV-2025-1198' },
      { field: 'Invoice Date', extractedValue: 'May 13, 2025', suggestedValue: 'May 13, 2025' },
      { field: 'Total Amount', extractedValue: '₹ 1,20,500.00', suggestedValue: '₹ 1,20,500.00' },
    ],
  },
  {
    id: 'INV-2025-1186', vendor: 'Office Needs Co.', issueType: 'Amount Mismatch',
    confidence: 75, assignedTo: 'Priya Nair', status: 'Pending Review',
    date: 'May 12, 2025', amount: 8400.00, extractedGstin: '29ABCDE1234F1Z5',
    description: 'Line items sum (₹ 8,000.00) does not match total amount (₹ 8,400.00).',
    extractedFields: [
      { field: 'Vendor Name', extractedValue: 'Office Needs Co.', suggestedValue: 'Office Needs Co.' },
      { field: 'GSTIN', extractedValue: '29ABCDE1234F1Z5', suggestedValue: '29ABCDE1234F1Z5' },
      { field: 'Invoice Number', extractedValue: 'INV-2025-1186', suggestedValue: 'INV-2025-1186' },
      { field: 'Invoice Date', extractedValue: 'May 12, 2025', suggestedValue: 'May 12, 2025' },
      { field: 'Total Amount', extractedValue: '₹ 8,400.00', suggestedValue: '₹ 8,000.00', isEditable: true },
    ],
  },
  {
    id: 'INV-2025-1175', vendor: 'Info Systems', issueType: 'Vendor Not Found',
    confidence: 55, assignedTo: 'Ananya Sharma', status: 'Pending Review',
    date: 'May 11, 2025', amount: 32000.00, extractedGstin: '29INFSY1234A1Z2',
    description: 'Vendor name extracted does not match any registered vendor in the vendor database.',
    extractedFields: [
      { field: 'Vendor Name', extractedValue: 'Info Systems', suggestedValue: 'Info Systems India', isEditable: true },
      { field: 'GSTIN', extractedValue: '29INFSY1234A1Z2', suggestedValue: '29INFSY1234A1Z2' },
      { field: 'Invoice Number', extractedValue: 'INV-2025-1175', suggestedValue: 'INV-2025-1175' },
      { field: 'Invoice Date', extractedValue: 'May 11, 2025', suggestedValue: 'May 11, 2025' },
      { field: 'Total Amount', extractedValue: '₹ 32,000.00', suggestedValue: '₹ 32,000.00' },
    ],
  },
  {
    id: 'INV-2025-1162', vendor: 'Digital Services', issueType: 'Missing GSTIN',
    confidence: 70, assignedTo: 'Rohit Mehta', status: 'Resolved',
    date: 'May 10, 2025', amount: 14500.00, extractedGstin: '29DIGSR5544B1Z9',
    description: 'GSTIN is missing or not detected in the invoice.',
    extractedFields: [
      { field: 'Vendor Name', extractedValue: 'Digital Services', suggestedValue: 'Digital Services' },
      { field: 'GSTIN', extractedValue: 'Not Found', suggestedValue: '29DIGSR5544B1Z9', isCorrected: true },
      { field: 'Invoice Number', extractedValue: 'INV-2025-1162', suggestedValue: 'INV-2025-1162' },
      { field: 'Invoice Date', extractedValue: 'May 10, 2025', suggestedValue: 'May 10, 2025' },
      { field: 'Total Amount', extractedValue: '₹ 14,500.00', suggestedValue: '₹ 14,500.00' },
    ],
  },
];

// ─── Service Functions ───────────────────────────────────────────

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export interface ExceptionFilters {
  search?: string;
  issueType?: string;
  status?: string;
  assignedTo?: string;
}

export async function getExceptions(
  filters: ExceptionFilters = {}
): Promise<ExceptionItem[]> {
  // When API is ready: return apiClient.get('/exceptions', filters);
  await delay(300);

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

export async function approveException(
  id: string,
  _corrections?: Record<string, string>,
  _comment?: string
): Promise<ExceptionItem> {
  // When API is ready: return apiClient.post(`/exceptions/${id}/approve`, { corrections, comment });
  await delay(500);
  const item = mockExceptions.find((x) => x.id === id);
  if (!item) throw new Error(`Exception ${id} not found`);
  return { ...item, status: 'Resolved' };
}

export async function rejectException(
  id: string,
  _reason?: string
): Promise<ExceptionItem> {
  // When API is ready: return apiClient.post(`/exceptions/${id}/reject`, { reason });
  await delay(500);
  const item = mockExceptions.find((x) => x.id === id);
  if (!item) throw new Error(`Exception ${id} not found`);
  return { ...item, status: 'Pending Review' };
}

export async function reprocessException(
  id: string
): Promise<ExceptionItem> {
  // When API is ready: return apiClient.post(`/exceptions/${id}/reprocess`);
  await delay(800);
  const item = mockExceptions.find((x) => x.id === id);
  if (!item) throw new Error(`Exception ${id} not found`);
  return { ...item, status: 'In Progress' };
}

export function getExceptionStats(exceptions: ExceptionItem[]) {
  return {
    total: 70, // Mocked overall total
    pending: exceptions.filter((x) => x.status === 'Pending Review').length,
    inProgress: exceptions.filter((x) => x.status === 'In Progress').length,
    resolved: exceptions.filter((x) => x.status === 'Resolved').length,
  };
}
