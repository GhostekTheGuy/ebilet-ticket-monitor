'use client';

import { useEffect, useState, useCallback } from 'react';
import { StatsCard } from '@/components/stats-card';
import { ZoneCard } from '@/components/zone-card';
import { VelocityChart } from '@/components/velocity-chart';
import { GAChart } from '@/components/ga-chart';
import { SectorTable } from '@/components/sector-table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { SECTORS, WATCHED_SECTORS, SectorData, HistoryPoint, ZoneSummary, ApiResponse, AleBiletEventData, AleBiletSoldTicket } from '@/lib/types';
import { fetchTicketData, fetchHistory, fetchAleBiletData, fetchAleBiletSoldTickets } from '@/lib/api';
import { AleBiletSold } from '@/components/alebilet-sold';
import { RefreshCw, AlertCircle } from 'lucide-react';

const REFRESH_INTERVAL = 900000; // 15 minutes

const ZONE_COLORS = {
  red: '#ef4444',
  yellow: '#eab308',
  green: '#22c55e',
  ga: '#3b82f6',
};

const ZONE_NAMES = {
  red: 'Strefa Czerwona',
  yellow: 'Strefa Żółta',
  green: 'Strefa Zielona',
  ga: 'General Admission',
};

export default function Dashboard() {
  const [sectors, setSectors] = useState<SectorData[]>([]);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [secondsSinceUpdate, setSecondsSinceUpdate] = useState(0);
  const [previousSectors, setPreviousSectors] = useState<Map<string, number>>(new Map());
  const [aleBiletEvents, setAleBiletEvents] = useState<AleBiletEventData[]>([]);
  const [aleBiletSoldTickets, setAleBiletSoldTickets] = useState<AleBiletSoldTicket[]>([]);
  const { toast } = useToast();

  const loadHistory = useCallback(async (incremental: boolean = false) => {
    try {
      // Get last timestamp for incremental fetch
      const lastTimestamp = incremental && history.length > 0
        ? history[history.length - 1].timestamp
        : undefined;

      const historyData = await fetchHistory(72, lastTimestamp);

      if (incremental && lastTimestamp) {
        // Append only new records
        setHistory(prev => [...prev, ...historyData.history]);
      } else {
        setHistory(historyData.history);
      }
    } catch (err) {
      console.error('[v0] Failed to load history:', err);
    }
  }, [history]);

  const loadAleBiletData = useCallback(async () => {
    try {
      const data = await fetchAleBiletData();
      setAleBiletEvents(data.events);

      // Count total newly sold tickets across all events
      const totalNewlySold = data.events.reduce((sum, e) => sum + e.soldTickets.length, 0);

      // Notify about newly sold tickets
      if (totalNewlySold > 0) {
        toast({
          title: 'AleBilet - Sprzedano bilety!',
          description: `${totalNewlySold} ofert zostało sprzedanych`,
        });
      }

      // Fetch historical sold tickets (includes newly sold ones)
      const soldData = await fetchAleBiletSoldTickets(24);
      setAleBiletSoldTickets(soldData.soldTickets);
    } catch (err) {
      console.error('[AleBilet] Failed to load data:', err);
    }
  }, [toast]);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const data: ApiResponse = await fetchTicketData();

      const sectorArray: SectorData[] = Object.entries(data.sfc)
        .map(([id, available]) => {
          const sectorInfo = SECTORS[id];
          if (!sectorInfo) return null;

          return {
            id,
            name: sectorInfo.name,
            zone: sectorInfo.zone,
            available,
          };
        })
        .filter((s): s is SectorData => s !== null);

      // Check for watched sectors that got new tickets
      sectorArray.forEach(sector => {
        if (WATCHED_SECTORS.includes(sector.name)) {
          const previousAvailable = previousSectors.get(sector.id);
          if (previousAvailable !== undefined && previousAvailable === 0 && sector.available > 0) {
            toast({
              title: '🎟️ Tickets Available!',
              description: `Sector ${sector.name} now has ${sector.available} tickets available!`,
            });
          }
        }
      });

      setSectors(sectorArray);

      // Update previous sectors state
      const newPreviousSectors = new Map<string, number>();
      sectorArray.forEach(sector => {
        newPreviousSectors.set(sector.id, sector.available);
      });
      setPreviousSectors(newPreviousSectors);

      // Reload history from database (incremental - only new records)
      await loadHistory(true);

      // Load AleBilet data
      await loadAleBiletData();

      setLastUpdate(Date.now());
      setLoading(false);
    } catch (err) {
      console.error('[v0] Failed to load ticket data:', err);
      setError('Failed to load ticket data. Please try again later.');
      setLoading(false);
    }
  }, [previousSectors, toast, loadHistory, loadAleBiletData]);

  useEffect(() => {
    // Load full history from database first, then current data
    loadHistory(false).then(() => loadData());

    // Set up auto-refresh
    const interval = setInterval(loadData, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Update seconds since last update
    const interval = setInterval(() => {
      setSecondsSinceUpdate(Math.floor((Date.now() - lastUpdate) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [lastUpdate]);

  // Calculate statistics
  const totalAvailable = sectors.reduce((sum, s) => sum + s.available, 0);

  // Find data point from ~1 hour ago for "sold last hour" calculation
  const oneHourAgo = Date.now() - 3600000;
  const hourAgoPoint = history.find(h => h.timestamp >= oneHourAgo) || history[0];

  const ticketsSoldLastHour = hourAgoPoint
    ? Math.max(0, hourAgoPoint.totalAvailable - totalAvailable)
    : 0;

  const timeSinceHourAgo = hourAgoPoint
    ? (Date.now() - hourAgoPoint.timestamp) / 60000
    : 0;

  const salesRate = timeSinceHourAgo > 0
    ? ticketsSoldLastHour / timeSinceHourAgo
    : 0;

  const minutesToSellout = salesRate > 0 ? totalAvailable / salesRate : 0;
  const selloutDate = salesRate > 0 
    ? new Date(Date.now() + minutesToSellout * 60000) 
    : null;

  // Calculate zone summaries
  const zoneSummaries: ZoneSummary[] = Object.entries(ZONE_NAMES).map(([zone, name]) => {
    const zoneSectors = sectors.filter(s => s.zone === zone);
    return {
      name,
      zone: zone as 'red' | 'yellow' | 'green' | 'ga',
      totalAvailable: zoneSectors.reduce((sum, s) => sum + s.available, 0),
      totalSectors: zoneSectors.length,
      soldOutSectors: zoneSectors.filter(s => s.available === 0).length,
      color: ZONE_COLORS[zone as keyof typeof ZONE_COLORS],
    };
  });

  if (loading && sectors.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <RefreshCw className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading ticket data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      
      <div className="container mx-auto p-4 md:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">eBilet Monitor</h1>
            <p className="text-muted-foreground">Real-time ticket availability tracking</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Last updated: {secondsSinceUpdate}s ago
            </div>
            <Button onClick={loadData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-4 rounded-lg border border-destructive/50 bg-destructive/10 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Available"
            value={totalAvailable.toLocaleString()}
            subtitle="tickets remaining"
          />
          <StatsCard
            title="Sold Last Hour"
            value={ticketsSoldLastHour.toLocaleString()}
            subtitle="tickets"
            trend={ticketsSoldLastHour > 0 ? 'up' : 'neutral'}
            trendValue={ticketsSoldLastHour > 0 ? `${ticketsSoldLastHour} sold` : 'No change'}
          />
          <StatsCard
            title="Sales Velocity"
            value={salesRate.toFixed(1)}
            subtitle="tickets per minute"
          />
          <StatsCard
            title="Sellout Estimate"
            value={selloutDate ? `${String(selloutDate.getDate()).padStart(2, '0')}/${String(selloutDate.getMonth() + 1).padStart(2, '0')}/${selloutDate.getFullYear()}` : 'N/A'}
            subtitle={selloutDate ? `${String(selloutDate.getHours()).padStart(2, '0')}:${String(selloutDate.getMinutes()).padStart(2, '0')}` : 'Insufficient data'}
          />
        </div>

        {/* Velocity Chart */}
        {history.length > 1 && (
          <VelocityChart history={history} />
        )}

        {/* GA Chart */}
        {history.length > 1 && (
          <GAChart history={history} />
        )}

        {/* Zone Cards */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Zone Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {zoneSummaries.map(zone => (
              <ZoneCard key={zone.zone} zone={zone} />
            ))}
          </div>
        </div>

        {/* Sector Table */}
        <SectorTable sectors={sectors} />

        {/* AleBilet Section */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">AleBilet - Odsprzedaż</h2>
          <AleBiletSold
            events={aleBiletEvents}
            allSoldTickets={aleBiletSoldTickets}
          />
        </div>
      </div>
    </div>
  );
}
