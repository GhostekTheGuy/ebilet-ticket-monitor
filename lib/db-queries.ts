import { pool } from './db';
import type { TicketSnapshot, HistoryPoint } from './types';

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

  return result.rows.map(row => ({
    timestamp: new Date(row.timestamp).getTime(),
    totalAvailable: row.total_available,
  }));
}
