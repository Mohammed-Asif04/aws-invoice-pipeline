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

// Removed mock invoices per user request

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
  resolved?: number;
  pendingReview?: number;
  processedPercentage: string;
  exceptionPercentage: string;
}

export async function getInvoices(
  filters: InvoiceFilters = {}
): Promise<PaginatedResult<Invoice>> {
  if (!import.meta.env.VITE_API_BASE_URL) {
    throw new Error('API Base URL is missing. Cannot fetch invoices.');
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
    throw new Error('API Base URL is missing. Cannot fetch invoice by ID.');
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
    throw new Error('API Base URL is missing. Cannot upload invoice.');
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
    throw new Error('API Base URL is missing. Cannot fetch dashboard stats.');
  }

  return apiClient.get<DashboardStats>('/dashboard');
}

export async function exportInvoices(filters: InvoiceFilters = {}): Promise<string> {
  const { data } = await getInvoices({ ...filters, pageSize: 9999 });
  return JSON.stringify(data, null, 2);
}
