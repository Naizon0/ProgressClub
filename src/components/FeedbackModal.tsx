import React, { useState } from 'react';
import { MessageSquare, Bug, Sparkles, Heart, Send, CheckCircle2, ArrowLeft, Mail, Info } from 'lucide-react';
import { FeedbackEntry } from '../types';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  username?: string;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  username,
}) => {
  const [category, setCategory] = useState<'bug' | 'feature' | 'general' | 'compliment'>('general');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [includeDiagnostics, setIncludeDiagnostics] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const feedbackEntry: FeedbackEntry = {
      id: 'fb-' + Date.now(),
      category,
      message: message.trim(),
      email: email.trim() || undefined,
      timestamp: new Date().toISOString(),
      appVersion: '1.2.0 (Median Android)',
    };

    try {
      const existing = localStorage.getItem('progress_club_feedback_history');
      const list: FeedbackEntry[] = existing ? JSON.parse(existing) : [];
      list.push(feedbackEntry);
      localStorage.setItem('progress_club_feedback_history', JSON.stringify(list));
    } catch (err) {
      console.warn('Feedback save warning:', err);
    }

    setIsSubmitted(true);
  };

  const handleSendViaEmail = () => {
    const subject = encodeURIComponent(`[Progress Club ${category.toUpperCase()}] Feedback from ${username || 'User'}`);
    const diagInfo = includeDiagnostics
      ? `\n\n--- Diagnostics ---\nApp Version: 1.2.0 (Median Android)\nScreen: ${window.innerWidth}x${window.innerHeight}\nUser: ${username || 'Anonymous'}\nTimestamp: ${new Date().toISOString()}`
      : '';
    const body = encodeURIComponent(`${message.trim()}${diagInfo}`);
    window.location.href = `mailto:support@progressclub.app?subject=${subject}&body=${body}`;
  };

  const resetForm = () => {
    setIsSubmitted(false);
    setMessage('');
    setEmail('');
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-modal-title"
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none"
    >
      <div className="bg-white dark:bg-[#18181b] border-2 border-[#2a2a2a] dark:border-zinc-700 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-[fade-in_0.2s_ease-out]">
        {isSubmitted ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 mx-auto bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-[#22c55e] rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" aria-hidden="true" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-[#0a0a0a] dark:text-zinc-100 uppercase tracking-tight">
                Feedback Received!
              </h3>
              <p className="text-xs text-[#1a1a1a]/70 dark:text-zinc-400 leading-relaxed max-w-xs mx-auto">
                Thank you{username ? ` ${username}` : ''}! Your thoughts directly shape future updates of Progress Club.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                id="feedback-email-backup-btn"
                aria-label="Also send feedback copy via email"
                onClick={handleSendViaEmail}
                className="py-2.5 bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 dark:hover:bg-zinc-700 text-stone-800 dark:text-zinc-200 text-xs font-black uppercase tracking-wider rounded-xl border border-stone-300 dark:border-zinc-600 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Open in Email App</span>
              </button>
              
              <button
                type="button"
                id="feedback-done-btn"
                aria-label="Close feedback modal"
                onClick={resetForm}
                className="py-3 bg-[#22c55e] hover:bg-emerald-400 text-black text-xs font-black uppercase tracking-wider rounded-xl border-2 border-[#2a2a2a] dark:border-zinc-700 cursor-pointer active:translate-y-px"
              >
                Back to App
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 rounded-lg text-[#22c55e]">
                  <MessageSquare className="w-4 h-4" aria-hidden="true" />
                </div>
                <h3
                  id="feedback-modal-title"
                  className="text-sm font-black text-[#0a0a0a] dark:text-zinc-100 uppercase tracking-widest"
                >
                  Send Feedback
                </h3>
              </div>

              <button
                type="button"
                id="close-feedback-btn"
                aria-label="Cancel and close feedback"
                onClick={onClose}
                className="text-xs font-bold text-stone-400 hover:text-black dark:hover:text-white uppercase"
              >
                Cancel
              </button>
            </div>

            {/* Category Selectors */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-stone-500 dark:text-zinc-400 uppercase tracking-wider block">
                Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {[
                  { id: 'general', label: 'Feedback', icon: MessageSquare },
                  { id: 'bug', label: 'Bug Report', icon: Bug },
                  { id: 'feature', label: 'Feature', icon: Sparkles },
                  { id: 'compliment', label: 'Love It', icon: Heart },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSel = category === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      id={`fb-cat-${item.id}`}
                      aria-label={`Select category ${item.label}`}
                      onClick={() => setCategory(item.id as any)}
                      className={`py-2 px-2 rounded-xl text-[11px] font-bold flex flex-col items-center gap-1 border transition-all cursor-pointer ${
                        isSel
                          ? 'bg-[#22c55e] border-[#2a2a2a] dark:border-zinc-700 text-black shadow-xs font-black'
                          : 'bg-stone-50 dark:bg-zinc-800 border-stone-200 dark:border-zinc-700 text-stone-600 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-700'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Message Area */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label
                  htmlFor="feedback-message-input"
                  className="text-[10px] font-black text-stone-500 dark:text-zinc-400 uppercase tracking-wider"
                >
                  Your Message <span className="text-red-500">*</span>
                </label>
                <span className="text-[9px] font-mono text-stone-400 dark:text-zinc-500">
                  {message.length} chars
                </span>
              </div>
              <textarea
                id="feedback-message-input"
                aria-label="Feedback message"
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  category === 'bug'
                    ? "Please describe what happened, what you expected, and any steps to reproduce..."
                    : category === 'feature'
                    ? "What new feature or workspace item would make your focus sessions even better?"
                    : "Tell us anything on your mind or how Progress Club is helping you..."
                }
                className="w-full bg-stone-50 dark:bg-zinc-900 border border-[#2a2a2a] dark:border-zinc-700 rounded-xl p-3 text-xs text-[#0a0a0a] dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-[#22c55e] leading-relaxed resize-none"
              />
            </div>

            {/* Email field */}
            <div className="space-y-1">
              <label
                htmlFor="feedback-email-input"
                className="text-[10px] font-black text-stone-500 dark:text-zinc-400 uppercase tracking-wider block"
              >
                Your Email <span className="text-stone-400 font-normal">(Optional, if you'd like a response)</span>
              </label>
              <input
                id="feedback-email-input"
                type="email"
                aria-label="Optional reply email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full bg-stone-50 dark:bg-zinc-900 border border-[#2a2a2a] dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-[#0a0a0a] dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-[#22c55e]"
              />
            </div>

            {/* Diagnostics toggle */}
            <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeDiagnostics}
                onChange={(e) => setIncludeDiagnostics(e.target.checked)}
                className="w-3.5 h-3.5 accent-[#22c55e] rounded"
              />
              <span className="text-[10px] text-stone-500 dark:text-zinc-400 flex items-center gap-1">
                <Info className="w-3 h-3 text-stone-400" aria-hidden="true" />
                Include anonymous app diagnostic info (Version 1.2.0)
              </span>
            </label>

            {/* Submit buttons */}
            <div className="pt-2">
              <button
                type="submit"
                id="submit-feedback-btn"
                aria-label="Submit feedback report"
                disabled={!message.trim()}
                className={`w-full py-3 text-xs font-black uppercase tracking-wider rounded-xl border-2 border-[#2a2a2a] dark:border-zinc-700 flex items-center justify-center gap-2 transition-all ${
                  message.trim()
                    ? 'bg-[#22c55e] hover:bg-emerald-400 text-black cursor-pointer shadow-xs active:translate-y-px'
                    : 'bg-stone-200 dark:bg-zinc-800 text-stone-400 dark:text-zinc-600 cursor-not-allowed border-stone-300 dark:border-zinc-700'
                }`}
              >
                <Send className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Submit Feedback</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default FeedbackModal;
