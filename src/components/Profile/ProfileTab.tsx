import React from 'react';
import { User, Eye, Search, Pencil, Check, X, Download, Upload, Database, RotateCcw } from 'lucide-react';
import { CustomDropdown } from '../CustomDropdown';
import { UserWatchData } from '../../types';
import { ShieldUpdatesLedger, renderLogValue } from './ShieldUpdatesLedger';
import { SessionRegistryCodex } from './SessionRegistryCodex';

export interface CacheProgress {
  isSyncing: boolean;
  isComplete: boolean;
  completed: number;
  total: number;
  failed: number;
}

interface ProfileTabProps {
  showAllSessions: boolean;
  setShowAllSessions: (val: boolean) => void;
  sessionSearchQuery: string;
  setSessionSearchQuery: (val: string) => void;
  sessionFilterStatus: 'all' | 'Active' | 'Logged Out' | 'Expired';
  setSessionFilterStatus: (val: 'all' | 'Active' | 'Logged Out' | 'Expired') => void;
  sessionPage: number;
  setSessionPage: (val: number | ((prev: number) => number)) => void;
  showAllUpdates: boolean;
  setShowAllUpdates: (val: boolean) => void;
  updatesSearchQuery: string;
  setUpdatesSearchQuery: (val: string) => void;
  updatesFilterCategory: string;
  setUpdatesFilterCategory: (val: string) => void;
  updatesSortOrder: 'newest' | 'oldest' | 'action-asc' | 'action-desc';
  setUpdatesSortOrder: (val: 'newest' | 'oldest' | 'action-asc' | 'action-desc') => void;
  updatesFilterStartDate: string;
  setUpdatesFilterStartDate: (val: string) => void;
  updatesFilterEndDate: string;
  setUpdatesFilterEndDate: (val: string) => void;
  updatesPage: number;
  setUpdatesPage: (val: number | ((prev: number) => number)) => void;
  sandboxUpdates: any[];
  user: any;
  activeTheme: 'oled' | 'cosmic' | 'asgardian' | 'wakanda' | 'stark' | 'hydra';
  updatePreference: (key: string, value: any) => void;
  orderingMode: 'theatrical' | 'chronological';
  authToken: string | null;
  isOfflineSandbox: boolean;
  avatarUrl: string;
  handleAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploadingAvatar: boolean;
  isEditingProfileInPlace: boolean;
  setIsEditingProfileInPlace: (val: boolean) => void;
  newFullName: string;
  setNewFullName: (val: string) => void;
  newUsername: string;
  setNewUsername: (val: string) => void;
  handleProfileUpdate: (e: React.FormEvent) => void;
  isUpdatingProfile: boolean;
  formatToIndianDateTime: (timestamp: number | string | Date | undefined) => string;
  setShowResetPasswordModal: (val: boolean) => void;
  showFeedback: (message: string, type?: 'success' | 'error' | 'info') => void;
  handleExportData: () => void;
  isRestoring: boolean;
  restoreProgress: string;
  handleImportData: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  cacheProgress: CacheProgress;
  startPreCaching: (force?: boolean) => Promise<void>;
  clearCache: () => Promise<void>;
  developerMode: boolean;
}

