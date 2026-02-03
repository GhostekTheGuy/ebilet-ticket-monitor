'use client';

import { useEffect, useState, useCallback } from 'react';
import { Sidebar } from '@/components/sidebar';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { SECTORS, WATCHED_SECTORS, SectorData, HistoryPoint, ApiResponse, AleBiletEventData, AleBiletSoldTicket } from '@/lib/types';
import { fetchTicketData, fetchHistory, fetchAleBiletData, fetchAleBiletSoldTickets } from '@/lib/api';
import { RefreshCw, Search, Menu } from 'lucide-react';

import { OverviewPage } from '@/components/pages/overview-page';
import { SectorsPage } from '@/components/pages/sectors-page';
import { AleBiletPage } from '@/components/pages/alebilet-page';

const REFRESH_INTERVAL = 900000;

export default function Dashboard() {
  const [sectors, setSectors] = useState<SectorData[]>([]);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());
  const [loading, setLoading] = useState(true);
  const [secondsSinceUpdate, setSecondsSinceUpdate] = useState(0);
  const [previousSectors, setPreviousSectors] = useState<Map<string, number>>(new Map());
  const [aleBiletEvents, setAleBiletEvents] = useState<AleBiletEventData[]>([]);
  const [aleBiletSoldTickets, setAleBiletSoldTickets] = useState<AleBiletSoldTicket[]>([]);
  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const handleNavigate = (id: string) => {
    setActiveSection(id);
  };

  const loadHistory = useCallback(async (incremental: boolean = false) => {
    try {
      const lastTimestamp = incremental && history.length > 0
        ? history[history.length - 1].timestamp
        : undefined;

      const historyData = await fetchHistory(72, lastTimestamp);

      if (incremental && lastTimestamp) {
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

      const totalNewlySold = data.events.reduce((sum, e) => sum + e.soldTickets.length, 0);

      if (totalNewlySold > 0) {
        toast({
          title: 'AleBilet - Sprzedano bilety!',
          description: `${totalNewlySold} ofert zostało sprzedanych`,
        });
      }

      const soldData = await fetchAleBiletSoldTickets(24);
      setAleBiletSoldTickets(soldData.soldTickets);
    } catch (err) {
      console.error('[AleBilet] Failed to load data:', err);
    }
  }, [toast]);

  const loadData = useCallback(async () => {
    setRefreshing(true);
    const minAnimationTime = new Promise(resolve => setTimeout(resolve, 800));

    try {
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

      sectorArray.forEach(sector => {
        if (WATCHED_SECTORS.includes(sector.name)) {
          const previousAvailable = previousSectors.get(sector.id);
          if (previousAvailable !== undefined && previousAvailable === 0 && sector.available > 0) {
            toast({
              title: 'Tickets Available!',
              description: `Sector ${sector.name} now has ${sector.available} tickets available!`,
            });
          }
        }
      });

      setSectors(sectorArray);

      const newPreviousSectors = new Map<string, number>();
      sectorArray.forEach(sector => {
        newPreviousSectors.set(sector.id, sector.available);
      });
      setPreviousSectors(newPreviousSectors);

      await loadHistory(true);
      await loadAleBiletData();

      setLastUpdate(Date.now());
      setLoading(false);
    } catch (err) {
      console.error('[v0] Failed to load ticket data:', err);
      setLoading(false);
    } finally {
      await minAnimationTime;
      setRefreshing(false);
    }
  }, [previousSectors, toast, loadHistory, loadAleBiletData]);

  useEffect(() => {
    loadHistory(false).then(() => loadData());
    const interval = setInterval(loadData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsSinceUpdate(Math.floor((Date.now() - lastUpdate) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [lastUpdate]);

  // Computed values for overview
  const totalAvailable = sectors.reduce((sum, s) => sum + s.available, 0);
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

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Dzień dobry' : now.getHours() < 18 ? 'Dzień dobry' : 'Dobry wieczór';
  const dateStr = now.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' });

  // Page titles for header
  const pageTitles: Record<string, string> = {
    overview: 'Przegląd',
    sectors: 'Sektory',
    alebilet: 'AleBilet',
  };

  if (loading && sectors.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-[#5b9bf5]" />
          <p className="text-[#5a5a62]">Ładowanie danych...</p>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <OverviewPage
            totalAvailable={totalAvailable}
            ticketsSoldLastHour={ticketsSoldLastHour}
            salesRate={salesRate}
            selloutDate={selloutDate}
            greeting={greeting}
            dateStr={dateStr}
            history={history}
          />
        );
      case 'sectors':
        return <SectorsPage sectors={sectors} />;
      case 'alebilet':
        return <AleBiletPage events={aleBiletEvents} soldTickets={aleBiletSoldTickets} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Toaster />

      {/* Sidebar */}
      <Sidebar
        activeSection={activeSection}
        onNavigate={handleNavigate}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <main className="lg:pl-56">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-14 border-b border-[#1a1a1d] bg-[#080808]/80 backdrop-blur-xl">
          <div className="flex h-full items-center justify-between px-4 lg:px-6">
            {/* Left side - Menu button on mobile, Search on desktop */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 -ml-2 rounded-lg text-[#5a5a62] hover:text-white hover:bg-white/[0.04] transition-colors"
              >
                <Menu className="h-5 w-5" />
              </button>
              <h2 className="text-base font-semibold text-white lg:hidden">
                {pageTitles[activeSection]}
              </h2>
              <div className="figma-btn hidden lg:flex items-center gap-2 px-4 py-2 w-48">
                <Search className="h-4 w-4 text-[#4a4a52]" />
                <span className="text-[#4a4a52] text-[13px]">Szukaj</span>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2 lg:gap-3">
              <div className="figma-btn hidden md:flex items-center gap-2 text-xs px-3 py-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[#8a8a92]">{secondsSinceUpdate}s</span>
              </div>
              <button
                onClick={loadData}
                disabled={refreshing}
                className="figma-btn h-8 w-8 lg:h-9 lg:w-9 rounded-xl flex items-center justify-center text-[#5a5a62] hover:text-white disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin-spring' : ''}`} />
              </button>
              <img
                src="https://img.wprost.pl/img/taco-hemingway-pokazal-filmy-z-dziecinstwa-nowy-singiel-z-dawidem-podsiadlo/a0/77/234be267720c314f0f4e37498c0a.webp"
                alt="Profile"
                className="hidden md:block h-8 w-8 lg:h-9 lg:w-9 rounded-lg object-cover"
              />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 lg:p-6">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}
