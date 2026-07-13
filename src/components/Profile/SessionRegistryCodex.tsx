import React, { useState } from 'react';
import { Eye, Search, ArrowLeft } from 'lucide-react';
import { CustomDropdown } from '../CustomDropdown';
import { CustomDatePicker } from './ShieldUpdatesLedger';

interface SessionRegistryCodexProps {
  onBack: () => void;
  user: any;
  activeTheme: 'oled' | 'cosmic' | 'asgardian' | 'wakanda' | 'stark' | 'hydra';
  formatToIndianDateTime: (timestamp: number | string) => string;
}

export const SessionRegistryCodex: React.FC<SessionRegistryCodexProps> = ({
  onBack,
  user,
  activeTheme,
  formatToIndianDateTime,
}) => {
  // Local States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'browser-asc' | 'os-asc'>('newest');
  const [timeRange, setTimeRange] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  // Theme helper for consistency
  const getThemeStyles = () => {
    switch (activeTheme) {
      case 'cosmic':
        return {
          button: 'border-indigo-500/30 bg-neutral-950/80 text-white focus:border-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.05)] hover:border-indigo-500/50',
          marvelIcon: 'text-indigo-400',
        };
      case 'asgardian':
        return {
          button: 'border-amber-500/30 bg-neutral-950/80 text-white focus:border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.05)] hover:border-amber-500/50',
          marvelIcon: 'text-amber-400',
        };
      case 'wakanda':
        return {
          button: 'border-purple-500/30 bg-neutral-950/80 text-white focus:border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.05)] hover:border-purple-500/50',
          marvelIcon: 'text-purple-400',
        };
      case 'stark':
        return {
          button: 'border-sky-500/30 bg-neutral-950/80 text-white focus:border-sky-500 shadow-[0_0_10px_rgba(56,189,248,0.05)] hover:border-sky-500/50',
          marvelIcon: 'text-sky-400',
        };
      case 'hydra':
        return {
          button: 'border-red-500/30 bg-neutral-950/80 text-white focus:border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.05)] hover:border-red-500/50',
          marvelIcon: 'text-red-500',
        };
      default: // oled
        return {
          button: 'border-neutral-800 bg-neutral-950/90 text-white focus-within:border-marvel shadow-[0_0_10px_rgba(230,36,41,0.05)] hover:border-neutral-700',
          marvelIcon: 'text-marvel',
        };
    }
  };

  const themeStyles = getThemeStyles();

  // Status options
  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'Active', label: 'Active' },
    { value: 'Logged Out', label: 'Logged Out' },
    { value: 'Expired', label: 'Expired' },
  ];

  // Sorting options
  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'browser-asc', label: 'Browser A-Z' },
    { value: 'os-asc', label: 'OS A-Z' },
  ];

  // Time range options
  const timeRangeOptions = [
    { value: 'all', label: 'All Time' },
    { value: '24h', label: 'Past 24 Hours' },
    { value: '7d', label: 'Past 7 Days' },
    { value: '1m', label: 'Past 1 Month' },
    { value: 'custom', label: 'Custom Range' },
  ];

  const sessions = user?.sessions ? [...user.sessions] : [];

  // Filtering
  const filtered = sessions.filter((s: any) => {
    // 1. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const bM = s.browser?.toLowerCase().includes(q);
      const oM = s.os?.toLowerCase().includes(q);
      const sM = s.status?.toLowerCase().includes(q);
      const stM = s.startedAt ? formatToIndianDateTime(s.startedAt).toLowerCase().includes(q) : false;
      const eM = s.endedAt ? formatToIndianDateTime(s.endedAt).toLowerCase().includes(q) : false;
      if (!bM && !oM && !sM && !stM && !eM) return false;
    }

    // 2. Status filter
    if (filterStatus !== 'all' && s.status !== filterStatus) {
      return false;
    }

    // 3. Time range filter
    const timestamp = typeof s.startedAt === 'number' ? s.startedAt : new Date(s.startedAt).getTime();
    const now = Date.now();
    if (timeRange === '24h') {
      if (timestamp < now - 24 * 60 * 60 * 1000) return false;
    } else if (timeRange === '7d') {
      if (timestamp < now - 7 * 24 * 60 * 60 * 1000) return false;
    } else if (timeRange === '1m') {
      if (timestamp < now - 30 * 24 * 60 * 60 * 1000) return false;
    } else if (timeRange === 'custom') {
      if (startDate) {
        const startMs = new Date(startDate).getTime();
        if (timestamp < startMs) return false;
      }
      if (endDate) {
        const endMs = new Date(endDate).getTime() + 24 * 60 * 60 * 1000 - 1;
        if (timestamp > endMs) return false;
      }
    }

    return true;
  });

  // Sorting
  const sorted = [...filtered].sort((a: any, b: any) => {
    if (sortOrder === 'newest') return b.startedAt - a.startedAt;
    if (sortOrder === 'oldest') return a.startedAt - b.startedAt;
    if (sortOrder === 'browser-asc') return (a.browser || '').localeCompare(b.browser || '');
    if (sortOrder === 'os-asc') return (a.os || '').localeCompare(b.os || '');
    return 0;
  });

  const limit = 10;
  const maxPage = Math.ceil(sorted.length / limit) || 1;
  const currentPage = Math.min(page, maxPage);
  const startIndex = (currentPage - 1) * limit;
  const pageSessions = sorted.slice(startIndex, startIndex + limit);

  return (
    <div className="flex flex-col animate-fadeIn text-left gap-3 font-sans w-full py-2 px-1" id="session-registry-codex-expanded">
      {/* Inline Back navigation above the title */}
      <div className="pt-0 pb-0.5">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2.5 text-sm sm:text-base font-semibold text-neutral-300 hover:text-white transition-all focus:outline-none cursor-pointer bg-transparent border-0 py-2 pr-4 pl-0 hover:translate-x-[-2px] min-h-[40px] touch-manipulation"
        >
          <ArrowLeft className={`w-5 h-5 ${themeStyles.marvelIcon} animate-fadeIn`} />
          <span>Back to Profile</span>
        </button>
      </div>

      <div className="flex flex-col gap-1 text-left">
        <h2 className="font-display font-bold text-2xl tracking-tight text-white flex items-center gap-2">
          <Eye className={`${themeStyles.marvelIcon} w-6 h-6`} />
          Session Registry Codex
        </h2>
        <p className="font-sans text-xs text-neutral-400">
          Audit all security sessions, client devices, and authentication states for Agent @{user?.username || 'sandbox_mode'}.
        </p>
      </div>

      {/* Row 1: Search Bar */}
      <div className="w-full relative py-1 z-30">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
        <input
          type="text"
          placeholder="Search browser, OS..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1);
          }}
          className="w-full bg-neutral-900 border border-neutral-850 text-white text-xs rounded-xl pl-10 pr-4 py-2.5 h-10 focus:border-marvel focus:outline-none font-sans"
        />
      </div>

      {/* Row 2: Three Custom Selectors on the same row, including on mobile */}
      <div className="grid grid-cols-3 gap-2.5 z-20">
        <div>
          <CustomDropdown
            value={filterStatus}
            onChange={(val) => {
              setFilterStatus(val);
              setPage(1);
            }}
            options={statusOptions}
            activeTheme={activeTheme}
            placeholder="All Statuses"
            align="left"
          />
        </div>

        <div>
          <CustomDropdown
            value={sortOrder}
            onChange={(val) => {
              setSortOrder(val as any);
              setPage(1);
            }}
            options={sortOptions}
            activeTheme={activeTheme}
            placeholder="Sort By"
            align="center"
          />
        </div>

        <div>
          <CustomDropdown
            value={timeRange}
            onChange={(val) => {
              setTimeRange(val);
              setPage(1);
            }}
            options={timeRangeOptions}
            activeTheme={activeTheme}
            placeholder="Time Range"
            align="right"
          />
        </div>
      </div>

      {/* Custom Range: Additional Custom Selectors */}
      {timeRange === 'custom' && (
        <div className="grid grid-cols-2 gap-3 mt-1.5 animate-fadeIn z-10">
          <CustomDatePicker
            value={startDate}
            onChange={(val) => {
              setStartDate(val);
              setPage(1);
            }}
            label="From"
          />

          <CustomDatePicker
            value={endDate}
            onChange={(val) => {
              setEndDate(val);
              setPage(1);
            }}
            label="To"
          />
        </div>
      )}

      {/* Detailed Session Table */}
      <div className="flex flex-col gap-3 text-left pt-3 pb-4">
        {/* Row Header with Single-Line Labels prevented from wrapping */}
        <div className="flex items-center justify-between gap-2 border-b border-neutral-850 pb-2.5">
          <span className="text-xs sm:text-sm uppercase font-bold text-neutral-200 tracking-wider font-display whitespace-nowrap">
            Session Logs
          </span>
          <span className="font-mono text-[9px] text-neutral-500 uppercase tracking-widest whitespace-nowrap">
            {sorted.length} sessions logged
          </span>
        </div>

        {pageSessions.length > 0 ? (
          <div className="flex flex-col gap-4 text-left">
            <div className="overflow-x-auto no-scrollbar -mx-4 sm:-mx-6 w-[calc(100%+2rem)] sm:w-[calc(100%+3rem)] border-t border-b border-neutral-900/40 text-left">
              <table className="w-full text-left font-mono text-[10px] leading-normal border-collapse min-w-[650px]">
                <thead>
                  <tr className="bg-neutral-950/20 text-neutral-400 uppercase tracking-wider border-b border-neutral-900 text-[8px]">
                    <th className="py-2.5 pl-4 sm:pl-6 pr-3 font-semibold text-left whitespace-nowrap">Session Start</th>
                    <th className="py-2.5 px-3 font-semibold text-left whitespace-nowrap">Session End</th>
                    <th className="py-2.5 px-3 font-semibold text-left whitespace-nowrap">Browser</th>
                    <th className="py-2.5 px-3 font-semibold text-left whitespace-nowrap">Operating System</th>
                    <th className="py-2.5 px-3 font-semibold text-left whitespace-nowrap">Duration</th>
                    <th className="py-2.5 pl-3 pr-4 sm:pr-6 font-semibold text-left whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900/40 text-neutral-300">
                  {pageSessions.map((session: any) => (
                    <tr key={session.sessionId} className="hover:bg-neutral-900/10 transition-colors">
                      <td className="py-2.5 pl-4 sm:pl-6 pr-3 text-left whitespace-nowrap">
                        {formatToIndianDateTime(session.startedAt)}
                      </td>
                      <td className="py-2.5 px-3 text-left whitespace-nowrap text-neutral-500">
                        {session.endedAt ? formatToIndianDateTime(session.endedAt) : 'Ongoing'}
                      </td>
                      <td className="py-2.5 px-3 text-left whitespace-nowrap">
                        {session.browser}
                      </td>
                      <td className="py-2.5 px-3 text-left whitespace-nowrap">
                        {session.os}
                      </td>
                      <td className="py-2.5 px-3 text-left whitespace-nowrap font-semibold">
                        {session.endedAt 
                          ? `${session.durationSeconds ?? 0}s`
                          : 'Active now'
                        }
                      </td>
                      <td className="py-2.5 pl-3 pr-4 sm:pr-6 text-left whitespace-nowrap">
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${
                          session.status === 'Active'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : session.status === 'Logged Out'
                            ? 'bg-neutral-900 text-neutral-400 border-neutral-800'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>
                          {session.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {maxPage > 1 && (
              <div className="flex items-center justify-between pt-2 font-sans text-xs">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white disabled:opacity-40 disabled:hover:text-neutral-300 transition-colors cursor-pointer"
                >
                  Previous
                </button>
                <span className="text-neutral-500 font-mono text-[10px]">
                  Page {currentPage} of {maxPage}
                </span>
                <button
                  type="button"
                  disabled={currentPage === maxPage}
                  onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
                  className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white disabled:opacity-40 disabled:hover:text-neutral-300 transition-colors cursor-pointer"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        ) : (
          <p className="text-[10px] text-neutral-500 italic text-center py-8">No sessions found matching filters.</p>
        )}
      </div>
    </div>
  );
};
