import React from 'react';
import { MCU_TITLES, THEATRICAL_ORDER_IDS, CHRONOLOGICAL_ORDER_IDS } from '../../data/mcuData';
import { UserWatchData, McuTitle } from '../../types';
import { ProgressRing } from '../ProgressRing';
import { LazyImage } from '../LazyImage';

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
  const orderList = nextRecommendation ? (orderingMode === 'theatrical' ? THEATRICAL_ORDER_IDS : CHRONOLOGICAL_ORDER_IDS) : [];
  const orderIndex = nextRecommendation ? orderList.indexOf(nextRecommendation.id) + 1 : 0;

  return (
    <>
      {/* Countdown / Hero Showcase Card */}
      <div className="relative glass-card rounded-xl border border-neutral-800 p-5 overflow-hidden flex flex-col justify-between h-44 shadow-lg" id="dashboard-hero-countdown">
        {/* Cover backdrop element */}
        <div className="absolute inset-0 opacity-25 bg-gradient-to-r from-red-600/20 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-br from-marvel/10 to-transparent blur-2xl rounded-full pointer-events-none" />

        <div className="flex items-start justify-between z-10">
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] uppercase tracking-wider text-marvel font-bold font-mono">
              Multiverse Countdown
            </span>
            <h3 className="font-display font-bold text-base text-white">
              Avengers: Secret Wars
            </h3>
          </div>
          <span className="text-[10px] font-mono bg-marvel/20 border border-marvel/30 text-white px-2.5 py-0.5 rounded-full font-bold">
            Phase 6 Hub
          </span>
        </div>

        <div className="z-10 space-y-1">
          <div className="font-mono text-xl sm:text-2xl font-bold text-white tracking-tight">
            {countdownString}
          </div>
          <p className="text-[10px] text-neutral-400">
            Countdown ticking live until Battleworld resets the sacred timelines in 2027.
          </p>
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

              <div className="flex items-start gap-3.5">
                <LazyImage
                  src={nextRecommendation.posterUrl}
                  alt={nextRecommendation.title}
                  className="w-16 aspect-[2/3] rounded-lg border border-neutral-800"
                />
                <div className="flex-grow flex flex-col justify-between min-h-[6.5rem] py-0.5 min-w-0">
                  <div className="space-y-1 min-w-0">
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

                  <button
                    onClick={() => handleSelectMovieId(nextRecommendation.id)}
                    className="w-full bg-marvel text-white font-semibold text-xs py-2 rounded-xl hover:bg-red-600 transition-colors text-center font-sans mt-2 cursor-pointer"
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
