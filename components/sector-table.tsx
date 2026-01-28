'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SectorData } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowUpDown } from 'lucide-react';

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

  return (
    <Card className="relative overflow-hidden border-border/40 bg-card/50 backdrop-blur-xl shadow-sm">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Sector Details</h3>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border/40">
              <TableHead>
                <button 
                  className="flex items-center gap-1 hover:text-foreground"
                  onClick={() => handleSort('name')}
                >
                  Sector
                  <ArrowUpDown className="h-4 w-4" />
                </button>
              </TableHead>
              <TableHead>
                <button 
                  className="flex items-center gap-1 hover:text-foreground"
                  onClick={() => handleSort('zone')}
                >
                  Zone
                  <ArrowUpDown className="h-4 w-4" />
                </button>
              </TableHead>
              <TableHead>
                <button 
                  className="flex items-center gap-1 hover:text-foreground"
                  onClick={() => handleSort('available')}
                >
                  Available
                  <ArrowUpDown className="h-4 w-4" />
                </button>
              </TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedSectors.map((sector) => {
              const status = getStatus(sector.available);
              return (
                <TableRow key={sector.id} className="border-border/40">
                  <TableCell className="font-medium">{sector.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div 
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: ZONE_COLORS[sector.zone] }}
                      />
                      <span className="text-sm">{ZONE_NAMES[sector.zone]}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-lg font-semibold">{sector.available}</TableCell>
                  <TableCell>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
