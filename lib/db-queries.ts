import { pool } from './db';
import type { TicketSnapshot, HistoryPoint } from './types';
import { GA_SECTOR_ID } from './types';

export async function insertSnapshot(totalAvailable: number, rawData: Record<string, number>): Promise<boolean> {
  // Get the last snapshot to check if total_available changed
  const lastResult = await pool.query<{ total_available: number }>(
    `SELECT total_available FROM ticket_snapshots ORDER BY timestamp DESC LIMIT 1`
  );

  // Skip insert if total_available hasn't changed
  if (lastResult.rows.length > 0 && lastResult.rows[0].total_available === totalAvailable) {
    return false;
  }

  await pool.query(
    `INSERT INTO ticket_snapshots (total_available, raw_data) VALUES ($1, $2)`,
    [totalAvailable, JSON.stringify(rawData)]
  );
  return true;
}

export async function getHistory(hours: number = 72, sinceTimestamp?: number): Promise<HistoryPoint[]> {
  // Optimized: fetch only needed columns, extract GA directly in SQL
  let query: string;
  let params: (string | number)[];

  if (sinceTimestamp) {
    // Incremental fetch - only new records since last timestamp
    query = `SELECT timestamp, total_available, raw_data->$1 as ga_available
             FROM ticket_snapshots
             WHERE timestamp > to_timestamp($2)
             ORDER BY timestamp ASC`;
    params = [GA_SECTOR_ID, sinceTimestamp / 1000];
  } else {
    // Initial fetch - limit to specified hours
    query = `SELECT timestamp, total_available, raw_data->$1 as ga_available
             FROM ticket_snapshots
             WHERE timestamp > NOW() - make_interval(hours => $2)
             ORDER BY timestamp ASC`;
    params = [GA_SECTOR_ID, hours];
  }

  const result = await pool.query<{ timestamp: string; total_available: number; ga_available: number | null }>(query, params);

  return result.rows.map(row => ({
    timestamp: new Date(row.timestamp).getTime(),
    totalAvailable: row.total_available,
    gaAvailable: row.ga_available ?? undefined,
  }));
}
