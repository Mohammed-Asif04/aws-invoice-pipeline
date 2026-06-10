import { useState, useCallback } from 'react';
import Header from '@/components/Header';
import FileUploadZone from '@/components/FileUploadZone';
import PDFViewer from '@/components/PDFViewer';
import ExtractedInfoPreview from '@/components/ExtractedInfoPreview';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { UploadedFile } from '@/types';

const sampleExtractedInfo = {
  vendorName: 'ABC Solutions Ltd.',
  totalAmount: '₹ 1,42,190.00',
  invoiceNumber: 'INV-2025-1246',
  gstin: '29ABCDE1234F1Z5',
  invoiceDate: 'May 18, 2025',
  poNumber: 'Not Found',
};

const vendors = [
  'ABC Solutions Ltd.',
  'TechCorp India',
  'Global Supplies',
  'Office Needs Co.',
  'Digital Services',
  'BufferOn Pvt. Ltd.',
  'Info Systems',
  'Data Experts',
];

export default function UploadInvoice() {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [vendor, setVendor] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('2025-05-18');
  const [poNumber, setPoNumber] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('INV-2025-1246');
  const [notes, setNotes] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const handleFileSelect = useCallback((file: File) => {
    setUploadedFile({
      name: file.name,
      size: file.size,
      type: file.type,
      file,
      uploadStatus: 'complete',
      progress: 100,
    });
    // Simulate showing preview after upload
    setTimeout(() => setShowPreview(true), 500);
  }, []);

  const handleFileRemove = useCallback(() => {
    setUploadedFile(null);
    setShowPreview(false);
  }, []);

  const handleClearAll = useCallback(() => {
    setUploadedFile(null);
    setShowPreview(false);
    setVendor('');
    setInvoiceDate('2025-05-18');
    setPoNumber('');
    setInvoiceNumber('');
    setNotes('');
  }, []);

  return (
    <div className="min-h-screen">
      <Header
        title="Upload Invoice"
        subtitle="Upload invoice documents for intelligent processing and workflow automation."
      />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6">
        {/* Left Column — Upload & Form */}
        <div className="space-y-6">
          {/* Section 1: Upload */}
          <Card className="border border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold font-heading">
                1. Upload Invoice
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FileUploadZone
                uploadedFile={uploadedFile}
                onFileSelect={handleFileSelect}
                onFileRemove={handleFileRemove}
              />
            </CardContent>
          </Card>

          {/* Section 2: Additional Information */}
          <Card className="border border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold font-heading">
                2. Additional Information (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Row 1: Vendor & Invoice Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vendor" className="text-xs font-medium text-muted-foreground">
                    Vendor (Optional)
                  </Label>
                  <Select value={vendor} onValueChange={(val) => setVendor(val || '')}>
                    <SelectTrigger id="vendor" className="h-10">
                      <SelectValue placeholder="Select or type vendor name" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors.map((v) => (
                        <SelectItem key={v} value={v}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoiceDate" className="text-xs font-medium text-muted-foreground">
                    Invoice Date (Optional)
                  </Label>
                  <Input
                    id="invoiceDate"
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="h-10"
                  />
                </div>
              </div>

              {/* Row 2: PO Number & Invoice Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="poNumber" className="text-xs font-medium text-muted-foreground">
                    Purchase Order No. (Optional)
                  </Label>
                  <Input
                    id="poNumber"
                    placeholder="Enter PO number"
                    value={poNumber}
                    onChange={(e) => setPoNumber(e.target.value)}
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoiceNumber" className="text-xs font-medium text-muted-foreground">
                    Invoice Number (Optional)
                  </Label>
                  <Input
                    id="invoiceNumber"
                    placeholder="Enter invoice number"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="h-10"
                  />
                </div>
              </div>

              {/* Row 3: Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-xs font-medium text-muted-foreground">
                  Notes (Optional)
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Add any additional notes about this invoice..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-2 pb-8">
            <Button
              variant="outline"
              onClick={handleClearAll}
              className="text-sm"
            >
              Clear All
            </Button>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="text-sm">
                Cancel
              </Button>
              <Button
                className="text-sm px-6"
                disabled={!uploadedFile}
              >
                Upload & Process
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column — Preview & Extracted Info */}
        <div className="space-y-6">
          <PDFViewer fileName={uploadedFile?.name} />

          {showPreview && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <ExtractedInfoPreview
                data={sampleExtractedInfo}
                confidenceScore={92}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
