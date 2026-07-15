import React, { useState } from 'react';
import { Eye, Search, ArrowLeft } from 'lucide-react';
import { CustomDropdown } from '../CustomDropdown';
import { CustomDatePicker } from '../Common/CustomDatePicker';
import { ConfirmationModal } from '../Common/ConfirmationModal';

interface SessionRegistryCodexProps {
  onBack: () => void;
  user: any;
  activeTheme: 'oled' | 'cosmic' | 'asgardian' | 'wakanda' | 'stark' | 'hydra';
  formatToIndianDateTime: (timestamp: number | string) => string;
  currentSessionId?: string | null;
  onTerminateSession?: (sessionId: string) => Promise<void>;
  onTerminateOtherSessions?: () => Promise<void>;
  onDeleteSession?: (sessionId: string) => Promise<void>;
  onDeleteInactiveSessions?: () => Promise<void>;
}

export const SessionRegistryCodex: React.FC<SessionRegistryCodexProps> = ({
  onBack,
  user,
  activeTheme,
  formatToIndianDateTime,
  currentSessionId,
  onTerminateSession,
  onTerminateOtherSessions,
  onDeleteSession,
  onDeleteInactiveSessions,
}) => {
  // Local States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'browser-asc' | 'os-asc'>('newest');
  const [timeRange, setTimeRange] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [isDurationHHMMSS, setIsDurationHHMMSS] = useState(false);

  // Row-level action states
  const [confirmingTerminateId, setConfirmingTerminateId] = useState<string | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [isRowActionRunning, setIsRowActionRunning] = useState<string | null>(null);

  // Bulk action custom confirmation modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'terminate_others' | 'delete_all_inactive' | null>(null);
  const [isBulkRunning, setIsBulkRunning] = useState(false);

  const formatDuration = (seconds: number | null | undefined) => {
    if (seconds == null) return 'Ongoing';
    if (isDurationHHMMSS) {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}m ${s}s`;
    }
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

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

  const getModalConfirmBtnStyle = () => {
    switch (activeTheme) {
      case 'cosmic':
        return 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-950/20';
      case 'asgardian':
        return 'bg-amber-600 hover:bg-amber-500 shadow-amber-950/20';
      case 'wakanda':
        return 'bg-purple-600 hover:bg-purple-500 shadow-purple-950/20';
      case 'stark':
        return 'bg-sky-600 hover:bg-sky-500 shadow-sky-950/20';
      case 'hydra':
        return 'bg-red-600 hover:bg-red-500 shadow-red-950/20';
      default: // oled
        return 'bg-red-600 hover:bg-red-500 shadow-red-950/20';
    }
  };

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
    <div className="flex flex-col animate-fadeIn text-left gap-2 font-sans w-full py-1 px-1" id="session-registry-codex-expanded">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
        <div className="flex flex-col gap-1 text-left">
          <h2 className="font-display font-bold text-2xl tracking-tight text-white flex items-center gap-2">
            <Eye className={`${themeStyles.marvelIcon} w-6 h-6`} />
            Session Registry Codex
          </h2>
          <p className="font-sans text-xs text-neutral-400">
            Audit all security sessions, client devices, and authentication states for Agent @{user?.username || 'sandbox_mode'}.
          </p>
        </div>
      </div>

      {/* Search and Filters Group */}
      <div className="flex flex-col md:flex-row gap-2.5 z-30 w-full md:items-center">
        {/* Row 1 / Left on desktop: Search Bar */}
        <div className="w-full md:flex-1 relative py-1">
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

        {/* Row 2 / Right on desktop: Custom Selectors */}
        <div className="grid grid-cols-3 md:flex gap-2.5 w-full md:w-auto items-center flex-shrink-0">
          <div className="md:w-44">
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
              compact={true}
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
              compact={true}
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
              compact={true}
            />
          </div>
        </div>
      </div>

      {/* Custom Range: Additional Custom Selectors (rendered ABOVE bulk actions as requested) */}
      {timeRange === 'custom' && (
        <div className="grid grid-cols-2 gap-3 mt-1.5 animate-fadeIn z-10">
          <CustomDatePicker
            value={startDate}
            onChange={(val) => {
              setStartDate(val);
              setPage(1);
            }}
            label="From"
            activeTheme={activeTheme}
          />

          <CustomDatePicker
            value={endDate}
            onChange={(val) => {
              setEndDate(val);
              setPage(1);
            }}
            label="To"
            activeTheme={activeTheme}
          />
        </div>
      )}

      {/* Bulk Actions Row - below both Filters and Custom Range picker */}
      {(onTerminateOtherSessions || onDeleteInactiveSessions) && (
        <div className="flex flex-row items-center justify-start gap-2.5 mt-2.5 w-full border-t border-neutral-900/40 pt-2.5">
          {onTerminateOtherSessions && (
            <button
              type="button"
              disabled={isRowActionRunning !== null || isBulkRunning || sessions.filter((s: any) => s.status === 'Active' && s.sessionId !== currentSessionId).length === 0}
              onClick={() => {
                setModalType('terminate_others');
                setModalOpen(true);
              }}
              className="bg-red-950/40 hover:bg-red-900/60 border border-red-900/60 hover:border-red-500 text-red-200 text-[10px] font-bold uppercase tracking-wider px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-md shrink-0 font-mono flex items-center justify-center disabled:opacity-40 disabled:hover:bg-red-950/40 disabled:hover:border-red-900/60 disabled:cursor-not-allowed whitespace-nowrap"
              title="Terminate all other active sessions except the current one"
            >
              Terminate All Inactive
            </button>
          )}

          {onDeleteInactiveSessions && (
            <button
              type="button"
              disabled={isRowActionRunning !== null || isBulkRunning || sessions.filter((s: any) => s.status !== 'Active' && s.sessionId !== currentSessionId).length === 0}
              onClick={() => {
                setModalType('delete_all_inactive');
                setModalOpen(true);
              }}
              className="bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-700 text-neutral-200 text-[10px] font-bold uppercase tracking-wider px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-md shrink-0 font-mono flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
              title="Permanently delete all terminated/expired/logged-out sessions"
            >
              Delete All Sessions
            </button>
          )}
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
            <div className="overflow-x-auto no-scrollbar -mx-5 w-[calc(100%+2.5rem)] border-t border-b border-neutral-900/40 text-left">
              <table className="w-full text-left font-mono text-[10px] leading-normal border-collapse min-w-[650px]">
                <thead>
                  <tr className="bg-neutral-950/20 text-neutral-400 uppercase tracking-wider border-b border-neutral-900 text-[8px]">
                    <th className="py-2.5 px-3 font-semibold text-left whitespace-nowrap">Session Start</th>
                    <th className="py-2.5 px-3 font-semibold text-left whitespace-nowrap">Session End</th>
                    <th className="py-2.5 px-3 font-semibold text-left whitespace-nowrap">Browser</th>
                    <th className="py-2.5 px-3 font-semibold text-left whitespace-nowrap">Device</th>
                    <th className="py-2.5 px-3 font-semibold text-left whitespace-nowrap">Operating System</th>
                    <th 
                      className="py-2.5 px-3 font-bold text-left whitespace-nowrap cursor-pointer text-neutral-300 hover:text-white transition-colors select-none"
                      onClick={() => setIsDurationHHMMSS(!isDurationHHMMSS)}
                      title="Click to toggle duration format"
                    >
                      Duration
                    </th>
                    <th className="py-2.5 px-3 font-semibold text-left whitespace-nowrap">Status</th>
                    {onTerminateSession && <th className="py-2.5 px-3 font-semibold text-left whitespace-nowrap">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900/40 text-neutral-300">
                  {pageSessions.map((session: any) => (
                    <tr key={session.sessionId} className="hover:bg-neutral-900/10 transition-colors">
                      <td className="py-2.5 px-3 text-left whitespace-nowrap">
                        {formatToIndianDateTime(session.startedAt)}
                      </td>
                      <td className="py-2.5 px-3 text-left whitespace-nowrap text-neutral-500">
                        {session.endedAt ? formatToIndianDateTime(session.endedAt) : 'Ongoing'}
                      </td>
                      <td className="py-2.5 px-3 text-left whitespace-nowrap">
                        {session.browser}
                      </td>
                      <td className="py-2.5 px-3 text-left whitespace-nowrap">
                        <span className="font-semibold">{session.resolvedDeviceName || session.device || 'Unknown Device'}</span>
                      </td>
                      <td className="py-2.5 px-3 text-left whitespace-nowrap">
                        {session.os}
                      </td>
                      <td className="py-2.5 px-3 text-left whitespace-nowrap font-semibold">
                        {session.endedAt 
                          ? formatDuration(session.durationSeconds)
                          : 'Active now'
                        }
                      </td>
                      <td className="py-2.5 px-3 text-left whitespace-nowrap">
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
                      {onTerminateSession && (
                        <td className="py-2.5 px-3 text-left whitespace-nowrap">
                          {session.sessionId === currentSessionId ? (
                            <span className="text-emerald-400 text-[8px] font-bold uppercase tracking-wider bg-emerald-950/20 border border-emerald-900/40 px-1.5 py-0.5 rounded">
                              Current
                            </span>
                          ) : isRowActionRunning === session.sessionId ? (
                            <div className="flex items-center gap-1 text-[8px] font-mono text-neutral-400">
                              <span className="w-2.5 h-2.5 border border-neutral-400/30 border-t-neutral-400 rounded-full animate-spin"></span>
                              <span>{confirmingDeleteId === session.sessionId ? 'Deleting...' : 'Terminating...'}</span>
                            </div>
                          ) : confirmingTerminateId === session.sessionId ? (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setConfirmingTerminateId(null)}
                                className="text-neutral-400 hover:text-white cursor-pointer text-[8px] uppercase tracking-wider"
                              >
                                Cancel
                              </button>
                              <span className="text-neutral-600">|</span>
                              <button
                                type="button"
                                onClick={async () => {
                                  setIsRowActionRunning(session.sessionId);
                                  try {
                                    if (onTerminateSession) {
                                      await onTerminateSession(session.sessionId);
                                    }
                                  } catch (e) {
                                    console.error(e);
                                  } finally {
                                    setIsRowActionRunning(null);
                                    setConfirmingTerminateId(null);
                                  }
                                }}
                                className="text-red-500 hover:text-red-400 font-bold hover:underline cursor-pointer text-[8px] uppercase tracking-wider"
                              >
                                Terminate
                              </button>
                            </div>
                          ) : confirmingDeleteId === session.sessionId ? (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setConfirmingDeleteId(null)}
                                className="text-neutral-400 hover:text-white cursor-pointer text-[8px] uppercase tracking-wider"
                              >
                                Cancel
                              </button>
                              <span className="text-neutral-600">|</span>
                              <button
                                type="button"
                                onClick={async () => {
                                  setIsRowActionRunning(session.sessionId);
                                  try {
                                    if (onDeleteSession) {
                                      await onDeleteSession(session.sessionId);
                                    }
                                  } catch (e) {
                                    console.error(e);
                                  } finally {
                                    setIsRowActionRunning(null);
                                    setConfirmingDeleteId(null);
                                  }
                                }}
                                className="text-orange-500 hover:text-orange-400 font-bold hover:underline cursor-pointer text-[8px] uppercase tracking-wider"
                              >
                                Delete
                              </button>
                            </div>
                          ) : session.status === 'Active' ? (
                            <button
                              type="button"
                              disabled={isRowActionRunning !== null || isBulkRunning}
                              onClick={() => {
                                  setConfirmingTerminateId(session.sessionId);
                                  setConfirmingDeleteId(null);
                              }}
                              className="text-red-500 hover:text-red-400 font-bold hover:underline cursor-pointer text-[8px] uppercase tracking-wider disabled:opacity-40 disabled:hover:no-underline"
                            >
                              Terminate
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={isRowActionRunning !== null || isBulkRunning}
                              onClick={() => {
                                  setConfirmingDeleteId(session.sessionId);
                                  setConfirmingTerminateId(null);
                              }}
                              className="text-orange-500 hover:text-orange-400 font-bold hover:underline cursor-pointer text-[8px] uppercase tracking-wider disabled:opacity-40 disabled:hover:no-underline"
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      )}
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

      <ConfirmationModal
        isOpen={modalOpen}
        title={modalType === 'terminate_others' ? 'Terminate Other Active Sessions' : 'Delete All Inactive Sessions'}
        message={modalType === 'terminate_others' 
          ? 'Are you sure you want to terminate all other active sessions? This will force-logout all other devices currently connected to your account.'
          : 'Are you sure you want to delete all terminated, expired, or logged-out session records? This action cannot be undone and will permanently purge inactive logs.'}
        confirmLabel={modalType === 'terminate_others' ? 'Confirm Termination' : 'Confirm Deletion'}
        cancelLabel="Cancel"
        onConfirm={async () => {
          setIsBulkRunning(true);
          try {
            if (modalType === 'terminate_others') {
              if (onTerminateOtherSessions) {
                await onTerminateOtherSessions();
              }
            } else {
              if (onDeleteInactiveSessions) {
                await onDeleteInactiveSessions();
              }
            }
          } catch (e) {
            console.error(e);
          } finally {
            setIsBulkRunning(false);
            setModalOpen(false);
            setModalType(null);
          }
        }}
        onCancel={() => {
          setModalOpen(false);
          setModalType(null);
        }}
        isLoading={isBulkRunning}
        activeTheme={activeTheme}
        critical={modalType === 'terminate_others'}
      />
    </div>
  );
};
