import React, { useState } from 'react';
import { Star, Heart, X, Sparkles, ExternalLink, MessageSquare } from 'lucide-react';

export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=co.median.android.mbdmdoe';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRated: (rating: number, openedStore: boolean) => void;
  onRemindLater: () => void;
  onNeverAskAgain: () => void;
  onOpenFeedback: () => void;
  username?: string;
  milestoneReason?: string;
}

export const RatingModal: React.FC<RatingModalProps> = ({
  isOpen,
  onClose,
  onRated,
  onRemindLater,
  onNeverAskAgain,
  onOpenFeedback,
  username,
  milestoneReason = 'celebrating your focus consistency',
}) => {
  const [selectedStars, setSelectedStars] = useState<number>(5);
  const [hoveredStars, setHoveredStars] = useState<number | null>(null);

  if (!isOpen) return null;

  const currentStars = hoveredStars !== null ? hoveredStars : selectedStars;

  const handleRateSubmit = () => {
    if (selectedStars >= 4) {
      // Open Google Play Store
      try {
        window.open(PLAY_STORE_URL, '_blank', 'noopener,noreferrer');
      } catch (e) {
        window.location.href = PLAY_STORE_URL;
      }
      onRated(selectedStars, true);
    } else {
      // 1-3 stars: route to internal feedback
      onRated(selectedStars, false);
      onOpenFeedback();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rating-modal-title"
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 select-none animate-[fade-in_0.2s_ease-out]"
    >
      <div className="bg-white dark:bg-[#18181b] border-2 border-[#2a2a2a] dark:border-zinc-700 p-6 rounded-2xl max-w-sm w-full text-center space-y-5 shadow-2xl relative">
        {/* Close Button */}
        <button
          type="button"
          id="rating-modal-close-x"
          aria-label="Close rating prompt"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 text-stone-400 dark:text-zinc-500 hover:text-black dark:hover:text-white p-1 rounded-lg cursor-pointer"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>

        {/* Header Icon */}
        <div className="w-14 h-14 mx-auto bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700/60 text-amber-500 dark:text-amber-400 rounded-full flex items-center justify-center shadow-inner">
          <Sparkles className="w-7 h-7 animate-pulse" aria-hidden="true" />
        </div>

        {/* Content */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-black text-[#22c55e] uppercase tracking-widest block">
            INDIE COMMUNITY SUPPORT
          </span>
          <h3
            id="rating-modal-title"
            className="text-xl font-black text-[#0a0a0a] dark:text-zinc-100 uppercase tracking-tight"
          >
            Enjoying Progress Club?
          </h3>
          <p className="text-xs text-[#1a1a1a]/70 dark:text-zinc-400 leading-relaxed">
            {username ? `${username}, ` : ''}we noticed you're {milestoneReason}! A quick 5-star rating on Google Play keeps our supportive space ad-free and thriving.
          </p>
        </div>

        {/* Star Rating Selector */}
        <div className="py-2 flex items-center justify-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => {
            const isFilled = star <= currentStars;
            return (
              <button
                key={star}
                type="button"
                id={`rating-star-${star}`}
                aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                onMouseEnter={() => setHoveredStars(star)}
                onMouseLeave={() => setHoveredStars(null)}
                onClick={() => setSelectedStars(star)}
                className="p-1 text-amber-400 hover:scale-125 active:scale-95 transition-transform cursor-pointer focus:outline-hidden"
              >
                <Star
                  className={`w-8 h-8 ${
                    isFilled
                      ? 'fill-amber-400 text-amber-500 drop-shadow-[0_2px_4px_rgba(251,191,36,0.5)]'
                      : 'text-stone-300 dark:text-zinc-600'
                  }`}
                  aria-hidden="true"
                />
              </button>
            );
          })}
        </div>

        {/* Context message based on star selection */}
        <div className="text-[11px] font-bold text-stone-500 dark:text-zinc-400 h-4">
          {selectedStars >= 4 ? (
            <span className="text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
              <Heart className="w-3 h-3 fill-current" aria-hidden="true" /> Rate us on Google Play Store
            </span>
          ) : (
            <span className="text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1">
              <MessageSquare className="w-3 h-3" aria-hidden="true" /> Tell us what we can improve
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            id="rate-app-submit-btn"
            aria-label={selectedStars >= 4 ? "Submit 5-star review on Google Play" : "Send direct feedback"}
            onClick={handleRateSubmit}
            className="w-full py-3 bg-[#22c55e] hover:bg-emerald-400 text-black text-xs font-black uppercase tracking-wider rounded-xl border-2 border-[#2a2a2a] dark:border-zinc-700 cursor-pointer shadow-xs flex items-center justify-center gap-2 active:translate-y-px transition-colors"
          >
            {selectedStars >= 4 ? (
              <>
                <span>Rate On Google Play</span>
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              </>
            ) : (
              <span>Send Direct Feedback</span>
            )}
          </button>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              id="rate-remind-later-btn"
              aria-label="Remind me to rate later"
              onClick={onRemindLater}
              className="py-2.5 bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 dark:hover:bg-zinc-700 text-stone-700 dark:text-zinc-300 text-[10px] font-black uppercase rounded-lg border border-stone-300 dark:border-zinc-600 cursor-pointer"
            >
              Remind Later
            </button>
            <button
              type="button"
              id="rate-never-ask-btn"
              aria-label="Don't ask to rate again"
              onClick={onNeverAskAgain}
              className="py-2.5 bg-white dark:bg-zinc-900 hover:bg-stone-50 dark:hover:bg-zinc-800 text-stone-400 dark:text-zinc-500 text-[10px] font-bold uppercase rounded-lg border border-stone-200 dark:border-zinc-700 cursor-pointer"
            >
              Don't Ask Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RatingModal;
