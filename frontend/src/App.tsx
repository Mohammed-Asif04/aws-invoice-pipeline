import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import Dashboard from '@/pages/Dashboard';
import UploadInvoice from '@/pages/UploadInvoice';
import InvoiceList from '@/pages/InvoiceList';
import InvoiceDetail from '@/pages/InvoiceDetail';
import Approvals from '@/pages/Approvals';
import Analytics from '@/pages/Analytics';
import AuditLogs from '@/pages/AuditLogs';
import { TooltipProvider } from '@/components/ui/tooltip';

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
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/audit-logs" element={<AuditLogs />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  );
}
