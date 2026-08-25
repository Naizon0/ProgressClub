import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, ShieldCheck, Coins, Sparkles, ArrowRight, ArrowLeft, X, Check } from 'lucide-react';
import CrewCharacter from './CrewCharacter';

interface WalkthroughModalProps {
  isOpen: boolean;
  onComplete: () => void;
  username?: string;
  characterId?: string;
}

export const WALKTHROUGH_STORAGE_KEY = 'progress_club_walkthrough_completed_v1';

export const WalkthroughModal: React.FC<WalkthroughModalProps> = ({
  isOpen,
  onComplete,
  username,
  characterId = 'cipher',
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      id: 'timer',
      icon: Clock,
      badge: 'FEATURE 1 OF 4',
      title: 'Supportive Focus Timer',
      description:
        'Choose your preferred focus duration (5 to 90 minutes) or switch between deep desk work and quick dumbbell workouts. Your character stays focused alongside you!',
      preview: (
        <div className="bg-stone-50 dark:bg-zinc-900 border-2 border-[#2a2a2a] dark:border-zinc-700 rounded-xl p-4 flex flex-col items-center justify-center space-y-3">
          <div className="scale-90">
            <CrewCharacter characterId={characterId} pose="typing" height={90} />
          </div>
          <div className="flex items-center gap-2 font-mono text-xl font-black text-[#22c55e]">
            <span>25:00</span>
            <span className="text-[10px] px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded font-sans uppercase font-bold">
              In Focus
            </span>
          </div>
        </div>
      ),
    },
    {
      id: 'challenge',
      icon: ShieldCheck,
      badge: 'FEATURE 2 OF 4',
      title: '21-Day Habit Challenge & Grace Days',
      description:
        'Commit to showing up consistently. Our system includes built-in Grace Days and unlockable Streak Shields so missing a single day never resets your hard-earned progress!',
      preview: (
        <div className="bg-stone-50 dark:bg-zinc-900 border-2 border-[#2a2a2a] dark:border-zinc-700 rounded-xl p-4 flex flex-col items-center justify-center space-y-2">
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5, 6, 7].map((d) => (
              <div
                key={d}
                className={`w-7 h-7 rounded-lg border-2 border-[#2a2a2a] dark:border-zinc-700 flex items-center justify-center text-xs font-black ${
                  d <= 5
                    ? 'bg-[#22c55e] text-black'
                    : d === 6
                    ? 'bg-amber-300 text-black animate-pulse'
                    : 'bg-white dark:bg-zinc-800 text-stone-400'
                }`}
              >
                {d <= 5 ? '✓' : d}
              </div>
            ))}
          </div>
          <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            🛡️ 1 Streak Shield Active & Ready
          </p>
        </div>
      ),
    },
    {
      id: 'bix',
      icon: Coins,
      badge: 'FEATURE 3 OF 4',
      title: 'Earn Bix Currency Every Session',
      description:
        'Earn Bix points for every focused minute and daily goal completed. The more consistent you are, the more reward currency you accumulate to spend in the Shop!',
      preview: (
        <div className="bg-stone-50 dark:bg-zinc-900 border-2 border-[#2a2a2a] dark:border-zinc-700 rounded-xl p-4 flex items-center justify-around">
          <div className="text-center space-y-1">
            <span className="text-2xl">🪙</span>
            <p className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase font-mono">+125 Bix</p>
            <span className="text-[9px] text-stone-500 uppercase font-bold">25m Focus</span>
          </div>
          <div className="h-8 w-px bg-stone-300 dark:bg-zinc-700"></div>
          <div className="text-center space-y-1">
            <span className="text-2xl">🎯</span>
            <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase font-mono">+50 Bix</p>
            <span className="text-[9px] text-stone-500 uppercase font-bold">Daily Goal</span>
          </div>
        </div>
      ),
    },
    {
      id: 'cabin',
      icon: Sparkles,
      badge: 'FEATURE 4 OF 4',
      title: 'Cabin Office & Custom Collectibles',
      description:
        'Unlock custom character crewmates, switch room backdrops (Rooftop, Loft, Zen Garden), and drag or pinch-to-resize trophies and cozy decorations in your Cabin view!',
      preview: (
        <div className="bg-stone-50 dark:bg-zinc-900 border-2 border-[#2a2a2a] dark:border-zinc-700 rounded-xl p-4 flex items-center justify-center gap-4">
          <div className="text-center">
            <span className="text-3xl filter drop-shadow">🏆</span>
            <p className="text-[9px] font-bold text-stone-500 mt-1">Trophy</p>
          </div>
          <div className="text-center">
            <span className="text-3xl filter drop-shadow">🪴</span>
            <p className="text-[9px] font-bold text-stone-500 mt-1">Bonsai</p>
          </div>
          <div className="text-center">
            <span className="text-3xl filter drop-shadow">🔮</span>
            <p className="text-[9px] font-bold text-stone-500 mt-1">Lava Lamp</p>
          </div>
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
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none animate-[fade-in_0.2s_ease-out]"
    >
      <div className="bg-white dark:bg-[#18181b] border-2 border-[#2a2a2a] dark:border-zinc-700 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 relative">
        {/* Top bar with Step badge & Prominent Skip button */}
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-zinc-800 pb-3">
          <span className="text-[10px] font-black text-[#22c55e] uppercase tracking-widest flex items-center gap-1">
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
            Skip Walkthrough
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
            className="space-y-4"
          >
            <div className="space-y-1 text-center">
              <h2
                id="walkthrough-title"
                className="text-xl font-black text-[#0a0a0a] dark:text-zinc-100 uppercase tracking-tight"
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
              aria-label={currentStep === steps.length - 1 ? "Finish walkthrough and start focusing" : "Next walkthrough step"}
              onClick={handleNext}
              className="py-3 bg-[#22c55e] hover:bg-emerald-400 text-black text-xs font-black uppercase tracking-wider rounded-xl border-2 border-[#2a2a2a] dark:border-zinc-700 flex items-center justify-center gap-1 cursor-pointer shadow-xs active:translate-y-px transition-colors"
            >
              <span>{currentStep === steps.length - 1 ? "Let's Focus!" : "Next"}</span>
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
