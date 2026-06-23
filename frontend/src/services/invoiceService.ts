// Invoice Service — CRUD operations for invoices
// Currently uses mock data; swap to apiClient when backend is ready

import type { Invoice, InvoiceStatus } from '@/types';
// import { apiClient } from './api';  // Uncomment when API is ready

// ─── Mock Data ───────────────────────────────────────────────────

const mockInvoicesRaw = [
  {
    invoiceId: 'INV-2025-1246', vendorName: 'ABC Solutions Ltd.', invoiceDate: '2025-05-18',
    totalAmount: 124500.00, currency: 'INR', status: 'Processed' as InvoiceStatus,
    receivedOn: '2025-05-18T10:23:00Z', extractionConfidence: 98,
    lineItems: [], subtotal: 105508.47, cgst: 9495.76, sgst: 9495.76,
    anomalies: [], createdAt: '2025-05-18T10:23:00Z', invoiceNumber: 'INV-2025-1246',
  },
  {
    invoiceId: 'INV-2025-1245', vendorName: 'TechCorp India', invoiceDate: '2025-05-18',
    totalAmount: 98750.00, currency: 'INR', status: 'In Review' as InvoiceStatus,
    receivedOn: '2025-05-18T09:15:00Z', extractionConfidence: 89,
    lineItems: [], subtotal: 83686.44, cgst: 7531.78, sgst: 7531.78,
    anomalies: [], createdAt: '2025-05-18T09:15:00Z', invoiceNumber: 'INV-2025-1245',
  },
  {
    invoiceId: 'INV-2025-1244', vendorName: 'Global Supplies', invoiceDate: '2025-05-18',
    totalAmount: 245000.00, currency: 'INR', status: 'Processed' as InvoiceStatus,
    receivedOn: '2025-05-18T08:42:00Z', extractionConfidence: 96,
    lineItems: [], subtotal: 207627.12, cgst: 18686.44, sgst: 18686.44,
    anomalies: [], createdAt: '2025-05-18T08:42:00Z', invoiceNumber: 'INV-2025-1244',
  },
  {
    invoiceId: 'INV-2025-1243', vendorName: 'Office Needs Co.', invoiceDate: '2025-05-17',
    totalAmount: 15680.00, currency: 'INR', status: 'Exception' as InvoiceStatus,
    receivedOn: '2025-05-17T18:31:00Z', extractionConfidence: 78,
    lineItems: [], subtotal: 13288.14, cgst: 1195.93, sgst: 1195.93,
    anomalies: [{ type: 'Missing GSTIN' as const, description: 'Vendor GSTIN is missing in document', severity: 'HIGH' as const }],
    createdAt: '2025-05-17T18:31:00Z', invoiceNumber: 'INV-2025-1243',
  },
  {
    invoiceId: 'INV-2025-1242', vendorName: 'Digital Services', invoiceDate: '2025-05-17',
    totalAmount: 75000.00, currency: 'INR', status: 'Processed' as InvoiceStatus,
    receivedOn: '2025-05-17T17:12:00Z', extractionConfidence: 95,
    lineItems: [], subtotal: 63559.32, cgst: 5720.34, sgst: 5720.34,
    anomalies: [], createdAt: '2025-05-17T17:12:00Z', invoiceNumber: 'INV-2025-1242',
  },
  {
    invoiceId: 'INV-2025-1241', vendorName: 'BufferOn Pvt. Ltd.', invoiceDate: '2025-05-17',
    totalAmount: 110000.00, currency: 'INR', status: 'In Review' as InvoiceStatus,
    receivedOn: '2025-05-17T16:05:00Z', extractionConfidence: 91,
    lineItems: [], subtotal: 93220.34, cgst: 8389.83, sgst: 8389.83,
    anomalies: [], createdAt: '2025-05-17T16:05:00Z', invoiceNumber: 'INV-2025-1241',
  },
  {
    invoiceId: 'INV-2025-1240', vendorName: 'Info Systems', invoiceDate: '2025-05-16',
    totalAmount: 18600.00, currency: 'INR', status: 'Processed' as InvoiceStatus,
    receivedOn: '2025-05-16T15:20:00Z', extractionConfidence: 97,
    lineItems: [], subtotal: 15762.71, cgst: 1418.64, sgst: 1418.64,
    anomalies: [], createdAt: '2025-05-16T15:20:00Z', invoiceNumber: 'INV-2025-1240',
  },
  {
    invoiceId: 'INV-2025-1239', vendorName: 'Data Experts', invoiceDate: '2025-05-16',
    totalAmount: 56000.00, currency: 'INR', status: 'Exception' as InvoiceStatus,
    receivedOn: '2025-05-16T14:11:00Z', extractionConfidence: 74,
    lineItems: [], subtotal: 47457.63, cgst: 4271.19, sgst: 4271.19,
    anomalies: [{ type: 'Amount Mismatch' as const, description: 'Calculated line items total does not match final total', severity: 'HIGH' as const }],
    createdAt: '2025-05-16T14:11:00Z', invoiceNumber: 'INV-2025-1239',
  },
  {
    invoiceId: 'INV-2025-1238', vendorName: 'Office Needs Co.', invoiceDate: '2025-05-16',
    totalAmount: 32450.00, currency: 'INR', status: 'Processed' as InvoiceStatus,
    receivedOn: '2025-05-16T13:43:00Z', extractionConfidence: 94,
    lineItems: [], subtotal: 27500.00, cgst: 2475.00, sgst: 2475.00,
    anomalies: [], createdAt: '2025-05-16T13:43:00Z', invoiceNumber: 'INV-2025-1238',
  },
  {
    invoiceId: 'INV-2025-1237', vendorName: 'ABC Solutions Ltd.', invoiceDate: '2025-05-15',
    totalAmount: 85000.00, currency: 'INR', status: 'Processed' as InvoiceStatus,
    receivedOn: '2025-05-15T11:20:00Z', extractionConfidence: 97,
    lineItems: [], subtotal: 72033.90, cgst: 6483.05, sgst: 6483.05,
    anomalies: [], createdAt: '2025-05-15T11:20:00Z', invoiceNumber: 'INV-2025-1237',
  },
  {
    invoiceId: 'INV-2025-1236', vendorName: 'BufferOn Pvt. Ltd.', invoiceDate: '2025-05-15',
    totalAmount: 45000.00, currency: 'INR', status: 'Processed' as InvoiceStatus,
    receivedOn: '2025-05-15T10:02:00Z', extractionConfidence: 95,
    lineItems: [], subtotal: 38135.59, cgst: 3432.20, sgst: 3432.20,
    anomalies: [], createdAt: '2025-05-15T10:02:00Z', invoiceNumber: 'INV-2025-1236',
  },
  {
    invoiceId: 'INV-2025-1235', vendorName: 'Digital Services', invoiceDate: '2025-05-14',
    totalAmount: 12500.00, currency: 'INR', status: 'Processed' as InvoiceStatus,
    receivedOn: '2025-05-14T15:10:00Z', extractionConfidence: 96,
    lineItems: [], subtotal: 10593.22, cgst: 953.39, sgst: 953.39,
    anomalies: [], createdAt: '2025-05-14T15:10:00Z', invoiceNumber: 'INV-2025-1235',
  },
];

