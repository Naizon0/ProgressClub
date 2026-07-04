import { CharacterInfo, RoomInfo, RoomItemInfo, AppState } from './types';

export const CHARACTERS: CharacterInfo[] = [
  {
    id: 'cipher',
    name: 'Cipher',
    priceUSD: 0,
    priceBix: 0,
    copy: "nobody knows who you are yet. that's the point.",
    color: '#0a0a0a',
  },
  {
    id: 'blaze',
    name: 'Blaze',
    priceUSD: 2,
    priceBix: 800,
    copy: 'runs hot. focuses hotter.',
    color: '#c2410c', // deep burnt orange
  },
  {
    id: 'frost',
    name: 'Frost',
    priceUSD: 2,
    priceBix: 800,
    copy: 'cool under pressure. always.',
    color: '#e0f2fe', // ice blue-white
  },
  {
    id: 'dusk',
    name: 'Dusk',
    priceUSD: 2,
    priceBix: 800,
    copy: 'does their best work when the world goes quiet.',
    color: '#581c87', // deep purple
  },
  {
    id: 'ember',
    name: 'Ember',
    priceUSD: 2,
    priceBix: 800,
    copy: 'small. fast. unstoppable.',
    color: '#991b1b', // deep crimson red
  },
  {
    id: 'mantis',
    name: 'Mantis',
    priceUSD: 2,
    priceBix: 800,
    copy: 'slow is smooth. smooth is fast.',
    color: '#4ade80', // lighter green
  },
  {
    id: 'volt',
    name: 'Volt',
    priceUSD: 3,
    priceBix: 1200,
    copy: 'moves fast. thinks faster.',
    color: '#eab308', // electric yellow
  },
  {
    id: 'monument',
    name: 'The Monument',
    priceUSD: 4,
    priceBix: -1, // Cannot be purchased with Bix
    copy: 'earned. not bought. well, almost.',
    color: '#fafafa', // stark white (inverse of Cipher)
  },
];

export const ROOMS: RoomInfo[] = [
  {
    id: 'rooftop',
    name: 'Rooftop Garden',
    priceUSD: 0,
    priceBix: 0,
    copy: 'fresh air for fresh ideas.',
  },
  {
    id: 'latenight',
    name: 'Late Night City',
    priceUSD: 3,
    priceBix: 1200,
    copy: 'some of the best work happens when the world is quiet.',
  },
  {
    id: 'cabin',
    name: 'Minimalist Cabin',
    priceUSD: 1,
    priceBix: 400,
    copy: 'cozy focus is still focus.',
  },
  {
    id: 'library',
    name: 'The Library',
    priceUSD: 2,
    priceBix: 800,
    copy: 'every answer you need is in here, including focus.',
  },
  {
    id: 'deepspace',
    name: 'Deep Space',
    priceUSD: 3,
    priceBix: 1200,
    exclusiveExecutive: true,
    copy: "focus that's out of this world.",
  },
  {
    id: 'dojo',
    name: 'The Dojo',
    priceUSD: 2,
    priceBix: 800,
    copy: 'quiet mind. focused work. good results.',
  },
  {
    id: 'diner',
    name: '24/7 Diner',
    priceUSD: 2,
    priceBix: 800,
    copy: 'open all night. just like your ambitions.',
  },
  {
    id: 'penthouse',
    name: 'The Penthouse',
    priceUSD: 4,
    priceBix: 1600,
    copy: "you've earned this view. now earn the rest.",
  },
];

export const ROOM_ITEMS: RoomItemInfo[] = [
  {
    id: 'lava-lamp',
    name: 'Retro Lava Lamp',
    priceUSD: 1,
    priceBix: 300,
    copy: 'slowly rising bubbles to sync with your state of mind.',
    icon: '🔮',
  },
  {
    id: 'soccer-ball',
    name: 'Classic Soccer Ball',
    priceUSD: 1.2,
    priceBix: 350,
    copy: 'classic heavy-stitch size 5 ball. stays right at your feet.',
    icon: '⚽',
  },
  {
    id: 'basketball',
    name: 'Championship Basketball',
    priceUSD: 1.3,
    priceBix: 380,
    copy: 'premium leather ball with high-grip grooves for active focusing.',
    icon: '🏀',
  },
  {
    id: 'gold-trophy',
    name: 'Gold Focus Trophy',
    priceUSD: 2,
    priceBix: 600,
    copy: 'gold is the standard. a shiny emblem on your desk.',
    icon: '🏆',
  },
  {
    id: 'bonsai-tree',
    name: 'Botanical Bonsai Tree',
    priceUSD: 1.5,
    priceBix: 450,
    copy: 'a meticulously pruned symbol of patience and growth.',
    icon: '🪴',
  },
];

export const RANKS = [
  { id: 'newcomer', name: 'Newcomer', minHours: 0, maxHours: 10, copy: 'welcome to the club!' },
  { id: 'regular', name: 'Regular', minHours: 10, maxHours: 25, copy: 'you keep showing up. that matters.' },
  { id: 'dedicated', name: 'Dedicated', minHours: 25, maxHours: 60, copy: 'this is becoming who you are.' },
  { id: 'committed', name: 'Committed', minHours: 60, maxHours: 120, copy: "most people don't get here. you did." },
  { id: 'legend', name: 'Legend', minHours: 120, maxHours: 999999, copy: "the club wouldn't be the same without you." },
];

export const JOURNAL_QUESTIONS = [
  'what went well today?',
  'what are you proud of from this session?',
  'what do you want to remember about today?',
  'one good thing that happened during your focus time.',
  'how did showing up today feel?',
  'what are you looking forward to tomorrow?',
  'what did you do well that you want to keep doing?',
  'describe today in one word.',
  'what would you tell a friend who\'s just starting out?',
  'what made today worth showing up for?',
];

export const INITIAL_STATE: AppState = {
  username: '',
  onboardingCompleted: false,
  onboardingStep: 0,
  quizAnswers: {},
  subscriptionPlan: 'none',
  isExecutive: false,
  bixBalance: 0,
  totalFocusedMinutes: 0,
  totalSessionsCompleted: 0,
  challengeLength: 21,
  challengeStartDate: '',
  completedDates: [],
  savedJournalEntries: [],
  streakShields: 0,
  spentShieldDates: [],
  currentActiveCharacter: 'cipher',
  currentRoom: 'rooftop',
  ownedCharacters: ['cipher'],
  ownedRooms: ['rooftop'],
  ownedItems: [],
  equippedItems: [],
  itemPositions: {},
  settings: {
    durationDefault: 25,
    breakTimer: 5,
    dailyReminderTime: '14:00',
  },
  hasReviewed: false,
  unlockedRanks: ['newcomer'],
  dailyGoals: [],
};
