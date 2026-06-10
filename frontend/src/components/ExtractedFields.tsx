import { CheckCircle2, AlertTriangle, FileText, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ExtractedFieldItem {
  fieldName: string;
  extractedValue: string;
  confidence: number;
  validationStatus: 'Matched' | 'Mismatch' | 'Not Found' | 'Pending';
}

interface ExtractedFieldsProps {
  fields: ExtractedFieldItem[];
}

export default function ExtractedFields({ fields }: ExtractedFieldsProps) {
  const getStatusBadge = (status: ExtractedFieldItem['validationStatus']) => {
    switch (status) {
      case 'Matched':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Matched
          </span>
        );
      case 'Mismatch':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200/60 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20">
            <AlertTriangle className="w-3.5 h-3.5" />
            Mismatch
          </span>
        );
      case 'Not Found':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">
            <AlertTriangle className="w-3.5 h-3.5" />
            Not Found
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200/60 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20">
            Pending
          </span>
        );
    }
  };

  const getConfidenceBarColor = (confidence: number) => {
    if (confidence >= 90) return 'bg-emerald-500 dark:bg-emerald-600';
    if (confidence >= 75) return 'bg-amber-500 dark:bg-amber-600';
    return 'bg-red-500 dark:bg-red-600';
  };

  return (
    <Card className="border border-border">
      <CardHeader className="pb-3 border-b border-border bg-muted/5">
        <CardTitle className="text-base font-semibold font-heading flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Extracted Key Fields
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-muted/10 text-xs font-semibold text-muted-foreground select-none">
                <th className="py-3 px-4">Field Name</th>
                <th className="py-3 px-4">Extracted Value</th>
                <th className="py-3 px-4 w-40">Confidence</th>
                <th className="py-3 px-4 text-right">Validation Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {fields.map((field, idx) => (
                <tr key={idx} className="hover:bg-accent/20 transition-colors">
                  <td className="py-3.5 px-4 font-medium text-muted-foreground">{field.fieldName}</td>
                  <td className="py-3.5 px-4 font-semibold text-foreground">{field.extractedValue}</td>
                  <td className="py-3.5 px-4">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-foreground">{field.confidence}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${getConfidenceBarColor(field.confidence)}`}
                          style={{ width: `${field.confidence}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {getStatusBadge(field.validationStatus)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center gap-2 px-4 py-3 bg-muted/10 border-t border-border text-xs text-muted-foreground">
          <Info className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <span>Data extracted by AI. Please verify before approval.</span>
        </div>
      </CardContent>
    </Card>
  );
}
