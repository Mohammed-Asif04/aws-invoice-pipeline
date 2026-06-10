import { Maximize2, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PDFViewerProps {
  fileName?: string;
  title?: string;
  showOpenInNewTab?: boolean;
}

export default function PDFViewer({ fileName: _fileName, title, showOpenInNewTab }: PDFViewerProps) {
  return (
    <Card className="border border-border">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold font-heading">
          {title || '3. Document Preview'}
        </CardTitle>
        {showOpenInNewTab ? (
          <button className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors border border-border px-2.5 py-1 rounded-md bg-card">
            Open in New Tab
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors">
            View Full Size
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {/* PDF Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d3f] text-white text-xs">
          <div className="flex items-center gap-2">
            <span className="text-white/70">1</span>
            <span className="text-white/40">/</span>
            <span className="text-white/70">1</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="text-white/60 hover:text-white transition-colors">−</button>
            <span className="text-white/80 text-[11px]">100%</span>
            <button className="text-white/60 hover:text-white transition-colors">+</button>
          </div>
        </div>

        {/* Invoice Preview Content */}
        <div className="bg-white p-6 mx-4 mb-4 mt-2 border border-gray-200 rounded shadow-sm text-[11px] leading-relaxed font-sans">
          {/* Invoice Header */}
          <div className="flex justify-between items-start mb-5">
            <div>
              <h3 className="text-sm font-bold text-gray-900">ABC Solutions Ltd.</h3>
              <p className="text-gray-500 mt-0.5">123 Business Park,</p>
              <p className="text-gray-500">Bengaluru, Karnataka - 560078</p>
              <p className="text-gray-500">GSTIN: 29ABCDE1234F1Z5</p>
            </div>
            <div className="text-right">
              <p className="text-base font-bold text-gray-900">INVOICE</p>
              <p className="text-primary font-semibold mt-1">INV-2025-1246</p>
              <p className="text-gray-500 mt-1">Invoice Date: May 18, 2025</p>
              <p className="text-gray-500">Due Date: June 17, 2025</p>
            </div>
          </div>

          {/* Bill To */}
          <div className="mb-4 p-2.5 bg-blue-50 rounded">
            <p className="font-semibold text-gray-700 text-[10px] uppercase tracking-wider">Bill To:</p>
            <p className="font-medium text-gray-900 mt-0.5">TechCorp India Pvt. Ltd.</p>
            <p className="text-gray-500">78, Embassy Tech Village,</p>
            <p className="text-gray-500">Outer Ring Road,</p>
            <p className="text-gray-500">Bengaluru - 560103</p>
          </div>

          {/* Line Items Table */}
          <table className="w-full mb-4 text-[10px]">
            <thead>
              <tr className="bg-primary text-white">
                <th className="text-left py-1.5 px-2 rounded-tl">Description</th>
                <th className="text-left py-1.5 px-2">HSN/SAC</th>
                <th className="text-center py-1.5 px-2">Qty</th>
                <th className="text-right py-1.5 px-2">Unit Price</th>
                <th className="text-right py-1.5 px-2 rounded-tr">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-1.5 px-2 text-gray-800">Cloud Infrastructure Services</td>
                <td className="py-1.5 px-2 text-gray-600 font-mono">998313</td>
                <td className="py-1.5 px-2 text-center text-gray-600">1</td>
                <td className="py-1.5 px-2 text-right text-gray-600">₹ 80,000.00</td>
                <td className="py-1.5 px-2 text-right font-medium text-gray-800">₹ 80,000.00</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-1.5 px-2 text-gray-800">Data Processing Charges</td>
                <td className="py-1.5 px-2 text-gray-600 font-mono">998314</td>
                <td className="py-1.5 px-2 text-center text-gray-600">1</td>
                <td className="py-1.5 px-2 text-right text-gray-600">₹ 25,000.00</td>
                <td className="py-1.5 px-2 text-right font-medium text-gray-800">₹ 25,000.00</td>
              </tr>
              <tr>
                <td className="py-1.5 px-2 text-gray-800">Support & Maintenance</td>
                <td className="py-1.5 px-2 text-gray-600 font-mono">998315</td>
                <td className="py-1.5 px-2 text-center text-gray-600">1</td>
                <td className="py-1.5 px-2 text-right text-gray-600">₹ 15,500.00</td>
                <td className="py-1.5 px-2 text-right font-medium text-gray-800">₹ 15,500.00</td>
              </tr>
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-48 text-[10px]">
              <div className="flex justify-between py-1 text-gray-600">
                <span>Subtotal</span>
                <span>₹ 1,20,500.00</span>
              </div>
              <div className="flex justify-between py-1 text-gray-600">
                <span>CGST (9%)</span>
                <span>₹ 10,845.00</span>
              </div>
              <div className="flex justify-between py-1 text-gray-600">
                <span>SGST (9%)</span>
                <span>₹ 10,845.00</span>
              </div>
              <div className="flex justify-between py-1.5 font-bold text-primary border-t border-gray-200 mt-1 text-xs">
                <span>Total</span>
                <span>₹ 1,42,190.00</span>
              </div>
            </div>
          </div>

          <p className="text-center text-gray-400 text-[9px] mt-4">Thank you for your business!</p>
        </div>
      </CardContent>
    </Card>
  );
}
