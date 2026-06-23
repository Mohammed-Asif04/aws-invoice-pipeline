import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  TrendingUp,
  Clock,
  Target,
  BarChart3,
  AlertTriangle,
  Building2,
  CheckCircle2,
  Zap,
} from 'lucide-react';

// ─── Mock Analytics Data ──────────────────────────────────────────

const processingTrends = [
  { date: 'May 1', processed: 42, inProgress: 8, exceptions: 3 },
  { date: 'May 5', processed: 58, inProgress: 12, exceptions: 5 },
  { date: 'May 8', processed: 74, inProgress: 10, exceptions: 4 },
  { date: 'May 10', processed: 95, inProgress: 14, exceptions: 7 },
  { date: 'May 12', processed: 110, inProgress: 11, exceptions: 6 },
  { date: 'May 14', processed: 128, inProgress: 15, exceptions: 8 },
  { date: 'May 16', processed: 142, inProgress: 9, exceptions: 5 },
  { date: 'May 18', processed: 155, inProgress: 13, exceptions: 4 },
];

const exceptionBreakdown = [
  { type: 'Vendor Not Found', count: 28, percentage: 40, color: 'bg-purple-500' },
  { type: 'Missing GSTIN', count: 16, percentage: 22.9, color: 'bg-red-500' },
  { type: 'Amount Mismatch', count: 12, percentage: 17.1, color: 'bg-amber-500' },
  { type: 'Low Confidence', count: 9, percentage: 12.9, color: 'bg-orange-500' },
  { type: 'Duplicate Invoice', count: 5, percentage: 7.1, color: 'bg-blue-500' },
];

const vendorMetrics = [
  { vendor: 'ABC Solutions Ltd.', invoices: 145, value: 4850000, confidence: 96.2, successRate: 94.5 },
  { vendor: 'TechCorp India', invoices: 128, value: 3920000, confidence: 93.8, successRate: 91.4 },
  { vendor: 'Global Supplies', invoices: 112, value: 5120000, confidence: 94.5, successRate: 89.3 },
  { vendor: 'Office Needs Co.', invoices: 98, value: 1560000, confidence: 88.7, successRate: 85.7 },
  { vendor: 'Digital Services', invoices: 87, value: 2340000, confidence: 95.1, successRate: 93.1 },
  { vendor: 'BufferOn Pvt. Ltd.', invoices: 76, value: 1890000, confidence: 91.4, successRate: 90.8 },
];

const stageMetrics = [
  { stage: 'Upload (S3)', avgMs: 1200, p95Ms: 2800, icon: '📤', barColor: 'bg-indigo-500' },
  { stage: 'Textract', avgMs: 3400, p95Ms: 8200, icon: '📄', barColor: 'bg-emerald-500' },
  { stage: 'Bedrock Validation', avgMs: 4800, p95Ms: 12000, icon: '🧠', barColor: 'bg-amber-500' },
  { stage: 'Approval Workflow', avgMs: 28800000, p95Ms: 86400000, icon: '✅', barColor: 'bg-blue-500' },
  { stage: 'Store & Notify', avgMs: 800, p95Ms: 1500, icon: '💾', barColor: 'bg-teal-500' },
];

const monthlyVolume = [
  { month: 'Jan', count: 156, value: 2.1 },
  { month: 'Feb', count: 142, value: 1.9 },
  { month: 'Mar', count: 189, value: 2.5 },
  { month: 'Apr', count: 205, value: 2.8 },
  { month: 'May', count: 248, value: 3.2 },
];

// ─── Helpers ──────────────────────────────────────────────────────

