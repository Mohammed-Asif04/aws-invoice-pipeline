import { Link } from 'react-router-dom';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  Download,
  Upload,
  FileSpreadsheet,
  Brain,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Database,
  Loader2,
} from 'lucide-react';

// ─── Event type badge config ──────────────────────────────────────

const eventTypeConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  ingestion: {
    label: 'Ingestion',
    className: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400',
    icon: <Upload className="w-3 h-3" />,
  },
  extraction: {
    label: 'Extraction',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400',
    icon: <FileSpreadsheet className="w-3 h-3" />,
  },
  validation: {
    label: 'Validation',
    className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400',
    icon: <Brain className="w-3 h-3" />,
  },
  approval: {
    label: 'Approval',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400',
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  rejection: {
    label: 'Rejection',
    className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400',
    icon: <XCircle className="w-3 h-3" />,
  },
  reprocess: {
    label: 'Reprocess',
    className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400',
    icon: <RefreshCw className="w-3 h-3" />,
  },
  persistence: {
    label: 'Persistence',
    className: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-500/10 dark:text-teal-400',
    icon: <Database className="w-3 h-3" />,
  },
};

// ─── Component ────────────────────────────────────────────────────

export default function AuditLogs() {
  const {
    loading,
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
  } = useAuditLogs();

  const formatTimestamp = (ts: string) => {
    const d = new Date(ts);
    const date = d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    return `${date} ${time}`;
  };

  const handleExport = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(currentPageLogs, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `audit_logs_export_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="min-h-screen pb-12">
      <Header
        title="Audit Logs"
        subtitle="Complete audit trail of all invoice processing activities."
      />

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between mb-6">
        <div className="flex flex-1 flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by invoice ID, event, user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 w-full bg-card border border-input rounded-md text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>

          {/* Event Type Filter */}
          <div className="w-full md:w-44 relative">
            <select
              value={eventTypeFilter}
              onChange={(e) => setEventTypeFilter(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-card px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer pr-8"
            >
              <option value="All">All Event Types</option>
              <option value="ingestion">Ingestion</option>
              <option value="extraction">Extraction</option>
              <option value="validation">Validation</option>
              <option value="approval">Approval</option>
              <option value="rejection">Rejection</option>
              <option value="reprocess">Reprocess</option>
              <option value="persistence">Persistence</option>
            </select>
            <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3 top-3 pointer-events-none" />
          </div>
        </div>

        <Button variant="outline" onClick={handleExport} className="h-10 text-sm gap-2">
          <Download className="w-4 h-4" />
          Export Logs
        </Button>
      </div>

      {/* Audit Log Table */}
      <Card className="border border-border shadow-sm">
        <CardHeader className="pb-3 border-b border-border bg-muted/5 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold font-heading select-none">
            Audit Trail ({total} entries)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground gap-2 text-sm">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading audit logs...
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse text-left">
                  <thead>
                    <tr className="border-b border-border bg-muted/10 text-xs font-semibold text-muted-foreground uppercase select-none">
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Invoice ID</th>
                      <th className="py-3 px-4">Event</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {currentPageLogs.map((log) => {
                      const typeConf = eventTypeConfig[log.eventType] || eventTypeConfig.ingestion;
                      return (
                        <tr key={log.id} className="hover:bg-accent/20 transition-colors group">
                          <td className="py-3.5 px-4 text-xs text-muted-foreground font-mono whitespace-nowrap">
                            {formatTimestamp(log.timestamp)}
                          </td>
                          <td className="py-3.5 px-4">
                            <Link
                              to={`/invoices/${log.invoiceId}`}
                              className="font-semibold text-primary hover:underline flex items-center gap-1"
                            >
                              {log.invoiceId}
                              <ArrowUpRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Link>
                          </td>
                          <td className="py-3.5 px-4 font-medium text-foreground max-w-[220px] truncate">
                            {log.event}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${typeConf.className}`}>
                              {typeConf.icon}
                              {typeConf.label}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-xs text-muted-foreground whitespace-nowrap">
                            {log.user}
                          </td>
                          <td className="py-3.5 px-4 text-xs text-muted-foreground max-w-[280px]">
                            <p className="line-clamp-2 leading-relaxed">{log.details}</p>
                            {log.metadata && (
                              <div className="flex flex-wrap gap-1.5 mt-1.5">
                                {Object.entries(log.metadata).slice(0, 2).map(([key, value]) => (
                                  <span
                                    key={key}
                                    className="inline-flex px-1.5 py-0.5 bg-muted/60 text-[9px] font-mono rounded border border-border"
                                  >
                                    {key}: {value.length > 30 ? value.slice(0, 30) + '…' : value}
                                  </span>
                                ))}
                                {Object.keys(log.metadata).length > 2 && (
                                  <span className="text-[9px] text-muted-foreground">
                                    +{Object.keys(log.metadata).length - 2} more
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {currentPageLogs.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-muted-foreground text-sm">
                          No audit logs match your current filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/5 select-none text-xs">
                <span className="text-muted-foreground">
                  Showing <span className="font-medium">{(page - 1) * pageSize + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(page * pageSize, total)}</span> of{' '}
                  <span className="font-medium">{total}</span> results
                </span>
                <div className="flex items-center gap-1.5 font-medium">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>

                  {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => i + 1).map((p) => (
                    <Button
                      key={p}
                      variant={p === page ? 'default' : 'outline'}
                      size="sm"
                      className={`h-7 w-7 p-0 ${p === page ? 'bg-primary text-white' : ''}`}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </Button>
                  ))}

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
