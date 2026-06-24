// useAuditLogs — Custom hook for audit trail data fetching
import { useState, useEffect, useCallback } from 'react';
import type { AuditEntry } from '@/types';
import { apiClient } from '@/services/api';

// ─── Mock Data (Fallback) ─────────────────────────────────────────

const mockAuditLogs: AuditEntry[] = [
  {
    id: 'AUD-001', invoiceId: 'INV-2025-1246', event: 'Invoice Ingested via SES',
    eventType: 'ingestion', timestamp: '2025-05-18T10:23:00Z', user: 'System (SES)',
    details: 'PDF attachment extracted from inbound email and stored in S3 raw bucket.',
    metadata: { s3Key: 's3://invoices-raw-bucket-prod/2025/05/18/abc-inv.pdf', sender: 'billing@abcsolutions.com' },
  },
  {
    id: 'AUD-002', invoiceId: 'INV-2025-1246', event: 'Textract Extraction Completed',
    eventType: 'extraction', timestamp: '2025-05-18T10:23:12Z', user: 'System (Lambda)',
    details: 'Amazon Textract AnalyzeExpense processed document. 6 key fields extracted with 98% avg confidence.',
    metadata: { s3Key: 's3://invoices-audit-bucket-prod/2025/05/18/abc-inv_textract.json', pages: '1', confidence: '98%' },
  },
  {
    id: 'AUD-003', invoiceId: 'INV-2025-1246', event: 'Bedrock Validation Passed',
    eventType: 'validation', timestamp: '2025-05-18T10:23:18Z', user: 'System (Bedrock)',
    details: 'Claude 3 validated all fields. No anomalies detected. Overall confidence: 92%.',
    metadata: { model: 'anthropic.claude-3-sonnet', anomalies: '0', confidence: '92%' },
  },
];

// Helper to map backend audit logs to frontend AuditEntry
function mapBackendAuditToFrontend(audit: any): AuditEntry {
  const mapType = (type: string): any => {
    switch (type) {
      case 'INGESTION': return 'ingestion';
      case 'EXTRACTION': return 'extraction';
      case 'VALIDATION': return 'validation';
      case 'APPROVAL': return 'approval';
      case 'REJECTION': return 'rejection';
      case 'REPROCESS': return 'reprocess';
      case 'PERSISTENCE': return 'persistence';
      case 'ERROR': return 'rejection';
      default: return 'ingestion';
    }
  };

  return {
    id: audit.auditId,
    invoiceId: audit.invoiceId,
    event: audit.event,
    eventType: mapType(audit.eventType),
    timestamp: audit.timestamp,
    user: audit.user,
    details: audit.details,
    metadata: audit.metadata,
  };
}

interface AuditLogFilters {
  search?: string;
  eventType?: string;
  invoiceId?: string;
  user?: string;
}

interface UseAuditLogsReturn {
  logs: AuditEntry[];
  loading: boolean;
  error: string | null;
  total: number;
  // Filters
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  eventTypeFilter: string;
  setEventTypeFilter: (v: string) => void;
  // Pagination
  page: number;
  setPage: (p: number) => void;
  pageSize: number;
  totalPages: number;
  currentPageLogs: AuditEntry[];
  refresh: () => void;
}

async function fetchAuditLogs(filters: AuditLogFilters): Promise<AuditEntry[]> {
  if (!import.meta.env.VITE_API_BASE_URL) {
    // Return mock data
    return mockAuditLogs.filter((log) => {
      const matchesSearch = !filters.search ||
        log.invoiceId.toLowerCase().includes(filters.search.toLowerCase()) ||
        log.event.toLowerCase().includes(filters.search.toLowerCase()) ||
        log.details.toLowerCase().includes(filters.search.toLowerCase()) ||
        log.user.toLowerCase().includes(filters.search.toLowerCase());
      const matchesType = !filters.eventType || filters.eventType === 'All' || log.eventType === filters.eventType;
      const matchesInvoice = !filters.invoiceId || log.invoiceId === filters.invoiceId;
      return matchesSearch && matchesType && matchesInvoice;
    });
  }

  // Real API calls
  if (filters.invoiceId) {
    // Get logs for specific invoice: GET /audit?invoiceId=xxx
    const response = await apiClient.get<{ entries: any[] }>('/audit', { invoiceId: filters.invoiceId });
    return (response.entries || []).map(mapBackendAuditToFrontend);
  } else {
    // Combine logs of recent invoices
    const invoicesResponse = await apiClient.get<{ items: any[] }>('/invoices', { pageSize: '20' });
    const invoices = invoicesResponse.items || [];
    
    // Fetch detail and audit logs in parallel
    const details = await Promise.all(
      invoices.map(async (inv) => {
        try {
          const detail = await apiClient.get<{ invoice: any; auditLogs: any[] }>(`/invoices/${inv.invoiceId}`);
          return detail.auditLogs || [];
        } catch {
          return [];
        }
      })
    );
    
    // Flatten and sort by timestamp desc
    const allLogs = details.flat().map(mapBackendAuditToFrontend);
    allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    // Apply filters
    return allLogs.filter((log) => {
      const matchesSearch = !filters.search ||
        log.invoiceId.toLowerCase().includes(filters.search.toLowerCase()) ||
        log.event.toLowerCase().includes(filters.search.toLowerCase()) ||
        log.details.toLowerCase().includes(filters.search.toLowerCase()) ||
        log.user.toLowerCase().includes(filters.search.toLowerCase());
      const matchesType = !filters.eventType || filters.eventType === 'All' || log.eventType === filters.eventType;
      return matchesSearch && matchesType;
    });
  }
}

export function useAuditLogs(invoiceId?: string): UseAuditLogsReturn {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('All');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const doFetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAuditLogs({
        search: searchTerm || undefined,
        eventType: eventTypeFilter,
        invoiceId,
      });
      setLogs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, eventTypeFilter, invoiceId]);

  useEffect(() => {
    doFetch();
  }, [doFetch]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, eventTypeFilter]);

  const total = logs.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const currentPageLogs = logs.slice(start, start + pageSize);

  return {
    logs,
    loading,
    error,
    total,
    searchTerm,
    setSearchTerm,
    eventTypeFilter,
    setEventTypeFilter,
    page,
    setPage,
    pageSize,
    totalPages,
    currentPageLogs,
    refresh: doFetch,
  };
}
