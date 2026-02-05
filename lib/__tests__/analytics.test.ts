import { describe, it, expect } from 'vitest';
import { sampleDataPoints, findSoldTickets, calculateSalesMetrics } from '../analytics';
import type { HistoryPoint, AleBiletTicket } from '../types';

describe('sampleDataPoints', () => {
  it('returns data unchanged when <= 50 points', () => {
    const data: HistoryPoint[] = Array.from({ length: 30 }, (_, i) => ({
      timestamp: i * 1000,
      totalAvailable: 1000 - i,
    }));

    expect(sampleDataPoints(data)).toBe(data);
  });

  it('samples data into 3-hour buckets when > 50 points', () => {
    const HOUR = 60 * 60 * 1000;
    // Create 100 points, 1 per hour over ~4 days
    const data: HistoryPoint[] = Array.from({ length: 100 }, (_, i) => ({
      timestamp: i * HOUR,
      totalAvailable: 10000 - i * 10,
    }));

    const sampled = sampleDataPoints(data);

    expect(sampled.length).toBeLessThan(data.length);
    expect(sampled.length).toBeGreaterThan(0);
  });

  it('always includes the last data point', () => {
    const HOUR = 60 * 60 * 1000;
    const data: HistoryPoint[] = Array.from({ length: 100 }, (_, i) => ({
      timestamp: i * HOUR,
      totalAvailable: 10000 - i * 10,
    }));

    const sampled = sampleDataPoints(data);
    const lastOriginal = data[data.length - 1];
    const lastSampled = sampled[sampled.length - 1];

    expect(lastSampled).toBe(lastOriginal);
  });

  it('returns empty array for empty input', () => {
    expect(sampleDataPoints([])).toEqual([]);
  });
});

describe('findSoldTickets', () => {
  const makeTicket = (id: string, quantity: number, price: number): AleBiletTicket => ({
    id,
    eventId: 'test-event',
    category: 'cat01',
    categoryName: 'Trybuny Dolne',
    sector: 'G26',
    row: '5',
    quantity,
    price,
    buyLink: `/buy/${id}`,
  });

  it('detects completely sold tickets', () => {
    const previous = [makeTicket('a', 2, 300), makeTicket('b', 1, 400)];
    const current = [makeTicket('a', 2, 300)]; // 'b' is gone

    const sold = findSoldTickets(previous, current);

    expect(sold).toHaveLength(1);
    expect(sold[0].id).toBe('b');
    expect(sold[0].soldQuantity).toBe(1);
  });

  it('detects partially sold tickets', () => {
    const previous = [makeTicket('a', 4, 300)];
    const current = [makeTicket('a', 2, 300)];

    const sold = findSoldTickets(previous, current);

    expect(sold).toHaveLength(1);
    expect(sold[0].soldQuantity).toBe(2);
    expect(sold[0].previousQuantity).toBe(4);
  });

  it('returns empty when no tickets sold', () => {
    const tickets = [makeTicket('a', 2, 300)];

    const sold = findSoldTickets(tickets, tickets);

    expect(sold).toHaveLength(0);
  });

  it('handles empty previous snapshot', () => {
    const current = [makeTicket('a', 2, 300)];

    const sold = findSoldTickets([], current);

    expect(sold).toHaveLength(0);
  });

  it('detects all tickets sold when current is empty', () => {
    const previous = [makeTicket('a', 2, 300), makeTicket('b', 3, 500)];

    const sold = findSoldTickets(previous, []);

    expect(sold).toHaveLength(2);
    expect(sold[0].soldQuantity).toBe(2);
    expect(sold[1].soldQuantity).toBe(3);
  });
});

describe('calculateSalesMetrics', () => {
  const NOW = 1700000000000; // fixed timestamp

  it('calculates sales rate from history', () => {
    const history: HistoryPoint[] = [
      { timestamp: NOW - 3600000, totalAvailable: 1100 }, // 1 hour ago
      { timestamp: NOW - 1800000, totalAvailable: 1050 }, // 30 min ago
    ];

    const metrics = calculateSalesMetrics(1000, history, NOW);

    expect(metrics.ticketsSoldLastHour).toBe(100);
    expect(metrics.salesRate).toBeGreaterThan(0);
    expect(metrics.selloutDate).not.toBeNull();
  });

  it('returns zero rate when no history', () => {
    const metrics = calculateSalesMetrics(1000, [], NOW);

    expect(metrics.ticketsSoldLastHour).toBe(0);
    expect(metrics.salesRate).toBe(0);
    expect(metrics.selloutDate).toBeNull();
  });

  it('returns null sellout date when no sales', () => {
    const history: HistoryPoint[] = [
      { timestamp: NOW - 3600000, totalAvailable: 1000 },
    ];

    const metrics = calculateSalesMetrics(1000, history, NOW);

    expect(metrics.ticketsSoldLastHour).toBe(0);
    expect(metrics.selloutDate).toBeNull();
  });

  it('never returns negative tickets sold', () => {
    const history: HistoryPoint[] = [
      { timestamp: NOW - 3600000, totalAvailable: 500 }, // tickets increased (restocking)
    ];

    const metrics = calculateSalesMetrics(1000, history, NOW);

    expect(metrics.ticketsSoldLastHour).toBe(0);
  });
});
