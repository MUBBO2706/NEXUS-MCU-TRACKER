import React from 'react';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  activeTheme?: 'oled' | 'cosmic' | 'asgardian' | 'wakanda' | 'stark' | 'hydra';
  critical?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  isLoading = false,
  activeTheme = 'oled',
  critical = false,
}) => {
  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  const getConfirmBtnStyle = () => {
    if (critical) {
      return 'bg-red-600 hover:bg-red-500 shadow-red-950/20 focus:ring-red-500/25';
    }
    switch (activeTheme) {
      case 'cosmic':
        return 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-950/20 focus:ring-indigo-500/25';
      case 'asgardian':
        return 'bg-amber-600 hover:bg-amber-500 shadow-amber-950/20 focus:ring-amber-500/25';
      case 'wakanda':
        return 'bg-purple-600 hover:bg-purple-500 shadow-purple-950/20 focus:ring-purple-500/25';
      case 'stark':
        return 'bg-sky-600 hover:bg-sky-500 shadow-sky-950/20 focus:ring-sky-500/25';
      case 'hydra':
        return 'bg-red-600 hover:bg-red-500 shadow-red-950/20 focus:ring-red-500/25';
      default: // oled / marvel
        return 'bg-red-600 hover:bg-red-500 shadow-red-950/20 focus:ring-red-500/25';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn" id="shared-confirmation-modal-backdrop">
      <div className="bg-neutral-950 border border-neutral-850 max-w-md w-full rounded-2xl p-6 shadow-2xl animate-scaleUp text-left max-h-[calc(100vh-2rem)] overflow-y-auto scrollable-modal-content" id="shared-confirmation-modal-content">
        <h3 className="font-display font-bold text-base sm:text-lg text-white mb-2">
          {title}
        </h3>
        <p className="text-xs text-neutral-400 mb-6 font-sans leading-relaxed">
          {message}
        </p>
        <div className="flex items-center justify-end gap-2.5 font-sans text-[11px]">
          <button
            type="button"
            disabled={isLoading}
            onClick={onCancel}
            className="px-3.5 py-2 rounded-lg border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 transition-colors cursor-pointer disabled:opacity-40 focus:outline-none"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`${getConfirmBtnStyle()} text-white font-semibold px-3.5 py-2 rounded-lg transition-all cursor-pointer shadow-lg flex items-center gap-1.5 disabled:opacity-40 focus:outline-none`}
          >
            {isLoading ? (
              <>
                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Processing...</span>
              </>
            ) : (
              <span>{confirmLabel}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
