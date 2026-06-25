import type { ComponentType, ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ComponentType<any>;
  iconBgClass?: string;
  iconColorClass?: string;
  trendText?: ReactNode;
  loading?: boolean;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  iconBgClass = 'bg-blue-50 dark:bg-blue-500/10',
  iconColorClass = 'text-blue-600 dark:text-blue-400',
  trendText,
  loading = false,
}: StatsCardProps) {
  return (
    <Card className="border border-border">
      <CardContent className="p-5 flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
            {title}
          </span>
          <span className="text-2xl font-extrabold text-foreground block tracking-tight">
            {loading ? '...' : value}
          </span>
          {trendText && (
            <div className="mt-0.5">
              {trendText}
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${iconBgClass}`}>
          <Icon className={`w-6 h-6 ${iconColorClass}`} />
        </div>
      </CardContent>
    </Card>
  );
}
