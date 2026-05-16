'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { HistoryPoint } from '@/lib/types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface GAChartProps {
  history: HistoryPoint[];
}

type TimeRange = '1h' | '6h' | '12h' | '24h' | 'all';

const SAMPLE_INTERVAL_MS = 3 * 60 * 60 * 1000;

function sampleDataPoints(data: HistoryPoint[]): HistoryPoint[] {
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

export function GAChart({ history }: GAChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('all');

  const gaHistory = useMemo(() => {
    return history.filter(point => point.gaAvailable !== undefined);
  }, [history]);

  const filteredHistory = useMemo(() => {
    if (timeRange === 'all') {
      return sampleDataPoints(gaHistory);
    }

    const now = Date.now();
    const ranges: Record<TimeRange, number> = {
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '12h': 12 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      'all': Infinity,
    };

    const cutoff = now - ranges[timeRange];
    return gaHistory.filter(point => point.timestamp >= cutoff);
  }, [gaHistory, timeRange]);

  const firstGA = filteredHistory.find(p => typeof p.gaAvailable === 'number' && p.gaAvailable > 0)?.gaAvailable;
  const baselineTickets = firstGA ?? 0;

  const chartData = filteredHistory.map(point => {
    const gaAvailable = typeof point.gaAvailable === 'number' ? point.gaAvailable : 0;
    const percentChange = baselineTickets > 0
      ? ((gaAvailable - baselineTickets) / baselineTickets) * 100
      : 0;
    const ticketsSoldFromStart = baselineTickets > 0 ? baselineTickets - gaAvailable : 0;
    const date = new Date(point.timestamp);
    return {
      time: `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`,
      fullDate: `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`,
      tickets: gaAvailable,
      percentChange,
      ticketsSold: ticketsSoldFromStart,
    };
  });

  const percentValues = chartData.map(d => d.percentChange);
  const minPercent = Math.min(...percentValues);
  const maxPercent = Math.max(...percentValues);
  const range = Math.max(Math.abs(minPercent), Math.abs(maxPercent), 0.5);
  const padding = range * 0.2;

  const yMin = Math.floor((minPercent - padding) * 10) / 10;
  const yMax = Math.ceil((Math.max(0, maxPercent) + padding) * 10) / 10;

  const totalChange = chartData[chartData.length - 1]?.percentChange || 0;
  const lastGA = filteredHistory[filteredHistory.length - 1]?.gaAvailable;
  const ticketsSold = baselineTickets > 0 && typeof lastGA === 'number'
    ? baselineTickets - lastGA
    : 0;

  if (gaHistory.length < 2 || baselineTickets === 0) {
    return null;
  }

  return (
    <Card className="p-6">
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent)]" />
            <h3 className="text-[16px] font-semibold text-white">General Admission (Płyta)</h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[#8a8a92] text-[12px]">
              Sprzedano: <span className="font-semibold text-white">{ticketsSold.toLocaleString('pl-PL')}</span>
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
              totalChange < 0
                ? 'bg-[#052e1c] text-[#34d399]'
                : totalChange > 0
                  ? 'bg-[#2e0c0c] text-[#ef4444]'
                  : 'bg-[#191919] text-[#8a8a92]'
            }`}>
              {totalChange > 0 ? '+' : ''}{totalChange.toFixed(2)}%
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(['1h', '6h', '12h', '24h', 'all'] as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-all ${
                timeRange === r
                  ? 'bg-white text-[#111]'
                  : 'text-[#5a5a62] hover:text-white'
              }`}
            >
              {r === 'all' ? 'Wszystko' : r}
            </button>
          ))}
        </div>

        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
              <defs>
                <linearGradient id="gradientBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.035)" vertical={false} />
              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#4a4a52', fontSize: 11 }}
                dy={8}
              />
              <YAxis
                domain={[yMin, yMax]}
                tickFormatter={(value) => `${value.toFixed(1)}%`}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#2e2e32', fontSize: 11 }}
                width={50}
                dx={-5}
              />
              <ReferenceLine y={0} stroke="#2e2e32" strokeDasharray="3 3" />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-[#1c1c1e] border border-[#252528] rounded-xl p-3 text-[12px] shadow-lg">
                        <p className="text-[#5a5a62] mb-2">{data.fullDate}</p>
                        <p className="text-[#c8c8cc]">Dostępne: <span className="font-semibold text-white">{data.tickets.toLocaleString('pl-PL')}</span></p>
                        <p className={data.percentChange < 0 ? 'text-[#4ade80]' : data.percentChange > 0 ? 'text-[#ef4444]' : 'text-[#8a8a92]'}>
                          Zmiana: {data.percentChange > 0 ? '+' : ''}{data.percentChange.toFixed(2)}%
                        </p>
                        <p className="text-[var(--accent)]">Sprzedano: {data.ticketsSold.toLocaleString('pl-PL')}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="percentChange"
                stroke="var(--accent)"
                strokeWidth={2}
                fill="url(#gradientBlue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <p className="text-[11px] text-[#4a4a52] text-center">
          Zmiana od pierwszego punktu ({baselineTickets.toLocaleString('pl-PL')} biletów) | Punktów: {chartData.length}
        </p>
      </div>
    </Card>
  );
}
