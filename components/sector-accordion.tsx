'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { SectorData } from '@/lib/types';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectorAccordionProps {
  sectors: SectorData[];
}

const ZONE_CONFIG: Record<string, { name: string; color: string }> = {
  red: { name: 'Strefa Czerwona', color: '#ef4444' },
  yellow: { name: 'Strefa Żółta', color: '#eab308' },
  green: { name: 'Strefa Zielona', color: '#22c55e' },
  ga: { name: 'General Admission', color: '#3b82f6' },
};

const getStatus = (available: number) => {
  if (available === 0) return { label: 'Wyprzedane', variant: 'destructive' as const };
  if (available < 50) return { label: 'Mało', variant: 'secondary' as const };
  return { label: 'Dostępne', variant: 'default' as const };
};

export function SectorAccordion({ sectors }: SectorAccordionProps) {
  const [openZones, setOpenZones] = useState<Set<string>>(new Set(['red']));

  const toggleZone = (zone: string) => {
    setOpenZones(prev => {
      const newSet = new Set(prev);
      if (newSet.has(zone)) {
        newSet.delete(zone);
      } else {
        newSet.add(zone);
      }
      return newSet;
    });
  };

  // Group sectors by zone
  const sectorsByZone = sectors.reduce((acc, sector) => {
    if (!acc[sector.zone]) {
      acc[sector.zone] = [];
    }
    acc[sector.zone].push(sector);
    return acc;
  }, {} as Record<string, SectorData[]>);

  // Sort sectors within each zone by name
  Object.values(sectorsByZone).forEach(zoneSectors => {
    zoneSectors.sort((a, b) => a.name.localeCompare(b.name));
  });

  const totalSectors = sectors.length;
  const soldOutSectors = sectors.filter(s => s.available === 0).length;

  return (
    <Card className="bg-card/50 border-white/5 overflow-hidden">
      <div className="p-4 border-b border-white/5">
        <p className="text-sm text-muted-foreground">
          {totalSectors} sektorów • {soldOutSectors} wyprzedanych
        </p>
      </div>

      <div className="divide-y divide-white/5">
        {Object.entries(ZONE_CONFIG).map(([zone, config]) => {
          const zoneSectors = sectorsByZone[zone] || [];
          if (zoneSectors.length === 0) return null;

          const isOpen = openZones.has(zone);
          const zoneAvailable = zoneSectors.reduce((sum, s) => sum + s.available, 0);
          const zoneSoldOut = zoneSectors.filter(s => s.available === 0).length;

          return (
            <Collapsible
              key={zone}
              open={isOpen}
              onOpenChange={() => toggleZone(zone)}
            >
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: config.color }}
                    />
                    <span className="font-medium">{config.name}</span>
                    <span className="text-sm text-muted-foreground">
                      ({zoneSectors.length} sektorów)
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <span className="text-sm font-medium">{zoneAvailable.toLocaleString()}</span>
                      <span className="text-sm text-muted-foreground ml-1">dostępnych</span>
                      {zoneSoldOut > 0 && (
                        <span className="text-sm text-muted-foreground ml-2">
                          • {zoneSoldOut} wyprzedanych
                        </span>
                      )}
                    </div>
                    <ChevronDown
                      className={cn(
                        "h-5 w-5 text-muted-foreground transition-transform duration-300",
                        isOpen && "rotate-180"
                      )}
                    />
                  </div>
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="px-4 pb-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                    {zoneSectors.map(sector => {
                      const status = getStatus(sector.available);
                      return (
                        <div
                          key={sector.id}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-lg border transition-colors",
                            sector.available === 0
                              ? "bg-red-500/5 border-red-500/20"
                              : "bg-white/5 border-white/10 hover:bg-white/10"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{sector.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "font-semibold text-sm",
                              sector.available === 0 && "text-red-400"
                            )}>
                              {sector.available}
                            </span>
                            <Badge variant={status.variant} className="text-xs">
                              {status.label}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </Card>
  );
}
