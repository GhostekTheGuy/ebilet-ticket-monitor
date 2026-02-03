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
  yellow: { name: 'Strefa Żółta', color: '#facc15' },
  green: { name: 'Strefa Zielona', color: '#4ade80' },
  ga: { name: 'General Admission', color: '#5b9bf5' },
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
    <Card className="overflow-hidden">
      <div className="px-6 py-4 border-b border-[#1e1e22]">
        <p className="text-[13px] text-[#8a8a92]">
          {totalSectors} sektorów • {soldOutSectors} wyprzedanych
        </p>
      </div>

      <div className="divide-y divide-[#1e1e22]">
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
                <div className="flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-[10px] w-[10px] rounded-full"
                      style={{ backgroundColor: config.color }}
                    />
                    <span className="font-semibold text-[14px] text-white">{config.name}</span>
                    <span className="text-[12px] text-[#5a5a62]">
                      ({zoneSectors.length} sektorów)
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <span className="text-[13px] font-semibold text-white">{zoneAvailable.toLocaleString()}</span>
                      <span className="text-[12px] text-[#5a5a62] ml-1.5">dostępnych</span>
                      {zoneSoldOut > 0 && (
                        <span className="text-[12px] text-[#5a5a62] ml-2">
                          • {zoneSoldOut} wyprzedanych
                        </span>
                      )}
                    </div>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 text-[#5a5a62] transition-transform duration-300",
                        isOpen && "rotate-180"
                      )}
                    />
                  </div>
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="mx-6 mb-4 mt-1 pt-3 border-t border-[#1e1e22]/50">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                    {zoneSectors.map(sector => {
                      const status = getStatus(sector.available);
                      return (
                        <div
                          key={sector.id}
                          className={cn(
                            "flex items-center justify-between px-3 py-2.5 rounded-xl border transition-colors",
                            sector.available === 0
                              ? "bg-[#1a0f0f] border-[#2e1515]"
                              : "bg-[#141414] border-[#1e1e22] hover:bg-[#1a1a1a]"
                          )}
                        >
                          <span className="font-medium text-[13px] text-[#c8c8cc] truncate mr-3">{sector.name}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={cn(
                              "font-semibold text-[13px] tabular-nums",
                              sector.available === 0 ? "text-[#ef4444]" : "text-white"
                            )}>
                              {sector.available}
                            </span>
                            <Badge variant={status.variant} className="text-[10px] min-w-[70px] justify-center">
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
