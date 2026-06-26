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
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { getDashboardStats, getInvoices, type DashboardStats } from '@/services/invoiceService';
import { getExceptions } from '@/services/approvalService';
import type { Invoice } from '@/types';
import { StatsCard } from '@/components/StatsCard';
import { PipelineStatus } from '@/components/PipelineStatus';

export default function Dashboard() {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalInvoices: 0,
    processed: 0,
    inProgress: 0,
    exceptions: 0,
    inReview: 0,
    resolved: 0,
    pendingReview: 0,
    processedPercentage: '0',
    exceptionPercentage: '0',
  });
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [topExceptions, setTopExceptions] = useState<{ reason: string; count: number }[]>([]);
  const [chartData, setChartData] = useState<{
    labels: string[];
    processed: number[];
    inProgress: number[];
    exceptions: number[];
    maxVal: number;
  }>({
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Today'],
    processed: [0, 0, 0, 0, 0, 0],
    inProgress: [0, 0, 0, 0, 0, 0],
    exceptions: [0, 0, 0, 0, 0, 0],
    maxVal: 10,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, invoicesData, exceptionsData, allInvoicesResult] = await Promise.all([
        getDashboardStats(),
        getInvoices({ pageSize: 5 }),
        getExceptions(),
        getInvoices({ pageSize: 100 }),
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
        setTopExceptions([]);
      } else {
        setTopExceptions(topList);
      }

      // Compute Chart Data dynamically from last 6 days
      const days = 6;
      const labels: string[] = [];
      const processedCounts: number[] = Array(days).fill(0);
      const inProgressCounts: number[] = Array(days).fill(0);
      const exceptionCountsList: number[] = Array(days).fill(0);

      const today = new Date();
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dayLabel = i === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' });
        labels.push(dayLabel);
      }

      const invoices = allInvoicesResult.data;
      invoices.forEach((inv) => {
        const receivedDate = new Date(inv.receivedOn || inv.createdAt || '');
        const diffTime = today.getTime() - receivedDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays >= 0 && diffDays < days) {
          const index = (days - 1) - diffDays;
          if (inv.status === 'Processed') {
            processedCounts[index]++;
          } else if (inv.status === 'In Progress') {
            inProgressCounts[index]++;
          } else if (inv.status === 'Exception' || inv.status === 'In Review' || inv.status === 'Pending Review') {
            exceptionCountsList[index]++;
          }
        }
      });

      if (false) {
        // Removed mock fallback curve
      } else {
        const maxVal = Math.max(
          10,
          ...processedCounts,
          ...inProgressCounts,
          ...exceptionCountsList
        );
        setChartData({
          labels,
          processed: processedCounts,
          inProgress: inProgressCounts,
          exceptions: exceptionCountsList,
          maxVal: Math.ceil(maxVal * 1.2),
        });
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

  // Set default selected invoice
  useEffect(() => {
    if (recentInvoices.length > 0 && !selectedInvoiceId) {
      setSelectedInvoiceId(recentInvoices[0].invoiceId);
    }
  }, [recentInvoices, selectedInvoiceId]);

  // Auto-poll while invoices are in progress
  useEffect(() => {
    const hasInProgress = recentInvoices.some((inv) => inv.status === 'In Progress');
    if (hasInProgress) {
      const interval = setInterval(() => {
        fetchDashboardData();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [recentInvoices, fetchDashboardData]);

  // Find currently visualized invoice
  const selectedInvoice = recentInvoices.find((inv) => inv.invoiceId === selectedInvoiceId) || recentInvoices[0] || null;



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
        <StatsCard
          title="Total Invoices"
          value={stats.totalInvoices.toLocaleString()}
          icon={FileText}
          iconBgClass="bg-blue-50 dark:bg-blue-500/10"
          iconColorClass="text-blue-600 dark:text-blue-400"
          loading={loading}
          trendText={
            <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-0.5 select-none">
              <TrendingUp className="w-3 h-3" />
              Live <span className="text-muted-foreground font-medium">pipeline feed</span>
            </span>
          }
        />

        <StatsCard
          title="Processed"
          value={stats.processed.toLocaleString()}
          icon={CheckCircle2}
          iconBgClass="bg-emerald-50 dark:bg-emerald-500/10"
          iconColorClass="text-emerald-600 dark:text-emerald-400"
          loading={loading}
          trendText={
            <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5 select-none">
              {stats.processedPercentage}% <span className="text-muted-foreground font-medium">of total</span>
            </span>
          }
        />

        <StatsCard
          title="In Progress"
          value={stats.inProgress.toLocaleString()}
          icon={Clock}
          iconBgClass="bg-amber-50 dark:bg-amber-500/10"
          iconColorClass="text-amber-600 dark:text-amber-400"
          loading={loading}
          trendText={
            <span className="text-[10px] text-amber-600 font-semibold block mt-0.5 select-none">
              Active <span className="text-muted-foreground font-medium">extractions</span>
            </span>
          }
        />

        <StatsCard
          title="Exceptions"
          value={stats.exceptions.toLocaleString()}
          icon={AlertTriangle}
          iconBgClass="bg-red-50 dark:bg-red-500/10"
          iconColorClass="text-red-600 dark:text-red-400"
          loading={loading}
          trendText={
            <span className="text-[10px] text-red-500 font-semibold block mt-0.5 select-none">
              {stats.exceptionPercentage}% <span className="text-muted-foreground font-medium">rate</span>
            </span>
          }
        />

        <StatsCard
          title="Est. Value"
          value={calculateTotalValue()}
          icon={() => (
            <span className="text-lg font-black text-indigo-600 dark:text-indigo-400 select-none">
              ₹
            </span>
          )}
          iconBgClass="bg-indigo-50 dark:bg-indigo-500/10"
          iconColorClass=""
          loading={loading}
          trendText={
            <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-0.5 select-none">
              <TrendingUp className="w-3 h-3" />
              Live <span className="text-muted-foreground font-medium">estimate</span>
            </span>
          }
        />
      </div>

      {/* Row 2: Pipeline flowchart & Line Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Left Card: Invoice Processing Pipeline flowchart */}
        <Card className="lg:col-span-2 border border-border flex flex-col justify-between shadow-sm">
          <CardHeader className="pb-3 select-none">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base font-semibold font-heading">Invoice Processing Pipeline</CardTitle>
                <CardDescription className="text-xs">Processing sequence and stage totals</CardDescription>
              </div>
              {selectedInvoice && (
                <div className="px-3 py-1 bg-muted/60 border border-border rounded-lg text-[11px] font-semibold flex items-center gap-2">
                  <span className="text-muted-foreground">Visualizing Path:</span>
                  <span className="text-primary font-bold">{selectedInvoice.invoiceId}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <StatusBadge status={selectedInvoice.status} />
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <PipelineStatus
              selectedInvoice={selectedInvoice}
              stats={{
                totalInvoices: stats.totalInvoices,
                processed: stats.processed,
                inProgress: stats.inProgress,
                exceptions: stats.exceptions,
                inReview: stats.inReview,
                processedPercentage: stats.processedPercentage,
              }}
              loading={loading}
            />

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
              <text x="30" y="34" className="text-[9px] text-right font-medium fill-muted-foreground" textAnchor="end">{chartData.maxVal}</text>

              <line x1="40" y1="75" x2="480" y2="75" className="stroke-border stroke-1" strokeDasharray="3 3" />
              <text x="30" y="79" className="text-[9px] text-right font-medium fill-muted-foreground" textAnchor="end">{Math.round(chartData.maxVal * 0.75)}</text>

              <line x1="40" y1="120" x2="480" y2="120" className="stroke-border stroke-1" strokeDasharray="3 3" />
              <text x="30" y="124" className="text-[9px] text-right font-medium fill-muted-foreground" textAnchor="end">{Math.round(chartData.maxVal * 0.5)}</text>

              <line x1="40" y1="165" x2="480" y2="165" className="stroke-border stroke-1" strokeDasharray="3 3" />
              <text x="30" y="169" className="text-[9px] text-right font-medium fill-muted-foreground" textAnchor="end">{Math.round(chartData.maxVal * 0.25)}</text>

              <line x1="40" y1="205" x2="480" y2="205" className="stroke-border stroke-1" />
              <text x="30" y="209" className="text-[9px] text-right font-medium fill-muted-foreground" textAnchor="end">0</text>

              {/* Dynamic Curves based on actual numbers */}
              <polyline
                fill="none"
                className="stroke-emerald-500"
                strokeWidth="2.5"
                points={chartData.processed.map((val, i) => `${40 + i * 88},${205 - (val / chartData.maxVal) * 175}`).join(' ')}
              />
              {chartData.processed.map((val, i) => (
                <circle key={`p-${i}`} cx={40 + i * 88} cy={205 - (val / chartData.maxVal) * 175} r="3.5" className="fill-emerald-500 stroke-white stroke-1.5" />
              ))}
              
              <polyline
                fill="none"
                className="stroke-amber-500"
                strokeWidth="2"
                points={chartData.inProgress.map((val, i) => `${40 + i * 88},${205 - (val / chartData.maxVal) * 175}`).join(' ')}
              />
              {chartData.inProgress.map((val, i) => (
                <circle key={`ip-${i}`} cx={40 + i * 88} cy={205 - (val / chartData.maxVal) * 175} r="3" className="fill-amber-500 stroke-white stroke-1" />
              ))}

              <polyline
                fill="none"
                className="stroke-red-500"
                strokeWidth="2"
                points={chartData.exceptions.map((val, i) => `${40 + i * 88},${205 - (val / chartData.maxVal) * 175}`).join(' ')}
              />
              {chartData.exceptions.map((val, i) => (
                <circle key={`ex-${i}`} cx={40 + i * 88} cy={205 - (val / chartData.maxVal) * 175} r="3" className="fill-red-500 stroke-white stroke-1.5" />
              ))}

              {/* X Labels */}
              {chartData.labels.map((label, i) => (
                <text key={i} x={40 + i * 88} y="220" className="text-[9px] font-semibold fill-muted-foreground" textAnchor="middle">{label}</text>
              ))}
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
              <CardDescription className="text-[10px] text-muted-foreground mt-0.5">Click any row to trace its processing path in the flowchart above</CardDescription>
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
                      <tr 
                        key={inv.invoiceId} 
                        onClick={() => setSelectedInvoiceId(inv.invoiceId)}
                        className={`hover:bg-accent/20 transition-colors cursor-pointer ${
                          selectedInvoiceId === inv.invoiceId ? 'bg-primary/5 font-semibold border-l-2 border-primary' : ''
                        }`}
                      >
                        <td className="py-3 px-4 font-semibold text-primary">
                          <div className="flex items-center gap-1">
                            {inv.invoiceId}
                            <ArrowUpRight className="w-3 h-3 text-muted-foreground" />
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium text-foreground">{inv.vendorName}</td>
                        <td className="py-3 px-4 font-medium">
                          ₹ {(inv.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
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
