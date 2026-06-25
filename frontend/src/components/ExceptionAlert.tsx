import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import type { Anomaly } from '@/types';

interface ExceptionAlertProps {
  anomalies: Anomaly[];
  className?: string;
}

export function ExceptionAlert({ anomalies, className = '' }: ExceptionAlertProps) {
  if (!anomalies || anomalies.length === 0) return null;

  const getSeverityStyles = (severity: string) => {
    switch (severity?.toUpperCase()) {
      case 'HIGH':
        return {
          wrapper: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900 text-red-800 dark:text-red-300',
          icon: AlertCircle,
          iconColor: 'text-red-500',
        };
      case 'MEDIUM':
        return {
          wrapper: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300',
          icon: AlertTriangle,
          iconColor: 'text-amber-500',
        };
      default:
        return {
          wrapper: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-300',
          icon: Info,
          iconColor: 'text-blue-500',
        };
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {anomalies.map((anomaly, idx) => {
        const styles = getSeverityStyles(anomaly.severity);
        const Icon = styles.icon;

        return (
          <div
            key={idx}
            className={`flex items-start gap-3 p-3 border rounded-xl text-xs font-medium ${styles.wrapper}`}
          >
            <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${styles.iconColor}`} />
            <div className="space-y-1">
              <div className="font-bold uppercase tracking-wide text-[10px]">
                {anomaly.type} ({anomaly.severity} Severity)
              </div>
              <div className="leading-normal opacity-90">{anomaly.description}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
