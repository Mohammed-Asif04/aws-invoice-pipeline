import { useState, useCallback, useEffect } from 'react';
import Header from '@/components/Header';
import FileUploadZone from '@/components/FileUploadZone';
import PDFViewer from '@/components/PDFViewer';
import ExtractedInfoPreview from '@/components/ExtractedInfoPreview';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  UploadCloud,
  FileSpreadsheet,
  Brain,
  CheckCircle2,
  Database,
} from 'lucide-react';
import type { UploadedFile } from '@/types';
import { uploadInvoice, getInvoiceById } from '@/services/invoiceService';

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
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [extractedInfo, setExtractedInfo] = useState<any>(null);
  const [confidence, setConfidence] = useState(90);

  // Pipeline execution tracking states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [activeInvoiceId, setActiveInvoiceId] = useState<string | null>(null);
  const [activeInvoiceStatus, setActiveInvoiceStatus] = useState<string | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);

  const handleFileSelect = useCallback((file: File) => {
    setUploadedFile({
      name: file.name,
      size: file.size,
      type: file.type,
      file,
      uploadStatus: 'complete',
      progress: 100,
    });

    // Show preliminary extracted info preview immediately on file selection
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
    setExtractedInfo({
      vendorName: vendor || 'Pending Extraction...',
      totalAmount: '₹ Pending...',
      invoiceNumber: invoiceNumber || nameWithoutExt,
      gstin: 'Pending Extraction...',
      invoiceDate: invoiceDate || 'Pending...',
      poNumber: poNumber || 'Pending...',
    });
    setConfidence(0);
    setShowPreview(true);
  }, [vendor, invoiceNumber, invoiceDate, poNumber]);

  const handleFileRemove = useCallback(() => {
    setUploadedFile(null);
    setShowPreview(false);
    setExtractedInfo(null);
    setConfidence(0);
    setActiveInvoiceId(null);
    setActiveInvoiceStatus(null);
    setUploadError(null);
  }, []);

  const handleClearAll = useCallback(() => {
    setUploadedFile(null);
    setShowPreview(false);
    setVendor('');
    setInvoiceDate('2025-05-18');
    setPoNumber('');
    setInvoiceNumber('');
    setNotes('');
    setActiveInvoiceId(null);
    setActiveInvoiceStatus(null);
    setUploadError(null);
  }, []);

  // Synchronize manually typed form inputs with the preliminary extracted preview
  useEffect(() => {
    if (uploadedFile && !activeInvoiceId) {
      const nameWithoutExt = uploadedFile.name.replace(/\.[^/.]+$/, '');
      setExtractedInfo({
        vendorName: vendor || 'Pending Extraction...',
        totalAmount: '₹ Pending...',
        invoiceNumber: invoiceNumber || nameWithoutExt,
        gstin: 'Pending Extraction...',
        invoiceDate: invoiceDate || 'Pending...',
        poNumber: poNumber || 'Pending...',
      });
    }
  }, [vendor, invoiceDate, poNumber, invoiceNumber, uploadedFile, activeInvoiceId]);

  // Poll for the status of the invoice being processed
  useEffect(() => {
    if (!activeInvoiceId) return;

    let timer: any;
    let pollInterval: any;

    // Track elapsed time for sub-stage animation in 'In Progress' status
    timer = setInterval(() => {
      setElapsedSec((prev) => prev + 1);
    }, 1000);

    const checkStatus = async () => {
      try {
        const inv = await getInvoiceById(activeInvoiceId);
        if (inv) {
          setActiveInvoiceStatus(inv.status);
          
          // Once it lands in a final state, populate preview and stop polling
          if (inv.status === 'Processed' || inv.status === 'Resolved' || inv.status === 'Exception' || inv.status === 'In Review') {
            setConfidence(inv.extractionConfidence || 88);
            setExtractedInfo({
              vendorName: inv.vendorName || 'Not Found',
              totalAmount: inv.totalAmount ? `₹ ${inv.totalAmount.toLocaleString('en-IN')}` : 'Not Found',
              invoiceNumber: inv.invoiceNumber || 'Not Found',
              gstin: inv.gstin || 'Not Found',
              invoiceDate: inv.invoiceDate || 'Not Found',
              poNumber: inv.poNumber || 'Not Found',
            });
            setShowPreview(true);
            clearInterval(pollInterval);
            clearInterval(timer);
          }
        }
      } catch (err) {
        console.error('Error polling invoice status', err);
      }
    };

    pollInterval = setInterval(checkStatus, 2000);
    checkStatus(); // Initial fetch

    return () => {
      clearInterval(pollInterval);
      clearInterval(timer);
    };
  }, [activeInvoiceId]);

  const handleUploadAndProcess = async () => {
    if (!uploadedFile?.file) return;
    setIsUploading(true);
    setUploadError(null);
    setShowPreview(false);
    setExtractedInfo(null);
    setActiveInvoiceId(null);
    setActiveInvoiceStatus(null);
    setElapsedSec(0);

    try {
      const metadata = {
        vendor,
        invoiceDate,
        poNumber,
        invoiceNumber,
        notes,
      };
      
      const result = await uploadInvoice(uploadedFile.file, metadata);
      setActiveInvoiceId(result.invoiceId);
      setActiveInvoiceStatus(result.status);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Determine sub-stages during 'In Progress' status based on elapsed seconds
  const getActiveStage = () => {
    if (!activeInvoiceStatus) return 0;
    if (activeInvoiceStatus === 'In Progress') {
      if (elapsedSec < 5) return 1; // S3 Uploading / Ingesting
      if (elapsedSec < 12) return 2; // OCR Textract extracting
      return 3; // Bedrock LLM validating
    }
    if (activeInvoiceStatus === 'In Review' || activeInvoiceStatus === 'Pending Review' || activeInvoiceStatus === 'Exception') {
      return 4; // Step Functions Human-in-the-loop Gate
    }
    if (activeInvoiceStatus === 'Processed' || activeInvoiceStatus === 'Resolved') {
      return 5; // Stored in DB & Finished
    }
    return 0;
  };

  const activeStage = getActiveStage();

  // Dynamic styling helper functions
  const getNode1Class = () => {
    if (activeStage === 1) return 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/25 animate-pulse';
    if (activeStage > 1) return 'border-indigo-500 bg-indigo-500/5 shadow-md shadow-indigo-500/10';
    return 'opacity-40 border-muted bg-muted/5';
  };

  const getArrow1Class = () => {
    if (activeStage === 1) return 'text-indigo-500/80 animate-pulse';
    if (activeStage >= 2) return 'text-indigo-500/80';
    return 'text-muted-foreground/20';
  };

  const getNode2Class = () => {
    if (activeStage === 2) return 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/25 animate-pulse';
    if (activeStage > 2) return 'border-emerald-500 bg-emerald-500/5 shadow-md shadow-emerald-500/10';
    return 'opacity-40 border-muted bg-muted/5';
  };

  const getArrow2Class = () => {
    if (activeStage === 2) return 'text-emerald-500/80 animate-pulse';
    if (activeStage >= 3) return 'text-emerald-500/80';
    return 'text-muted-foreground/20';
  };

  const getNode3Class = () => {
    if (activeStage === 3) return 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/25 animate-pulse';
    if (activeStage > 3) return 'border-amber-500 bg-amber-500/5 shadow-md shadow-amber-500/10';
    return 'opacity-40 border-muted bg-muted/5';
  };

  const getArrow3Class = () => {
    if (activeStage === 3) return 'text-amber-500/80 animate-pulse';
    if (activeStage >= 4) return 'text-amber-500/80';
    return 'text-muted-foreground/20';
  };

  const getNode4Class = () => {
    if (activeStage === 4) {
      if (activeInvoiceStatus === 'Exception') return 'border-red-500 bg-red-500/10 shadow-lg shadow-red-500/25 animate-pulse';
      return 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/25 animate-pulse';
    }
    if (activeStage > 4) {
      if (activeInvoiceStatus === 'Resolved') return 'border-emerald-500 bg-emerald-500/5 shadow-md shadow-emerald-500/10';
      return 'border-blue-500 bg-blue-500/5 shadow-md shadow-blue-500/10';
    }
    return 'opacity-40 border-muted bg-muted/5';
  };

  const getArrow4Class = () => {
    if (activeStage === 4) {
      if (activeInvoiceStatus === 'Exception') return 'text-red-500/80 animate-pulse';
      return 'text-blue-500/80 animate-pulse';
    }
    if (activeStage >= 5) {
      if (activeInvoiceStatus === 'Resolved') return 'text-emerald-500/80';
      return 'text-blue-500/80';
    }
    return 'text-muted-foreground/20';
  };

  const getNode5Class = () => {
    if (activeStage === 5) {
      if (activeInvoiceStatus === 'Resolved') return 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/25';
      return 'border-teal-500 bg-teal-500/10 shadow-lg shadow-teal-500/25';
    }
    return 'opacity-40 border-muted bg-muted/5';
  };

  return (
    <div className="min-h-screen">
      <Header
        title="Upload Invoice"
        subtitle="Upload invoice documents for intelligent OCR extraction and Bedrock LLM validation."
      />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6">
        {/* Left Column — Upload & Form */}
        <div className="space-y-6">
          {/* Section 1: Upload */}
          <Card className="border border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold font-heading">
                1. Upload Invoice File
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
                    Vendor
                  </Label>
                  <Select value={vendor} onValueChange={(val) => setVendor(val || '')}>
                    <SelectTrigger id="vendor" className="h-10">
                      <SelectValue placeholder="Select vendor name" />
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
                    Invoice Date
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
                    Purchase Order No.
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
                    Invoice Number
                  </Label>
                  <Input
                    id="invoiceNumber"
                    placeholder="Enter invoice number override"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="h-10"
                  />
                </div>
              </div>

              {/* Row 3: Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-xs font-medium text-muted-foreground">
                  Notes
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Add any additional notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Upload Progress Pipeline Flowchart (appears during active processing) */}
          {activeInvoiceId && (
            <Card className="border border-border animate-in fade-in duration-300">
              <CardHeader className="pb-2 select-none border-b border-border bg-muted/5">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold font-heading text-foreground">
                      Real-Time Processing Pipeline
                    </CardTitle>
                    <CardDescription className="text-[10px]">
                      Invoice ID: <span className="font-bold text-primary">{activeInvoiceId}</span>
                    </CardDescription>
                  </div>
                  {activeInvoiceStatus && (
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      <StatusBadge status={activeInvoiceStatus as any} />
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="py-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-2 overflow-x-auto">
                  {/* Node 1 */}
                  <div className="flex flex-col items-center text-center space-y-1.5 flex-1 min-w-[70px]">
                    <div className={`w-14 h-14 border rounded-xl flex items-center justify-center relative transition-all duration-300 ${getNode1Class()}`}>
                      <UploadCloud className={`w-7 h-7 ${activeStage >= 1 ? 'text-indigo-600 dark:text-indigo-400' : 'text-muted-foreground/40'}`} />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold text-foreground">1. Upload</p>
                      <p className="text-[9px] text-muted-foreground leading-none">S3 Ingest</p>
                    </div>
                  </div>

                  {/* Arrow 1-2 */}
                  <svg className={`w-10 h-6 shrink-0 transition-colors duration-300 ${getArrow1Class()}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 64 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h56M52 5l8 7-8 7" />
                  </svg>

                  {/* Node 2 */}
                  <div className="flex flex-col items-center text-center space-y-1.5 flex-1 min-w-[70px]">
                    <div className={`w-14 h-14 border rounded-xl flex items-center justify-center relative transition-all duration-300 ${getNode2Class()}`}>
                      <FileSpreadsheet className={`w-7 h-7 ${activeStage >= 2 ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground/40'}`} />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold text-foreground">2. Extraction</p>
                      <p className="text-[9px] text-muted-foreground leading-none">Textract OCR</p>
                    </div>
                  </div>

                  {/* Arrow 2-3 */}
                  <svg className={`w-10 h-6 shrink-0 transition-colors duration-300 ${getArrow2Class()}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 64 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h56M52 5l8 7-8 7" />
                  </svg>

                  {/* Node 3 */}
                  <div className="flex flex-col items-center text-center space-y-1.5 flex-1 min-w-[70px]">
                    <div className={`w-14 h-14 border rounded-xl flex items-center justify-center relative transition-all duration-300 ${getNode3Class()}`}>
                      <Brain className={`w-7 h-7 ${activeStage >= 3 ? 'text-amber-500 dark:text-amber-400' : 'text-muted-foreground/40'}`} />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold text-foreground">3. Validation</p>
                      <p className="text-[9px] text-muted-foreground leading-none">Bedrock LLM</p>
                    </div>
                  </div>

                  {/* Arrow 3-4 */}
                  <svg className={`w-10 h-6 shrink-0 transition-colors duration-300 ${getArrow3Class()}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 64 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h56M52 5l8 7-8 7" />
                  </svg>

                  {/* Node 4 */}
                  <div className="flex flex-col items-center text-center space-y-1.5 flex-1 min-w-[70px]">
                    <div className={`w-14 h-14 border rounded-xl flex items-center justify-center relative transition-all duration-300 ${getNode4Class()}`}>
                      <CheckCircle2 className={`w-7 h-7 ${
                        activeStage >= 4
                          ? activeInvoiceStatus === 'Exception'
                            ? 'text-red-500 dark:text-red-400'
                            : activeInvoiceStatus === 'Resolved'
                            ? 'text-emerald-500 dark:text-emerald-400'
                            : 'text-blue-500 dark:text-blue-400'
                          : 'text-muted-foreground/40'
                      }`} />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold text-foreground">4. Approval</p>
                      <p className="text-[9px] text-muted-foreground leading-none">Step Functions</p>
                    </div>
                  </div>

                  {/* Arrow 4-5 */}
                  <svg className={`w-10 h-6 shrink-0 transition-colors duration-300 ${getArrow4Class()}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 64 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h56M52 5l8 7-8 7" />
                  </svg>

                  {/* Node 5 */}
                  <div className="flex flex-col items-center text-center space-y-1.5 flex-1 min-w-[70px]">
                    <div className={`w-14 h-14 border rounded-xl flex items-center justify-center relative transition-all duration-300 ${getNode5Class()}`}>
                      <Database className={`w-7 h-7 ${
                        activeStage >= 5
                          ? activeInvoiceStatus === 'Resolved'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-teal-600 dark:text-teal-400'
                          : 'text-muted-foreground/40'
                      }`} />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold text-foreground">5. Store</p>
                      <p className="text-[9px] text-muted-foreground leading-none">DynamoDB</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {uploadError && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
              ⚠️ {uploadError}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-2 pb-8">
            <Button
              variant="outline"
              onClick={handleClearAll}
              className="text-sm"
              disabled={isUploading}
            >
              Clear All
            </Button>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="text-sm" onClick={handleClearAll} disabled={isUploading}>
                Cancel
              </Button>
              <Button
                className="text-sm px-6 gap-2"
                disabled={!uploadedFile || isUploading}
                onClick={handleUploadAndProcess}
              >
                {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
                {isUploading ? 'Uploading...' : 'Upload & Process'}
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column — Preview & Extracted Info */}
        <div className="space-y-6">
          <PDFViewer fileName={uploadedFile?.name} file={uploadedFile?.file || null} />

          {showPreview && extractedInfo && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <ExtractedInfoPreview
                data={extractedInfo}
                confidenceScore={confidence}
                isPending={activeInvoiceStatus === 'In Progress'}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
