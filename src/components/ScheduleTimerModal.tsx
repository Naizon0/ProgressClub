import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Bell, Sparkles, X, Check, Volume2, ArrowRight } from 'lucide-react';
import { ScheduledTimer } from '../types';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  playScheduledAlertChime,
} from '../utils/notifications';

interface ScheduleTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (timer: ScheduledTimer) => void;
  initialScheduledTimer?: ScheduledTimer | null;
  defaultDuration?: number;
}

export default function ScheduleTimerModal({
  isOpen,
  onClose,
  onSchedule,
  initialScheduledTimer,
  defaultDuration = 25,
}: ScheduleTimerModalProps) {
  if (!isOpen) return null;

  // Determine current time and sensible defaults
  const now = new Date();

  // Helper to format Date to YYYY-MM-DD
  const formatDateYYYYMMDD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Helper to format Date to HH:mm
  const formatTimeHHMM = (d: Date) => {
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${mins}`;
  };

  // Default target time: the top of the next hour (e.g. if 1:20 PM -> 2:00 PM)
  const getNextHourDate = () => {
    const d = new Date();
    d.setHours(d.getHours() + 1);
    d.setMinutes(0);
    d.setSeconds(0);
    return d;
  };

  // Parse initial or default state
  const initialTargetDate = initialScheduledTimer
    ? new Date(initialScheduledTimer.targetTime)
    : getNextHourDate();

  const [dateStr, setDateStr] = useState<string>(() => formatDateYYYYMMDD(initialTargetDate));
  const [timeStr, setTimeStr] = useState<string>(() => formatTimeHHMM(initialTargetDate));
  const [durationMinutes, setDurationMinutes] = useState<number>(
    initialScheduledTimer?.durationMinutes || defaultDuration
  );
  const [focusActivity, setFocusActivity] = useState<'desk-work' | 'exercise'>(
    initialScheduledTimer?.focusActivity || 'desk-work'
  );
  const [autoStart, setAutoStart] = useState<boolean>(
    initialScheduledTimer ? initialScheduledTimer.autoStart : true
  );
  const [label, setLabel] = useState<string>(initialScheduledTimer?.label || '');
  const [hasPermission, setHasPermission] = useState<boolean>(() => {
    return getNotificationPermission() === 'granted';
  });
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Quick preset offsets from current time
  const handleQuickPreset = (offsetMinutes: number) => {
    const target = new Date(Date.now() + offsetMinutes * 60 * 1000);
    setDateStr(formatDateYYYYMMDD(target));
    setTimeStr(formatTimeHHMM(target));
    setErrorMsg('');
  };

  const handleNextHourPreset = () => {
    const target = getNextHourDate();
    setDateStr(formatDateYYYYMMDD(target));
    setTimeStr(formatTimeHHMM(target));
    setErrorMsg('');
  };

  // Request notifications
  const handleRequestNotify = async () => {
    const granted = await requestNotificationPermission();
    setHasPermission(granted);
  };

  // Calculate human readable schedule preview
  const getCalculatedTargetDate = (): Date | null => {
    if (!dateStr || !timeStr) return null;
    const [hours, mins] = timeStr.split(':').map(Number);
    if (isNaN(hours) || isNaN(mins)) return null;
    const [year, month, day] = dateStr.split('-').map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;

    const d = new Date(year, month - 1, day, hours, mins, 0);
    return d;
  };

  const targetDate = getCalculatedTargetDate();
  const diffMs = targetDate ? targetDate.getTime() - Date.now() : -1;
  const isPast = diffMs < 1000; // less than a second in future

  // Calculate friendly time remaining string
  let remainingText = '';
  if (targetDate && !isPast) {
    const totalMinutes = Math.floor(diffMs / 60000);
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hrs > 0) {
      remainingText = `starts in ${hrs}h ${mins}m`;
    } else if (mins > 0) {
      remainingText = `starts in ${mins} minute${mins === 1 ? '' : 's'}`;
    } else {
      remainingText = `starts in less than a minute`;
    }
  }

  // Format 12-hour display e.g. 2:00 PM
  const formattedDisplayTime = targetDate
    ? targetDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
    : '';

  const isToday = targetDate && targetDate.toDateString() === new Date().toDateString();
  const isTomorrow =
    targetDate &&
    new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() - 1).toDateString() ===
      new Date().toDateString();

  const dayLabel = isToday ? 'Today' : isTomorrow ? 'Tomorrow' : dateStr;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetDate) {
      setErrorMsg('Please choose a valid time.');
      return;
    }

    if (diffMs < 3000) {
      setErrorMsg('Scheduled time must be at least 1 minute in the future.');
      return;
    }

    const scheduled: ScheduledTimer = {
      id: initialScheduledTimer?.id || `sched-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      targetTime: targetDate.toISOString(),
      durationMinutes,
      autoStart,
      focusActivity,
      label: label.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    onSchedule(scheduled);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-zinc-900 border-4 border-[#2a2a2a] dark:border-amber-400/40 rounded-3xl p-5 sm:p-6 shadow-[0_12px_0_#1a1a1a] dark:shadow-[0_12px_0_#27272a] max-h-[92vh] overflow-y-auto scrollbar-thin"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b-2 border-stone-200 dark:border-amber-400/20 pb-3 mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#22c55e] text-black border-2 border-[#2a2a2a] dark:border-amber-400/50 flex items-center justify-center shadow-xs">
              <Clock className="w-5 h-5 text-black stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-[#0a0a0a] dark:text-amber-400">
                Schedule Focus Timer
              </h2>
              <p className="text-xs text-stone-500 dark:text-amber-300/80">
                Set a future time for your session to start automatically
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close scheduler"
            className="p-1.5 rounded-xl border-2 border-stone-300 dark:border-amber-400/30 text-stone-600 dark:text-amber-400 hover:bg-stone-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {/* Quick preset chips */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-wider text-[#1a1a1a]/70 dark:text-amber-400/90">
              Quick Start Time
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={handleNextHourPreset}
                className="px-3 py-1.5 rounded-full text-xs font-bold border-2 border-[#2a2a2a] dark:border-amber-400/40 bg-stone-100 dark:bg-zinc-800 text-[#0a0a0a] dark:text-amber-300 hover:bg-[#22c55e] hover:text-black transition cursor-pointer"
              >
                Top of Next Hour
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset(15)}
                className="px-3 py-1.5 rounded-full text-xs font-bold border-2 border-[#2a2a2a] dark:border-amber-400/40 bg-stone-100 dark:bg-zinc-800 text-[#0a0a0a] dark:text-amber-300 hover:bg-[#22c55e] hover:text-black transition cursor-pointer"
              >
                In 15m
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset(30)}
                className="px-3 py-1.5 rounded-full text-xs font-bold border-2 border-[#2a2a2a] dark:border-amber-400/40 bg-stone-100 dark:bg-zinc-800 text-[#0a0a0a] dark:text-amber-300 hover:bg-[#22c55e] hover:text-black transition cursor-pointer"
              >
                In 30m
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset(60)}
                className="px-3 py-1.5 rounded-full text-xs font-bold border-2 border-[#2a2a2a] dark:border-amber-400/40 bg-stone-100 dark:bg-zinc-800 text-[#0a0a0a] dark:text-amber-300 hover:bg-[#22c55e] hover:text-black transition cursor-pointer"
              >
                In 1 Hour
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset(120)}
                className="px-3 py-1.5 rounded-full text-xs font-bold border-2 border-[#2a2a2a] dark:border-amber-400/40 bg-stone-100 dark:bg-zinc-800 text-[#0a0a0a] dark:text-amber-300 hover:bg-[#22c55e] hover:text-black transition cursor-pointer"
              >
                In 2 Hours
              </button>
            </div>
          </div>

          {/* Date & Time Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <label className="text-[11px] font-black uppercase tracking-wider text-[#1a1a1a]/70 dark:text-amber-400/90 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#22c55e]" />
                <span>Date</span>
              </label>
              <input
                type="date"
                value={dateStr}
                min={formatDateYYYYMMDD(new Date())}
                onChange={(e) => {
                  setDateStr(e.target.value);
                  setErrorMsg('');
                }}
                className="w-full px-3 py-2 rounded-xl text-sm font-bold border-2 border-[#2a2a2a] dark:border-amber-400/40 bg-white dark:bg-zinc-800 text-[#0a0a0a] dark:text-amber-300 focus:outline-hidden focus:ring-2 focus:ring-[#22c55e]"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-black uppercase tracking-wider text-[#1a1a1a]/70 dark:text-amber-400/90 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#22c55e]" />
                <span>Start Time (e.g. 2:00 PM)</span>
              </label>
              <input
                type="time"
                value={timeStr}
                onChange={(e) => {
                  setTimeStr(e.target.value);
                  setErrorMsg('');
                }}
                className="w-full px-3 py-2 rounded-xl text-sm font-bold border-2 border-[#2a2a2a] dark:border-amber-400/40 bg-white dark:bg-zinc-800 text-[#0a0a0a] dark:text-amber-300 focus:outline-hidden focus:ring-2 focus:ring-[#22c55e]"
                required
              />
            </div>
          </div>

          {/* Live Scheduled Time Preview Card */}
          {targetDate && (
            <div
              className={`p-3 rounded-2xl border-2 transition-all flex items-center justify-between ${
                isPast
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                  : 'bg-emerald-50 dark:bg-zinc-800 border-[#22c55e] dark:border-amber-400/50 text-[#0a0a0a] dark:text-amber-300'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <span className="text-xl">{isPast ? '⚠️' : '⏰'}</span>
                <div>
                  <div className="text-xs font-black uppercase tracking-wide dark:text-amber-400">
                    {dayLabel} at {formattedDisplayTime}
                  </div>
                  <div className="text-[11px] font-semibold opacity-80">
                    {isPast ? 'Selected time is in the past' : remainingText}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={playScheduledAlertChime}
                title="Test start chime"
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-[#2a2a2a]/30 dark:border-amber-400/40 hover:bg-[#22c55e] hover:text-black transition flex items-center gap-1 cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Test Chime</span>
              </button>
            </div>
          )}

          {/* Duration Selector */}
          <div className="space-y-1.5 pt-1">
            <label className="text-[11px] font-black uppercase tracking-wider text-[#1a1a1a]/70 dark:text-amber-400/90">
              Focus Duration
            </label>
            <div className="grid grid-cols-5 gap-2">
              {[15, 25, 45, 60, 90].map((min) => (
                <button
                  key={min}
                  type="button"
                  onClick={() => setDurationMinutes(min)}
                  className={`py-2 px-1 rounded-xl text-xs font-black border-2 transition cursor-pointer text-center ${
                    durationMinutes === min
                      ? 'bg-[#22c55e] text-black border-[#2a2a2a] dark:border-amber-400 shadow-xs'
                      : 'bg-stone-50 dark:bg-zinc-800 border-stone-200 dark:border-zinc-700 text-stone-700 dark:text-amber-300 hover:border-[#2a2a2a]'
                  }`}
                >
                  {min}m
                </button>
              ))}
            </div>
          </div>

          {/* Optional Label / Intent */}
          <div className="space-y-1 pt-1">
            <label className="text-[11px] font-black uppercase tracking-wider text-[#1a1a1a]/70 dark:text-amber-400/90">
              Session Goal / Task Name (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Finish quarterly report, 2pm Workout, Study chapter 4"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              maxLength={60}
              className="w-full px-3 py-2 rounded-xl text-sm border-2 border-[#2a2a2a] dark:border-amber-400/40 bg-white dark:bg-zinc-800 text-[#0a0a0a] dark:text-amber-300 placeholder:text-stone-400 dark:placeholder:text-stone-600 focus:outline-hidden focus:ring-2 focus:ring-[#22c55e]"
            />
          </div>

          {/* Activity Type Selection */}
          <div className="space-y-1.5 pt-1">
            <label className="text-[11px] font-black uppercase tracking-wider text-[#1a1a1a]/70 dark:text-amber-400/90">
              Focus Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFocusActivity('desk-work')}
                className={`py-2 px-3 rounded-xl text-xs font-black border-2 transition cursor-pointer flex items-center justify-center space-x-1.5 ${
                  focusActivity === 'desk-work'
                    ? 'bg-[#22c55e]/20 border-[#22c55e] text-black dark:text-amber-300'
                    : 'bg-stone-50 dark:bg-zinc-800 border-stone-200 dark:border-zinc-700 text-stone-600 dark:text-amber-300/70'
                }`}
              >
                <span>💻</span>
                <span>Desk Work</span>
              </button>
              <button
                type="button"
                onClick={() => setFocusActivity('exercise')}
                className={`py-2 px-3 rounded-xl text-xs font-black border-2 transition cursor-pointer flex items-center justify-center space-x-1.5 ${
                  focusActivity === 'exercise'
                    ? 'bg-[#22c55e]/20 border-[#22c55e] text-black dark:text-amber-300'
                    : 'bg-stone-50 dark:bg-zinc-800 border-stone-200 dark:border-zinc-700 text-stone-600 dark:text-amber-300/70'
                }`}
              >
                <span>🏋️</span>
                <span>Exercise Routine</span>
              </button>
            </div>
          </div>

          {/* Auto Start Mode Option */}
          <div className="p-3 rounded-2xl border-2 border-stone-200 dark:border-amber-400/30 bg-stone-50 dark:bg-zinc-800/60 space-y-2">
            <label className="flex items-start space-x-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={autoStart}
                onChange={(e) => setAutoStart(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded-md border-[#2a2a2a] text-[#22c55e] focus:ring-[#22c55e] cursor-pointer"
              />
              <div className="text-xs">
                <span className="font-black text-[#0a0a0a] dark:text-amber-400 block">
                  Auto-start countdown immediately when time arrives
                </span>
                <span className="text-stone-500 dark:text-amber-300/70 block mt-0.5">
                  If unchecked, you'll receive a prompt modal asking you to start when ready.
                </span>
              </div>
            </label>

            {/* Notification Permission reminder */}
            {!hasPermission && isNotificationSupported() && (
              <div className="pt-2 border-t border-stone-200 dark:border-amber-400/20 flex items-center justify-between">
                <span className="text-[11px] text-stone-600 dark:text-amber-300 flex items-center gap-1">
                  <Bell className="w-3.5 h-3.5 text-amber-500" />
                  Enable notifications to alert you if tab is inactive
                </span>
                <button
                  type="button"
                  onClick={handleRequestNotify}
                  className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-[#22c55e] text-black border border-[#2a2a2a] hover:bg-[#1ea34d] transition cursor-pointer"
                >
                  Enable
                </button>
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300 text-xs font-bold text-center">
              {errorMsg}
            </div>
          )}

          {/* Modal Action Buttons */}
          <div className="flex space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-amber-400 text-xs font-black uppercase tracking-wider rounded-xl border-2 border-stone-300 dark:border-amber-400/30 hover:bg-stone-200 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPast}
              className={`flex-2 py-3 text-xs font-black uppercase tracking-wider rounded-xl border-2 border-[#2a2a2a] dark:border-amber-400 shadow-[0_4px_0_#0a0a0a] dark:shadow-[0_4px_0_#27272a] active:translate-y-0.5 active:shadow-none transition cursor-pointer flex items-center justify-center space-x-1.5 ${
                isPast
                  ? 'bg-stone-300 dark:bg-zinc-700 text-stone-500 cursor-not-allowed'
                  : 'bg-[#22c55e] text-black hover:bg-[#1ea34d]'
              }`}
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Confirm Schedule</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
