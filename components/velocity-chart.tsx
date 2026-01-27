'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HistoryPoint } from '@/lib/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { RotateCcw } from 'lucide-react';

interface VelocityChartProps {
  history: HistoryPoint[];
}

type TimeRange = '1h' | '6h' | '12h' | '24h' | 'all';

export function VelocityChart({ history }: VelocityChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [zoomRange, setZoomRange] = useState<[number, number]>([0, 100]); // percentage

  // Filter history based on time range
  const filteredHistory = useMemo(() => {
    if (timeRange === 'all') return history;

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

  // Apply zoom range to filtered history
  const zoomedHistory = useMemo(() => {
    if (zoomRange[0] === 0 && zoomRange[1] === 100) return filteredHistory;

    const startIdx = Math.floor((zoomRange[0] / 100) * filteredHistory.length);
    const endIdx = Math.ceil((zoomRange[1] / 100) * filteredHistory.length);
    return filteredHistory.slice(startIdx, endIdx);
  }, [filteredHistory, zoomRange]);

  // First point of zoomed data as baseline
  const baselineTickets = zoomedHistory[0]?.totalAvailable || 1;

  const chartData = zoomedHistory.map(point => {
    const percentChange = ((point.totalAvailable - baselineTickets) / baselineTickets) * 100;
    const ticketsSoldFromStart = baselineTickets - point.totalAvailable;
    return {
      time: new Date(point.timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      tickets: point.totalAvailable,
      percentChange: percentChange,
      ticketsSold: ticketsSoldFromStart,
    };
  });

  // Calculate domain with padding to show changes clearly
  const percentValues = chartData.map(d => d.percentChange);
  const minPercent = Math.min(...percentValues);
  const maxPercent = Math.max(...percentValues);
  const range = Math.max(Math.abs(minPercent), Math.abs(maxPercent), 0.5); // minimum 0.5% range
  const padding = range * 0.2;

  // Symmetric domain around changes or from min to 0 if all negative
  const yMin = Math.floor((minPercent - padding) * 10) / 10;
  const yMax = Math.ceil((Math.max(0, maxPercent) + padding) * 10) / 10;

  // Total change info
  const totalChange = chartData[chartData.length - 1]?.percentChange || 0;
  const ticketsSold = baselineTickets - (zoomedHistory[zoomedHistory.length - 1]?.totalAvailable || baselineTickets);

  const resetZoom = () => {
    setZoomRange([0, 100]);
    setTimeRange('all');
  };

  return (
    <Card className="relative overflow-hidden border-border/40 bg-card/50 backdrop-blur-xl p-6">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h3 className="text-lg font-semibold text-foreground">Sales Velocity</h3>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">
              Sprzedano: <span className="text-foreground font-medium">{ticketsSold.toLocaleString('pl-PL')}</span>
            </span>
            <span className={`font-medium ${totalChange < 0 ? 'text-red-500' : totalChange > 0 ? 'text-green-500' : 'text-muted-foreground'}`}>
              {totalChange > 0 ? '+' : ''}{totalChange.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Time range buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground mr-2">Zakres:</span>
          {(['1h', '6h', '12h', '24h', 'all'] as TimeRange[]).map((r) => (
            <Button
              key={r}
              variant={timeRange === r ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setTimeRange(r);
                setZoomRange([0, 100]);
              }}
              className="h-7 px-3 text-xs"
            >
              {r === 'all' ? 'Wszystko' : r}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={resetZoom}
            className="h-7 px-2 ml-2"
            title="Reset zoom"
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        </div>

        {/* Zoom slider */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Zoom:</span>
          <div className="flex-1 flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={Math.max(0, zoomRange[1] - 10)}
              value={zoomRange[0]}
              onChange={(e) => setZoomRange([Number(e.target.value), zoomRange[1]])}
              className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <input
              type="range"
              min={Math.min(100, zoomRange[0] + 10)}
              max={100}
              value={zoomRange[1]}
              onChange={(e) => setZoomRange([zoomRange[0], Number(e.target.value)])}
              className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
          <span className="text-xs text-muted-foreground w-24 text-right">
            {zoomRange[0]}% - {zoomRange[1]}%
          </span>
        </div>

        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="time"
                stroke="rgba(255,255,255,0.5)"
                style={{ fontSize: '12px' }}
                tick={{ fill: 'rgba(255,255,255,0.7)' }}
              />
              <YAxis
                domain={[yMin, yMax]}
                stroke="rgba(255,255,255,0.5)"
                style={{ fontSize: '11px' }}
                tick={{ fill: 'rgba(255,255,255,0.7)' }}
                tickFormatter={(value) => `${value.toFixed(1)}%`}
                width={55}
                label={{
                  value: 'Zmiana %',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fill: 'rgba(255,255,255,0.7)', fontSize: '12px' }
                }}
              />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.3)" strokeDasharray="3 3" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0,0,0,0.9)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  padding: '12px'
                }}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-black/90 border border-white/20 rounded-lg p-3 text-sm">
                        <p className="text-white/70 mb-2">{label}</p>
                        <p className="text-white">
                          Dostępne: <span className="font-medium">{data.tickets.toLocaleString('pl-PL')}</span>
                        </p>
                        <p className={`${data.percentChange < 0 ? 'text-red-400' : data.percentChange > 0 ? 'text-green-400' : 'text-white/70'}`}>
                          Zmiana: <span className="font-medium">{data.percentChange > 0 ? '+' : ''}{data.percentChange.toFixed(2)}%</span>
                        </p>
                        <p className="text-orange-400">
                          Sprzedano: <span className="font-medium">{data.ticketsSold.toLocaleString('pl-PL')}</span>
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="monotone"
                dataKey="percentChange"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ fill: '#ef4444', r: 3 }}
                activeDot={{ r: 5, fill: '#ef4444' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="text-xs text-muted-foreground text-center">
          Zmiana procentowa od pierwszego punktu w widoku ({baselineTickets.toLocaleString('pl-PL')} biletów) | Punktów: {chartData.length}
        </div>
      </div>
    </Card>
  );
}
