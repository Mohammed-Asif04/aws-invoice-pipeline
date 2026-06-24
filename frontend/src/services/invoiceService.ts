// Invoice Service — CRUD operations for invoices
// Call API endpoints if VITE_API_BASE_URL is configured, else fall back to mocks

import type { Invoice, InvoiceStatus } from '@/types';
import { apiClient } from './api';

// Map UI statuses to backend statuses
export function mapUIStatusToBackend(status: string): string {
  switch (status) {
    case 'Processed': return 'PROCESSED';
    case 'In Progress': return 'IN_PROGRESS';
    case 'In Review': return 'IN_REVIEW';
    case 'Pending Review': return 'IN_REVIEW';
    case 'Exception': return 'EXCEPTION';
    case 'Resolved': return 'RESOLVED';
    default: return status.toUpperCase();
  }
}

// Map backend statuses to UI statuses
export function mapBackendStatusToUI(status: string): InvoiceStatus {
  switch (status) {
    case 'PROCESSED': return 'Processed';
    case 'IN_PROGRESS': return 'In Progress';
    case 'IN_REVIEW': return 'In Review';
    case 'PENDING_REVIEW': return 'Pending Review';
    case 'EXCEPTION': return 'Exception';
    case 'RESOLVED': return 'Resolved';
    default: return 'In Progress';
  }
}

// ─── Mock Data (Fallback) ─────────────────────────────────────────

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

export interface DashboardStats {
  totalInvoices: number;
  processed: number;
  inProgress: number;
  exceptions: number;
  inReview: number;
  processedPercentage: string;
  exceptionPercentage: string;
}

export async function getInvoices(
  filters: InvoiceFilters = {}
): Promise<PaginatedResult<Invoice>> {
  if (!import.meta.env.VITE_API_BASE_URL) {
    // Local mock fallback logic
    let result = [...mockInvoicesRaw] as Invoice[];

    if (filters.search) {
      const s = filters.search.toLowerCase();
      result = result.filter(
        (inv) =>
          inv.invoiceId.toLowerCase().includes(s) ||
          inv.vendorName.toLowerCase().includes(s) ||
          inv.invoiceNumber.toLowerCase().includes(s)
      );
    }

    if (filters.status && filters.status !== 'All Status') {
      result = result.filter((inv) => inv.status === filters.status);
    }

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

  // Real API Gateway Request
  const params: Record<string, string> = {};
  if (filters.status && filters.status !== 'All Status') {
    params.status = mapUIStatusToBackend(filters.status);
  }
  if (filters.pageSize) {
    params.pageSize = String(filters.pageSize);
  }

  const response = await apiClient.get<{ items: any[]; lastKey?: string }>('/invoices', params);
  const items = (response.items || []).map((inv) => ({
    ...inv,
    status: mapBackendStatusToUI(inv.status),
  }));

  // Perform remaining search & filters in client memory for rich UX
  let filtered = items;
  if (filters.search) {
    const s = filters.search.toLowerCase();
    filtered = filtered.filter(
      (inv) =>
        inv.invoiceId.toLowerCase().includes(s) ||
        inv.vendorName.toLowerCase().includes(s) ||
        (inv.invoiceNumber && inv.invoiceNumber.toLowerCase().includes(s))
    );
  }

  if (filters.vendor && filters.vendor !== 'All Vendors') {
    filtered = filtered.filter((inv) => inv.vendorName === filters.vendor);
  }

  // Sorting
  const sortField = (filters.sortField || 'receivedOn') as keyof Invoice;
  const sortOrder = filters.sortOrder || 'desc';
  filtered.sort((a, b) => {
    let aVal: any = a[sortField];
    let bVal: any = b[sortField];
    if (sortField === 'invoiceDate' || sortField === 'receivedOn') {
      aVal = new Date(aVal || '').getTime();
      bVal = new Date(bVal || '').getTime();
    }
    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const page = filters.page || 1;
  const pageSize = filters.pageSize || 10;
  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const data = filtered.slice(start, start + pageSize);

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
  if (!import.meta.env.VITE_API_BASE_URL) {
    return (mockInvoicesRaw as Invoice[]).find((inv) => inv.invoiceId === id) || null;
  }

  const response = await apiClient.get<{ invoice: any; auditLogs: any[] }>(`/invoices/${id}`);
  if (response && response.invoice) {
    return {
      ...response.invoice,
      status: mapBackendStatusToUI(response.invoice.status),
    };
  }
  return null;
}

export async function uploadInvoice(
  file: File,
  metadata?: Record<string, string>
): Promise<{ invoiceId: string; status: string }> {
  if (!import.meta.env.VITE_API_BASE_URL) {
    await new Promise((res) => setTimeout(res, 1500));
    return { invoiceId: `INV-2025-${Date.now() % 10000}`, status: 'In Progress' };
  }

  // Upload to API Gateway /upload endpoint directly as binary bytes
  const arrayBuffer = await file.arrayBuffer();
  
  const headers: Record<string, string> = {
    'x-filename': file.name,
  };
  if (metadata) {
    headers['x-invoice-metadata'] = JSON.stringify(metadata);
  }

  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/upload`, {
    method: 'POST',
    body: arrayBuffer,
    headers,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  const result = await response.json();
  return {
    invoiceId: result.invoiceId,
    status: 'In Progress',
  };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  if (!import.meta.env.VITE_API_BASE_URL) {
    return {
      totalInvoices: 1246,
      processed: 1078,
      inProgress: 98,
      exceptions: 70,
      inReview: 24,
      processedPercentage: '86.5',
      exceptionPercentage: '5.6',
    };
  }

  return apiClient.get<DashboardStats>('/dashboard');
}

export async function exportInvoices(filters: InvoiceFilters = {}): Promise<string> {
  const { data } = await getInvoices({ ...filters, pageSize: 9999 });
  return JSON.stringify(data, null, 2);
}
