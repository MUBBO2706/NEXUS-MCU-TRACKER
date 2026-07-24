import React, { useState } from 'react';
import { Download, Upload, Database, RotateCcw, Settings } from 'lucide-react';
import { CacheProgress } from '../Profile/ProfileTab';
import { ConfirmationModal } from '../Common/ConfirmationModal';

interface SettingsTabProps {
  activeTheme: 'oled' | 'cosmic' | 'asgardian' | 'wakanda' | 'stark' | 'hydra';
  updatePreference: (key: string, value: any) => void;
  orderingMode: 'theatrical' | 'chronological';
  handleExportData: () => void;
  isRestoring: boolean;
  restoreProgress: string;
  handleImportData: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  cacheProgress: CacheProgress;
  startPreCaching: (force?: boolean) => Promise<void>;
  clearCache: () => Promise<void>;
  developerMode: boolean;
  showFeedback: (message: string, type?: 'success' | 'error' | 'info') => void;
  authToken: string | null;
  handleResetProgress: () => void;
  setShowDeleteAccountModal: (val: boolean) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  activeTheme,
  updatePreference,
  orderingMode,
  handleExportData,
  isRestoring,
  restoreProgress,
  handleImportData,
  cacheProgress,
  startPreCaching,
  clearCache,
  developerMode,
  showFeedback,
  authToken,
  handleResetProgress,
  setShowDeleteAccountModal,
}) => {
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);
  const [isPurging, setIsPurging] = useState(false);

  return (
    <div className="flex flex-col animate-fadeIn text-left gap-4 font-sans w-full py-1 px-1" id="settings-station-view">
      <div className="flex flex-col gap-1.5 border-b border-neutral-900 pb-4">
        <h2 className="font-display font-bold text-2xl tracking-tight text-white flex items-center gap-2">
          <Settings className="text-marvel w-6 h-6 animate-spin-slow" />
          S.H.I.E.L.D. Intel Settings
        </h2>
        <p className="font-sans text-xs text-neutral-400">
          Configure agent visual presets, synchronize offline databases, and manage local media caches.
        </p>
      </div>

      {/* Settings Grid (2x2 on Desktop, 1-column list on Mobile) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10 pt-6 border-t border-neutral-900/60" id="settings-grid-sections">
        {/* Row 1, Col 1: Viewing Order Preference */}
        <div className="flex flex-col gap-4">
          <span className="text-xs uppercase font-bold text-neutral-400 tracking-wider font-display">
            Viewing Order Preference
          </span>
          <p className="text-[10px] text-neutral-400 leading-relaxed -mt-2 text-left">
            Select your default timeline perspective. Theatrical Release Order provides the classic cinema release flow, while Chronological Order arranges titles sequentially as events happened in the MCU story.
          </p>
          <div className="grid grid-cols-2 gap-3 w-full" id="settings-order-grid">
            {[
              { id: 'theatrical', name: 'Theatrical Order', desc: 'Default (Classic Release)' },
              { id: 'chronological', name: 'Chronological Timeline', desc: 'Story Order' },
            ].map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => {
                  updatePreference('orderingMode', o.id);
                }}
                className={`p-3 rounded-xl border text-left flex flex-col justify-center gap-0.5 transition-all focus:outline-none min-w-0 w-full cursor-pointer h-[58px] ${
                  orderingMode === o.id
                    ? 'border-marvel bg-marvel/5 shadow-md shadow-marvel/5 font-bold'
                    : 'border-neutral-800 bg-neutral-950 hover:border-neutral-700'
                }`}
              >
                <span className={`text-[11px] font-semibold leading-tight ${orderingMode === o.id ? 'text-marvel' : 'text-white'}`}>
                  {o.name}
                </span>
                <span className="text-[9px] text-neutral-500 font-medium">
                  {o.desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Row 1, Col 2: Theme Presets & Skins */}
        <div className="flex flex-col gap-4">
          <span className="text-xs uppercase font-bold text-neutral-400 tracking-wider font-display">
            Theme Presets &amp; Skins
          </span>
          <p className="text-[10px] text-neutral-400 leading-relaxed -mt-2 text-left">
            Select your S.H.I.E.L.D. agency skin. This controls visual accent highlights, focus glows, and overall interface color styling.
          </p>
          <div className="grid grid-cols-3 gap-2.5 w-full" id="settings-theme-grid">
            {[
              { id: 'oled', name: 'OLED Black', color: 'bg-black border-red-500' },
              { id: 'cosmic', name: 'Cosmic Purple', color: 'bg-indigo-950 border-purple-500' },
              { id: 'asgardian', name: 'Asgard Gold', color: 'bg-slate-900 border-amber-500' },
              { id: 'wakanda', name: 'Wakanda Vibranium', color: 'bg-slate-950 border-purple-600' },
              { id: 'stark', name: 'Stark Arc', color: 'bg-neutral-900 border-sky-400' },
              { id: 'hydra', name: 'Hydra Crimson', color: 'bg-stone-900 border-red-600' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  updatePreference('theme', t.id as any);
                }}
                className={`p-2.5 rounded-xl border text-center flex flex-col items-center justify-center gap-2 transition-all focus:outline-none min-w-0 w-full h-[76px] cursor-pointer ${
                  activeTheme === t.id
                    ? 'border-marvel bg-neutral-900 font-bold'
                    : 'border-neutral-800 bg-neutral-950 hover:border-neutral-700'
                }`}
              >
                <div className={`w-4.5 h-4.5 rounded-full border flex-shrink-0 ${t.color}`} />
                <span className="text-[10px] text-white font-sans truncate max-w-full block whitespace-nowrap select-none">{t.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Row 2, Col 1: Backups & Sync System */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-xs uppercase font-bold text-neutral-400 tracking-wider font-display">
              Backups &amp; Sync System
            </span>
            <p className="text-[10px] text-neutral-400 leading-relaxed text-left">
              Export or restore your offline S.H.I.E.L.D. database JSON files locally to synchronize progress across active stations.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 w-full">
            <button
              type="button"
              onClick={handleExportData}
              disabled={isRestoring}
              className={`flex items-center justify-center gap-1.5 bg-neutral-900 border border-neutral-800 text-white font-semibold text-[10px] xs:text-[11px] py-3 rounded-xl transition-colors focus:outline-none whitespace-nowrap overflow-hidden cursor-pointer w-full ${
                isRestoring ? 'opacity-50 cursor-not-allowed' : 'hover:bg-neutral-800'
              }`}
            >
              <Download className="w-3.5 h-3.5 flex-shrink-0" />
              Export JSON Backup
            </button>
            {isRestoring ? (
              <div className="flex items-center justify-center gap-1.5 bg-neutral-900/40 text-neutral-500 border border-neutral-800/65 text-[10px] xs:text-[11px] py-3 rounded-xl whitespace-nowrap overflow-hidden select-none cursor-not-allowed w-full">
                <div className="w-3.5 h-3.5 border-2 border-neutral-600 border-t-marvel rounded-full animate-spin flex-shrink-0" />
                <span className="truncate">{restoreProgress || 'Restoring...'}</span>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white font-semibold text-[10px] xs:text-[11px] py-3 rounded-xl cursor-pointer transition-colors whitespace-nowrap overflow-hidden w-full text-center justify-center">
                <Upload className="w-3.5 h-3.5 flex-shrink-0" />
                Restore JSON Backup
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Row 2, Col 2: S.H.I.E.L.D. Intel Caching Engine */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2 border-b border-neutral-900/60 pb-2">
              <span className="text-xs uppercase font-bold text-neutral-400 tracking-wider font-display flex items-center gap-1.5 whitespace-nowrap">
                <Database className="w-4 h-4 text-marvel flex-shrink-0" />
                S.H.I.E.L.D. Intel Caching Engine
              </span>
              <span className={`font-mono text-[9px] font-bold border rounded-full px-2.5 py-0.5 uppercase tracking-wider whitespace-nowrap ${
                cacheProgress.isSyncing
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 animate-pulse'
                  : cacheProgress.isComplete
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-400'
              }`}>
                {cacheProgress.isSyncing ? 'Syncing...' : cacheProgress.isComplete ? 'Offline Active' : 'Idle'}
              </span>
            </div>

            <p className="text-[10px] text-neutral-400 leading-relaxed text-left">
              Caches all Marvel posters, backdrops, and character portraits locally on the client using high-performance Cache Storage &amp; IndexedDB to reduce network hops.
            </p>

            {/* Progress bar */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-[10px] font-mono text-neutral-400">
                <span>Cache Sync Progress</span>
                <span>
                  {cacheProgress.completed}/{cacheProgress.total} Files
                </span>
              </div>
              <div className="h-2 w-full bg-neutral-950 rounded-full overflow-hidden border border-neutral-900">
                <div
                  className={`h-full transition-all duration-500 ${
                    cacheProgress.isSyncing ? 'bg-amber-500' : 'bg-marvel'
                  }`}
                  style={{
                    width: `${cacheProgress.total > 0 ? (cacheProgress.completed / cacheProgress.total) * 100 : 0}%`,
                  }}
                />
              </div>
              {cacheProgress.failed > 0 && (
                <span className="text-[9px] font-mono text-rose-500 text-left block">
                  ⚠️ {cacheProgress.failed} failed.
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-1 w-full">
            <button
              type="button"
              onClick={async () => {
                showFeedback('Rebuilding cache...', 'info');
                await startPreCaching(true);
                showFeedback('Cache rebuild complete!', 'success');
              }}
              disabled={cacheProgress.isSyncing}
              className="flex items-center justify-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white font-semibold text-[10px] xs:text-[11px] py-3 rounded-xl transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer w-full"
            >
              <RotateCcw className="w-3.5 h-3.5 flex-shrink-0" />
              Force Rebuild
            </button>
            <button
              type="button"
              onClick={() => setShowPurgeConfirm(true)}
              disabled={cacheProgress.isSyncing || isPurging}
              className="flex items-center justify-center gap-1.5 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 text-red-400 font-semibold text-[10px] xs:text-[11px] py-3 rounded-xl transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer w-full"
            >
              <RotateCcw className="w-3.5 h-3.5 flex-shrink-0" />
              Purge Cache
            </button>
          </div>
        </div>
      </div>

      {/* Application & Account Management (Positioned at the very end) */}
      <div className="flex flex-col gap-4 pt-6 border-t border-neutral-900/60">
        <div className="flex flex-col gap-2">
          <span className="text-xs uppercase font-bold text-neutral-400 tracking-wider font-display">
            Application &amp; Account Management
          </span>
          <p className="text-[10px] text-neutral-400 leading-relaxed text-left">
            Reset your application status, clear offline state, or permanently delete your cloud account from S.H.I.E.L.D. registry.
          </p>
        </div>
        <div className={`grid gap-3 w-full sm:max-w-md ${authToken ? 'grid-cols-2' : 'grid-cols-1'}`}>
          <button
            type="button"
            onClick={handleResetProgress}
            className="w-full bg-red-600/10 hover:bg-red-600/20 text-red-500 font-semibold text-xs py-3.5 rounded-xl border border-red-500/20 transition-colors focus:outline-none cursor-pointer"
          >
            Reset Application
          </button>

          {authToken && (
            <button
              type="button"
              onClick={() => setShowDeleteAccountModal(true)}
              className="w-full bg-rose-600/10 hover:bg-rose-600/20 text-rose-500 font-semibold text-xs py-3.5 rounded-xl border border-rose-500/20 transition-colors focus:outline-none cursor-pointer"
            >
              Delete Account
            </button>
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={showPurgeConfirm}
        title="Purge Cached Media Assets"
        message="Are you sure you want to purge all cached media assets? This will clear all downloaded posters and offline assets from local storage."
        confirmLabel="Purge Cache"
        cancelLabel="Cancel"
        onConfirm={async () => {
          setIsPurging(true);
          try {
            await clearCache();
            showFeedback('Cache purged completely!', 'info');
          } catch (err) {
            showFeedback('Failed to purge cache.', 'error');
          } finally {
            setIsPurging(false);
            setShowPurgeConfirm(false);
          }
        }}
        onCancel={() => setShowPurgeConfirm(false)}
        isLoading={isPurging}
        activeTheme={activeTheme}
        critical={true}
      />
    </div>
  );
};
