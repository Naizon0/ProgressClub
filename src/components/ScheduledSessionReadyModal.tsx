import React from 'react';
import { BellRing, Play, Clock, Sparkles, X, RotateCcw } from 'lucide-react';
import { ScheduledTimer } from '../types';

interface ScheduledSessionReadyModalProps {
  isOpen: boolean;
  scheduledTimer: ScheduledTimer | null;
  onStartNow: () => void;
  onSnooze: (minutes: number) => void;
  onDismiss: () => void;
}

export default function ScheduledSessionReadyModal({
  isOpen,
  scheduledTimer,
  onStartNow,
  onSnooze,
  onDismiss,
}: ScheduledSessionReadyModalProps) {
  if (!isOpen || !scheduledTimer) return null;

  const targetDate = new Date(scheduledTimer.targetTime);
  const formattedTime = targetDate.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onDismiss}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-zinc-900 border-4 border-[#22c55e] dark:border-amber-400 rounded-3xl p-6 shadow-[0_16px_0_#1a1a1a] dark:shadow-[0_16px_0_#27272a] text-center space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated Bell Icon */}
        <div className="w-16 h-16 mx-auto rounded-3xl bg-[#22c55e] border-3 border-[#2a2a2a] dark:border-amber-400 flex items-center justify-center shadow-md animate-bounce">
          <BellRing className="w-8 h-8 text-black stroke-[2.5]" />
        </div>

        <div className="space-y-1">
          <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-amber-400/20 text-emerald-800 dark:text-amber-300 border border-emerald-300 dark:border-amber-400/30">
            Scheduled Session Arrival
          </span>
          <h2 className="text-xl font-black uppercase tracking-tight text-[#0a0a0a] dark:text-amber-400">
            It's Focus Time!
          </h2>
          <p className="text-xs text-stone-600 dark:text-amber-300/80">
            Your timer scheduled for <span className="font-bold">{formattedTime}</span> is ready to start.
          </p>
        </div>

        {/* Details Card */}
        <div className="p-4 rounded-2xl bg-stone-50 dark:bg-zinc-800 border-2 border-stone-200 dark:border-amber-400/30 text-left space-y-2">
          {scheduledTimer.label && (
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-stone-500 dark:text-amber-300/70 uppercase">
                Goal / Intent:
              </span>
              <span className="text-xs font-black text-[#0a0a0a] dark:text-amber-400">
                "{scheduledTimer.label}"
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-500 dark:text-amber-300/70 uppercase">
              Duration:
            </span>
            <span className="text-xs font-black text-[#0a0a0a] dark:text-amber-400">
              {scheduledTimer.durationMinutes} Minutes Focus
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-500 dark:text-amber-300/70 uppercase">
              Routine:
            </span>
            <span className="text-xs font-black text-[#0a0a0a] dark:text-amber-400">
              {scheduledTimer.focusActivity === 'exercise' ? '🏋️ Exercise' : '💻 Desk Work'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={onStartNow}
            className="w-full py-3.5 bg-[#22c55e] hover:bg-[#1ea34d] text-[#0a0a0a] text-sm font-black uppercase tracking-wider rounded-xl border-2 border-[#2a2a2a] dark:border-amber-400 shadow-[0_4px_0_#0a0a0a] dark:shadow-[0_4px_0_#27272a] active:translate-y-0.5 active:shadow-none transition flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Start Session Now</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onSnooze(5)}
              className="py-2.5 bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 text-stone-700 dark:text-amber-300 text-xs font-black uppercase tracking-wider rounded-xl border-2 border-stone-300 dark:border-amber-400/40 transition flex items-center justify-center space-x-1 cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5 text-stone-500 dark:text-amber-400" />
              <span>Snooze 5m</span>
            </button>

            <button
              type="button"
              onClick={onDismiss}
              className="py-2.5 bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 text-stone-700 dark:text-amber-400 text-xs font-black uppercase tracking-wider rounded-xl border-2 border-stone-300 dark:border-amber-400/40 transition cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
