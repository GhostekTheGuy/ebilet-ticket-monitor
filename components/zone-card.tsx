import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ZoneSummary } from '@/lib/types';

interface ZoneCardProps {
  zone: ZoneSummary;
}

export function ZoneCard({ zone }: ZoneCardProps) {
  const percentageAvailable = zone.totalSectors > 0
    ? ((zone.totalSectors - zone.soldOutSectors) / zone.totalSectors) * 100
    : 0;

  return (
    <Card className="p-5 bg-card/50 border-white/5">
      <div className="flex items-center gap-2 mb-4">
        <div
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: zone.color }}
        />
        <span className="text-sm font-medium text-muted-foreground">{zone.name}</span>
      </div>

      <p className="text-2xl font-bold mb-1">{zone.totalAvailable.toLocaleString()}</p>
      <p className="text-xs text-muted-foreground mb-4">
        {zone.soldOutSectors}/{zone.totalSectors} wyprzedanych
      </p>

      <Progress value={percentageAvailable} className="h-1.5" />
    </Card>
  );
}
