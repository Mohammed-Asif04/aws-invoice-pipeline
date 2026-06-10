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
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';

// Recent Invoices Mock Data
const recentInvoices = [
  { id: 'INV-2025-1246', vendor: 'ABC Solutions Ltd.', amount: 124500.00, status: 'Processed' as const, date: 'May 18, 2025 10:23 AM' },
  { id: 'INV-2025-1245', vendor: 'TechCorp India', amount: 98750.00, status: 'In Progress' as const, date: 'May 18, 2025 09:15 AM' },
  { id: 'INV-2025-1244', vendor: 'Global Supplies', amount: 245000.00, status: 'Processed' as const, date: 'May 18, 2025 08:42 AM' },
  { id: 'INV-2025-1243', vendor: 'Office Needs Co.', amount: 15680.00, status: 'Pending Review' as const, date: 'May 17, 2025 06:31 PM' },
  { id: 'INV-2025-1242', vendor: 'Digital Services', amount: 75000.00, status: 'Processed' as const, date: 'May 17, 2025 05:12 PM' },
];

// Top Exceptions Mock Data
const topExceptions = [
  { reason: 'Vendor not found', count: 28 },
  { reason: 'Missing GSTIN', count: 16 },
  { reason: 'Amount mismatch', count: 12 },
  { reason: 'Low confidence score', count: 9 },
  { reason: 'Duplicate invoice', count: 5 },
];

