'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { VelocityChart } from '@/components/velocity-chart';
import { GAChart } from '@/components/ga-chart';
import { SectorAccordion } from '@/components/sector-accordion';
import { Sidebar } from '@/components/sidebar';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { SECTORS, WATCHED_SECTORS, SectorData, HistoryPoint, ApiResponse, AleBiletEventData, AleBiletSoldTicket } from '@/lib/types';
import { fetchTicketData, fetchHistory, fetchAleBiletData, fetchAleBiletSoldTickets } from '@/lib/api';
import { AleBiletSold } from '@/components/alebilet-sold';
import { RefreshCw, Search, Bell } from 'lucide-react';

const REFRESH_INTERVAL = 900000;

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
  const [activeSection, setActiveSection] = useState('overview');
  const { toast } = useToast();

  const overviewRef = useRef<HTMLElement>(null);
  const chartsRef = useRef<HTMLElement>(null);
  const sectorsRef = useRef<HTMLElement>(null);
  const alebiletRef = useRef<HTMLElement>(null);

  const handleNavigate = (id: string) => {
    setActiveSection(id);
    const refs: Record<string, React.RefObject<HTMLElement | null>> = {
      overview: overviewRef,
      charts: chartsRef,
      sectors: sectorsRef,
      alebilet: alebiletRef,
    };
    refs[id]?.current?.scrollIntoView({ behavior: 'smooth' });
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
      setError('Failed to load ticket data. Please try again later.');
      setLoading(false);
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

  if (loading && sectors.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-violet-400" />
          <p className="text-muted-foreground">Ładowanie danych...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster />

      {/* Sidebar */}
      <Sidebar activeSection={activeSection} onNavigate={handleNavigate} />

      {/* Main Content */}
      <main className="pl-16 lg:pl-56">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-16 border-b border-[#1a1a1d] bg-[#080808]/80 backdrop-blur-xl">
          <div className="flex h-full items-center justify-between px-6">
            {/* Search */}
            <div className="figma-btn hidden md:flex items-center gap-2 px-[18px] py-2.5 w-52">
              <Search className="h-[15px] w-[15px] text-[#4a4a52]" />
              <span className="text-[#4a4a52] text-[13px]">Szukaj</span>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3.5 ml-auto">
              <div className="figma-btn hidden sm:flex items-center gap-2 text-xs px-4 py-2">
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[#8a8a92]">{secondsSinceUpdate}s temu</span>
              </div>
              <button
                onClick={loadData}
                className="figma-btn h-[34px] w-[34px] rounded-xl flex items-center justify-center text-[#5a5a62] hover:text-white"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              <button
                className="figma-btn h-[34px] w-[34px] rounded-xl flex items-center justify-center text-[#5a5a62] hover:text-white relative"
              >
                <Bell className="h-4 w-4" />
                {aleBiletSoldTickets.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[#3b82f6] text-[10px] flex items-center justify-center font-semibold text-white">
                    {aleBiletSoldTickets.length}
                  </span>
                )}
              </button>
              <div className="figma-btn flex items-center gap-2.5 px-2.5 py-2 pr-3.5">
                <div className="h-[34px] w-[34px] rounded-[10px] bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center text-[13px] font-semibold text-white">
                  T
                </div>
                <div className="hidden lg:block">
                  <div className="text-[13px] font-semibold text-white">Taco</div>
                  <div className="text-[11px] text-[#5a5a62]">taco@dev.com</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6 lg:p-7 space-y-5">
          {/* Hero Overview */}
          <section ref={overviewRef} className="animate-fade-up py-4 lg:py-8">
            <p className="text-sm lg:text-base text-[#8a8a92] font-medium capitalize mb-1">{dateStr}</p>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-[-0.02em] text-white mb-8 lg:mb-12">{greeting}</h1>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0">
              <div className="lg:pr-10 xl:pr-16">
                <p className="text-xs lg:text-sm text-[#8a8a92] mb-2">Dostępne bilety</p>
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl lg:text-5xl xl:text-6xl font-bold text-[#5b9bf5] tracking-[-0.03em]">
                    {totalAvailable.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="lg:border-l lg:border-[#1e1e22] lg:pl-10 xl:pl-16 lg:pr-10 xl:pr-16">
                <p className="text-xs lg:text-sm text-[#8a8a92] mb-2">Sprzedano (1h)</p>
                <span className="text-4xl lg:text-5xl xl:text-6xl font-bold text-white tracking-[-0.03em]">
                  {ticketsSoldLastHour.toLocaleString()}
                </span>
              </div>

              <div className="lg:border-l lg:border-[#1e1e22] lg:pl-10 xl:pl-16 lg:pr-10 xl:pr-16">
                <p className="text-xs lg:text-sm text-[#8a8a92] mb-2">Tempo sprzedaży</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl lg:text-5xl xl:text-6xl font-bold text-white tracking-[-0.03em]">
                    {salesRate.toFixed(1)}
                  </span>
                  <span className="text-lg lg:text-xl xl:text-2xl text-[#5a5a62] font-normal">/min</span>
                </div>
              </div>

              <div className="lg:border-l lg:border-[#1e1e22] lg:pl-10 xl:pl-16">
                <p className="text-xs lg:text-sm text-[#8a8a92] mb-2">Przewidywane wyprzedanie</p>
                <div className="flex items-baseline gap-2">
                  {selloutDate ? (
                    <>
                      <span className="text-4xl lg:text-5xl xl:text-6xl font-bold text-white tracking-[-0.03em]">
                        {String(selloutDate.getDate()).padStart(2, '0')}.{String(selloutDate.getMonth() + 1).padStart(2, '0')}
                      </span>
                      <span className="text-lg lg:text-xl xl:text-2xl text-[#5a5a62] font-normal">
                        {String(selloutDate.getHours()).padStart(2, '0')}:{String(selloutDate.getMinutes()).padStart(2, '0')}
                      </span>
                    </>
                  ) : (
                    <span className="text-4xl lg:text-5xl xl:text-6xl font-bold text-[#5a5a62]">—</span>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Charts */}
          <section ref={chartsRef} className="animate-fade-up-delay-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[16px] font-semibold text-white">Wykresy</h2>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {history.length > 1 && <VelocityChart history={history} />}
              {history.length > 1 && <GAChart history={history} />}
            </div>
          </section>

          {/* Sector Accordion */}
          <section ref={sectorsRef} className="animate-fade-up-delay-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[16px] font-semibold text-white">Szczegóły sektorów</h2>
            </div>
            <SectorAccordion sectors={sectors} />
          </section>

          {/* AleBilet Section */}
          <section ref={alebiletRef} className="animate-fade-up-delay-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[16px] font-semibold text-white">AleBilet - Odsprzedaż</h2>
            </div>
            <AleBiletSold
              events={aleBiletEvents}
              allSoldTickets={aleBiletSoldTickets}
            />
          </section>
        </div>
      </main>
    </div>
  );
}
