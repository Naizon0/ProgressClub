import React, { useState, useEffect } from 'react';
import { Clock, Play, Edit2, Trash2, Zap, Bell, CheckCircle2, AlertCircle } from 'lucide-react';
import { ScheduledTimer } from '../types';

interface ScheduledTimerBannerProps {
  scheduledTimer: ScheduledTimer;
  onStartNow: () => void;
  onEdit: () => void;
  onCancel: () => void;
}

export default function ScheduledTimerBanner({
  scheduledTimer,
  onStartNow,
  onEdit,
  onCancel,
}: ScheduledTimerBannerProps) {
  const [timeLeftMs, setTimeLeftMs] = useState<number>(() => {
    return Math.max(0, new Date(scheduledTimer.targetTime).getTime() - Date.now());
  });

  useEffect(() => {
    const updateCountdown = () => {
      const remaining = Math.max(0, new Date(scheduledTimer.targetTime).getTime() - Date.now());
      setTimeLeftMs(remaining);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [scheduledTimer.targetTime]);

  const targetDate = new Date(scheduledTimer.targetTime);
  const formattedTime = targetDate.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const isToday = targetDate.toDateString() === new Date().toDateString();
  const isTomorrow =
    new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() - 1).toDateString() ===
    new Date().toDateString();
  const dayStr = isToday ? 'Today' : isTomorrow ? 'Tomorrow' : targetDate.toLocaleDateString([], { month: 'short', day: 'numeric' });

  // Format countdown string
  const totalSeconds = Math.floor(timeLeftMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const countdownText =
    hours > 0
      ? `${hours}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`
      : `${minutes}m ${String(seconds).padStart(2, '0')}s`;

  return (
    <div className="relative overflow-hidden bg-white dark:bg-zinc-900 border-2 border-emerald-500/80 dark:border-amber-400/50 rounded-2xl p-4 shadow-sm text-left transition-all">
      {/* Top accent badge bar */}
      <div className="flex items-center justify-between pb-2 border-b border-stone-200 dark:border-amber-400/20">
        <div className="flex items-center space-x-1.5">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 dark:bg-amber-400"></span>
          </span>
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-amber-400">
            Scheduled Focus Session
          </span>
        </div>
        <div className="flex items-center space-x-1 text-[10px] font-bold text-stone-500 dark:text-amber-300/80">
          {scheduledTimer.autoStart ? (
            <span className="flex items-center gap-1 text-emerald-600 dark:text-amber-400">
              <Zap className="w-3 h-3 fill-current" />
              <span>Auto-starts</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-stone-500 dark:text-amber-300/70">
              <Bell className="w-3 h-3" />
              <span>Alert prompt</span>
            </span>
          )}
        </div>
      </div>

      {/* Main info row */}
      <div className="py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-emerald-600 dark:text-amber-400 stroke-[2.5]" />
            <h4 className="text-base font-black text-[#0a0a0a] dark:text-amber-400">
              {dayStr} at {formattedTime}
            </h4>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-amber-300 border border-stone-200 dark:border-amber-400/30">
              {scheduledTimer.durationMinutes}m focus
            </span>
            {scheduledTimer.focusActivity === 'exercise' && (
              <span className="text-xs" title="Exercise Routine">
                🏋️
              </span>
            )}
          </div>

          {scheduledTimer.label ? (
            <p className="text-xs font-semibold text-stone-600 dark:text-amber-300/90 truncate max-w-xs sm:max-w-md">
              "{scheduledTimer.label}"
            </p>
          ) : (
            <p className="text-[11px] text-stone-500 dark:text-amber-300/70">
              Ready to focus in {countdownText}
            </p>
          )}
        </div>

        {/* Live Countdown Clock Badge */}
        <div className="flex items-center self-start sm:self-auto space-x-2 bg-stone-50 dark:bg-zinc-800/80 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-amber-400/30">
          <span className="text-[10px] font-bold text-stone-400 dark:text-amber-400/60 uppercase">Starts in:</span>
          <span className="font-mono text-xs font-black text-emerald-600 dark:text-amber-400">
            {countdownText}
          </span>
        </div>
      </div>

      {/* Actions row */}
      <div className="pt-2 border-t border-stone-100 dark:border-amber-400/10 flex items-center justify-between gap-2">
        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            onClick={onEdit}
            className="px-2.5 py-1 text-xs font-bold rounded-lg text-stone-600 dark:text-amber-300 hover:bg-stone-100 dark:hover:bg-zinc-800 border border-stone-200 dark:border-amber-400/30 flex items-center space-x-1 transition cursor-pointer"
          >
            <Edit2 className="w-3 h-3" />
            <span>Edit</span>
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-2.5 py-1 text-xs font-bold rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center space-x-1 transition cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
            <span>Cancel</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onStartNow}
          className="px-3.5 py-1.5 bg-[#22c55e] hover:bg-[#1ea34d] text-[#0a0a0a] text-xs font-black uppercase tracking-wider rounded-xl border-2 border-[#2a2a2a] dark:border-amber-400 shadow-xs flex items-center space-x-1.5 active:translate-y-0.5 transition cursor-pointer"
        >
          <Play className="w-3 h-3 fill-current" />
          <span>Start Now</span>
        </button>
      </div>
    </div>
  );
}
