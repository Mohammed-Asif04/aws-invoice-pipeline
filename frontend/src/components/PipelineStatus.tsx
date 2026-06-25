import { UploadCloud, FileSpreadsheet, Brain, CheckCircle2, Database } from 'lucide-react';
import type { Invoice } from '@/types';

interface PipelineStatusProps {
  selectedInvoice: Invoice | null;
  activeStage?: number;
  stats: {
    totalInvoices: number;
    processed: number;
    inProgress: number;
    exceptions: number;
    inReview: number;
    resolved?: number;
    pendingReview?: number;
    processedPercentage: string | number;
  };
  loading?: boolean;
}

export function PipelineStatus({
  selectedInvoice,
  activeStage: propActiveStage,
  stats,
  loading = false,
}: PipelineStatusProps) {
  // Determine active pipeline stage based on selected invoice status
  const getActiveStage = () => {
    if (propActiveStage !== undefined) return propActiveStage;
    if (!selectedInvoice) return 0;
    switch (selectedInvoice.status) {
      case 'In Progress': {
        const elapsedSec = (Date.now() - new Date(selectedInvoice.createdAt || selectedInvoice.receivedOn).getTime()) / 1000;
        if (elapsedSec < 6) return 1; // S3 Uploading / Ingesting
        if (elapsedSec < 15) return 2; // OCR Textract extracting
        return 3; // Bedrock LLM validating
      }
      case 'In Review':
      case 'Pending Review':
      case 'Exception':
        return 4; // Step Functions Approval Gate
      case 'Processed':
      case 'Resolved':
        return 5; // Stored in DynamoDB
      default:
        return 0;
    }
  };

  const activeStage = getActiveStage();

  // Dynamic styling helper functions
  const getNode1Class = () => {
    if (!selectedInvoice) return 'border-indigo-100 dark:border-indigo-950 bg-indigo-50/10 dark:bg-indigo-950/5';
    if (activeStage === 1) return 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/25 animate-pulse';
    if (activeStage > 1) return 'border-indigo-500 bg-indigo-500/5 shadow-md shadow-indigo-500/10';
    return 'opacity-40 border-muted bg-muted/5';
  };

  const getArrow1Class = () => {
    if (!selectedInvoice) return 'text-muted-foreground/30';
    if (activeStage === 1) return 'text-indigo-500/80 animate-pulse';
    if (activeStage >= 2) return 'text-indigo-500/80';
    return 'text-muted-foreground/20';
  };

  const getNode2Class = () => {
    if (!selectedInvoice) return 'border-emerald-100 dark:border-emerald-950 bg-emerald-50/10 dark:bg-emerald-950/5';
    if (activeStage === 2) return 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/25 animate-pulse';
    if (activeStage > 2) return 'border-emerald-500 bg-emerald-500/5 shadow-md shadow-emerald-500/10';
    return 'opacity-40 border-muted bg-muted/5';
  };

  const getArrow2Class = () => {
    if (!selectedInvoice) return 'text-muted-foreground/30';
    if (activeStage === 2) return 'text-emerald-500/80 animate-pulse';
    if (activeStage >= 3) return 'text-emerald-500/80';
    return 'text-muted-foreground/20';
  };

  const getNode3Class = () => {
    if (!selectedInvoice) return 'border-amber-100 dark:border-amber-950 bg-amber-50/10 dark:bg-amber-950/5';
    if (activeStage === 3) return 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/25 animate-pulse';
    if (activeStage > 3) return 'border-amber-500 bg-amber-500/5 shadow-md shadow-amber-500/10';
    return 'opacity-40 border-muted bg-muted/5';
  };

  const getArrow3Class = () => {
    if (!selectedInvoice) return 'text-muted-foreground/30';
    if (activeStage === 3) return 'text-amber-500/80 animate-pulse';
    if (activeStage >= 4) return 'text-amber-500/80';
    return 'text-muted-foreground/20';
  };

  const getNode4Class = () => {
    if (!selectedInvoice) return 'border-blue-100 dark:border-blue-950 bg-blue-50/10 dark:bg-blue-950/5';
    if (activeStage === 4) {
      if (selectedInvoice.status === 'Exception') {
        return 'border-red-500 bg-red-500/10 shadow-lg shadow-red-500/25 animate-pulse';
      }
      return 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/25 animate-pulse';
    }
    if (activeStage > 4) {
      if (selectedInvoice.status === 'Resolved') return 'border-emerald-500 bg-emerald-500/5 shadow-md shadow-emerald-500/10';
      return 'border-blue-500 bg-blue-500/5 shadow-md shadow-blue-500/10';
    }
    return 'opacity-40 border-muted bg-muted/5';
  };

  const getArrow4Class = () => {
    if (!selectedInvoice) return 'text-muted-foreground/30';
    if (activeStage === 4) {
      if (selectedInvoice.status === 'Exception') return 'text-red-500/80 animate-pulse';
      return 'text-blue-500/80 animate-pulse';
    }
    if (activeStage >= 5) {
      if (selectedInvoice.status === 'Resolved') return 'text-emerald-500/80';
      return 'text-blue-500/80';
    }
    return 'text-muted-foreground/20';
  };

  const getNode5Class = () => {
    if (!selectedInvoice) return 'border-teal-100 dark:border-teal-950 bg-teal-50/10 dark:bg-teal-950/5';
    if (activeStage === 5) {
      if (selectedInvoice.status === 'Resolved') return 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/25';
      return 'border-teal-500 bg-teal-500/10 shadow-lg shadow-teal-500/25';
    }
    return 'opacity-40 border-muted bg-muted/5';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-4 overflow-x-auto select-none">
        {/* Node 1 */}
        <div className="flex flex-col items-center text-center space-y-2 flex-1 min-w-[80px]">
          <div className={`w-20 h-20 border rounded-2xl flex items-center justify-center relative shadow-sm hover:shadow-md transition-all duration-300 ${getNode1Class()}`}>
            <UploadCloud className={`w-10 h-10 transition-colors ${selectedInvoice && activeStage >= 1 ? 'text-indigo-600 dark:text-indigo-400' : 'text-muted-foreground/40'}`} />
          </div>
          <div className="space-y-0.5">
            <p className="text-[11px] font-bold text-foreground">1. Upload</p>
            <p className="text-[10px] text-muted-foreground leading-none">S3</p>
            <p className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
              {loading ? '...' : stats.totalInvoices}
            </p>
          </div>
        </div>

        {/* Arrow 1-2 */}
        <svg className={`w-12 h-8 self-start mt-[24px] shrink-0 transition-colors duration-300 ${getArrow1Class()}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 64 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h56M52 5l8 7-8 7" />
        </svg>

        {/* Node 2 */}
        <div className="flex flex-col items-center text-center space-y-2 flex-1 min-w-[80px]">
          <div className={`w-20 h-20 border rounded-2xl flex items-center justify-center relative shadow-sm hover:shadow-md transition-all duration-300 ${getNode2Class()}`}>
            <FileSpreadsheet className={`w-10 h-10 transition-colors ${selectedInvoice && activeStage >= 2 ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground/40'}`} />
          </div>
          <div className="space-y-0.5">
            <p className="text-[11px] font-bold text-foreground">2. Extraction</p>
            <p className="text-[10px] text-muted-foreground leading-none">Textract</p>
            <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              {loading ? '...' : stats.totalInvoices}
            </p>
          </div>
        </div>

        {/* Arrow 2-3 */}
        <svg className={`w-12 h-8 self-start mt-[24px] shrink-0 transition-colors duration-300 ${getArrow2Class()}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 64 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h56M52 5l8 7-8 7" />
        </svg>

        {/* Node 3 */}
        <div className="flex flex-col items-center text-center space-y-2 flex-1 min-w-[80px]">
          <div className={`w-20 h-20 border rounded-2xl flex items-center justify-center relative shadow-sm hover:shadow-md transition-all duration-300 ${getNode3Class()}`}>
            <Brain className={`w-10 h-10 transition-colors ${selectedInvoice && activeStage >= 3 ? 'text-amber-500 dark:text-amber-400' : 'text-muted-foreground/40'}`} />
          </div>
          <div className="space-y-0.5">
            <p className="text-[11px] font-bold text-foreground">3. Validation</p>
            <p className="text-[10px] text-muted-foreground leading-none">Bedrock (LLM)</p>
            <p className="text-sm font-extrabold text-amber-500 dark:text-amber-400 mt-1">
              {loading ? '...' : Math.max(0, stats.totalInvoices - stats.inProgress)}
            </p>
          </div>
        </div>

        {/* Arrow 3-4 */}
        <svg className={`w-12 h-8 self-start mt-[24px] shrink-0 transition-colors duration-300 ${getArrow3Class()}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 64 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h56M52 5l8 7-8 7" />
        </svg>

        {/* Node 4 */}
        <div className="flex flex-col items-center text-center space-y-2 flex-1 min-w-[80px]">
          <div className={`w-20 h-20 border rounded-2xl flex items-center justify-center relative shadow-sm hover:shadow-md transition-all duration-300 ${getNode4Class()}`}>
            <CheckCircle2 className={`w-10 h-10 transition-colors ${
              selectedInvoice && activeStage >= 4
                ? selectedInvoice.status === 'Exception'
                  ? 'text-red-500 dark:text-red-400'
                  : selectedInvoice.status === 'Resolved'
                  ? 'text-emerald-500 dark:text-emerald-400'
                  : 'text-blue-500 dark:text-blue-400'
                : 'text-muted-foreground/40'
            }`} />
          </div>
          <div className="space-y-0.5">
            <p className="text-[11px] font-bold text-foreground">4. Approval</p>
            <p className="text-[10px] text-muted-foreground leading-none">Step Functions</p>
            <p className="text-sm font-extrabold text-blue-600 dark:text-blue-400 mt-1">
              {loading ? '...' : ((stats.exceptions || 0) + (stats.processed || 0) + (stats.inReview || 0) + (stats.resolved || 0) + (stats.pendingReview || 0))}
            </p>
          </div>
        </div>

        {/* Arrow 4-5 */}
        <svg className={`w-12 h-8 self-start mt-[24px] shrink-0 transition-colors duration-300 ${getArrow4Class()}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 64 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h56M52 5l8 7-8 7" />
        </svg>

        {/* Node 5 */}
        <div className="flex flex-col items-center text-center space-y-2 flex-1 min-w-[80px]">
          <div className={`w-20 h-20 border rounded-2xl flex items-center justify-center relative shadow-sm hover:shadow-md transition-all duration-300 ${getNode5Class()}`}>
            <Database className={`w-10 h-10 transition-colors ${
              selectedInvoice && activeStage >= 5
                ? selectedInvoice.status === 'Resolved'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-teal-600 dark:text-teal-400'
                : 'text-muted-foreground/40'
            }`} />
          </div>
          <div className="space-y-0.5">
            <p className="text-[11px] font-bold text-foreground">5. Store</p>
            <p className="text-[10px] text-muted-foreground leading-none">DynamoDB</p>
            <p className="text-sm font-extrabold text-teal-600 dark:text-teal-400 mt-1">
              {loading ? '...' : stats.totalInvoices}
            </p>
          </div>
        </div>
      </div>

      {/* Health progress bar */}
      <div className="w-full bg-muted/60 h-2.5 rounded-full overflow-hidden select-none">
        <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${stats.processedPercentage}%` }} />
      </div>
    </div>
  );
}