function formatMs(ms: number): string {
  if (ms >= 86400000) return `${(ms / 86400000).toFixed(1)}d`;
  if (ms >= 3600000) return `${(ms / 3600000).toFixed(1)}h`;
  if (ms >= 60000) return `${(ms / 60000).toFixed(1)}m`;
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${ms}ms`;
}

// ─── Component ────────────────────────────────────────────────────

export default function Analytics() {
  // Calculate chart dimensions
  const trendMax = Math.max(...processingTrends.map((d) => d.processed + d.inProgress + d.exceptions));
  const barMax = stageMetrics.reduce((max, s) => Math.max(max, s.p95Ms), 0);

  return (
    <div className="min-h-screen pb-12">
      <Header
        title="Analytics"
        subtitle="Track processing trends, exception patterns, and system performance metrics."
      />

      {/* Row 1: KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="border border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Avg Processing Time</span>
              <span className="text-2xl font-extrabold text-foreground block tracking-tight">4.2s</span>
              <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-0.5">
                <TrendingUp className="w-3 h-3" /> 15% faster <span className="text-muted-foreground font-medium">vs last month</span>
              </span>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
              <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Success Rate</span>
              <span className="text-2xl font-extrabold text-foreground block tracking-tight">91.2%</span>
              <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-0.5">
                <TrendingUp className="w-3 h-3" /> 2.3% <span className="text-muted-foreground font-medium">vs last month</span>
              </span>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl">
              <Target className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Avg Confidence</span>
              <span className="text-2xl font-extrabold text-foreground block tracking-tight">93.4%</span>
              <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-0.5">
                <TrendingUp className="w-3 h-3" /> 1.1% <span className="text-muted-foreground font-medium">vs last month</span>
              </span>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-xl">
              <Zap className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Total Value Processed</span>
              <span className="text-2xl font-extrabold text-foreground block tracking-tight">₹ 12.5 Cr</span>
              <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-0.5">
                <TrendingUp className="w-3 h-3" /> 24% <span className="text-muted-foreground font-medium">vs last month</span>
              </span>
            </div>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl">
              <span className="text-lg font-black text-indigo-600 dark:text-indigo-400 select-none">₹</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Processing Trends + Exception Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Processing Trends Line Chart */}
        <Card className="lg:col-span-2 border border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold font-heading flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Processing Trends
            </CardTitle>
            <CardDescription className="text-xs">Invoices processed per day over the last 18 days</CardDescription>
            <div className="flex items-center gap-3 mt-1.5 text-[10px] font-semibold select-none">
              <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block" /><span className="text-muted-foreground">Processed</span></div>
              <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-amber-500 rounded-full inline-block" /><span className="text-muted-foreground">In Progress</span></div>
              <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-red-500 rounded-full inline-block" /><span className="text-muted-foreground">Exceptions</span></div>
            </div>
          </CardHeader>
          <CardContent className="pt-2 pb-4">
            <svg viewBox="0 0 500 200" className="w-full h-full text-muted-foreground select-none overflow-visible">
              {/* Grid lines */}
              {[0, 1, 2, 3, 4].map((i) => {
                const y = 30 + i * 40;
                const label = Math.round(trendMax - (i * trendMax) / 4);
                return (
                  <g key={i}>
                    <line x1="40" y1={y} x2="480" y2={y} className="stroke-border stroke-1" strokeDasharray="3 3" />
                    <text x="30" y={y + 4} className="text-[9px] text-right font-medium fill-muted-foreground" textAnchor="end">{label}</text>
                  </g>
                );
              })}

              {/* Processed line */}
              <polyline
                fill="none"
                className="stroke-emerald-500"
                strokeWidth="2.5"
                points={processingTrends.map((d, i) => {
                  const x = 40 + (i * 440) / (processingTrends.length - 1);
                  const y = 190 - (d.processed / trendMax) * 160;
                  return `${x},${y}`;
                }).join(' ')}
              />
              {processingTrends.map((d, i) => {
                const x = 40 + (i * 440) / (processingTrends.length - 1);
                const y = 190 - (d.processed / trendMax) * 160;
                return <circle key={`p-${i}`} cx={x} cy={y} r="4" className="fill-emerald-500 stroke-white stroke-2" />;
              })}

              {/* In Progress line */}
              <polyline
                fill="none"
                className="stroke-amber-500"
                strokeWidth="2"
                points={processingTrends.map((d, i) => {
                  const x = 40 + (i * 440) / (processingTrends.length - 1);
                  const y = 190 - (d.inProgress / trendMax) * 160;
                  return `${x},${y}`;
                }).join(' ')}
              />
              {processingTrends.map((d, i) => {
                const x = 40 + (i * 440) / (processingTrends.length - 1);
                const y = 190 - (d.inProgress / trendMax) * 160;
                return <circle key={`ip-${i}`} cx={x} cy={y} r="3" className="fill-amber-500 stroke-white stroke-1.5" />;
              })}

              {/* Exceptions line */}
              <polyline
                fill="none"
                className="stroke-red-500"
                strokeWidth="2"
                points={processingTrends.map((d, i) => {
                  const x = 40 + (i * 440) / (processingTrends.length - 1);
                  const y = 190 - (d.exceptions / trendMax) * 160;
                  return `${x},${y}`;
                }).join(' ')}
              />
              {processingTrends.map((d, i) => {
                const x = 40 + (i * 440) / (processingTrends.length - 1);
                const y = 190 - (d.exceptions / trendMax) * 160;
                return <circle key={`e-${i}`} cx={x} cy={y} r="3" className="fill-red-500 stroke-white stroke-1.5" />;
              })}

              {/* X labels */}
              {processingTrends.map((d, i) => {
                const x = 40 + (i * 440) / (processingTrends.length - 1);
                return <text key={`xl-${i}`} x={x} y={205} className="text-[8px] font-semibold fill-muted-foreground" textAnchor="middle">{d.date}</text>;
              })}
            </svg>
          </CardContent>
        </Card>

        {/* Exception Breakdown */}
        <Card className="border border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold font-heading flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Exception Breakdown
            </CardTitle>
            <CardDescription className="text-xs">Distribution of exception types</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Donut-style visual using stacked bars */}
            <div className="flex items-center gap-2 h-5 rounded-full overflow-hidden bg-muted/50">
              {exceptionBreakdown.map((item, i) => (
                <div
                  key={i}
                  className={`h-full ${item.color} transition-all duration-700`}
                  style={{ width: `${item.percentage}%` }}
                />
              ))}
            </div>

            <div className="space-y-2.5 pt-2">
              {exceptionBreakdown.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${item.color} inline-block`} />
                    <span className="font-medium text-foreground">{item.type}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-foreground">{item.count}</span>
                    <span className="text-muted-foreground w-12 text-right">{item.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-border flex justify-between text-xs font-bold text-foreground">
              <span>Total Exceptions</span>
              <span>70</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Vendor Performance + Processing Time by Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Vendor Performance */}
        <Card className="lg:col-span-2 border border-border shadow-sm">
          <CardHeader className="pb-3 border-b border-border bg-muted/5">
            <CardTitle className="text-base font-semibold font-heading flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Vendor Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-border bg-muted/10 font-semibold text-muted-foreground uppercase select-none">
                    <th className="py-3 px-4">Vendor</th>
                    <th className="py-3 px-4 text-center">Invoices</th>
                    <th className="py-3 px-4 text-right">Total Value</th>
                    <th className="py-3 px-4 text-center">Avg Confidence</th>
                    <th className="py-3 px-4 text-center">Success Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {vendorMetrics.map((v, i) => (
                    <tr key={i} className="hover:bg-accent/20 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-foreground">{v.vendor}</td>
                      <td className="py-3.5 px-4 text-center font-medium">{v.invoices}</td>
                      <td className="py-3.5 px-4 text-right font-medium">
                        ₹ {(v.value / 100000).toFixed(1)}L
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <div className="w-16 bg-muted rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                v.confidence >= 95 ? 'bg-emerald-500' : v.confidence >= 90 ? 'bg-amber-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${v.confidence}%` }}
                            />
                          </div>
                          <span className="font-semibold text-foreground">{v.confidence}%</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          v.successRate >= 92
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : v.successRate >= 88
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          {v.successRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Processing Time by Stage */}
        <Card className="border border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold font-heading flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Processing Time by Stage
            </CardTitle>
            <CardDescription className="text-xs">Avg and P95 latency per pipeline stage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stageMetrics.filter((_, i) => i < 3).map((stage, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground flex items-center gap-1.5">
                    <span>{stage.icon}</span> {stage.stage}
                  </span>
                  <span className="text-muted-foreground">
                    avg: <span className="font-semibold text-foreground">{formatMs(stage.avgMs)}</span>
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${stage.barColor}`}
                    style={{ width: `${Math.min((stage.p95Ms / barMax) * 100, 100)}%` }}
                  />
                </div>
                <div className="text-[10px] text-muted-foreground text-right">
                  P95: {formatMs(stage.p95Ms)}
                </div>
              </div>
            ))}

            <div className="pt-3 border-t border-border space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground flex items-center gap-1.5">
                  <span>💾</span> Store & Notify
                </span>
                <span className="text-muted-foreground">
                  avg: <span className="font-semibold text-foreground">{formatMs(800)}</span>
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div className="h-full rounded-full bg-teal-500 transition-all duration-700" style={{ width: '4%' }} />
              </div>
              <div className="text-[10px] text-muted-foreground text-right">P95: {formatMs(1500)}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 4: Monthly Volume */}
      <Card className="border border-border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold font-heading flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            Monthly Invoice Volume
          </CardTitle>
          <CardDescription className="text-xs">Invoice count and value by month (2025)</CardDescription>
        </CardHeader>
        <CardContent className="pt-2 pb-4">
          <div className="flex items-end justify-between gap-4 h-40 px-4">
            {monthlyVolume.map((m, i) => {
              const maxCount = Math.max(...monthlyVolume.map((x) => x.count));
              const heightPct = (m.count / maxCount) * 100;
              return (
                <div key={i} className="flex flex-col items-center gap-2 flex-1">
                  <span className="text-[10px] font-bold text-foreground">{m.count}</span>
                  <div className="w-full relative" style={{ height: `${heightPct}%`, minHeight: '12px' }}>
                    <div className="absolute inset-0 bg-primary/20 rounded-t-lg border border-primary/30 hover:bg-primary/30 transition-colors cursor-pointer group">
                      <div
                        className="absolute bottom-0 left-0 right-0 bg-primary rounded-t-lg transition-all duration-500"
                        style={{ height: `${(m.value / 3.5) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-muted-foreground">{m.month}</span>
                  <span className="text-[9px] text-muted-foreground">₹{m.value}Cr</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
