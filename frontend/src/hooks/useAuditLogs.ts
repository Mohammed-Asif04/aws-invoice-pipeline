// useAuditLogs — Custom hook for audit trail data fetching
import { useState, useEffect, useCallback } from 'react';
import type { AuditEntry } from '@/types';
import { apiClient } from '@/services/api';

// Removed mock data per user request

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
    throw new Error('API Base URL is missing. Cannot fetch audit logs.');
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
          if (detail && detail.auditLogs && detail.auditLogs.length > 0) {
            return detail.auditLogs;
          }
          const auditRes = await apiClient.get<{ entries: any[] }>('/audit', { invoiceId: inv.invoiceId });
          return auditRes.entries || [];
        } catch {
          try {
            const auditRes = await apiClient.get<{ entries: any[] }>('/audit', { invoiceId: inv.invoiceId });
            return auditRes.entries || [];
          } catch {
            return [];
          }
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
