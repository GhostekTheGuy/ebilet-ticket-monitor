import { Card } from '@/components/ui/card';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
}

export function StatsCard({ title, value, subtitle }: StatsCardProps) {
  return (
    <Card className="p-6 bg-card/50 border-white/5">
      <p className="text-sm text-muted-foreground mb-3">{title}</p>
      <p className="text-3xl font-bold text-violet-400">{value}</p>
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      )}
    </Card>
  );
}
