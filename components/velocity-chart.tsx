'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HistoryPoint } from '@/lib/types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface VelocityChartProps {
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

export function VelocityChart({ history }: VelocityChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('all');

  const filteredHistory = useMemo(() => {
    if (timeRange === 'all') {
      return sampleDataPoints(history);
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
    return history.filter(point => point.timestamp >= cutoff);
  }, [history, timeRange]);

  const baselineTickets = filteredHistory[0]?.totalAvailable || 1;

  const chartData = filteredHistory.map(point => {
    const percentChange = ((point.totalAvailable - baselineTickets) / baselineTickets) * 100;
    const ticketsSoldFromStart = baselineTickets - point.totalAvailable;
    const date = new Date(point.timestamp);
    return {
      time: `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`,
      fullDate: `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`,
      tickets: point.totalAvailable,
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
  const ticketsSold = baselineTickets - (filteredHistory[filteredHistory.length - 1]?.totalAvailable || baselineTickets);

  return (
    <Card className="p-6 bg-card/50 border-white/5">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h3 className="text-lg font-semibold">Tempo sprzedaży</h3>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">
              Sprzedano: <span className="font-medium">{ticketsSold.toLocaleString('pl-PL')}</span>
            </span>
            <span className={`font-medium ${totalChange < 0 ? 'text-green-500' : totalChange > 0 ? 'text-red-500' : ''}`}>
              {totalChange > 0 ? '+' : ''}{totalChange.toFixed(2)}%
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {(['1h', '6h', '12h', '24h', 'all'] as TimeRange[]).map((r) => (
            <Button
              key={r}
              variant={timeRange === r ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(r)}
            >
              {r === 'all' ? 'Wszystko' : r}
            </Button>
          ))}
        </div>

        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
              <defs>
                <linearGradient id="gradientGreen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradientRed" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="time" className="text-xs" />
              <YAxis
                domain={[yMin, yMax]}
                tickFormatter={(value) => `${value.toFixed(1)}%`}
                className="text-xs"
                width={50}
              />
              <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-popover border rounded-lg p-3 text-sm shadow-lg">
                        <p className="text-muted-foreground mb-2">{data.fullDate}</p>
                        <p>Dostępne: <span className="font-medium">{data.tickets.toLocaleString('pl-PL')}</span></p>
                        <p className={data.percentChange < 0 ? 'text-green-500' : data.percentChange > 0 ? 'text-red-500' : ''}>
                          Zmiana: {data.percentChange > 0 ? '+' : ''}{data.percentChange.toFixed(2)}%
                        </p>
                        <p className="text-green-500">Sprzedano: {data.ticketsSold.toLocaleString('pl-PL')}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="percentChange"
                stroke={totalChange <= 0 ? '#22c55e' : '#ef4444'}
                strokeWidth={2}
                fill={totalChange <= 0 ? 'url(#gradientGreen)' : 'url(#gradientRed)'}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Zmiana od pierwszego punktu ({baselineTickets.toLocaleString('pl-PL')} biletów) | Punktów: {chartData.length}
        </p>
      </div>
    </Card>
  );
}