export default function Dashboard() {
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

        {/* Date Selector */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              defaultValue="May 12 - May 18, 2025"
              className="h-9 w-52 rounded-md border border-input bg-background pl-9 pr-8 text-xs font-semibold shadow-sm focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
            >
              <option>May 12 - May 18, 2025</option>
              <option>Last 30 Days</option>
              <option>This Quarter</option>
              <option>Year to Date</option>
            </select>
            <Calendar className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5 pointer-events-none" />
            <ChevronDownIcon className="w-3.5 h-3.5 text-muted-foreground absolute right-3 top-3 pointer-events-none" />
          </div>
        </div>
      </div>

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
                1,246
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-0.5">
                <TrendingUp className="w-3 h-3" />
                12.5% <span className="text-muted-foreground font-medium">vs last 7 days</span>
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
                1,078
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
                86.5% <span className="text-muted-foreground font-medium">of total</span>
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
                98
              </span>
              <span className="text-[10px] text-amber-600 font-semibold block mt-0.5">
                7.9% <span className="text-muted-foreground font-medium">of total</span>
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
                70
              </span>
              <span className="text-[10px] text-red-500 font-semibold block mt-0.5">
                5.6% <span className="text-muted-foreground font-medium">of total</span>
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
                Total Value
              </span>
              <span className="text-2xl font-extrabold text-foreground block tracking-tight">
                ₹ 2.45 Cr
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-0.5">
                <TrendingUp className="w-3 h-3" />
                18.3% <span className="text-muted-foreground font-medium">vs last 7 days</span>
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
                  <p className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">1,246</p>
                </div>
              </div>

              {/* Arrow */}
              <svg className="w-16 h-8 text-muted-foreground/30 self-start mt-[24px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 64 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h56M52 5l8 7-8 7" />
              </svg>

              {/* Node 2 */}
              <div className="flex flex-col items-center text-center space-y-2 flex-1">
                <div className="w-20 h-20 border border-emerald-100 dark:border-emerald-950 bg-emerald-50/10 dark:bg-emerald-950/5 rounded-2xl flex items-center justify-center relative shadow-sm hover:shadow-md transition-shadow">
                  <FileSpreadsheet className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[11px] font-bold text-foreground">2. Document Understanding</p>
                  <p className="text-[10px] text-muted-foreground leading-none">Textract</p>
                  <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">1,246</p>
                </div>
              </div>

              {/* Arrow */}
              <svg className="w-16 h-8 text-muted-foreground/30 self-start mt-[24px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 64 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h56M52 5l8 7-8 7" />
              </svg>

              {/* Node 3 */}
              <div className="flex flex-col items-center text-center space-y-2 flex-1">
                <div className="w-20 h-20 border border-amber-100 dark:border-amber-950 bg-amber-50/10 dark:bg-amber-950/5 rounded-2xl flex items-center justify-center relative shadow-sm hover:shadow-md transition-shadow">
                  <Brain className="w-10 h-10 text-amber-500 dark:text-amber-400" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[11px] font-bold text-foreground">3. Data Extraction & Validation</p>
                  <p className="text-[10px] text-muted-foreground leading-none">Bedrock (LLM)</p>
                  <p className="text-sm font-extrabold text-amber-500 dark:text-amber-400 mt-1">1,178</p>
                </div>
              </div>

              {/* Arrow */}
              <svg className="w-16 h-8 text-muted-foreground/30 self-start mt-[24px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 64 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h56M52 5l8 7-8 7" />
              </svg>

              {/* Node 4 */}
              <div className="flex flex-col items-center text-center space-y-2 flex-1">
                <div className="w-20 h-20 border border-blue-100 dark:border-blue-950 bg-blue-50/10 dark:bg-blue-950/5 rounded-2xl flex items-center justify-center relative shadow-sm hover:shadow-md transition-shadow">
                  <CheckCircle2 className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[11px] font-bold text-foreground">4. Approval Workflow</p>
                  <p className="text-[10px] text-muted-foreground leading-none">Step Functions</p>
                  <p className="text-sm font-extrabold text-blue-600 dark:text-blue-400 mt-1">1,108</p>
                </div>
              </div>

              {/* Arrow */}
              <svg className="w-16 h-8 text-muted-foreground/30 self-start mt-[24px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 64 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h56M52 5l8 7-8 7" />
              </svg>

              {/* Node 5 */}
              <div className="flex flex-col items-center text-center space-y-2 flex-1">
                <div className="w-20 h-20 border border-teal-100 dark:border-teal-950 bg-teal-50/10 dark:bg-teal-950/5 rounded-2xl flex items-center justify-center relative shadow-sm hover:shadow-md transition-shadow">
                  <Database className="w-10 h-10 text-teal-600 dark:text-teal-400" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[11px] font-bold text-foreground">5. Store & Notify</p>
                  <p className="text-[10px] text-muted-foreground leading-none">DynamoDB + SNS</p>
                  <p className="text-sm font-extrabold text-teal-600 dark:text-teal-400 mt-1">1,078</p>
                </div>
              </div>
            </div>

            {/* Health progress bar */}
            <div className="w-full bg-muted/60 h-2.5 rounded-full overflow-hidden select-none">
              <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: '86.5%' }} />
            </div>

            {/* Health indicators */}
            <div className="flex items-center justify-between border-t border-border pt-4 text-xs select-none">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-muted-foreground">Pipeline Health</span>
                <span className="inline-flex px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full dark:bg-emerald-500/10 dark:text-emerald-400">
                  Healthy
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <span>Last updated: 2 min ago</span>
                <button className="hover:text-foreground">
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
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
              {/* Y Grid Lines */}
              <line x1="40" y1="30" x2="480" y2="30" className="stroke-border stroke-1" strokeDasharray="3 3" />
              <text x="30" y="34" className="text-[9px] text-right font-medium fill-muted-foreground" textAnchor="end">500</text>

              <line x1="40" y1="65" x2="480" y2="65" className="stroke-border stroke-1" strokeDasharray="3 3" />
              <text x="30" y="69" className="text-[9px] text-right font-medium fill-muted-foreground" textAnchor="end">400</text>

              <line x1="40" y1="100" x2="480" y2="100" className="stroke-border stroke-1" strokeDasharray="3 3" />
              <text x="30" y="104" className="text-[9px] text-right font-medium fill-muted-foreground" textAnchor="end">300</text>

              <line x1="40" y1="135" x2="480" y2="135" className="stroke-border stroke-1" strokeDasharray="3 3" />
              <text x="30" y="139" className="text-[9px] text-right font-medium fill-muted-foreground" textAnchor="end">200</text>

              <line x1="40" y1="170" x2="480" y2="170" className="stroke-border stroke-1" strokeDasharray="3 3" />
              <text x="30" y="174" className="text-[9px] text-right font-medium fill-muted-foreground" textAnchor="end">100</text>

              <line x1="40" y1="205" x2="480" y2="205" className="stroke-border stroke-1" />
              <text x="30" y="209" className="text-[9px] text-right font-medium fill-muted-foreground" textAnchor="end">0</text>

              {/* Curves / lines */}
              {/* Processed (Green) - coords: (40, 135), (113.3, 100), (186.6, 93), (260, 48), (333.3, 65), (406.6, 100), (480, 128) */}
              <polyline
                fill="none"
                className="stroke-emerald-500"
                strokeWidth="2.5"
                points="40,135 113.3,100 186.6,93 260,48 333.3,65 406.6,100 480,128"
              />
              {/* Dots */}
              <circle cx="40" cy="135" r="4.5" className="fill-emerald-500 stroke-white stroke-2" />
              <circle cx="113.3" cy="100" r="4.5" className="fill-emerald-500 stroke-white stroke-2" />
              <circle cx="186.6" cy="93" r="4.5" className="fill-emerald-500 stroke-white stroke-2" />
              <circle cx="260" cy="48" r="4.5" className="fill-emerald-500 stroke-white stroke-2" />
              <circle cx="333.3" cy="65" r="4.5" className="fill-emerald-500 stroke-white stroke-2" />
              <circle cx="406.6" cy="100" r="4.5" className="fill-emerald-500 stroke-white stroke-2" />
              <circle cx="480" cy="128" r="4.5" className="fill-emerald-500 stroke-white stroke-2" />

              {/* In Progress (Yellow) - coords: (40, 188), (113.3, 184), (186.6, 180), (260, 162), (333.3, 173), (406.6, 180), (480, 176) */}
              <polyline
                fill="none"
                className="stroke-amber-500"
                strokeWidth="2"
                points="40,188 113.3,184 186.6,180 260,162 333.3,173 406.6,180 480,176"
              />
              <circle cx="40" cy="188" r="3.5" className="fill-amber-500 stroke-white stroke-1.5" />
              <circle cx="113.3" cy="184" r="3.5" className="fill-amber-500 stroke-white stroke-1.5" />
              <circle cx="186.6" cy="180" r="3.5" className="fill-amber-500 stroke-white stroke-1.5" />
              <circle cx="260" cy="162" r="3.5" className="fill-amber-500 stroke-white stroke-1.5" />
              <circle cx="333.3" cy="173" r="3.5" className="fill-amber-500 stroke-white stroke-1.5" />
              <circle cx="406.6" cy="180" r="3.5" className="fill-amber-500 stroke-white stroke-1.5" />
              <circle cx="480" cy="176" r="3.5" className="fill-amber-500 stroke-white stroke-1.5" />

              {/* Exceptions (Red) - coords: (40, 201), (113.3, 199), (186.6, 198), (260, 192), (333.3, 196), (406.6, 198), (480, 199) */}
              <polyline
                fill="none"
                className="stroke-red-500"
                strokeWidth="2"
                points="40,201 113.3,199 186.6,198 260,192 333.3,196 406.6,198 480,199"
              />
              <circle cx="40" cy="201" r="3.5" className="fill-red-500 stroke-white stroke-1.5" />
              <circle cx="113.3" cy="199" r="3.5" className="fill-red-500 stroke-white stroke-1.5" />
              <circle cx="186.6" cy="198" r="3.5" className="fill-red-500 stroke-white stroke-1.5" />
              <circle cx="260" cy="192" r="3.5" className="fill-red-500 stroke-white stroke-1.5" />
              <circle cx="333.3" cy="196" r="3.5" className="fill-red-500 stroke-white stroke-1.5" />
              <circle cx="406.6" cy="198" r="3.5" className="fill-red-500 stroke-white stroke-1.5" />
              <circle cx="480" cy="199" r="3.5" className="fill-red-500 stroke-white stroke-1.5" />

              {/* X Labels */}
              <text x="40" y="220" className="text-[9px] font-semibold fill-muted-foreground" textAnchor="middle">May 12</text>
              <text x="113.3" y="220" className="text-[9px] font-semibold fill-muted-foreground" textAnchor="middle">May 13</text>
              <text x="186.6" y="220" className="text-[9px] font-semibold fill-muted-foreground" textAnchor="middle">May 14</text>
              <text x="260" y="220" className="text-[9px] font-semibold fill-muted-foreground" textAnchor="middle">May 15</text>
              <text x="333.3" y="220" className="text-[9px] font-semibold fill-muted-foreground" textAnchor="middle">May 16</text>
              <text x="406.6" y="220" className="text-[9px] font-semibold fill-muted-foreground" textAnchor="middle">May 17</text>
              <text x="480" y="220" className="text-[9px] font-semibold fill-muted-foreground" textAnchor="middle">May 18</text>
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
                    <tr key={inv.id} className="hover:bg-accent/20 transition-colors">
                      <td className="py-3 px-4 font-semibold text-primary">
                        <Link to={`/invoices/${inv.id}`} className="hover:underline flex items-center gap-1">
                          {inv.id}
                          <ArrowUpRight className="w-3 h-3 text-muted-foreground" />
                        </Link>
                      </td>
                      <td className="py-3 px-4 font-medium text-foreground">{inv.vendor}</td>
                      <td className="py-3 px-4 font-medium">
                        ₹ {inv.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{inv.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Simple internal helper component for date dropdown caret
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
