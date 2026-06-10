import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Download,
  Building2,
  FileSpreadsheet,
  Wallet,
  Sparkles,
  Info,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PDFViewer from '@/components/PDFViewer';
import ExtractedFields from '@/components/ExtractedFields';

type TabType = 'summary' | 'extraction' | 'approval' | 'audit';

// Full mockup data for the details view
const invoiceDetailsMock = {
  invoiceId: 'INV-2025-1246',
  vendorName: 'ABC Solutions Ltd.',
  vendorAddress: '123 Business Park, Bengaluru, Karnataka - 560078 India',
  contactPerson: 'Rahul Mehta',
  email: 'info@abcsolutions.com',
  phone: '+91 80 1234 5678',
  gstin: '29ABCDE1234F1Z5',
  invoiceDate: 'May 18, 2025',
  dueDate: 'June 17, 2025',
  invoiceNumber: 'INV-2025-1246',
  poNumber: 'PO-2025-089',
  invoiceType: 'Purchase',
  createdBy: 'Ananya Sharma',
  createdAt: 'May 18, 2025 10:23 AM',
  status: 'Processed' as const,
  receivedOn: 'May 18, 2025 10:23 AM',
  
  // Payment totals
  subtotal: 120500.00,
  cgst: 10845.00,
  sgst: 10845.00,
  totalAmount: 142190.00,
  currency: 'INR',

  // Confidence & Extraction Key Fields
  confidenceScore: 92,
  confidenceLabel: 'High Confidence',

  extractedFields: [
    { fieldName: 'Vendor Name', extractedValue: 'ABC Solutions Ltd.', confidence: 98, validationStatus: 'Matched' as const },
    { fieldName: 'Invoice Number', extractedValue: 'INV-2025-1246', confidence: 99, validationStatus: 'Matched' as const },
    { fieldName: 'Invoice Date', extractedValue: 'May 18, 2025', confidence: 98, validationStatus: 'Matched' as const },
    { fieldName: 'Total Amount', extractedValue: '₹ 1,42,190.00', confidence: 96, validationStatus: 'Matched' as const },
    { fieldName: 'GSTIN', extractedValue: '29ABCDE1234F1Z5', confidence: 95, validationStatus: 'Matched' as const },
    { fieldName: 'PO Number', extractedValue: 'PO-2025-089', confidence: 90, validationStatus: 'Matched' as const },
  ],

  // Step function history
  approvalHistory: [
    { step: 'Ingestion Trigger', timestamp: 'May 18, 2025 10:23 AM', status: 'Success', details: 'SES Email attachment parsed and stored in S3.' },
    { step: 'Document Extraction', timestamp: 'May 18, 2025 10:23 AM', status: 'Success', details: 'Amazon Textract processed document successfully.' },
    { step: 'Intelligent Bedrock Validation', timestamp: 'May 18, 2025 10:23 AM', status: 'Success', details: 'Claude 3 model validated fields. Confidence score: 92%.' },
    { step: 'Human approval', timestamp: 'May 18, 2025 11:20 AM', status: 'Approved', details: 'Invoice approved by Ananya Sharma (Finance Team).' },
  ],

  // Storage / Audit details
  auditLogs: [
    { event: 'S3 Ingestion Attachment', path: 's3://invoices-raw-bucket-prod/2025/05/18/abc-inv.pdf', hash: 'e20a4570db2b271d5334812a1df67104' },
    { event: 'Amazon Textract Response Metadata', path: 's3://invoices-audit-bucket-prod/2025/05/18/abc-inv_textract.json', hash: '3a492025d57bf7411648a1d2e1d2e5a4' },
    { event: 'Claude 3 Bedrock Analysis JSON', path: 's3://invoices-audit-bucket-prod/2025/05/18/abc-inv_bedrock.json', hash: '7c89fde57f12e1281df6714a1f6a4b12' },
    { event: 'DynamoDB Ledger Persistence', key: 'INV-2025-1246', timestamp: 'May 18, 2025 10:23 AM' },
  ],
};

