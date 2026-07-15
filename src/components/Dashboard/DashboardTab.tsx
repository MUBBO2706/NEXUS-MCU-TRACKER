import React from 'react';
import { MCU_TITLES, THEATRICAL_ORDER_IDS, CHRONOLOGICAL_ORDER_IDS } from '../../data/mcuData';
import { UserWatchData, McuTitle } from '../../types';
import { ProgressRing } from '../ProgressRing';
import { LazyImage } from '../LazyImage';
import { Shield, Clock, AlertCircle, Zap } from 'lucide-react';

interface DashboardTabProps {
  watchData: Record<string, UserWatchData>;
  countdownString: string;
  completionPercentage: number;
  quoteOfTheDay: { text: string; character: string; title: string };
  nextRecommendation: McuTitle | null;
  handleSelectMovieId: (id: string) => void;
  orderingMode: 'theatrical' | 'chronological';
}

export function DashboardTab({
  watchData,
  countdownString,
  completionPercentage,
  quoteOfTheDay,
  nextRecommendation,
  handleSelectMovieId,
  orderingMode,
}: DashboardTabProps) {
  const [secondsTick, setSecondsTick] = React.useState<number>(0);

  // Seconds ticking effect for high-fidelity live update
  React.useEffect(() => {
    const interval = setInterval(() => {
      setSecondsTick((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const orderList = nextRecommendation ? (orderingMode === 'theatrical' ? THEATRICAL_ORDER_IDS : CHRONOLOGICAL_ORDER_IDS) : [];
  const orderIndex = nextRecommendation ? orderList.indexOf(nextRecommendation.id) + 1 : 0;

  // Local precise countdown to Avengers: Secret Wars (May 7, 2027)
  const targetDate = new Date('2027-05-07T00:00:00');
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();
  
  let days = 0, hours = 0, minutes = 0, seconds = 0;
  if (diff > 0) {
    days = Math.floor(diff / (1000 * 60 * 60 * 24));
    hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    minutes = Math.floor((diff / (1000 * 60)) % 60);
    seconds = Math.floor((diff / 1000) % 60);
  }

  // Calibration loop (counts down within 15 minutes chunks)
  const currentMinutes = now.getMinutes();
  const currentSeconds = now.getSeconds();
  const minutesToNextSync = 14 - (currentMinutes % 15);
  const secondsToNextSync = 59 - currentSeconds;
  const tvaSyncString = `${String(minutesToNextSync).padStart(2, '0')}m ${String(secondsToNextSync).padStart(2, '0')}s`;

  // Rotate supporting alert messages every 6 seconds
  const alerts = [
    { text: "TVA Secure Link Active. Monitoring 4.8M+ reality lines...", type: "info" },
    { text: "Quantum energy spikes registered near Sector-616 coordinates.", type: "energy" },
    { text: "Multiversal convergence vectors converging. Focus timeline: Earth-616.", type: "danger" }
  ];
  const alertIndex = Math.floor(secondsTick / 6) % alerts.length;
  const activeAlert = alerts[alertIndex];

  return (
    <>
      {/* S.H.I.E.L.D. Multiverse Command & Countdown Hub */}
      <div className="relative rounded-xl p-5 overflow-hidden flex flex-col justify-between min-h-[14rem] sm:min-h-[13rem] h-auto shadow-2xl border border-red-950/40 bg-gradient-to-br from-neutral-950 via-red-950/20 to-neutral-950" id="dashboard-hero-countdown">
        {/* Cover backdrop elements */}
        <div className="absolute inset-0 opacity-15 bg-gradient-to-r from-red-600/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-br from-red-500/10 to-transparent blur-3xl rounded-full pointer-events-none" />

        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 z-10 pb-3 border-b border-red-950/20">
          <div className="flex flex-col text-left">
            <h3 className="font-display font-bold text-xs text-neutral-200 tracking-wide uppercase">
              MULTIVERSE INCURSION CRITICAL
            </h3>
          </div>
        </div>

        {/* Dynamic Card Content Area: Containerless & Naturally Flowing Grid */}
        <div className="z-10 py-3.5 flex-1 grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          {/* Left Side: Countdown Timer & Timeline Progress */}
          <div className="md:col-span-7 flex flex-col gap-3">
            {/* Countdown string & labels presented purely through premium typography without nested boxes */}
            <div className="flex items-baseline gap-1.5 text-left">
              <span className="font-mono text-3xl font-extrabold text-white tracking-tight">
                {String(days).padStart(2, '0')}
              </span>
              <span className="text-[10px] font-mono uppercase text-red-400 font-bold mr-2">d</span>

              <span className="font-mono text-3xl font-extrabold text-white tracking-tight">
                {String(hours).padStart(2, '0')}
              </span>
              <span className="text-[10px] font-mono uppercase text-red-400 font-bold mr-2">h</span>

              <span className="font-mono text-3xl font-extrabold text-white tracking-tight">
                {String(minutes).padStart(2, '0')}
              </span>
              <span className="text-[10px] font-mono uppercase text-red-400 font-bold mr-2">m</span>

              <span className="font-mono text-3xl font-extrabold text-white tracking-tight">
                {String(seconds).padStart(2, '0')}
              </span>
              <span className="text-[10px] font-mono uppercase text-red-400 font-bold">s</span>
            </div>

            {/* Simple Progress bar */}
            <div className="flex flex-col gap-1">
              <div className="h-1 w-full bg-red-950/30 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full" style={{ width: '74.2%' }} />
              </div>
              <div className="flex justify-between items-center text-[9px] font-mono font-medium text-neutral-400">
                <span>Timeline Collapse Vector</span>
                <span className="text-red-400 font-bold">74.2% Converged</span>
              </div>
            </div>
          </div>

          {/* Right Side: Key TVA Metrics & Next Milestones (Side-by-side or stacked on mobile) */}
          <div className="md:col-span-5 flex flex-col gap-3 text-left md:border-l border-red-950/20 md:pl-6 pt-3 md:pt-0">
            <div className="flex flex-col gap-0.5">
              <span className="text-[8px] font-mono font-bold text-neutral-500 uppercase tracking-widest">Active Realities Tracked</span>
              <span className="font-mono text-sm font-extrabold text-neutral-200">
                {(4812042 + Math.floor(secondsTick * 1.3)).toLocaleString()}
              </span>
            </div>

            <div className="flex flex-col gap-0.5">
              <span className="text-[8px] font-mono font-bold text-neutral-500 uppercase tracking-widest">Next Major Convergence</span>
              <span className="font-display font-semibold text-xs text-red-400">
                Avengers: Doomsday (May 2026)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Overall stats section */}
      <div className="grid grid-cols-3 gap-3" id="dashboard-stats-grid">
        <div className="bg-neutral-950 p-3.5 rounded-2xl border border-neutral-800/80 flex flex-col justify-between h-24 overflow-hidden">
          <span className="text-scale-badge uppercase font-bold text-neutral-500 tracking-wider">Completed</span>
          <div className="flex flex-col min-w-0">
            <span className="text-scale-stat font-display font-bold text-white">
              {MCU_TITLES.filter((m) => watchData[m.id]?.status === 'completed').length}
            </span>
            <span className="text-[9px] text-neutral-500 truncate">/ {MCU_TITLES.length} titles</span>
          </div>
        </div>

        <div className="bg-neutral-950 p-3.5 rounded-2xl border border-neutral-800/80 flex flex-col justify-between h-24 overflow-hidden">
          <span className="text-scale-badge uppercase font-bold text-neutral-500 tracking-wider">Hours Tracked</span>
          <div className="flex flex-col min-w-0">
            <span className="text-scale-stat font-display font-bold text-emerald-500">
              {Math.round(
                (MCU_TITLES.reduce((acc, m) => {
                  return watchData[m.id]?.status === 'completed' ? acc + m.runtimeMinutes : acc;
                }, 0) / 60) * 10
              ) / 10}
            </span>
            <span className="text-[9px] text-neutral-500 truncate">Watched</span>
          </div>
        </div>

        {/* Progress Ring Card */}
        <div className="bg-neutral-950 p-2.5 rounded-2xl border border-neutral-800/80 flex items-center justify-center h-24">
          <ProgressRing percentage={completionPercentage} size={76} strokeWidth={6} />
        </div>
      </div>

      {/* Bento Grid layout for secondary features on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start" id="dashboard-bento-grid">
        <div className="space-y-5">
          {/* Continue Watching / Recommended Next Box */}
          {nextRecommendation && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-bold text-neutral-400 tracking-wider font-display whitespace-nowrap">
                    {orderingMode === 'theatrical' ? 'Theatrical Release Order' : 'Chronological Timeline Order'}
                  </span>
                </div>
                <span className="text-[8px] sm:text-[9px] font-mono text-neutral-500 whitespace-nowrap tracking-tight">
                  Saga: {nextRecommendation.saga.split(' ')[0]}
                </span>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5 min-w-0 flex-grow">
                  <LazyImage
                    src={nextRecommendation.posterUrl}
                    alt={nextRecommendation.title}
                    className="w-16 aspect-[2/3] rounded-lg border border-neutral-800 flex-shrink-0"
                  />
                  <div className="flex-grow flex flex-col justify-center min-h-[6.5rem] py-0.5 min-w-0">
                    <div className="space-y-1.5 min-w-0">
                      <h4 className="font-display font-bold text-xs sm:text-sm text-white leading-tight truncate whitespace-nowrap">
                        {nextRecommendation.title}
                      </h4>
                      <p className="text-[10px] text-neutral-400">
                        {nextRecommendation.type === 'movie' ? 'Movie' : 'TV Series'} • {nextRecommendation.releaseYear} • {nextRecommendation.runtimeMinutes} min
                      </p>
                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5 font-mono text-[8px] tracking-tight">
                        <span className="bg-neutral-900/80 border border-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded whitespace-nowrap">
                          Phase {nextRecommendation.phase}
                        </span>
                        <span className="bg-neutral-900/80 border border-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded whitespace-nowrap">
                          {orderingMode === 'theatrical' ? 'Theatrical' : 'Timeline'} #{orderIndex}
                        </span>
                        <span className="bg-neutral-900/80 border border-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded whitespace-nowrap uppercase">
                          IMDb {nextRecommendation.ratings.imdb}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0 w-full md:w-auto">
                  <button
                    onClick={() => handleSelectMovieId(nextRecommendation.id)}
                    className="w-full md:w-max md:px-5 bg-marvel text-white font-semibold text-xs py-2 h-10 rounded-xl hover:bg-red-600 transition-colors text-center font-sans cursor-pointer whitespace-nowrap flex items-center justify-center"
                  >
                    Inspect Detailed Intel
                  </button>
                </div>
              </div>

              {nextRecommendation.importantNotes && (
                <div className="bg-neutral-900/60 p-3 rounded-xl border border-neutral-800 text-[11px] text-neutral-300 italic leading-relaxed">
                  💡 <span className="font-semibold not-italic text-marvel">Important:</span> {nextRecommendation.importantNotes}
                </div>
              )}
            </div>
          )}

          {/* Dynamic Quote of the Day */}
          {quoteOfTheDay.text && (
            <div className="flex flex-col gap-2.5 relative pt-1 pb-2">
              <span className="text-[8px] uppercase font-bold text-neutral-500 tracking-widest font-mono">
                S.H.I.E.L.D. Quote of the Day
              </span>
              <blockquote className="font-display font-medium text-sm text-neutral-200 italic leading-relaxed pr-2">
                "{quoteOfTheDay.text}"
              </blockquote>
              <cite className="not-italic text-[10px] text-marvel font-semibold text-right">
                — {quoteOfTheDay.character}, <span className="text-neutral-500">{quoteOfTheDay.title}</span>
              </cite>
            </div>
          )}
        </div>

        <div className="space-y-5">
          {/* S.H.I.E.L.D. Operations Briefing Card */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-neutral-800/60 pb-2">
              <span className="text-xs uppercase font-bold text-neutral-400 tracking-wider font-display">
                S.H.I.E.L.D. Operations Briefing
              </span>
            </div>

            <div className="flex flex-col gap-3">
              <div className="text-xs text-neutral-300 leading-relaxed">
                S.H.I.E.L.D. databases are fully synchronized. Below is a live operational breakdown of your timeline progression:
              </div>

              {/* Movies Progress */}
              <div className="flex flex-col gap-1 mt-1">
                <div className="flex justify-between items-center text-[10px] font-mono text-neutral-400">
                  <span>Movies Completed</span>
                  <span>
                    {MCU_TITLES.filter(m => m.type === 'movie' && watchData[m.id]?.status === 'completed').length} / {MCU_TITLES.filter(m => m.type === 'movie').length}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-neutral-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-marvel transition-all duration-1000"
                    style={{
                      width: `${
                        (MCU_TITLES.filter(m => m.type === 'movie' && watchData[m.id]?.status === 'completed').length /
                          Math.max(1, MCU_TITLES.filter(m => m.type === 'movie').length)) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* TV Shows Progress */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-[10px] font-mono text-neutral-400">
                  <span>TV Series Completed</span>
                  <span>
                    {MCU_TITLES.filter(m => m.type === 'series' && watchData[m.id]?.status === 'completed').length} / {MCU_TITLES.filter(m => m.type === 'series').length}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-neutral-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 transition-all duration-1000"
                    style={{
                      width: `${
                        (MCU_TITLES.filter(m => m.type === 'series' && watchData[m.id]?.status === 'completed').length /
                          Math.max(1, MCU_TITLES.filter(m => m.type === 'series').length)) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* Operational Insights */}
              <div className="flex flex-col gap-1.5 mt-3 pt-3 border-t border-neutral-800/60">
                <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">
                  Active Directive
                </span>
                <span className="text-[11px] font-medium text-neutral-300 leading-relaxed">
                  {completionPercentage === 100 ? (
                    "🎉 All directives met. S.H.I.E.L.D. archive is 100% complete. Outstanding work, Agent!"
                  ) : completionPercentage >= 50 ? (
                    `🛡️ Keep tracking, Agent! You have logged ${MCU_TITLES.filter(m => watchData[m.id]?.status === 'completed').length} files. The timeline remains stabilized.`
                  ) : (
                    "📂 Initialize more records inside the timeline to establish higher data clearance."
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
