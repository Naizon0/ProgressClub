import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QuizAnswers, ChallengeLength } from '../types';
import CrewCharacter from './CrewCharacter';

interface OnboardingProps {
  onComplete: (data: {
    username: string;
    quizAnswers: QuizAnswers;
    subscriptionPlan: 'weekly' | 'monthly' | 'yearly';
    recommendedCharacter: string;
    recommendedRoom: string;
    dailyGoals: string[];
  }) => void;
}

const SOCIAL_PROOFS = [
  "Progress Club is designed primarily for students, young professionals, and lifelong learners.",
  "anyone of any age can benefit from building consistent habits.",
  "it's never too early or too late to start showing up."
];

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  // Navigation:
  // section 1: quiz (sub-steps 1-10)
  // section 2: good news
  // section 3: cost of no habits
  // section 4: honest promise
  // section 5: goals
  // section 6: summary & paywall
  const [section, setSection] = useState<'quiz' | 'goodnews' | 'cost' | 'promise' | 'goals' | 'paywall' | 'welcome'>('quiz');
  const [quizStep, setQuizStep] = useState(1);
  const [newsStep, setNewsStep] = useState(1);
  const [costStep, setCostStep] = useState(1);
  const [promiseStep, setPromiseStep] = useState(1);
  const [goalsStep, setGoalsStep] = useState(1);
  const [paywallStep, setPaywallStep] = useState(1); // 1 = summary, 2 = paywall

  // Quiz States
  const [nameInput, setNameInput] = useState('');
  const [greetName, setGreetName] = useState(false);
  const [selectedAge, setSelectedAge] = useState('');
  const [selectedLife, setSelectedLife] = useState('');
  const [selectedFeeling, setSelectedFeeling] = useState('');
  const [selectedWhy, setSelectedWhy] = useState('');
  const [selectedGetsUp, setSelectedGetsUp] = useState('');
  const [selectedStruggle, setSelectedStruggle] = useState('');
  const [selectedDistraction, setSelectedDistraction] = useState('');
  const [selectedValue, setSelectedValue] = useState('');

  // Selected Goals (multi-select)
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [customGoalInput, setCustomGoalInput] = useState('');

  // Selected Plan
  const [selectedPlan, setSelectedPlan] = useState<'weekly' | 'monthly' | 'yearly'>('yearly');

  // Random quotes set once per visit
  const [currentSocialProof, setCurrentSocialProof] = useState('');

  useEffect(() => {
    // Pick one social proof randomly
    const idx = Math.floor(Math.random() * SOCIAL_PROOFS.length);
    setCurrentSocialProof(SOCIAL_PROOFS[idx]);
  }, []);

  // Compute total dynamic distraction hours inside slide 2
  const getComputedAnnualDistractions = () => {
    switch (selectedDistraction) {
      case 'less than 5 hours':
        return 260;
      case '5 to 10 hours':
        return 390;
      case '10 to 20 hours':
        return 780;
      case 'more than 20 hours':
      default:
        return 1040;
    }
  };

  const getDistractionWording = () => {
    switch (selectedDistraction) {
      case 'less than 5 hours':
        return 'less than 5';
      case '5 to 10 hours':
        return '5 to 10';
      case '10 to 20 hours':
        return '10 to 20';
      case 'more than 20 hours':
      default:
        return 'more than 20';
    }
  };

  const getPlacementScore = () => {
    let score = 0;
    
    // Life Direction
    if (selectedLife.includes('building')) score += 3;
    else if (selectedLife.includes('level up')) score += 2;
    else if (selectedLife.includes('finding')) score += 1;
    else if (selectedLife.includes('stuck')) score += 0;

    // Feeling
    if (selectedFeeling.includes('pretty good')) score += 3;
    else if (selectedFeeling.includes('frustrated')) score += 1;
    else if (selectedFeeling.includes('lost')) score += 1;
    else if (selectedFeeling.includes('overwhelmed')) score += 0;

    // Struggle
    if (selectedStruggle.includes('motivation')) score += 2;
    else if (selectedStruggle.includes('consistent')) score += 1;
    else if (selectedStruggle.includes('distractions')) score += 1;
    else if (selectedStruggle.includes('getting started')) score += 0;

    // Distractions
    if (selectedDistraction === 'less than 5 hours') score += 3;
    else if (selectedDistraction === '5 to 10 hours') score += 2;
    else if (selectedDistraction === '10 to 20 hours') score += 1;
    else if (selectedDistraction === 'more than 20 hours') score += 0;

    // Value of time
    if (selectedValue.includes('valuable')) score += 3;
    else if (selectedValue.includes('depends')) score += 2;
    else if (selectedValue.includes('never')) score += 1;
    else if (selectedValue.includes('not much')) score += 0;

    return score;
  };

  const getPlacementPerformanceLabel = (score: number) => {
    if (score >= 12) return 'Laser Focus Expert';
    if (score >= 9) return 'Focused Builder';
    if (score >= 6) return 'Consistent Aspirant';
    return 'Mindful Restorer';
  };

  // Recommendations logic (Based strictly on Placement Test performance!)
  const getRecommendedCharacter = () => {
    const score = getPlacementScore();
    if (score >= 12) return 'volt'; // Volt (Yellow, laser focus)
    if (score >= 9) return 'blaze'; // Blaze (Orange, focused)
    if (score >= 7) return 'ember'; // Ember (Crimson, fast tempo)
    if (score >= 5) return 'frost'; // Frost (Ice, cool consistency)
    return 'mantis'; // Mantis (Lighter-green, slow is smooth steady recovery)
  };

  const getRecommendedRoom = () => {
    if (selectedLife.includes('building')) return 'rooftop';
    if (selectedLife.includes('stuck') || selectedLife.includes('overwhelmed')) return 'cabin';
    if (selectedLife.includes('level up')) return 'penthouse';
    if (selectedLife.includes('finding')) return 'cabin';
    return 'rooftop';
  };

  const getRoomName = (id: string) => {
    switch (id) {
      case 'cabin': return 'Minimalist Cabin';
      case 'penthouse': return 'The Penthouse';
      default: return 'Rooftop Garden';
    }
  };

  const getMotto = () => {
    if (selectedStruggle.includes('staying consistent')) {
      return '"one more day. always one more day."';
    }
    if (selectedStruggle.includes('getting started')) {
      return '"the hardest part is behind you."';
    }
    if (selectedStruggle.includes('distractions')) {
      return '"your attention is your power."';
    }
    return '"discipline outlasts motivation. every time."';
  };

  // On confirmation, triggers callback to parent
  const handleStartJourney = () => {
    const recommendedChar = getRecommendedCharacter();
    const recommendedR = getRecommendedRoom();
    setSection('welcome');
  };

  const handleLetBegin = () => {
    onComplete({
      username: nameInput || 'Friend',
      quizAnswers: {
        name: nameInput || 'Friend',
        age: selectedAge,
        lifeDirection: selectedLife,
        currentFeeling: selectedFeeling,
        whyImprove: '',
        whatGetsYouUp: selectedGetsUp,
        biggestStruggle: selectedStruggle,
        distractionHours: selectedDistraction,
        valueOfTime: selectedValue,
      },
      subscriptionPlan: selectedPlan,
      recommendedCharacter: getRecommendedCharacter(),
      recommendedRoom: getRecommendedRoom(),
      dailyGoals: selectedGoals,
    });
  };

  // Step auto advance animation helper
  const triggerAutoAdvance = (action: () => void) => {
    setTimeout(() => {
      action();
    }, 1200);
  };

  const renderQuizStep = () => {
    switch (quizStep) {
      case 1: // Welcome Screen
        return (
          <div className="flex flex-col flex-1 justify-between p-6">
            <div className="text-left mt-10">
              <span className="text-xs font-black uppercase text-[#22c55e] tracking-widest bg-[#22c55e]/10 px-2.5 py-1 rounded border border-[#22c55e]/25">Focus Placement Test</span>
              <h1 className="text-4xl font-extrabold tracking-tight text-[#0a0a0a] uppercase mb-4 mt-3">
                before we get started.
              </h1>
              <p className="text-lg text-[#1a1a1a]/70">
                we want to evaluate your starting level. take this placement test to find your ideal focus workspace and earn your starting companion character.
              </p>
            </div>
            
            <div className="my-6 flex justify-center">
              <CrewCharacter characterId="cipher" pose="idle" height={150} />
            </div>

            <button
              id="quiz-welcome-next"
              onClick={() => setQuizStep(2)}
              className="w-full py-4 text-center text-sm font-bold uppercase tracking-wider bg-[#22c55e] text-[#0a0a0a] rounded-lg border border-[#2a2a2a] cursor-pointer hover:opacity-90 transition-opacity"
            >
              let's do it
            </button>
          </div>
        );

      case 2: // Name input Screen
        return (
          <div className="flex flex-col flex-1 justify-between p-6">
            <div className="text-left mt-10">
              <h1 className="text-3xl font-extrabold tracking-tight text-[#0a0a0a] uppercase mb-4">
                first things first: what's your name?
              </h1>
              
              {!greetName ? (
                <div className="mt-6">
                  <input
                    id="onboarding-name-input"
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="enter your name"
                    className="w-full bg-white border-2 border-[#2a2a2a] py-3.5 px-4 rounded-lg outline-none text-[#0a0a0a] font-medium"
                    maxLength={30}
                    autoFocus
                  />
                </div>
              ) : (
                <div className="mt-6 space-y-2 animate-pulse">
                  <h2 className="text-2xl font-bold text-[#0a0a0a]">great to meet you, {nameInput}!</h2>
                  <p className="text-[#1a1a1a]/70">let's find out where you're at.</p>
                </div>
              )}
            </div>

            {!greetName && (
              <button
                id="onboarding-name-submit"
                onClick={() => {
                  if (nameInput.trim()) {
                    setGreetName(true);
                    triggerAutoAdvance(() => setQuizStep(3));
                  }
                }}
                disabled={!nameInput.trim()}
                className={`w-full py-4 text-center text-sm font-bold uppercase tracking-wider bg-[#22c55e] text-[#0a0a0a] rounded-lg border border-[#2a2a2a] ${
                  !nameInput.trim() ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-90'
                }`}
              >
                that's me
              </button>
            )}
          </div>
        );

      case 3: // Age screen
        return (
          <div className="flex flex-col flex-1 justify-between p-6">
            <div className="text-left mt-10">
              <h1 className="text-3xl font-extrabold tracking-tight text-[#0a0a0a] uppercase mb-6">
                how old are you, {nameInput}?
              </h1>
              
              <div className="space-y-3">
                {['under 18', '18 to 24', '25 to 34', '35 and above'].map((age) => (
                  <button
                    key={age}
                    id={`age-opt-${age}`}
                    onClick={() => {
                      setSelectedAge(age);
                      triggerAutoAdvance(() => setQuizStep(4));
                    }}
                    className={`w-full p-4 text-left font-medium rounded-lg border transition-all ${
                      selectedAge === age
                        ? 'bg-white border-[#22c55e] border-l-8 text-[#0a0a0a]'
                        : 'bg-white border-[#2a2a2a] text-[#1a1a1a] hover:bg-[#f5f5f5]'
                    }`}
                  >
                    {age}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-[#1a1a1a]/55 text-center italic mt-4">
              {currentSocialProof}
            </div>
          </div>
        );

      case 4: // Life Direction
        return (
          <div className="flex flex-col flex-1 justify-between p-6">
            <div className="text-left mt-10">
              <h1 className="text-2xl font-extrabold tracking-tight text-[#0a0a0a] uppercase mb-6">
                how would you describe where you are in life right now?
              </h1>
              
              <div className="space-y-3">
                {[
                  'finding my footing: still figuring things out',
                  'building: I know what I want, I just need to do it',
                  'stuck: I feel like I\'m not moving forward',
                  'ready to level up: I want more than I have now'
                ].map((life) => (
                  <button
                    key={life}
                    id={`life-opt-${life}`}
                    onClick={() => {
                      setSelectedLife(life);
                      triggerAutoAdvance(() => setQuizStep(5));
                    }}
                    className={`w-full p-4 text-left font-medium rounded-lg border transition-all ${
                      selectedLife === life
                        ? 'bg-white border-[#22c55e] border-l-8 text-[#0a0a0a]'
                        : 'bg-white border-[#2a2a2a] text-[#1a1a1a] hover:bg-[#f5f5f5]'
                    }`}
                  >
                    {life}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 5: // Current Feeling
        return (
          <div className="flex flex-col flex-1 justify-between p-6">
            <div className="text-left mt-10">
              <h1 className="text-2xl font-extrabold tracking-tight text-[#0a0a0a] uppercase mb-6">
                honestly: how do you feel about where your life is headed right now?
              </h1>
              
              <div className="space-y-3">
                {[
                  'pretty good, but I know I could do more',
                  'frustrated, I keep starting over',
                  'overwhelmed, there\'s too much and I do none of it',
                  'lost, I\'m not sure what I\'m working toward'
                ].map((feel) => (
                  <button
                    key={feel}
                    id={`feel-opt-${feel}`}
                    onClick={() => {
                      setSelectedFeeling(feel);
                      triggerAutoAdvance(() => setQuizStep(6));
                    }}
                    className={`w-full p-4 text-left font-medium rounded-lg border transition-all ${
                      selectedFeeling === feel
                        ? 'bg-white border-[#22c55e] border-l-8 text-[#0a0a0a]'
                        : 'bg-white border-[#2a2a2a] text-[#1a1a1a] hover:bg-[#f5f5f5]'
                    }`}
                  >
                    {feel}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 6: // Biggest Struggle
        return (
          <div className="flex flex-col flex-1 justify-between p-6">
            <div className="text-left mt-10">
              <h1 className="text-2xl font-extrabold tracking-tight text-[#0a0a0a] uppercase mb-6">
                what do you struggle with most, {nameInput}?
              </h1>
              
              <div className="space-y-3">
                {[
                  "staying consistent: I start strong and fade",
                  "getting started: the first step is the hardest",
                  "distractions: my phone and my environment own me",
                  "motivation: I know what to do, I just don't do it"
                ].map((struggle) => (
                  <button
                    key={struggle}
                    id={`struggle-opt-${struggle}`}
                    onClick={() => {
                      setSelectedStruggle(struggle);
                      triggerAutoAdvance(() => setQuizStep(7));
                    }}
                    className={`w-full p-4 text-left font-medium rounded-lg border transition-all ${
                      selectedStruggle === struggle
                        ? 'bg-white border-[#22c55e] border-l-8 text-[#0a0a0a]'
                        : 'bg-white border-[#2a2a2a] text-[#1a1a1a] hover:bg-[#f5f5f5]'
                    }`}
                  >
                    {struggle}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-[#f5f5f5] p-2.5 rounded border border-[#eeeeee] text-xs text-[#1a1a1a]/70">
              <span className="font-extrabold text-[#22c55e]">RESEARCH:</span> Studies show the average person checks their phone dozens of times daily. Progress Club offers an intentional space to limit those distractions.
            </div>
          </div>
        );

      case 7: // Distraction Hours
        return (
          <div className="flex flex-col flex-1 justify-between p-6">
            <div className="text-left mt-10">
              <h1 className="text-2xl font-extrabold tracking-tight text-[#0a0a0a] uppercase mb-6">
                roughly how many hours a week do you spend distracted, such as scrolling, procrastinating, or doing nothing useful?
              </h1>
              
              <div className="space-y-3">
                {['less than 5 hours', '5 to 10 hours', '10 to 20 hours', 'more than 20 hours'].map((hours) => (
                  <button
                    key={hours}
                    id={`distraction-opt-${hours}`}
                    onClick={() => {
                      setSelectedDistraction(hours);
                      triggerAutoAdvance(() => setQuizStep(8));
                    }}
                    className={`w-full p-4 text-left font-medium rounded-lg border transition-all ${
                      selectedDistraction === hours
                        ? 'bg-white border-[#22c55e] border-l-8 text-[#0a0a0a]'
                        : 'bg-white border-[#2a2a2a] text-[#1a1a1a] hover:bg-[#f5f5f5]'
                    }`}
                  >
                    {hours}
                  </button>
                ))}
              </div>

              {selectedDistraction && (
                <div className="mt-4 p-3.5 bg-white border border-[#2a2a2a] rounded-lg text-sm font-semibold text-[#0a0a0a] animate-pulse">
                  {selectedDistraction === 'less than 5 hours' && "that's impressive: let's sharpen it further."}
                  {selectedDistraction === '5 to 10 hours' && "together we'll convert some of those hours into progress."}
                  {selectedDistraction === '10 to 20 hours' && "that's more than a full work day every week: imagine what you could do with it."}
                  {selectedDistraction === 'more than 20 hours' && "that is a significant amount of lost time, but we are here to support you in re-claiming it."}
                </div>
              )}
            </div>
          </div>
        );

      case 8: // Value of Time
        return (
          <div className="flex flex-col flex-1 justify-between p-6">
            <div className="text-left mt-10">
              <h1 className="text-2xl font-extrabold tracking-tight text-[#0a0a0a] uppercase mb-6">
                what is one hour of your focused time worth to you?
              </h1>
              
              <div className="space-y-3">
                {[
                  'I\'ve never thought about it',
                  'a lot, time is my most valuable resource',
                  'it depends on what I\'m working on',
                  'honestly, right now, not much: that\'s why I\'m here'
                ].map((val) => (
                  <button
                    key={val}
                    id={`value-opt-${val}`}
                    onClick={() => {
                      setSelectedValue(val);
                      triggerAutoAdvance(() => setSection('goodnews'));
                    }}
                    className={`w-full p-4 text-left font-medium rounded-lg border transition-all ${
                      selectedValue === val
                        ? 'bg-white border-[#22c55e] border-l-8 text-[#0a0a0a]'
                        : 'bg-white border-[#2a2a2a] text-[#1a1a1a] hover:bg-[#f5f5f5]'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-[#f5f5f5] p-2.5 rounded border border-[#eeeeee] text-xs text-[#1a1a1a]/70">
              <span className="font-extrabold text-[#22c55e]">NEUROSCIENCE:</span> Frequent task-switching increases mental fatigue. Dedicated focus blocks reduce these transitions, helping you work more efficiently.
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderGoodNewsSec = () => {
    if (newsStep === 1) {
      return (
        <div className="flex flex-col flex-1 justify-between p-6">
          <div className="text-left mt-10">
            <h1 className="text-4xl font-extrabold tracking-tight text-[#0a0a0a] uppercase mb-4">
              here's the good news, {nameInput}.
            </h1>
            <p className="text-lg text-[#1a1a1a]/70">
              the fact that you're here, answering these questions honestly, means you are already on track to becoming the person you want to be.
            </p>
          </div>

          <div className="my-6 flex justify-center scale-110">
            <CrewCharacter characterId="cipher" pose="celebrating" height={140} />
          </div>

          <button
            id="goodnews-step1-next"
            onClick={() => setNewsStep(2)}
            className="w-full py-4 text-center text-sm font-bold uppercase tracking-wider bg-[#22c55e] text-[#0a0a0a] rounded-lg border border-[#2a2a2a] cursor-pointer"
          >
            keep going
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-col flex-1 justify-between p-6">
        <div className="text-left mt-10">
          <h1 className="text-4xl font-extrabold tracking-tight text-[#0a0a0a] uppercase mb-4">
            you are exactly where you need to be.
          </h1>
          <p className="text-lg text-[#1a1a1a]/70">
            Progress Club was built for people exactly like you, people who know something needs to change and are ready to do something about it. you're not behind. you're just getting started.
          </p>
        </div>

        <button
          id="goodnews-step2-next"
          onClick={() => setSection('cost')}
          className="w-full py-4 text-center text-sm font-bold uppercase tracking-wider bg-[#22c55e] text-[#0a0a0a] rounded-lg border border-[#2a2a2a] cursor-pointer"
        >
          show me more
        </button>
      </div>
    );
  };

  const renderCostSec = () => {
    switch (costStep) {
      case 1:
        return (
          <div className="flex flex-col flex-1 justify-between p-6">
            <div className="text-left mt-10">
              <h1 className="text-3xl font-extrabold tracking-tight text-[#0a0a0a] uppercase mb-4">
                a life without habits is a life spent reacting.
              </h1>
              <p className="text-lg text-[#1a1a1a]/70">
                when we don't have structure, we don't rest, we just drift. from our phones to our beds to our regrets. the days blur and the weeks disappear.
              </p>
            </div>
            
            <button
              id="cost-step1-next"
              onClick={() => setCostStep(2)}
              className="text-right text-sm font-bold text-[#1a1a1a]/60 uppercase tracking-widest hover:underline cursor-pointer"
            >
              next
            </button>
          </div>
        );

      case 2:
        return (
          <div className="flex flex-col flex-1 justify-between p-6">
            <div className="text-left mt-10">
              <h1 className="text-3xl font-extrabold tracking-tight text-[#0a0a0a] uppercase mb-4">
                distraction is expensive.
              </h1>
              <p className="text-lg text-[#1a1a1a]/70 mb-6">
                it's not just the hours lost scrolling. it's the version of yourself you never became because the time was gone before you noticed.
              </p>
              
              <div className="p-4 bg-white border-2 border-[#2a2a2a] rounded-lg">
                <p className="font-extrabold text-lg text-[#0a0a0a] uppercase mb-1">the math breakdown:</p>
                <p className="text-[#1a1a1a]">
                  that's <span className="text-[#22c55e] font-extrabold">{getDistractionWording()}</span> hours a week you told us about. over a year that's <span className="text-[#22c55e] font-extrabold">{getComputedAnnualDistractions()} hours</span>. </p>
              </div>
            </div>

            <button
              id="cost-step2-next"
              onClick={() => setCostStep(3)}
              className="text-right text-sm font-bold text-[#1a1a1a]/60 uppercase tracking-widest hover:underline cursor-pointer"
            >
              next
            </button>
          </div>
        );

      case 3:
        return (
          <div className="flex flex-col flex-1 justify-between p-6">
            <div className="text-left mt-10">
              <h1 className="text-3xl font-extrabold tracking-tight text-[#0a0a0a] uppercase mb-4">
                starting over is exhausting.
              </h1>
              <p className="text-lg text-[#1a1a1a]/70">
                the hardest part of not having habits isn't the laziness, it's the guilt. the cycle of starting, stopping, and starting again. it wears you down. Progress Club is designed to break that cycle gently and permanently.
              </p>
            </div>

            <button
              id="cost-step3-next"
              onClick={() => setCostStep(4)}
              className="text-right text-sm font-bold text-[#1a1a1a]/60 uppercase tracking-widest hover:underline cursor-pointer"
            >
              next
            </button>
          </div>
        );

      case 4:
        return (
          <div className="flex flex-col flex-1 justify-between p-6">
            <div className="text-left mt-10">
              <h1 className="text-3xl font-extrabold tracking-tight text-[#0a0a0a] uppercase mb-4">
                but here's what's true, {nameInput}.
              </h1>
              <p className="text-[#1a1a1a]/70">
                we can help you develop a system. stop feeling lazy and broken and come with us as we develop the right structure.
              </p>
            </div>

            <div className="flex justify-center my-2">
              <CrewCharacter characterId="cipher" pose="idle" height={100} />
            </div>

            <button
              id="cost-step4-next"
              onClick={() => setSection('promise')}
              className="w-full py-4 text-center text-sm font-bold uppercase tracking-wider bg-[#22c55e] text-[#0a0a0a] rounded-lg border border-[#2a2a2a] cursor-pointer"
            >
              I'm ready
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  const renderPromiseSec = () => {
    switch (promiseStep) {
      case 1:
        return (
          <div className="flex flex-col flex-1 justify-between p-6">
            <div className="text-left mt-10">
              <h1 className="text-3xl font-extrabold tracking-tight text-[#0a0a0a] uppercase mb-4" id="promise-header-1">
                here's what Progress Club will do for you, {nameInput}.
              </h1>
              <p className="text-lg text-[#1a1a1a]/70">
                we're not going to promise you'll become a different person overnight. that's not how it works and you deserve honesty.
              </p>
            </div>

            <div className="flex justify-center my-4">
              <CrewCharacter characterId="cipher" pose="idle" height={130} />
            </div>

            <button
              id="promise-step1-next"
              onClick={() => setPromiseStep(2)}
              className="w-full py-4 text-center text-sm font-bold uppercase tracking-wider bg-[#22c55e] text-[#0a0a0a] rounded-lg border border-[#2a2a2a] cursor-pointer"
            >
              go on
            </button>
          </div>
        );

      case 2:
        return (
          <div className="flex flex-col flex-1 justify-between p-6 overflow-y-auto max-h-[90vh]">
            <div className="text-left mt-6">
              <h1 className="text-xl font-bold uppercase text-[#0a0a0a] tracking-tight mb-4">
                Progress Club Commitments
              </h1>
              
              <div className="space-y-3">
                {[
                  "we will help you show up more consistently than you have ever before",
                  "you will start to notice the difference in how you feel about your time",
                  "the people around you might start to notice something is different about you, and they won't be wrong",
                  "you will build a relationship with your own discipline, one day at a time"
                ].map((p, i) => (
                  <div key={i} className="bg-white border-2 border-[#2a2a2a] p-3.5 rounded-lg flex items-start space-x-3">
                    <span className="text-[#22c55e] font-bold text-lg leading-none">✓</span>
                    <p className="text-sm font-semibold text-[#0a0a0a]">{p}</p>
                  </div>
                ))}
              </div>

              <p className="italic text-xs text-center text-[#1a1a1a]/60 mt-4">
                small promises. kept consistently. that's the whole thing.
              </p>
            </div>

            <button
              id="promise-step2-next"
              onClick={() => setPromiseStep(3)}
              className="w-full py-4 mt-4 text-center text-sm font-bold uppercase tracking-wider bg-[#22c55e] text-[#0a0a0a] rounded-lg border border-[#2a2a2a] cursor-pointer"
            >
              I'm with you
            </button>
          </div>
        );

      case 3:
        return (
          <div className="flex flex-col flex-1 justify-between p-6">
            <div className="text-left mt-10">
              <h1 className="text-3xl font-extrabold tracking-tight text-[#0a0a0a] uppercase mb-4">
                one thing we ask in return.
              </h1>
              <p className="text-lg text-[#1a1a1a]/70">
                show up. one session. one day. that's all. Progress Club does the rest: tracking your progress, celebrating your wins, and keeping you honest when it gets hard.
              </p>
            </div>

            <button
              id="promise-step3-next"
              onClick={() => setSection('goals')}
              className="w-full py-4 text-center text-sm font-bold uppercase tracking-wider bg-[#22c55e] text-[#0a0a0a] rounded-lg border border-[#2a2a2a] cursor-pointer"
            >
              let's keep going
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  const renderGoalsSec = () => {
    if (goalsStep === 1) {
      const suggs = [
        "Drink 8 glasses of water 💧",
        "Exercise for 30 minutes 🏃",
        "Read 10 pages of a book 📚",
        "Write a daily journal entry ✍️",
        "Limit social media to 30 mins 📱",
        "Complete 1 Focus Session 💻",
        "Meditate for 10 minutes 🧘",
        "Eat a healthy homecooked meal 🍏"
      ];

      const handleToggleGoal = (goal: string) => {
        if (selectedGoals.includes(goal)) {
          setSelectedGoals(selectedGoals.filter((g) => g !== goal));
        } else {
          if (selectedGoals.length >= 3) {
            return;
          }
          setSelectedGoals([...selectedGoals, goal]);
        }
      };

      const handleAddCustomGoal = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = customGoalInput.trim();
        if (!trimmed) return;
        if (selectedGoals.length >= 3) {
          return;
        }
        if (selectedGoals.includes(trimmed)) {
          setCustomGoalInput('');
          return;
        }
        setSelectedGoals([...selectedGoals, trimmed]);
        setCustomGoalInput('');
      };

      return (
        <div className="flex flex-col flex-grow justify-between p-6 overflow-y-auto max-h-[90vh]">
          <div className="text-left mt-4 space-y-4">
            <h1 className="text-2xl font-extrabold tracking-tight text-[#0a0a0a] uppercase">
              set up your daily goals, {nameInput}!
            </h1>
            <p className="text-xs text-[#1a1a1a]/60">
              Set up to <strong className="text-[#0a0a0a]">3 daily goals</strong> you want to build and track in your private workspace.
            </p>

            {/* Clear, Actionable, Timed (SMART) Guidelines Alert */}
            <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-3.5 text-xs text-amber-950 space-y-1 shadow-sm select-none">
              <span className="font-extrabold uppercase text-[10px] tracking-widest text-amber-800 flex items-center gap-1.5">
                💡 GOAL BUILDER RULE
              </span>
              <p className="leading-relaxed font-medium">
                Make your goals <strong className="text-amber-900 underline">clear, actionable, and timed</strong>. 
                Instead of fuzzy goals like <span className="underline italic text-stone-600">"study more"</span> or <span className="underline italic text-stone-600">"get fit"</span>, use concrete targets like <strong className="text-emerald-800">"Code for 45 minutes"</strong> or <strong className="text-emerald-800">"Exercise for 30 minutes 🏃"</strong>. Time-bound accountability builds real momentum!
              </p>
            </div>

            {/* Limit Indicator */}
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#1a1a1a]/70">YOUR CORE DAILY GOALS:</span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-extrabold border-2 ${
                selectedGoals.length === 3 
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
                  : selectedGoals.length > 0 
                    ? 'bg-amber-50 border-amber-500 text-amber-700' 
                    : 'bg-stone-50 border-stone-300 text-stone-500'
              }`}>
                {selectedGoals.length} OF 3 ACTIVE
              </span>
            </div>

            {/* Selected Goals Display List */}
            {selectedGoals.length > 0 ? (
              <div className="space-y-1.5 bg-stone-50 p-3 rounded-lg border-2 border-dashed border-stone-300">
                {selectedGoals.map((g, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white border border-[#2a2a2a] px-3 py-2 rounded-md shadow-xs">
                    <span className="text-sm font-semibold text-[#0a0a0a] truncate pr-4">
                      {idx + 1}. {g}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedGoals(selectedGoals.filter((item) => item !== g))}
                      className="text-red-500 hover:text-red-700 font-bold text-xs px-1.5 py-0.5 rounded hover:bg-red-50"
                    >
                      ✕ Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-stone-400 italic text-center py-2 bg-stone-50/50 rounded-lg border border-dashed">
                No goals added yet. Choose from presets or enter a custom one below!
              </p>
            )}

            {/* Custom Input */}
            {selectedGoals.length < 3 ? (
              <form onSubmit={handleAddCustomGoal} className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-stone-500 block">CREATE A CUSTOM GOAL:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customGoalInput}
                    onChange={(e) => setCustomGoalInput(e.target.value)}
                    placeholder="e.g. Code for 45 minutes"
                    maxLength={60}
                    className="flex-1 p-2.5 text-sm border-2 border-[#2a2a2a] rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                  <button
                    type="submit"
                    disabled={!customGoalInput.trim() || selectedGoals.length >= 3}
                    className="px-4 py-2 bg-[#22c55e] text-white rounded-lg border-2 border-[#2a2a2a] text-sm font-bold active:translate-y-px disabled:opacity-50"
                  >
                    + Add
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg text-xs leading-relaxed border border-emerald-500/30">
                🎉 Perfect! You've set up your 3 core goals. You can remove any goals above to add or select a different one.
              </div>
            )}

            {/* Presets suggestions section */}
            <div className="space-y-2 mt-4">
              <span className="text-[10px] uppercase font-bold text-stone-500 block">OR SELECT POPULAR PRESET GOALS:</span>
              <div className="grid grid-cols-2 gap-2">
                {suggs.map((sg) => {
                  const isSel = selectedGoals.includes(sg);
                  const isFull = selectedGoals.length >= 3;
                  return (
                    <button
                      key={sg}
                      type="button"
                      onClick={() => handleToggleGoal(sg)}
                      disabled={!isSel && isFull}
                      className={`p-2.5 text-left text-xs font-semibold rounded-lg border transition-all ${
                        isSel
                          ? 'bg-emerald-100 border-emerald-500 text-emerald-950 font-bold shadow-xs'
                          : isFull
                            ? 'bg-stone-50 border-stone-200 text-stone-400 opacity-60 cursor-not-allowed'
                            : 'bg-white border-[#2a2a2a] hover:bg-[#f5f5f5] text-[#1a1a1a]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate mr-1">{sg}</span>
                        {isSel && <span className="text-emerald-700 font-bold">✓</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <button
            id="goals-submit-btn"
            onClick={() => {
              if (selectedGoals.length > 0) {
                setGoalsStep(2);
              }
            }}
            disabled={selectedGoals.length === 0}
            className={`w-full py-4 mt-6 text-center text-sm font-bold uppercase tracking-wider bg-[#22c55e] text-[#0a0a0a] rounded-lg border border-[#2a2a2a] ${
              selectedGoals.length === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            CONFIRM MY {selectedGoals.length} CORE GOALS
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-col flex-grow justify-between p-6">
        <div className="text-left mt-8 space-y-4">
          <h1 className="text-2xl font-extrabold tracking-tight text-[#0a0a0a] uppercase">
            your habit driver triggers are ready, {nameInput}!
          </h1>
          <p className="text-xs text-[#1a1a1a]/60 font-medium">
            Progress is made with small daily choices. Tracking these every single day builds unshakeable consistency.
          </p>
          
          <div className="space-y-3.5 mt-6">
            {selectedGoals.map((g, idx) => {
              return (
                <div key={idx} className="bg-white border-2 border-[#2a2a2a] p-3.5 rounded-xl shadow-xs">
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block mb-1">
                    GOAL #{idx + 1}
                  </span>
                  <p className="text-sm font-bold text-[#0a0a0a]">
                    {g}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <button
          id="goals-step2-next"
          onClick={() => setSection('paywall')}
          className="w-full py-4 mt-6 text-center text-sm font-bold uppercase tracking-wider bg-[#22c55e] text-[#0a0a0a] rounded-lg border border-[#2a2a2a] cursor-pointer"
        >
          LET'S UNLOCK MOMENTUM
        </button>
      </div>
    );
  };

  const renderPaywallSec = () => {
    if (paywallStep === 1) {
      // 21 Day Truth block
      return (
        <div className="flex flex-col flex-1 justify-between p-6">
          <div className="text-left mt-8">
            <h1 className="text-3xl font-extrabold tracking-tight text-[#0a0a0a] uppercase mb-4" id="truth21-header">
              consistency is a journey of steady milestones.
            </h1>
            <p className="text-sm text-[#1a1a1a]/70">
              Psychological research shows that building solid habits is a gradual process that can take several weeks of active practice. While changing your default behavior takes time, starting with an achievable 21-day challenge helps you establish momentum and build consistency without giving up.
            </p>
            <p className="text-sm text-[#22c55e] font-extrabold mt-3 uppercase tracking-wider">
              Progress Club is designed to support you every step of the way.
            </p>
          </div>

          <div className="flex justify-center my-2">
            <CrewCharacter characterId="cipher" pose="celebrating" height={130} />
          </div>

          <button
            id="truth-step1-next"
            onClick={() => setPaywallStep(2)}
            className="w-full py-4 text-center text-sm font-bold uppercase tracking-wider bg-[#22c55e] text-[#0a0a0a] rounded-lg border border-[#2a2a2a] cursor-pointer"
          >
            I'm in
          </button>
        </div>
      );
    }

    if (paywallStep === 2) {
      // Profile summary card
      const charId = getRecommendedCharacter();
      const roomId = getRecommendedRoom();
      const mottoText = getMotto();

      return (
        <div className="flex flex-col flex-1 justify-between p-6 overflow-y-auto max-h-[90vh]">
          <div className="text-left mt-4 text-[#0a0a0a]">
            <h1 className="text-sm text-center font-bold tracking-widest text-[#1a1a1a]/60 uppercase mb-4">
              {nameInput}'S PROGRESS CLUB PROFILE
            </h1>
            
            {/* Summary card inside layout */}
            <div className="bg-white border-2 border-[#2a2a2a] p-5 rounded-lg space-y-4">
              <div className="flex justify-between items-center bg-[#f5f5f5] p-3 border border-[#2a2a2a]">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-[#1a1a1a]/60 uppercase">Your Challenge</p>
                  <p className="text-lg font-extrabold text-[#0a0a0a]">21 Days</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-[#1a1a1a]/60 uppercase">Recommended Workspace</p>
                  <p className="text-sm font-bold text-[#0a0a0a] uppercase">{getRoomName(roomId)}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-[#1a1a1a]/60 uppercase mb-1">Your Motto</p>
                <p className="text-sm font-semibold italic text-[#0a0a0a]">{mottoText}</p>
              </div>

              <div className="border-t border-[#eeeeee] pt-3 flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-[#1a1a1a]/60 uppercase">Placement test result</p>
                  <p className="text-sm font-extrabold text-[#22c55e]">{getPlacementPerformanceLabel(getPlacementScore())}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-[#1a1a1a]/60 uppercase">Discipline Score</p>
                  <span className="bg-[#22c55e]/15 text-[#22c55e] font-extrabold border border-[#22c55e]/30 px-2.5 py-0.5 rounded text-xs select-none">
                    {getPlacementScore()} / 14
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-[#eeeeee] pt-3">
                <div className="space-y-1 w-1/2">
                  <p className="text-xs font-bold text-[#1a1a1a]/60 uppercase">Your Character</p>
                  <p className="text-sm font-bold text-[#0a0a0a]">{charId.toUpperCase()}</p>
                </div>
                <div className="w-1/2 flex justify-end">
                  <CrewCharacter characterId={charId} pose="idle" height={80} />
                </div>
              </div>
            </div>
          </div>

          <button
            id="summary-step2-next"
            onClick={() => setPaywallStep(3)}
            className="w-full py-4 mt-6 text-center text-sm font-bold uppercase tracking-wider bg-[#22c55e] text-[#0a0a0a] rounded-lg border border-[#2a2a2a] cursor-pointer"
          >
            this is me
          </button>
        </div>
      );
    }

    // Actual paywall sub-screen (Step 3)
    return (
      <div className="flex flex-col flex-1 justify-between p-6 overflow-y-auto max-h-[90vh]">
        <div className="text-left mt-4">
          <h1 className="text-3xl font-extrabold tracking-tight text-[#0a0a0a] uppercase mb-1" id="paywall-header">
            ready to begin, {nameInput}?
          </h1>
          <p className="text-[#1a1a1a]/70 text-sm mb-6">
            join Progress Club and start your 21 day journey today. cancel any time.
          </p>

          {/* Subscription Option cards */}
          <div className="space-y-3">
            {[
              { id: 'weekly', name: 'Weekly Access', price: '$1.50 / week', sub: 'Weekly access to all features. Billed weekly. Cancel any time.', badge: '' },
              { id: 'monthly', name: 'Monthly Access', price: '$5.50 / month', sub: 'Standard monthly plan. Cancel any time. Great for long-term consistency.', badge: '' },
              { id: 'yearly', name: 'Lifetime Access', price: '$12.00 / lifetime', sub: 'One-time payment. Executive Suite Lifetime Access Pass. Never pay again.', badge: 'best value' }
            ].map((plan) => {
              const isSel = selectedPlan === plan.id;
              const isYearly = plan.id === 'yearly';
              return (
                <button
                  key={plan.id}
                  id={`plan-card-${plan.id}`}
                  onClick={() => setSelectedPlan(plan.id as any)}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-all relative flex flex-col justify-between ${
                    isSel
                      ? isYearly
                        ? 'bg-[#fffbeb] border-amber-500 border-l-8 shadow-sm'
                        : 'bg-white border-[#22c55e] border-l-8 shadow-sm'
                      : 'bg-white border-[#2a2a2a] hover:bg-[#f5f5f5]'
                  }`}
                >
                  {plan.badge && (
                    <span className={`absolute top-2 right-2 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border shadow-sm ${
                      isYearly
                        ? 'bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 text-stone-900 border-amber-600'
                        : 'bg-[#22c55e] text-[#0a0a0a] border border-[#2a2a2a]'
                    }`}>
                      ✨ {plan.badge}
                    </span>
                  )}
                  <h3 className="text-base font-bold text-[#0a0a0a] uppercase">{plan.name}</h3>
                  <p className={`text-lg font-extrabold ${isYearly ? 'text-amber-600' : 'text-[#22c55e]'}`}>{plan.price}</p>
                  <p className="text-xs text-[#1a1a1a]/65">{plan.sub}</p>
                </button>
              );
            })}
          </div>

          <p className="text-[11px] text-[#1a1a1a]/60 text-center mt-4">
            all plans include full access to Progress Club. no hidden fees. cancel any time.
          </p>
        </div>

        <div className="space-y-2 mt-4">
          <button
            id="start-journey-btn"
            onClick={handleStartJourney}
            className="w-full py-4 text-center text-sm font-bold uppercase tracking-wider bg-[#22c55e] text-[#0a0a0a] rounded-lg border border-[#2a2a2a] cursor-pointer hover:opacity-90 transition-opacity"
          >
            start my journey
          </button>
          
          <button
            id="restore-purchases-btn"
            onClick={() => {
              alert("Mock Purchase: Purchases Restored successfully!");
              handleStartJourney();
            }}
            className="w-full text-center text-xs font-bold text-[#1a1a1a]/60 uppercase tracking-widest py-2 hover:underline cursor-pointer"
          >
            restore purchases
          </button>
        </div>
      </div>
    );
  };

  const renderWelcomeSec = () => {
    const charId = getRecommendedCharacter();
    return (
      <div className="flex flex-col flex-1 justify-between p-6 bg-white min-h-[85vh]">
        <div className="text-center mt-12 space-y-4">
          <h1 className="text-4xl font-black tracking-tight text-[#0a0a0a] uppercase" id="welcome-header">
            welcome to the club, {nameInput}!
          </h1>
          <p className="text-lg text-[#1a1a1a]/70">
            you are officially inside. your recommended buddy {charId.toUpperCase()} is waiting in {getRoomName(getRecommendedRoom())}!
          </p>
        </div>

        {/* Celebrating recommended character and confetti */}
        <div className="my-8 flex justify-center scale-125">
          <div className="relative">
            <CrewCharacter characterId={charId} pose="challenge-complete" height={150} />
          </div>
        </div>

        <button
          id="lets-begin-btn"
          onClick={handleLetBegin}
          className="w-full py-4 text-center text-sm font-bold uppercase tracking-wider bg-[#22c55e] text-[#0a0a0a] rounded-lg border border-[#2a2a2a] cursor-pointer hover:opacity-95"
        >
          let's begin
        </button>
      </div>
    );
  };

  const getProgressWidthPercent = () => {
    if (section === 'quiz') return Math.round(5 + (quizStep / 8) * 30);
    if (section === 'goodnews') return 40;
    if (section === 'cost') return 55;
    if (section === 'promise') return 70;
    if (section === 'goals') return 85;
    return 100;
  };

  const transitionKey = `${section}-${quizStep}-${newsStep}-${costStep}-${promiseStep}-${goalsStep}-${paywallStep}`;

  return (
    <div className="w-full max-w-md mx-auto min-h-[90vh] bg-white border border-[#2a2a2a] rounded-xl flex flex-col justify-between overflow-hidden relative shadow-lg">
      {/* Top Thin Green Progress Bar */}
      <div className="w-full h-1 bg-[#eeeeee] relative">
        <div
          className="h-full bg-[#22c55e] transition-all duration-500 ease-out"
          style={{ width: `${getProgressWidthPercent()}%` }}
        ></div>
      </div>

      <div className="flex flex-col flex-grow relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={transitionKey}
            initial={{ opacity: 0, x: 25, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -25, scale: 0.98 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col flex-grow"
          >
            {section === 'quiz' && renderQuizStep()}
            {section === 'goodnews' && renderGoodNewsSec()}
            {section === 'cost' && renderCostSec()}
            {section === 'promise' && renderPromiseSec()}
            {section === 'goals' && renderGoalsSec()}
            {section === 'paywall' && renderPaywallSec()}
            {section === 'welcome' && renderWelcomeSec()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Onboarding;
