import React, { useState, useEffect, useRef } from 'react';
import { AppState, ChallengeLength, JournalEntry, ThemeMode, TodaysOneThing, BixLossRecord } from './types';
import { INITIAL_STATE, CHARACTERS, ROOMS, RANKS, JOURNAL_QUESTIONS, ROOM_ITEMS } from './data';
import CrewCharacter from './components/CrewCharacter';
import OfficeRoom from './components/OfficeRoom';
import Onboarding from './components/Onboarding';
import StatsView from './components/StatsView';
import ShopView from './components/ShopView';
import ExitConfirmModal from './components/ExitConfirmModal';
import LegalModal, { LegalTab } from './components/LegalModal';
import RatingModal, { PLAY_STORE_URL } from './components/RatingModal';
import WalkthroughModal from './components/WalkthroughModal';
import FeedbackModal from './components/FeedbackModal';
import BixLossModal from './components/BixLossModal';
import {
  Sun,
  Moon,
  Laptop,
  Star,
  MessageSquare,
  Shield,
  FileText,
  HelpCircle,
  ExternalLink,
  RotateCcw,
  Sparkles,
  Info,
  Check,
  LogOut,
  ChevronRight,
  Zap,
  Flame,
  AlertTriangle,
  Bell,
  BellRing,
  Volume2,
  Clock,
  Target,
  Crown,
  Play,
  CheckCircle2,
  AlertCircle,
  Pin,
  Trash2,
} from 'lucide-react';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  isAppNotOpen,
  sendSessionDoneNotification,
  playCompletionChime,
} from './utils/notifications';

// Helper: Get local Date string as YYYY-MM-DD
function getLocalDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper: Calculate streak of completed days – allows 1 missed day without breaking/ending the streak (Grace Days are Active)
export function getChallengeStreak(completedDates: string[]): number {
  if (!completedDates || completedDates.length === 0) return 0;
  
  // Sort distinct dates
  const sorted = [...new Set(completedDates)].sort();
  if (sorted.length === 0) return 0;

  let streak = 1;
  let maxStreak = 1;
  
  for (let i = 1; i < sorted.length; i++) {
    const prevStr = sorted[i - 1];
    const currStr = sorted[i];
    
    const prev = new Date(prevStr + 'T12:00:00');
    const curr = new Date(currStr + 'T12:00:00');
    const diffTime = Math.abs(curr.getTime() - prev.getTime());
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    // Normal consecutive day is diffDays === 1.
    // If they missed a day, diffDays === 2.
    // "don't end the streak even if they missed a day" means we treat diffDays <= 2 as continuing the streak seamlessly!
    if (diffDays <= 2) {
      streak += diffDays;
    } else {
      // If they missed more than 1 consecutive day, restarted from 1
      streak = 1;
    }
    
    if (streak > maxStreak) {
      maxStreak = streak;
    }
  }
  
  const todayStr = getLocalDateString();
  const lastCompletedStr = sorted[sorted.length - 1];
  
  const lastCompleted = new Date(lastCompletedStr + 'T12:00:00');
  const todayDate = new Date(todayStr + 'T12:00:00');
  const lastDiffTime = Math.abs(todayDate.getTime() - lastCompleted.getTime());
  const lastDiffDays = Math.round(lastDiffTime / (1000 * 60 * 60 * 24));
  
  if (lastDiffDays <= 2) {
    return Math.max(completedDates.length, streak, maxStreak);
  } else {
    return Math.max(completedDates.length, maxStreak);
  }
}

