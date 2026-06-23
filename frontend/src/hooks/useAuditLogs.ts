// useAuditLogs — Custom hook for audit trail data fetching
import { useState, useEffect, useCallback } from 'react';
import type { AuditEntry } from '@/types';

// ─── Mock Data ───────────────────────────────────────────────────

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
  {
    id: 'AUD-004', invoiceId: 'INV-2025-1246', event: 'Invoice Approved',
    eventType: 'approval', timestamp: '2025-05-18T11:20:00Z', user: 'Ananya Sharma',
    details: 'Invoice approved by Ananya Sharma (Finance Team). No corrections needed.',
  },
  {
    id: 'AUD-005', invoiceId: 'INV-2025-1246', event: 'Persisted to DynamoDB',
    eventType: 'persistence', timestamp: '2025-05-18T11:20:05Z', user: 'System (Lambda)',
    details: 'Invoice record written to DynamoDB InvoiceRecords table and audit JSON stored in S3.',
    metadata: { dynamoKey: 'INV-2025-1246', s3Key: 's3://invoices-audit-bucket-prod/2025/05/18/abc-inv_final.json' },
  },
  {
    id: 'AUD-006', invoiceId: 'INV-2025-1243', event: 'Invoice Ingested via SES',
    eventType: 'ingestion', timestamp: '2025-05-17T18:31:00Z', user: 'System (SES)',
    details: 'PDF attachment extracted from inbound email and stored in S3 raw bucket.',
    metadata: { s3Key: 's3://invoices-raw-bucket-prod/2025/05/17/officeneeds-inv.pdf' },
  },
  {
    id: 'AUD-007', invoiceId: 'INV-2025-1243', event: 'Textract Extraction Completed',
    eventType: 'extraction', timestamp: '2025-05-17T18:31:14Z', user: 'System (Lambda)',
    details: 'Amazon Textract processed document. GSTIN field not detected (confidence: 0%).',
    metadata: { confidence: '78%', missingFields: 'GSTIN' },
  },
  {
    id: 'AUD-008', invoiceId: 'INV-2025-1243', event: 'Bedrock Validation — Exception Flagged',
    eventType: 'validation', timestamp: '2025-05-17T18:31:22Z', user: 'System (Bedrock)',
    details: 'Missing GSTIN anomaly detected. Invoice routed to human approval workflow.',
    metadata: { anomalyType: 'Missing GSTIN', severity: 'HIGH' },
  },
  {
    id: 'AUD-009', invoiceId: 'INV-2025-1239', event: 'Invoice Ingested via SES',
    eventType: 'ingestion', timestamp: '2025-05-16T14:11:00Z', user: 'System (SES)',
    details: 'PDF attachment extracted from inbound email.',
  },
  {
    id: 'AUD-010', invoiceId: 'INV-2025-1239', event: 'Bedrock Validation — Exception Flagged',
    eventType: 'validation', timestamp: '2025-05-16T14:11:30Z', user: 'System (Bedrock)',
    details: 'Amount Mismatch: line items sum ₹ 45,000.00 ≠ stated total ₹ 45,900.00.',
    metadata: { anomalyType: 'Amount Mismatch', lineItemsSum: '45000', statedTotal: '45900' },
  },
  {
    id: 'AUD-011', invoiceId: 'INV-2025-1207', event: 'Invoice Ingested via Upload',
    eventType: 'ingestion', timestamp: '2025-05-14T09:45:00Z', user: 'Rohit Mehta',
    details: 'Invoice uploaded manually via dashboard UI.',
  },
  {
    id: 'AUD-012', invoiceId: 'INV-2025-1207', event: 'Duplicate Invoice Detected',
    eventType: 'validation', timestamp: '2025-05-14T09:45:25Z', user: 'System (Bedrock)',
    details: 'Invoice matches existing record INV-2025-1195 (same vendor, number, amount). Flagged for review.',
    metadata: { duplicateOf: 'INV-2025-1195', matchedFields: 'vendor, invoiceNumber, amount' },
  },
  {
    id: 'AUD-013', invoiceId: 'INV-2025-1162', event: 'Exception Resolved',
    eventType: 'approval', timestamp: '2025-05-11T14:30:00Z', user: 'Rohit Mehta',
    details: 'Missing GSTIN corrected to 29DIGSR5544B1Z9 and invoice approved.',
    metadata: { correctedField: 'GSTIN', correctedValue: '29DIGSR5544B1Z9' },
  },
  {
    id: 'AUD-014', invoiceId: 'INV-2025-1228', event: 'Reprocess Requested',
    eventType: 'reprocess', timestamp: '2025-05-15T16:00:00Z', user: 'Priya Nair',
    details: 'Vendor name corrected to "Global Supplies LLC" and invoice sent for reprocessing.',
  },
  {
    id: 'AUD-015', invoiceId: 'INV-2025-1244', event: 'Invoice Rejected',
    eventType: 'rejection', timestamp: '2025-05-18T12:00:00Z', user: 'Ananya Sharma',
    details: 'Invoice rejected: suspected fraudulent document. Referred to compliance team.',
  },
];

// ─── Hook ────────────────────────────────────────────────────────

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

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

async function fetchAuditLogs(filters: AuditLogFilters): Promise<AuditEntry[]> {
  // When API is ready: return apiClient.get('/audit-logs', filters);
  await delay(250);
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
