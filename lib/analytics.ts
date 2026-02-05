import type { HistoryPoint, AleBiletTicket, AleBiletSoldTicket } from './types';

const SAMPLE_INTERVAL_MS = 3 * 60 * 60 * 1000; // 3 hours

/**
 * Reduces large datasets to ~50 points by bucketing into 3-hour intervals.
 * Always includes the last data point for accuracy.
 */
export function sampleDataPoints(data: HistoryPoint[]): HistoryPoint[] {
  if (data.length <= 50) return data;

  const sampled: HistoryPoint[] = [];
  let lastBucketTime = 0;

  for (const point of data) {
    const bucketTime = Math.floor(point.timestamp / SAMPLE_INTERVAL_MS) * SAMPLE_INTERVAL_MS;

    if (bucketTime !== lastBucketTime) {
      sampled.push(point);
      lastBucketTime = bucketTime;
    }
  }

  if (sampled.length > 0 && sampled[sampled.length - 1] !== data[data.length - 1]) {
    sampled.push(data[data.length - 1]);
  }

  return sampled;
}

/**
 * Compares two snapshots of AleBilet tickets and identifies which ones were sold.
 * A ticket is "sold" when it disappears or its quantity decreases.
 */
export function findSoldTickets(
  previousTickets: AleBiletTicket[],
  currentTickets: AleBiletTicket[]
): AleBiletSoldTicket[] {
  const soldTickets: AleBiletSoldTicket[] = [];
  const currentMap = new Map(currentTickets.map(t => [t.id, t]));
  const now = Date.now();

  for (const prev of previousTickets) {
    const current = currentMap.get(prev.id);

    if (!current) {
      soldTickets.push({
        ...prev,
        soldAt: now,
        previousQuantity: prev.quantity,
        soldQuantity: prev.quantity,
      });
    } else if (current.quantity < prev.quantity) {
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

/**
 * Calculates sales velocity metrics from history data.
 */
export function calculateSalesMetrics(
  totalAvailable: number,
  history: HistoryPoint[],
  now: number = Date.now()
) {
  const oneHourAgo = now - 3600000;
  const hourAgoPoint = history.find(h => h.timestamp >= oneHourAgo) || history[0];

  const ticketsSoldLastHour = hourAgoPoint
    ? Math.max(0, hourAgoPoint.totalAvailable - totalAvailable)
    : 0;

  const timeSinceHourAgo = hourAgoPoint
    ? (now - hourAgoPoint.timestamp) / 60000
    : 0;

  const salesRate = timeSinceHourAgo > 0
    ? ticketsSoldLastHour / timeSinceHourAgo
    : 0;

  const minutesToSellout = salesRate > 0 ? totalAvailable / salesRate : 0;
  const selloutDate = salesRate > 0
    ? new Date(now + minutesToSellout * 60000)
    : null;

  return {
    ticketsSoldLastHour,
    salesRate,
    minutesToSellout,
    selloutDate,
  };
}