export default function InvoiceDetail() {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('summary');

  const invoice = invoiceDetailsMock; // In real app, load using invoiceId

  const formatCurrency = (amount: number) => {
    return `₹ ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleDownloadReport = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(invoice, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `invoice_report_${invoiceId}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="min-h-screen pb-12">
      {/* Top Header Navigation */}
      <div className="mb-4">
        <button
          onClick={() => navigate('/invoices')}
          className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors outline-none"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Back to Invoices
        </button>
      </div>

      {/* Title block with Metadata and Action buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold font-heading tracking-tight text-foreground">
              Invoice Details
            </h1>
            <StatusBadge status={invoice.status} />
          </div>
          <p className="text-xs text-muted-foreground mt-1.5 font-medium">
            {invoice.invoiceId} &bull; Received on {invoice.receivedOn}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleDownloadReport} className="h-9 gap-1.5 text-xs">
            <Download className="w-3.5 h-3.5" />
            Download
          </Button>
          <Button variant="outline" size="sm" className="h-9 gap-1 text-xs">
            More Actions
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {/* Tabs selectors bar */}
      <div className="flex border-b border-border mb-6 overflow-x-auto select-none">
        {(['summary', 'extraction', 'approval', 'audit'] as const).map((tab) => {
          const isActive = activeTab === tab;
          const labels: Record<TabType, string> = {
            summary: 'Summary',
            extraction: 'Extraction Data',
            approval: 'Approval History',
            audit: 'Audit Logs',
          };
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-all duration-200 outline-none ${
                isActive
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {labels[tab]}
            </button>
          );
        })}
      </div>

      {/* Two-Column split screen wrapper */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_480px] gap-6">
        {/* Left Column contents based on active tab */}
        <div className="space-y-6">
          {activeTab === 'summary' && (
            <>
              {/* Row 1: Key Metadata cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Invoice Information */}
                <Card className="border border-border shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <FileSpreadsheet className="w-4 h-4 text-primary" />
                      Invoice Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Vendor Name</span>
                      <span className="font-semibold text-foreground">{invoice.vendorName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">GSTIN</span>
                      <span className="font-mono font-medium text-foreground">{invoice.gstin}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Invoice Date</span>
                        <span className="font-medium text-foreground">{invoice.invoiceDate}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Due Date</span>
                        <span className="font-medium text-foreground">{invoice.dueDate}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Invoice Number</span>
                        <span className="font-semibold text-foreground">{invoice.invoiceNumber}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block">PO Number</span>
                        <span className="font-medium text-foreground">{invoice.poNumber}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Invoice Type</span>
                        <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
                          {invoice.invoiceType}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Created By</span>
                        <span className="font-medium text-foreground">{invoice.createdBy}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Created On</span>
                      <span className="font-medium text-foreground">{invoice.createdAt}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* 2. Vendor Details */}
                <Card className="border border-border shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-primary" />
                      Vendor Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3.5 text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Vendor Name</span>
                      <span className="font-bold text-foreground text-sm">{invoice.vendorName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Address</span>
                      <span className="font-medium text-foreground/80 leading-relaxed block mt-0.5">
                        {invoice.vendorAddress}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Contact Person</span>
                      <span className="font-semibold text-foreground">{invoice.contactPerson}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Email</span>
                      <span className="font-medium text-foreground">{invoice.email}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Phone</span>
                      <span className="font-medium text-foreground">{invoice.phone}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* 3. Payment Summary */}
                <Card className="border border-border shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Wallet className="w-4 h-4 text-primary" />
                      Payment Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-xs">
                    <div className="pb-2.5 border-b border-border">
                      <span className="text-[10px] text-muted-foreground block">Total Amount</span>
                      <span className="text-xl font-bold text-foreground block mt-1">
                        {formatCurrency(invoice.totalAmount)}
                      </span>
                    </div>
                    <div className="space-y-2 text-muted-foreground font-medium">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span className="text-foreground">{formatCurrency(invoice.subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>CGST (9%)</span>
                        <span className="text-foreground">{formatCurrency(invoice.cgst)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>SGST (9%)</span>
                        <span className="text-foreground">{formatCurrency(invoice.sgst)}</span>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-border flex justify-between items-center text-sm font-bold text-primary">
                      <span>Total</span>
                      <span>{formatCurrency(invoice.totalAmount)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Row 2: AI Validation summary */}
              <Card className="border border-border shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4.5 h-4.5 text-primary animate-pulse" />
                    AI Validation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] text-muted-foreground block uppercase font-bold tracking-wider">
                        Confidence Score
                      </span>
                      <span className="text-3xl font-extrabold text-emerald-500 tracking-tight block mt-1">
                        {invoice.confidenceScore}%
                      </span>
                    </div>
                    <div>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {invoice.confidenceLabel}
                      </span>
                    </div>
                  </div>
                  
                  {/* Visual Confidence Bar */}
                  <div className="space-y-1">
                    <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                        style={{ width: `${invoice.confidenceScore}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground pt-1 flex items-center gap-1">
                      <Info className="w-3.5 h-3.5 text-muted-foreground" />
                      All key fields extracted and validated successfully.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Row 3: Extracted Fields Table */}
              <ExtractedFields fields={invoice.extractedFields} />
            </>
          )}

          {activeTab === 'extraction' && (
            <Card className="border border-border">
              <CardHeader className="border-b border-border bg-muted/5">
                <CardTitle className="text-sm font-semibold font-heading flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-primary" />
                  Raw Extraction response (Amazon Textract + Claude Bedrock)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <pre className="text-xs bg-muted/50 p-4 rounded-lg overflow-x-auto text-muted-foreground font-mono leading-relaxed border border-border">
{`{
  "invoice_metadata": {
    "invoice_id": "${invoice.invoiceId}",
    "vendor": "${invoice.vendorName}",
    "gstin": "${invoice.gstin}",
    "invoice_date": "2025-05-18",
    "due_date": "2025-06-17",
    "po_number": "${invoice.poNumber}"
  },
  "extraction_confidence": {
    "overall_score": 0.925,
    "ocr_read_success": true,
    "page_count": 1
  },
  "extracted_line_items": [
    {
      "index": 1,
      "description": "Cloud Infrastructure Services",
      "hsn_sac": "998313",
      "quantity": 1,
      "unit_price": 80000.00,
      "amount": 80000.00
    },
    {
      "index": 2,
      "description": "Data Processing Charges",
      "hsn_sac": "998314",
      "quantity": 1,
      "unit_price": 25000.00,
      "amount": 25000.00
    },
    {
      "index": 3,
      "description": "Support & Maintenance",
      "hsn_sac": "998315",
      "quantity": 1,
      "unit_price": 15500.00,
      "amount": 15500.00
    }
  ],
  "totals_verification": {
    "subtotal": 120500.00,
    "cgst": 10845.00,
    "sgst": 10845.00,
    "total": 142190.00,
    "calculations_match": true
  }
}`}
                </pre>
              </CardContent>
            </Card>
          )}

          {activeTab === 'approval' && (
            <Card className="border border-border">
              <CardHeader className="border-b border-border bg-muted/5">
                <CardTitle className="text-sm font-semibold font-heading flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Step Functions Pipeline State Logs
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="relative border-l border-border ml-6 my-6 space-y-8">
                  {invoice.approvalHistory.map((step, idx) => (
                    <div key={idx} className="relative pl-6">
                      {/* Timeline Dot */}
                      <span className="absolute -left-3 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </span>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs gap-4">
                          <h4 className="font-semibold text-foreground text-sm">{step.step}</h4>
                          <span className="text-muted-foreground font-mono">{step.timestamp}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{step.details}</p>
                        <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          {step.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'audit' && (
            <Card className="border border-border">
              <CardHeader className="border-b border-border bg-muted/5">
                <CardTitle className="text-sm font-semibold font-heading flex items-center gap-2">
                  <Info className="w-5 h-5 text-primary" />
                  S3 Artifacts & Ledger Metadata
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 text-xs">
                <div className="divide-y divide-border">
                  {invoice.auditLogs.map((log, idx) => (
                    <div key={idx} className="p-4 space-y-2 hover:bg-accent/10 transition-colors">
                      <div className="flex items-center justify-between font-semibold text-foreground">
                        <span>{log.event}</span>
                        {log.timestamp && <span className="text-muted-foreground font-normal">{log.timestamp}</span>}
                      </div>
                      {log.path && (
                        <div className="flex items-center justify-between gap-4 font-mono text-muted-foreground break-all">
                          <span>{log.path}</span>
                          <button className="text-primary hover:underline flex items-center gap-0.5 flex-shrink-0">
                            View <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                      {log.hash && (
                        <div className="font-mono text-muted-foreground/60 text-[10px]">
                          MD5 Checksum Hash: {log.hash}
                        </div>
                      )}
                      {log.key && (
                        <div className="font-mono text-muted-foreground">
                          DynamoDB Primary Record ID: <span className="font-semibold text-primary">{log.key}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: PDF Preview card */}
        <div className="space-y-6">
          <PDFViewer
            fileName="abc-inv.pdf"
            title="Invoice Document"
            showOpenInNewTab
          />
        </div>
      </div>
    </div>
  );
}

// Inline CheckCircle2 component helper locally to avoid missing imports
function CheckCircle2(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
