'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SectorData } from '@/lib/types';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowUpDown, ChevronDown, List } from 'lucide-react';

interface SectorTableProps {
  sectors: SectorData[];
}

type SortField = 'name' | 'zone' | 'available';
type SortDirection = 'asc' | 'desc';

const ZONE_COLORS = {
  red: '#ef4444',
  yellow: '#eab308',
  green: '#22c55e',
  ga: '#3b82f6',
};

const ZONE_NAMES = {
  red: 'Strefa Czerwona',
  yellow: 'Strefa Żółta',
  green: 'Strefa Zielona',
  ga: 'General Admission',
};

export function SectorTable({ sectors }: SectorTableProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const sortedSectors = useMemo(() => {
    const sorted = [...sectors].sort((a, b) => {
      let comparison = 0;

      if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === 'zone') {
        comparison = a.zone.localeCompare(b.zone);
      } else if (sortField === 'available') {
        comparison = a.available - b.available;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [sectors, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getStatus = (available: number) => {
    if (available === 0) return { label: 'Sold Out', variant: 'destructive' as const };
    if (available < 50) return { label: 'Low Stock', variant: 'secondary' as const };
    return { label: 'Available', variant: 'default' as const };
  };

  // Stats for the header
  const totalSectors = sectors.length;
  const soldOutSectors = sectors.filter(s => s.available === 0).length;
  const lowStockSectors = sectors.filter(s => s.available > 0 && s.available < 50).length;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="relative overflow-hidden border-border/40 bg-card/50 backdrop-blur-xl shadow-sm">
        <CollapsibleTrigger asChild>
          <div className="p-6 cursor-pointer hover:bg-card/70 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <List className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Sector Details</h3>
                  <p className="text-sm text-muted-foreground">
                    {totalSectors} sektorów &bull; {soldOutSectors} wyprzedanych &bull; {lowStockSectors} niski stan
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="gap-2">
                {isOpen ? 'Zwiń' : 'Rozwiń'}
                <ChevronDown className="h-4 w-4 chevron-icon" />
              </Button>
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t border-border/40">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className={isOpen ? 'animate-header-in' : ''}>
                  <TableRow className="border-border/40 hover:bg-transparent">
                    <TableHead className="pl-6">
                      <button
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                        onClick={() => handleSort('name')}
                      >
                        Sector
                        <ArrowUpDown className="h-4 w-4" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                        onClick={() => handleSort('zone')}
                      >
                        Zone
                        <ArrowUpDown className="h-4 w-4" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                        onClick={() => handleSort('available')}
                      >
                        Available
                        <ArrowUpDown className="h-4 w-4" />
                      </button>
                    </TableHead>
                    <TableHead className="pr-6">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedSectors.map((sector, index) => {
                    const status = getStatus(sector.available);
                    return (
                      <TableRow
                        key={sector.id}
                        className={`border-border/40 transition-all duration-200 hover:bg-muted/50 ${isOpen ? 'animate-row-in' : ''}`}
                        style={{
                          animationDelay: `${index * 30}ms`,
                        }}
                      >
                        <TableCell className="font-medium pl-6">{sector.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className="h-2 w-2 rounded-full transition-transform duration-200 hover:scale-125"
                              style={{ backgroundColor: ZONE_COLORS[sector.zone] }}
                            />
                            <span className="text-sm">{ZONE_NAMES[sector.zone]}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-lg font-semibold">{sector.available}</TableCell>
                        <TableCell className="pr-6">
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