// ─── Service Functions ───────────────────────────────────────────

export interface InvoiceFilters {
  search?: string;
  status?: string;
  vendor?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Simulate async delay for realistic UX
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export async function getInvoices(
  filters: InvoiceFilters = {}
): Promise<PaginatedResult<Invoice>> {
  // When API is ready: return apiClient.get('/invoices', filters);
  await delay(300);

  let result = [...mockInvoicesRaw] as Invoice[];

  // Search filter
  if (filters.search) {
    const s = filters.search.toLowerCase();
    result = result.filter(
      (inv) =>
        inv.invoiceId.toLowerCase().includes(s) ||
        inv.vendorName.toLowerCase().includes(s)
    );
  }

  // Status filter
  if (filters.status && filters.status !== 'All Status') {
    result = result.filter((inv) => inv.status === filters.status);
  }

  // Vendor filter
  if (filters.vendor && filters.vendor !== 'All Vendors') {
    result = result.filter((inv) => inv.vendorName === filters.vendor);
  }

  // Sort
  const sortField = (filters.sortField || 'receivedOn') as keyof Invoice;
  const sortOrder = filters.sortOrder || 'desc';
  result.sort((a, b) => {
    let aVal: any = a[sortField];
    let bVal: any = b[sortField];
    if (sortField === 'invoiceDate' || sortField === 'receivedOn') {
      aVal = new Date(aVal).getTime();
      bVal = new Date(bVal).getTime();
    }
    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 10;
  const total = result.length;
  const start = (page - 1) * pageSize;
  const data = result.slice(start, start + pageSize);

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
  // When API is ready: return apiClient.get(`/invoices/${id}`);
  await delay(200);
  return (mockInvoicesRaw as Invoice[]).find((inv) => inv.invoiceId === id) || null;
}

export async function uploadInvoice(
  _file: File,
  _metadata?: Record<string, string>
): Promise<{ invoiceId: string; status: string }> {
  // When API is ready: return apiClient.uploadFile('/invoices/upload', file, metadata);
  await delay(1500);
  return { invoiceId: `INV-2025-${Date.now() % 10000}`, status: 'In Progress' };
}

export async function exportInvoices(filters: InvoiceFilters = {}): Promise<string> {
  const { data } = await getInvoices({ ...filters, pageSize: 9999 });
  return JSON.stringify(data, null, 2);
}
