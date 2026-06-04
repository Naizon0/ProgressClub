import React, { useState } from 'react';
import { AppState } from '../types';
import { RANKS } from '../data';
import CrewCharacter from './CrewCharacter';

// Helper: Get local Date string as YYYY-MM-DD
function getLocalDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper: Calculate streak of completed days – allows 1 missed day without breaking/ending the streak (Grace Days are Active)
function getChallengeStreak(completedDates: string[]): number {
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

// Helper: Get offset date
function getDateForOffset(startDateStr: string, offsetDays: number): string {
  if (!startDateStr) return '';
  const d = new Date(startDateStr + 'T12:00:00'); // Midday to avoid timezone shifting
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface StatsViewProps {
  state: AppState;
  onUnlockExecutive: () => void;
  onOpenShop: () => void;
  onAddJournalEntry?: (question: string, answer: string) => void;
}

export const StatsView: React.FC<StatsViewProps> = ({
  state,
  onUnlockExecutive,
  onOpenShop,
  onAddJournalEntry,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'tracker' | 'journal'>('overview');
  const [friendCodeInput, setFriendCodeInput] = useState('');
  const [rivalCode, setRivalCode] = useState('');
  const [rivalData, setRivalData] = useState<{
    name: string;
    day: number;
    rank: string;
    charId: string;
    sessionsThisWeek: number;
  } | null>(null);

  const [customPrompt, setCustomPrompt] = useState('');
  const [customReflection, setCustomReflection] = useState('');
  const [isSavedNote, setIsSavedNote] = useState(false);

  // Compute stats helper
  const totalFocusedHours = parseFloat((state.totalFocusedMinutes / 60).toFixed(1));
  const completedDaysCount = state.completedDates.length;

  // Let's find current rank
  const getCurrentRank = () => {
    const rank = RANKS.find((r) => totalFocusedHours >= r.minHours && totalFocusedHours < r.maxHours);
    return rank || RANKS[0];
  };

  const getNextRank = () => {
    const currentIndex = RANKS.findIndex((r) => totalFocusedHours >= r.minHours && totalFocusedHours < r.maxHours);
    if (currentIndex >= 0 && currentIndex < RANKS.length - 1) {
      return RANKS[currentIndex + 1];
    }
    return null;
  };

  const currentRank = getCurrentRank();
  const nextRank = getNextRank();

  // Rank progress calculation
  const getRankProgressPercent = () => {
    if (!nextRank) return 100;
    const range = nextRank.minHours - currentRank.minHours;
    const progress = totalFocusedHours - currentRank.minHours;
    return Math.min(100, Math.max(0, Math.round((progress / range) * 100)));
  };

  // Plain text share stats utility
  const handleCopyStats = () => {
    const textOutput = `${state.totalSessionsCompleted} sessions. ${totalFocusedHours} hours. Day ${completedDaysCount} of ${state.challengeLength}. ${currentRank.name} member. #ProgressClub`;
    navigator.clipboard.writeText(textOutput);
    alert("Stats copied to clipboard:\n" + textOutput);
  };

  // Generate a random mock 6-character code
  const getMyRivalryCode = () => {
    const codeBase = (state.username || 'CLUB').substring(0, 3).toUpperCase();
    return `${codeBase}${state.challengeLength}`;
  };

  // Handle connecting to a friend code
  const handleConnectRivalry = (e: React.FormEvent) => {
    e.preventDefault();
    if (friendCodeInput.trim().length >= 4) {
      setRivalCode(friendCodeInput.trim().toUpperCase());
      // Make a cute randomized friend based on the code entered
      setRivalData({
        name: friendCodeInput.toUpperCase().substring(0, 4) + 'y',
        day: Math.max(1, Math.floor(Math.random() * 15) + (state.streakShields * 3)),
        rank: 'Dedicated',
        charId: ['frost', 'blaze', 'ember', 'mantis', 'volt'][Math.floor(Math.random() * 5)],
        sessionsThisWeek: Math.floor(Math.random() * 7) + 2,
      });
      setFriendCodeInput('');
    }
  };

  // Render weekly bar chart using pure SVGs so we don't depend on uninstalled charting libs
  const renderWeeklyChart = () => {
    // We compute mock bar values based on totalSessionsCompleted
    const bars = [
      { day: 'Mon', count: Math.min(4, Math.floor(state.totalSessionsCompleted / 6) + 1) },
      { day: 'Tue', count: Math.min(4, Math.floor(state.totalSessionsCompleted / 4)) },
      { day: 'Wed', count: Math.max(1, Math.min(4, state.totalSessionsCompleted % 3)) },
      { day: 'Thu', count: Math.min(4, Math.floor(state.totalSessionsCompleted / 5) + 2) },
      { day: 'Fri', count: Math.min(4, Math.floor(state.totalSessionsCompleted / 3)) },
      { day: 'Sat', count: Math.min(4, Math.floor(state.totalSessionsCompleted / 4) + 1) },
      { day: 'Sun', count: Math.min(4, Math.floor(state.totalFocusedMinutes / 40)) },
    ];

    const maxCount = 5;

    return (
      <div className="bg-white border-2 border-[#2a2a2a] p-4 rounded-lg">
        <h4 className="text-xs font-bold tracking-widest text-[#0a0a0a] uppercase mb-4">WEEKLY CONCENTRATION PACE</h4>
        <div className="flex justify-between items-end h-32 px-2">
          {bars.map((bar, idx) => {
            const hPercent = (bar.count / maxCount) * 100;
            return (
              <div key={idx} className="flex flex-col items-center flex-grow space-y-2">
                <span className="text-[10px] font-bold text-[#1a1a1a]/40">{bar.count}</span>
                <div className="w-6 bg-[#eeeeee] rounded-t-xs border border-b-0 border-[#2a2a2a] h-20 relative flex items-end">
                  <div
                    className="w-full bg-[#22c55e] border-t border-[#2a2a2a]"
                    style={{ height: `${Math.max(15, hPercent)}%` }}
                  ></div>
                </div>
                <span className="text-[10px] font-bold text-[#0a0a0a]">{bar.day}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Challenge grid rendering
  const renderChallengeGrid = () => {
    const daysTotal = state.challengeLength;
    const totalBoxes = daysTotal;

    // Use current date
    const todayStr = getLocalDateString();

    return (
      <div className="bg-white border-2 border-[#2a2a2a] p-4 rounded-lg space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-[#f5f5f5] p-2.5 border border-[#2a2a2a] gap-1.5">
          <p className="text-xs font-bold uppercase tracking-wider">{state.username}'S CALENDAR PROGRESS</p>
          <div className="flex items-center space-x-2 text-xs font-extrabold">
            <span className="text-stone-500 uppercase">{completedDaysCount} Days Completed</span>
            <span className="text-stone-300">•</span>
            <span className="text-amber-500 uppercase flex items-center space-x-0.5">
              <span>🔥</span>
              <span>{getChallengeStreak(state.completedDates)} DAY STREAK</span>
            </span>
          </div>
         </div>

        <div className="overflow-y-auto max-h-72 border border-[#eeeeee] p-2 rounded">
          <div className="grid grid-cols-7 gap-1.5 justify-items-center">
            {[...Array(totalBoxes)].map((_, i) => {
              const dayIndex = i + 1;
              const targetDateStr = state.challengeStartDate ? getDateForOffset(state.challengeStartDate, i) : '';
              
              const isCompleted = targetDateStr ? state.completedDates.includes(targetDateStr) : false;
              const isCurrent = targetDateStr ? (targetDateStr === todayStr) : (i === 0);
              const isPast = targetDateStr ? (targetDateStr < todayStr) : false;
              const isMissed = isPast && !isCompleted;
              
              // Shield mapping (shows a protective shield if missed and has streak shields available)
              const isShielded = isMissed && state.streakShields > 0 && (i % 3 === 1); 

              return (
                <div
                  key={i}
                  className={`w-9 h-9 border-2 flex flex-col items-center justify-between py-1 text-[10px] font-bold rounded-sm transition-all relative ${
                    isCompleted
                      ? 'bg-[#22c55e] border-[#2a2a2a] text-white'
                      : isCurrent
                      ? 'bg-white border-[#22c55e] text-[#22c55e] animate-pulse'
                      : isShielded
                      ? 'bg-amber-100 border-[#2a2a2a] text-[#854d0e]'
                      : isMissed
                      ? 'bg-rose-50 border-dashed border-[#e11d48] text-[#e11d48]'
                      : 'bg-white border-[#2a2a2a] text-[#1a1a1a]/40 hover:bg-[#f5f5f5]'
                  }`}
                  title={targetDateStr ? `Day ${dayIndex} (${targetDateStr})` : `Day ${dayIndex}`}
                >
                  <span className="text-[9px] leading-tight">{dayIndex}</span>
                  {isShielded ? (
                    <span className="text-[10px] leading-tight" title="Protected by Streak Shield">🛡️</span>
                  ) : isCurrent ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" title="Today's Target Day"></span>
                  ) : isMissed ? (
                    <span className="text-[8px] font-black leading-tight" title="Missed day">❌</span>
                  ) : isCompleted ? (
                    <span className="text-[9px] font-black leading-tight">✓</span>
                  ) : (
                    <span className="h-1.5"></span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-around text-[9px] text-[#1a1a1a]/70 block border-t border-[#eeeeee] pt-2 flex-wrap gap-1">
          <div className="flex items-center space-x-1">
            <div className="w-2.5 h-2.5 bg-[#22c55e] rounded-sm border border-[#2a2a2a]"></div>
            <span>Complete</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2.5 h-2.5 bg-white border-2 border-[#22c55e] rounded-sm"></div>
            <span>Today</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2.5 h-2.5 bg-rose-50 border border-dashed border-[#e11d48] rounded-sm"></div>
            <span>Missed</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2.5 h-2.5 bg-amber-100 border border-[#2a2a2a] rounded-sm flex items-center justify-center text-[7px]">🛡️</div>
            <span>Shielded</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2.5 h-2.5 bg-white border border-[#2a2a2a] rounded-sm"></div>
            <span>Locked</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 w-full max-w-md mx-auto">
      {/* Scoreboard Heroes Numbers */}
      <div className="bg-white border-2 border-[#2a2a2a] rounded-xl p-5 shadow-sm text-center space-y-4">
        <h2 className="text-xs font-black tracking-widest text-[#1a1a1a]/60 uppercase">CORE STATS SCOREBOARD</h2>
        
        <div className="grid grid-cols-3 gap-2 py-2">
          <div className="border border-[#2a2a2a] p-3 rounded-lg bg-[#f5f5f5]">
            <p className="text-2xl font-black text-[#0a0a0a]">{state.totalSessionsCompleted}</p>
            <p className="text-[10px] font-bold text-[#1a1a1a]/60 uppercase tracking-widest mt-1">SESSIONS</p>
          </div>
          <div className="border border-[#2a2a2a] p-3 rounded-lg bg-[#f5f5f5]">
            <p className="text-2xl font-black text-[#0a0a0a]">{totalFocusedHours}</p>
            <p className="text-[10px] font-bold text-[#1a1a1a]/60 uppercase tracking-widest mt-1">HOURS</p>
          </div>
          <div className="border border-[#2a2a2a] p-3 rounded-lg bg-[#f5f5f5]">
            <p className="text-2xl font-black text-[#0a0a0a]">{completedDaysCount}</p>
            <p className="text-[10px] font-bold text-[#1a1a1a]/60 uppercase tracking-widest mt-1">DAYS IN</p>
          </div>
        </div>

        <button
          id="copy-stats-btn"
          onClick={handleCopyStats}
          className="w-full py-2.5 bg-[#22c55e] text-[#0a0a0a] text-xs font-bold uppercase tracking-widest rounded-lg border border-[#2a2a2a] hover:opacity-90 active:scale-95 transition-all cursor-pointer"
        >
          Copy stats
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-2 border-[#2a2a2a] rounded-xl overflow-hidden bg-white">
        {(['overview', 'tracker', 'journal'] as const).map((tab) => (
          <button
            key={tab}
            id={`tab-btn-${tab}`}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-all ${
              activeTab === tab
                ? 'bg-[#22c55e] text-[#0a0a0a]'
                : 'bg-white text-[#1a1a1a]/70 hover:bg-[#f5f5f5]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview tab content */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Rank Up Progress Card */}
          <div className="bg-white border-2 border-[#2a2a2a] p-5 rounded-xl space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-xs text-[#1a1a1a]/60 uppercase font-black">Current Rank:</span>
                <p className="text-xl font-extrabold text-[#22c55e] tracking-tight">{currentRank.name}</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-[#1a1a1a]/60 uppercase font-black">Hours Spent:</span>
                <p className="text-sm font-bold text-[#0a0a0a]">{totalFocusedHours}</p>
              </div>
            </div>

            {/* Rank progress bar */}
            {nextRank ? (
              <div className="space-y-1.5">
                <div className="w-full h-3 bg-[#eeeeee] rounded-full border border-[#2a2a2a] overflow-hidden">
                  <div
                    className="h-full bg-[#22c55e] transition-all duration-500"
                    style={{ width: `${getRankProgressPercent()}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] font-bold text-[#1a1a1a]/60">
                  <span>Progress to {nextRank.name}</span>
                  <span>{getRankProgressPercent()}%</span>
                </div>
              </div>
            ) : (
              <p className="text-xs font-bold text-[#22c55e]">Maximum Club Rank Obtained!</p>
            )}
          </div>

          {/* PACE Overview stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-[#2a2a2a] p-4 rounded-xl text-center space-y-1">
              <span className="text-[10px] font-bold text-[#1a1a1a]/60 uppercase">FOCUS PACE</span>
              <p className="text-lg font-black text-[#0a0a0a]">
                +{Math.round(state.totalFocusedMinutes / Math.max(1, completedDaysCount))} min
              </p>
              <p className="text-[9px] text-[#1a1a1a]/50">average focused daily</p>
            </div>
            <div className="bg-white border border-[#2a2a2a] p-4 rounded-xl text-center space-y-1">
              <span className="text-[10px] font-bold text-[#1a1a1a]/60 uppercase">DEEP WORK SCORE</span>
              <p className="text-lg font-black text-[#22c55e]">
                {Math.min(100, Math.floor(state.totalSessionsCompleted * 6.5 + state.totalFocusedMinutes / 20))}
              </p>
              <p className="text-[9px] text-[#1a1a1a]/50">based on focus quality</p>
            </div>
          </div>

          {/* SVG bar chart */}
          {renderWeeklyChart()}

          {/* Friendly crew upsell card */}
          <div className="bg-white border-2 border-[#2a2a2a] p-4 rounded-xl flex items-center justify-between">
            <div className="space-y-1 w-3/5">
              <h4 className="text-xs font-black text-[#0a0a0a] uppercase tracking-wider">Meet the crew!</h4>
              <p className="text-xs text-[#1a1a1a]/70">this one would love to join your club roster.</p>
              <button
                id="view-crew-upsell-btn"
                onClick={onOpenShop}
                className="mt-2 text-xs font-bold text-[#22c55e] hover:underline cursor-pointer"
              >
                Go to Shop &rarr;
              </button>
            </div>
            <div className="w-1/3 flex justify-end">
              <CrewCharacter characterId="mantis" pose="idle" height={70} />
            </div>
          </div>

          {/* Executive Analytics Lock wall */}
          {!state.isExecutive && (
            <div className="bg-white border-2 border-[#2a2a2a] p-5 rounded-xl text-center relative overflow-hidden space-y-3">
              <div className="absolute top-2 right-2 text-xs bg-[#eeeeee] border border-[#2a2a2a] p-1.5 rounded-full">
                🔒
              </div>
              <h4 className="text-sm font-black uppercase text-[#0a0a0a]">EXECUTIVE HABIT FORECAST</h4>
              <p className="text-xs text-[#1a1a1a]/75">
                Unlock multi-month forecasts, productivity curves, and 2x Bix earnings with the Executive Pass.
              </p>
              <button
                id="analytics-unlock-btn"
                onClick={onUnlockExecutive}
                className="w-full py-2.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-[#0a0a0a] text-xs font-black uppercase tracking-widest rounded border border-[#2a2a2a] hover:opacity-95 shadow active:translate-y-px transition-all cursor-pointer"
              >
                unlock executive tier
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tracker tab content */}
      {activeTab === 'tracker' && (
        <div className="space-y-4">
          {renderChallengeGrid()}
          
          <div className="bg-white border-2 border-[#2a2a2a] p-5 rounded-xl space-y-4">
            <h4 className="text-xs font-black tracking-widest text-[#0a0a0a] uppercase">Friendly Rivalry Duel</h4>
            <p className="text-xs text-[#1a1a1a]/75">
              Share your room profile code with a friend and monitor each other's pace. Settle your scores in the focus arena!
            </p>

            {rivalData ? (
              <div className="border border-[#2a2a2a] rounded-lg p-4 space-y-3 bg-[#fafafa]">
                <div className="flex justify-between items-center text-xs font-bold text-[#1a1a1a]/60 border-b border-[#eeeeee] pb-2">
                  <span>RIVALRY ACTIVE | CODE: {rivalCode}</span>
                  <button
                    id="sever-rivalry-btn"
                    onClick={() => setRivalData(null)}
                    className="text-stone-400 hover:text-black uppercase cursor-pointer"
                  >
                    Disconnect
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 divide-x-2 divide-[#2a2a2a]">
                  {/* Left Side: Me */}
                  <div className="text-center space-y-2">
                    <p className="text-xs font-extrabold text-[#0a0a0a] uppercase">YOU</p>
                    <div className="flex justify-center h-16">
                      <CrewCharacter characterId={state.currentActiveCharacter} pose="idle" height={60} />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-lg font-black text-[#0a0a0a]">Day {completedDaysCount}</p>
                      <p className="text-[10px] font-bold text-[#22c55e] uppercase">{currentRank.name}</p>
                    </div>
                  </div>

                  {/* Right Side: Friend */}
                  <div className="text-center space-y-2 pl-4">
                    <p className="text-xs font-extrabold text-[#0a0a0a] uppercase">{rivalData.name}</p>
                    <div className="flex justify-center h-16">
                      <CrewCharacter characterId={rivalData.charId} pose="idle" height={60} />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-lg font-black text-[#0a0a0a]">Day {rivalData.day}</p>
                      <p className="text-[10px] font-bold text-[#22c55e] uppercase">{rivalData.rank}</p>
                    </div>
                  </div>
                </div>

                <button
                  id="share-rivalry-btn"
                  onClick={() => {
                    const shareText = `${state.username} and their friend are both showing up. Day ${completedDaysCount} vs Day ${rivalData.day}. Join Progress Club!`;
                    navigator.clipboard.writeText(shareText);
                    alert("Rivalry quote copied to clipboard:\n" + shareText);
                  }}
                  className="w-full mt-2 py-2 border-2 border-[#2a2a2a] text-xs font-bold uppercase rounded-lg hover:bg-white cursor-pointer"
                >
                  Share rival score
                </button>
              </div>
            ) : (
              <form onSubmit={handleConnectRivalry} className="space-y-2">
                <div className="flex items-center space-x-2 p-1.5 bg-white border border-[#2a2a2a] rounded-lg">
                  <input
                    type="text"
                    value={friendCodeInput}
                    onChange={(e) => setFriendCodeInput(e.target.value)}
                    placeholder="ENTER FRIEND'S CODE (e.g. MARC21)"
                    maxLength={10}
                    className="flex-grow bg-white outline-none font-bold uppercase text-xs px-2 text-[#0a0a0a]"
                  />
                  <button
                    id="connect-friend-submit"
                    type="submit"
                    className="bg-[#22c55e] text-[#0a0a0a] text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded"
                  >
                    Duel
                  </button>
                </div>
                <div className="flex justify-between items-center text-[11px] text-[#1a1a1a]/65 pt-1 px-1">
                  <span>Your Code: <span className="font-bold text-[#0a0a0a]">{getMyRivalryCode()}</span></span>
                  <button
                    id="copy-my-code-btn"
                    onClick={(e) => {
                      e.preventDefault();
                      navigator.clipboard.writeText(getMyRivalryCode());
                      alert(`Code ${getMyRivalryCode()} copied!`);
                    }}
                    className="underline text-[#22c55e]"
                  >
                    Copy
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Journal tab content */}
      {activeTab === 'journal' && (
        <div className="bg-white border-2 border-[#2a2a2a] p-5 rounded-xl space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-xs font-black tracking-widest text-[#0a0a0a] uppercase my-2">your thoughts along the way</h3>
            <span className="text-[10px] font-bold text-stone-400 bg-stone-50 border border-stone-200 px-2.5 py-0.5 rounded">
              {state.savedJournalEntries.length} Total Entries
            </span>
          </div>

          {/* Quick reflection form allows capturing thoughts anytime */}
          <div className="bg-stone-50 border-2 border-dashed border-stone-300 rounded-xl p-4 space-y-3">
            <div className="flex items-center space-x-1.5">
              <span className="text-sm">✍️</span>
              <span className="text-xs font-extrabold uppercase tracking-wide text-stone-700">Write a Journal Entry Any Time</span>
            </div>
            
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Optional: What is the topic? (e.g. Note to Self, Daily Reflection, Lesson Learned)"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                maxLength={80}
                className="w-full bg-white border-2 border-[#2a2a2a] p-2 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-400 focus:outline-none"
              />
              <textarea
                placeholder="What is on your mind? Document an insight, capture a win, or outline a challenge you're looking to overcome today..."
                value={customReflection}
                onChange={(e) => setCustomReflection(e.target.value)}
                maxLength={500}
                rows={3}
                className="w-full bg-white border-2 border-[#2a2a2a] p-3 rounded-lg text-xs font-medium focus:ring-1 focus:ring-emerald-400 focus:outline-none"
              ></textarea>
              
              <div className="flex justify-between items-center text-[10px] text-stone-400 pb-1">
                <span>{500 - customReflection.length} characters remaining</span>
                <button
                  type="button"
                  disabled={!customReflection.trim()}
                  onClick={() => {
                    if (onAddJournalEntry) {
                      onAddJournalEntry(
                        customPrompt.trim() || "On-Demand Journal Entry",
                        customReflection.trim()
                      );
                      setCustomPrompt('');
                      setCustomReflection('');
                      setIsSavedNote(true);
                      setTimeout(() => setIsSavedNote(false), 3000);
                    }
                  }}
                  className="px-3.5 py-1.5 bg-[#22c55e] text-black border border-[#2a2a2a] font-extrabold text-xs uppercase tracking-wider rounded-md hover:bg-emerald-400 hover:active:translate-y-px disabled:opacity-50 select-none cursor-pointer"
                >
                  Save Entry
                </button>
              </div>
            </div>

            {isSavedNote && (
              <p className="text-xs text-emerald-700 font-extrabold text-center bg-emerald-50 border border-emerald-200 py-1.5 rounded-lg animate-pulse">
                🎉 Entry saved successfully on {getLocalDateString()}!
              </p>
            )}
          </div>
          
          {state.savedJournalEntries.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <span className="text-2xl">📖</span>
              <p className="text-xs text-[#1a1a1a]/60">Your physical journal is clean. Save an entry above anytime to populate it!</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {state.savedJournalEntries.slice().reverse().map((entry, idx) => (
                <div key={idx} className="border-b border-[#eeeeee] pb-4 last:border-0 last:pb-0 space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-bold text-[#1a1a1a]/50">
                    <span>{entry.date}</span>
                    <span>{entry.timestamp}</span>
                  </div>
                  <blockquote className="text-xs font-extrabold text-[#1a1a1a]/70 border-l border-[#22c55e] pl-2 py-0.5">
                    "{entry.question}"
                  </blockquote>
                  <p className="text-sm font-medium text-[#0a0a0a] whitespace-pre-wrap">
                    {entry.answer}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default StatsView;
