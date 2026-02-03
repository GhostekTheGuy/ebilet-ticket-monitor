'use client';

import { SectorAccordion } from '@/components/sector-accordion';
import { SectorData } from '@/lib/types';

interface SectorsPageProps {
  sectors: SectorData[];
}

export function SectorsPage({ sectors }: SectorsPageProps) {
  const totalAvailable = sectors.reduce((sum, s) => sum + s.available, 0);
  const soldOutCount = sectors.filter(s => s.available === 0).length;

  return (
    <div className="animate-fade-up space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-[-0.02em] text-white mb-2">Sektory</h1>
        <p className="text-[#8a8a92] text-sm">
          {totalAvailable.toLocaleString()} biletów dostępnych • {soldOutCount} sektorów wyprzedanych
        </p>
      </div>

      <SectorAccordion sectors={sectors} />
    </div>
  );
}
