import React, { useEffect } from 'react';
import { LogOut, X } from 'lucide-react';

interface ExitConfirmModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirmExit: () => void;
  username?: string;
}

export const ExitConfirmModal: React.FC<ExitConfirmModalProps> = ({
  isOpen,
  onCancel,
  onConfirmExit,
  username,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="exit-modal-title"
      aria-describedby="exit-modal-desc"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 select-none animate-[fade-in_0.15s_ease-out]"
    >
      <div className="bg-white dark:bg-[#18181b] border-2 border-[#2a2a2a] dark:border-zinc-700 p-6 rounded-2xl max-w-sm w-full space-y-5 text-center shadow-2xl">
        <div className="w-12 h-12 mx-auto bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700/60 text-amber-800 dark:text-amber-300 rounded-full flex items-center justify-center">
          <LogOut className="w-6 h-6" aria-hidden="true" />
        </div>

        <div className="space-y-1.5">
          <h3
            id="exit-modal-title"
            className="text-lg font-black text-[#0a0a0a] dark:text-zinc-100 uppercase tracking-tight"
          >
            Exit Progress Club?
          </h3>
          <p
            id="exit-modal-desc"
            className="text-xs text-[#1a1a1a]/75 dark:text-zinc-400 leading-relaxed"
          >
            Are you sure you want to exit Progress Club{username ? `, ${username}` : ''}? Your session progress and daily streaks are safely stored.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            id="exit-cancel-btn"
            aria-label="Cancel and stay in Progress Club"
            onClick={onCancel}
            className="py-3 bg-white dark:bg-zinc-800 hover:bg-stone-100 dark:hover:bg-zinc-700 text-[#0a0a0a] dark:text-zinc-100 text-xs font-black uppercase tracking-wider rounded-xl border-2 border-[#2a2a2a] dark:border-zinc-600 cursor-pointer active:translate-y-px transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            id="exit-confirm-btn"
            aria-label="Exit Progress Club"
            onClick={onConfirmExit}
            className="py-3 bg-[#22c55e] hover:bg-emerald-400 active:translate-y-px text-black text-xs font-black uppercase tracking-wider rounded-xl border-2 border-[#2a2a2a] dark:border-zinc-700 cursor-pointer shadow-xs transition-colors"
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExitConfirmModal;
