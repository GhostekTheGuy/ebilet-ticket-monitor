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
  '2026-05-22': '#3b82f6',
  '2026-05-23': '#8b5cf6',
};

const CATEGORY_COLORS: Record<string, string> = {
  'Strefa Czerwona': '#ef4444',
  'Strefa Żółta': '#eab308',
  'Strefa Zielona': '#22c55e',
  'General Admission': '#3b82f6',
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

  return (
    <Card
      className="border-l-4 p-6 bg-card/50 border-white/5"
      style={{ borderLeftColor: EVENT_COLORS[event.eventId] || '#71717a' }}
    >
      <div className="flex items-center gap-2 text-base font-semibold mb-4">
        <Calendar className="h-4 w-4" />
        {event.eventName}
      </div>
      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <div className="text-xl font-bold">{event.totalTickets}</div>
          <div className="text-xs text-muted-foreground">biletów</div>
        </div>
        <div>
          <div className="text-xl font-bold">{event.tickets.length}</div>
          <div className="text-xs text-muted-foreground">ofert</div>
        </div>
        <div>
          <div className="text-xl font-bold text-primary">
            {event.soldTickets.length}
          </div>
          <div className="text-xs text-muted-foreground">sprzedanych</div>
        </div>
        <div>
          <div className="text-xl font-bold">
            {minPrice > 0 ? formatPrice(minPrice) : '-'}
          </div>
          <div className="text-xs text-muted-foreground">od</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        {Object.entries(categorySummary).map(([name, data]) => (
          <Badge key={name} variant="secondary" className="text-xs">
            {name}: {data.count}
          </Badge>
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
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="p-6 bg-card/50 border-white/5">
        <div className="flex items-center gap-2 text-lg font-semibold mb-4">
          <ShoppingCart className="h-5 w-5 text-primary" />
          AleBilet - Podsumowanie
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-2xl font-bold">{totalTickets}</div>
            <div className="text-sm text-muted-foreground">wszystkich biletów</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{totalOffers}</div>
            <div className="text-sm text-muted-foreground">ofert łącznie</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">{totalSold}</div>
            <div className="text-sm text-muted-foreground">sprzedanych (24h)</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{events.length}</div>
            <div className="text-sm text-muted-foreground">wydarzeń</div>
          </div>
        </div>
      </Card>

      {/* Event Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {events.map(event => (
          <EventCard key={event.eventId} event={event} />
        ))}
      </div>

      {/* Sold Tickets Table */}
      {allSoldTickets.length > 0 && (
        <Card className="p-6 bg-card/50 border-white/5">
          <div className="flex items-center gap-2 text-lg font-semibold mb-4">
            <TrendingDown className="h-5 w-5 text-primary" />
            Ostatnio sprzedane bilety (wszystkie wydarzenia)
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Kategoria</TableHead>
                <TableHead>Sektor</TableHead>
                <TableHead>Rząd</TableHead>
                <TableHead className="text-right">Ilość</TableHead>
                <TableHead className="text-right">Cena</TableHead>
                <TableHead className="text-right">Kiedy</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allSoldTickets.map((ticket, index) => (
                <TableRow key={`${ticket.id}-${index}`}>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="text-xs"
                      style={{
                        borderColor: EVENT_COLORS[ticket.eventId] || '#71717a',
                        color: EVENT_COLORS[ticket.eventId] || '#71717a'
                      }}
                    >
                      {ticket.eventId === '2026-05-22' ? '22.05' : '23.05'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: CATEGORY_COLORS[ticket.category] || '#71717a' }}
                      />
                      <span className="text-sm">{ticket.categoryName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{ticket.sector}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {ticket.row || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="destructive" className="text-xs">
                      -{ticket.soldQuantity || ticket.quantity}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatPrice(ticket.price)}
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {formatTime(ticket.soldAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {allSoldTickets.length === 0 && (
        <Card className="py-8 text-center text-muted-foreground bg-card/50 border-white/5">
          Brak sprzedanych biletów w ostatnich 24 godzinach.
          <br />
          <span className="text-sm">Dane aktualizują się przy każdym odświeżeniu strony.</span>
        </Card>
      )}
    </div>
  );
}
