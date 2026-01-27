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
    <Card className="relative overflow-hidden border-border/40 bg-card/50 backdrop-blur-xl p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div 
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: zone.color }}
            />
            <h3 className="font-semibold text-foreground">{zone.name}</h3>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground">{zone.totalAvailable}</span>
            <span className="text-sm text-muted-foreground">available</span>
          </div>
          
          <p className="text-xs text-muted-foreground">
            {zone.soldOutSectors} / {zone.totalSectors} sectors sold out
          </p>
        </div>

        <Progress value={percentageAvailable} className="h-2" />
      </div>
    </Card>
  );
}
