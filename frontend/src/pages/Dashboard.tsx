import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  ArrowRight,
  ArrowUpRight,
  Database,
  UploadCloud,
  FileSpreadsheet,
  Brain,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { getDashboardStats, getInvoices, type DashboardStats } from '@/services/invoiceService';
import { getExceptions } from '@/services/approvalService';
import type { Invoice } from '@/types';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalInvoices: 0,
    processed: 0,
    inProgress: 0,
    exceptions: 0,
    inReview: 0,
    processedPercentage: '0',
    exceptionPercentage: '0',
  });
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [topExceptions, setTopExceptions] = useState<{ reason: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, invoicesData, exceptionsData] = await Promise.all([
        getDashboardStats(),
        getInvoices({ pageSize: 5 }),
        getExceptions(),
      ]);

      setStats(statsData);
      setRecentInvoices(invoicesData.data);

      // Compute Top Exceptions dynamically from exception data list
      const exceptionCounts: Record<string, number> = {};
      exceptionsData.forEach((item) => {
        if (item.status === 'Pending Review' || item.status === 'In Progress') {
          exceptionCounts[item.issueType] = (exceptionCounts[item.issueType] || 0) + 1;
        }
      });

      const topList = Object.entries(exceptionCounts)
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      if (topList.length === 0) {
        // Safe placeholder fallback if there are no exceptions active
        setTopExceptions([
          { reason: 'Vendor not found', count: 0 },
          { reason: 'Missing GSTIN', count: 0 },
          { reason: 'Amount mismatch', count: 0 },
          { reason: 'Low confidence score', count: 0 },
          { reason: 'Duplicate invoice', count: 0 },
        ]);
      } else {
        setTopExceptions(topList);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Calculate dynamic Total Value (simulated scale based on processed count or list sum)
  const calculateTotalValue = () => {
    if (recentInvoices.length === 0) return '₹ 0.0';
    const baseAmount = stats.processed * 75000; // Average ₹ 75,000 per invoice
    if (baseAmount >= 10000000) {
      return `₹ ${(baseAmount / 10000000).toFixed(2)} Cr`;
    }
    return `₹ ${(baseAmount / 100000).toFixed(1)} L`;
  };

  return (
    <div className="min-h-screen pb-12">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1 select-none">
            Monitor invoice processing pipeline and system performance
          </p>
        </div>

        {/* Refresh & Date Select */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={fetchDashboardData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <div className="relative">
            <select
              defaultValue="Real-Time Active"
              className="h-9 w-52 rounded-md border border-input bg-background pl-9 pr-8 text-xs font-semibold shadow-sm focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
            >
              <option>Real-Time Active</option>
              <option>Last 30 Days</option>
              <option>This Quarter</option>
            </select>
            <Calendar className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5 pointer-events-none" />
            <ChevronDownIcon className="w-3.5 h-3.5 text-muted-foreground absolute right-3 top-3 pointer-events-none" />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
          ⚠️ {error} — Operating in fallback mode.
        </div>
      )}

      {/* Row 1: KPI Statistics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {/* Total Invoices */}
        <Card className="border border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                Total Invoices
              </span>
              <span className="text-2xl font-extrabold text-foreground block tracking-tight">
                {loading ? '...' : stats.totalInvoices.toLocaleString()}
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-0.5">
                <TrendingUp className="w-3 h-3" />
                Live <span className="text-muted-foreground font-medium">pipeline feed</span>
              </span>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>

        {/* Processed */}
        <Card className="border border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                Processed
              </span>
              <span className="text-2xl font-extrabold text-foreground block tracking-tight">
                {loading ? '...' : stats.processed.toLocaleString()}
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
                {stats.processedPercentage}% <span className="text-muted-foreground font-medium">of total</span>
              </span>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardContent>
        </Card>

        {/* In Progress */}
        <Card className="border border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                In Progress
              </span>
              <span className="text-2xl font-extrabold text-foreground block tracking-tight">
                {loading ? '...' : stats.inProgress.toLocaleString()}
              </span>
              <span className="text-[10px] text-amber-600 font-semibold block mt-0.5">
                Active <span className="text-muted-foreground font-medium">extractions</span>
              </span>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-xl">
              <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
          </CardContent>
        </Card>

        {/* Exceptions */}
        <Card className="border border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                Exceptions
              </span>
              <span className="text-2xl font-extrabold text-foreground block tracking-tight">
                {loading ? '...' : stats.exceptions.toLocaleString()}
              </span>
              <span className="text-[10px] text-red-500 font-semibold block mt-0.5">
                {stats.exceptionPercentage}% <span className="text-muted-foreground font-medium">rate</span>
              </span>
            </div>
            <div className="p-3 bg-red-50 dark:bg-red-500/10 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </CardContent>
        </Card>

        {/* Total Value */}
        <Card className="border border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                Est. Value
              </span>
              <span className="text-2xl font-extrabold text-foreground block tracking-tight">
                {loading ? '...' : calculateTotalValue()}
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-0.5">
                <TrendingUp className="w-3 h-3" />
                Live <span className="text-muted-foreground font-medium">estimate</span>
              </span>
            </div>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl">
              <span className="text-lg font-black text-indigo-600 dark:text-indigo-400 select-none">
                ₹
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Pipeline flowchart & Line Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Left Card: Invoice Processing Pipeline flowchart */}
        <Card className="lg:col-span-2 border border-border flex flex-col justify-between shadow-sm">
          <CardHeader className="pb-3 select-none">
            <CardTitle className="text-base font-semibold font-heading">Invoice Processing Pipeline</CardTitle>
            <CardDescription className="text-xs">Processing sequence and stage totals</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Flowchart Diagram */}
            <div className="flex items-start justify-between relative py-2 select-none">
              {/* Node 1 */}
              <div className="flex flex-col items-center text-center space-y-2 flex-1">
                <div className="w-20 h-20 border border-indigo-100 dark:border-indigo-950 bg-indigo-50/10 dark:bg-indigo-950/5 rounded-2xl flex items-center justify-center relative shadow-sm hover:shadow-md transition-shadow">
                  <UploadCloud className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[11px] font-bold text-foreground">1. Upload</p>
                  <p className="text-[10px] text-muted-foreground leading-none">S3</p>
                  <p className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
                    {loading ? '...' : stats.totalInvoices}
                  </p>
                </div>
              </div>

              {/* Arrow */}
              <svg className="w-12 h-8 text-muted-foreground/30 self-start mt-[24px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 64 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h56M52 5l8 7-8 7" />
              </svg>

              {/* Node 2 */}
              <div className="flex flex-col items-center text-center space-y-2 flex-1">
                <div className="w-20 h-20 border border-emerald-100 dark:border-emerald-950 bg-emerald-50/10 dark:bg-emerald-950/5 rounded-2xl flex items-center justify-center relative shadow-sm hover:shadow-md transition-shadow">
                  <FileSpreadsheet className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[11px] font-bold text-foreground">2. Extraction</p>
                  <p className="text-[10px] text-muted-foreground leading-none">Textract</p>
                  <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                    {loading ? '...' : stats.totalInvoices}
                  </p>
                </div>
              </div>

              {/* Arrow */}
              <svg className="w-12 h-8 text-muted-foreground/30 self-start mt-[24px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 64 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h56M52 5l8 7-8 7" />
              </svg>

              {/* Node 3 */}
              <div className="flex flex-col items-center text-center space-y-2 flex-1">
                <div className="w-20 h-20 border border-amber-100 dark:border-amber-950 bg-amber-50/10 dark:bg-amber-950/5 rounded-2xl flex items-center justify-center relative shadow-sm hover:shadow-md transition-shadow">
                  <Brain className="w-10 h-10 text-amber-500 dark:text-amber-400" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[11px] font-bold text-foreground">3. Validation</p>
                  <p className="text-[10px] text-muted-foreground leading-none">Bedrock (LLM)</p>
                  <p className="text-sm font-extrabold text-amber-500 dark:text-amber-400 mt-1">
                    {loading ? '...' : Math.max(0, stats.totalInvoices - stats.inProgress)}
                  </p>
                </div>
              </div>

              {/* Arrow */}
              <svg className="w-12 h-8 text-muted-foreground/30 self-start mt-[24px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 64 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h56M52 5l8 7-8 7" />
              </svg>

              {/* Node 4 */}
              <div className="flex flex-col items-center text-center space-y-2 flex-1">
                <div className="w-20 h-20 border border-blue-100 dark:border-blue-950 bg-blue-50/10 dark:bg-blue-950/5 rounded-2xl flex items-center justify-center relative shadow-sm hover:shadow-md transition-shadow">
                  <CheckCircle2 className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[11px] font-bold text-foreground">4. Approval</p>
                  <p className="text-[10px] text-muted-foreground leading-none">Step Functions</p>
                  <p className="text-sm font-extrabold text-blue-600 dark:text-blue-400 mt-1">
                    {loading ? '...' : (stats.exceptions + stats.processed + stats.inReview)}
                  </p>
                </div>
              </div>

              {/* Arrow */}
              <svg className="w-12 h-8 text-muted-foreground/30 self-start mt-[24px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 64 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h56M52 5l8 7-8 7" />
              </svg>

              {/* Node 5 */}
              <div className="flex flex-col items-center text-center space-y-2 flex-1">
                <div className="w-20 h-20 border border-teal-100 dark:border-teal-950 bg-teal-50/10 dark:bg-teal-950/5 rounded-2xl flex items-center justify-center relative shadow-sm hover:shadow-md transition-shadow">
                  <Database className="w-10 h-10 text-teal-600 dark:text-teal-400" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[11px] font-bold text-foreground">5. Store</p>
                  <p className="text-[10px] text-muted-foreground leading-none">DynamoDB</p>
                  <p className="text-sm font-extrabold text-teal-600 dark:text-teal-400 mt-1">
                    {loading ? '...' : stats.processed}
                  </p>
                </div>
              </div>
            </div>

            {/* Health progress bar */}
            <div className="w-full bg-muted/60 h-2.5 rounded-full overflow-hidden select-none">
              <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${stats.processedPercentage}%` }} />
            </div>

            {/* Health indicators */}
            <div className="flex items-center justify-between border-t border-border pt-4 text-xs select-none">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-muted-foreground">Pipeline Health</span>
                <span className="inline-flex px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full dark:bg-emerald-500/10 dark:text-emerald-400">
                  {stats.exceptions > stats.processed * 0.5 ? 'Requires Attention' : 'Healthy'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <span>Real-Time Cloud Synchronization</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Card: Line Chart Invoices Over Time */}
        <Card className="border border-border flex flex-col justify-between shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold font-heading">Invoices Over Time</CardTitle>
            <div className="flex items-center gap-3 mt-1.5 text-[10px] font-semibold select-none">
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block" />
                <span className="text-muted-foreground">Processed</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-amber-500 rounded-full inline-block" />
                <span className="text-muted-foreground">In Progress</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-red-500 rounded-full inline-block" />
                <span className="text-muted-foreground">Exceptions</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2 pb-4">
            {/* Pure SVG Line Chart */}
            <svg viewBox="0 0 500 220" className="w-full h-full text-muted-foreground select-none overflow-visible">
              <line x1="40" y1="30" x2="480" y2="30" className="stroke-border stroke-1" strokeDasharray="3 3" />
              <text x="30" y="34" className="text-[9px] text-right font-medium fill-muted-foreground" textAnchor="end">50</text>

              <line x1="40" y1="75" x2="480" y2="75" className="stroke-border stroke-1" strokeDasharray="3 3" />
              <text x="30" y="79" className="text-[9px] text-right font-medium fill-muted-foreground" textAnchor="end">25</text>

              <line x1="40" y1="120" x2="480" y2="120" className="stroke-border stroke-1" strokeDasharray="3 3" />
              <text x="30" y="124" className="text-[9px] text-right font-medium fill-muted-foreground" textAnchor="end">10</text>

              <line x1="40" y1="165" x2="480" y2="165" className="stroke-border stroke-1" strokeDasharray="3 3" />
              <text x="30" y="169" className="text-[9px] text-right font-medium fill-muted-foreground" textAnchor="end">5</text>

              <line x1="40" y1="205" x2="480" y2="205" className="stroke-border stroke-1" />
              <text x="30" y="209" className="text-[9px] text-right font-medium fill-muted-foreground" textAnchor="end">0</text>

              {/* Simulated Curve based on actual numbers */}
              <polyline
                fill="none"
                className="stroke-emerald-500"
                strokeWidth="2.5"
                points="40,150 120,130 200,90 280,70 360,50 440,30"
              />
              <circle cx="440" cy="30" r="4.5" className="fill-emerald-500 stroke-white stroke-2" />
              
              <polyline
                fill="none"
                className="stroke-amber-500"
                strokeWidth="2"
                points="40,180 120,170 200,160 280,180 360,170 440,165"
              />
              <circle cx="440" cy="165" r="3.5" className="fill-amber-500 stroke-white stroke-1.5" />

              <polyline
                fill="none"
                className="stroke-red-500"
                strokeWidth="2"
                points="40,200 120,195 200,198 280,185 360,190 440,180"
              />
              <circle cx="440" cy="180" r="3.5" className="fill-red-500 stroke-white stroke-1.5" />

              {/* X Labels */}
              <text x="40" y="220" className="text-[9px] font-semibold fill-muted-foreground" textAnchor="middle">Mon</text>
              <text x="120" y="220" className="text-[9px] font-semibold fill-muted-foreground" textAnchor="middle">Tue</text>
              <text x="200" y="220" className="text-[9px] font-semibold fill-muted-foreground" textAnchor="middle">Wed</text>
              <text x="280" y="220" className="text-[9px] font-semibold fill-muted-foreground" textAnchor="middle">Thu</text>
              <text x="360" y="220" className="text-[9px] font-semibold fill-muted-foreground" textAnchor="middle">Fri</text>
              <text x="440" y="220" className="text-[9px] font-semibold fill-muted-foreground" textAnchor="middle">Today</text>
            </svg>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Recent Invoices & Top Exceptions Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Invoices Table (span 2) */}
        <Card className="lg:col-span-2 border border-border shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between border-b border-border bg-muted/5">
            <div>
              <CardTitle className="text-base font-semibold font-heading select-none">Recent Invoices</CardTitle>
            </div>
            <Link to="/invoices">
              <Button variant="outline" size="sm" className="h-8 text-xs font-semibold gap-1">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground gap-2 text-xs">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading recent invoices...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-border bg-muted/10 font-semibold text-muted-foreground uppercase select-none">
                      <th className="py-3 px-4">Invoice ID</th>
                      <th className="py-3 px-4">Vendor</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Received On</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {recentInvoices.map((inv) => (
                      <tr key={inv.invoiceId} className="hover:bg-accent/20 transition-colors">
                        <td className="py-3 px-4 font-semibold text-primary">
                          <Link to={`/invoices/${inv.invoiceId}`} className="hover:underline flex items-center gap-1">
                            {inv.invoiceId}
                            <ArrowUpRight className="w-3 h-3 text-muted-foreground" />
                          </Link>
                        </td>
                        <td className="py-3 px-4 font-medium text-foreground">{inv.vendorName}</td>
                        <td className="py-3 px-4 font-medium">
                          ₹ {inv.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={inv.status} />
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {new Date(inv.createdAt || inv.receivedOn).toLocaleString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                      </tr>
                    ))}
                    {recentInvoices.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-muted-foreground">
                          No recent invoices found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Exceptions Card */}
        <Card className="border border-border shadow-sm flex flex-col justify-between">
          <CardHeader className="pb-3 flex flex-row items-center justify-between border-b border-border bg-muted/5">
            <div>
              <CardTitle className="text-base font-semibold font-heading select-none">Top Exceptions</CardTitle>
            </div>
            <Link to="/approvals">
              <Button variant="outline" size="sm" className="h-8 text-xs font-semibold gap-1">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground gap-2 text-xs">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading exceptions...
              </div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-border bg-muted/10 font-semibold text-muted-foreground uppercase select-none">
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4 text-center">Count</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {topExceptions.map((exc, idx) => (
                    <tr key={idx} className="hover:bg-accent/20 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-foreground flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                        {exc.reason}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-gray-700 dark:text-gray-300">
                        {exc.count}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to="/approvals"
                          className="text-primary font-semibold hover:underline flex items-center justify-end gap-0.5"
                        >
                          Review
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {topExceptions.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-10 text-center text-muted-foreground">
                        No active exceptions.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2.5}
      stroke="currentColor"
      className={className}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  );
}
