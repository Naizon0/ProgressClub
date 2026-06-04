import React, { useState, useEffect, useRef } from 'react';
import { AppState, ChallengeLength, JournalEntry } from './types';
import { INITIAL_STATE, CHARACTERS, ROOMS, RANKS, JOURNAL_QUESTIONS, ROOM_ITEMS } from './data';
import CrewCharacter from './components/CrewCharacter';
import OfficeRoom from './components/OfficeRoom';
import Onboarding from './components/Onboarding';
import StatsView from './components/StatsView';
import ShopView from './components/ShopView';

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

  // Tracking temporary states
  const [currentJournalQuestion, setCurrentJournalQuestion] = useState('');
  const [journalText, setJournalText] = useState('');
  const [justEarnedBix, setJustEarnedBix] = useState(0);
  const [activeMilestoneText, setActiveMilestoneText] = useState('');
  const [rankUpName, setRankUpName] = useState('');
  const [showBixNudgeBanner, setShowBixNudgeBanner] = useState(false);

  // Settings: challenge switch temporary check dialog
  const [showChallengeSwitchDialog, setShowChallengeSwitchDialog] = useState(false);
  const [pendingChallengeLength, setPendingChallengeLength] = useState<ChallengeLength>(21);
  const [homeGoalInput, setHomeGoalInput] = useState('');

  // Refs:
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load state from localStorage on Mount
  useEffect(() => {
    const saved = localStorage.getItem('progress_club_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as AppState;
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
        
        setState(parsed);

        // Check if onboarding completed, if not trigger overlay onboarding
        if (!parsed.onboardingCompleted) {
          setActiveOverlay('onboarding');
        }
      } catch (e) {
        setActiveOverlay('onboarding');
      }
    } else {
      setActiveOverlay('onboarding');
    }
  }, []);

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

  // Sync state to localStorage of every update
  const saveState = (newState: AppState) => {
    setState(newState);
    localStorage.setItem('progress_club_state', JSON.stringify(newState));
  };

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

    const buySub = data.subscriptionPlan === 'monthly' || data.subscriptionPlan === 'yearly';
    
    let initialRooms = Array.from(new Set(['rooftop', data.recommendedRoom]));
    if (buySub) {
      initialRooms.push('deepspace');
    }
    
    let bixAwarded = 0;
    let unlockedRoomNames: string[] = [];
    
    if (buySub) {
      const candidates = ROOMS.filter(r => r.id !== 'deepspace' && !initialRooms.includes(r.id));
      if (candidates.length >= 3) {
        const shuffled = [...candidates].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 3);
        for (const r of selected) {
          initialRooms.push(r.id);
          unlockedRoomNames.push(r.name);
        }
        initialRooms = Array.from(new Set(initialRooms));
      } else {
        bixAwarded = 1000;
      }
    }

    const updated: AppState = {
      ...INITIAL_STATE,
      username: data.username,
      onboardingCompleted: true,
      quizAnswers: data.quizAnswers,
      subscriptionPlan: data.subscriptionPlan,
      isExecutive: buySub,
      challengeStartDate: todayStr,
      currentActiveCharacter: data.recommendedCharacter,
      currentRoom: data.recommendedRoom,
      ownedCharacters: ['cipher', data.recommendedCharacter],
      ownedRooms: initialRooms,
      bixBalance: INITIAL_STATE.bixBalance + bixAwarded,
      dailyGoals: mappedGoals,
    };
    saveState(updated);

    if (buySub) {
      const rewardMsg = bixAwarded > 0 
        ? `Additionally, you received a bonus of 1,000 Bix because you already own almost all rooms!`
        : `Additionally, you unlocked 3 random bonus rooms: ${unlockedRoomNames.join(', ')}!`;
      alert(`Welcome to the Executive Suite! You now earn 2x Bix, have unlocked the VIP Deep Space workspace suite for free, and have lifetime access!\n\n${rewardMsg}`);
    }
    setActiveOverlay('none');
    setActiveTab('home');

    // Default timer set
    setTimerDuration(updated.settings.durationDefault);
    setTimeLeft(updated.settings.durationDefault * 60);
  };

  // Timer Tick implementation
  const startTimer = () => {
    if (timerIsActive) return;
    setTimerIsActive(true);
    setTimerPose(focusActivity === 'exercise' ? 'exercising' : 'typing');

    timerIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current!);
          setTimerIsActive(false);
          handleSessionCompletion();
          return 0;
        }
        // Randomly alternate between stances for visual variety !
        if (prev % 12 === 0) {
          if (focusActivity === 'exercise') {
            setTimerPose('exercising'); // don't let them meditate, keep them exercising
          } else {
            setTimerPose((current) => (current === 'typing' ? 'focused' : 'typing'));
          }
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (!timerIsActive) return;
    clearInterval(timerIntervalRef.current!);
    setTimerIsActive(false);
    setTimerPose('resting');
    setTimeLeft(timerDuration * 60);

    alert("Focus session aborted. Your crew member is taking a rest posture, never judging, always ready when you are.");
  };

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

    // App Store Prompt Trigger: Only after the very first completed session
    let triggerAppStorePrompt = false;
    if (state.totalSessionsCompleted === 0 && !state.hasReviewed) {
      triggerAppStorePrompt = true;
    }

    const updatedState: AppState = {
      ...state,
      totalFocusedMinutes: currentTotalMinutes,
      totalSessionsCompleted: currentSessionsCount,
      bixBalance: state.bixBalance + bixEarned,
      completedDates: updatedCompletedDates,
      streakShields: currentShields,
      unlockedRanks: updatedRanks,
      hasReviewed: triggerAppStorePrompt ? state.hasReviewed : state.hasReviewed,
    };

    saveState(updatedState);

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

    // App review triggering:
    if (triggerAppStorePrompt) {
      setTimeout(() => {
        const confirmReview = window.confirm(`you just finished your first session, ${state.username}, that's worth celebrating! enjoying Progress Club so far?`);
        if (confirmReview) {
          alert("Thank you! Glad you are enjoying the Progress Club. Redirecting to mock App Store review page...");
          saveState({ ...updatedState, hasReviewed: true });
        } else {
          saveState({ ...updatedState, hasReviewed: false });
        }
      }, 500);
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
    } else {
      setActiveOverlay('day-complete');
    }
  };

  const skipJournaling = () => {
    setActiveOverlay('day-complete');
  };

  // Purchase Actions
  const handlePurchaseCharacterBix = (charId: string, costBix: number) => {
    if (state.bixBalance < costBix) return;
    const updated: AppState = {
      ...state,
      bixBalance: state.bixBalance - costBix,
      ownedCharacters: [...state.ownedCharacters, charId],
      currentActiveCharacter: charId, // Auto-equip
    };
    saveState(updated);
    alert(`Mock Transaction: ${charId.toUpperCase()} equiped and added to your crew space! spent ${costBix} Bix.`);
  };

  const handlePurchaseCharacterCash = (charId: string) => {
    const updated: AppState = {
      ...state,
      ownedCharacters: [...state.ownedCharacters, charId],
      currentActiveCharacter: charId, // Auto-equip
    };
    saveState(updated);
    alert(`Mock Transaction: ${charId.toUpperCase()} equipped and added to your crew space! Thank you for purchasing.`);
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
    alert(`Mock Transaction: ${roomId.toUpperCase()} workspace is now yours! equipped in your studio.`);
  };

  const handlePurchaseRoomCash = (roomId: string) => {
    const updated: AppState = {
      ...state,
      ownedRooms: [...state.ownedRooms, roomId],
      currentRoom: roomId, // Auto-equip
    };
    saveState(updated);
    alert(`Mock Transaction: ${roomId.toUpperCase()} workspace is now yours! equipped in your studio.`);
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
    alert(`Mock Transaction: ${itemId.replace('-', ' ').toUpperCase()} purchased and equipped in your room!`);
  };

  const handlePurchaseRoomItemCash = (itemId: string) => {
    const currentOwned = state.ownedItems || [];
    const currentEquipped = state.equippedItems || [];
    const updated: AppState = {
      ...state,
      ownedItems: [...currentOwned, itemId],
      equippedItems: [...currentEquipped, itemId],
    };
    saveState(updated);
    alert(`Mock Transaction: ${itemId.replace('-', ' ').toUpperCase()} purchased and equipped in your room!`);
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

  const handleJoinExecutive = () => {
    const candidates = ROOMS.filter((r) => r.id !== 'deepspace' && !state.ownedRooms.includes(r.id));
    
    let bixReward = 0;
    let unlockedRoomNames: string[] = [];
    let newOwnedRooms = Array.from(new Set([...state.ownedRooms, 'deepspace']));
    
    if (candidates.length >= 3) {
      const shuffled = [...candidates].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 3);
      for (const r of selected) {
        newOwnedRooms.push(r.id);
        unlockedRoomNames.push(r.name);
      }
      newOwnedRooms = Array.from(new Set(newOwnedRooms));
    } else {
      bixReward = 1000;
    }
    
    const updated: AppState = {
      ...state,
      isExecutive: true,
      subscriptionPlan: 'monthly',
      ownedRooms: newOwnedRooms,
      bixBalance: state.bixBalance + bixReward,
    };
    
    saveState(updated);
    
    const rewardMsg = bixReward > 0
      ? `Additionally, you received a bonus of 1,000 Bix because you already own almost all rooms!`
      : `Additionally, you unlocked 3 random bonus rooms: ${unlockedRoomNames.join(', ')}!`;
      
    alert(`Mock Transaction: Welcome to the Executive Suite! You now earn 2x Bix, have unlocked the VIP Deep Space workspace suite for free, and have lifetime access for $5.50!\n\n${rewardMsg}`);
  };

  const handleBuyBundleCharacters = (isBix: boolean) => {
    const charIds = CHARACTERS.map(c => c.id);
    if (isBix) {
      if (state.bixBalance < 7200) return;
      const updated: AppState = {
        ...state,
        bixBalance: state.bixBalance - 7200,
        ownedCharacters: Array.from(new Set([...state.ownedCharacters, ...charIds])),
      };
      saveState(updated);
      alert("Mock Transaction: Crew Bundle Unlocked using Bix! All 8 friends are ready to study.");
    } else {
      const updated: AppState = {
        ...state,
        ownedCharacters: Array.from(new Set([...state.ownedCharacters, ...charIds])),
      };
      saveState(updated);
      alert("Mock Transaction: Crew Bundle Unlocked using Cash ($18)! Thank you for supporting Progress Club.");
    }
  };

  const handleBuyBundleRooms = (isBix: boolean) => {
    const roomIds = ROOMS.map(r => r.id);
    if (isBix) {
      if (state.bixBalance < 4800) return;
      const updated: AppState = {
        ...state,
        bixBalance: state.bixBalance - 4800,
        ownedRooms: Array.from(new Set([...state.ownedRooms, ...roomIds])),
      };
      saveState(updated);
      alert("Mock Transaction: Workspace Suite Bundle Unlocked with Bix! All spaces equipped.");
    } else {
      const updated: AppState = {
        ...state,
        ownedRooms: Array.from(new Set([...state.ownedRooms, ...roomIds])),
      };
      saveState(updated);
      alert("Mock Transaction: Workspace Suite Bundle Unlocked with Cash ($12)! All spaces equipped.");
    }
  };

  const handleGiveTip = (amount: number) => {
    // TIP does not subtract Bix, it is real-money thank you trigger
  };

  // Convert timer remaining seconds to MM:SS string
  const formatTimeStr = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

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

  return (
    <div className={`min-h-screen bg-[#fafafa] flex flex-col items-center justify-start pb-20 ${timerIsActive ? 'border-[3px] border-[#22c55e]' : ''}`} id="applet-viewport">
      
      {/* HEADER BAR SIMULATION */}
      <header className="sticky top-0 z-30 w-full max-w-md bg-white border-b border-[#2a2a2a] px-4 py-3 flex justify-between items-center select-none" id="progress-club-navbar">
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-widest font-mono font-bold text-[#1a1a1a]/60">PROGRESS CLUB SYSTEM</span>
          {timerIsActive ? (
            <span className="text-[#22c55e] text-xs font-bold animate-ping uppercase tracking-widest">• focusing...</span>
          ) : (
            <span className="text-xs font-bold text-stone-400 capitalize">ready in pocket | {state.username}</span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {state.streakShields > 0 ? (
            <span
              className="text-sm bg-black text-[#22c55e] border border-[#2a2a2a] px-1.5 py-0.5 rounded flex items-center space-x-0.5"
              title="your shield is ready!"
            >
              <span>🛡️</span>
              <span className="text-[10px] text-white">READY</span>
            </span>
          ) : null}
          <div className="text-xs font-black text-[#22c55e] uppercase">
            {state.bixBalance} Bix
          </div>
        </div>
      </header>

      {/* OVERFLOW WARNING / INFO NOTIFICATION BANNER */}
      {showBixNudgeBanner && !timerIsActive && (
        <div
          id="bix-nudge-banner"
          onClick={() => {
            setActiveTab('shop');
            setShowBixNudgeBanner(false);
          }}
          className="w-full max-w-md bg-[#22c55e] text-[#0a0a0a] text-center p-2.5 text-xs font-black uppercase tracking-widest cursor-pointer hover:opacity-90 transition-opacity select-none border-b border-[#2a2a2a]"
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
              <h1 className="text-lg font-black tracking-tight text-[#0a0a0a]">
                {state.username}'S PROGRESS CLUB | DAY {currentDayXOfChallenge} OF {state.challengeLength}
              </h1>
              <div className="flex items-center space-x-1 flex-wrap">
                <span className="text-xs font-bold text-[#22c55e] uppercase">
                  {getCurrentRankName(state.totalFocusedMinutes)} MEMBER
                </span>
                <span className="text-stone-300 text-xs">•</span>
                <span className="text-xs font-semibold text-[#1a1a1a]/65 uppercase">
                  {state.completedDates.length} completed
                </span>
                <span className="text-stone-300 text-xs">•</span>
                <span className="text-xs font-bold text-amber-500 uppercase flex items-center space-x-0.5">
                  <span>🔥</span>
                  <span>{getChallengeStreak(state.completedDates)} DAY STREAK</span>
                </span>
              </div>
            </div>

            {/* Office room render display */}
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
            />

            {/* TIMER CORE MODULE CONTAINER */}
            <div className="bg-white border-2 border-[#2a2a2a] rounded-xl p-5 text-center shadow-xs space-y-4">
              
              {/* LARGE COUNTDOWN NUMERALS */}
              <div className="py-2">
                <span className="text-6xl font-black tracking-tighter text-[#0a0a0a] select-all font-mono">
                  {formatTimeStr(timeLeft)}
                </span>
              </div>

              {/* HORIZONTAL DURATIONS PILLS BAR */}
              {!timerIsActive && (
                <div className="space-y-2 select-none">
                  <p className="text-[10px] font-bold text-[#1a1a1a]/65 uppercase tracking-widest text-left">focus goal duration</p>
                  <div className="flex space-x-2 overflow-x-auto pb-1.5 scrollbar-thin">
                    {durationOptions.map((min) => {
                      const isSel = timerDuration === min;
                      return (
                        <button
                          key={min}
                          id={`pills-duration-${min}`}
                          onClick={() => handleDurationSelect(min)}
                          className={`px-4.5 py-1.5 rounded-full text-xs font-bold border transition-all ${
                            isSel
                              ? 'bg-[#22c55e] border-[#2a2a2a] text-[#0a0a0a]'
                              : 'bg-white border-[#2a2a2a] text-[#1a1a1a]/70 hover:bg-[#f5f5f5]'
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
                <p className="text-[10px] font-bold text-[#1a1a1a]/65 uppercase tracking-widest">
                  Crew Focus Activity
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    id="focus-activity-desk-btn"
                    onClick={() => {
                      setFocusActivity('desk-work');
                      if (timerIsActive) {
                        setTimerPose('typing');
                      }
                    }}
                    className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      focusActivity === 'desk-work'
                        ? 'bg-[#22c55e]/15 border-[#22c55e] text-[#0a0a0a]'
                        : 'bg-white border-stone-200 text-[#1a1a1a]/70 hover:bg-[#f5f5f5] hover:border-[#2a2a2a]'
                    }`}
                  >
                    <span>💻</span>
                    <span>Desk Work</span>
                  </button>
                  <button
                    id="focus-activity-exercise-btn"
                    onClick={() => {
                      setFocusActivity('exercise');
                      if (timerIsActive) {
                        setTimerPose('exercising');
                      }
                    }}
                    className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      focusActivity === 'exercise'
                        ? 'bg-[#22c55e]/15 border-[#22c55e] text-[#0a0a0a]'
                        : 'bg-white border-stone-200 text-[#1a1a1a]/70 hover:bg-[#f5f5f5] hover:border-[#2a2a2a]'
                    }`}
                  >
                    <span>🏋️</span>
                    <span>Exercise</span>
                  </button>
                </div>
              </div>

              {focusActivity === 'exercise' && (
                <div id="workout-routine-select" className="space-y-1.5 select-none text-left p-2.5 bg-stone-50 border border-stone-200 rounded-lg">
                  <p className="text-[10px] font-bold text-[#1a1a1a]/60 uppercase tracking-widest">
                    Workout Routine Style
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      id="exercise-type-dumbbells-btn"
                      onClick={() => setExerciseType('dumbbells')}
                      className={`flex items-center justify-center space-x-1 py-1.5 px-2 rounded-md text-[11px] font-bold border transition-all cursor-pointer ${
                        exerciseType === 'dumbbells'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100 hover:border-stone-400'
                      }`}
                    >
                      <span>🏋️</span>
                      <span>Dumbbells</span>
                    </button>
                    <button
                      id="exercise-type-punching-btn"
                      onClick={() => setExerciseType('punching')}
                      className={`flex items-center justify-center space-x-1 py-1.5 px-2 rounded-md text-[11px] font-bold border transition-all cursor-pointer ${
                        exerciseType === 'punching'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100 hover:border-stone-400'
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
                    onClick={stopTimer}
                    className="w-full py-4 bg-white text-black text-sm font-bold uppercase tracking-widest rounded-lg border-2 border-[#2a2a2a] active:scale-95 transition-all cursor-pointer"
                  >
                    Abort Session
                  </button>
                ) : (
                  <button
                    id="start-timer-btn"
                    onClick={startTimer}
                    className="w-full py-4 bg-[#22c55e] text-[#0a0a0a] text-sm font-black uppercase tracking-widest rounded-lg border-2 border-[#2a2a2a] shadow-[0_4px_0_#0a0a0a] active:translate-y-1 active:shadow-none transition-all cursor-pointer"
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
            <div className="bg-white border-2 border-[#2a2a2a] rounded-xl p-4 shadow-xs select-none space-y-3 text-left">
              <div className="flex items-center justify-between border-b border-[#2a2a2a]/10 pb-2">
                <div className="flex items-center space-x-1.5">
                  <span className="text-sm">🎯</span>
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#0a0a0a]">
                    DAILY GOAL TRACKER
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-stone-500 uppercase">
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
                        className={`flex items-center justify-between p-2.5 rounded-lg border-2 border-[#2a2a2a] transition-all cursor-pointer ${
                          isDoneToday
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-inner'
                            : 'bg-white hover:bg-stone-50 text-stone-900'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 flex-1 min-w-0">
                          {/* Checkbox */}
                          <div className={`w-4.5 h-4.5 rounded border-2 border-[#2a2a2a] flex items-center justify-center font-bold text-xs select-none ${
                            isDoneToday ? 'bg-[#22c55e] text-white border-emerald-600' : 'bg-stone-100'
                          }`}>
                            {isDoneToday && "✓"}
                          </div>
                          
                          {/* Text */}
                          <span className={`text-xs font-bold leading-tight truncate ${
                            isDoneToday ? 'line-through text-emerald-800 font-medium' : 'text-stone-950 font-bold'
                          }`}>
                            {g.text}
                          </span>
                        </div>

                        {/* Interactive Delete Button and stats */}
                        <div className="flex items-center space-x-2 shrink-0">
                          <span className="text-[9px] font-black uppercase bg-stone-100 text-stone-600 border border-stone-200 px-1.5 py-0.5 rounded">
                            ⭐ {g.completedDates.length} Days
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveHomeDailyGoal(g.id);
                            }}
                            className="text-red-400 hover:text-red-600 text-xs font-bold p-1 hover:bg-red-50 rounded"
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
                <div className="p-4 bg-stone-50 border border-dashed border-stone-300 rounded-lg text-center">
                  <p className="text-xs text-stone-500 font-medium italic">
                    No active daily goals tracked. Create up to 3 daily driver habits to commit to!
                  </p>
                </div>
              )}

              {/* Add Custom Goal Directly inline on the Home tab if less than 3 are present */}
              {(state.dailyGoals || []).length < 3 ? (
                <div className="pt-2 bg-stone-50 p-2 rounded-lg border border-stone-200 space-y-1.5">
                  <span className="text-[9px] font-black text-stone-400 uppercase tracking-wider block">Add a New Daily Goal (Max 3):</span>
                  
                  {/* Tip banner */}
                  <div className="text-[9px] text-amber-800 bg-amber-50/75 border border-amber-200 p-1.5 rounded leading-normal">
                    💡 <strong>Pro-Tip:</strong> Set a <strong>clear, actionable, and timed</strong> goal (e.g. <em>"Read 15 pages of book"</em> or <em>"Do 20 mins of yoga"</em>) rather than something vague!
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      id="home-custom-goal-input"
                      value={homeGoalInput}
                      onChange={(e) => setHomeGoalInput(e.target.value)}
                      placeholder="e.g. Study React for 30m"
                      className="flex-1 p-2 text-xs border border-stone-400 rounded focus:outline-none focus:ring-1 focus:ring-emerald-400 bg-white"
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
                      onClick={() => {
                        if (homeGoalInput.trim()) {
                          handleAddHomeDailyGoal(homeGoalInput);
                          setHomeGoalInput('');
                        }
                      }}
                      className="bg-[#22c55e] border border-[#2a2a2a] text-black px-3 py-1 text-xs font-extrabold rounded hover:bg-emerald-400"
                    >
                      Add
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 p-2 rounded text-center">
                  ✨ Perfect! You're tracking 3 active habits. Tap a habit to toggle it daily!
                </div>
              )}
            </div>

            {/* SIMULATED MINIMAL HOME SCREEN 2X2 WIDGET DISPLAY */}
            <div className="bg-white border-2 border-[#2a2a2a] rounded-xl p-4 flex items-center justify-between shadow-xs select-none">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-stone-400 tracking-wider uppercase">HOME SCREEN COMPACT WIDGET</span>
                <div className="border border-[#2a2a2a] w-36 p-3 rounded bg-white text-left space-y-1">
                  <span className="text-base font-black text-[#0a0a0a]">Day {currentDayXOfChallenge}</span>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] text-[#22c55e] font-extrabold">{getCurrentRankName(state.totalFocusedMinutes).toUpperCase()}</span>
                    <span
                      className={`w-2.5 h-2.5 rounded-full border border-black ${
                        isCompletedTodayValue ? 'bg-[#22c55e]' : 'bg-white'
                      }`}
                    ></span>
                  </div>
                </div>
              </div>
              <div className="w-1/2 text-right pl-3">
                <p className="text-xs font-bold text-[#0a0a0a]">Mini Widget setup</p>
                <p className="text-[10px] text-[#1a1a1a]/60 font-semibold leading-tight">add to smartphone home to track checklist pulse daily at one glance.</p>
              </div>
            </div>

            {/* MILESTONE MANUAL TRIGGER CHIPS (FOR DECK AND TESTING OUT OUTCOMES) */}
            <div className="space-y-2 select-none">
              <span className="text-[9px] font-bold text-stone-400 tracking-wider uppercase">ACHIEVEMENT MILESTONE GENERATORS</span>
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
                    onClick={() => triggerShareMilestone(m.title)}
                    className="text-[9px] font-bold uppercase p-1.5 border border-stone-300 rounded bg-white hover:bg-[#f5f5f5]"
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
            onUnlockExecutive={handleJoinExecutive}
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
            onJoinExecutive={handleJoinExecutive}
            onPurchaseCharacterBix={handlePurchaseCharacterBix}
            onPurchaseCharacterCash={handlePurchaseCharacterCash}
            onPurchaseRoomBix={handlePurchaseRoomBix}
            onPurchaseRoomCash={handlePurchaseRoomCash}
            onBuyBundleCharacters={handleBuyBundleCharacters}
            onBuyBundleRooms={handleBuyBundleRooms}
            onGiveTip={handleGiveTip}
            onPurchaseRoomItemBix={handlePurchaseRoomItemBix}
            onPurchaseRoomItemCash={handlePurchaseRoomItemCash}
            onToggleRoomItem={handleToggleRoomItem}
          />
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6 select-none">
            <h1 className="text-lg font-black text-[#0a0a0a] uppercase tracking-wider">CLUB SETTINGS</h1>
            
            <div className="bg-white border-2 border-[#2a2a2a] p-5 rounded-xl space-y-5">
              
              {/* Duration selector configuration */}
              <div className="space-y-1">
                <label className="text-xs font-black text-[#1a1a1a]/70 uppercase tracking-widest">Default focus timer</label>
                <div className="grid grid-cols-4 gap-2">
                  {[10, 25, 50, 90].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => {
                        saveState({ ...state, settings: { ...state.settings, durationDefault: mins } });
                        setTimerDuration(mins);
                        setTimeLeft(mins * 60);
                      }}
                      className={`py-2 text-xs font-bold rounded border ${
                        state.settings.durationDefault === mins
                          ? 'bg-[#22c55e] border-[#2a2a2a] text-[#0a0a0a]'
                          : 'bg-white border-[#eeeeee] text-[#1a1a1a]/60'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>

              {/* Break duration config */}
              <div className="space-y-1">
                <label className="text-xs font-black text-[#1a1a1a]/70 uppercase tracking-widest">Break Timer duration</label>
                <div className="grid grid-cols-4 gap-2">
                  {[0, 5, 10, 15].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => {
                        saveState({ ...state, settings: { ...state.settings, breakTimer: mins } });
                      }}
                      className={`py-2 text-xs font-bold rounded border ${
                        state.settings.breakTimer === mins
                          ? 'bg-[#22c55e] border-[#2a2a2a] text-[#0a0a0a]'
                          : 'bg-white border-[#eeeeee] text-[#1a1a1a]/60'
                      }`}
                    >
                      {mins === 0 ? 'off' : `${mins}m`}
                    </button>
                  ))}
                </div>
              </div>



              {/* Daily reminder nudge label */}
              <div className="space-y-1 border-t border-[#eeeeee] pt-4">
                <p className="text-sm font-semibold text-[#0a0a0a]">daily nudge: we'll remind {state.username} to show up</p>
                <input
                  type="text"
                  value={state.settings.dailyReminderTime}
                  onChange={(e) => {
                    saveState({
                      ...state,
                      settings: { ...state.settings, dailyReminderTime: e.target.value },
                    });
                  }}
                  className="w-full bg-[#f5f5f5] p-2 border border-[#2a2a2a] rounded font-mono text-center text-xs"
                />
              </div>

              {/* Challenge length change triggers */}
              <div className="space-y-1 border-t border-[#eeeeee] pt-4">
                <label className="text-xs font-black text-[#1a1a1a]/70 uppercase tracking-widest">Select challenge span</label>
                <div className="grid grid-cols-3 gap-2">
                  {[21, 75, 365].map((len) => (
                    <button
                      key={len}
                      onClick={() => {
                        setPendingChallengeLength(len as ChallengeLength);
                        setShowChallengeSwitchDialog(true);
                      }}
                      className={`py-2.5 text-xs font-bold rounded border ${
                        state.challengeLength === len
                          ? 'bg-[#22c55e] border-[#2a2a2a] text-[#0a0a0a]'
                          : 'bg-white border-[#eeeeee] text-[#1a1a1a]/60'
                      }`}
                    >
                      {len} Days
                    </button>
                  ))}
                </div>
              </div>

              {/* Subscription management & mock billing triggers */}
              <div className="pt-4 border-t border-[#eeeeee] flex flex-col space-y-2">
                <button
                  id="restore-purchases-settings"
                  onClick={() => {
                    alert("Mock Transaction: App Store Purchases Restored successfully!");
                  }}
                  className="w-full py-2.5 bg-white border border-[#2a2a2a] text-xs font-bold uppercase rounded-lg hover:bg-[#f5f5f5]"
                >
                  restore purchases
                </button>
                <button
                  id="manage-sub-settings"
                  onClick={() => {
                    const confirmCancel = window.confirm("Are you sure you want to cancel your Progress Club subscription?");
                    if (confirmCancel) {
                      alert(`sorry to see you go! your progress is always saved, ${state.username}.`);
                    }
                  }}
                  className="w-full text-center text-xs text-stone-400 hover:text-black uppercase font-bold py-2 hover:underline"
                >
                  cancel subscription
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* HORIZONTAL TABS ACTIVE BAR CONTROLLER */}
      {activeOverlay === 'none' && (
        <nav className="fixed bottom-0 z-30 w-full max-w-md bg-white border-t-2 border-[#2a2a2a] grid grid-cols-5 h-16 select-none" id="applet-tabs-bar">
          {[
            { id: 'home', label: 'ROOM', icon: '🏠' },
            { id: 'stats', label: 'STATS', icon: '📊' },
            { id: 'office', label: 'CABIN', icon: '⛺' },
            { id: 'shop', label: 'SHOP', icon: '🛒' },
            { id: 'settings', label: 'GEAR', icon: '⚙️' },
          ].map((tab) => {
            const isSel = activeTab === tab.id;
            // Check if shop green dot affordable nudge is active
            const showShopDot = tab.id === 'shop' && showBixNudgeBanner;
            return (
              <button
                key={tab.id}
                id={`tab-navlink-${tab.id}`}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex flex-col items-center justify-center relative cursor-pointer ${
                  isSel ? 'text-[#22c55e] bg-stone-50' : 'text-[#1a1a1a]/75 hover:bg-stone-50/50'
                }`}
              >
                {showShopDot && (
                  <span className="absolute top-2 right-6 w-2.5 h-2.5 bg-[#22c55e] border border-black rounded-full animate-ping"></span>
                )}
                <span className="text-lg leading-none">{tab.icon}</span>
                <span className="text-[9px] font-bold tracking-widest mt-1 uppercase">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      )}

      {/* OVERLAY MODALS REGION */}

      {/* 1. Onboarding Overlay */}
      {activeOverlay === 'onboarding' && (
        <div className="fixed inset-0 z-50 bg-white flex items-center justify-center p-4">
          <Onboarding onComplete={handleOnboardingComplete} />
        </div>
      )}

      {/* 2. Journaling Post Session Overlay */}
      {activeOverlay === 'journaling' && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col justify-between p-6">
          <div className="text-left mt-10">
            <span className="text-xs font-bold text-[#1a1a1a]/45 uppercase tracking-widest">SESSION COMPLETE HABIT LOG</span>
            <h1 className="text-3xl font-black text-[#0a0a0a] uppercase tracking-tight mt-2" id="journal-question-label">
              {currentJournalQuestion}
            </h1>
            
            <div className="mt-8">
              <textarea
                value={journalText}
                onChange={(e) => setJournalText(e.target.value)}
                placeholder="Write your brief thoughts..."
                className="w-full bg-white border-2 border-[#2a2a2a] h-32 p-4 rounded-lg outline-none font-medium text-[#0a0a0a]"
                maxLength={400}
                autoFocus
              ></textarea>
            </div>
          </div>

          <div className="space-y-4">
            <button
              id="save-journal-btn"
              onClick={handleSaveJournal}
              disabled={!journalText.trim()}
              className={`w-full py-4 text-center text-sm font-black uppercase tracking-widest bg-[#22c55e] text-[#0a0a0a] rounded-lg border-2 border-[#2a2a2a] ${
                !journalText.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90 active:scale-95'
              }`}
            >
              Save It
            </button>
            
            <button
              id="skip-journaling-btn"
              onClick={skipJournaling}
              className="w-full text-center text-xs text-stone-400 hover:text-black uppercase font-bold tracking-widest py-1"
            >
              skip for now &rarr;
            </button>
          </div>
        </div>
      )}

      {/* 3. Focus Session Complete celebration screen */}
      {activeOverlay === 'day-complete' && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col justify-between p-6 items-center text-center animate-[fade-in_0.3s_ease-out] overflow-y-auto">
          <div className="mt-8 space-y-3">
            <h1 className="text-3xl font-black text-[#0a0a0a] uppercase tracking-tight" id="session-complete-title">
              SESSION COMPLETED!
            </h1>
            <p className="text-sm font-bold text-stone-500">
              Nice work, {state.username}! You earned <span className="text-[#22c55e] font-black">+{justEarnedBix} Bix</span>{state.currentActiveCharacter === 'monument' ? " (including 2x Monument Double Bix!)" : ""} for focusing {timerDuration} minutes.
            </p>
          </div>

          <div className="my-4 scale-105">
            <CrewCharacter characterId={state.currentActiveCharacter} pose="celebrating" height={140} />
          </div>

          <div className="w-full max-w-sm bg-stone-50 border-2 border-[#2a2a2a] p-5 rounded-2xl space-y-4 shadow-sm mb-6 text-left">
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block">RECHARGE OPPORTUNITY</span>
            <h3 className="text-sm font-black uppercase tracking-wider text-[#0a0a0a] -mt-2">🔋 Start a break timer now?</h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              Step back, stretch your legs, grab some water, and rest your eyes before your next deep work session.
            </p>
            
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                id="accept-break-btn"
                onClick={() => {
                  setTimeLeft((state.settings.breakTimer || 5) * 60);
                  setActiveOverlay('break');
                  setTimerPose('resting');
                }}
                className="py-3 bg-[#22c55e] hover:bg-emerald-400 active:translate-y-px text-black text-xs font-black uppercase tracking-wider rounded-lg border-2 border-[#2a2a2a] shadow-xs cursor-pointer text-center"
              >
                Yes, start break ({state.settings.breakTimer || 5}m)
              </button>
              
              <button
                type="button"
                id="decline-break-btn"
                onClick={() => {
                  setActiveOverlay('none');
                  setTimerPose('idle');
                  setTimeLeft(timerDuration * 60);
                }}
                className="py-3 bg-white hover:bg-stone-100 active:translate-y-px text-black text-xs font-black uppercase tracking-wider rounded-lg border-2 border-[#2a2a2a] cursor-pointer text-center"
              >
                No, keep going
              </button>
            </div>
          </div>

          <div className="mb-4 space-y-0.5">
            <p className="text-xs font-black text-[#22c55e] uppercase tracking-widest">CALENDAR DAY {currentDayXOfChallenge} SECURED !</p>
            <p className="text-[10px] text-stone-400">your stats are updated & synchronized</p>
          </div>
        </div>
      )}

      {/* 4. Challenge Complete congratulations screen */}
      {activeOverlay === 'challenge-complete' && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col justify-between p-6 items-center text-center">
          <div className="mt-12 space-y-4">
            <h1 className="text-4xl font-extrabold text-[#0a0a0a] uppercase tracking-tight" id="challenge-complete-header">
              YOU DID IT, {state.username}!
            </h1>
            <p className="text-lg text-stone-500 font-semibold mb-2">
              we knew you could complete the full {state.challengeLength} day journey!
            </p>
          </div>

          <div className="my-6 scale-110">
            <CrewCharacter characterId={state.currentActiveCharacter} pose="challenge-complete" height={160} />
          </div>

          <div className="space-y-3 w-full max-w-xs mb-10">
            <button
              id="continue-challenge-complete"
              onClick={() => {
                setActiveOverlay('none');
                setTimerPose('idle');
                setTimeLeft(timerDuration * 60);
              }}
              className="w-full py-4 text-center text-sm font-black uppercase bg-[#22c55e] text-[#0a0a0a] rounded-lg border-2 border-[#2a2a2a] cursor-pointer"
            >
              Keep Going!
            </button>
            
            <button
              id="share-challenge-complete"
              onClick={() => {
                const shareStr = `I did it! I completed the full ${state.challengeLength} Days challenge on #ProgressClub !`;
                navigator.clipboard.writeText(shareStr);
                alert("Challenge accomplishment copied:\n" + shareStr);
              }}
              className="w-full py-3.5 bg-white text-black text-xs font-bold uppercase rounded-lg border-2 border-[#2a2a2a] cursor-pointer"
            >
              Share
            </button>
          </div>
        </div>
      )}

      {/* 5. Rank Up screen */}
      {activeOverlay === 'rank-up' && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col justify-between p-6 text-center items-center">
          <div className="mt-20 space-y-3">
            <span className="text-xs text-stone-400 uppercase font-bold tracking-widest">CLUB RANK ACHIEVEMENT</span>
            <h1 className="text-4xl font-black text-[#0a0a0a] uppercase tracking-tight">
              LEVEL UP !
            </h1>
            <p className="text-lg text-[#22c55e] font-black uppercase">
              {rankUpName} MEMBER
            </p>
            <p className="text-sm text-stone-500">
              you leveled up, {state.username}! your new status deserves respect in the lobby.
            </p>
          </div>

          <div className="my-6">
            <CrewCharacter characterId={state.currentActiveCharacter} pose="celebrating" height={145} />
          </div>

          <button
            id="dismiss-rankup-btn"
            onClick={() => setActiveOverlay('none')}
            className="w-full max-w-xs py-4 bg-[#22c55e] text-[#0a0a0a] text-sm font-black uppercase rounded-lg border-2 border-[#2a2a2a] mb-12"
          >
            Keep Going!
          </button>
        </div>
      )}

      {/* 6. Milestone Manual/Automatic Share Card Overlay */}
      {activeOverlay === 'milestone' && (
        <div className="fixed inset-0 z-40 bg-white flex flex-col justify-between p-6 items-center">
          <div className="text-left w-full">
            <button
              id="close-milestone"
              onClick={() => setActiveOverlay('none')}
              className="text-stone-400 hover:text-black font-extrabold text-xs uppercase cursor-pointer"
            >
              &larr; BACK
            </button>
          </div>

          {/* Simulated 9:16 TikTok Card */}
          <div className="w-72 h-96 bg-white border-4 border-[#2a2a2a] rounded-xl flex flex-col justify-between p-6 shadow-md relative select-none">
            {/* Confetti decoration */}
            <div className="absolute inset-0 bg-[#22c55e]/5 pointer-events-none rounded-lg"></div>
            
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">DAY ELAPSED</span>
              <h1 className="text-3xl font-black text-[#0a0a0a] uppercase tracking-tighter">
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

            <div className="border-t border-[#eeeeee] pt-3 flex justify-between items-center text-[10px] font-bold text-[#1a1a1a]/65">
              <span>PROGRESS CLUB</span>
              <span>EST. 2026</span>
            </div>
          </div>

          {/* Action trigger buttons */}
          <div className="space-y-3 w-full max-w-xs mb-6">
            <button
              id="save-camera-roll"
              onClick={() => {
                alert("Simulated: Milestone Card successfully rendered & stored to your Local Photo Album / Camera Roll!");
              }}
              className="w-full py-3.5 bg-[#22c55e] text-[#0a0a0a] text-xs font-black uppercase rounded-lg border border-[#2a2a2a] cursor-pointer"
            >
              Save to Camera Roll
            </button>
            <button
              id="share-button-milestone"
              onClick={() => {
                const quoteText = `Focus milestone unlocked: ${activeMilestoneText} focused! Showing up is everything. #ProgressClub`;
                navigator.clipboard.writeText(quoteText);
                alert(`Share template copied:\n"${quoteText}"`);
              }}
              className="w-full py-3 text-black text-xs font-bold uppercase tracking-wider rounded-lg border border-[#2a2a2a] cursor-pointer"
            >
              Share Details
            </button>
          </div>
        </div>
      )}

      {/* 7. Warm Break timer overlay */}
      {activeOverlay === 'break' && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col justify-between p-6 items-center text-center animate-[fade-in_0.3s_ease-out]">
          <div className="mt-20 space-y-3">
            <h1 className="text-3xl font-black text-[#0a0a0a] uppercase tracking-tight">
              TAKE A BREATHER, {state.username}!
            </h1>
            <p className="text-sm text-stone-500 font-semibold">
              nice work! you earned your break. step back, grab some water, stretch your legs.
            </p>
          </div>

          <div className="my-8 scale-105">
            <CrewCharacter characterId={state.currentActiveCharacter} pose="idle" height={140} />
          </div>

          <div className="mb-14 space-y-3 w-full max-w-xs">
            {/* Simulated break countdown */}
            <p className="text-xs font-extrabold text-stone-400 capitalize">remaining break interval time</p>
            <p className="text-4xl font-black text-[#22c55e] font-mono select-none">
              {formatTimeStr(timeLeft)}
            </p>
            
            <button
              id="finish-break-early"
              onClick={() => {
                setActiveOverlay('none');
                setTimerPose('idle');
                setTimeLeft(timerDuration * 60);
              }}
              className="w-full py-3.5 bg-white border-2 border-[#2a2a2a] text-xs font-black uppercase rounded shadow-xs"
            >
              skip break early
            </button>
          </div>
        </div>
      )}

      {/* 8. Challenge Length Change Warm Confirmation Modal Dialog */}
      {showChallengeSwitchDialog && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 select-none">
          <div className="bg-white border-2 border-[#2a2a2a] p-6 rounded-xl max-w-sm w-full space-y-4 text-center">
            <h3 className="text-base font-black text-[#0a0a0a] uppercase">ready to switch things up?</h3>
            <p className="text-xs text-[#1a1a1a]/75 lead-normal">
              switching to {pendingChallengeLength} Days resets the challenge offset index. but your streak shield history and completed cumulative days are always saved, {state.username}!
            </p>

            <div className="flex gap-2.5 pt-2">
              <button
                id="cancel-switch-btn"
                onClick={() => setShowChallengeSwitchDialog(false)}
                className="flex-1 py-2 bg-white border border-[#2a2a2a] text-xs font-bold uppercase rounded"
              >
                No, Keep
              </button>
              <button
                id="confirm-switch-btn"
                onClick={() => {
                  saveState({
                    ...state,
                    challengeLength: pendingChallengeLength,
                    challengeStartDate: getLocalDateString(), // sets new start day
                  });
                  setShowChallengeSwitchDialog(false);
                  alert(`Challenge trajectory shifted to ${pendingChallengeLength} Days. Stay focused, stay bold!`);
                }}
                className="flex-grow py-2.5 bg-[#22c55e] text-[#0a0a0a] text-xs font-black uppercase rounded border border-[#2a2a2a]"
              >
                Yes, Change
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
