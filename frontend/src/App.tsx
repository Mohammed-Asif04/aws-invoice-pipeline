import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import UploadInvoice from '@/pages/UploadInvoice';
import InvoiceList from '@/pages/InvoiceList';
import { TooltipProvider } from '@/components/ui/tooltip';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';

// Temporary Mock Dashboard Component
function Dashboard() {
  const stats = [
    { label: 'Total Invoices', value: '1,248', icon: FileText, change: '+12% this month', color: 'text-blue-600 bg-blue-50' },
    { label: 'In Progress', value: '42', icon: Clock, change: '15 files scanning', color: 'text-amber-600 bg-amber-50' },
    { label: 'Pending Exceptions', value: '7', icon: AlertTriangle, change: 'Requires review', color: 'text-rose-600 bg-rose-50' },
    { label: 'Processed Successfully', value: '1,199', icon: CheckCircle, change: '96.2% success rate', color: 'text-emerald-600 bg-emerald-50' },
  ];

  const recentInvoices = [
    { id: 'INV-2025-1246', vendor: 'ABC Solutions Ltd.', amount: '₹ 1,42,190.00', status: 'In Review', date: 'May 18, 2025' },
    { id: 'INV-2025-1245', vendor: 'TechCorp India', amount: '₹ 85,200.00', status: 'Processed', date: 'May 17, 2025' },
    { id: 'INV-2025-1244', vendor: 'Global Supplies', amount: '₹ 2,10,000.00', status: 'Exception', date: 'May 15, 2025' },
    { id: 'INV-2025-1243', vendor: 'Office Needs Co.', amount: '₹ 12,450.00', status: 'Processed', date: 'May 14, 2025' },
  ];

  return (
    <div>
      <Header title="Dashboard" subtitle="Overview of your intelligent invoice processing pipeline." />
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, i) => (
          <Card key={i} className="border border-border">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold font-heading">{stat.value}</p>
                <p className="text-[11px] text-muted-foreground">{stat.change}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Invoices Table */}
        <Card className="lg:col-span-2 border border-border">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold font-heading">Recent Invoices</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs text-primary gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-xs font-semibold text-muted-foreground">
                    <th className="text-left py-3 px-4">Invoice ID</th>
                    <th className="text-left py-3 px-4">Vendor</th>
                    <th className="text-left py-3 px-4">Amount</th>
                    <th className="text-left py-3 px-4">Date</th>
                    <th className="text-left py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-accent/40 transition-colors">
                      <td className="py-3 px-4 font-semibold text-primary">{inv.id}</td>
                      <td className="py-3 px-4 font-medium">{inv.vendor}</td>
                      <td className="py-3 px-4">{inv.amount}</td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">{inv.date}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={inv.status as any} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Pipeline Health & Accuracy */}
        <Card className="border border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold font-heading">Pipeline Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted/40 rounded-xl space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium">Extraction Accuracy</span>
                <span className="font-bold text-emerald-600">98.4%</span>
              </div>
              <div className="w-full bg-border h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '98.4%' }} />
              </div>
            </div>

            <div className="p-4 bg-muted/40 rounded-xl space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium">Straight-Through Processing</span>
                <span className="font-bold text-primary">84.2%</span>
              </div>
              <div className="w-full bg-border h-2 rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full" style={{ width: '84.2%' }} />
              </div>
            </div>

            <div className="p-3 border border-dashed border-border rounded-xl flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold">Active Alerts</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  3 exceptions require urgent human intervention for vendor GSTIN mismatches.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Simple Placeholder Page wrapper
function PagePlaceholder({ title }: { title: string }) {
  return (
    <div>
      <Header title={title} subtitle={`Manage your invoice pipelines and view details related to ${title.toLowerCase()}.`} />
      <Card className="border border-border">
        <CardContent className="p-8 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-primary/8 flex items-center justify-center text-primary mb-4">
            <FileText className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold font-heading">{title} Page</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            This module is part of the AWS Invoice Processing Pipeline system. The fully integrated page layout, sidebar structure, and style tokens are active.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function App() {
  return (
    <TooltipProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-background">
          {/* Sidebar */}
          <Sidebar />

          {/* Main Content Area */}
          <main className="pl-[284px] pr-6 py-6 min-h-screen">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/upload" element={<UploadInvoice />} />
              <Route path="/invoices" element={<InvoiceList />} />
              <Route path="/invoices/:invoiceId" element={<PagePlaceholder title="Invoice Detail" />} />
              <Route path="/approvals" element={<PagePlaceholder title="Approval & Exceptions" />} />
              <Route path="/analytics" element={<PagePlaceholder title="Analytics" />} />
              <Route path="/settings" element={<PagePlaceholder title="Settings" />} />
              <Route path="/audit-logs" element={<PagePlaceholder title="Audit Logs" />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  );
}
