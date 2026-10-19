import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Clock,
  ShieldCheck,
  Coins,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  BookOpen,
  Target,
  Zap,
  Flame,
  CheckCircle2,
  Compass,
  BellRing,
  HelpCircle,
} from 'lucide-react';
import CrewCharacter from './CrewCharacter';

interface WalkthroughModalProps {
  isOpen: boolean;
  onComplete: () => void;
  onStartKickstarterSession?: (durationMinutes: number) => void;
  username?: string;
  characterId?: string;
}

export const WALKTHROUGH_STORAGE_KEY = 'progress_club_walkthrough_completed_v1';

export const WalkthroughModal: React.FC<WalkthroughModalProps> = ({
  isOpen,
  onComplete,
  onStartKickstarterSession,
  username = 'Friend',
  characterId = 'cipher',
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  // Interactive sample journal testing state
  const [sampleJournalText, setSampleJournalText] = useState('');
  const [sampleJournalSaved, setSampleJournalSaved] = useState(false);

  // Interactive sample timer testing state
  const [sampleTimerRunning, setSampleTimerRunning] = useState(false);
  const [sampleTimerSeconds, setSampleTimerSeconds] = useState(5);
  const [sampleTimerFinished, setSampleTimerFinished] = useState(false);

  if (!isOpen) return null;

  const handleTestTimer = () => {
    if (sampleTimerRunning) return;
    setSampleTimerRunning(true);
    setSampleTimerFinished(false);
    let sec = 5;
    setSampleTimerSeconds(sec);
    const interval = setInterval(() => {
      sec -= 1;
      setSampleTimerSeconds(sec);
      if (sec <= 0) {
        clearInterval(interval);
        setSampleTimerRunning(false);
        setSampleTimerFinished(true);
      }
    }, 800);
  };

  const steps = [
    // -------------------------------------------------------------
    // STEP 1: WELCOME & THE DAILY FOCUS LOOP
    // -------------------------------------------------------------
    {
      id: 'loop',
      icon: Compass,
      badge: 'GUIDE 1 OF 5',
      title: 'Welcome to Progress Club!',
      description:
        `Welcome ${username}! Progress Club transforms productivity into a rewarding daily habit. Here is the 4-step focus loop you will follow every day:`,
      preview: (
        <div className="bg-stone-50 dark:bg-zinc-900 border-2 border-[#2a2a2a] dark:border-zinc-700 rounded-2xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2 text-left">
            <div className="bg-white dark:bg-zinc-800 p-2.5 rounded-xl border border-stone-200 dark:border-zinc-700 space-y-1">
              <span className="text-xs font-black text-[#22c55e]">1. Set Duration</span>
              <p className="text-[10px] text-stone-600 dark:text-zinc-400 font-medium">
                Choose 5m to 90m for desk work or exercise.
              </p>
            </div>
            <div className="bg-white dark:bg-zinc-800 p-2.5 rounded-xl border border-stone-200 dark:border-zinc-700 space-y-1">
              <span className="text-xs font-black text-[#22c55e]">2. Focus Together</span>
              <p className="text-[10px] text-stone-600 dark:text-zinc-400 font-medium">
                Your companion character works beside you.
              </p>
            </div>
            <div className="bg-white dark:bg-zinc-800 p-2.5 rounded-xl border border-stone-200 dark:border-zinc-700 space-y-1">
              <span className="text-xs font-black text-[#22c55e]">3. Mindful Journal</span>
              <p className="text-[10px] text-stone-600 dark:text-zinc-400 font-medium">
                1-sentence reflection seals dopamine & memory.
              </p>
            </div>
            <div className="bg-white dark:bg-zinc-800 p-2.5 rounded-xl border border-stone-200 dark:border-zinc-700 space-y-1">
              <span className="text-xs font-black text-[#22c55e]">4. Earn & Level Up</span>
              <p className="text-[10px] text-stone-600 dark:text-zinc-400 font-medium">
                Get 2 Bix per minute to unlock rooms & items.
              </p>
            </div>
          </div>
          <div className="flex justify-center scale-90">
            <CrewCharacter characterId={characterId} pose="idle" height={80} />
          </div>
        </div>
      ),
    },

    // -------------------------------------------------------------
    // STEP 2: MASTERING THE FOCUS TIMER
    // -------------------------------------------------------------
    {
      id: 'timer',
      icon: Clock,
      badge: 'GUIDE 2 OF 5',
      title: 'How to Effectively Utilize the Timer',
      description:
        'The timer is designed to remove starting friction, maintain accountability, and alert you even if you switch windows.',
      preview: (
        <div className="bg-stone-50 dark:bg-zinc-900 border-2 border-[#2a2a2a] dark:border-zinc-700 rounded-2xl p-4 space-y-3 text-left">
          {/* Duration strategies */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-black uppercase text-stone-400 dark:text-zinc-400">
              💡 Recommended Duration Strategies:
            </span>
            <div className="grid grid-cols-3 gap-1.5 text-center">
              <div className="p-2 rounded-lg bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700">
                <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 block font-mono">5 MINS</span>
                <span className="text-[8px] text-stone-500 font-bold block uppercase">Quick Reset</span>
                <p className="text-[8px] text-stone-400 mt-0.5">Beat procrastination</p>
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-zinc-800 border-2 border-[#22c55e]">
                <span className="text-[10px] font-black text-[#22c55e] block font-mono">25 MINS</span>
                <span className="text-[8px] text-emerald-700 dark:text-emerald-300 font-black block uppercase">Classic</span>
                <p className="text-[8px] text-stone-400 mt-0.5">Gold standard flow</p>
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700">
                <span className="text-[10px] font-black text-sky-600 dark:text-sky-400 block font-mono">50 MINS</span>
                <span className="text-[8px] text-stone-500 font-bold block uppercase">Deep Block</span>
                <p className="text-[8px] text-stone-400 mt-0.5">Immersion sprint</p>
              </div>
            </div>
          </div>

          {/* Interactive 5-Second Test Button */}
          <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-300 dark:border-emerald-800 text-center space-y-2">
            <div className="flex items-center justify-between text-xs font-black">
              <span className="text-emerald-950 dark:text-emerald-200 uppercase">Test Timer Flow:</span>
              <span className="font-mono text-emerald-600 text-sm">
                00:0{sampleTimerSeconds}
              </span>
            </div>
            <button
              type="button"
              onClick={handleTestTimer}
              disabled={sampleTimerRunning}
              className={`w-full py-2 rounded-lg text-xs font-black uppercase tracking-wider border transition-all cursor-pointer ${
                sampleTimerRunning
                  ? 'bg-emerald-200 text-emerald-900 border-emerald-400 animate-pulse'
                  : 'bg-[#22c55e] hover:bg-emerald-400 text-black border-[#2a2a2a]'
              }`}
            >
              {sampleTimerRunning ? 'Simulating Focus Session...' : sampleTimerFinished ? '✓ DING! Completed!' : '▶ Try a 5-Sec Demo Countdown'}
            </button>
            <p className="text-[9px] text-emerald-800 dark:text-emerald-400">
              🔔 Includes audio bell chime & background tab notifications when finished!
            </p>
          </div>
        </div>
      ),
    },

    // -------------------------------------------------------------
    // STEP 3: EFFECTIVELY UTILIZING JOURNAL PROMPTS (CRITICAL)
    // -------------------------------------------------------------
    {
      id: 'journal',
      icon: BookOpen,
      badge: 'GUIDE 3 OF 5',
      title: 'How to Effectively Utilize Journal Prompts',
      description:
        'Right when the timer dings, a mindful reflection prompt appears. This 30-second habit is scientifically proven to lock in neuroplastic gains.',
      preview: (
        <div className="bg-stone-50 dark:bg-zinc-900 border-2 border-[#2a2a2a] dark:border-zinc-700 rounded-2xl p-4 space-y-3 text-left">
          {/* Why it works callout */}
          <div className="bg-white dark:bg-zinc-800 p-2.5 rounded-xl border border-stone-200 dark:border-zinc-700 space-y-1">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#22c55e]" />
              <span className="text-[10px] font-black uppercase text-[#0a0a0a] dark:text-zinc-100">
                The Science of Micro-Reflection
              </span>
            </div>
            <p className="text-[10px] text-stone-600 dark:text-zinc-400 leading-snug">
              Writing just <strong>1 sentence</strong> immediately after focusing releases an internal dopamine anchor, making you 3x more likely to return tomorrow.
            </p>
          </div>

          {/* Interactive sample prompt test */}
          <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl border-2 border-[#22c55e] space-y-2">
            <span className="text-[9px] font-black uppercase text-[#22c55e] tracking-wider block">
              SAMPLE PROMPT IN ACTION:
            </span>
            <p className="text-xs font-black text-emerald-950 dark:text-emerald-100">
              "What went well or what distraction did you overcome?"
            </p>

            {/* Quick 1-tap responses */}
            <div className="flex flex-wrap gap-1">
              {[
                '✨ Muted phone & stayed in flow',
                '📖 Finished priority chapter',
                '💪 Resisted urge to browse news',
              ].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setSampleJournalText(preset);
                    setSampleJournalSaved(true);
                  }}
                  className="text-[9px] font-bold bg-white dark:bg-zinc-800 hover:bg-emerald-100 text-stone-800 dark:text-zinc-200 px-2 py-1 rounded-md border border-emerald-300 dark:border-emerald-700 cursor-pointer"
                >
                  + {preset}
                </button>
              ))}
            </div>

            <div className="flex gap-1.5">
              <input
                type="text"
                value={sampleJournalText}
                onChange={(e) => setSampleJournalText(e.target.value)}
                placeholder="Type 1 quick line..."
                className="flex-1 p-2 text-xs border border-emerald-300 dark:border-emerald-700 rounded-lg bg-white dark:bg-zinc-900 text-[#0a0a0a] dark:text-zinc-100 outline-none"
              />
              <button
                type="button"
                onClick={() => setSampleJournalSaved(true)}
                disabled={!sampleJournalText.trim()}
                className="px-3 py-1.5 bg-[#22c55e] text-black text-xs font-black rounded-lg uppercase tracking-wider cursor-pointer disabled:opacity-50"
              >
                Save
              </button>
            </div>

            {sampleJournalSaved && (
              <p className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 flex items-center gap-1 animate-fadeIn">
                <Check className="w-3.5 h-3.5" /> Saved to your personal Habit History!
              </p>
            )}
          </div>
        </div>
      ),
    },

    // -------------------------------------------------------------
    // STEP 4: VISUAL PROGRESS & STREAK PROTECTION
    // -------------------------------------------------------------
    {
      id: 'progress',
      icon: ShieldCheck,
      badge: 'GUIDE 4 OF 5',
      title: 'Habit Trail & Streak Protection',
      description:
        'Track your journey on the new Habit Expedition Trail. Life happens — so we built in Grace Days and Streak Shields to protect your momentum.',
      preview: (
        <div className="bg-stone-50 dark:bg-zinc-900 border-2 border-[#2a2a2a] dark:border-zinc-700 rounded-2xl p-4 space-y-3 text-left">
          {/* Visual Trail Teaser */}
          <div className="bg-white dark:bg-zinc-800 p-3 rounded-xl border border-stone-200 dark:border-zinc-700 flex items-center justify-around">
            <div className="text-center">
              <span className="text-xl">🚩</span>
              <p className="text-[8px] font-bold text-stone-500 uppercase">Day 1</p>
              <p className="text-[9px] font-black text-[#22c55e]">Spark</p>
            </div>
            <span className="text-stone-300 font-bold">➔</span>
            <div className="text-center">
              <span className="text-xl">🛡️</span>
              <p className="text-[8px] font-bold text-stone-500 uppercase">Day 7</p>
              <p className="text-[9px] font-black text-amber-500">+1 Shield</p>
            </div>
            <span className="text-stone-300 font-bold">➔</span>
            <div className="text-center">
              <span className="text-xl">🧠</span>
              <p className="text-[8px] font-bold text-stone-500 uppercase">Day 14</p>
              <p className="text-[9px] font-black text-[#22c55e]">+100 Bix</p>
            </div>
            <span className="text-stone-300 font-bold">➔</span>
            <div className="text-center">
              <span className="text-xl">🏆</span>
              <p className="text-[8px] font-bold text-stone-500 uppercase">Day 21</p>
              <p className="text-[9px] font-black text-amber-500">Graduation</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white dark:bg-zinc-800 p-2.5 rounded-xl border border-stone-200 dark:border-zinc-700 space-y-1">
              <span className="text-xs font-black text-emerald-600">🛡️ Grace Days</span>
              <p className="text-[10px] text-stone-600 dark:text-zinc-400 leading-snug">
                Missing 1 day does not reset your streak to zero.
              </p>
            </div>
            <div className="bg-white dark:bg-zinc-800 p-2.5 rounded-xl border border-stone-200 dark:border-zinc-700 space-y-1">
              <span className="text-xs font-black text-amber-600">⚡ Streak Shields</span>
              <p className="text-[10px] text-stone-600 dark:text-zinc-400 leading-snug">
                Earn shields on Day 7 & 14 to automatically absorb missed days.
              </p>
            </div>
          </div>
        </div>
      ),
    },

    // -------------------------------------------------------------
    // STEP 5: 100% FREE & READY TO START
    // -------------------------------------------------------------
    {
      id: 'ready',
      icon: Sparkles,
      badge: 'GUIDE 5 OF 5',
      title: '100% Free • Ready to Focus?',
      description:
        'No subscriptions, no paywalls. Earn 2 Bix for every minute of focus, customize your office cabin, and build lifelong momentum.',
      preview: (
        <div className="bg-stone-50 dark:bg-zinc-900 border-2 border-[#2a2a2a] dark:border-zinc-700 rounded-2xl p-4 text-center space-y-3">
          <div className="flex justify-center scale-105 my-1">
            <CrewCharacter characterId={characterId} pose="challenge-complete" height={95} />
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-950/50 p-2.5 rounded-xl border border-emerald-300 dark:border-emerald-800">
            <p className="text-xs font-black text-emerald-950 dark:text-emerald-200 uppercase">
              You are ready, {username}!
            </p>
            <p className="text-[10px] text-emerald-800 dark:text-emerald-400 font-medium">
              Start with a quick 5-minute kickstarter or jump right into your custom workspace.
            </p>
          </div>

          {onStartKickstarterSession && (
            <button
              type="button"
              id="kickstarter-focus-btn"
              onClick={() => {
                onComplete();
                onStartKickstarterSession(5);
              }}
              className="w-full py-3 bg-[#22c55e] hover:bg-emerald-400 text-black text-xs font-black uppercase tracking-wider rounded-xl border-2 border-[#2a2a2a] shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>⚡</span>
              <span>Launch 5-Minute Kickstarter Session Now</span>
            </button>
          )}
        </div>
      ),
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const step = steps[currentStep];
  const Icon = step.icon;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="walkthrough-title"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none animate-[fade-in_0.2s_ease-out] overflow-y-auto"
    >
      <div className="bg-white dark:bg-[#18181b] border-2 border-[#2a2a2a] dark:border-zinc-700 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 relative my-auto">
        {/* Top bar with Step badge & Prominent Skip button */}
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-zinc-800 pb-3">
          <span className="text-[10px] font-black text-[#22c55e] uppercase tracking-widest flex items-center gap-1.5">
            <Icon className="w-3.5 h-3.5" aria-hidden="true" />
            {step.badge}
          </span>

          <button
            type="button"
            id="walkthrough-skip-btn"
            aria-label="Skip feature walkthrough"
            onClick={onComplete}
            className="px-2.5 py-1 bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 dark:hover:bg-zinc-700 text-stone-600 dark:text-zinc-300 hover:text-black dark:hover:text-white text-[11px] font-black uppercase rounded-lg border border-stone-300 dark:border-zinc-700 cursor-pointer active:translate-y-px transition-colors"
          >
            Skip
          </button>
        </div>

        {/* Dynamic Step Content with smooth transitions */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            <div className="space-y-1 text-center">
              <h2
                id="walkthrough-title"
                className="text-lg font-black text-[#0a0a0a] dark:text-zinc-100 uppercase tracking-tight"
              >
                {step.title}
              </h2>
              <p className="text-xs text-stone-600 dark:text-zinc-400 leading-relaxed max-w-sm mx-auto">
                {step.description}
              </p>
            </div>

            {/* Feature Visual Preview */}
            <div className="py-1">{step.preview}</div>
          </motion.div>
        </AnimatePresence>

        {/* Step Indicators & Navigation */}
        <div className="pt-2 border-t border-stone-200 dark:border-zinc-800 space-y-3">
          {/* Progress dots */}
          <div className="flex items-center justify-center gap-1.5">
            {steps.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                aria-label={`Jump to walkthrough step ${idx + 1}`}
                onClick={() => setCurrentStep(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === currentStep
                    ? 'w-6 bg-[#22c55e]'
                    : 'w-2 bg-stone-300 dark:bg-zinc-700 hover:bg-stone-400'
                }`}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            {currentStep > 0 ? (
              <button
                type="button"
                id="walkthrough-prev-btn"
                aria-label="Previous walkthrough step"
                onClick={handlePrev}
                className="py-3 bg-white dark:bg-zinc-800 hover:bg-stone-100 dark:hover:bg-zinc-700 text-stone-800 dark:text-zinc-200 text-xs font-black uppercase tracking-wider rounded-xl border-2 border-[#2a2a2a] dark:border-zinc-600 flex items-center justify-center gap-1 cursor-pointer active:translate-y-px"
              >
                <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Back</span>
              </button>
            ) : (
              <button
                type="button"
                id="walkthrough-skip-bottom-btn"
                aria-label="Skip walkthrough"
                onClick={onComplete}
                className="py-3 bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 text-stone-600 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider rounded-xl border border-stone-300 dark:border-zinc-700 cursor-pointer text-center"
              >
                Skip
              </button>
            )}

            <button
              type="button"
              id="walkthrough-next-btn"
              aria-label={
                currentStep === steps.length - 1
                  ? 'Finish walkthrough and start focusing'
                  : 'Next walkthrough step'
              }
              onClick={handleNext}
              className="py-3 bg-[#22c55e] hover:bg-emerald-400 text-black text-xs font-black uppercase tracking-wider rounded-xl border-2 border-[#2a2a2a] dark:border-zinc-700 flex items-center justify-center gap-1 cursor-pointer shadow-xs active:translate-y-px transition-colors"
            >
              <span>{currentStep === steps.length - 1 ? "Let's Focus!" : 'Next'}</span>
              {currentStep === steps.length - 1 ? (
                <Check className="w-3.5 h-3.5" aria-hidden="true" />
              ) : (
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalkthroughModal;
