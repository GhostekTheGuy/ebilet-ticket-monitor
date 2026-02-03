import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import type { AleBiletTicket, AleBiletSoldTicket, AleBiletEventData } from '@/lib/types';
import { ALEBILET_EVENTS } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const CATEGORY_NAMES: Record<string, string> = {
  cat01: 'Trybuny Dolne',
  cat02: 'Trybuny Górne',
  cat03: 'Płyta',
  cat07: 'Trybuny Premium',
  cat08: 'Trybuny K',
  cat10: 'Loża VIP',
};

function parseTicketsFromHtml(html: string, eventId: string): AleBiletTicket[] {
  const tickets: AleBiletTicket[] = [];

  // Match all ticket rows
  const rowRegex = /<tr class="category[^"]*"[^>]*data-quantity="(\d+)"[^>]*data-acceptable-quantities="[^"]*"[^>]*data-area="([^"]*)"[^>]*data-category="([^"]*)"[^>]*>([\s\S]*?)<\/tr>/g;

  let match;
  while ((match = rowRegex.exec(html)) !== null) {
    const quantity = parseInt(match[1], 10);
    const area = match[2];
    const category = match[3];
    const rowContent = match[4];

    // Extract sector and row info
    const sectorMatch = rowContent.match(/Sektor:\s*([^,<]+)(?:,\s*Rząd:\s*([^<]+))?/);
    const sector = sectorMatch ? sectorMatch[1].trim() : area;
    const row = sectorMatch && sectorMatch[2] ? sectorMatch[2].trim() : null;

    // Extract price
    const priceMatch = rowContent.match(/<b>([0-9,]+(?:,[0-9]+)?)\s*zł<\/b>/);
    const price = priceMatch ? parseFloat(priceMatch[1].replace(',', '.').replace(/\s/g, '')) : 0;

    // Extract buy link for unique ID
    const linkMatch = rowContent.match(/href="([^"]*\/ssl\/kup\/[^"]*)"/);
    const buyLink = linkMatch ? linkMatch[1] : '';
    const id = buyLink.split('/').pop() || `${category}-${area}-${price}-${quantity}`;

    tickets.push({
      id,
      eventId,
      category,
      categoryName: CATEGORY_NAMES[category] || category,
      sector,
      row,
      quantity,
      price,
      buyLink,
    });
  }

  return tickets;
}

async function getLastSnapshot(eventId: string): Promise<{ tickets: AleBiletTicket[]; timestamp: number } | null> {
  try {
    const result = await pool.query<{ raw_data: AleBiletTicket[]; timestamp: string }>(
      `SELECT raw_data, timestamp FROM alebilet_snapshots WHERE event_id = $1 ORDER BY timestamp DESC LIMIT 1`,
      [eventId]
    );

    if (result.rows.length === 0) return null;

    return {
      tickets: result.rows[0].raw_data,
      timestamp: new Date(result.rows[0].timestamp).getTime(),
    };
  } catch (error) {
    console.error('[AleBilet] Error getting last snapshot:', error);
    return null;
  }
}

async function saveSnapshot(eventId: string, tickets: AleBiletTicket[]): Promise<void> {
  try {
    const totalTickets = tickets.reduce((sum, t) => sum + t.quantity, 0);

    await pool.query(
      `INSERT INTO alebilet_snapshots (event_id, total_tickets, raw_data) VALUES ($1, $2, $3)`,
      [eventId, totalTickets, JSON.stringify(tickets)]
    );
  } catch (error) {
    console.error('[AleBilet] Error saving snapshot:', error);
  }
}

async function saveSoldTickets(soldTickets: AleBiletSoldTicket[]): Promise<void> {
  if (soldTickets.length === 0) return;

  try {
    for (const ticket of soldTickets) {
      await pool.query(
        `INSERT INTO alebilet_sold (event_id, ticket_id, category, category_name, sector, row_info, quantity_sold, price, sold_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, to_timestamp($9))`,
        [
          ticket.eventId,
          ticket.id,
          ticket.category,
          ticket.categoryName,
          ticket.sector,
          ticket.row,
          ticket.soldQuantity || ticket.quantity,
          ticket.price,
          ticket.soldAt / 1000,
        ]
      );
    }
  } catch (error) {
    console.error('[AleBilet] Error saving sold tickets:', error);
  }
}

function findSoldTickets(
  previousTickets: AleBiletTicket[],
  currentTickets: AleBiletTicket[]
): AleBiletSoldTicket[] {
  const soldTickets: AleBiletSoldTicket[] = [];
  const currentMap = new Map(currentTickets.map(t => [t.id, t]));
  const now = Date.now();

  for (const prev of previousTickets) {
    const current = currentMap.get(prev.id);

    if (!current) {
      // Ticket completely gone - sold out
      soldTickets.push({
        ...prev,
        soldAt: now,
        previousQuantity: prev.quantity,
        soldQuantity: prev.quantity,
      });
    } else if (current.quantity < prev.quantity) {
      // Quantity decreased
      soldTickets.push({
        ...prev,
        soldAt: now,
        previousQuantity: prev.quantity,
        soldQuantity: prev.quantity - current.quantity,
      });
    }
  }

  return soldTickets;
}

async function fetchEventData(event: typeof ALEBILET_EVENTS[0]): Promise<AleBiletEventData> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(event.url, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('[AleBilet] HTTP error for', event.id, ':', response.status);
      return {
        eventId: event.id,
        eventName: event.name,
        tickets: [],
        totalTickets: 0,
        soldTickets: [],
      };
    }

    const html = await response.text();
    const tickets = parseTicketsFromHtml(html, event.id);
    const totalTickets = tickets.reduce((sum, t) => sum + t.quantity, 0);

    console.log('[AleBilet]', event.id, '- Parsed', tickets.length, 'offers,', totalTickets, 'total tickets');

    // Get previous snapshot and find sold tickets
    const lastSnapshot = await getLastSnapshot(event.id);
    let soldTickets: AleBiletSoldTicket[] = [];

    if (lastSnapshot) {
      soldTickets = findSoldTickets(lastSnapshot.tickets, tickets);

      if (soldTickets.length > 0) {
        console.log('[AleBilet]', event.id, '- Found', soldTickets.length, 'sold ticket offers');
        await saveSoldTickets(soldTickets);
      }
    }

    // Save new snapshot
    await saveSnapshot(event.id, tickets);

    return {
      eventId: event.id,
      eventName: event.name,
      tickets,
      totalTickets,
      soldTickets,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('[AleBilet] Error fetching', event.id, ':', error);
    return {
      eventId: event.id,
      eventName: event.name,
      tickets: [],
      totalTickets: 0,
      soldTickets: [],
    };
  }
}

export async function GET() {
  try {
    // Fetch data for all events in parallel
    const eventDataPromises = ALEBILET_EVENTS.map(event => fetchEventData(event));
    const events = await Promise.all(eventDataPromises);

    return NextResponse.json({ events });

  } catch (error) {
    console.error('[AleBilet] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AleBilet data' },
      { status: 500 }
    );
  }
}
