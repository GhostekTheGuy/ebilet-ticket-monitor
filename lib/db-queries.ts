import { pool } from './db';
import type { TicketSnapshot, HistoryPoint } from './types';
import { GA_SECTOR_ID } from './types';

export async function insertSnapshot(totalAvailable: number, rawData: Record<string, number>): Promise<void> {
  await pool.query(
    `INSERT INTO ticket_snapshots (total_available, raw_data) VALUES ($1, $2)`,
    [totalAvailable, JSON.stringify(rawData)]
  );
}

export async function getHistory(hours: number = 24): Promise<HistoryPoint[]> {
  const result = await pool.query<TicketSnapshot>(
    `SELECT id, timestamp, total_available, raw_data
     FROM ticket_snapshots
     WHERE timestamp > NOW() - INTERVAL '${hours} hours'
     ORDER BY timestamp ASC`
  );

  return result.rows.map(row => {
    const rawData = typeof row.raw_data === 'string'
      ? JSON.parse(row.raw_data)
      : row.raw_data;

    return {
      timestamp: new Date(row.timestamp).getTime(),
      totalAvailable: row.total_available,
      gaAvailable: rawData?.[GA_SECTOR_ID] ?? undefined,
    };
  });
}
