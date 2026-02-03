import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import type { AleBiletSoldTicket } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hours = parseInt(searchParams.get('hours') || '24', 10);
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const eventId = searchParams.get('eventId'); // optional filter

    let query: string;
    let params: (string | number)[];

    if (eventId) {
      query = `SELECT event_id, ticket_id, category, category_name, sector, row_info, quantity_sold, price, sold_at
               FROM alebilet_sold
               WHERE sold_at > NOW() - make_interval(hours => $1) AND event_id = $2
               ORDER BY sold_at DESC
               LIMIT $3`;
      params = [hours, eventId, limit];
    } else {
      query = `SELECT event_id, ticket_id, category, category_name, sector, row_info, quantity_sold, price, sold_at
               FROM alebilet_sold
               WHERE sold_at > NOW() - make_interval(hours => $1)
               ORDER BY sold_at DESC
               LIMIT $2`;
      params = [hours, limit];
    }

    const result = await pool.query<{
      event_id: string;
      ticket_id: string;
      category: string;
      category_name: string;
      sector: string;
      row_info: string | null;
      quantity_sold: number;
      price: number;
      sold_at: string;
    }>(query, params);

    const soldTickets: AleBiletSoldTicket[] = result.rows.map(row => ({
      id: row.ticket_id,
      eventId: row.event_id,
      category: row.category,
      categoryName: row.category_name,
      sector: row.sector,
      row: row.row_info,
      quantity: row.quantity_sold,
      soldQuantity: row.quantity_sold,
      price: row.price,
      buyLink: '',
      soldAt: new Date(row.sold_at).getTime(),
    }));

    return NextResponse.json({ soldTickets });
  } catch (error) {
    // If table doesn't exist yet, return empty array
    if (error instanceof Error && error.message.includes('does not exist')) {
      return NextResponse.json({ soldTickets: [] });
    }
    console.error('[AleBilet Sold] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sold tickets' },
      { status: 500 }
    );
  }
}
