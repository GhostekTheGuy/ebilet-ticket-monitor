'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { AleBiletSoldTicket, AleBiletEventData } from '@/lib/types';
import { ShoppingCart, TrendingDown, Calendar } from 'lucide-react';

interface AleBiletSoldProps {
  events: AleBiletEventData[];
  allSoldTickets: AleBiletSoldTicket[];
}

const EVENT_COLORS: Record<string, string> = {
  '2026-05-22': '#5b9bf5',
  '2026-05-23': '#818cf8',
};

const CATEGORY_COLORS: Record<string, string> = {
  'Strefa Czerwona': '#ef4444',
  'Strefa Żółta': '#facc15',
  'Strefa Zielona': '#4ade80',
  'General Admission': '#5b9bf5',
};

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - timestamp;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'przed chwilą';
  if (diffMins < 60) return `${diffMins} min temu`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h temu`;

  return date.toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatPrice(price: number): string {
  return price.toLocaleString('pl-PL', {
    style: 'currency',
    currency: 'PLN',
  });
}

function EventCard({ event }: { event: AleBiletEventData }) {
  const categorySummary = event.tickets.reduce((acc, ticket) => {
    if (!acc[ticket.categoryName]) {
      acc[ticket.categoryName] = { count: 0, offers: 0 };
    }
    acc[ticket.categoryName].count += ticket.quantity;
    acc[ticket.categoryName].offers += 1;
    return acc;
  }, {} as Record<string, { count: number; offers: number }>);

  const minPrice = event.tickets.length > 0
    ? Math.min(...event.tickets.map(t => t.price))
    : 0;

  const eventColor = EVENT_COLORS[event.eventId] || '#6b7280';

  return (
    <Card className="p-6 relative overflow-hidden">
      <div
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{ backgroundColor: eventColor }}
      />
      <div className="flex items-center gap-2.5 text-[14px] font-semibold text-white mb-5">
        <Calendar className="h-4 w-4 text-[#8a8a92]" />
        {event.eventName}
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-[#191919] rounded-2xl p-3.5 border border-[#1e1e22]">
          <div className="text-[11px] text-[#5a5a62] mb-1.5">Biletów</div>
          <div className="text-[20px] font-bold text-white">{event.totalTickets}</div>
        </div>
        <div className="bg-[#191919] rounded-2xl p-3.5 border border-[#1e1e22]">
          <div className="text-[11px] text-[#5a5a62] mb-1.5">Ofert</div>
          <div className="text-[20px] font-bold text-white">{event.tickets.length}</div>
        </div>
        <div className="bg-[#191919] rounded-2xl p-3.5 border border-[#1e1e22]">
          <div className="text-[11px] text-[#5a5a62] mb-1.5">Sprzedanych</div>
          <div className="flex items-center gap-2">
            <span className="text-[20px] font-bold text-white">{event.soldTickets.length}</span>
            {event.soldTickets.length > 0 && (
              <span className="bg-[#0c1a2e] text-[#7cb3f9] px-2 py-0.5 rounded-lg text-[10px] font-semibold">
                Nowe
              </span>
            )}
          </div>
        </div>
        <div className="bg-[#191919] rounded-2xl p-3.5 border border-[#1e1e22]">
          <div className="text-[11px] text-[#5a5a62] mb-1.5">Od</div>
          <div className="text-[20px] font-bold text-white">
            {minPrice > 0 ? formatPrice(minPrice) : '-'}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {Object.entries(categorySummary).map(([name, data]) => (
          <span
            key={name}
            className="bg-[#191919] border border-[#1e1e22] rounded-lg px-2.5 py-1 text-[11px] text-[#8a8a92]"
          >
            {name}: {data.count}
          </span>
        ))}
      </div>
    </Card>
  );
}

export function AleBiletSold({ events, allSoldTickets }: AleBiletSoldProps) {
  const totalTickets = events.reduce((sum, e) => sum + e.totalTickets, 0);
  const totalOffers = events.reduce((sum, e) => sum + e.tickets.length, 0);
  const totalSold = allSoldTickets.length;

  return (
    <div className="space-y-5">
      {/* Summary Card */}
      <Card className="p-6">
        <div className="flex items-center gap-2.5 text-[16px] font-semibold text-white mb-5">
          <ShoppingCart className="h-5 w-5 text-[#5b9bf5]" />
          AleBilet - Podsumowanie
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#191919] rounded-2xl p-4 border border-[#1e1e22]">
            <div className="text-[11px] text-[#5a5a62] mb-1.5">Wszystkich biletów</div>
            <div className="text-[26px] font-bold text-white tracking-[-0.02em]">{totalTickets}</div>
          </div>
          <div className="bg-[#191919] rounded-2xl p-4 border border-[#1e1e22]">
            <div className="text-[11px] text-[#5a5a62] mb-1.5">Ofert łącznie</div>
            <div className="text-[26px] font-bold text-white tracking-[-0.02em]">{totalOffers}</div>
          </div>
          <div className="bg-[#191919] rounded-2xl p-4 border border-[#1e1e22]">
            <div className="text-[11px] text-[#5a5a62] mb-1.5">Sprzedanych (24h)</div>
            <div className="flex items-center gap-2.5">
              <span className="text-[26px] font-bold text-white tracking-[-0.02em]">{totalSold}</span>
              {totalSold > 0 && (
                <span className="bg-[#052e1c] text-[#34d399] px-2.5 py-0.5 rounded-lg text-[10px] font-semibold">
                  Aktywne
                </span>
              )}
            </div>
          </div>
          <div className="bg-[#191919] rounded-2xl p-4 border border-[#1e1e22]">
            <div className="text-[11px] text-[#5a5a62] mb-1.5">Wydarzeń</div>
            <div className="text-[26px] font-bold text-white tracking-[-0.02em]">{events.length}</div>
          </div>
        </div>
      </Card>

      {/* Event Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {events.map(event => (
          <EventCard key={event.eventId} event={event} />
        ))}
      </div>

      {/* Sold Tickets Table */}
      {allSoldTickets.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2.5 text-[16px] font-semibold text-white mb-5">
            <TrendingDown className="h-5 w-5 text-[#5b9bf5]" />
            Ostatnio sprzedane bilety
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-[#1e1e22] hover:bg-transparent">
                  <TableHead className="text-[11px] text-[#5a5a62] font-medium">Data</TableHead>
                  <TableHead className="text-[11px] text-[#5a5a62] font-medium">Kategoria</TableHead>
                  <TableHead className="text-[11px] text-[#5a5a62] font-medium">Sektor</TableHead>
                  <TableHead className="text-[11px] text-[#5a5a62] font-medium">Rząd</TableHead>
                  <TableHead className="text-[11px] text-[#5a5a62] font-medium text-right">Ilość</TableHead>
                  <TableHead className="text-[11px] text-[#5a5a62] font-medium text-right">Cena</TableHead>
                  <TableHead className="text-[11px] text-[#5a5a62] font-medium text-right">Kiedy</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allSoldTickets.map((ticket, index) => (
                  <TableRow key={`${ticket.id}-${index}`} className="border-b border-[#1e1e22] hover:bg-white/[0.02]">
                    <TableCell className="py-3">
                      <span
                        className="px-2.5 py-1 rounded-lg text-[11px] font-medium border"
                        style={{
                          borderColor: EVENT_COLORS[ticket.eventId] || '#6b7280',
                          color: EVENT_COLORS[ticket.eventId] || '#6b7280'
                        }}
                      >
                        {ticket.eventId === '2026-05-22' ? '22.05' : '23.05'}
                      </span>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: CATEGORY_COLORS[ticket.category] || '#6b7280' }}
                        />
                        <span className="text-[12px] text-[#c8c8cc]">{ticket.categoryName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 text-[12px] font-medium text-white">{ticket.sector}</TableCell>
                    <TableCell className="py-3 text-[12px] text-[#5a5a62]">
                      {ticket.row || '-'}
                    </TableCell>
                    <TableCell className="py-3 text-right">
                      <span className="bg-[#2e0c0c] text-[#ef4444] px-2 py-0.5 rounded-lg text-[11px] font-medium">
                        -{ticket.soldQuantity || ticket.quantity}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 text-right text-[12px] font-semibold text-white">
                      {formatPrice(ticket.price)}
                    </TableCell>
                    <TableCell className="py-3 text-right text-[11px] text-[#5a5a62]">
                      {formatTime(ticket.soldAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {allSoldTickets.length === 0 && (
        <Card className="py-10 text-center">
          <p className="text-[14px] text-[#5a5a62]">Brak sprzedanych biletów w ostatnich 24 godzinach.</p>
          <p className="text-[12px] text-[#4a4a52] mt-1">Dane aktualizują się przy każdym odświeżeniu strony.</p>
        </Card>
      )}
    </div>
  );
}
