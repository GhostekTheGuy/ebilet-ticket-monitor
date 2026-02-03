'use client';

import { VelocityChart } from '@/components/velocity-chart';
import { GAChart } from '@/components/ga-chart';
import { HistoryPoint } from '@/lib/types';

interface OverviewPageProps {
  totalAvailable: number;
  ticketsSoldLastHour: number;
  salesRate: number;
  selloutDate: Date | null;
  greeting: string;
  dateStr: string;
  history: HistoryPoint[];
}

export function OverviewPage({
  totalAvailable,
  ticketsSoldLastHour,
  salesRate,
  selloutDate,
  greeting,
  dateStr,
  history,
}: OverviewPageProps) {
  return (
    <div className="space-y-8">
      {/* Hero Stats */}
      <div className="animate-fade-up py-4 lg:py-8">
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
      </div>

      {/* Charts */}
      {history.length > 1 && (
        <div className="animate-fade-up-delay-1 space-y-5">
          <h2 className="text-[16px] font-semibold text-white">Wykresy</h2>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <VelocityChart history={history} />
            <GAChart history={history} />
          </div>
        </div>
      )}
    </div>
  );
}