// Helper: Get integer day offset difference between midnight of date1 and date2
function getDayDifference(date1Str: string, date2Str: string): number {
  if (!date1Str || !date2Str) return 0;
  const d1 = new Date(date1Str + 'T00:00:00');
  const d2 = new Date(date2Str + 'T00:00:00');
  const diffTime = d2.getTime() - d1.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

export default function App() {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [activeTab, setActiveTab] = useState<'home' | 'stats' | 'office' | 'shop' | 'settings'>('home');

  // Timer Related states:
  const [timerDuration, setTimerDuration] = useState(25); // value in minutes selected from horizontally scrollable row
  const [timeLeft, setTimeLeft] = useState(25 * 60); // remaining seconds
  const [timerIsActive, setTimerIsActive] = useState(false);
  const [timerPose, setTimerPose] = useState<'idle' | 'focused' | 'typing' | 'celebrating' | 'resting' | 'exercising' | 'yoga'>('idle');
  const [focusActivity, setFocusActivity] = useState<'desk-work' | 'exercise'>('desk-work');
  const [exerciseType, setExerciseType] = useState<'dumbbells' | 'punching'>('dumbbells');

  // Overlays / Popups States:
  const [activeOverlay, setActiveOverlay] = useState<
    'none' | 'onboarding' | 'journaling' | 'day-complete' | 'rank-up' | 'challenge-complete' | 'milestone' | 'break'
  >('none');

  // New Modals & Compliance States:
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [legalTab, setLegalTab] = useState<LegalTab>('privacy');
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingMilestoneReason, setRatingMilestoneReason] = useState('building steady focus streaks');
  const [showWalkthroughModal, setShowWalkthroughModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // Tracking temporary states
  const [currentJournalQuestion, setCurrentJournalQuestion] = useState('');
  const [journalText, setJournalText] = useState('');
  const [justEarnedBix, setJustEarnedBix] = useState(0);
  const [activeMilestoneText, setActiveMilestoneText] = useState('');
  const [rankUpName, setRankUpName] = useState('');
  const [showBixNudgeBanner, setShowBixNudgeBanner] = useState(false);

  // Today's One Thing input state
  const [oneThingInput, setOneThingInput] = useState('');

  // Loss-framed Bix & Midnight countdown state
  const [secondsToMidnight, setSecondsToMidnight] = useState<number>(() => {
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
    return Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
  });

  // Daily Trigger Notification Toast state
  const [triggerNotificationToast, setTriggerNotificationToast] = useState<{ title: string; body: string } | null>(null);

  // Settings: challenge switch temporary check dialog
  const [showChallengeSwitchDialog, setShowChallengeSwitchDialog] = useState(false);
  const [pendingChallengeLength, setPendingChallengeLength] = useState<ChallengeLength>(21);
  const [homeGoalInput, setHomeGoalInput] = useState('');

  // Notification Permission State
  const [notificationPermissionState, setNotificationPermissionState] = useState<string>(() => {
    return getNotificationPermission();
  });

  // Refs:
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const targetEndTimeRef = useRef<number | null>(null);
  const timerTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTriggeredNotificationDateRef = useRef<string>('');

  // Sync state to localStorage on every update
  const saveState = (newState: AppState) => {
    setState(newState);
    localStorage.setItem('progress_club_state', JSON.stringify(newState));
  };

  // Dark Mode Theme Controller
  const currentTheme = state.settings?.theme || 'system';
  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = (t: ThemeMode) => {
      let isDark = false;
      if (t === 'dark') {
        isDark = true;
      } else if (t === 'light') {
        isDark = false;
      } else {
        isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      }

      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme(currentTheme);

    if (currentTheme === 'system' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = (e: MediaQueryListEvent) => {
        if (e.matches) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      };
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [currentTheme]);

  // Real-time Countdown to Midnight Ticker
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
      setSecondsToMidnight(Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000)));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Inactivity and Vault Decay Check helper
  const evaluateInactivityDecay = (parsedState: AppState): AppState => {
    const todayStr = getLocalDateString();
    if (!parsedState.lastActiveDate) {
      return { ...parsedState, lastActiveDate: todayStr };
    }

    if (parsedState.lastActiveDate === todayStr) {
      return parsedState;
    }

    const lastDate = new Date(parsedState.lastActiveDate + 'T12:00:00');
    const todayDate = new Date(todayStr + 'T12:00:00');
    const diffTime = todayDate.getTime() - lastDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return { ...parsedState, lastActiveDate: todayStr };
    }

    let updatedState = { ...parsedState };
    let lossRecordToDisplay: BixLossRecord | null = null;
    const updatedHistory: BixLossRecord[] = [...(parsedState.bixLossHistory || [])];

    // Check missed days
    for (let i = 1; i <= Math.min(diffDays, 7); i++) {
      const checkDate = new Date(lastDate.getTime() + i * 24 * 60 * 60 * 1000);
      const checkStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
      
      if (checkStr < todayStr && !updatedState.completedDates.includes(checkStr)) {
        // Day was missed
        if (updatedState.streakShields > 0) {
          const record: BixLossRecord = {
            date: checkStr,
            amountLost: 0,
            reason: 'Daily Session Missed (Streak Shield Deployed)',
            streakLost: false,
            shieldUsed: true,
          };
          updatedHistory.push(record);
          updatedState = {
            ...updatedState,
            streakShields: Math.max(0, updatedState.streakShields - 1),
            spentShieldDates: [...(updatedState.spentShieldDates || []), checkStr],
          };
          if (!lossRecordToDisplay) lossRecordToDisplay = record;
        } else {
          // Deduct conservative 25 Bix
          const penalty = Math.min(updatedState.bixBalance, 25);
          const record: BixLossRecord = {
            date: checkStr,
            amountLost: penalty,
            reason: 'Inactivity Vault Decay (Missed Session)',
            streakLost: true,
            shieldUsed: false,
          };
          updatedHistory.push(record);
          updatedState = {
            ...updatedState,
            bixBalance: Math.max(0, updatedState.bixBalance - penalty),
          };
          if (!lossRecordToDisplay) lossRecordToDisplay = record;
        }
      }
    }

    return {
      ...updatedState,
      lastActiveDate: todayStr,
      bixLossHistory: updatedHistory,
      pendingLossModal: lossRecordToDisplay,
    };
  };

  // Load state from localStorage on Mount
  useEffect(() => {
    const saved = localStorage.getItem('progress_club_state');
    if (saved) {
      try {
        let parsed = JSON.parse(saved) as AppState;
        // Migration safeguard: Ensure defaults exist
        if (!parsed.completedDates) parsed.completedDates = [];
        if (!parsed.ownedCharacters) parsed.ownedCharacters = ['cipher'];
        
        // Migrate from 'clubhouse' to 'rooftop'
        if (!parsed.ownedRooms || parsed.ownedRooms.length === 0 || parsed.ownedRooms.includes('clubhouse')) {
          parsed.ownedRooms = (parsed.ownedRooms || []).filter(r => r !== 'clubhouse');
          if (!parsed.ownedRooms.includes('rooftop')) {
            parsed.ownedRooms.push('rooftop');
          }
        }
        if (parsed.currentRoom === 'clubhouse' || !parsed.currentRoom) {
          parsed.currentRoom = 'rooftop';
        }

        if (!parsed.unlockedRanks) parsed.unlockedRanks = ['newcomer'];
        if (!parsed.streakShields) parsed.streakShields = 0;
        if (!parsed.ownedItems) parsed.ownedItems = [];
        if (!parsed.equippedItems) parsed.equippedItems = [];
        if (!parsed.itemPositions) parsed.itemPositions = {};
        if (!parsed.dailyGoals) parsed.dailyGoals = [];
        if (!parsed.settings) parsed.settings = INITIAL_STATE.settings;
        if (!parsed.settings.theme) parsed.settings.theme = 'system';
        if (!parsed.bixLossHistory) parsed.bixLossHistory = [];
        
        // Remove Executive Suite for anyone on the yearly membership plan
        if (parsed.subscriptionPlan === 'yearly') {
          parsed.isExecutive = false;
          if (parsed.ownedRooms && parsed.ownedRooms.includes('deepspace')) {
            parsed.ownedRooms = parsed.ownedRooms.filter(r => r !== 'deepspace');
          }
          if (parsed.currentRoom === 'deepspace') {
            parsed.currentRoom = 'rooftop';
          }
        }

        // Evaluate inactivity decay and last active date
        parsed = evaluateInactivityDecay(parsed);

        setState(parsed);
        localStorage.setItem('progress_club_state', JSON.stringify(parsed));

        // Check if onboarding completed, if not trigger overlay onboarding
        if (!parsed.onboardingCompleted) {
          setActiveOverlay('onboarding');
        } else if (!parsed.walkthroughCompleted) {
          const walkthroughDone = localStorage.getItem('progress_club_walkthrough_completed_v1');
          if (!walkthroughDone) {
            setTimeout(() => setShowWalkthroughModal(true), 500);
          }
        }
      } catch (e) {
        setActiveOverlay('onboarding');
      }
    } else {
      setActiveOverlay('onboarding');
    }
  }, []);

  // Frictionless Quick Start from URL parameter/hash trigger (e.g. ?start=true or #quickstart)
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const hash = window.location.hash;
      if (urlParams.get('start') === 'true' || urlParams.get('action') === 'quickstart' || hash === '#quickstart') {
        if (state.onboardingCompleted && !timerIsActive) {
          setTimeout(() => {
            startTimer();
          }, 400);
        }
      }
    } catch (e) {}
  }, [state.onboardingCompleted]);

  // Hardware/Browser Back Button Navigation Interception (Android & Webview Support)
  useEffect(() => {
    // Push a dummy state to trap back button events
    window.history.pushState({ page: 'progress-club-root' }, '', '');

    const handlePopState = (event: PopStateEvent) => {
      // Keep re-pushing state to remain inside the trap
      window.history.pushState({ page: 'progress-club-root' }, '', '');

      // Layer 1: Overlay screens (journaling, day-complete, rank-up, break, milestone)
      if (activeOverlay !== 'none' && activeOverlay !== 'onboarding') {
        setActiveOverlay('none');
        return;
      }

      // Layer 2: Exit confirm dialog currently open -> close it
      if (showExitConfirm) {
        setShowExitConfirm(false);
        return;
      }

      // Layer 3: Secondary popup modals
      if (showLegalModal) {
        setShowLegalModal(false);
        return;
      }
      if (showFeedbackModal) {
        setShowFeedbackModal(false);
        return;
      }
      if (showRatingModal) {
        setShowRatingModal(false);
        return;
      }
      if (showWalkthroughModal) {
        setShowWalkthroughModal(false);
        return;
      }
      if (showChallengeSwitchDialog) {
        setShowChallengeSwitchDialog(false);
        return;
      }

      // Layer 4: If on sub-tabs (stats, office, shop, settings), return to home tab
      if (activeTab !== 'home') {
        setActiveTab('home');
        return;
      }

      // Layer 5: We are on main Home dashboard with no open modals -> PROMPT EXIT CONFIRMATION!
      setShowExitConfirm(true);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [
    activeOverlay,
    showExitConfirm,
    showLegalModal,
    showFeedbackModal,
    showRatingModal,
    showWalkthroughModal,
    showChallengeSwitchDialog,
    activeTab,
  ]);

  // Graceful exit execution when user confirms in ExitConfirmModal
  const handleConfirmExit = () => {
    setShowExitConfirm(false);
    // Check if running inside Median Android wrapper
    try {
      if ((window as any).median?.navigator?.exitApp) {
        (window as any).median.navigator.exitApp();
        return;
      }
    } catch (e) {}

    try {
      window.close();
    } catch (e) {}
  };

  // Milestone Rating Prompt trigger
  const triggerMilestoneRating = (reason: string) => {
    if (state.hasRatedInStore || state.neverShowRating) return;

    if (state.lastRatingDismissedDate) {
      const last = new Date(state.lastRatingDismissedDate).getTime();
      const now = Date.now();
      const threeDays = 3 * 24 * 60 * 60 * 1000;
      if (now - last < threeDays) return;
    }

    setRatingMilestoneReason(reason);
    setShowRatingModal(true);
  };

  const handleRatingCompleted = (rating: number, openedStore: boolean) => {
    setShowRatingModal(false);
    saveState({
      ...state,
      hasRatedInStore: true,
      hasReviewed: true,
    });
  };

  const handleRatingRemindLater = () => {
    setShowRatingModal(false);
    saveState({
      ...state,
      lastRatingDismissedDate: new Date().toISOString(),
    });
  };

  const handleRatingNeverAsk = () => {
    setShowRatingModal(false);
    saveState({
      ...state,
      neverShowRating: true,
    });
  };

  const handleWalkthroughFinished = () => {
    setShowWalkthroughModal(false);
    saveState({
      ...state,
      walkthroughCompleted: true,
    });
    try {
      localStorage.setItem('progress_club_walkthrough_completed_v1', 'true');
    } catch (e) {}
  };

  // Synchronize browser tab title with active focus timer or break state
  useEffect(() => {
    if (timerIsActive) {
      document.title = `⏰ ${formatTimeStr(timeLeft)} | Progress Club`;
    } else if (activeOverlay === 'break') {
      document.title = `🔋 ${formatTimeStr(timeLeft)} | Break Duty`;
    } else {
      document.title = 'Progress Club | Supportive Focus Space';
    }
  }, [timerIsActive, timeLeft, activeOverlay]);

  // Check if they can afford something in Bix and trigger nudge
  useEffect(() => {
    if (!state.onboardingCompleted) return;
    // Check if there are unowned items that can be affordable
    const affordableCharacters = CHARACTERS.filter(
      (c) => !state.ownedCharacters.includes(c.id) && c.priceBix > 0 && state.bixBalance >= c.priceBix
    );
    const affordableRooms = ROOMS.filter(
      (r) => !state.ownedRooms.includes(r.id) && r.priceBix > 0 && state.bixBalance >= r.priceBix
    );

    if (affordableCharacters.length > 0 || affordableRooms.length > 0) {
      setShowBixNudgeBanner(true);
    } else {
      setShowBixNudgeBanner(false);
    }
  }, [state.bixBalance, state.ownedCharacters, state.ownedRooms, state.onboardingCompleted]);

  // Handle onboarding completion
  const handleOnboardingComplete = (data: {
    username: string;
    quizAnswers: any;
    subscriptionPlan: 'weekly' | 'monthly' | 'yearly';
    recommendedCharacter: string;
    recommendedRoom: string;
    dailyGoals: string[];
  }) => {
    const todayStr = getLocalDateString();
    
    const mappedGoals = (data.dailyGoals || []).map((text) => ({
      id: `goal-${Math.random().toString(36).substring(2, 11)}`,
      text,
      completedDates: [],
    }));

    const initialRooms = Array.from(new Set(['rooftop', data.recommendedRoom]));

    const updated: AppState = {
      ...INITIAL_STATE,
      username: data.username,
      onboardingCompleted: true,
      quizAnswers: data.quizAnswers,
      subscriptionPlan: data.subscriptionPlan,
      isExecutive: false,
      challengeStartDate: todayStr,
      currentActiveCharacter: data.recommendedCharacter,
      currentRoom: data.recommendedRoom,
      ownedCharacters: ['cipher', data.recommendedCharacter],
      ownedRooms: initialRooms,
      bixBalance: INITIAL_STATE.bixBalance,
      dailyGoals: mappedGoals,
    };
    saveState(updated);

    setActiveOverlay('none');
    setActiveTab('home');

    // Default timer set
    setTimerDuration(updated.settings.durationDefault);
    setTimeLeft(updated.settings.durationDefault * 60);

    // Launch interactive first-time walkthrough
    setTimeout(() => {
      setShowWalkthroughModal(true);
    }, 400);
  };

  // Timer Tick implementation with background timestamp resilience
  const startTimer = () => {
    if (timerIsActive) return;

    // Prompt for notification permission on user click gesture if still default
    if (isNotificationSupported() && Notification.permission === 'default') {
      requestNotificationPermission().then((granted) => {
        setNotificationPermissionState(granted ? 'granted' : 'denied');
        if (granted) {
          saveState({
            ...state,
            settings: { ...state.settings, notificationsEnabled: true },
          });
        }
      });
    }

    setTimerIsActive(true);
    setTimerPose(focusActivity === 'exercise' ? 'exercising' : 'typing');

    const totalSeconds = timerDuration * 60;
    const targetEnd = Date.now() + totalSeconds * 1000;
    targetEndTimeRef.current = targetEnd;

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (timerTimeoutRef.current) clearTimeout(timerTimeoutRef.current);

    // Timeout fallback for exact completion even in throttled background tabs
    timerTimeoutRef.current = setTimeout(() => {
      if (targetEndTimeRef.current && Date.now() >= targetEndTimeRef.current) {
        clearInterval(timerIntervalRef.current!);
        targetEndTimeRef.current = null;
        setTimerIsActive(false);
        setTimeLeft(0);
        handleSessionCompletion();
      }
    }, totalSeconds * 1000);

    timerIntervalRef.current = setInterval(() => {
      if (!targetEndTimeRef.current) return;
      const remainingMs = targetEndTimeRef.current - Date.now();
      const remaining = Math.max(0, Math.ceil(remainingMs / 1000));

      if (remaining <= 0) {
        if (timerTimeoutRef.current) clearTimeout(timerTimeoutRef.current);
        clearInterval(timerIntervalRef.current!);
        targetEndTimeRef.current = null;
        setTimerIsActive(false);
        setTimeLeft(0);
        handleSessionCompletion();
        return;
      }

      setTimeLeft(remaining);

      // Randomly alternate between stances for visual variety !
      if (remaining % 12 === 0) {
        if (focusActivity === 'exercise') {
          setTimerPose('exercising'); // don't let them meditate, keep them exercising
        } else {
          setTimerPose((current) => (current === 'typing' ? 'focused' : 'typing'));
        }
      }
    }, 1000);
  };

  const stopTimer = () => {
    if (!timerIsActive) return;
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (timerTimeoutRef.current) clearTimeout(timerTimeoutRef.current);
    targetEndTimeRef.current = null;
    setTimerIsActive(false);
    setTimerPose('resting');
    setTimeLeft(timerDuration * 60);
    document.title = 'Progress Club';
  };

  // Sync timer countdown when tab visibility changes or window receives focus
  useEffect(() => {
    const handleVisibilityOrFocus = () => {
      if (!timerIsActive || !targetEndTimeRef.current) return;
      const remainingMs = targetEndTimeRef.current - Date.now();
      const remaining = Math.max(0, Math.ceil(remainingMs / 1000));

      if (remaining <= 0) {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        if (timerTimeoutRef.current) clearTimeout(timerTimeoutRef.current);
        targetEndTimeRef.current = null;
        setTimerIsActive(false);
        setTimeLeft(0);
        handleSessionCompletion();
      } else {
        setTimeLeft(remaining);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, [timerIsActive, timerDuration]);

  // Update browser tab title during active focus
  useEffect(() => {
    if (timerIsActive) {
      document.title = `${formatTimeStr(timeLeft)} • Progress Club Focus`;
    } else {
      document.title = 'Progress Club';
    }
  }, [timerIsActive, timeLeft]);

  // Compute stats helper definitions
  const todayLocalDateStr = getLocalDateString();
  const currentDayXOfChallenge = state.challengeStartDate
    ? Math.max(1, getDayDifference(state.challengeStartDate, todayLocalDateStr) + 1)
    : 1;

  // Render Rank display helper
  const getCurrentRankName = (minutes: number) => {
    const hours = minutes / 60;
    const rank = RANKS.find((r) => hours >= r.minHours && hours < r.maxHours);
    return rank ? rank.name : 'Newcomer';
  };

  // Session Completion details
  const handleSessionCompletion = () => {
    const minutesFocused = timerDuration;
    // Executive tier gets 2 Bix per minute, otherwise 1 Bix
    // Monument character gives double Bix passive
    const characterMultiplier = state.currentActiveCharacter === 'monument' ? 2 : 1;
    const bixEarned = minutesFocused * (state.isExecutive ? 2 : 1) * characterMultiplier;
    setJustEarnedBix(bixEarned);

    const completedTodayBefore = state.completedDates.includes(todayLocalDateStr);
    const updatedCompletedDates = completedTodayBefore
      ? state.completedDates
      : [...state.completedDates, todayLocalDateStr];

    const currentTotalMinutes = state.totalFocusedMinutes + minutesFocused;
    const currentTotalHours = currentTotalMinutes / 60;
    const currentSessionsCount = state.totalSessionsCompleted + 1;

    // Check rank thresholds
    const newRank = RANKS.find((r) => currentTotalHours >= r.minHours && currentTotalHours < r.maxHours);
    let triggerRankUp = false;
    let rankNameEarned = '';
    const updatedRanks = [...state.unlockedRanks];

    if (newRank && !state.unlockedRanks.includes(newRank.id)) {
      triggerRankUp = true;
      rankNameEarned = newRank.name;
      updatedRanks.push(newRank.id);
    }

    // Shield status accruals: Day 7, Day 14
    let currentShields = state.streakShields;
    if (updatedCompletedDates.length === 7 && !state.unlockedRanks.includes('shield7')) {
      currentShields = Math.min(2, currentShields + 1);
      updatedRanks.push('shield7');
      alert(`you've earned a shield, ${state.username}! life happens, now you're covered.`);
    }
    if (updatedCompletedDates.length === 14 && !state.unlockedRanks.includes('shield14')) {
      currentShields = Math.min(2, currentShields + 1);
      updatedRanks.push('shield14');
      alert(`you've earned a shield, ${state.username}! life happens, now you're covered.`);
    }

    const updatedState: AppState = {
      ...state,
      totalFocusedMinutes: currentTotalMinutes,
      totalSessionsCompleted: currentSessionsCount,
      bixBalance: state.bixBalance + bixEarned,
      completedDates: updatedCompletedDates,
      streakShields: currentShields,
      unlockedRanks: updatedRanks,
    };

    saveState(updatedState);

    // If user does not have the app open/focused, trigger system desktop/mobile notification!
    // Also plays a pleasing audio chime to alert user even if window is occluded.
    sendSessionDoneNotification({
      username: state.username,
      minutes: minutesFocused,
      bixEarned: bixEarned,
      characterName: state.currentActiveCharacter,
      force: isAppNotOpen(),
    });

    document.title = '🎯 Session Complete! • Progress Club';

    // Pick a random journaling question from the pool
    const qIndex = Math.floor(Math.random() * JOURNAL_QUESTIONS.length);
    setCurrentJournalQuestion(JOURNAL_QUESTIONS[qIndex]);
    setJournalText('');

    setTimerPose('celebrating');

    // Trigger journaling step overlay
    setActiveOverlay('journaling');

    if (triggerRankUp) {
      setRankUpName(rankNameEarned);
    }

    // Milestone Rating Trigger on key achievements
    if (currentSessionsCount === 1 || currentSessionsCount === 5 || currentSessionsCount === 10) {
      setTimeout(() => {
        triggerMilestoneRating(
          currentSessionsCount === 1
            ? 'completing your very first focus session'
            : `reaching ${currentSessionsCount} completed focus sessions`
        );
      }, 1500);
    }
  };

  // Journaling Save
  const handleSaveJournal = () => {
    if (!journalText.trim()) return;

    const newEntry: JournalEntry = {
      date: todayLocalDateStr,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      question: currentJournalQuestion,
      answer: journalText.trim(),
    };

    const updatedState: AppState = {
      ...state,
      savedJournalEntries: [...state.savedJournalEntries, newEntry],
    };

    saveState(updatedState);

    // Transition Day complete or Challenge complete logic
    const completedDaysCountToday = updatedState.completedDates.length;
    if (completedDaysCountToday >= state.challengeLength) {
      setActiveOverlay('challenge-complete');
      setTimeout(() => {
        triggerMilestoneRating(`completing your full ${state.challengeLength}-day focus challenge`);
      }, 1200);
    } else {
      setActiveOverlay('day-complete');
    }
  };

  const skipJournaling = () => {
    setActiveOverlay('day-complete');
  };

  // Reward / Unlock Actions (100% In-Game Bix Currency)
  const handlePurchaseCharacterBix = (charId: string, costBix: number) => {
    if (state.bixBalance < costBix) return;
    const updated: AppState = {
      ...state,
      bixBalance: state.bixBalance - costBix,
      ownedCharacters: [...state.ownedCharacters, charId],
      currentActiveCharacter: charId, // Auto-equip
    };
    saveState(updated);
  };

  const handlePurchaseRoomBix = (roomId: string, costBix: number) => {
    if (state.bixBalance < costBix) return;
    const updated: AppState = {
      ...state,
      bixBalance: state.bixBalance - costBix,
      ownedRooms: [...state.ownedRooms, roomId],
      currentRoom: roomId, // Auto-equip
    };
    saveState(updated);
  };

  const handlePurchaseRoomItemBix = (itemId: string, costBix: number) => {
    if (state.bixBalance < costBix) return;
    const currentOwned = state.ownedItems || [];
    const currentEquipped = state.equippedItems || [];
    const updated: AppState = {
      ...state,
      bixBalance: state.bixBalance - costBix,
      ownedItems: [...currentOwned, itemId],
      equippedItems: [...currentEquipped, itemId],
    };
    saveState(updated);
  };

  const handleToggleRoomItem = (itemId: string) => {
    const currentEquipped = state.equippedItems || [];
    let nextEquipped: string[];
    if (currentEquipped.includes(itemId)) {
      nextEquipped = currentEquipped.filter(id => id !== itemId);
    } else {
      nextEquipped = [...currentEquipped, itemId];
    }
    const updated: AppState = {
      ...state,
      equippedItems: nextEquipped,
    };
    saveState(updated);
  };

  const handleUpdateItemPosition = (itemId: string, x: number, y: number) => {
    const currentPositions = state.itemPositions || {};
    const updated: AppState = {
      ...state,
      itemPositions: {
        ...currentPositions,
        [itemId]: { x, y }
      }
    };
    saveState(updated);
  };

  const handleToggleDailyGoal = (goalId: string) => {
    const todayStr = getLocalDateString();
    const updatedGoals = (state.dailyGoals || []).map((g) => {
      if (g.id === goalId) {
        const isCompletedToday = g.completedDates.includes(todayStr);
        return {
          ...g,
          completedDates: isCompletedToday
            ? g.completedDates.filter((d) => d !== todayStr)
            : [...g.completedDates, todayStr],
        };
      }
      return g;
    });

    const updated: AppState = {
      ...state,
      dailyGoals: updatedGoals,
    };
    saveState(updated);
  };

  const handleAddHomeDailyGoal = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const newGoal = {
      id: `goal-${Math.random().toString(36).substring(2, 11)}`,
      text: trimmed,
      completedDates: [],
    };
    const updated: AppState = {
      ...state,
      dailyGoals: [...(state.dailyGoals || []), newGoal],
    };
    saveState(updated);
  };

  const handleRemoveHomeDailyGoal = (goalId: string) => {
    const updated: AppState = {
      ...state,
      dailyGoals: (state.dailyGoals || []).filter((g) => g.id !== goalId),
    };
    saveState(updated);
  };

  const handleBuyBundleCharacters = () => {
    if (state.bixBalance < 7200) return;
    const charIds = CHARACTERS.map(c => c.id);
    const updated: AppState = {
      ...state,
      bixBalance: state.bixBalance - 7200,
      ownedCharacters: Array.from(new Set([...state.ownedCharacters, ...charIds])),
    };
    saveState(updated);
  };

  const handleBuyBundleRooms = () => {
    if (state.bixBalance < 4800) return;
    const roomIds = ROOMS.map(r => r.id);
    const updated: AppState = {
      ...state,
      bixBalance: state.bixBalance - 4800,
      ownedRooms: Array.from(new Set([...state.ownedRooms, ...roomIds])),
    };
    saveState(updated);
  };

  // Convert timer remaining seconds to MM:SS string
  const formatTimeStr = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Format countdown to midnight
  const formatMidnightCountdown = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
  };

  // Today's One Thing Handlers
  const handleSetOneThing = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const newOneThing: TodaysOneThing = {
      text: trimmed,
      date: todayLocalDateStr,
      completed: false,
    };
    saveState({
      ...state,
      todaysOneThing: newOneThing,
    });
    setOneThingInput('');
  };

  const handleToggleOneThing = () => {
    if (!state.todaysOneThing) return;
    const nextCompleted = !state.todaysOneThing.completed;
    const updatedOneThing: TodaysOneThing = {
      ...state.todaysOneThing,
      completed: nextCompleted,
      completedAt: nextCompleted ? new Date().toISOString() : undefined,
    };
    saveState({
      ...state,
      todaysOneThing: updatedOneThing,
    });
  };

  const handleClearOneThing = () => {
    saveState({
      ...state,
      todaysOneThing: undefined,
    });
  };

  const handleStartOneThingFocus = () => {
    if (timerIsActive) return;
    setTimerDuration(state.settings?.durationDefault || 25);
    setTimeLeft((state.settings?.durationDefault || 25) * 60);
    startTimer();
  };

  // Notification Helper & Dispatcher
  const getDailyNotificationContent = () => {
    const streak = getChallengeStreak(state.completedDates);
    const isCompleted = state.completedDates.includes(todayLocalDateStr);
    const hour = new Date().getHours();
    
    if (isCompleted) {
      return {
        title: "Progress Club • Goal Secured",
        body: `You've locked in day ${streak} of your focus streak! Vault secured.`
      };
    }
    if (hour >= 20) {
      return {
        title: "⚠️ Progress Club • 25 Bix at Risk",
        body: `Session incomplete — 25 Bix at risk before midnight! Defend your ${streak}-day streak now.`
      };
    }
    if (streak > 0) {
      return {
        title: "Progress Club • Streak Alert",
        body: `Your ${streak}-day streak needs today's session. Most won't. You will.`
      };
    }
    return {
      title: "Progress Club • Daily Trigger",
      body: "Start Day 1 of your focus streak today. Most won't. You will."
    };
  };

  const sendSystemOrInAppNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/icon.svg',
        });
      } catch (e) {}
    }
    setTriggerNotificationToast({ title, body });
    setTimeout(() => {
      setTriggerNotificationToast(null);
    }, 6000);
  };

  const handleRequestNotificationPermission = async () => {
    if (isNotificationSupported()) {
      try {
        const perm = await Notification.requestPermission();
        setNotificationPermissionState(perm);
        if (perm === 'granted') {
          saveState({
            ...state,
            settings: { ...state.settings, notificationsEnabled: true },
          });
          sendSystemOrInAppNotification('Notifications Enabled', 'Session completion and daily focus alerts are now active.');
        } else {
          saveState({
            ...state,
            settings: { ...state.settings, notificationsEnabled: false },
          });
        }
      } catch (e) {}
    } else {
      sendSystemOrInAppNotification('Notice', 'Browser notifications not supported in this environment, using in-app triggers.');
    }
  };

  // Test trigger for session completion notification
  const handleTestSessionCompleteAlert = async () => {
    if (isNotificationSupported() && Notification.permission === 'default') {
      const granted = await requestNotificationPermission();
      setNotificationPermissionState(granted ? 'granted' : 'denied');
      if (granted) {
        saveState({
          ...state,
          settings: { ...state.settings, notificationsEnabled: true },
        });
      }
    }

    await sendSessionDoneNotification({
      username: state.username,
      minutes: timerDuration || state.settings?.durationDefault || 25,
      bixEarned: (timerDuration || state.settings?.durationDefault || 25) * (state.isExecutive ? 2 : 1),
      characterName: state.currentActiveCharacter,
      force: true,
    });

    setTriggerNotificationToast({
      title: 'Progress Club • Session Done! 🎯',
      body: `Test Alert: Great focus, ${state.username}! Your session is complete (+25 Bix). Sound chime & system alert sent!`,
    });
    setTimeout(() => {
      setTriggerNotificationToast(null);
    }, 6000);
  };

  // Fixed Daily Trigger Notification Check
  useEffect(() => {
    const checkSchedule = () => {
      const now = new Date();
      const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const targetHHMM = state.settings?.dailyReminderTime || '14:00';
      const todayStr = getLocalDateString();
      
      if (
        currentHHMM === targetHHMM &&
        lastTriggeredNotificationDateRef.current !== todayStr &&
        !state.completedDates.includes(todayStr)
      ) {
        lastTriggeredNotificationDateRef.current = todayStr;
        const content = getDailyNotificationContent();
        sendSystemOrInAppNotification(content.title, content.body);
      }
    };

    const timer = setInterval(checkSchedule, 25000);
    return () => clearInterval(timer);
  }, [state.settings?.dailyReminderTime, state.completedDates]);

  // Horizontal scrollable durations row options
  const durationOptions = [2, 5, 10, 25, 50, 90, 120];

  const handleDurationSelect = (mins: number) => {
    if (timerIsActive) return;
    setTimerDuration(mins);
    setTimeLeft(mins * 60);
  };

  // Milestone manual triggered share modal generator
  const triggerShareMilestone = (title: string) => {
    setActiveMilestoneText(title);
    setActiveOverlay('milestone');
  };

  // Quick simulated home widget details
  const isCompletedTodayValue = state.completedDates.includes(todayLocalDateStr);
  const currentHour = new Date().getHours();
  const isBixAtRisk = !isCompletedTodayValue && currentHour >= 20;

  return (
    <div className={`min-h-screen bg-[#fafafa] dark:bg-[#121214] text-[#0a0a0a] dark:text-zinc-100 flex flex-col items-center justify-start pb-20 ${timerIsActive ? 'border-[3px] border-[#22c55e]' : ''}`} id="applet-viewport">
      
      {/* FLOATING TRIGGER NOTIFICATION TOAST */}
      {triggerNotificationToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md bg-stone-900 text-white dark:bg-zinc-100 dark:text-zinc-900 p-4 rounded-2xl border-2 border-[#22c55e] shadow-2xl flex items-start space-x-3 transition-all animate-bounce">
          <div className="w-8 h-8 rounded-full bg-[#22c55e] text-black flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">
            ⚡
          </div>
          <div className="flex-1 min-w-0 text-left">
            <h4 className="text-xs font-black uppercase tracking-wider">{triggerNotificationToast.title}</h4>
            <p className="text-xs text-stone-300 dark:text-zinc-700 leading-snug mt-0.5 font-medium">{triggerNotificationToast.body}</p>
          </div>
          <button
            onClick={() => setTriggerNotificationToast(null)}
            className="text-stone-400 hover:text-white dark:text-zinc-500 dark:hover:text-black text-xs font-bold p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* BIX LOSS REPORT MODAL */}
      {state.pendingLossModal && (
        <BixLossModal
          lossRecord={state.pendingLossModal}
          currentBixBalance={state.bixBalance}
          streakCount={getChallengeStreak(state.completedDates)}
          streakShieldsRemaining={state.streakShieldsRemaining ?? 0}
          onDismiss={() => {
            saveState({
              ...state,
              pendingLossModal: null,
            });
          }}
          onStartRecoverySession={() => {
            saveState({
              ...state,
              pendingLossModal: null,
            });
            startTimer();
          }}
        />
      )}

      {/* HEADER BAR SIMULATION */}
      <header className="sticky top-0 z-30 w-full max-w-md bg-white dark:bg-zinc-900 border-b-2 border-[#2a2a2a] dark:border-zinc-700 px-4 py-3 flex justify-between items-center select-none" id="progress-club-navbar">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-widest font-mono font-bold text-[#1a1a1a]/60 dark:text-zinc-400">PROGRESS CLUB SYSTEM</span>
          {timerIsActive ? (
            <span className="text-[#22c55e] text-xs font-bold animate-ping uppercase tracking-widest">• focusing...</span>
          ) : (
            <span className="text-xs font-bold text-stone-400 dark:text-zinc-500 capitalize">ready in pocket | {state.username}</span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {state.streakShields > 0 ? (
            <span
              className="text-xs bg-black dark:bg-zinc-800 text-[#22c55e] border border-[#2a2a2a] dark:border-zinc-700 px-2 py-0.5 rounded-full flex items-center space-x-1"
              title="Your streak shield is active!"
            >
              <span>🛡️</span>
              <span className="text-[10px] text-white font-black">{state.streakShields}</span>
            </span>
          ) : null}
          <div className="text-xs font-black text-[#22c55e] uppercase bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-300 dark:border-emerald-700">
            {state.bixBalance} Bix
          </div>
        </div>
      </header>

      {/* LOSS-FRAMED URGENT WARNING BANNER (Active after 8PM when session is incomplete) */}
      {isBixAtRisk && !timerIsActive && (
        <div
          id="bix-at-risk-banner"
          className="w-full max-w-md bg-amber-500 dark:bg-amber-600 text-black p-3 text-xs font-black border-b-2 border-[#2a2a2a] dark:border-zinc-700 flex items-center justify-between shadow-md"
        >
          <div className="flex items-center space-x-2 text-left min-w-0">
            <span className="text-base animate-pulse">⚠️</span>
            <div>
              <p className="uppercase tracking-wider font-extrabold text-[11px] leading-tight">Session Incomplete — 25 Bix at Risk</p>
              <p className="text-[10px] opacity-90 font-mono">Midnight Countdown: {formatMidnightCountdown(secondsToMidnight)}</p>
            </div>
          </div>
          <button
            id="defend-bix-quick-btn"
            onClick={startTimer}
            className="px-3 py-1.5 bg-black text-[#22c55e] hover:bg-stone-800 rounded-lg text-[10px] font-black uppercase tracking-wider shrink-0 shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            ⚡ Focus Now
          </button>
        </div>
      )}

      {/* OVERFLOW WARNING / INFO NOTIFICATION BANNER */}
      {showBixNudgeBanner && !timerIsActive && !isBixAtRisk && (
        <div
          id="bix-nudge-banner"
          onClick={() => {
            setActiveTab('shop');
            setShowBixNudgeBanner(false);
          }}
          className="w-full max-w-md bg-[#22c55e] text-[#0a0a0a] text-center p-2.5 text-xs font-black uppercase tracking-widest cursor-pointer hover:opacity-90 transition-opacity select-none border-b-2 border-[#2a2a2a] dark:border-zinc-700"
        >
          you've got enough Bix for something new, {state.username}! 🌟
        </div>
      )}

      {/* RENDER ACTIVE TAB VIEWPORT */}
      <main className="w-full max-w-md px-4 pt-4 flex-grow" id="tab-viewport">
        {activeTab === 'home' && (
          <div className="space-y-6">
            
            {/* Header profile statistics title */}
            <div className="text-left select-none">
              <h1 className="text-lg font-black tracking-tight text-[#0a0a0a] dark:text-zinc-100">
                {state.username}'S PROGRESS CLUB | DAY {currentDayXOfChallenge} OF {state.challengeLength}
              </h1>
              <div className="flex items-center space-x-1.5 flex-wrap mt-0.5">
                <span className="text-xs font-bold text-[#22c55e] uppercase">
                  {getCurrentRankName(state.totalFocusedMinutes)} MEMBER
                </span>
                <span className="text-stone-300 dark:text-zinc-600 text-xs">•</span>
                <span className="text-xs font-semibold text-[#1a1a1a]/65 dark:text-zinc-400 uppercase">
                  {state.completedDates.length} completed
                </span>
                <span className="text-stone-300 dark:text-zinc-600 text-xs">•</span>
                <span className="text-xs font-bold text-amber-500 uppercase flex items-center space-x-0.5">
                  <span>🔥</span>
                  <span>{getChallengeStreak(state.completedDates)} DAY STREAK</span>
                </span>
              </div>
            </div>

            {/* 1-TAP FRICTIONLESS QUICK START BAR */}
            {!timerIsActive && (
              <div className="bg-stone-900 dark:bg-zinc-800 text-white p-3 rounded-2xl border-2 border-[#2a2a2a] dark:border-zinc-700 flex items-center justify-between shadow-xs">
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#22c55e] text-black flex items-center justify-center font-black text-xs">
                    ⚡
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-black uppercase tracking-wider">1-Tap Focus Launch</p>
                    <p className="text-[10px] text-stone-400 dark:text-zinc-400 font-medium">Default {state.settings?.durationDefault || 25}m session ready</p>
                  </div>
                </div>
                <button
                  id="frictionless-quickstart-btn"
                  onClick={startTimer}
                  className="bg-[#22c55e] text-black hover:bg-emerald-400 font-black text-xs uppercase tracking-wider px-3.5 py-2 rounded-xl shadow-[0_2px_0_#0a0a0a] active:translate-y-0.5 transition-all cursor-pointer"
                >
                  ▶ Start
                </button>
              </div>
            )}

            {/* Office room render display with Today's One Thing prop */}
            <OfficeRoom
              roomId={state.currentRoom}
              characterId={state.currentActiveCharacter}
              pose={timerPose}
              isActive={timerIsActive}
              completedDaysCount={state.completedDates.length}
              completedDates={state.completedDates}
              challengeStartDate={state.challengeStartDate}
              focusActivity={focusActivity}
              exerciseType={exerciseType}
              equippedItems={state.equippedItems}
              itemPositions={state.itemPositions}
              onUpdateItemPosition={handleUpdateItemPosition}
              todaysOneThing={state.todaysOneThing?.date === todayLocalDateStr ? state.todaysOneThing : undefined}
            />

            {/* TODAY'S ONE THING PRIORITY CARD */}
            <div className={`p-4 rounded-2xl transition-all text-left space-y-3 ${
              state.todaysOneThing?.date === todayLocalDateStr
                ? 'bg-white dark:bg-zinc-900 border-2 border-[#22c55e] shadow-[0_0_20px_rgba(34,197,94,0.18)] dark:shadow-[0_0_24px_rgba(34,197,94,0.14)]'
                : 'bg-white dark:bg-zinc-900 border-2 border-[#2a2a2a] dark:border-zinc-700 shadow-xs'
            }`}>
              <div className="flex items-center justify-between border-b border-[#2a2a2a]/10 dark:border-zinc-800 pb-2">
                <div className="flex items-center space-x-1.5">
                  <span className="text-sm">👑</span>
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#0a0a0a] dark:text-zinc-100 flex items-center gap-1.5">
                    TODAY'S ONE THING
                    <span className="text-[9px] font-extrabold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 px-1.5 py-0.5 rounded border border-amber-300 dark:border-amber-700 uppercase">
                      PRIORITY
                    </span>
                  </h3>
                </div>
                {state.todaysOneThing?.date === todayLocalDateStr && (
                  <button
                    onClick={handleClearOneThing}
                    className="text-[10px] font-bold text-stone-400 hover:text-red-500 uppercase tracking-wider"
                    title="Clear priority task"
                  >
                    Reset
                  </button>
                )}
              </div>

              {state.todaysOneThing?.date === todayLocalDateStr ? (
                <div className="space-y-3">
                  <div
                    onClick={handleToggleOneThing}
                    className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                      state.todaysOneThing.completed
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-950 dark:text-emerald-200'
                        : 'bg-stone-50 dark:bg-zinc-800/80 border-[#2a2a2a] dark:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center font-black text-xs ${
                        state.todaysOneThing.completed
                          ? 'bg-[#22c55e] border-emerald-600 text-white'
                          : 'border-[#2a2a2a] dark:border-zinc-600 bg-white dark:bg-zinc-900'
                      }`}>
                        {state.todaysOneThing.completed ? '✓' : ''}
                      </div>
                      <p className={`text-sm font-black leading-snug truncate ${
                        state.todaysOneThing.completed ? 'line-through text-emerald-800 dark:text-emerald-300' : 'text-stone-900 dark:text-zinc-100'
                      }`}>
                        {state.todaysOneThing.text}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider shrink-0 pl-2">
                      {state.todaysOneThing.completed ? 'COMPLETED' : 'IN PROGRESS'}
                    </span>
                  </div>

                  {!timerIsActive && !state.todaysOneThing.completed && (
                    <button
                      onClick={handleStartOneThingFocus}
                      className="w-full py-2.5 bg-[#22c55e] text-black font-black text-xs uppercase tracking-widest rounded-xl border-2 border-[#2a2a2a] dark:border-zinc-700 hover:bg-emerald-400 shadow-xs cursor-pointer flex items-center justify-center space-x-1.5"
                    >
                      <span>▶</span>
                      <span>Focus on This Priority Now</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-stone-600 dark:text-zinc-400 font-medium">
                    What is the single most important task that moves the needle for you today?
                  </p>

                  {/* Suggestion pills */}
                  <div className="flex flex-wrap gap-1.5">
                    {['Deep Work Project', 'Book Reading 20m', 'Workout Routine'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handleSetOneThing(preset)}
                        className="text-[10px] font-bold bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 dark:hover:bg-zinc-700 text-stone-800 dark:text-zinc-200 px-2.5 py-1 rounded-lg border border-stone-300 dark:border-zinc-700 cursor-pointer"
                      >
                        + {preset}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      id="one-thing-input"
                      value={oneThingInput}
                      onChange={(e) => setOneThingInput(e.target.value)}
                      placeholder="e.g. Finish quarterly proposal outline"
                      maxLength={65}
                      className="flex-1 p-2 text-xs border-2 border-[#2a2a2a] dark:border-zinc-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#22c55e] bg-stone-50 dark:bg-zinc-900 text-[#0a0a0a] dark:text-zinc-100"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && oneThingInput.trim()) {
                          handleSetOneThing(oneThingInput);
                        }
                      }}
                    />
                    <button
                      type="button"
                      id="set-one-thing-btn"
                      onClick={() => handleSetOneThing(oneThingInput)}
                      className="bg-[#22c55e] border-2 border-[#2a2a2a] dark:border-zinc-700 text-black px-4 py-2 text-xs font-black rounded-xl hover:bg-emerald-400 cursor-pointer shadow-xs uppercase tracking-wider"
                    >
                      Set
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* TIMER CORE MODULE CONTAINER */}
            <div className="bg-white dark:bg-zinc-900 border-2 border-[#2a2a2a] dark:border-zinc-700 rounded-2xl p-5 text-center shadow-xs space-y-4">
              
              {/* LARGE COUNTDOWN NUMERALS WITH VISIBLE URGENCY COLOR PROGRESSION */}
              <div className="py-2">
                <span className={`text-6xl font-black tracking-tighter select-all font-mono transition-colors duration-300 ${
                  !timerIsActive
                    ? 'text-[#0a0a0a] dark:text-zinc-100'
                    : timeLeft <= 60
                    ? 'text-rose-500 dark:text-rose-400 animate-pulse'
                    : timeLeft <= (timerDuration * 60) * 0.5
                    ? 'text-amber-500 dark:text-amber-400'
                    : 'text-[#22c55e]'
                }`}>
                  {formatTimeStr(timeLeft)}
                </span>

                {/* Visible Urgency state tag */}
                {timerIsActive && (
                  <div className="mt-2 flex items-center justify-center space-x-1.5">
                    {timeLeft <= 60 ? (
                      <span className="text-[10px] font-black uppercase text-rose-500 dark:text-rose-400 tracking-widest flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                        FINAL 60 SECONDS — SPRINT TO FINISH
                      </span>
                    ) : timeLeft <= (timerDuration * 60) * 0.5 ? (
                      <span className="text-[10px] font-black uppercase text-amber-500 dark:text-amber-400 tracking-widest flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        UNDER 50% REMAINING — HOLD MOMENTUM
                      </span>
                    ) : (
                      <span className="text-[10px] font-black uppercase text-[#22c55e] tracking-widest flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-[#22c55e]"></span>
                        IN THE ZONE — ACTIVE FOCUS
                      </span>
                    )}
                  </div>
                )}

                {/* Background Notification status indicator */}
                <div className="mt-2 flex items-center justify-center">
                  {notificationPermissionState === 'granted' ? (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <BellRing className="w-3 h-3 text-[#22c55e]" />
                      <span>Alert ready if you switch tabs</span>
                    </span>
                  ) : notificationPermissionState === 'denied' ? (
                    <span className="text-[10px] text-stone-400 dark:text-zinc-500 flex items-center gap-1">
                      <Bell className="w-3 h-3 opacity-60" />
                      <span>Browser alerts blocked in settings</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleRequestNotificationPermission}
                      className="text-[10px] font-bold text-stone-600 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 underline cursor-pointer"
                    >
                      <Bell className="w-3 h-3 text-[#22c55e]" />
                      <span>Notify me when done if app isn't open</span>
                    </button>
                  )}
                </div>
              </div>

              {/* HORIZONTAL DURATIONS PILLS BAR */}
              {!timerIsActive && (
                <div className="space-y-2 select-none">
                  <p className="text-[10px] font-bold text-[#1a1a1a]/65 dark:text-zinc-400 uppercase tracking-widest text-left">focus goal duration</p>
                  <div className="flex space-x-2 overflow-x-auto pb-1.5 scrollbar-thin">
                    {durationOptions.map((min) => {
                      const isSel = timerDuration === min;
                      return (
                        <button
                          key={min}
                          id={`pills-duration-${min}`}
                          aria-label={`Select ${min} minutes focus duration`}
                          onClick={() => handleDurationSelect(min)}
                          className={`px-4 py-2 rounded-full text-xs font-black border-2 transition-all cursor-pointer ${
                            isSel
                              ? 'bg-[#22c55e] border-[#2a2a2a] dark:border-zinc-700 text-[#0a0a0a] shadow-xs'
                              : 'bg-white dark:bg-zinc-800 border-[#2a2a2a] dark:border-zinc-700 text-[#1a1a1a]/75 dark:text-zinc-300 hover:bg-stone-50 dark:hover:bg-zinc-700'
                          }`}
                        >
                          {min}m
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* FOCUS MODE AND ACTIVE DUTY SELECTION */}
              <div className="space-y-2 select-none text-left">
                <p className="text-[10px] font-bold text-[#1a1a1a]/65 dark:text-zinc-400 uppercase tracking-widest">
                  Crew Focus Activity
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    id="focus-activity-desk-btn"
                    aria-label="Set activity to Desk Work"
                    onClick={() => {
                      setFocusActivity('desk-work');
                      if (timerIsActive) {
                        setTimerPose('typing');
                      }
                    }}
                    className={`flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl text-xs font-black border-2 transition-all cursor-pointer ${
                      focusActivity === 'desk-work'
                        ? 'bg-[#22c55e]/20 border-[#22c55e] text-[#0a0a0a] dark:text-zinc-100 shadow-xs'
                        : 'bg-white dark:bg-zinc-800 border-stone-200 dark:border-zinc-700 text-[#1a1a1a]/70 dark:text-zinc-400 hover:border-[#2a2a2a]'
                    }`}
                  >
                    <span>💻</span>
                    <span>Desk Work</span>
                  </button>
                  <button
                    id="focus-activity-exercise-btn"
                    aria-label="Set activity to Exercise"
                    onClick={() => {
                      setFocusActivity('exercise');
                      if (timerIsActive) {
                        setTimerPose('exercising');
                      }
                    }}
                    className={`flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl text-xs font-black border-2 transition-all cursor-pointer ${
                      focusActivity === 'exercise'
                        ? 'bg-[#22c55e]/20 border-[#22c55e] text-[#0a0a0a] dark:text-zinc-100 shadow-xs'
                        : 'bg-white dark:bg-zinc-800 border-stone-200 dark:border-zinc-700 text-[#1a1a1a]/70 dark:text-zinc-400 hover:border-[#2a2a2a]'
                    }`}
                  >
                    <span>🏋️</span>
                    <span>Exercise</span>
                  </button>
                </div>
              </div>

              {focusActivity === 'exercise' && (
                <div id="workout-routine-select" className="space-y-1.5 select-none text-left p-3 bg-stone-50 dark:bg-zinc-800/80 border-2 border-stone-200 dark:border-zinc-700 rounded-xl">
                  <p className="text-[10px] font-bold text-[#1a1a1a]/60 dark:text-zinc-400 uppercase tracking-widest">
                    Workout Routine Style
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      id="exercise-type-dumbbells-btn"
                      aria-label="Select dumbbells workout"
                      onClick={() => setExerciseType('dumbbells')}
                      className={`flex items-center justify-center space-x-1 py-2 px-2 rounded-lg text-xs font-black border-2 transition-all cursor-pointer ${
                        exerciseType === 'dumbbells'
                          ? 'bg-[#22c55e] text-black border-[#2a2a2a] dark:border-zinc-700 shadow-xs'
                          : 'bg-white dark:bg-zinc-800 border-stone-200 dark:border-zinc-700 text-stone-700 dark:text-zinc-300'
                      }`}
                    >
                      <span>🏋️</span>
                      <span>Dumbbells</span>
                    </button>
                    <button
                      id="exercise-type-punching-btn"
                      aria-label="Select punching bag workout"
                      onClick={() => setExerciseType('punching')}
                      className={`flex items-center justify-center space-x-1 py-2 px-2 rounded-lg text-xs font-black border-2 transition-all cursor-pointer ${
                        exerciseType === 'punching'
                          ? 'bg-[#22c55e] text-black border-[#2a2a2a] dark:border-zinc-700 shadow-xs'
                          : 'bg-white dark:bg-zinc-800 border-stone-200 dark:border-zinc-700 text-stone-700 dark:text-zinc-300'
                      }`}
                    >
                      <span>🥊</span>
                      <span>Punching Bag</span>
                    </button>
                  </div>
                </div>
              )}

              {/* PRIMARY ACTION ACTIONS */}
              <div className="pt-2 select-none">
                {timerIsActive ? (
                  <button
                    id="abort-timer-btn"
                    aria-label="Abort active focus session"
                    onClick={stopTimer}
                    className="w-full py-4 bg-white dark:bg-zinc-800 text-black dark:text-zinc-100 text-sm font-black uppercase tracking-widest rounded-xl border-2 border-[#2a2a2a] dark:border-zinc-700 active:scale-95 transition-all cursor-pointer"
                  >
                    Abort Session
                  </button>
                ) : (
                  <button
                    id="start-timer-btn"
                    aria-label="Start focus session timer"
                    onClick={startTimer}
                    className="w-full py-4 bg-[#22c55e] text-[#0a0a0a] text-sm font-black uppercase tracking-widest rounded-xl border-2 border-[#2a2a2a] dark:border-zinc-700 shadow-[0_4px_0_#0a0a0a] active:translate-y-1 active:shadow-none transition-all cursor-pointer"
                  >
                    Let's Focus!
                  </button>
                )}
              </div>

              {/* BIX TODAY EARNINGS BADGE */}
              <div className="text-xs font-bold text-[#22c55e] tracking-tight text-center">
                Bix earned this session: {timerDuration * (state.isExecutive ? 2 : 1) * (state.currentActiveCharacter === 'monument' ? 2 : 1)} Bix {state.currentActiveCharacter === 'monument' && " (2x Monument Passive!)"}
              </div>
            </div>

            {/* DAILY GOAL TRACKER CARD */}
            <div className="bg-white dark:bg-zinc-900 border-2 border-[#2a2a2a] dark:border-zinc-700 rounded-2xl p-4 shadow-xs select-none space-y-3 text-left">
              <div className="flex items-center justify-between border-b border-[#2a2a2a]/10 dark:border-zinc-800 pb-2">
                <div className="flex items-center space-x-1.5">
                  <span className="text-sm">🎯</span>
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#0a0a0a] dark:text-zinc-100">
                    DAILY GOAL TRACKER
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-stone-500 dark:text-zinc-400 uppercase">
                  {(state.dailyGoals || []).filter(g => g.completedDates.includes(getLocalDateString())).length} OF {(state.dailyGoals || []).length} DONE
                </span>
              </div>

              {/* Checklist items list */}
              {(state.dailyGoals && state.dailyGoals.length > 0) ? (
                <div className="space-y-2">
                  {state.dailyGoals.map((g) => {
                    const isDoneToday = g.completedDates.includes(getLocalDateString());
                    return (
                      <div
                        key={g.id}
                        id={`home-goal-${g.id}`}
                        onClick={() => handleToggleDailyGoal(g.id)}
                        className={`flex items-center justify-between p-3 rounded-xl border-2 border-[#2a2a2a] dark:border-zinc-700 transition-all cursor-pointer ${
                          isDoneToday
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-950 dark:text-emerald-200 shadow-inner'
                            : 'bg-white dark:bg-zinc-800 hover:bg-stone-50 dark:hover:bg-zinc-700 text-stone-900 dark:text-zinc-100'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 flex-1 min-w-0">
                          {/* Checkbox */}
                          <div className={`w-5 h-5 rounded-md border-2 border-[#2a2a2a] dark:border-zinc-700 flex items-center justify-center font-bold text-xs select-none ${
                            isDoneToday ? 'bg-[#22c55e] text-white border-emerald-600' : 'bg-stone-100 dark:bg-zinc-700'
                          }`}>
                            {isDoneToday && "✓"}
                          </div>
                          
                          {/* Text */}
                          <span className={`text-xs font-bold leading-tight truncate ${
                            isDoneToday ? 'line-through text-emerald-800 dark:text-emerald-300 font-medium' : 'text-stone-950 dark:text-zinc-100 font-bold'
                          }`}>
                            {g.text}
                          </span>
                        </div>

                        {/* Interactive Delete Button and stats */}
                        <div className="flex items-center space-x-2 shrink-0">
                          <span className="text-[9px] font-black uppercase bg-stone-100 dark:bg-zinc-700 text-stone-600 dark:text-zinc-300 border border-stone-200 dark:border-zinc-600 px-1.5 py-0.5 rounded">
                            ⭐ {g.completedDates.length} Days
                          </span>
                          <button
                            type="button"
                            aria-label={`Remove goal ${g.text}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveHomeDailyGoal(g.id);
                            }}
                            className="text-red-400 hover:text-red-600 dark:hover:text-red-300 text-xs font-bold p-1 hover:bg-red-50 dark:hover:bg-red-950 rounded"
                            title="Remove this goal"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 bg-stone-50 dark:bg-zinc-800 border border-dashed border-stone-300 dark:border-zinc-700 rounded-xl text-center">
                  <p className="text-xs text-stone-500 dark:text-zinc-400 font-medium italic">
                    No active daily goals tracked. Create up to 3 daily driver habits to commit to!
                  </p>
                </div>
              )}

              {/* Add Custom Goal Directly inline on the Home tab if less than 3 are present */}
              {(state.dailyGoals || []).length < 3 ? (
                <div className="pt-2 bg-stone-50 dark:bg-zinc-800/60 p-3 rounded-xl border border-stone-200 dark:border-zinc-700 space-y-2">
                  <span className="text-[9px] font-black text-stone-400 dark:text-zinc-400 uppercase tracking-wider block">Add a New Daily Goal (Max 3):</span>
                  
                  {/* Tip banner */}
                  <div className="text-[9px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 p-2 rounded-lg leading-normal">
                    💡 <strong>Pro-Tip:</strong> Set a <strong>clear, actionable, and timed</strong> goal (e.g. <em>"Read 15 pages of book"</em> or <em>"Do 20 mins of yoga"</em>) rather than something vague!
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      id="home-custom-goal-input"
                      aria-label="Add new daily goal habit"
                      value={homeGoalInput}
                      onChange={(e) => setHomeGoalInput(e.target.value)}
                      placeholder="e.g. Study React for 30m"
                      className="flex-1 p-2 text-xs border-2 border-stone-300 dark:border-zinc-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#22c55e] bg-white dark:bg-zinc-900 text-[#0a0a0a] dark:text-zinc-100"
                      maxLength={60}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (homeGoalInput.trim()) {
                            handleAddHomeDailyGoal(homeGoalInput);
                            setHomeGoalInput('');
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      id="home-custom-goal-add-btn"
                      aria-label="Add custom daily goal"
                      onClick={() => {
                        if (homeGoalInput.trim()) {
                          handleAddHomeDailyGoal(homeGoalInput);
                          setHomeGoalInput('');
                        }
                      }}
                      className="bg-[#22c55e] border-2 border-[#2a2a2a] dark:border-zinc-700 text-black px-4 py-2 text-xs font-black rounded-xl hover:bg-emerald-400 cursor-pointer shadow-xs"
                    >
                      Add
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-2.5 rounded-xl text-center">
                  ✨ Perfect! You're tracking 3 active habits. Tap a habit to toggle it daily!
                </div>
              )}
            </div>

            {/* INTERACTIVE SMART HOME SCREEN WIDGET PREVIEW */}
            <div className="bg-white dark:bg-zinc-900 border-2 border-[#2a2a2a] dark:border-zinc-700 rounded-2xl p-4 shadow-xs select-none space-y-3">
              <div className="flex items-center justify-between border-b border-[#2a2a2a]/10 dark:border-zinc-800 pb-2">
                <span className="text-[10px] font-black text-[#22c55e] tracking-wider uppercase">
                  SMART HOME SCREEN WIDGET PREVIEWS
                </span>
                <span className="text-[9px] font-bold text-stone-400 dark:text-zinc-500 uppercase">
                  ANDROID & WEB APP
                </span>
              </div>

              {/* 2x2 and 4x1 Preview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* 2x2 Compact Widget */}
                <div className="border-2 border-[#2a2a2a] dark:border-zinc-700 p-3.5 rounded-xl bg-stone-50 dark:bg-zinc-800/90 text-left space-y-2 relative overflow-hidden">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-[#0a0a0a] dark:text-zinc-100 uppercase tracking-wider">
                      Day {currentDayXOfChallenge}
                    </span>
                    <span
                      className={`w-3 h-3 rounded-full border border-black dark:border-zinc-500 ${
                        isCompletedTodayValue ? 'bg-[#22c55e]' : 'bg-white dark:bg-zinc-900'
                      }`}
                      title={isCompletedTodayValue ? 'Session completed today' : 'Session pending'}
                    ></span>
                  </div>

                  <div className="flex justify-between items-baseline">
                    <span className="text-[10px] text-[#22c55e] font-extrabold uppercase">
                      {getCurrentRankName(state.totalFocusedMinutes)}
                    </span>
                    <span className="text-[10px] font-bold text-amber-500 flex items-center gap-0.5">
                      🔥 {getChallengeStreak(state.completedDates)}d
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={startTimer}
                    disabled={timerIsActive}
                    className={`w-full py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      timerIsActive
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-[#22c55e] text-black border-[#2a2a2a] dark:border-zinc-700 hover:bg-emerald-400 active:scale-95'
                    }`}
                  >
                    <span>⚡</span>
                    <span>{timerIsActive ? 'Focusing...' : '1-Tap Focus'}</span>
                  </button>
                </div>

                {/* 4x1 Wide Widget */}
                <div className="border-2 border-[#2a2a2a] dark:border-zinc-700 p-3.5 rounded-xl bg-stone-50 dark:bg-zinc-800/90 text-left space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs font-black text-[#0a0a0a] dark:text-zinc-100 uppercase">
                        {state.username}'S CLUB
                      </p>
                      <p className="text-[9px] text-stone-500 dark:text-zinc-400 font-semibold">
                        {state.completedDates.length} completed • {state.bixBalance} Bix
                      </p>
                    </div>
                    <span className="text-sm">🎯</span>
                  </div>

                  <div className="pt-0.5">
                    {state.todaysOneThing?.date === todayLocalDateStr ? (
                      <p className="text-[10px] font-bold text-stone-700 dark:text-zinc-300 truncate">
                        👑 {state.todaysOneThing.text}
                      </p>
                    ) : (
                      <p className="text-[10px] text-stone-400 dark:text-zinc-500 italic">
                        No priority task pinned
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-stone-500 dark:text-zinc-400 font-medium text-center">
                💡 Long-press your phone home screen &gt; <strong>Widgets</strong> &gt; <strong>Progress Club</strong> to place this widget.
              </p>
            </div>

            {/* MILESTONE MANUAL TRIGGER CHIPS (FOR DECK AND TESTING OUT OUTCOMES) */}
            <div className="space-y-2 select-none">
              <span className="text-[9px] font-bold text-stone-400 dark:text-zinc-400 tracking-wider uppercase">ACHIEVEMENT MILESTONE GENERATORS</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { title: "Day 7 Completed", copy: "Completed 7 focus milestones" },
                  { title: "Day 14 Completed", copy: "Completed 14 focus milestones" },
                  { title: "Day 21 Completed", copy: "Successful 21 challenge turn around" },
                  { title: "10 Hours Focused", copy: "Regular rank milestone" },
                  { title: "25 Hours Focused", copy: "Dedicated rank milestone" }
                ].map((m, i) => (
                  <button
                    key={i}
                    aria-label={`Preview milestone ${m.title}`}
                    onClick={() => triggerShareMilestone(m.title)}
                    className="text-[9px] font-bold uppercase p-2 border-2 border-stone-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 hover:bg-stone-50 dark:hover:bg-zinc-700 text-[#0a0a0a] dark:text-zinc-100 cursor-pointer"
                  >
                    {m.title}
                  </button>
                ))}
              </div>
            </div>

          </div>
        )}

        {activeTab === 'stats' && (
          <StatsView
            state={state}
            onOpenShop={() => setActiveTab('shop')}
            onAddJournalEntry={(question, answer) => {
              const newEntry = {
                date: getLocalDateString(),
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                question: question,
                answer: answer,
              };
              const updatedState = {
                ...state,
                savedJournalEntries: [...state.savedJournalEntries, newEntry],
              };
              saveState(updatedState);
            }}
          />
        )}

        {activeTab === 'office' && (
          <div className="space-y-6 select-none">
            <h1 className="text-lg font-black text-[#0a0a0a] uppercase tracking-wider">YOUR CLUB WORKSPACE</h1>
            <p className="text-xs text-[#1a1a1a]/60">view equipped upgrades and decorations interactively inside your active cabin.</p>

            <OfficeRoom
              roomId={state.currentRoom}
              characterId={state.currentActiveCharacter}
              pose='idle'
              isActive={false}
              completedDaysCount={state.completedDates.length}
              completedDates={state.completedDates}
              challengeStartDate={state.challengeStartDate}
              focusActivity={focusActivity}
              exerciseType={exerciseType}
              equippedItems={state.equippedItems}
              itemPositions={state.itemPositions}
              onUpdateItemPosition={handleUpdateItemPosition}
            />

            {/* WORKSPACE THEME SELECTION */}
            <div className="bg-white border-2 border-[#2a2a2a] p-4 rounded-xl space-y-4">
              <div className="border-b border-stone-200 pb-2">
                <h3 className="text-xs font-black uppercase tracking-wider">YOUR CABIN THEMES</h3>
                <p className="text-[10px] text-stone-500">Pick any unlocked architectural focus cabin to serve as your backdrop room.</p>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ROOMS.map((r) => {
                  const owned = state.ownedRooms.includes(r.id);
                  const active = state.currentRoom === r.id;
                  return (
                    <button
                      key={r.id}
                      disabled={!owned}
                      onClick={() => {
                        saveState({ ...state, currentRoom: r.id });
                      }}
                      className={`p-3 text-left border rounded text-xs font-bold transition-all relative ${
                        active
                          ? 'border-[#22c55e] bg-[#22c55e]/5 text-[#22c55e]'
                          : owned
                          ? 'border-[#2a2a2a] bg-white text-[#0a0a0a] hover:bg-stone-50'
                          : 'border-[#eeeeee] bg-[#fafafa] text-stone-400 cursor-not-allowed'
                      }`}
                    >
                      {active && <span className="absolute top-1 right-1 text-[8px] bg-[#22c55e] text-white px-1">ACTIVE</span>}
                      <p className="uppercase">{r.name}</p>
                      <p className="text-[9px] font-normal leading-tight mt-1 text-stone-400">
                        {owned ? 'OWNED' : 'LOCKED IN SHOP'}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ROOM DECORATION & INVENTORY */}
            <div className="bg-white border-2 border-[#2a2a2a] p-4 rounded-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-stone-200 pb-2 gap-2">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider">ROOM DECORATIONS & INVENTORY</h3>
                  <p className="text-[10px] text-stone-500">Drag items live in your active room or put them in storage. Double Bix modifiers automatically apply.</p>
                </div>
                <span className="self-start sm:self-auto text-[10px] font-black text-[#22c55e] bg-[#22c55e]/10 px-2 py-0.5 rounded shrink-0">
                  {(state.equippedItems || []).length} / {ROOM_ITEMS.length} DISPLAYED
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {ROOM_ITEMS.map((item) => {
                  const ownedItems = state.ownedItems || [];
                  const equippedItems = state.equippedItems || [];
                  const isOwned = ownedItems.includes(item.id);
                  const isEquipped = equippedItems.includes(item.id);
                  const itemPos = (state.itemPositions || {})[item.id] || { x: 50, y: 50 };
                  
                  return (
                    <div 
                      key={item.id} 
                      className={`p-3 border-2 rounded-xl flex flex-col justify-between transition-all ${
                        isEquipped 
                          ? 'border-[#22c55e] bg-[#22c55e]/5' 
                          : isOwned 
                          ? 'border-[#2a2a2a] bg-stone-50/50' 
                          : 'border-stone-200 bg-stone-50/20 opacity-80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl filter drop-shadow select-none shrink-0">{item.icon}</span>
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900">{item.name}</h4>
                            <p className="text-[10px] text-stone-500 font-medium leading-tight mt-0.5">{item.copy}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-1.5">
                        <div className="shrink-0">
                          {isOwned ? (
                            isEquipped ? (
                              <span className="text-[8px] font-black tracking-widest text-[#22c55e] bg-[#22c55e]/10 px-1.5 py-0.5 rounded space-x-1">
                                <span>ON DISPLAY</span>
                                <span className="opacity-60 text-[7px]">({itemPos.x}%, {itemPos.y}%)</span>
                              </span>
                            ) : (
                              <span className="text-[8px] font-black tracking-widest text-stone-500 bg-stone-200/60 px-1.5 py-0.5 rounded">IN STORAGE</span>
                            )
                          ) : (
                            <span className="text-[9px] font-extrabold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/50 flex items-center space-x-0.5">
                              <span>🔒</span> <span>{item.priceBix} BIX</span>
                            </span>
                          )}
                        </div>

                        {isOwned ? (
                          isEquipped ? (
                            <button
                              onClick={() => handleToggleRoomItem(item.id)}
                              className="px-2.5 py-1 text-[9px] font-black uppercase text-white bg-stone-900 border border-stone-900 rounded hover:bg-stone-800 transition-colors shadow-sm cursor-pointer"
                              title="Put item away into storage"
                            >
                              Put Away
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleRoomItem(item.id)}
                              className="px-2.5 py-1 text-[9px] font-black uppercase text-white bg-[#22c55e] border border-stone-900 rounded hover:bg-[#16a34a] shadow-[1px_1px_0_#1a1a1a] active:translate-y-px transition-all cursor-pointer"
                              title="Recall item from storage and display it live"
                            >
                              Recall (Display)
                            </button>
                          )
                        ) : (
                          <button
                            onClick={() => {
                              if (state.bixBalance >= item.priceBix) {
                                handlePurchaseRoomItemBix(item.id, item.priceBix);
                              } else {
                                alert(`Insufficient balance! You need ${item.priceBix} Bix to unlock the ${item.name}. Keep focusing to earn Bix!`);
                              }
                            }}
                            className={`px-2.5 py-1 text-[9px] font-black uppercase border rounded transition-all cursor-pointer ${
                              state.bixBalance >= item.priceBix
                                ? 'bg-amber-400 text-stone-900 border-amber-500 hover:bg-amber-300 shadow-[1px_1px_0_#1a1a1a] active:translate-y-px'
                                : 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed'
                            }`}
                          >
                            Unlock Item
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'shop' && (
          <ShopView
            state={state}
            onPurchaseCharacterBix={handlePurchaseCharacterBix}
            onPurchaseRoomBix={handlePurchaseRoomBix}
            onBuyBundleCharacters={handleBuyBundleCharacters}
            onBuyBundleRooms={handleBuyBundleRooms}
            onPurchaseRoomItemBix={handlePurchaseRoomItemBix}
            onToggleRoomItem={handleToggleRoomItem}
          />
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6 select-none pb-8">
            <div className="text-left">
              <h1 className="text-lg font-black text-[#0a0a0a] dark:text-zinc-100 uppercase tracking-wider">
                CLUB SETTINGS & CONTROLS
              </h1>
              <p className="text-xs text-[#1a1a1a]/60 dark:text-zinc-400">
                Personalize your focus session rhythm, visual appearance, and legal documentation.
              </p>
            </div>
            
            {/* 1. TIMING & FOCUS PREFERENCES */}
            <div className="bg-white dark:bg-zinc-900 border-2 border-[#2a2a2a] dark:border-zinc-700 p-5 rounded-2xl space-y-5 shadow-xs">
              <span className="text-[10px] font-black text-[#22c55e] uppercase tracking-widest block">
                TIMING & FOCUS RHYTHM
              </span>

              {/* Duration selector configuration */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-[#1a1a1a]/75 dark:text-zinc-300 uppercase tracking-wider">
                  Default focus timer
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[10, 25, 50, 90].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      id={`setting-duration-${mins}`}
                      aria-label={`Set default focus timer to ${mins} minutes`}
                      onClick={() => {
                        saveState({ ...state, settings: { ...state.settings, durationDefault: mins } });
                        setTimerDuration(mins);
                        setTimeLeft(mins * 60);
                      }}
                      className={`py-2.5 text-xs font-black rounded-xl border-2 transition-all cursor-pointer ${
                        state.settings.durationDefault === mins
                          ? 'bg-[#22c55e] border-[#2a2a2a] dark:border-zinc-700 text-black shadow-xs'
                          : 'bg-stone-50 dark:bg-zinc-800 border-stone-200 dark:border-zinc-700 text-stone-700 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>

              {/* Break duration config */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-[#1a1a1a]/75 dark:text-zinc-300 uppercase tracking-wider">
                  Break Timer duration
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[0, 5, 10, 15].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      id={`setting-break-${mins}`}
                      aria-label={`Set break duration to ${mins === 0 ? 'off' : mins + ' minutes'}`}
                      onClick={() => {
                        saveState({ ...state, settings: { ...state.settings, breakTimer: mins } });
                      }}
                      className={`py-2.5 text-xs font-black rounded-xl border-2 transition-all cursor-pointer ${
                        state.settings.breakTimer === mins
                          ? 'bg-[#22c55e] border-[#2a2a2a] dark:border-zinc-700 text-black shadow-xs'
                          : 'bg-stone-50 dark:bg-zinc-800 border-stone-200 dark:border-zinc-700 text-stone-700 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {mins === 0 ? 'off' : `${mins}m`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Daily reminder & notification trigger configuration */}
              <div className="space-y-3 border-t border-stone-100 dark:border-zinc-800 pt-4 text-left">
                <div className="flex items-center justify-between">
                  <div>
                    <label htmlFor="daily-reminder-input" className="text-xs font-black text-[#1a1a1a]/75 dark:text-zinc-300 uppercase tracking-wider block">
                      Daily Focus Trigger Time
                    </label>
                    <p className="text-[10px] text-stone-500 dark:text-zinc-400">
                      Local push reminder to protect your daily streak
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRequestNotificationPermission}
                    className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg border border-[#2a2a2a] dark:border-zinc-700 bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 dark:hover:bg-zinc-700 cursor-pointer"
                  >
                    {state.settings.notificationsEnabled ? '🔔 Active' : '🔕 Enable Alert'}
                  </button>
                </div>

                {/* Quick time presets */}
                <div className="grid grid-cols-4 gap-1.5">
                  {['09:00', '14:00', '18:00', '20:00'].map((timePreset) => {
                    const isSelected = state.settings.dailyReminderTime === timePreset;
                    return (
                      <button
                        key={timePreset}
                        type="button"
                        onClick={() => {
                          saveState({
                            ...state,
                            settings: { ...state.settings, dailyReminderTime: timePreset },
                          });
                        }}
                        className={`py-1.5 text-[11px] font-black font-mono rounded-lg border-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#22c55e] border-[#2a2a2a] dark:border-zinc-700 text-black shadow-xs'
                            : 'bg-stone-50 dark:bg-zinc-800 border-stone-200 dark:border-zinc-700 text-stone-700 dark:text-zinc-300 hover:bg-stone-100'
                        }`}
                      >
                        {timePreset}
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-2">
                  <input
                    id="daily-reminder-input"
                    type="text"
                    aria-label="Daily reminder time (e.g. 14:00)"
                    value={state.settings.dailyReminderTime}
                    onChange={(e) => {
                      saveState({
                        ...state,
                        settings: { ...state.settings, dailyReminderTime: e.target.value },
                      });
                    }}
                    placeholder="14:00"
                    className="flex-1 bg-stone-50 dark:bg-zinc-800 p-2.5 border-2 border-[#2a2a2a] dark:border-zinc-700 rounded-xl font-mono text-center text-xs text-[#0a0a0a] dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-[#22c55e]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const content = getDailyNotificationContent();
                      sendSystemOrInAppNotification(content.title, content.body);
                    }}
                    className="px-3 py-2 bg-stone-900 text-[#22c55e] dark:bg-zinc-800 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider rounded-xl border-2 border-[#2a2a2a] dark:border-zinc-700 hover:bg-stone-800 cursor-pointer shrink-0"
                  >
                    ⚡ Test Trigger
                  </button>
                </div>

                {/* Live dynamic preview of notification copy */}
                <div className="p-2.5 bg-stone-50 dark:bg-zinc-800/80 rounded-xl border border-stone-200 dark:border-zinc-700 text-left space-y-1">
                  <span className="text-[8px] font-black uppercase text-stone-400 dark:text-zinc-500 tracking-wider block">
                    DYNAMIC NOTIFICATION PREVIEW:
                  </span>
                  <p className="text-[11px] font-bold text-stone-900 dark:text-zinc-100">
                    {getDailyNotificationContent().title}
                  </p>
                  <p className="text-[10px] text-stone-600 dark:text-zinc-400 leading-tight">
                    {getDailyNotificationContent().body}
                  </p>
                </div>

                {/* Background Session Done Notification section */}
                <div className="border-t border-stone-100 dark:border-zinc-800 pt-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <label className="text-xs font-black text-[#1a1a1a]/75 dark:text-zinc-300 uppercase tracking-wider block">
                          Session Complete Background Alert
                        </label>
                        {notificationPermissionState === 'granted' && (
                          <span className="text-[8px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-extrabold px-1.5 py-0.5 rounded uppercase">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-stone-500 dark:text-zinc-400">
                        Sends a system alert and sound chime if the focus timer finishes while you are in another tab or app.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {notificationPermissionState !== 'granted' ? (
                      <button
                        type="button"
                        onClick={handleRequestNotificationPermission}
                        className="px-3 py-2 bg-[#22c55e] text-black text-xs font-black uppercase tracking-wider rounded-xl border-2 border-[#2a2a2a] dark:border-zinc-700 hover:bg-emerald-400 cursor-pointer shadow-xs"
                      >
                        🔔 Enable Completion Notifications
                      </button>
                    ) : (
                      <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-[#22c55e]" />
                        <span>System notifications enabled & active</span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleTestSessionCompleteAlert}
                      className="px-3 py-2 bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 dark:hover:bg-zinc-700 text-stone-800 dark:text-zinc-200 text-xs font-black uppercase tracking-wider rounded-xl border-2 border-stone-300 dark:border-zinc-700 cursor-pointer flex items-center gap-1.5"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-[#22c55e]" />
                      <span>Test Completion Alert & Chime</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Challenge length change triggers */}
              <div className="space-y-1.5 border-t border-stone-100 dark:border-zinc-800 pt-4">
                <label className="text-xs font-black text-[#1a1a1a]/75 dark:text-zinc-300 uppercase tracking-wider block">
                  Active Challenge Span
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[21, 75, 365].map((len) => (
                    <button
                      key={len}
                      type="button"
                      id={`setting-challenge-span-${len}`}
                      aria-label={`Switch challenge to ${len} days`}
                      onClick={() => {
                        setPendingChallengeLength(len as ChallengeLength);
                        setShowChallengeSwitchDialog(true);
                      }}
                      className={`py-2.5 text-xs font-black rounded-xl border-2 transition-all cursor-pointer ${
                        state.challengeLength === len
                          ? 'bg-[#22c55e] border-[#2a2a2a] dark:border-zinc-700 text-black shadow-xs'
                          : 'bg-stone-50 dark:bg-zinc-800 border-stone-200 dark:border-zinc-700 text-stone-700 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {len} Days
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. APPEARANCE & DARK MODE THEME TOGGLE */}
            <div className="bg-white dark:bg-zinc-900 border-2 border-[#2a2a2a] dark:border-zinc-700 p-5 rounded-2xl space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black text-[#22c55e] uppercase tracking-widest block">
                    APPEARANCE
                  </span>
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#0a0a0a] dark:text-zinc-100 mt-0.5">
                    Theme Mode
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-stone-400 dark:text-zinc-500 uppercase">
                  {state.settings.theme || 'system'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'light', label: 'Light', icon: Sun },
                  { id: 'dark', label: 'Dark', icon: Moon },
                  { id: 'system', label: 'System', icon: Laptop },
                ].map((t) => {
                  const Icon = t.icon;
                  const isSelected = (state.settings.theme || 'system') === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      id={`theme-toggle-${t.id}`}
                      aria-label={`Select ${t.label} theme`}
                      onClick={() => {
                        saveState({
                          ...state,
                          settings: {
                            ...state.settings,
                            theme: t.id as ThemeMode,
                          },
                        });
                      }}
                      className={`py-3 px-2 rounded-xl text-xs font-black uppercase tracking-wider flex flex-col items-center justify-center gap-1.5 border-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#22c55e] border-[#2a2a2a] dark:border-zinc-700 text-black shadow-xs'
                          : 'bg-stone-50 dark:bg-zinc-800 border-stone-200 dark:border-zinc-700 text-stone-700 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" aria-hidden="true" />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. COMMUNITY & REVIEWS */}
            <div className="bg-white dark:bg-zinc-900 border-2 border-[#2a2a2a] dark:border-zinc-700 p-5 rounded-2xl space-y-3 shadow-xs">
              <span className="text-[10px] font-black text-[#22c55e] uppercase tracking-widest block">
                COMMUNITY & SUPPORT
              </span>

              {/* Rate App Button */}
              <button
                type="button"
                id="rate-app-settings-btn"
                aria-label="Rate Progress Club on Google Play Store"
                onClick={() => {
                  try {
                    window.open(PLAY_STORE_URL, '_blank', 'noopener,noreferrer');
                  } catch (e) {
                    window.location.href = PLAY_STORE_URL;
                  }
                  saveState({ ...state, hasRatedInStore: true, hasReviewed: true });
                }}
                className="w-full p-3.5 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-950/70 border-2 border-amber-300 dark:border-amber-700/60 rounded-xl flex items-center justify-between transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3 text-left">
                  <div className="p-2 bg-amber-400 text-black rounded-lg">
                    <Star className="w-4 h-4 fill-black" aria-hidden="true" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-amber-950 dark:text-amber-200">
                      Rate On Google Play
                    </h4>
                    <p className="text-[10px] text-amber-800/80 dark:text-amber-300/70">
                      Leave a 5-star review to support indie development
                    </p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-amber-700 dark:text-amber-400 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
              </button>

              {/* In-App Feedback Button */}
              <button
                type="button"
                id="send-feedback-settings-btn"
                aria-label="Send in-app feedback or bug report"
                onClick={() => setShowFeedbackModal(true)}
                className="w-full p-3.5 bg-stone-50 dark:bg-zinc-800 hover:bg-stone-100 dark:hover:bg-zinc-700 border-2 border-[#2a2a2a] dark:border-zinc-700 rounded-xl flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 text-left">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-lg">
                    <MessageSquare className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-[#0a0a0a] dark:text-zinc-100">
                      Send Feedback & Bug Reports
                    </h4>
                    <p className="text-[10px] text-stone-500 dark:text-zinc-400">
                      Share ideas or report issues directly to the team
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400" aria-hidden="true" />
              </button>

              {/* Replay Walkthrough */}
              <button
                type="button"
                id="replay-walkthrough-settings-btn"
                aria-label="Replay feature walkthrough guide"
                onClick={() => setShowWalkthroughModal(true)}
                className="w-full p-3.5 bg-stone-50 dark:bg-zinc-800 hover:bg-stone-100 dark:hover:bg-zinc-700 border-2 border-[#2a2a2a] dark:border-zinc-700 rounded-xl flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 text-left">
                  <div className="p-2 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-lg">
                    <HelpCircle className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-[#0a0a0a] dark:text-zinc-100">
                      Replay Feature Walkthrough
                    </h4>
                    <p className="text-[10px] text-stone-500 dark:text-zinc-400">
                      Review Timer, Streak Shields, Bix & Cabin guide
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400" aria-hidden="true" />
              </button>
            </div>

            {/* 4. LEGAL & COMPLIANCE */}
            <div className="bg-white dark:bg-zinc-900 border-2 border-[#2a2a2a] dark:border-zinc-700 p-5 rounded-2xl space-y-3 shadow-xs">
              <span className="text-[10px] font-black text-[#22c55e] uppercase tracking-widest block">
                LEGAL & COMPLIANCE
              </span>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  id="open-privacy-policy-btn"
                  aria-label="Open Privacy Policy"
                  onClick={() => {
                    setLegalTab('privacy');
                    setShowLegalModal(true);
                  }}
                  className="p-3 bg-stone-50 dark:bg-zinc-800 hover:bg-stone-100 dark:hover:bg-zinc-700 border-2 border-[#2a2a2a] dark:border-zinc-700 rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer active:translate-y-px transition-colors"
                >
                  <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                  <span className="text-xs font-black uppercase text-[#0a0a0a] dark:text-zinc-100">Privacy Policy</span>
                </button>

                <button
                  type="button"
                  id="open-terms-service-btn"
                  aria-label="Open Terms of Service"
                  onClick={() => {
                    setLegalTab('terms');
                    setShowLegalModal(true);
                  }}
                  className="p-3 bg-stone-50 dark:bg-zinc-800 hover:bg-stone-100 dark:hover:bg-zinc-700 border-2 border-[#2a2a2a] dark:border-zinc-700 rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer active:translate-y-px transition-colors"
                >
                  <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                  <span className="text-xs font-black uppercase text-[#0a0a0a] dark:text-zinc-100">Terms of Service</span>
                </button>
              </div>
            </div>

            {/* 5. APP INFO & DATA */}
            <div className="bg-white dark:bg-zinc-900 border-2 border-[#2a2a2a] dark:border-zinc-700 p-5 rounded-2xl space-y-3 shadow-xs">
              <span className="text-[10px] font-black text-[#22c55e] uppercase tracking-widest block">
                APP INFO & DATA
              </span>

              <div className="flex flex-col space-y-2">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-700/50 rounded-xl text-center">
                  <p className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                    ✨ 100% Free • No In-App Purchases or Subscriptions
                  </p>
                  <p className="text-[10px] text-stone-500 dark:text-zinc-400 mt-0.5">
                    Unlock all crew members, rooms, and decorations by focusing and earning Bix!
                  </p>
                </div>
              </div>

              {/* App Version & Package ID Footer Badge */}
              <div className="pt-2 text-center text-[10px] text-stone-400 dark:text-zinc-500 font-mono">
                Progress Club v1.2.0 • Android (Median Wrapper)
              </div>
            </div>
          </div>
        )}
      </main>

      {/* HORIZONTAL TABS ACTIVE BAR CONTROLLER */}
      {activeOverlay === 'none' && (
        <nav
          role="tablist"
          aria-label="Main navigation tabs"
          className="fixed bottom-0 z-30 w-full max-w-md bg-white dark:bg-zinc-900 border-t-2 border-[#2a2a2a] dark:border-zinc-700 grid grid-cols-5 h-16 select-none"
          id="applet-tabs-bar"
        >
          {[
            { id: 'home', label: 'ROOM', icon: '🏠' },
            { id: 'stats', label: 'STATS', icon: '📊' },
            { id: 'office', label: 'CABIN', icon: '⛺' },
            { id: 'shop', label: 'SHOP', icon: '🛒' },
            { id: 'settings', label: 'GEAR', icon: '⚙️' },
          ].map((tab) => {
            const isSel = activeTab === tab.id;
            const showShopDot = tab.id === 'shop' && showBixNudgeBanner;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isSel}
                aria-label={`Switch to ${tab.label} tab`}
                id={`tab-navlink-${tab.id}`}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex flex-col items-center justify-center relative cursor-pointer min-h-[44px] transition-colors ${
                  isSel
                    ? 'text-[#22c55e] bg-stone-50 dark:bg-zinc-800'
                    : 'text-[#1a1a1a]/75 dark:text-zinc-400 hover:bg-stone-50/50 dark:hover:bg-zinc-800/50'
                }`}
              >
                {showShopDot && (
                  <span className="absolute top-2 right-6 w-2.5 h-2.5 bg-[#22c55e] border border-black rounded-full animate-ping"></span>
                )}
                <span className="text-lg leading-none" aria-hidden="true">{tab.icon}</span>
                <span className="text-[9px] font-bold tracking-widest mt-1 uppercase">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      )}

      {/* OVERLAY MODALS REGION */}

      {/* 1. Onboarding Overlay */}
      {activeOverlay === 'onboarding' && (
        <div className="fixed inset-0 z-50 bg-white dark:bg-[#121214] flex items-center justify-center p-4">
          <Onboarding onComplete={handleOnboardingComplete} />
        </div>
      )}

      {/* 2. Journaling Post Session Overlay */}
      {activeOverlay === 'journaling' && (
        <div className="fixed inset-0 z-50 bg-white dark:bg-[#18181b] flex flex-col justify-between p-6">
          <div className="text-left mt-10">
            <span className="text-xs font-bold text-[#1a1a1a]/45 dark:text-zinc-400 uppercase tracking-widest">
              SESSION COMPLETE HABIT LOG
            </span>
            <h1 className="text-3xl font-black text-[#0a0a0a] dark:text-zinc-100 uppercase tracking-tight mt-2" id="journal-question-label">
              {currentJournalQuestion}
            </h1>
            
            <div className="mt-8">
              <textarea
                value={journalText}
                onChange={(e) => setJournalText(e.target.value)}
                placeholder="Write your brief thoughts..."
                aria-label="Session habit journal response"
                className="w-full bg-white dark:bg-zinc-900 border-2 border-[#2a2a2a] dark:border-zinc-700 h-32 p-4 rounded-xl outline-hidden font-medium text-[#0a0a0a] dark:text-zinc-100 focus:ring-2 focus:ring-[#22c55e]"
                maxLength={400}
                autoFocus
              ></textarea>
            </div>
          </div>

          <div className="space-y-4">
            <button
              id="save-journal-btn"
              aria-label="Save habit journal entry"
              onClick={handleSaveJournal}
              disabled={!journalText.trim()}
              className={`w-full py-4 text-center text-sm font-black uppercase tracking-widest bg-[#22c55e] text-[#0a0a0a] rounded-xl border-2 border-[#2a2a2a] dark:border-zinc-700 cursor-pointer ${
                !journalText.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90 active:scale-95'
              }`}
            >
              Save It
            </button>
            
            <button
              id="skip-journaling-btn"
              aria-label="Skip habit journal entry"
              onClick={skipJournaling}
              className="w-full text-center text-xs text-stone-400 dark:text-zinc-500 hover:text-black dark:hover:text-white uppercase font-bold tracking-widest py-2 cursor-pointer"
            >
              skip for now &rarr;
            </button>
          </div>
        </div>
      )}

      {/* 3. Focus Session Complete celebration screen */}
      {activeOverlay === 'day-complete' && (
        <div className="fixed inset-0 z-50 bg-white dark:bg-[#18181b] flex flex-col justify-between p-6 items-center text-center animate-[fade-in_0.3s_ease-out] overflow-y-auto">
          <div className="mt-8 space-y-3">
            <h1 className="text-3xl font-black text-[#0a0a0a] dark:text-zinc-100 uppercase tracking-tight" id="session-complete-title">
              SESSION COMPLETED!
            </h1>
            <p className="text-sm font-bold text-stone-500 dark:text-zinc-400">
              Nice work, {state.username}! You earned <span className="text-[#22c55e] font-black">+{justEarnedBix} Bix</span>{state.currentActiveCharacter === 'monument' ? " (including 2x Monument Double Bix!)" : ""} for focusing {timerDuration} minutes.
            </p>
          </div>

          <div className="my-4 scale-105">
            <CrewCharacter characterId={state.currentActiveCharacter} pose="celebrating" height={140} />
          </div>

          <div className="w-full max-w-sm bg-stone-50 dark:bg-zinc-900 border-2 border-[#2a2a2a] dark:border-zinc-700 p-5 rounded-2xl space-y-4 shadow-sm mb-6 text-left">
            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block">RECHARGE OPPORTUNITY</span>
            <h3 className="text-sm font-black uppercase tracking-wider text-[#0a0a0a] dark:text-zinc-100 -mt-2">🔋 Start a break timer now?</h3>
            <p className="text-xs text-stone-500 dark:text-zinc-400 leading-relaxed">
              Step back, stretch your legs, grab some water, and rest your eyes before your next deep work session.
            </p>
            
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                id="accept-break-btn"
                aria-label={`Start break timer for ${state.settings.breakTimer || 5} minutes`}
                onClick={() => {
                  setTimeLeft((state.settings.breakTimer || 5) * 60);
                  setActiveOverlay('break');
                  setTimerPose('resting');
                }}
                className="py-3 bg-[#22c55e] hover:bg-emerald-400 active:translate-y-px text-black text-xs font-black uppercase tracking-wider rounded-xl border-2 border-[#2a2a2a] dark:border-zinc-700 shadow-xs cursor-pointer text-center"
              >
                Yes, break ({state.settings.breakTimer || 5}m)
              </button>
              
              <button
                type="button"
                id="decline-break-btn"
                aria-label="Decline break and return to room"
                onClick={() => {
                  setActiveOverlay('none');
                  setTimerPose('idle');
                  setTimeLeft(timerDuration * 60);
                }}
                className="py-3 bg-white dark:bg-zinc-800 hover:bg-stone-100 dark:hover:bg-zinc-700 active:translate-y-px text-black dark:text-zinc-100 text-xs font-black uppercase tracking-wider rounded-xl border-2 border-[#2a2a2a] dark:border-zinc-700 cursor-pointer text-center"
              >
                No, keep going
              </button>
            </div>
          </div>

          <div className="mb-4 space-y-0.5">
            <p className="text-xs font-black text-[#22c55e] uppercase tracking-widest">CALENDAR DAY {currentDayXOfChallenge} SECURED !</p>
            <p className="text-[10px] text-stone-400 dark:text-zinc-500">your stats are updated & synchronized</p>
          </div>
        </div>
      )}

      {/* 4. Challenge Complete congratulations screen */}
      {activeOverlay === 'challenge-complete' && (
        <div className="fixed inset-0 z-50 bg-white dark:bg-[#18181b] flex flex-col justify-between p-6 items-center text-center">
          <div className="mt-12 space-y-4">
            <h1 className="text-4xl font-extrabold text-[#0a0a0a] dark:text-zinc-100 uppercase tracking-tight" id="challenge-complete-header">
              YOU DID IT, {state.username}!
            </h1>
            <p className="text-lg text-stone-500 dark:text-zinc-400 font-semibold mb-2">
              we knew you could complete the full {state.challengeLength} day journey!
            </p>
          </div>

          <div className="my-6 scale-110">
            <CrewCharacter characterId={state.currentActiveCharacter} pose="challenge-complete" height={160} />
          </div>

          <div className="space-y-3 w-full max-w-xs mb-10">
            <button
              id="continue-challenge-complete"
              aria-label="Keep going into the next cycle"
              onClick={() => {
                setActiveOverlay('none');
                setTimerPose('idle');
                setTimeLeft(timerDuration * 60);
              }}
              className="w-full py-4 text-center text-sm font-black uppercase bg-[#22c55e] text-[#0a0a0a] rounded-xl border-2 border-[#2a2a2a] dark:border-zinc-700 cursor-pointer"
            >
              Keep Going!
            </button>
            
            <button
              id="share-challenge-complete"
              aria-label="Share challenge completion accomplishment"
              onClick={() => {
                const shareStr = `I did it! I completed the full ${state.challengeLength} Days challenge on #ProgressClub !`;
                navigator.clipboard.writeText(shareStr);
                alert("Challenge accomplishment copied:\n" + shareStr);
              }}
              className="w-full py-3.5 bg-white dark:bg-zinc-800 text-black dark:text-zinc-100 text-xs font-bold uppercase rounded-xl border-2 border-[#2a2a2a] dark:border-zinc-700 cursor-pointer"
            >
              Share
            </button>
          </div>
        </div>
      )}

      {/* 5. Rank Up screen */}
      {activeOverlay === 'rank-up' && (
        <div className="fixed inset-0 z-50 bg-white dark:bg-[#18181b] flex flex-col justify-between p-6 text-center items-center">
          <div className="mt-20 space-y-3">
            <span className="text-xs text-stone-400 uppercase font-bold tracking-widest">CLUB RANK ACHIEVEMENT</span>
            <h1 className="text-4xl font-black text-[#0a0a0a] dark:text-zinc-100 uppercase tracking-tight">
              LEVEL UP !
            </h1>
            <p className="text-lg text-[#22c55e] font-black uppercase">
              {rankUpName} MEMBER
            </p>
            <p className="text-sm text-stone-500 dark:text-zinc-400">
              you leveled up, {state.username}! your new status deserves respect in the lobby.
            </p>
          </div>

          <div className="my-6">
            <CrewCharacter characterId={state.currentActiveCharacter} pose="celebrating" height={145} />
          </div>

          <button
            id="dismiss-rankup-btn"
            aria-label="Dismiss rank up celebration and continue"
            onClick={() => setActiveOverlay('none')}
            className="w-full max-w-xs py-4 bg-[#22c55e] text-[#0a0a0a] text-sm font-black uppercase rounded-xl border-2 border-[#2a2a2a] dark:border-zinc-700 mb-12 cursor-pointer"
          >
            Keep Going!
          </button>
        </div>
      )}

      {/* 6. Milestone Manual/Automatic Share Card Overlay */}
      {activeOverlay === 'milestone' && (
        <div className="fixed inset-0 z-40 bg-white dark:bg-[#18181b] flex flex-col justify-between p-6 items-center">
          <div className="text-left w-full">
            <button
              id="close-milestone"
              aria-label="Back from milestone view"
              onClick={() => setActiveOverlay('none')}
              className="text-stone-400 hover:text-black dark:hover:text-white font-extrabold text-xs uppercase cursor-pointer"
            >
              &larr; BACK
            </button>
          </div>

          {/* Simulated 9:16 TikTok Card */}
          <div className="w-72 h-96 bg-white dark:bg-zinc-900 border-4 border-[#2a2a2a] dark:border-zinc-700 rounded-xl flex flex-col justify-between p-6 shadow-md relative select-none">
            {/* Confetti decoration */}
            <div className="absolute inset-0 bg-[#22c55e]/5 pointer-events-none rounded-lg"></div>
            
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">DAY ELAPSED</span>
              <h1 className="text-3xl font-black text-[#0a0a0a] dark:text-zinc-100 uppercase tracking-tighter">
                {activeMilestoneText}!
              </h1>
              <div className="h-0.5 bg-[#22c55e] w-1/3 my-2"></div>
              <p className="text-[10px] font-bold text-[#22c55e] uppercase tracking-wider">
                {getCurrentRankName(state.totalFocusedMinutes).toUpperCase()} PROGRESS MEMBER
              </p>
            </div>

            <div className="flex justify-center h-44 items-end">
              <CrewCharacter characterId={state.currentActiveCharacter} pose="celebrating" height={120} />
            </div>

            <div className="border-t border-[#eeeeee] dark:border-zinc-800 pt-3 flex justify-between items-center text-[10px] font-bold text-[#1a1a1a]/65 dark:text-zinc-400">
              <span>PROGRESS CLUB</span>
              <span>EST. 2026</span>
            </div>
          </div>

          {/* Action trigger buttons */}
          <div className="space-y-3 w-full max-w-xs mb-6">
            <button
              id="save-camera-roll"
              aria-label="Save milestone card to camera roll"
              onClick={() => {
                alert("Simulated: Milestone Card successfully rendered & stored to your Local Photo Album / Camera Roll!");
              }}
              className="w-full py-3.5 bg-[#22c55e] text-[#0a0a0a] text-xs font-black uppercase rounded-xl border border-[#2a2a2a] dark:border-zinc-700 cursor-pointer"
            >
              Save to Camera Roll
            </button>
            <button
              id="share-button-milestone"
              aria-label="Copy share text to clipboard"
              onClick={() => {
                const quoteText = `Focus milestone unlocked: ${activeMilestoneText} focused! Showing up is everything. #ProgressClub`;
                navigator.clipboard.writeText(quoteText);
                alert(`Share template copied:\n"${quoteText}"`);
              }}
              className="w-full py-3 text-black dark:text-zinc-100 bg-white dark:bg-zinc-800 text-xs font-bold uppercase tracking-wider rounded-xl border border-[#2a2a2a] dark:border-zinc-700 cursor-pointer"
            >
              Share Details
            </button>
          </div>
        </div>
      )}

      {/* 7. Warm Break timer overlay */}
      {activeOverlay === 'break' && (
        <div className="fixed inset-0 z-50 bg-white dark:bg-[#18181b] flex flex-col justify-between p-6 items-center text-center animate-[fade-in_0.3s_ease-out]">
          <div className="mt-20 space-y-3">
            <h1 className="text-3xl font-black text-[#0a0a0a] dark:text-zinc-100 uppercase tracking-tight">
              TAKE A BREATHER, {state.username}!
            </h1>
            <p className="text-sm text-stone-500 dark:text-zinc-400 font-semibold">
              nice work! you earned your break. step back, grab some water, stretch your legs.
            </p>
          </div>

          <div className="my-8 scale-105">
            <CrewCharacter characterId={state.currentActiveCharacter} pose="idle" height={140} />
          </div>

          <div className="mb-14 space-y-3 w-full max-w-xs">
            <p className="text-xs font-extrabold text-stone-400 uppercase tracking-wider">Remaining break time</p>
            <p className="text-4xl font-black text-[#22c55e] font-mono select-none">
              {formatTimeStr(timeLeft)}
            </p>
            
            <button
              id="finish-break-early"
              aria-label="Finish rest break early and return to room"
              onClick={() => {
                setActiveOverlay('none');
                setTimerPose('idle');
                setTimeLeft(timerDuration * 60);
              }}
              className="w-full py-3.5 bg-white dark:bg-zinc-800 border-2 border-[#2a2a2a] dark:border-zinc-700 text-xs font-black text-[#0a0a0a] dark:text-zinc-100 uppercase rounded-xl shadow-xs cursor-pointer"
            >
              Skip Break Early
            </button>
          </div>
        </div>
      )}

      {/* 8. Challenge Length Change Warm Confirmation Modal Dialog */}
      {showChallengeSwitchDialog && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="challenge-switch-dialog-title"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 select-none"
        >
          <div className="bg-white dark:bg-zinc-900 border-2 border-[#2a2a2a] dark:border-zinc-700 p-6 rounded-2xl max-w-sm w-full space-y-4 text-center shadow-2xl">
            <h3 id="challenge-switch-dialog-title" className="text-base font-black text-[#0a0a0a] dark:text-zinc-100 uppercase">
              Switch Challenge Span?
            </h3>
            <p className="text-xs text-[#1a1a1a]/75 dark:text-zinc-400 leading-relaxed">
              Switching to {pendingChallengeLength} Days resets the challenge offset index. Your streak shield history and completed cumulative days are always saved, {state.username}!
            </p>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                id="cancel-switch-btn"
                aria-label="Cancel challenge span switch"
                onClick={() => setShowChallengeSwitchDialog(false)}
                className="py-3 bg-white dark:bg-zinc-800 hover:bg-stone-100 dark:hover:bg-zinc-700 border-2 border-[#2a2a2a] dark:border-zinc-700 text-xs font-bold uppercase rounded-xl cursor-pointer"
              >
                No, Keep
              </button>
              <button
                type="button"
                id="confirm-switch-btn"
                aria-label="Confirm challenge span change"
                onClick={() => {
                  saveState({
                    ...state,
                    challengeLength: pendingChallengeLength,
                    challengeStartDate: getLocalDateString(),
                  });
                  setShowChallengeSwitchDialog(false);
                  alert(`Challenge trajectory shifted to ${pendingChallengeLength} Days. Stay focused, stay bold!`);
                }}
                className="py-3 bg-[#22c55e] hover:bg-emerald-400 text-black text-xs font-black uppercase rounded-xl border-2 border-[#2a2a2a] dark:border-zinc-700 cursor-pointer shadow-xs"
              >
                Yes, Change
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. Android Hardware Back Button Exit Confirmation Modal */}
      <ExitConfirmModal
        isOpen={showExitConfirm}
        onCancel={() => setShowExitConfirm(false)}
        onConfirmExit={handleConfirmExit}
        username={state.username}
      />

      {/* 10. Legal & Compliance Pages (Privacy Policy & Terms of Service) */}
      <LegalModal
        isOpen={showLegalModal}
        initialTab={legalTab}
        onClose={() => setShowLegalModal(false)}
      />

      {/* 11. In-App Rating & Review Trigger Modal */}
      <RatingModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        onRated={handleRatingCompleted}
        onRemindLater={handleRatingRemindLater}
        onNeverAskAgain={handleRatingNeverAsk}
        onOpenFeedback={() => {
          setShowRatingModal(false);
          setShowFeedbackModal(true);
        }}
        username={state.username}
        milestoneReason={ratingMilestoneReason}
      />

      {/* 12. Interactive First-Time Onboarding Feature Walkthrough */}
      <WalkthroughModal
        isOpen={showWalkthroughModal}
        onComplete={handleWalkthroughFinished}
        username={state.username}
        characterId={state.currentActiveCharacter}
      />

      {/* 13. In-App Feedback & Bug Reporting Modal */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        username={state.username}
      />

    </div>
  );
}
