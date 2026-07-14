import React, { useState } from 'react';
import { Database, Search, ArrowLeft, Eye } from 'lucide-react';
import { CustomDropdown } from '../CustomDropdown';

export function renderLogValue(log: any, isNew: boolean, userId?: string) {
  const isPhotoUpdate = log.action === "Profile Photo Updated" || log.action?.toLowerCase().includes("profile photo") || log.action?.toLowerCase().includes("avatar");
  
  if (isPhotoUpdate) {
    let val = isNew ? log.newValue : log.previousValue;
    if (typeof val === 'string') {
      val = val.replace(/^(Old Value|New Value):\s*/i, '').replace(/\*\*|"/g, '').trim();
    }
    const displayVal = (val === undefined || val === null || val === "" || val === "N/A" || val === "Default") ? "No Avatar" : val;
    if (isNew) {
      return (
        <span className="text-emerald-400 font-semibold font-mono text-[10px] break-all">
          {displayVal}
        </span>
      );
    } else {
      return (
        <span className="text-neutral-500 font-mono text-[10px] break-all">
          {displayVal}
        </span>
      );
    }
  }

  let val = isNew ? log.newValue : log.previousValue;
  if (typeof val === 'string') {
    val = val.replace(/^(Old Value|New Value):\s*/i, '');
    val = val.replace(/\*\*|"/g, ''); // strip any raw asterisks or double quotes
    val = val.trim();
  }
  const displayVal = (val === undefined || val === null || val === "" || val === "N/A" || val === "Default") ? "N/A" : val;

  if (isNew) {
    return (
      <span className="text-emerald-400 font-semibold font-mono text-[10px]">
        {displayVal}
      </span>
    );
  } else {
    return (
      <span className="text-neutral-400 font-mono text-[10px]">
        {displayVal}
      </span>
    );
  }
}

interface CustomDatePickerProps {
  value: string;
  onChange: (val: string) => void;
  label: string;
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ value, onChange, label }) => {
  const parts = value ? value.split('-') : ['', '', ''];
  const currentYear = parts[0] || '';
  const currentMonth = parts[1] || '';
  const currentDay = parts[2] || '';

  const years = ['2024', '2025', '2026'];
  const months = [
    { value: '01', label: 'Jan' },
    { value: '02', label: 'Feb' },
    { value: '03', label: 'Mar' },
    { value: '04', label: 'Apr' },
    { value: '05', label: 'May' },
    { value: '06', label: 'Jun' },
    { value: '07', label: 'Jul' },
    { value: '08', label: 'Aug' },
    { value: '09', label: 'Sep' },
    { value: '10', label: 'Oct' },
    { value: '11', label: 'Nov' },
    { value: '12', label: 'Dec' },
  ];

  const days = Array.from({ length: 31 }, (_, i) => {
    const d = i + 1;
    return d < 10 ? `0${d}` : `${d}`;
  });

  const handlePartChange = (y: string, m: string, d: string) => {
    if (y || m || d) {
      const resolvedY = y || '2026';
      const resolvedM = m || '01';
      const resolvedD = d || '01';
      onChange(`${resolvedY}-${resolvedM}-${resolvedD}`);
    } else {
      onChange('');
    }
  };

  return (
    <div className="flex flex-col gap-1 w-full text-left">
      <div className="flex items-center justify-between">
        <span className="text-[9px] uppercase font-bold text-neutral-500">{label}</span>
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-[9px] text-red-400 hover:text-red-300 font-semibold cursor-pointer bg-transparent border-0 p-0"
          >
            Clear
          </button>
        )}
      </div>
      <div className="grid grid-cols-3 gap-1.5 w-full">
        <select
          value={currentMonth}
          onChange={(e) => handlePartChange(currentYear, e.target.value, currentDay)}
          className="w-full bg-neutral-900 border border-neutral-850 text-[11px] text-white rounded-xl px-1.5 py-2 h-9 focus:border-marvel focus:outline-none cursor-pointer font-sans appearance-none"
          style={{
            backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.4)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`,
            backgroundPosition: 'right 4px center',
            backgroundSize: '12px',
            backgroundRepeat: 'no-repeat',
            paddingRight: '16px'
          }}
        >
          <option value="" className="bg-neutral-950 text-neutral-400">Month</option>
          {months.map(m => (
            <option key={m.value} value={m.value} className="bg-neutral-950 text-white">{m.label}</option>
          ))}
        </select>

        <select
          value={currentDay}
          onChange={(e) => handlePartChange(currentYear, currentMonth, e.target.value)}
          className="w-full bg-neutral-900 border border-neutral-850 text-[11px] text-white rounded-xl px-1.5 py-2 h-9 focus:border-marvel focus:outline-none cursor-pointer font-sans appearance-none"
          style={{
            backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.4)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`,
            backgroundPosition: 'right 4px center',
            backgroundSize: '12px',
            backgroundRepeat: 'no-repeat',
            paddingRight: '16px'
          }}
        >
          <option value="" className="bg-neutral-950 text-neutral-400">Day</option>
          {days.map(d => (
            <option key={d} value={d} className="bg-neutral-950 text-white">{parseInt(d, 10)}</option>
          ))}
        </select>

        <select
          value={currentYear}
          onChange={(e) => handlePartChange(e.target.value, currentMonth, currentDay)}
          className="w-full bg-neutral-900 border border-neutral-850 text-[11px] text-white rounded-xl px-1.5 py-2 h-9 focus:border-marvel focus:outline-none cursor-pointer font-sans appearance-none"
          style={{
            backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.4)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`,
            backgroundPosition: 'right 4px center',
            backgroundSize: '12px',
            backgroundRepeat: 'no-repeat',
            paddingRight: '16px'
          }}
        >
          <option value="" className="bg-neutral-950 text-neutral-400">Year</option>
          {years.map(y => (
            <option key={y} value={y} className="bg-neutral-950 text-white">{y}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

interface ShieldUpdatesLedgerProps {
  onBack: () => void;
  sandboxUpdates: any[];
  user: any;
  activeTheme: 'oled' | 'cosmic' | 'asgardian' | 'wakanda' | 'stark' | 'hydra';
  isOfflineSandbox: boolean;
  formatToIndianDateTime: (timestamp: number | string) => string;
}

export const ShieldUpdatesLedger: React.FC<ShieldUpdatesLedgerProps> = ({
  onBack,
  sandboxUpdates,
  user,
  activeTheme,
  isOfflineSandbox,
  formatToIndianDateTime,
}) => {
  // Local States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'action-asc' | 'action-desc'>('newest');
  const [timeRange, setTimeRange] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  // Theme helper for Custom Dropdown styles consistency
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

  // Category list
  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'Profile', label: 'Profile' },
    { value: 'Settings', label: 'Settings' },
    { value: 'Watch Status', label: 'Watch Status' },
    { value: 'Theme', label: 'Theme' },
    { value: 'Achievements', label: 'Achievements' },
    { value: 'Account', label: 'Account' }
  ];

  // Sorting list
  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'action-asc', label: 'Action A-Z' },
    { value: 'action-desc', label: 'Action Z-A' },
  ];

  // Time range list
  const timeRangeOptions = [
    { value: 'all', label: 'All' },
    { value: '24h', label: 'Past 24 Hours' },
    { value: '7d', label: 'Past 7 Days' },
    { value: '1m', label: 'Past 1 Month' },
    { value: 'custom', label: 'Custom Range' },
  ];

  // Raw logs list
  const logs = isOfflineSandbox ? sandboxUpdates : (user?.updates || []);

  // Filter logic
  const filtered = logs.filter((log: any) => {
    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchAction = log.action?.toLowerCase().includes(q);
      const matchPrev = log.previousValue?.toLowerCase().includes(q);
      const matchNew = log.newValue?.toLowerCase().includes(q);
      if (!matchAction && !matchPrev && !matchNew) return false;
    }

    // 2. Category Filter
    if (filterCategory !== 'all' && log.source !== filterCategory) {
      return false;
    }

    // 3. Time Range Filter
    const timestamp = log.timestamp;
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

  // Sort logic
  const sorted = [...filtered].sort((a: any, b: any) => {
    if (sortOrder === 'newest') return b.timestamp - a.timestamp;
    if (sortOrder === 'oldest') return a.timestamp - b.timestamp;
    if (sortOrder === 'action-asc') return (a.action || '').localeCompare(b.action || '');
    if (sortOrder === 'action-desc') return (b.action || '').localeCompare(a.action || '');
    return 0;
  });

  const limit = 15;
  const maxPage = Math.ceil(sorted.length / limit) || 1;
  const currentPage = Math.min(page, maxPage);
  const startIndex = (currentPage - 1) * limit;
  const pageLogs = sorted.slice(startIndex, startIndex + limit);

  return (
    <div className="flex flex-col animate-fadeIn text-left gap-2 font-sans w-full py-1 px-1" id="updates-ledger-expanded">
      <div className="flex flex-col gap-1 text-left">
        <h2 className="font-display font-bold text-2xl tracking-tight text-white flex items-center gap-2">
          <Database className={`${themeStyles.marvelIcon} w-6 h-6 animate-pulse`} />
          S.H.I.E.L.D. Updates Ledger
        </h2>
        <p className="font-sans text-xs text-neutral-400">
          Query complete audit trail of modifications made to your Avenger Agent records over time.
        </p>
      </div>

      {/* Search and Filters Group */}
      <div className="flex flex-col md:flex-row gap-2.5 z-30 w-full md:items-center">
        {/* Row 1 / Left on desktop: Search Bar */}
        <div className="w-full md:flex-1 relative py-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Search action or values..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full bg-neutral-900 border border-neutral-850 text-white text-xs rounded-xl pl-10 pr-4 py-2.5 h-10 focus:border-marvel focus:outline-none font-sans"
          />
        </div>

        {/* Row 2 / Right on desktop: Three Custom Selectors */}
        <div className="grid grid-cols-3 gap-2.5 w-full md:w-auto md:flex md:items-center flex-shrink-0">
          <div className="md:w-44">
            <CustomDropdown
              value={filterCategory}
              onChange={(val) => {
                setFilterCategory(val);
                setPage(1);
              }}
              options={categoryOptions}
              activeTheme={activeTheme}
              placeholder="All Categories"
              align="left"
            />
          </div>

          <div className="md:w-36">
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

          <div className="md:w-36">
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

      {/* Audit trail table */}
      <div className="flex flex-col gap-3 text-left pt-3 pb-4">
        {/* Row Header with Single-Line Labels prevented from wrapping */}
        <div className="flex items-center justify-between gap-2 border-b border-neutral-850 pb-2.5">
          <span className="text-xs sm:text-sm uppercase font-bold text-neutral-200 tracking-wider font-display whitespace-nowrap">
            Update Logs
          </span>
          <span className="font-mono text-[9px] text-neutral-500 uppercase tracking-widest whitespace-nowrap">
            {sorted.length} matches logged
          </span>
        </div>

        {pageLogs.length > 0 ? (
          <div className="flex flex-col gap-4 text-left">
            <div className="overflow-x-auto no-scrollbar -mx-4 sm:-mx-6 w-[calc(100%+2rem)] sm:w-[calc(100%+3rem)] border-t border-b border-neutral-900/40 text-left">
              <table className="w-full text-left font-mono text-[10px] leading-normal border-collapse min-w-[750px]">
                <thead>
                  <tr className="bg-neutral-950/20 text-neutral-400 uppercase tracking-wider border-b border-neutral-900 text-[8px]">
                    <th className="py-2.5 pl-4 sm:pl-6 pr-3 font-semibold text-left whitespace-nowrap w-[150px]">Timestamp</th>
                    <th className="py-2.5 px-3 font-semibold text-left whitespace-nowrap w-[100px]">Category</th>
                    <th className="py-2.5 px-3 font-semibold text-left whitespace-nowrap">Action</th>
                    <th className="py-2.5 px-3 font-semibold text-left whitespace-nowrap">Old Value</th>
                    <th className="py-2.5 px-3 font-semibold text-left whitespace-nowrap">New Value</th>
                    <th className="py-2.5 pl-3 pr-4 sm:pr-6 font-semibold text-left whitespace-nowrap w-[120px]">Agent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900/40 text-neutral-300">
                  {pageLogs.map((log: any, idx: number) => (
                    <tr key={log.id || idx} className="hover:bg-neutral-900/10 transition-colors">
                      <td className="py-2.5 pl-4 sm:pl-6 pr-3 text-left whitespace-nowrap">
                        {formatToIndianDateTime(log.timestamp)}
                      </td>
                      <td className="py-2.5 px-3 text-left whitespace-nowrap">
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                          log.source === 'Profile'
                            ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                            : log.source === 'Settings'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : log.source === 'Watch Status'
                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                            : log.source === 'Theme'
                            ? 'bg-teal-500/10 text-teal-400 border-teal-500/20'
                            : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                        }`}>
                          {log.source || 'General'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-left font-semibold whitespace-nowrap">
                        {log.action}
                      </td>
                      <td className="py-2.5 px-3 text-left max-w-xs truncate" title={log.previousValue}>
                        {renderLogValue(log, false, user?.userId)}
                      </td>
                      <td className="py-2.5 px-3 text-left max-w-xs font-semibold text-emerald-400 truncate" title={log.newValue}>
                        {renderLogValue(log, true, user?.userId)}
                      </td>
                      <td className="py-2.5 pl-3 pr-4 sm:pr-6 text-left whitespace-nowrap text-neutral-400">
                        @{log.userPerformed || 'sandbox_agent'}
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
          <p className="text-[10px] text-neutral-500 italic text-center py-8">No modifications found matching query.</p>
        )}
      </div>
    </div>
  );
};
