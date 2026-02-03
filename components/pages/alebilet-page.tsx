'use client';

import { AleBiletSold } from '@/components/alebilet-sold';
import { AleBiletEventData, AleBiletSoldTicket } from '@/lib/types';

interface AleBiletPageProps {
  events: AleBiletEventData[];
  soldTickets: AleBiletSoldTicket[];
}

export function AleBiletPage({ events, soldTickets }: AleBiletPageProps) {
  const totalTickets = events.reduce((sum, e) => sum + e.totalTickets, 0);

  return (
    <div className="animate-fade-up space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-[-0.02em] text-white mb-2">AleBilet</h1>
        <p className="text-[#8a8a92] text-sm">
          Odsprzedaż biletów • {totalTickets} biletów na rynku wtórnym
        </p>
      </div>

      <AleBiletSold events={events} allSoldTickets={soldTickets} />
    </div>
  );
}
