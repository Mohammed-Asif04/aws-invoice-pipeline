import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Building2,
  DollarSign,
  Hash,
  FileDigit,
  Calendar,
  Search,
  Info,
  Loader2,
} from 'lucide-react';
import { ConfidenceScore } from './ConfidenceScore';

interface ExtractedInfo {
  vendorName: string;
  totalAmount: string;
  invoiceNumber: string;
  gstin: string;
  invoiceDate: string;
  poNumber: string;
}

interface ExtractedInfoPreviewProps {
  data: ExtractedInfo;
  confidenceScore: number;
  isPending?: boolean;
}

const fieldIcons = {
  vendorName: Building2,
  totalAmount: DollarSign,
  invoiceNumber: Hash,
  gstin: FileDigit,
  invoiceDate: Calendar,
  poNumber: Search,
};

const fieldLabels: Record<string, string> = {
  vendorName: 'Vendor Name',
  totalAmount: 'Total Amount',
  invoiceNumber: 'Invoice Number',
  gstin: 'GSTIN',
  invoiceDate: 'Invoice Date',
  poNumber: 'PO Number',
};

export default function ExtractedInfoPreview({ data, confidenceScore, isPending }: ExtractedInfoPreviewProps) {
  const fields = [
    { key: 'vendorName', value: data.vendorName },
    { key: 'totalAmount', value: data.totalAmount },
    { key: 'invoiceNumber', value: data.invoiceNumber },
    { key: 'gstin', value: data.gstin },
    { key: 'invoiceDate', value: data.invoiceDate },
    { key: 'poNumber', value: data.poNumber },
  ];

  const isPendingValue = (val: string) =>
    val.includes('Pending') || val.includes('pending');

  return (
    <Card className="border border-border">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold font-heading flex items-center gap-2">
          <span className="text-lg">▾</span>
          4. Extracted Information
          {isPending && (
            <span className="text-xs font-normal text-muted-foreground">(Preview)</span>
          )}
        </CardTitle>
        {isPending ? (
          <span className="flex items-center gap-1.5 text-sm font-semibold text-amber-500">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Scanning...
          </span>
        ) : null}
      </CardHeader>
      <CardContent>
        {/* Confidence progress bar */}
        <div className="mb-4">
          {isPending ? (
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div className="h-full w-1/2 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 rounded-full animate-[shimmer_1.5s_ease-in-out_infinite]"
                style={{
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 1.5s ease-in-out infinite',
                }}
              />
            </div>
          ) : (
            <ConfidenceScore score={confidenceScore} showProgress={true} />
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {fields.map((field) => {
            const Icon = fieldIcons[field.key as keyof typeof fieldIcons];
            const isNotFound = field.value === 'Not Found';
            const isPendingField = isPending && isPendingValue(field.value);
            return (
              <div key={field.key} className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  isNotFound ? 'bg-red-50' :
                  isPendingField ? 'bg-amber-50 dark:bg-amber-500/10' :
                  'bg-primary/8'
                }`}>
                  <Icon className={`w-4 h-4 ${
                    isNotFound ? 'text-red-400' :
                    isPendingField ? 'text-amber-500' :
                    'text-primary/60'
                  }`} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                    {fieldLabels[field.key]}
                  </p>
                  {isPendingField ? (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="h-4 w-24 bg-gradient-to-r from-muted via-muted-foreground/10 to-muted rounded animate-pulse" />
                    </div>
                  ) : (
                    <p className={`text-sm font-medium mt-0.5 truncate ${
                      isNotFound ? 'text-red-500' : 'text-foreground'
                    }`}>
                      {field.value}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Note */}
        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-border">
          <Info className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <p className="text-[11px] text-muted-foreground">
            {isPending
              ? 'Select a file to preview. Click "Upload & Process" to start AI extraction.'
              : 'Extraction preview only. You can review and edit after processing.'
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
