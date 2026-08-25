import React, { useState } from 'react';
import { ArrowLeft, Shield, FileText, Lock, CheckCircle2, Mail } from 'lucide-react';

export type LegalTab = 'privacy' | 'terms';

interface LegalModalProps {
  isOpen: boolean;
  initialTab?: LegalTab;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  initialTab = 'privacy',
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-heading"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 select-none"
    >
      <div className="bg-[#fafafa] dark:bg-[#18181b] border-2 border-[#2a2a2a] dark:border-zinc-700 rounded-2xl w-full max-w-lg h-[90vh] max-h-[700px] flex flex-col shadow-2xl overflow-hidden animate-[fade-in_0.2s_ease-out]">
        {/* Header Bar */}
        <div className="px-5 py-4 bg-white dark:bg-zinc-900 border-b-2 border-[#2a2a2a] dark:border-zinc-700 flex items-center justify-between shrink-0">
          <button
            type="button"
            id="legal-back-btn"
            aria-label="Back to settings"
            onClick={onClose}
            className="flex items-center gap-1.5 text-xs font-black text-stone-600 dark:text-zinc-300 hover:text-black dark:hover:text-white uppercase tracking-wider cursor-pointer active:translate-y-px"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Back</span>
          </button>
          
          <h2
            id="legal-modal-heading"
            className="text-sm font-black text-[#0a0a0a] dark:text-zinc-100 uppercase tracking-widest"
          >
            Legal & Compliance
          </h2>

          <div className="w-12"></div>
        </div>

        {/* Tab Selector */}
        <div className="p-3 bg-stone-100 dark:bg-zinc-800/80 border-b border-stone-200 dark:border-zinc-700 grid grid-cols-2 gap-2 shrink-0">
          <button
            type="button"
            id="legal-tab-privacy"
            aria-label="View Privacy Policy"
            onClick={() => setActiveTab('privacy')}
            className={`py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 border transition-all cursor-pointer ${
              activeTab === 'privacy'
                ? 'bg-[#22c55e] border-[#2a2a2a] dark:border-zinc-700 text-black shadow-xs'
                : 'bg-white dark:bg-zinc-800 border-stone-200 dark:border-zinc-600 text-stone-600 dark:text-zinc-300 hover:bg-stone-50 dark:hover:bg-zinc-700'
            }`}
          >
            <Shield className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Privacy Policy</span>
          </button>

