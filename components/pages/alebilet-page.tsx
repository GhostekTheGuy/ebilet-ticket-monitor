'use client';

import { AleBiletSold } from '@/components/alebilet-sold';
import { AleBiletEventData, AleBiletSoldTicket } from '@/lib/types';

interface AleBiletPageProps {
  events: AleBiletEventData[];
  soldTickets: AleBiletSoldTicket[];
}

export function AleBiletPage({ events, soldTickets }: AleBiletPageProps) {
  const totalTickets = events.reduce((sum, e) => sum + e.totalTickets, 0);
  const totalOffers = events.reduce((sum, e) => sum + e.tickets.length, 0);
  const soldLast24h = soldTickets.length;

  // Calculate average price from all available tickets
  const allPrices = events.flatMap(e => e.tickets.map(t => t.price));
  const avgPrice = allPrices.length > 0
    ? Math.round(allPrices.reduce((a, b) => a + b, 0) / allPrices.length)
    : 0;

  return (
    <div className="space-y-8">
      {/* Hero Stats */}
      <div className="animate-fade-up py-4 lg:py-8">
        <p className="text-sm lg:text-base text-[#8a8a92] font-medium mb-1">Rynek wtórny</p>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-[-0.02em] text-white mb-8 lg:mb-12">AleBilet</h1>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0">
          <div className="lg:pr-10 xl:pr-16">
            <p className="text-xs lg:text-sm text-[#8a8a92] mb-2">Dostępne bilety</p>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl lg:text-5xl xl:text-6xl font-bold text-[#5b9bf5] tracking-[-0.03em]">
                {totalTickets.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="lg:border-l lg:border-[#1e1e22] lg:pl-10 xl:pl-16 lg:pr-10 xl:pr-16">
            <p className="text-xs lg:text-sm text-[#8a8a92] mb-2">Ofert łącznie</p>
            <span className="text-4xl lg:text-5xl xl:text-6xl font-bold text-white tracking-[-0.03em]">
              {totalOffers.toLocaleString()}
            </span>
          </div>

          <div className="lg:border-l lg:border-[#1e1e22] lg:pl-10 xl:pl-16 lg:pr-10 xl:pr-16">
            <p className="text-xs lg:text-sm text-[#8a8a92] mb-2">Sprzedano (24h)</p>
            <span className="text-4xl lg:text-5xl xl:text-6xl font-bold text-white tracking-[-0.03em]">
              {soldLast24h.toLocaleString()}
            </span>
          </div>

          <div className="lg:border-l lg:border-[#1e1e22] lg:pl-10 xl:pl-16">
            <p className="text-xs lg:text-sm text-[#8a8a92] mb-2">Średnia cena</p>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl lg:text-5xl xl:text-6xl font-bold text-white tracking-[-0.03em]">
                {avgPrice > 0 ? avgPrice.toLocaleString() : '—'}
              </span>
              {avgPrice > 0 && <span className="text-lg lg:text-xl xl:text-2xl text-[#5a5a62] font-normal">zł</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Sold tickets */}
      <div className="animate-fade-up-delay-1">
        <AleBiletSold events={events} allSoldTickets={soldTickets} />
      </div>
    </div>
  );
}