export function ProfileTab({
  showAllSessions,
  setShowAllSessions,
  sessionSearchQuery,
  setSessionSearchQuery,
  sessionFilterStatus,
  setSessionFilterStatus,
  sessionPage,
  setSessionPage,
  showAllUpdates,
  setShowAllUpdates,
  updatesSearchQuery,
  setUpdatesSearchQuery,
  updatesFilterCategory,
  setUpdatesFilterCategory,
  updatesSortOrder,
  setUpdatesSortOrder,
  updatesFilterStartDate,
  setUpdatesFilterStartDate,
  updatesFilterEndDate,
  setUpdatesFilterEndDate,
  updatesPage,
  setUpdatesPage,
  sandboxUpdates,
  user,
  activeTheme,
  updatePreference,
  orderingMode,
  authToken,
  isOfflineSandbox,
  avatarUrl,
  handleAvatarChange,
  isUploadingAvatar,
  isEditingProfileInPlace,
  setIsEditingProfileInPlace,
  newFullName,
  setNewFullName,
  newUsername,
  setNewUsername,
  handleProfileUpdate,
  isUpdatingProfile,
  formatToIndianDateTime,
  setShowResetPasswordModal,
  showFeedback,
  handleExportData,
  isRestoring,
  restoreProgress,
  handleImportData,
  cacheProgress,
  startPreCaching,
  clearCache,
  developerMode,
}: ProfileTabProps) {
  return (
    <>
      {showAllUpdates ? (
        <ShieldUpdatesLedger
          onBack={() => setShowAllUpdates(false)}
          sandboxUpdates={sandboxUpdates}
          user={user}
          activeTheme={activeTheme}
          isOfflineSandbox={isOfflineSandbox}
          formatToIndianDateTime={formatToIndianDateTime}
        />
      ) : showAllSessions ? (
        <SessionRegistryCodex
          onBack={() => setShowAllSessions(false)}
          user={user}
          activeTheme={activeTheme}
          formatToIndianDateTime={formatToIndianDateTime}
        />
      ) : (
        <div className="flex flex-col gap-6 font-sans w-full py-2 px-1 text-left animate-fadeIn" id="profile-main-container">
          <div className="flex flex-col gap-1.5" id="profile-station-view">
            <h2 className="font-display font-bold text-2xl tracking-tight text-white flex items-center gap-2">
              <User className="text-marvel w-6 h-6" />
              Avenger Profile Station
            </h2>
            <p className="font-sans text-xs text-neutral-400">
              Configure visual presets, sound preferences, backup metrics, or hard reset database records.
            </p>
          </div>

          {/* Agent Identity & Custom Profile Photo */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-neutral-800/60 pb-3">
              <span className="text-xs uppercase font-bold text-neutral-400 tracking-wider font-display">
                Agent Identity & Profile Photo
              </span>
              {authToken && !isEditingProfileInPlace && (
                <button
                  onClick={() => {
                    setNewFullName(user?.fullName || '');
                    setNewUsername(user?.username || '');
                    setIsEditingProfileInPlace(true);
                  }}
                  className="text-neutral-400 hover:text-white transition-all focus:outline-none cursor-pointer flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider p-0 bg-transparent border-0"
                  title="Edit Agent Profile"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
              )}
              {authToken && isEditingProfileInPlace && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingProfileInPlace(false);
                      setNewFullName('');
                      setNewUsername('');
                    }}
                    className="text-neutral-400 hover:text-neutral-200 transition-colors focus:outline-none cursor-pointer bg-transparent border-0 p-0 min-h-0 rounded-none md:bg-neutral-900 md:hover:bg-neutral-800 md:hover:text-white md:border md:border-neutral-800 md:rounded-lg md:px-4 md:py-2.5 md:min-h-[42px] flex items-center justify-center gap-2 text-xs font-mono uppercase tracking-wider touch-manipulation"
                    title="Cancel"
                  >
                    <X className="w-4 h-4 shrink-0" />
                    <span className="hidden md:inline">Cancel</span>
                  </button>
                  <button
                    type="submit"
                    form="profile-form"
                    disabled={isUpdatingProfile}
                    className="text-emerald-400 hover:text-emerald-300 disabled:opacity-50 transition-colors focus:outline-none cursor-pointer bg-transparent border-0 p-0 min-h-0 rounded-none md:bg-emerald-500/10 md:hover:bg-emerald-500/20 md:border md:border-emerald-500/20 md:rounded-lg md:px-4 md:py-2.5 md:min-h-[42px] flex items-center justify-center gap-2 text-xs font-mono uppercase tracking-wider touch-manipulation font-bold"
                    title="Save Changes"
                  >
                    {isUpdatingProfile ? (
                      <div className="w-4 h-4 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin flex-shrink-0" />
                    ) : (
                      <Check className="w-4 h-4 shrink-0" />
                    )}
                    <span className="hidden md:inline">
                      {isUpdatingProfile ? "Saving..." : "Save"}
                    </span>
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-2">
              {/* Avatar Display & Input */}
              <div className="relative group flex-shrink-0">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-neutral-800 bg-neutral-900 flex items-center justify-center relative shadow-md">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <User className="w-10 h-10 text-neutral-500" />
                  )}
                  {isUploadingAvatar && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <div className="w-5 h-5 border border-neutral-500 border-t-marvel rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                {/* Upload Trigger button overlay */}
                <label className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                  <span className="text-[10px] text-white font-mono font-bold uppercase tracking-wider">Change</span>
                  <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                </label>
              </div>

              {isEditingProfileInPlace ? (
                <form id="profile-form" onSubmit={handleProfileUpdate} className="flex-1 flex flex-col gap-3 text-left min-w-0 w-full">
                  <div className="grid grid-cols-2 gap-4 items-start w-full">
                    <div className="min-w-0 flex flex-col gap-1 w-full">
                      <span className="text-[9px] uppercase font-mono tracking-widest text-neutral-500 block mb-0.5">Full Name</span>
                      <input
                        type="text"
                        required
                        value={newFullName}
                        onChange={(e) => setNewFullName(e.target.value)}
                        placeholder="Avenger Name"
                        className="bg-neutral-950 border border-neutral-800 focus:border-marvel rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none w-full"
                      />
                    </div>
                    <div className="min-w-0 flex flex-col gap-1 w-full">
                      <span className="text-[9px] uppercase font-mono tracking-widest text-neutral-500 block mb-0.5">Agent Username</span>
                      <div className="relative flex items-center w-full">
                        <span className="absolute left-2.5 text-neutral-500 text-xs font-mono">@</span>
                        <input
                          type="text"
                          required
                          value={newUsername}
                          onChange={(e) => setNewUsername(e.target.value)}
                          placeholder="username"
                          className="bg-neutral-950 border border-neutral-800 focus:border-marvel rounded-lg pl-6 pr-2.5 py-1.5 text-xs text-white focus:outline-none w-full font-mono"
                        />
                      </div>
                    </div>
                  </div>
                  <p className="font-sans text-[11px] text-neutral-500 mt-1 leading-relaxed">
                    {authToken 
                      ? 'Your profile photo and data are synchronized directly with Private Cloud Storage.'
                      : 'Running in local sandbox. Register/Login to upload customized profile photos.'}
                  </p>
                </form>
              ) : (
                <div className="flex-1 flex flex-col gap-3 text-left min-w-0 w-full">
                  <div className="grid grid-cols-2 gap-4 items-start w-full">
                    <div className="min-w-0">
                      <span className="text-[9px] uppercase font-mono tracking-widest text-neutral-500 block mb-0.5">Full Name</span>
                      <h3 className="font-display font-bold text-sm sm:text-base text-white truncate" title={user?.fullName || 'Sandbox Agent'}>
                        {user?.fullName || 'Sandbox Agent'}
                      </h3>
                    </div>
                    <div className="min-w-0">
                      <span className="text-[9px] uppercase font-mono tracking-widest text-neutral-500 block mb-0.5">Agent Username</span>
                      <p className="font-mono text-xs text-neutral-300 truncate" title={user?.username || 'sandbox_mode'}>
                        @{user?.username || 'sandbox_mode'}
                      </p>
                    </div>
                  </div>
                  <p className="font-sans text-[11px] text-neutral-500 mt-1 leading-relaxed">
                    {authToken 
                      ? 'Your profile photo and data are synchronized directly with Private Cloud Storage.'
                      : 'Running in local sandbox. Register/Login to upload customized profile photos.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Agent Information & Session Audit Trail */}
          <div className="flex flex-col gap-4 pt-6 border-t border-neutral-900/60">
            <div className="flex items-center justify-between border-b border-neutral-800/60 pb-3">
              <span className="text-xs uppercase font-bold text-neutral-400 tracking-wider font-display flex items-center gap-2 flex-nowrap shrink-0">
                Agent Session Registry
              </span>
              {user?.sessions && user.sessions.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSessionSearchQuery('');
                    setSessionFilterStatus('all');
                    setSessionPage(1);
                    setShowAllSessions(true);
                  }}
                  className="hover:text-white transition-all focus:outline-none flex items-center gap-1 text-[11px] font-sans font-semibold text-neutral-400 shrink-0 whitespace-nowrap cursor-pointer ml-2 p-0 bg-transparent border-0"
                  title="View Complete Session Registry"
                >
                  <Eye className="w-3.5 h-3.5 text-marvel shrink-0" />
                  <span>View All</span>
                </button>
              )}
            </div>
            <div className="flex flex-col gap-3 font-sans text-xs">
              <div className="grid grid-cols-2 gap-4 pb-1 text-[11px] text-left">
                <div>
                  <span className="text-neutral-500 block uppercase font-mono tracking-wider text-[9px]">Agent Code:</span>
                  <span className="font-mono text-white font-semibold">@{user?.username || 'sandbox_mode'}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block uppercase font-mono tracking-wider text-[9px]">Registered Since:</span>
                  <span className="text-white font-semibold">{user?.createdAt ? formatToIndianDateTime(user.createdAt) : 'N/A'}</span>
                </div>
              </div>

              <div className="space-y-2.5 border-t border-neutral-900/60 pt-3 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400 font-bold block text-[10px] uppercase font-mono tracking-wider">Session Audit Trail (Recent Logs)</span>
                  <span className="text-neutral-500 font-mono text-[9px]">Showing max 10</span>
                </div>
                {user?.sessions && user.sessions.length > 0 ? (
                  <div className="overflow-x-auto no-scrollbar -mx-5 w-[calc(100%+2.5rem)] border-t border-b border-neutral-900/40 text-left">
                    <table className="w-full text-left font-mono text-[10px] leading-normal border-collapse min-w-[650px]">
                      <thead>
                        <tr className="bg-neutral-950/20 text-neutral-400 uppercase tracking-wider border-b border-neutral-900 text-[8px]">
                          <th className="py-2.5 px-3 font-semibold text-left whitespace-nowrap">Session Start</th>
                          <th className="py-2.5 px-3 font-semibold text-left whitespace-nowrap">Session End</th>
                          <th className="py-2.5 px-3 font-semibold text-left whitespace-nowrap">Browser</th>
                          <th className="py-2.5 px-3 font-semibold text-left whitespace-nowrap">Operating System</th>
                          <th className="py-2.5 px-3 font-semibold text-left whitespace-nowrap">Duration</th>
                          <th className="py-2.5 px-3 font-semibold text-left whitespace-nowrap">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-900/40 text-neutral-300">
                        {[...user.sessions].reverse().slice(0, 10).map((session: any) => (
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
                              {session.os}
                            </td>
                            <td className="py-2.5 px-3 text-left whitespace-nowrap font-semibold">
                              {session.endedAt 
                                ? `${session.durationSeconds ?? 0}s`
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
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-[10px] text-neutral-500 italic text-left">No session trails recorded yet or sandbox mode active.</p>
                )}
              </div>
            </div>
          </div>

          {/* Agent Updates Ledger (Dashboard View: Recent 10 updates) */}
          <div className="flex flex-col gap-4 pt-6 border-t border-neutral-900/60">
            <div className="flex items-center justify-between border-b border-neutral-800/60 pb-3">
              <span className="text-xs uppercase font-bold text-neutral-400 tracking-wider font-display flex items-center gap-2 flex-nowrap shrink-0">
                Agent Updates Ledger
              </span>
              {(isOfflineSandbox ? sandboxUpdates.length > 0 : (user?.updates && user.updates.length > 0)) && (
                <button
                  type="button"
                  onClick={() => {
                    setUpdatesSearchQuery('');
                    setUpdatesFilterCategory('all');
                    setUpdatesSortOrder('newest');
                    setUpdatesFilterStartDate('');
                    setUpdatesFilterEndDate('');
                    setUpdatesPage(1);
                    setShowAllUpdates(true);
                  }}
                  className="hover:text-white transition-all focus:outline-none flex items-center gap-1 text-[11px] font-sans font-semibold text-neutral-400 shrink-0 whitespace-nowrap cursor-pointer ml-2 p-0 bg-transparent border-0"
                  title="View Complete Updates History"
                >
                  <Eye className="w-3.5 h-3.5 text-marvel shrink-0" />
                  <span>View All</span>
                </button>
              )}
            </div>

            <div className="flex flex-col gap-3 font-sans text-xs">
              <div className="space-y-2.5 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400 font-bold block text-[10px] uppercase font-mono tracking-wider">Activity Ledger (Recent Updates)</span>
                  <span className="text-neutral-500 font-mono text-[9px]">Showing max 10</span>
                </div>
                {(() => {
                  const items = isOfflineSandbox ? sandboxUpdates : (user?.updates || []);
                  const recent = items.slice(0, 10);
                  if (recent.length > 0) {
                    return (
                      <div className="overflow-x-auto no-scrollbar -mx-5 w-[calc(100%+2.5rem)] border-t border-b border-neutral-900/40 text-left">
                        <table className="w-full text-left font-mono text-[10px] leading-normal border-collapse min-w-[650px]">
                          <thead>
                            <tr className="bg-neutral-950/20 text-neutral-400 uppercase tracking-wider border-b border-neutral-900 text-[8px]">
                              <th className="py-2.5 px-3 font-semibold text-left whitespace-nowrap">Timestamp</th>
                              <th className="py-2.5 px-3 font-semibold text-left whitespace-nowrap">Source</th>
                              <th className="py-2.5 px-3 font-semibold text-left whitespace-nowrap">Action</th>
                              <th className="py-2.5 px-3 font-semibold text-left whitespace-nowrap">Old Value</th>
                              <th className="py-2.5 px-3 font-semibold text-left whitespace-nowrap">New Value</th>
                              <th className="py-2.5 px-3 font-semibold text-left whitespace-nowrap">Agent</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-900/40 text-neutral-300">
                            {recent.map((log: any, idx: number) => (
                              <tr key={log.id || idx} className="hover:bg-neutral-900/10 transition-colors">
                                <td className="py-2.5 px-3 text-left whitespace-nowrap">
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
                                <td className="py-2.5 px-3 text-left whitespace-nowrap text-neutral-400">
                                  @{log.userPerformed || 'sandbox_agent'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  } else {
                    return (
                      <p className="text-[10px] text-neutral-500 italic text-left">No updates recorded yet.</p>
                    );
                  }
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
