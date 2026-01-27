import { Card } from '@/components/ui/card';
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

export function StatsCard({ title, value, subtitle, trend, trendValue }: StatsCardProps) {
  return (
    <Card className="relative overflow-hidden border-border/40 bg-card/50 backdrop-blur-xl p-6">
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className="flex items-baseline gap-2">
          <h3 className="text-4xl font-bold text-foreground">{value}</h3>
          {trend && trendValue && (
            <div className={`flex items-center gap-1 text-sm font-medium ${
              trend === 'up' ? 'text-red-400' : trend === 'down' ? 'text-green-400' : 'text-muted-foreground'
            }`}>
              {trend === 'up' && <ArrowUpIcon className="h-4 w-4" />}
              {trend === 'down' && <ArrowDownIcon className="h-4 w-4" />}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </Card>
  );
}
