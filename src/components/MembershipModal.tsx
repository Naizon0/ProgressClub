import React, { useState } from 'react';
import {
  Crown,
  Zap,
  Sparkles,
  Shield,
  Check,
  X,
  TrendingUp,
  Compass,
  RotateCcw,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import {
  executePlayStorePurchase,
  isMedianAvailable,
  openPlayStoreSubscriptionManager,
  type PlanType,
} from '../utils/medianBilling';

interface MembershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: 'weekly' | 'monthly' | 'yearly' | 'none';
  isExecutive: boolean;
  onSelectPlan: (plan: 'weekly' | 'monthly' | 'yearly') => void;
  onRestorePurchases: () => void;
}

export const MembershipModal: React.FC<MembershipModalProps> = ({
  isOpen,
  onClose,
  currentPlan,
  isExecutive,
  onSelectPlan,
  onRestorePurchases,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('yearly');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePurchase = async () => {
    setErrorMessage(null);
    setIsPurchasing(true);

    try {
      const result = await executePlayStorePurchase(selectedPlan);

      if (!result.success) {
        if (!result.cancelled) {
          setErrorMessage(result.error || 'Google Play could not complete the purchase.');
        }
        setIsPurchasing(false);
        return;
      }

      // Purchase confirmed by Google Play
      setIsPurchasing(false);
      onSelectPlan(selectedPlan);
      onClose();
      alert('🎉 Google Play purchase successful! Welcome to the Executive Club.');
    } catch (err: any) {
      setIsPurchasing(false);
      setErrorMessage(err?.message || 'Unexpected billing error occurred.');
    }
  };

  const hasMedian = isMedianAvailable();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="membership-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className="bg-white dark:bg-zinc-900 border-2 border-[#2a2a2a] dark:border-zinc-700 rounded-2xl w-full max-w-md max-h-[92vh] flex flex-col overflow-hidden shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 p-5 text-black border-b-2 border-[#2a2a2a] dark:border-zinc-700 relative">
          <button
            type="button"
            id="close-membership-modal-btn"
            aria-label="Close membership modal"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-black/10 hover:bg-black/20 text-black cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1.5 bg-black text-amber-300 rounded-lg shadow-xs">
              <Crown className="w-4 h-4 fill-amber-300" />
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-black/80">
              EXECUTIVE CLUB
            </span>
          </div>

          <h2
            id="membership-modal-title"
            className="text-xl font-black uppercase tracking-tight text-black"
          >
            {isExecutive ? 'Executive Membership Active' : 'Upgrade to Executive Pass'}
          </h2>
          <p className="text-xs font-semibold text-black/80 mt-0.5">
            {isExecutive
              ? `You are enjoying 2x Bix earnings and VIP Club perks (${currentPlan.toUpperCase()} plan).`
              : 'Supercharge your focus habits, unlock VIP spaces, and double all session rewards.'}
          </p>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-[#0a0a0a] dark:text-zinc-100">
          {/* Key Perks Showcase */}
          <div className="space-y-2.5 bg-amber-50/50 dark:bg-amber-950/20 border-2 border-amber-200 dark:border-amber-900/60 p-3.5 rounded-xl">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Membership Benefits Included:</span>
            </span>

            <div className="grid grid-cols-1 gap-2 text-xs">
              <div className="flex items-start gap-2.5">
                <div className="p-1 bg-[#22c55e] text-black rounded shrink-0 mt-0.5">
                  <Zap className="w-3 h-3 fill-black" />
                </div>
                <div>
                  <p className="font-extrabold text-stone-900 dark:text-zinc-100">2x Double Bix Multiplier</p>
                  <p className="text-[11px] text-stone-600 dark:text-zinc-400">Earn 2 Bix per minute on every single focus session.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="p-1 bg-indigo-500 text-white rounded shrink-0 mt-0.5">
                  <Compass className="w-3 h-3" />
                </div>
                <div>
                  <p className="font-extrabold text-stone-900 dark:text-zinc-100">VIP Deep Space Workspace</p>
                  <p className="text-[11px] text-stone-600 dark:text-zinc-400">Instant unlock to the zero-gravity quiet focus environment.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="p-1 bg-amber-500 text-black rounded shrink-0 mt-0.5">
                  <TrendingUp className="w-3 h-3" />
                </div>
                <div>
                  <p className="font-extrabold text-stone-900 dark:text-zinc-100">Executive Habit Forecasts</p>
                  <p className="text-[11px] text-stone-600 dark:text-zinc-400">Productivity velocity curves, projected challenge dates & analytics.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="p-1 bg-emerald-600 text-white rounded shrink-0 mt-0.5">
                  <Shield className="w-3 h-3" />
                </div>
                <div>
                  <p className="font-extrabold text-stone-900 dark:text-zinc-100">Bonus Streak Protection</p>
                  <p className="text-[11px] text-stone-600 dark:text-zinc-400">Keeps your momentum thriving even on tough rest days.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Plan Selector */}
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-stone-500 dark:text-zinc-400 block">
              Choose Your Membership Plan:
            </span>

            {/* Yearly */}
            <div
              onClick={() => setSelectedPlan('yearly')}
              className={`p-3.5 border-2 rounded-xl cursor-pointer transition-all relative flex items-center justify-between ${
                selectedPlan === 'yearly'
                  ? 'border-[#22c55e] bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-[#22c55e]/20'
                  : 'border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800/60 hover:bg-stone-100 dark:hover:bg-zinc-800'
              }`}
            >
              <span className="absolute -top-2.5 right-3 bg-[#22c55e] text-black text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-black shadow-xs">
                Best Value • Save 80%
              </span>
              <div className="flex items-center gap-3">
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    selectedPlan === 'yearly'
                      ? 'border-[#22c55e] bg-[#22c55e]'
                      : 'border-stone-400'
                  }`}
                >
                  {selectedPlan === 'yearly' && <Check className="w-3 h-3 text-black stroke-[3]" />}
                </div>
                <div>
                  <p className="text-xs font-black uppercase text-stone-900 dark:text-zinc-100">Yearly Membership</p>
                  <p className="text-[11px] text-stone-500 dark:text-zinc-400">$1.00/month (billed $12.00 annually)</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-black text-stone-900 dark:text-zinc-100">$12.00</span>
                <span className="text-[10px] text-stone-500 block">/year</span>
              </div>
            </div>

            {/* Monthly */}
            <div
              onClick={() => setSelectedPlan('monthly')}
              className={`p-3.5 border-2 rounded-xl cursor-pointer transition-all flex items-center justify-between ${
                selectedPlan === 'monthly'
                  ? 'border-[#22c55e] bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-[#22c55e]/20'
                  : 'border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800/60 hover:bg-stone-100 dark:hover:bg-zinc-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    selectedPlan === 'monthly'
                      ? 'border-[#22c55e] bg-[#22c55e]'
                      : 'border-stone-400'
                  }`}
                >
                  {selectedPlan === 'monthly' && <Check className="w-3 h-3 text-black stroke-[3]" />}
                </div>
                <div>
                  <p className="text-xs font-black uppercase text-stone-900 dark:text-zinc-100">Monthly Membership</p>
                  <p className="text-[11px] text-stone-500 dark:text-zinc-400">Flexible month-to-month focus pass</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-black text-stone-900 dark:text-zinc-100">$5.50</span>
                <span className="text-[10px] text-stone-500 block">/month</span>
              </div>
            </div>

            {/* Weekly */}
            <div
              onClick={() => setSelectedPlan('weekly')}
              className={`p-3.5 border-2 rounded-xl cursor-pointer transition-all flex items-center justify-between ${
                selectedPlan === 'weekly'
                  ? 'border-[#22c55e] bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-[#22c55e]/20'
                  : 'border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800/60 hover:bg-stone-100 dark:hover:bg-zinc-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    selectedPlan === 'weekly'
                      ? 'border-[#22c55e] bg-[#22c55e]'
                      : 'border-stone-400'
                  }`}
                >
                  {selectedPlan === 'weekly' && <Check className="w-3 h-3 text-black stroke-[3]" />}
                </div>
                <div>
                  <p className="text-xs font-black uppercase text-stone-900 dark:text-zinc-100">Weekly Pass</p>
                  <p className="text-[11px] text-stone-500 dark:text-zinc-400">Short trial sprint pass</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-black text-stone-900 dark:text-zinc-100">$1.50</span>
                <span className="text-[10px] text-stone-500 block">/week</span>
              </div>
            </div>
          </div>

          {/* Error Message Display */}
          {errorMessage && (
            <div className="mx-5 mb-3 p-3 bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 rounded-xl flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              <div className="flex-1">
                <p className="font-bold">Purchase Not Completed</p>
                <p className="text-[11px] mt-0.5 text-red-600 dark:text-red-400">{errorMessage}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-stone-50 dark:bg-zinc-900/90 border-t-2 border-[#2a2a2a] dark:border-zinc-700 space-y-2">
          <button
            type="button"
            id="activate-membership-btn"
            disabled={isPurchasing}
            onClick={handlePurchase}
            className={`w-full py-3.5 px-4 font-black uppercase tracking-wider text-xs rounded-xl border-2 border-[#2a2a2a] dark:border-zinc-700 cursor-pointer shadow-xs active:translate-y-px transition-all flex items-center justify-center gap-2 ${
              isPurchasing
                ? 'bg-emerald-300 text-black cursor-wait opacity-80'
                : 'bg-[#22c55e] hover:bg-emerald-400 text-black'
            }`}
          >
            {isPurchasing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                <span>Contacting Google Play...</span>
              </>
            ) : (
              <>
                <Crown className="w-4 h-4 fill-black" />
                <span>
                  {isExecutive
                    ? `Switch via Google Play (${selectedPlan.toUpperCase()})`
                    : `Subscribe via Google Play ($${selectedPlan === 'yearly' ? '12.00/yr' : selectedPlan === 'monthly' ? '5.50/mo' : '1.50/wk'})`}
                </span>
              </>
            )}
          </button>

          <div className="flex items-center justify-between text-[11px] px-1 text-stone-500 dark:text-zinc-400">
            <button
              type="button"
              id="restore-purchases-modal-btn"
              onClick={onRestorePurchases}
              className="hover:text-black dark:hover:text-zinc-200 underline cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restore Google Play Purchases</span>
            </button>

            {isExecutive && (
              <button
                type="button"
                id="manage-google-play-sub-btn"
                onClick={() => openPlayStoreSubscriptionManager()}
                className="hover:text-black dark:hover:text-zinc-200 underline cursor-pointer"
              >
                Manage in Google Play
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="hover:text-black dark:hover:text-zinc-200 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MembershipModal;
