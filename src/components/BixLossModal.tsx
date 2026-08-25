import React from 'react';
import { BixLossRecord } from '../types';
import { ShieldAlert, AlertTriangle, Play, CheckCircle2 } from 'lucide-react';

interface BixLossModalProps {
  lossRecord: BixLossRecord;
  currentBixBalance: number;
  streakCount: number;
  streakShieldsRemaining: number;
  onStartRecoverySession: () => void;
  onDismiss: () => void;
}

export default function BixLossModal({
  lossRecord,
  currentBixBalance,
  streakCount,
  streakShieldsRemaining,
  onStartRecoverySession,
  onDismiss,
}: BixLossModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200"
      id="bix-loss-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bix-loss-title"
    >
      <div className="bg-white dark:bg-zinc-900 border-2 border-[#2a2a2a] dark:border-zinc-700 w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-5 text-left relative overflow-hidden">
        
        {/* Urgent Header Tag */}
        <div className="flex items-center justify-between border-b-2 border-stone-100 dark:border-zinc-800 pb-3">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 rounded-lg">
              <AlertTriangle className="w-4 h-4" aria-hidden="true" />
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400">
              INACTIVITY PENALTY REPORT
            </span>
          </div>
          <span className="text-[10px] font-mono text-stone-400 dark:text-zinc-500">
            {lossRecord.date}
          </span>
        </div>

        {/* Big Loss Stat Display */}
        <div className="bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-200 dark:border-rose-900/60 rounded-2xl p-4 text-center space-y-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-rose-700 dark:text-rose-300">
            VAULT DEDUCTION APPLIED
          </span>
          <div className="text-4xl font-black text-rose-600 dark:text-rose-400 font-mono tracking-tight">
            -{lossRecord.amountLost} BIX
          </div>
          <p className="text-[11px] font-semibold text-rose-800 dark:text-rose-300/90">
            Day concluded without a logged focus session.
          </p>
        </div>

        {/* Streak & Shield Status */}
        <div className="p-3 bg-stone-50 dark:bg-zinc-800/70 border-2 border-[#2a2a2a] dark:border-zinc-700 rounded-2xl space-y-2">
          {lossRecord.shieldUsed ? (
            <div className="flex items-start space-x-2 text-xs">
              <span className="text-base">🛡️</span>
              <div>
                <p className="font-black text-[#0a0a0a] dark:text-zinc-100 uppercase tracking-wide">
                  STREAK SHIELD DEPLOYED
                </p>
                <p className="text-[11px] text-stone-600 dark:text-zinc-400 leading-tight mt-0.5">
                  1 shield automatically absorbed the streak penalty! You have {streakShieldsRemaining} shield remaining.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start space-x-2 text-xs">
              <span className="text-base">⚠️</span>
              <div>
                <p className="font-black text-[#0a0a0a] dark:text-zinc-100 uppercase tracking-wide">
                  STREAK AT RISK
                </p>
                <p className="text-[11px] text-stone-600 dark:text-zinc-400 leading-tight mt-0.5">
                  No streak shield was available. Complete today's focus session now to protect your momentum!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Philosophy Quotation */}
        <div className="border-l-3 border-[#22c55e] pl-3 py-1">
          <p className="text-xs font-black uppercase tracking-wider text-[#0a0a0a] dark:text-zinc-100">
            MOST WON'T. YOU WILL.
          </p>
          <p className="text-[10px] font-medium text-stone-500 dark:text-zinc-400">
            Momentum is earned daily. Reclaim your focus right now.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <button
            type="button"
            id="start-recovery-session-btn"
            aria-label="Start recovery focus session immediately"
            onClick={onStartRecoverySession}
            className="w-full py-3.5 px-4 bg-[#22c55e] hover:bg-emerald-400 text-black text-xs font-black uppercase tracking-widest rounded-xl border-2 border-[#2a2a2a] dark:border-zinc-700 shadow-[0_4px_0_#0a0a0a] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-black" aria-hidden="true" />
            <span>START RECOVERY SESSION NOW</span>
          </button>

          <button
            type="button"
            id="dismiss-bix-loss-modal-btn"
            aria-label="Acknowledge Bix loss and continue"
            onClick={onDismiss}
            className="w-full py-2.5 px-4 bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 dark:hover:bg-zinc-700 text-[#0a0a0a] dark:text-zinc-300 text-xs font-black uppercase tracking-wider rounded-xl border-2 border-stone-200 dark:border-zinc-700 transition-colors cursor-pointer"
          >
            ACKNOWLEDGE & CONTINUE
          </button>
        </div>

      </div>
    </div>
  );
}
