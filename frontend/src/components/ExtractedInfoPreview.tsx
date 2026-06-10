import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Building2,
  DollarSign,
  Hash,
  FileDigit,
  Calendar,
  Search,
  Info,
} from 'lucide-react';

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

export default function ExtractedInfoPreview({ data, confidenceScore }: ExtractedInfoPreviewProps) {
  const fields = [
    { key: 'vendorName', value: data.vendorName },
    { key: 'totalAmount', value: data.totalAmount },
    { key: 'invoiceNumber', value: data.invoiceNumber },
    { key: 'gstin', value: data.gstin },
    { key: 'invoiceDate', value: data.invoiceDate },
    { key: 'poNumber', value: data.poNumber },
  ];

  return (
    <Card className="border border-border">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold font-heading flex items-center gap-2">
          <span className="text-lg">▾</span>
          Extracted Information (Preview)
        </CardTitle>
        <span className={`text-sm font-semibold ${
          confidenceScore >= 90 ? 'text-emerald-600' :
          confidenceScore >= 70 ? 'text-amber-600' :
          'text-red-600'
        }`}>
          Confidence Score: {confidenceScore}%
        </span>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {fields.map((field) => {
            const Icon = fieldIcons[field.key as keyof typeof fieldIcons];
            const isNotFound = field.value === 'Not Found';
            return (
              <div key={field.key} className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  isNotFound ? 'bg-red-50' : 'bg-primary/8'
                }`}>
                  <Icon className={`w-4 h-4 ${isNotFound ? 'text-red-400' : 'text-primary/60'}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                    {fieldLabels[field.key]}
                  </p>
                  <p className={`text-sm font-medium mt-0.5 truncate ${
                    isNotFound ? 'text-red-500' : 'text-foreground'
                  }`}>
                    {field.value}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Note */}
        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-border">
          <Info className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <p className="text-[11px] text-muted-foreground">
            Extraction preview only. You can review and edit after processing.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
