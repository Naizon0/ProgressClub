export interface QuizAnswers {
  name: string;
  age: string;
  lifeDirection: string;
  currentFeeling: string;
  whyImprove: string;
  whatGetsYouUp: string;
  biggestStruggle: string;
  distractionHours: string;
  valueOfTime: string;
}

export interface JournalEntry {
  date: string; // "YYYY-MM-DD"
  timestamp: string; // "HH:MM" or complete local time
  question: string;
  answer: string;
}

export interface DailyGoal {
  id: string;
  text: string;
  completedDates: string[]; // dates is a list of YYYY-MM-DD
}

export type ChallengeLength = 21 | 75 | 365;

export interface AppState {
  username: string;
  onboardingCompleted: boolean;
  onboardingStep: number; // 0 = welcome, 1 = quiz name, ...
  quizAnswers: Partial<QuizAnswers>;
  subscriptionPlan: 'weekly' | 'monthly' | 'yearly' | 'none';
  isExecutive: boolean;
  bixBalance: number;
  totalFocusedMinutes: number; // to compute total hours (cumulative)
  totalSessionsCompleted: number;
  challengeLength: ChallengeLength;
  challengeStartDate: string; // YYYY-MM-DD
  completedDates: string[]; // List of YYYY-MM-DD strings where at least 1 session was finished
  savedJournalEntries: JournalEntry[];
  streakShields: number; // starts at 0, shield earns at day 7, 14
  spentShieldDates: string[]; // YYYY-MM-DD where shield was consumed
  currentActiveCharacter: string; // e.g. 'cipher'
  currentRoom: string; // e.g. 'rooftop'
  ownedCharacters: string[]; // e.g. ['cipher']
  ownedRooms: string[]; // e.g. ['rooftop']
  ownedItems?: string[];
  equippedItems?: string[];
  itemPositions?: Record<string, { x: number; y: number }>;
  dailyGoals?: DailyGoal[];
  settings: {
    durationDefault: number; // e.g. 25
    breakTimer: number; // e.g. 5
    dailyReminderTime: string; // "14:00"
  };
  hasReviewed: boolean; // App Store prompt review
  unlockedRanks: string[]; // already unlocked rank milestones
}

export interface CharacterInfo {
  id: string;
  name: string;
  priceUSD: number;
  priceBix: number;
  unlockedAtRank?: string;
  copy: string;
  color: string;
}

export interface RoomInfo {
  id: string;
  name: string;
  priceUSD: number;
  priceBix: number;
  exclusiveExecutive?: boolean;
  copy: string;
}

export interface RoomItemInfo {
  id: string;
  name: string;
  priceUSD: number;
  priceBix: number;
  copy: string;
  icon: string;
}