          <button
            type="button"
            id="legal-tab-terms"
            aria-label="View Terms of Service"
            onClick={() => setActiveTab('terms')}
            className={`py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 border transition-all cursor-pointer ${
              activeTab === 'terms'
                ? 'bg-[#22c55e] border-[#2a2a2a] dark:border-zinc-700 text-black shadow-xs'
                : 'bg-white dark:bg-zinc-800 border-stone-200 dark:border-zinc-600 text-stone-600 dark:text-zinc-300 hover:bg-stone-50 dark:hover:bg-zinc-700'
            }`}
          >
            <FileText className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Terms of Service</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 text-[#0a0a0a] dark:text-zinc-200 text-xs leading-relaxed space-y-5 select-text">
          {activeTab === 'privacy' ? (
            <div className="space-y-4">
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/60 p-3 rounded-xl flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-[11px] text-emerald-900 dark:text-emerald-300 font-medium">
                  <strong>Privacy First Architecture:</strong> Progress Club stores your focus sessions, habit streaks, journal reflections, and workspace preferences directly in your device's local storage. We do not sell your personal information.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-black text-[#0a0a0a] dark:text-zinc-100 uppercase tracking-tight mb-1">
                  1. Information We Process
                </h3>
                <p className="text-stone-600 dark:text-zinc-400">
                  We process only the minimum information required to deliver your focus experience:
                </p>
                <ul className="list-disc pl-5 mt-1.5 space-y-1 text-stone-600 dark:text-zinc-400">
                  <li><strong>Focus Sessions & Timers:</strong> Session durations, timestamps, and completed calendar dates.</li>
                  <li><strong>Habit & Journal Notes:</strong> Text answers you enter during post-session habit check-ins.</li>
                  <li><strong>In-App Balance:</strong> Virtual Bix currency balance and unlocked customization items.</li>
                  <li><strong>App Preferences:</strong> Selected theme (Light/Dark/System) and reminder preferences.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-black text-[#0a0a0a] dark:text-zinc-100 uppercase tracking-tight mb-1">
                  2. Local Storage & Zero Third-Party Tracking
                </h3>
                <p className="text-stone-600 dark:text-zinc-400">
                  Your journal entries and timer logs reside inside your browser or native container storage (<code className="bg-stone-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-[10px]">localStorage</code>). No cross-app tracking cookies, advertising trackers, or data-broker SDKs are embedded within Progress Club.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-black text-[#0a0a0a] dark:text-zinc-100 uppercase tracking-tight mb-1">
                  3. Application Wrapper & Google Play
                </h3>
                <p className="text-stone-600 dark:text-zinc-400">
                  When accessing Progress Club through our verified Android application package on Google Play (Package ID: <code className="bg-stone-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-[10px]">co.median.android.mbdmdoe</code>), platform telemetry is governed by Google Play Services according to standard Google Play Developer policies.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-black text-[#0a0a0a] dark:text-zinc-100 uppercase tracking-tight mb-1">
                  4. Your Rights & Data Deletion
                </h3>
                <p className="text-stone-600 dark:text-zinc-400">
                  You maintain 100% control over your data. You may clear your app cache or reset your data at any time via App Settings or your device application manager. Once cleared, your data is completely removed from the local sandbox.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-black text-[#0a0a0a] dark:text-zinc-100 uppercase tracking-tight mb-1">
                  5. Contact & Data Officer
                </h3>
                <p className="text-stone-600 dark:text-zinc-400 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-stone-500" aria-hidden="true" />
                  <span>Questions regarding privacy can be directed to: <strong>privacy@progressclub.app</strong></span>
                </p>
              </div>

              <p className="text-[10px] text-stone-400 dark:text-zinc-500 pt-2 border-t border-stone-200 dark:border-zinc-800">
                Last Updated: June 2026 • Version 1.2.0 Compliant with CCPA, GDPR & Google Play Safety Policies.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-700/60 p-3 rounded-xl flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-[11px] text-blue-900 dark:text-blue-300 font-medium">
                  <strong>Agreement Summary:</strong> By using Progress Club, you agree to build positive habits respectfully, use the timer responsibly, and acknowledge our virtual currency and subscription terms.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-black text-[#0a0a0a] dark:text-zinc-100 uppercase tracking-tight mb-1">
                  1. Acceptance of Terms
                </h3>
                <p className="text-stone-600 dark:text-zinc-400">
                  By downloading, accessing, or using Progress Club, you acknowledge that you have read, understood, and agreed to be bound by these Terms of Service.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-black text-[#0a0a0a] dark:text-zinc-100 uppercase tracking-tight mb-1">
                  2. Virtual Currency (Bix) & Digital Collectibles
                </h3>
                <p className="text-stone-600 dark:text-zinc-400">
                  "Bix" is an in-app reward point earned through deep work sessions and daily habit completion. Bix has no real-world monetary value, cannot be redeemed for fiat currency, and cannot be transferred between third parties. All virtual workspace decorations and characters are digital goods for personal productivity enjoyment.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-black text-[#0a0a0a] dark:text-zinc-100 uppercase tracking-tight mb-1">
                  3. In-App Subscriptions & Billing
                </h3>
                <p className="text-stone-600 dark:text-zinc-400">
                  Optional Executive Club memberships and passes are processed securely via Google Play In-App Billing or designated app stores. Subscriptions auto-renew unless cancelled at least 24 hours prior to the conclusion of the active billing cycle in your Google Play subscription management console.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-black text-[#0a0a0a] dark:text-zinc-100 uppercase tracking-tight mb-1">
                  4. Habit Productivity Disclaimer
                </h3>
                <p className="text-stone-600 dark:text-zinc-400">
                  Progress Club is a self-improvement and time management tool designed to support personal focus. It does not replace medical, clinical, or psychological advice. Take regular rest breaks and practice mindful ergonomics.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-black text-[#0a0a0a] dark:text-zinc-100 uppercase tracking-tight mb-1">
                  5. Contact & Support
                </h3>
                <p className="text-stone-600 dark:text-zinc-400 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-stone-500" aria-hidden="true" />
                  <span>Support contact: <strong>support@progressclub.app</strong></span>
                </p>
              </div>

              <p className="text-[10px] text-stone-400 dark:text-zinc-500 pt-2 border-t border-stone-200 dark:border-zinc-800">
                Last Updated: June 2026 • Progress Club Terms of Service.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-white dark:bg-zinc-900 border-t-2 border-[#2a2a2a] dark:border-zinc-700 flex justify-end shrink-0">
          <button
            type="button"
            id="legal-close-footer-btn"
            aria-label="Close legal modal"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-[#22c55e] hover:bg-emerald-400 text-black text-xs font-black uppercase tracking-wider rounded-xl border border-[#2a2a2a] dark:border-zinc-700 cursor-pointer shadow-xs active:translate-y-px"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};

export default LegalModal;
