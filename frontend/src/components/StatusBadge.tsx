import type { InvoiceStatus, ExceptionType } from '@/types';
import { Badge } from '@/components/ui/badge';

const statusConfig: Record<InvoiceStatus, { className: string }> = {
  'Processed': {
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
  },
  'In Progress': {
    className: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
  },
  'In Review': {
    className: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100',
  },
  'Exception': {
    className: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
  },
  'Resolved': {
    className: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
  },
};

const exceptionConfig: Record<ExceptionType, { className: string }> = {
  'Missing GSTIN': {
    className: 'bg-red-100 text-red-800 border-red-300',
  },
  'Amount Mismatch': {
    className: 'bg-amber-100 text-amber-800 border-amber-300',
  },
  'Vendor Not Found': {
    className: 'bg-purple-100 text-purple-800 border-purple-300',
  },
  'Duplicate Invoice': {
    className: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  'Low Confidence Score': {
    className: 'bg-orange-100 text-orange-800 border-orange-300',
  },
};

interface StatusBadgeProps {
  status: InvoiceStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${config.className}`}>
      {status}
    </Badge>
  );
}

interface ExceptionBadgeProps {
  type: ExceptionType;
}

export function ExceptionBadge({ type }: ExceptionBadgeProps) {
  const config = exceptionConfig[type];
  return (
    <Badge variant="outline" className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${config.className}`}>
      {type}
    </Badge>
  );
}
