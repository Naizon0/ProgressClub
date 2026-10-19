import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppState } from '../types';
import CrewCharacter from './CrewCharacter';
import {
  Trophy,
  Shield,
  Zap,
  Flame,
  Check,
  Lock,
  Compass,
  Award,
  Sparkles,
  Calendar,
  Activity,
  ArrowRight,
  Info,
} from 'lucide-react';

// Helper: Get local Date string as YYYY-MM-DD
function getLocalDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper: Get offset date
function getDateForOffset(startDateStr: string, offsetDays: number): string {
  if (!startDateStr) return '';
  const d = new Date(startDateStr + 'T12:00:00');
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface ProgressVisualizerProps {
  state: AppState;
  onOpenShop?: () => void;
  compact?: boolean;
}

export const MILESTONES = [
  { day: 1, title: 'The Spark', reward: 'Starter Badge', icon: '🚩', desc: 'First focus session logged.' },
  { day: 3, title: 'Habit Ignition', reward: '+50 Bonus Bix', icon: '⚡', desc: '3-day consecutive focus streak.' },
  { day: 7, title: 'Summit One', reward: '+1 Streak Shield', icon: '🛡️', desc: 'Completed full first week of consistency.' },
  { day: 10, title: 'Double Digits', reward: 'Deep Focus Badge', icon: '🎯', desc: '10 sessions of intentional habit building.' },
  { day: 14, title: 'Neuroplastic Shift', reward: '+100 Bonus Bix', icon: '🧠', desc: '2 weeks in: neural pathways start locking the habit.' },
  { day: 18, title: 'Iron Will', reward: 'Gold Frame Accent', icon: '💎', desc: 'Resilience through busy and low-motivation days.' },
  { day: 21, title: 'Club Master', reward: 'Graduation Trophy', icon: '🏆', desc: '21-day transformation complete!' },
];

export const ProgressVisualizer: React.FC<ProgressVisualizerProps> = ({
  state,
  onOpenShop,
  compact = false,
}) => {
  const [visualMode, setVisualMode] = useState<'trail' | 'rings' | 'badges' | 'grid'>('trail');
  const [selectedDayInfo, setSelectedDayInfo] = useState<{
    day: number;
    date: string;
    completed: boolean;
    milestone?: (typeof MILESTONES)[0];
  } | null>(null);

  const todayStr = getLocalDateString();
  const daysTotal = state.challengeLength || 21;
  const completedCount = state.completedDates?.length || 0;
  const completionPercent = Math.min(100, Math.round((completedCount / daysTotal) * 100));

  // Determine current active day index (1-based)
  let currentActiveDayIndex = 1;
  if (state.challengeStartDate) {
    const start = new Date(state.challengeStartDate + 'T12:00:00');
    const today = new Date(todayStr + 'T12:00:00');
    const diffDays = Math.round((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    currentActiveDayIndex = Math.min(daysTotal, Math.max(1, diffDays + 1));
  } else {
    currentActiveDayIndex = Math.min(daysTotal, Math.max(1, completedCount + 1));
  }

  // Next upcoming milestone
  const nextMilestone = MILESTONES.find((m) => m.day > completedCount) || MILESTONES[MILESTONES.length - 1];
  const daysToNextMilestone = Math.max(0, nextMilestone.day - completedCount);

  // Weekly stats for rings
  const totalFocusedHours = parseFloat(((state.totalFocusedMinutes || 0) / 60).toFixed(1));
  const weeklyTargetHours = 5.0; // standard 5 hrs/week baseline
  const weeklyProgressPercent = Math.min(100, Math.round((totalFocusedHours / weeklyTargetHours) * 100));

  // BADGES CALCULATION
  const badges = [
    {
      id: 'first-session',
      name: 'First Step',
      icon: '🌱',
      description: 'Completed your 1st focus session',
      unlocked: state.totalSessionsCompleted >= 1,
      progress: `${Math.min(1, state.totalSessionsCompleted)}/1`,
    },
    {
      id: 'three-day-streak',
      name: 'Habit Ignition',
      icon: '⚡',
      description: 'Logged 3 completed days',
      unlocked: completedCount >= 3,
      progress: `${Math.min(3, completedCount)}/3`,
    },
    {
      id: 'week-one',
      name: 'Week One Champion',
      icon: '🛡️',
      description: 'Completed 7 full challenge days',
      unlocked: completedCount >= 7,
      progress: `${Math.min(7, completedCount)}/7`,
    },
    {
      id: 'journal-keeper',
      name: 'Reflection Master',
      icon: '✍️',
      description: 'Saved 3+ post-session habit journals',
      unlocked: (state.savedJournalEntries?.length || 0) >= 3,
      progress: `${Math.min(3, state.savedJournalEntries?.length || 0)}/3`,
    },
    {
      id: 'deep-work-100',
      name: 'Century Focus',
      icon: '⏱️',
      description: 'Logged over 100 minutes of deep focus',
      unlocked: (state.totalFocusedMinutes || 0) >= 100,
      progress: `${Math.min(100, state.totalFocusedMinutes || 0)}/100m`,
    },
    {
      id: 'graduation-21',
      name: 'Club Master',
      icon: '🏆',
      description: 'Conquered the entire 21-Day Challenge',
      unlocked: completedCount >= 21,
      progress: `${Math.min(21, completedCount)}/21`,
    },
  ];

  // -------------------------------------------------------------
  // COMPACT HOME VIEW WIDGET (for quick glance on Home Tab)
  // -------------------------------------------------------------
  if (compact) {
    return (
      <div className="bg-white dark:bg-zinc-900 border-2 border-[#2a2a2a] dark:border-zinc-700 rounded-2xl p-4 shadow-xs select-none space-y-3 text-left">
        <div className="flex items-center justify-between border-b border-[#2a2a2a]/10 dark:border-zinc-800 pb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">🏔️</span>
            <h3 className="text-xs font-black uppercase tracking-wider text-[#0a0a0a] dark:text-zinc-100">
              HABIT EXPEDITION TRAIL
            </h3>
          </div>
          <span className="text-[10px] font-black uppercase text-[#22c55e] bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 px-2 py-0.5 rounded-full">
            {completionPercent}% Completed
          </span>
        </div>

        {/* Milestone path bar */}
        <div className="relative pt-2 pb-1">
          <div className="h-2.5 w-full bg-stone-100 dark:bg-zinc-800 rounded-full border border-stone-300 dark:border-zinc-700 overflow-hidden relative">
            <div
              className="h-full bg-[#22c55e] transition-all duration-700 ease-out"
              style={{ width: `${completionPercent}%` }}
            />
          </div>

          {/* Key milestone checkpoints markers along the bar */}
          <div className="flex justify-between items-center mt-2 px-1">
            {MILESTONES.filter((m) => [1, 7, 14, 21].includes(m.day)).map((m) => {
              const isPassed = completedCount >= m.day;
              const isCurrentTarget = nextMilestone.day === m.day;
              return (
                <div key={m.day} className="flex flex-col items-center">
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-black transition-all ${
                      isPassed
                        ? 'bg-[#22c55e] border-[#2a2a2a] text-black shadow-xs'
                        : isCurrentTarget
                        ? 'bg-amber-100 dark:bg-amber-950/80 border-amber-500 text-amber-800 dark:text-amber-200 animate-pulse'
                        : 'bg-stone-100 dark:bg-zinc-800 border-stone-300 dark:border-zinc-700 text-stone-400'
                    }`}
                  >
                    {isPassed ? '✓' : m.icon}
                  </div>
                  <span className="text-[8px] font-black text-stone-500 dark:text-zinc-400 mt-1 uppercase">
                    Day {m.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Next milestone incentive callout */}
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 p-2.5 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{nextMilestone.icon}</span>
            <div>
              <p className="text-[10px] font-black uppercase text-emerald-950 dark:text-emerald-200">
                Next: {nextMilestone.title} ({nextMilestone.reward})
              </p>
              <p className="text-[9px] text-emerald-800/80 dark:text-emerald-400/80 font-medium">
                {daysToNextMilestone === 0
                  ? 'Milestone unlocked! Keep your streak steady.'
                  : `${daysToNextMilestone} more focus session${daysToNextMilestone > 1 ? 's' : ''} to unlock!`}
              </p>
            </div>
          </div>
          <span className="text-xs font-black text-[#22c55e] uppercase">Day {nextMilestone.day}</span>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // FULL STATS TAB PROGRESS VISUALIZER
  // -------------------------------------------------------------
  return (
    <div className="bg-white dark:bg-zinc-900 border-2 border-[#2a2a2a] dark:border-zinc-700 rounded-2xl p-5 shadow-xs space-y-5 text-left">
      {/* Header & View Switcher */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-[#2a2a2a]/10 dark:border-zinc-800 pb-3">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-base">🚀</span>
            <h3 className="text-sm font-black uppercase tracking-wider text-[#0a0a0a] dark:text-zinc-100">
              VISUAL PROGRESS & ACHIEVEMENTS
            </h3>
          </div>
          <p className="text-[10px] text-stone-500 dark:text-zinc-400 font-medium">
            Interactive habit visualizer beyond the standard calendar grid
          </p>
        </div>

        {/* Clean segmented view toggle (no pills per frontend-design) */}
        <div className="flex items-center bg-stone-100 dark:bg-zinc-800 p-1 rounded-xl border border-stone-200 dark:border-zinc-700 text-[10px] font-black uppercase">
          <button
            type="button"
            id="view-trail-btn"
            onClick={() => setVisualMode('trail')}
            className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
              visualMode === 'trail'
                ? 'bg-white dark:bg-zinc-900 text-[#0a0a0a] dark:text-zinc-100 shadow-xs border border-stone-200 dark:border-zinc-700'
                : 'text-stone-500 dark:text-zinc-400 hover:text-black dark:hover:text-white'
            }`}
          >
            <span>🏔️</span>
            <span>Trail</span>
          </button>
          <button
            type="button"
            id="view-rings-btn"
            onClick={() => setVisualMode('rings')}
            className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
              visualMode === 'rings'
                ? 'bg-white dark:bg-zinc-900 text-[#0a0a0a] dark:text-zinc-100 shadow-xs border border-stone-200 dark:border-zinc-700'
                : 'text-stone-500 dark:text-zinc-400 hover:text-black dark:hover:text-white'
            }`}
          >
            <span>⚡</span>
            <span>Momentum</span>
          </button>
          <button
            type="button"
            id="view-badges-btn"
            onClick={() => setVisualMode('badges')}
            className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
              visualMode === 'badges'
                ? 'bg-white dark:bg-zinc-900 text-[#0a0a0a] dark:text-zinc-100 shadow-xs border border-stone-200 dark:border-zinc-700'
                : 'text-stone-500 dark:text-zinc-400 hover:text-black dark:hover:text-white'
            }`}
          >
            <span>🏆</span>
            <span>Badges</span>
          </button>
          <button
            type="button"
            id="view-grid-btn"
            onClick={() => setVisualMode('grid')}
            className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
              visualMode === 'grid'
                ? 'bg-white dark:bg-zinc-900 text-[#0a0a0a] dark:text-zinc-100 shadow-xs border border-stone-200 dark:border-zinc-700'
                : 'text-stone-500 dark:text-zinc-400 hover:text-black dark:hover:text-white'
            }`}
          >
            <span>🗓️</span>
            <span>Grid</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. INTERACTIVE HABIT EXPEDITION TRAIL VIEW                     */}
      {/* ------------------------------------------------------------- */}
      {visualMode === 'trail' && (
        <div className="space-y-4">
          {/* Status summary banner */}
          <div className="flex items-center justify-between bg-stone-50 dark:bg-zinc-800/80 p-3 rounded-xl border border-stone-200 dark:border-zinc-700">
            <div>
              <span className="text-[9px] font-black uppercase text-stone-400 dark:text-zinc-400 block">
                Current Expedition Stage
              </span>
              <p className="text-xs font-black text-[#0a0a0a] dark:text-zinc-100 uppercase">
                {completedCount < 7
                  ? 'Stage 1: Foundation & Habit Spark'
                  : completedCount < 14
                  ? 'Stage 2: Neuroplastic Solidification'
                  : 'Stage 3: Mastery & Identity Shift'}
              </p>
            </div>
            <div className="text-right">
              <span className="text-lg font-black text-[#22c55e]">{completedCount}</span>
              <span className="text-xs font-bold text-stone-400">/{daysTotal} Days</span>
            </div>
          </div>

          {/* Winding Trail Map Container */}
          <div className="relative bg-gradient-to-b from-stone-50/70 via-emerald-50/20 to-stone-100/50 dark:from-zinc-900 dark:via-emerald-950/20 dark:to-zinc-900/90 rounded-2xl border-2 border-[#2a2a2a] dark:border-zinc-700 p-4 pt-6 overflow-hidden">
            {/* Ambient topo background contour */}
            <div
              className="absolute inset-0 opacity-5 pointer-events-none textured-noise-pattern"
              aria-hidden="true"
            />

            {/* Vertical Expedition Trail */}
            <div className="relative space-y-6 max-w-sm mx-auto">
              {[...Array(daysTotal)].map((_, i) => {
                const dayIndex = i + 1;
                const targetDateStr = state.challengeStartDate
                  ? getDateForOffset(state.challengeStartDate, i)
                  : '';
                const isCompleted = targetDateStr
                  ? state.completedDates?.includes(targetDateStr)
                  : dayIndex <= completedCount;
                const isCurrent = dayIndex === currentActiveDayIndex;
                const milestone = MILESTONES.find((m) => m.day === dayIndex);

                // Alternating zig-zag offset for an organic trail look
                const offsetClass =
                  dayIndex % 4 === 1
                    ? 'translate-x-0'
                    : dayIndex % 4 === 2
                    ? 'translate-x-12 sm:translate-x-16'
                    : dayIndex % 4 === 3
                    ? 'translate-x-20 sm:translate-x-28'
                    : 'translate-x-8 sm:translate-x-10';

                return (
                  <div key={dayIndex} className="relative flex items-center">
                    {/* Milestone node row */}
                    <div className={`transition-all duration-300 ${offsetClass} flex items-center gap-3`}>
                      {/* Interactive Station Node */}
                      <button
                        type="button"
                        aria-label={`Day ${dayIndex} ${milestone ? milestone.title : ''}`}
                        onClick={() =>
                          setSelectedDayInfo({
                            day: dayIndex,
                            date: targetDateStr || `Day ${dayIndex}`,
                            completed: isCompleted,
                            milestone,
                          })
                        }
                        className={`relative w-11 h-11 rounded-2xl border-2 flex items-center justify-center font-black transition-all cursor-pointer shadow-xs active:scale-95 ${
                          isCompleted
                            ? 'bg-[#22c55e] border-[#2a2a2a] dark:border-zinc-700 text-black'
                            : isCurrent
                            ? 'bg-white dark:bg-zinc-800 border-[#22c55e] text-[#22c55e] ring-4 ring-emerald-400/30 animate-pulse'
                            : milestone
                            ? 'bg-amber-50 dark:bg-zinc-800 border-amber-400 dark:border-amber-600 text-amber-700 dark:text-amber-300'
                            : 'bg-white dark:bg-zinc-800 border-stone-300 dark:border-zinc-700 text-stone-400 dark:text-zinc-500 hover:border-black'
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="w-5 h-5 stroke-[3]" />
                        ) : milestone ? (
                          <span className="text-lg">{milestone.icon}</span>
                        ) : (
                          <span className="text-xs font-mono">{dayIndex}</span>
                        )}

                        {/* If this is the current active day, position character avatar here! */}
                        {isCurrent && (
                          <div className="absolute -top-10 -right-6 pointer-events-none scale-75 animate-bounce">
                            <CrewCharacter
                              characterId={state.currentActiveCharacter || 'cipher'}
                              pose="celebrating"
                              height={55}
                            />
                          </div>
                        )}
                      </button>

                      {/* Station Text / Milestone Label */}
                      <div className="text-left">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-black uppercase text-stone-400 dark:text-zinc-400 font-mono">
                            Day {dayIndex}
                          </span>
                          {isCurrent && (
                            <span className="text-[8px] font-black uppercase bg-[#22c55e] text-black px-1.5 py-0.5 rounded">
                              Current
                            </span>
                          )}
                        </div>
                        {milestone ? (
                          <div>
                            <p className="text-xs font-black uppercase text-[#0a0a0a] dark:text-zinc-100 leading-tight">
                              {milestone.title}
                            </p>
                            <span className="text-[9px] text-[#22c55e] font-bold">
                              🎁 {milestone.reward}
                            </span>
                          </div>
                        ) : (
                          <p className="text-[10px] font-semibold text-stone-500 dark:text-zinc-400">
                            {isCompleted ? '✓ Completed' : 'Focus session'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected station detail drawer */}
          {selectedDayInfo && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-stone-900 text-white dark:bg-zinc-800 p-4 rounded-xl border-2 border-[#22c55e] space-y-2 relative"
            >
              <button
                type="button"
                onClick={() => setSelectedDayInfo(null)}
                className="absolute top-2.5 right-2.5 text-stone-400 hover:text-white text-xs font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
              <div className="flex items-center gap-2">
                <span className="text-xl">
                  {selectedDayInfo.milestone?.icon || (selectedDayInfo.completed ? '✅' : '🎯')}
                </span>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#22c55e]">
                    Day {selectedDayInfo.day}: {selectedDayInfo.milestone?.title || 'Daily Focus Milestone'}
                  </h4>
                  <p className="text-[10px] text-stone-300 dark:text-zinc-400">
                    {selectedDayInfo.completed ? 'Status: Accomplished!' : 'Status: Ahead on your journey'}
                  </p>
                </div>
              </div>
              {selectedDayInfo.milestone && (
                <p className="text-[11px] text-stone-300 font-medium leading-relaxed">
                  {selectedDayInfo.milestone.desc} Reward unlocked: <strong>{selectedDayInfo.milestone.reward}</strong>.
                </p>
              )}
            </motion.div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. MOMENTUM & RADIAL METRICS VIEW                             */}
      {/* ------------------------------------------------------------- */}
      {visualMode === 'rings' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Circular Progress Gauge */}
            <div className="bg-stone-50 dark:bg-zinc-800/80 p-5 rounded-2xl border-2 border-[#2a2a2a] dark:border-zinc-700 flex flex-col items-center text-center space-y-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-stone-500 dark:text-zinc-400">
                CHALLENGE COMPLETION GAUGE
              </span>

              {/* SVG Radial Ring */}
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Track circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-stone-200 dark:text-zinc-700 fill-none"
                  />
                  {/* Progress stroke */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#22c55e"
                    strokeWidth="8"
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 - (251.2 * completionPercent) / 100}
                    strokeLinecap="round"
                    className="fill-none transition-all duration-1000 ease-out"
                  />
                </svg>

                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black font-mono text-[#0a0a0a] dark:text-zinc-100">
                    {completionPercent}%
                  </span>
                  <span className="text-[9px] font-bold uppercase text-stone-500 dark:text-zinc-400">
                    {completedCount} / {daysTotal} Days
                  </span>
                </div>
              </div>

              <p className="text-[10px] text-stone-600 dark:text-zinc-400 font-medium max-w-xs">
                {completionPercent >= 100
                  ? '🎉 Challenge Mastered! All 21 days logged!'
                  : `${daysTotal - completedCount} days remaining to reach graduation.`}
              </p>
            </div>

            {/* Velocity & Focus Momentum */}
            <div className="space-y-3">
              <div className="bg-stone-50 dark:bg-zinc-800/80 p-4 rounded-xl border border-stone-200 dark:border-zinc-700 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase text-stone-500 dark:text-zinc-400">
                    WEEKLY FOCUS TARGET
                  </span>
                  <span className="text-xs font-black text-[#22c55e]">{totalFocusedHours} / 5.0 hrs</span>
                </div>
                <div className="h-2 w-full bg-stone-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#22c55e] transition-all duration-500"
                    style={{ width: `${weeklyProgressPercent}%` }}
                  />
                </div>
                <p className="text-[9px] text-stone-500 dark:text-zinc-400">
                  Aim for 5 hours of deep focus each week for optimal neuroplastic retention.
                </p>
              </div>

              <div className="bg-stone-50 dark:bg-zinc-800/80 p-4 rounded-xl border border-stone-200 dark:border-zinc-700 space-y-1">
                <span className="text-[10px] font-black uppercase text-stone-500 dark:text-zinc-400">
                  REAL-WORLD EQUIVALENTS
                </span>
                <p className="text-xs font-black text-[#0a0a0a] dark:text-zinc-100">
                  📚 ≈ {Math.max(1, Math.round(state.totalFocusedMinutes / 45))} Deep Work Chapters
                </p>
                <p className="text-[10px] text-stone-500 dark:text-zinc-400">
                  Equivalent to completing {Math.floor((state.totalFocusedMinutes || 0) / 25)} full Pomodoro cycles.
                </p>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-xl border border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200 space-y-1">
                <div className="flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-500" />
                  <span className="text-[10px] font-black uppercase">CONSISTENCY MULTIPLIER</span>
                </div>
                <p className="text-xs font-black text-[#22c55e]">
                  Active Velocity: +{Math.round(((state.totalFocusedMinutes || 0) / Math.max(1, completedCount)) * 1.5)} pts/session
                </p>
                <p className="text-[9px] text-emerald-800 dark:text-emerald-400">
                  Steady momentum protects your Bix and accelerates workspace upgrades.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. MILESTONE BADGES GALLERY VIEW                              */}
      {/* ------------------------------------------------------------- */}
      {visualMode === 'badges' && (
        <div className="space-y-4">
          <p className="text-xs text-stone-600 dark:text-zinc-400 font-medium">
            Collect special recognition badges as you hit focus milestones and build your habit routine:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {badges.map((b) => (
              <div
                key={b.id}
                className={`p-3.5 rounded-xl border-2 flex items-start gap-3 transition-all ${
                  b.unlocked
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700 text-stone-900 dark:text-zinc-100'
                    : 'bg-stone-50 dark:bg-zinc-800/60 border-stone-200 dark:border-zinc-700 opacity-60 text-stone-500 dark:text-zinc-400'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center text-xl shrink-0 ${
                    b.unlocked
                      ? 'bg-[#22c55e] border-[#2a2a2a] text-black shadow-xs'
                      : 'bg-stone-200 dark:bg-zinc-700 border-stone-300 text-stone-400'
                  }`}
                >
                  {b.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase truncate">{b.name}</h4>
                    <span className="text-[9px] font-black font-mono">
                      {b.unlocked ? '✓ UNLOCKED' : b.progress}
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-500 dark:text-zinc-400 mt-0.5 leading-snug">
                    {b.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. CALENDAR GRID VIEW (CLASSIC 7-COLUMN REFERENCE)            */}
      {/* ------------------------------------------------------------- */}
      {visualMode === 'grid' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center bg-stone-50 dark:bg-zinc-800 p-2.5 rounded-xl border border-stone-200 dark:border-zinc-700 text-xs font-bold uppercase">
            <span>21-Day Calendar Grid</span>
            <span className="text-[#22c55e]">{completedCount} Days Complete</span>
          </div>

          <div className="grid grid-cols-7 gap-1.5 justify-items-center">
            {[...Array(daysTotal)].map((_, i) => {
              const dayIndex = i + 1;
              const targetDateStr = state.challengeStartDate
                ? getDateForOffset(state.challengeStartDate, i)
                : '';
              const isCompleted = targetDateStr
                ? state.completedDates?.includes(targetDateStr)
                : dayIndex <= completedCount;
              const isCurrent = targetDateStr ? targetDateStr === todayStr : dayIndex === 1;

              return (
                <div
                  key={i}
                  className={`w-10 h-10 rounded-lg border-2 flex flex-col items-center justify-center text-[10px] font-black transition-all ${
                    isCompleted
                      ? 'bg-[#22c55e] border-[#2a2a2a] text-black shadow-xs'
                      : isCurrent
                      ? 'bg-white dark:bg-zinc-800 border-[#22c55e] text-[#22c55e] animate-pulse'
                      : 'bg-stone-50 dark:bg-zinc-800 border-stone-200 dark:border-zinc-700 text-stone-400'
                  }`}
                >
                  <span>{dayIndex}</span>
                  {isCompleted && <span className="text-[8px] font-black">✓</span>}
                </div>
              );
            })}
          </div>

          <div className="flex justify-center gap-4 text-[9px] text-stone-500 font-bold uppercase pt-2">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-[#22c55e] rounded border border-black" /> Completed
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-white border-2 border-[#22c55e] rounded" /> Today
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-stone-100 border border-stone-300 rounded" /> Upcoming
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressVisualizer;
