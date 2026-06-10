import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import Dashboard from '@/pages/Dashboard';
import UploadInvoice from '@/pages/UploadInvoice';
import InvoiceList from '@/pages/InvoiceList';
import InvoiceDetail from '@/pages/InvoiceDetail';
import Approvals from '@/pages/Approvals';
import { TooltipProvider } from '@/components/ui/tooltip';
import Header from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { FileText } from 'lucide-react';

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
              <Route path="/invoices/:invoiceId" element={<InvoiceDetail />} />
              <Route path="/approvals" element={<Approvals />} />
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
