import React, { useEffect, useState } from 'react';
import CrewCharacter, { CharacterPose } from './CrewCharacter';

// Helper: Get local Date string as YYYY-MM-DD
function getLocalDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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

interface OfficeRoomProps {
  roomId: string;
  characterId: string;
  pose: CharacterPose;
  isActive: boolean; // is focusing timer currently running
  completedDaysCount?: number;
  completedDates?: string[];
  challengeStartDate?: string;
  focusActivity?: 'desk-work' | 'exercise';
  exerciseType?: 'dumbbells' | 'punching';
  equippedItems?: string[];
  itemPositions?: Record<string, { x: number; y: number }>;
  onUpdateItemPosition?: (itemId: string, x: number, y: number) => void;
}

export const OfficeRoom: React.FC<OfficeRoomProps> = ({
  roomId,
  characterId,
  pose,
  isActive,
  completedDaysCount = 0,
  completedDates = [],
  challengeStartDate = '',
  focusActivity = 'desk-work',
  exerciseType = 'dumbbells',
  equippedItems = [],
  itemPositions = {},
  onUpdateItemPosition,
}) => {
  const [time, setTime] = useState(new Date());
  const [localPositions, setLocalPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  // Pinch & scale state
  const [itemScales, setItemScales] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('office_item_scales_v1');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const [pinchState, setPinchState] = useState<{
    itemId: string;
    initialDistance: number;
    initialScale: number;
  } | null>(null);

  const updateScale = (itemId: string, newScale: number) => {
    const clamped = Math.max(0.4, Math.min(3.5, Math.round(newScale * 100) / 100));
    setItemScales(prev => {
      const next = { ...prev, [itemId]: clamped };
      try {
        localStorage.setItem('office_item_scales_v1', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const getDistance = (touches: React.TouchList | TouchList) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const DEFAULT_POSITIONS: Record<string, { x: number; y: number }> = {
    'lava-lamp': { x: 8, y: 15 },
    'soccer-ball': { x: 22, y: 68 },
    'basketball': { x: 74, y: 68 },
    'gold-trophy': { x: 62, y: 55 },
    'bonsai-tree': { x: 88, y: 55 },
    'character': { x: 50, y: 35 },
  };

  useEffect(() => {
    if (itemPositions) {
      setLocalPositions(itemPositions);
    }
  }, [itemPositions]);

  const getPos = (itemId: string) => {
    return localPositions[itemId] || itemPositions[itemId] || DEFAULT_POSITIONS[itemId] || { x: 50, y: 50 };
  };

  const handleStartDrag = (itemId: string, event: React.MouseEvent | React.TouchEvent) => {
    event.stopPropagation();
    setActiveDragId(itemId);
  };

  const handleTouchStart = (itemId: string, event: React.TouchEvent) => {
    event.stopPropagation();
    if (event.touches.length === 2) {
      const dist = getDistance(event.touches);
      const currentScale = itemScales[itemId] || 1;
      setPinchState({
        itemId,
        initialDistance: dist,
        initialScale: currentScale,
      });
      setActiveDragId(null);
    } else if (event.touches.length === 1) {
      setActiveDragId(itemId);
    }
  };

  const handleWheel = (itemId: string, event: React.WheelEvent) => {
    event.stopPropagation();
    const currentScale = itemScales[itemId] || 1;
    const change = event.deltaY < 0 ? 0.08 : -0.08;
    updateScale(itemId, currentScale + change);
  };

  useEffect(() => {
    if (!activeDragId && !pinchState) return;

    const handleMove = (clientX: number, clientY: number) => {
      if (!activeDragId || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      
      let px = ((clientX - rect.left) / rect.width) * 100;
      let py = ((clientY - rect.top) / rect.height) * 100;

      // Bound them nicely to avoid moving completely outside the screen
      if (px < 1) px = 1;
      if (px > 89) px = 89;
      if (py < 2) py = 2;
      if (py > 78) py = 78;

      setLocalPositions(prev => ({
        ...prev,
        [activeDragId]: { x: Math.round(px), y: Math.round(py) }
      }));
    };

    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (pinchState && e.touches.length === 2) {
        const dist = getDistance(e.touches);
        if (pinchState.initialDistance > 0 && dist > 0) {
          const factor = dist / pinchState.initialDistance;
          updateScale(pinchState.itemId, pinchState.initialScale * factor);
        }
      } else if (e.touches.length > 0 && activeDragId) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleDragEnd = () => {
      if (activeDragId) {
        const finalPos = localPositions[activeDragId] || DEFAULT_POSITIONS[activeDragId];
        if (finalPos && onUpdateItemPosition) {
          onUpdateItemPosition(activeDragId, finalPos.x, finalPos.y);
        }
        setActiveDragId(null);
      }
      if (pinchState) {
        setPinchState(null);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleDragEnd);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleDragEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [activeDragId, pinchState, localPositions, onUpdateItemPosition]);

  // Keep a clock ticking inside the room
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute angles for clock hands
  const hours = time.getHours();
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();

  const secAngle = seconds * 6;
  const minAngle = minutes * 6 + seconds * 0.1;
  const hrAngle = (hours % 12) * 30 + minutes * 0.5;

  const activeGlowClass = isActive ? 'shadow-[0_0_15px_rgba(34,197,94,0.25)] border-[#22c55e]' : 'border-[#2a2a2a]';

  // Keep the desk only during working or typing animations, hide during idle/other poses
  const showDesk = pose === 'focused' || pose === 'typing';

  // Room visual elements
  const renderRoom = () => {
    switch (roomId) {
      case 'rooftop':
      default:
        return (
          <div className="absolute inset-0 bg-gradient-to-b from-[#38bdf8] via-[#a5f3fc] to-[#fef08a] flex flex-col justify-between overflow-hidden border-2 border-stone-850">
            {/* Twinkling ambient tiny star flares in high sky */}
            <div className="absolute top-2 left-10 w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_8px_white] opacity-90"></div>
            <div className="absolute top-4 right-1/4 w-2.5 h-2.5 bg-yellow-300 rounded-full animate-ping opacity-80"></div>
            <div className="absolute top-8 left-18 w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_8px_white] opacity-95"></div>
            <div className="absolute top-12 right-10 w-2 h-2 bg-white rounded-full animate-pulse opacity-85"></div>

            {/* Detailed Brick background on the sides - stylized curved bricks */}
            <div className="absolute top-0 bottom-0 left-0 w-4 border-r-3 border-stone-850 bg-[repeating-linear-gradient(0deg,transparent,transparent_8px,#854d0e_8px,#854d0e_11px)] opacity-40 shadow-xs"></div>
            <div className="absolute top-0 bottom-0 right-0 w-4 border-l-3 border-stone-850 bg-[repeating-linear-gradient(0deg,transparent,transparent_8px,#854d0e_8px,#854d0e_11px)] opacity-40 shadow-xs"></div>

            {/* Fluffy cartoon clouds drifting (Double-outlined bubble clouds) */}
            <div className="absolute top-0 inset-x-0 h-44 pointer-events-none">
              <div className="absolute w-28 h-12 bg-white border-3 border-stone-850 rounded-full shadow-[4px_4px_0px_0px_rgba(28,25,23,0.15)] animate-[drift_25s_linear_infinite]" style={{ top: '15px' }}>
                <div className="absolute -top-4 left-4 w-14 h-14 bg-white border-t-3 border-l-3 border-stone-850 rounded-full pb-0.5"></div>
                <div className="absolute -top-2 left-14 w-11 h-11 bg-white border-t-3 border-r-3 border-stone-850 rounded-full"></div>
              </div>
              <div className="absolute w-40 h-14 bg-white border-3 border-stone-850 rounded-full shadow-[4px_4px_0px_0px_rgba(28,25,23,0.12)] animate-[drift_45s_linear_infinite]" style={{ top: '45px', animationDelay: '-12s' }}>
                <div className="absolute -top-5.5 left-6 w-18 h-18 bg-white border-t-3 border-l-3 border-stone-850 rounded-full"></div>
                <div className="absolute -top-3.5 left-20 w-15 h-15 bg-white border-t-3 border-r-3 border-stone-850 rounded-full"></div>
              </div>
              <div className="absolute w-24 h-10 bg-white border-3 border-stone-850 rounded-full shadow-[3px_3px_0px_0px_rgba(28,25,23,0.15)] animate-[drift_15s_linear_infinite]" style={{ top: '95px', animationDelay: '-5s' }}>
                <div className="absolute -top-2.5 left-3.5 w-10 h-10 bg-white border-t-3 border-l-3 border-stone-850 rounded-full"></div>
                <div className="absolute -top-1.5 left-11' w-9 h-9 bg-white border-t-3 border-r-3 border-stone-850 rounded-full"></div>
              </div>
            </div>

            {/* Playful tilted Cartoon Skyline with fine quirky details */}
            <div className="absolute bottom-28 inset-x-0 h-20 flex items-end justify-between opacity-95 border-b-3 border-stone-855 px-4 pointer-events-none">
              <div className="w-13 h-16 bg-amber-100 border-3 border-stone-850 border-b-0 rounded-t-xl relative flex flex-wrap content-start p-1 gap-0.5 transform rotate-[2deg]">
                <div className="w-2 h-2 bg-[#fef08a] rounded-full border border-stone-850 shadow-xs animate-pulse"></div>
                <div className="w-2 h-2 bg-stone-300 rounded-full"></div>
                <div className="w-2 h-2 bg-stone-300 rounded-full"></div>
                <div className="w-2 h-2 bg-[#fef08a] rounded-full border border-stone-850 shadow-xs animate-pulse"></div>
              </div>
              <div className="w-18 h-19 bg-sky-200 border-3 border-stone-850 border-b-0 rounded-t-2xl relative p-1.5 flex flex-col justify-between transform -rotate-[1deg]">
                <div className="absolute top-1 left-3.5 w-2 h-2 bg-rose-500 border border-stone-900 rounded-full animate-ping"></div>
                <div className="grid grid-cols-3 gap-0.5">
                  <div className="w-3 h-2.5 bg-stone-300/60 rounded-xs"></div> <div className="w-3 h-2.5 bg-[#fef08a] rounded-xs border border-stone-850"></div> <div className="w-3 h-2.5 bg-stone-300/60 rounded-xs"></div>
                </div>
                <div className="w-full h-1.5 bg-sky-300 rounded-full"></div>
              </div>
              <div className="w-13 h-12 bg-rose-300 border-3 border-stone-850 border-b-0 rounded-lg relative p-1 transform rotate-[3deg] flex items-center justify-center">
                <div className="w-2.5 h-6 bg-stone-850 rounded-md"></div>
              </div>
              <div className="w-11 h-23 bg-yellow-100 border-3 border-stone-850 border-b-0 rounded-t-[1.6rem] relative p-1 transform -rotate-[2deg]">
                <div className="w-full h-2 bg-[#b91c1c] absolute top-2 left-0 border-b border-stone-850"></div>
                <div className="w-4.5 h-4.5 bg-white border-2 border-stone-850 rounded-full mt-6 mx-auto flex items-center justify-center">
                  <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                </div>
              </div>
              <div className="w-15 h-14 bg-emerald-100 border-3 border-stone-850 border-b-0 rounded-xl relative p-1 flex gap-1.5 transform rotate-[1.5deg] items-center justify-center">
                <div className="w-3.5 h-3.5 bg-[#fef08a] border border-stone-855 rounded-full shadow-xs"></div>
                <div className="w-3 h-3 bg-white border border-stone-855 rounded-full shadow-xs"></div>
              </div>
            </div>

            {/* Curved Wavy Cartoon Parapet and organic planters */}
            <div className="absolute bottom-16 inset-x-0 h-13 bg-stone-100 border-t-3 border-stone-850 flex items-center justify-around px-4 rounded-t-[2.5rem] shadow-[inset_0_-4px_0_rgba(0,0,0,0.05)]">
              <div className="flex space-x-2 items-end -mt-6">
                <div className="w-4 h-9 bg-[#4d7c0f] rounded-t-full border-x-2 border-t-2 border-stone-850 relative">
                  <span className="absolute -top-2 left-0.5 text-[7px] animate-bounce">🌸</span>
                </div>
                <div className="w-5 h-11 bg-[#3f6212] rounded-t-full border-x-2 border-t-2 border-stone-850 relative">
                  <div className="absolute top-2 left-1.5 w-2 h-2 bg-yellow-300 border border-stone-900 rounded-full animate-bounce"></div>
                </div>
                <div className="w-4 h-8 bg-[#4d7c0f] rounded-t-full border-x-2 border-t-2 border-stone-850"></div>
                {/* flower pot barrel */}
                <div className="w-7 h-5 bg-amber-800 border-2 border-stone-855 -mb-2 rounded-md shadow-sm flex items-center justify-around px-0.5">
                  <div className="w-1 h-3 bg-amber-900 rounded-xs"></div>
                  <div className="w-1 h-3 bg-amber-900 rounded-xs"></div>
                </div>
              </div>

              {/* Eco Wind Turbine & Solar Panel details on parapet */}
              <div className="flex space-x-2.5 items-center -mt-8 relative">
                {/* Tiny Solar Panel */}
                <div className="w-6 h-8 bg-slate-800 border-2 border-stone-855 rounded-md transform -rotate-12 flex flex-col justify-between p-0.5 shadow-sm">
                  <div className="w-full h-0.5 bg-slate-500"></div>
                  <div className="w-full h-0.5 bg-slate-500"></div>
                  <div className="w-full h-0.5 bg-slate-500"></div>
                  <div className="w-full h-1 bg-yellow-400 rounded-xs"></div>
                </div>
                {/* Wind turbine with rotating blades */}
                <div className="flex flex-col items-center">
                  <div className="w-7 h-7 border-2 border-stone-855 border-b-0 rounded-full relative flex items-center justify-center bg-white/20 animate-[spin_3s_linear_infinite]">
                    <div className="w-0.5 h-6.5 bg-stone-700 absolute"></div>
                    <div className="w-6.5 h-0.5 bg-stone-700 absolute"></div>
                  </div>
                  <div className="w-1.5 h-7 bg-stone-750 border-x border-stone-855"></div>
                </div>
                {/* Planter Box */}
                <div className="w-9 h-4.5 bg-stone-600 border-2 border-stone-855 -mb-2 rounded-md flex justify-around px-1 items-center">
                  <div className="w-1.5 h-1.5 bg-[#22c55e] rounded-full"></div>
                  <div className="w-1.5 h-1.5 bg-[#4ade80] rounded-full"></div>
                </div>
              </div>

              {/* Ultra Cute Telescope asset on the right ledge looking at the stars - brass finish */}
              <div className="absolute right-12 top-[-26px] w-12 h-16 pointer-events-none flex flex-col justify-end items-center">
                {/* Telescope tube angled up left */}
                <div className="w-14 h-4 bg-gradient-to-r from-amber-500 to-yellow-400 border-2 border-stone-850 rounded-full transform -rotate-45 origin-bottom relative shadow-md">
                  <div className="absolute left-1 top-0.5 w-2 h-1.5 bg-stone-900 rounded-full"></div>
                  <div className="absolute right-1.5 top-0.5 w-1 h-1.5 bg-cyan-300 rounded-full"></div>
                </div>
                {/* Tripod base stand structure */}
                <div className="w-0.5 h-6 bg-slate-900 absolute bottom-0 left-[22px]"></div>
                <div className="w-0.5 h-6 bg-slate-900 absolute bottom-0 left-[18px] transform rotate-12"></div>
                <div className="w-0.5 h-6 bg-slate-900 absolute bottom-0 left-[26px] transform -rotate-12"></div>
              </div>
            </div>

            {/* Cute Cartoon ladybug and honeybee floating around */}
            <div className="absolute top-16 left-1/3 pointer-events-none animate-bounce z-10 flex space-x-1 items-center bg-white/10 px-1 py-0.5 rounded-full">
              <span className="text-xs select-none">🐝</span>
              <span className="text-[6px] font-mono font-black text-rose-500">BZZZ</span>
            </div>

            {/* String lights with glowing drape wire path - stylized round glowing paper lanterns with tiny tassels */}
            <div className="absolute top-2 inset-x-0 h-6 flex justify-around items-start">
              <svg className="absolute inset-x-0 w-full h-8 text-stone-400 stroke-stone-850" fill="none" strokeWidth="1.5">
                <path d="M 0,2 Q 40,10, 80,2 Q 120,10, 160,2 Q 200,10, 240,2 M 0,2" />
              </svg>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex flex-col items-center z-10">
                  <div className="w-0.5 h-3 bg-stone-850"></div>
                  <div className={`w-4 h-4 rounded-full border-2 border-stone-850 transition-all duration-300 relative flex justify-center ${isActive ? 'bg-[#22c55e] scale-115 shadow-[0_0_10px_#22c55e]' : 'bg-amber-100'}`}>
                    {/* tiny bottom card decoration */}
                    <div className="w-1 h-1.5 bg-red-650 absolute top-3.5 rounded-b-xs border-x border-b border-stone-850"></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desk and Character with more detail - conditionally visible */}
            <div className={`absolute bottom-0 inset-x-0 transition-all duration-300 flex flex-col justify-end items-center ${
              showDesk 
                ? "h-20 bg-white border-t-3 border-stone-850" 
                : "h-14 bg-gradient-to-b from-[#78716c] to-[#4b5563] border-t-3 border-stone-850 shadow-inner"
            }`}>
              {/* Floorboard fine wood lines */}
              {showDesk && (
                <div className="absolute inset-x-0 top-0 bottom-0 bg-[linear-gradient(90deg,transparent_20px,rgba(0,0,0,0.02)_20px,rgba(0,0,0,0.02)_21px)] pointer-events-none"></div>
              )}
              <div className="absolute bottom-16">
                <CrewCharacter characterId={characterId} pose={pose} height={110} focusActivity={focusActivity} exerciseType={exerciseType} />
              </div>
              
              {showDesk && (
                <>
                  {/* Thermos with details on desk */}
                  <div className="absolute bottom-2 right-12 w-5.5 h-10 bg-white border-2 border-stone-850 rounded-lg flex flex-col justify-between p-0.5 shadow-sm">
                    <div className="h-2 w-full bg-stone-800 rounded-sm"></div>
                    <div className="h-1.5 w-full bg-[#22c55e] animate-pulse rounded-sm"></div>
                    <div className="h-3 w-full bg-stone-200 rounded-b-sm"></div>
                  </div>
                  {/* Coffee dripper set on rooftop desk */}
                  <div className="absolute bottom-2 right-20 w-6.5 h-9 flex flex-col justify-end items-center">
                    <div className="w-5.5 h-2.5 bg-stone-700 border-2 border-stone-850 rounded-t-md"></div>
                    <div className="w-5 h-5 bg-amber-100 border-2 border-stone-850 rounded-full relative">
                      <div className="absolute bottom-0.5 left-1 w-3 h-3 bg-amber-900 border border-stone-850 rounded-sm"></div>
                    </div>
                    <div className="w-5.5 h-2 bg-stone-850 rounded-full"></div>
                  </div>
                  {/* Tiny potted cactus next to it */}
                  <div className="absolute bottom-2 right-4 w-5 h-7 flex flex-col items-center">
                    <div className="w-4 h-5 bg-green-700 rounded-t-full border-2 border-stone-850 relative">
                      <div className="absolute top-1 left-1.5 w-1 h-1 bg-[#22c55e] rounded-full animate-ping"></div>
                    </div>
                    <div className="w-5 h-3.5 bg-amber-700 border-2 border-stone-855 rounded-b-md"></div>
                  </div>
                </>
              )}
            </div>
          </div>
        );

      case 'latenight':
        return (
          <div className="absolute inset-0 bg-[#0d0721] overflow-hidden flex flex-col justify-end border-3 border-stone-955">
            {/* Fine circuit or cyber details on wall */}
            <div className="absolute top-2 right-4 opacity-45 text-[5.5px] text-green-450 font-mono select-none">
              CTRL LOG_SEC: ACTIVE | FREQ: 88.4Mhz
            </div>
            {/* Cyber neon glowing aesthetic sign - beautiful hand-drawn pill shape */}
            <div className="absolute top-2 left-6 px-3.5 py-1 border-3 border-stone-955 rounded-full bg-[#07070a] shadow-[4px_4px_0px_#111] text-center pointer-events-none z-10 animate-swing">
              <span className="text-[6px] font-mono tracking-widest text-purple-300 font-extrabold uppercase">SYS_ACTIVE: LO-FI ZONE 🎧</span>
            </div>
            {/* Glowing neon crescent moon hanging on the background wall */}
            <div className="absolute top-4 left-32 w-11 h-11 pointer-events-none z-10 flex items-center justify-center animate-[bounce_4s_infinite_alternate]">
              <svg className="w-9 h-9 text-yellow-300 drop-shadow-[0_0_12px_#ec4899]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3a9 9 0 1 0 9 9 9.1 9.1 0 0 1-9-9z animate-pulse" />
              </svg>
            </div>
            {/* Cute sleeping cat companion on bookshelf */}
            <div className="absolute right-24 top-[3px] pointer-events-none z-25">
              <span className="text-sm select-none" title="Lo-Fi sleeping kitty companion">🐈‍⬛💤</span>
            </div>

            {/* Neon stars and wall art for maximalist detail */}
            <div className="absolute left-4 top-13 text-xs text-pink-400 opacity-90 animate-pulse">✨</div>
            <div className="absolute right-3 top-14 text-xs text-cyan-400 opacity-95 animate-bounce">★</div>
            <div className="absolute right-26 top-5 text-sm text-yellow-350 opacity-80">✦</div>

            {/* Sweeping night city searchlight beams from bottom-right to top-left */}
            <div className="absolute right-10 bottom-24 w-1 h-32 bg-gradient-to-t from-[#22c55e]/35 to-transparent transform -rotate-45 origin-bottom pointer-events-none blur-[1px]"></div>
            <div className="absolute right-24 bottom-22 w-1.5 h-36 bg-gradient-to-t from-purple-500/30 to-transparent transform -rotate-35 origin-bottom pointer-events-none blur-[1.5px] animate-pulse"></div>

            {/* Window looking out at Night City (Rounded cozy look) */}
            <div className="absolute top-5 left-6 right-6 bottom-24 bg-[#0a0f1d] border-3 border-stone-955 rounded-2xl overflow-hidden p-2 shadow-[4px_4px_0px_#111]">
              <div className="h-full w-full relative">
                {/* Skyline inside window with neon window lights - cartoon tilted buildings */}
                <div className="absolute bottom-0 inset-x-0 h-4/5 flex items-end justify-between">
                  <div className="w-14 h-48 bg-stone-950 border-3 border-stone-955 border-b-0 flex flex-col space-y-2.5 p-1.5 rounded-t-xl transform rotate-[1.5deg]">
                    <div className="w-3.5 h-2 bg-[#22c55e] opacity-90 rounded-sm"></div>
                    <div className="w-3.5 h-2 bg-yellow-400 opacity-90 rounded-sm"></div>
                    <div className="w-3.5 h-2 bg-cyan-400 opacity-80 rounded-sm animate-pulse"></div>
                    <div className="w-2.5 h-1.5 bg-rose-500 opacity-90 rounded-sm"></div>
                  </div>
                  <div className="w-24 h-44 bg-zinc-950 border-3 border-stone-955 border-b-0 p-1.5 flex flex-wrap content-start gap-1 rounded-t-2xl relative transform -rotate-[1deg] shadow-[2px_2px_0px_#000]">
                    <div className="w-3 h-2.5 bg-white opacity-85 rounded-sm"></div>
                    <div className="w-3 h-2.5 bg-[#22c55e] opacity-95 rounded-sm animate-ping absolute top-1 right-2.5"></div>
                    <div className="w-3 h-2.5 bg-purple-400 opacity-85 rounded-sm"></div>
                    <div className="w-3 h-2.5 bg-cyan-350 opacity-95 rounded-sm"></div>
                    <div className="w-3 h-2.5 bg-pink-400 opacity-85 rounded-sm"></div>
                    {/* Tiny animated neon advertising sign on the building */}
                    <div className="absolute bottom-1.5 left-1.5 right-1.5 h-5 bg-gradient-to-r from-red-500 to-indigo-600 border-2 border-stone-955 rounded-md flex items-center justify-center">
                      <span className="text-[4px] font-mono text-white tracking-widest leading-none font-black animate-pulse">NEO_OS</span>
                    </div>
                  </div>
                  <div className="w-12 h-44 bg-stone-900 border-3 border-stone-955 border-b-0 rounded-t-lg flex flex-col space-y-1.5 p-1 transform rotate-[2deg]">
                    <div className="w-2 h-1.5 bg-red-500 opacity-90 rounded-xs"></div>
                    <div className="w-2.5 h-1.5 bg-amber-400 opacity-90 rounded-xs"></div>
                    <div className="w-2 h-2.2 bg-emerald-400 opacity-90 rounded-xs"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Small book shelf above desk with spinning retro cassette player + records (Rounded wooden plaque) */}
            <div className="absolute right-8 top-7 w-32 h-6 border-b-3 border-stone-955 flex items-end space-x-1 px-1.5 rounded-lg bg-stone-900/40">
              <div className="w-2.5 h-4.5 bg-rose-500 rounded-sm border-2 border-stone-955 transform rotate-[-4deg]"></div>
              <div className="w-2 h-5 bg-yellow-500 rounded-sm italic text-[3.5px] text-center text-stone-900 font-black border-2 border-stone-955 transform rotate-[3deg]">i</div>
              <div className="w-1.5 h-4 bg-amber-500 rounded-sm border-2 border-stone-955"></div>
              {/* Retro Casette Tape Player */}
              <div className="w-11 h-5.5 bg-purple-900 border-2 border-stone-955 rounded-md flex items-center justify-around px-0.5 shadow-[2px_2px_0px_#111]">
                {/* Rolling tape reels */}
                <div className="w-2.5 h-2.5 rounded-full border border-purple-300 flex items-center justify-center animate-spin" style={{ animationDuration: '3s' }}>
                  <div className="w-0.5 h-2.5 bg-purple-300"></div>
                </div>
                <div className="w-2.5 h-2.5 rounded-full border border-purple-300 flex items-center justify-center animate-spin" style={{ animationDuration: '3s' }}>
                  <div className="w-0.5 h-2.5 bg-purple-300"></div>
                </div>
              </div>
              {/* Little digital clock */}
              <div className="w-8 h-4.5 bg-zinc-950 border-2 border-stone-955 rounded-lg flex items-center justify-center -mb-px shadow-[2px_2px_0px_#111]">
                <span className="text-[5.5px] text-red-550 font-mono animate-pulse font-black">{(time.getHours() < 10 ? '0' : '') + time.getHours()}:{(time.getMinutes() < 10 ? '0' : '') + time.getMinutes()}</span>
              </div>
            </div>

            {/* Retro Gooseneck Lamp glowing on Left */}
            <div className="absolute left-2.5 bottom-20 w-8 h-40 pointer-events-none flex flex-col items-center">
              <div className={`w-12 h-6.5 border-3 border-stone-955 rounded-t-full transition-colors duration-300 ${isActive ? 'bg-[#22c55e]' : 'bg-neutral-100'} shadow-[2px_2px_0px_#111]`}></div>
              <div className="w-1.5 h-32 bg-stone-950 border-x-2 border-stone-955"></div>
              <div className="w-10 h-2 bg-stone-950 rounded-full border-2 border-stone-955 shadow-[2px_2px_0px_#111]"></div>
              {/* Light cone */}
              {isActive && (
                <div className="absolute top-6 left-1/2 -translate-x-1/2 w-48 h-36 bg-gradient-to-br from-[#22c55e]/30 via-[#22c55e]/5 to-transparent rounded-b-full blur-md animate-pulse"></div>
              )}
            </div>

            {/* Desk with steaming coffee/tea - hidden during idle */}
            <div className={`absolute bottom-0 inset-x-0 transition-all duration-300 flex flex-col justify-end items-center ${
              showDesk 
                ? "h-16 bg-white border-t-3 border-stone-955" 
                : "h-14 bg-gradient-to-b from-[#18181b] to-[#09090b] border-t-3 border-purple-500 shadow-[inset_0_4px_6px_rgba(168,85,247,0.3)]"
            }`}>
              {/* Desk shadow texture */}
              {showDesk && <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-b from-stone-300 to-transparent"></div>}
              
              <div className="absolute bottom-12">
                <CrewCharacter characterId={characterId} pose={pose} height={110} focusActivity={focusActivity} exerciseType={exerciseType} />
              </div>
              
              {showDesk && (
                <>
                  {/* Dual monitors in background on keyboard desk */}
                  <div className="absolute bottom-2 left-10 w-12 h-9 bg-zinc-900 border-3 border-stone-955 rounded-md p-0.5 flex flex-col justify-between shadow-[2px_2px_0px_#111]">
                    <div className="w-full h-5.5 bg-black rounded p-0.5 flex items-center justify-center border border-stone-955 shadow-inner">
                      <span className="text-[4.5px] font-mono text-cyan-400">code.tsx</span>
                    </div>
                    <div className="h-1.5 w-1.5 bg-stone-950 mx-auto rounded-b border-x border-b border-stone-955"></div>
                  </div>
                  {/* Steaming mug with beautiful curved steam path */}
                  <div className="absolute bottom-2 right-10 w-4.5 h-4.5 bg-stone-50 border-2 border-stone-955 rounded-sm shadow-[2px_2px_0px_#111]">
                    <div className="absolute left-3.5 top-1 w-2 h-2.2 border-2 border-stone-955 border-l-0 rounded-r-md"></div>
                    {isActive && (
                      <svg className="absolute -top-4 left-0.5 w-3 h-4" stroke="#22c55e" strokeWidth="1.2" fill="none">
                        <path d="M 1,12 Q 3,8, 1,4 T 1,0" className="animate-pulse" />
                      </svg>
                    )}
                  </div>
                  {/* Synth keyboard setup on the desk */}
                  <div className="absolute bottom-1.5 left-24 w-12 h-3.2 bg-[#1e1b4b] border-2 border-stone-955 rounded-md flex p-0.5 space-x-px shadow-xs">
                    <div className="flex-1 bg-white border-b border-stone-955 rounded-px"></div>
                    <div className="flex-1 bg-white border-b border-stone-955 rounded-px"></div>
                    <div className="flex-1 bg-white border-b border-stone-955 rounded-px"></div>
                    <div className="flex-1 bg-white border-b border-stone-955 rounded-px"></div>
                    <div className="flex-1 bg-white border-b border-stone-955 rounded-px"></div>
                    <div className="flex-1 bg-white border-b border-stone-955 rounded-px"></div>
                  </div>
                  {/* Elegant designer keyboard tray representation */}
                  <div className="absolute bottom-1 w-12 h-1 bg-stone-950 rounded-full"></div>
                </>
              )}
            </div>
          </div>
        );

      case 'cabin':
        return (
          <div className="absolute inset-0 bg-[#f4ece1] border-3 border-stone-955 flex flex-col justify-end overflow-hidden">
            {/* Plank background horizontal wood panel lines */}
            <div className="absolute inset-0 opacity-25 flex flex-col justify-around pointer-events-none p-1">
              <div className="h-0.5 bg-amber-900/60 shadow-xs"></div>
              <div className="h-0.5 bg-amber-900/60 shadow-xs"></div>
              <div className="h-0.5 bg-amber-900/60 shadow-xs"></div>
              <div className="h-0.5 bg-amber-900/60 shadow-xs"></div>
              <div className="h-0.5 bg-amber-900/60 shadow-xs"></div>
            </div>

            {/* Draped glowing warm amber bulb light string across cabin crown */}
            <div className="absolute top-1 inset-x-0 h-4 flex justify-around pointer-events-none z-20">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="w-0.5 h-2 bg-stone-950"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-300 border-2 border-stone-955 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.8)]" style={{ animationDelay: `${i * 0.3}s` }}></div>
                </div>
              ))}
            </div>

            {/* Hanging dried rosemary and herbal bundles from rafters */}
            <div className="absolute top-6 left-28 w-14 h-8 flex justify-around opacity-90 pointer-events-none z-10">
              <div className="flex flex-col items-center">
                <div className="w-px h-3 bg-[#451a03]"></div>
                <div className="w-3.5 h-4.5 bg-emerald-850 rounded-b-full border-2 border-stone-955 relative">
                  <div className="absolute bottom-0 w-full h-1 bg-amber-700/45"></div>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-px h-4 bg-[#451a03]"></div>
                <div className="w-3 h-4 bg-green-700 rounded-b-full border-2 border-stone-955 relative">
                  <div className="absolute bottom-0 w-full h-1.5 bg-amber-700/45"></div>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-px h-2 bg-[#451a03]"></div>
                <div className="w-3 h-5.5 bg-yellow-705 rounded-b-full opacity-80 border-2 border-stone-955 relative">
                  <div className="absolute bottom-0 w-full h-1 bg-amber-700/45"></div>
                </div>
              </div>
            </div>

            {/* Detailed fireplace logs stacked on the side with rustic guitar propped */}
            <div className="absolute left-2.5 bottom-14 flex flex-col space-y-0.5 z-20 pointer-events-none">
              <div className="w-5.5 h-3 bg-[#5c2a18] rounded-full border-2 border-stone-955 flex items-center justify-center p-0.5 relative shadow-[2px_2px_0px_#111]">
                <div className="w-2.5 h-1 bg-amber-850 rounded-full"></div>
              </div>
              <div className="w-6.5 h-3 bg-[#451a03] rounded-full border-2 border-stone-955 flex items-center justify-center p-0.5 transform rotate-6 relative shadow-[2px_2px_0px_#111]">
                <div className="w-3 h-1.2 bg-amber-900 rounded-full"></div>
              </div>
              <div className="w-5.5 h-3 bg-[#78350f] rounded-full border-2 border-stone-955 flex items-center justify-center p-0.5 transform -rotate-3 relative shadow-[2px_2px_0px_#111]">
                <div className="w-2.5 h-1 bg-amber-850 rounded-full"></div>
              </div>
            </div>

            {/* Cozy Wood Acoustic Guitar propped next to logs with thick outline and design details */}
            <div className="absolute left-4 bottom-14 w-5 h-12 pointer-events-none z-30 transform rotate-12">
              <div className="w-5 h-7 bg-gradient-to-b from-[#ea580c] to-amber-700 border-3 border-stone-955 rounded-full relative flex flex-col items-center shadow-[2px_2px_0px_#111]">
                {/* White design pickguard detail */}
                <div className="w-2 h-4 bg-white/40 absolute right-0.5 top-1.5 rounded-l-full pointer-events-none"></div>
                {/* Sound hole */}
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-90 w-2.5 h-2.5 bg-stone-900 border-2 border-stone-955 mt-1 flex items-center justify-center relative"></div>
                {/* Bridge */}
                <div className="w-3.5 h-1 bg-amber-950 absolute bottom-1.5 border-2 border-stone-955 rounded-xs"></div>
              </div>
              {/* Neck and headstock */}
              <div className="w-1.5 h-8 bg-amber-950 border-x-3 border-stone-955 absolute bottom-5 left-1.8 flex flex-col items-center">
                <div className="w-2.5 h-3 bg-amber-950 border-2 border-stone-955 rounded-t-xs -mt-2"></div>
              </div>
            </div>

            {/* Checked framed landscape paintings on wall */}
            <div className="absolute top-12 left-48 w-11 h-11 bg-amber-950 border-3 border-stone-955 p-0.5 rounded-lg z-10 shadow-[3px_3px_0px_#111] transform rotate-[-3deg]">
              <div className="w-full h-full bg-[#1c1917] flex items-center justify-center text-[7.5px]" title="Pine forest portrait">🌲</div>
            </div>
            <div className="absolute top-4 left-5 w-10 h-10 bg-amber-950 border-3 border-stone-955 p-0.5 rounded-full z-10 shadow-[3px_3px_0px_#111] transform rotate-[4deg] flex items-center justify-center">
              <div className="w-full h-full bg-[#0c4a6e] rounded-full flex items-center justify-center text-[7.5px]" title="Cozy mountain landscape">🏔️</div>
            </div>

            {/* Deer Antlers silhouette carved above fireplace */}
            <div className="absolute top-1 left-16 w-22 h-6 pointer-events-none opacity-45 flex items-center justify-center">
              <svg className="w-12 h-6 text-amber-950" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M 6,3 C 6,10 18,10 18,3 M 6,3 L 3,1 M 6,3 L 5,0 M 18,3 L 21,1 L 19,-1" />
              </svg>
            </div>

            {/* Stone fireplace (Hand-held Clay Dome Hearth design!) */}
            <div className="absolute left-16 bottom-14 w-22 h-32 bg-[#eedec9] border-3 border-stone-955 rounded-t-[3.5rem] flex flex-col justify-between p-1 z-10 shadow-[4px_4px_0px_#111]">
              {/* fireplace mantle shelf with steaming rustic kettle */}
              <div className="w-full h-3 bg-amber-850 rounded-lg border-b-3 border-stone-955 flex justify-around px-2 relative -mt-0.5">
                {/* Little steaming candle jar */}
                <div className="w-2 h-4 bg-amber-100 rounded-t-full -mt-2.5 border-x-2 border-stone-955 flex items-center justify-center">
                  <div className="w-1 h-1 bg-yellow-400 rounded-full animate-ping"></div>
                </div>
                {/* Steaming kettle with looping bubbles */}
                <div className="w-5 h-4.5 bg-stone-800 border-2 border-stone-955 rounded-t-md -mt-3.5 relative flex items-center justify-center">
                  <div className="w-2.5 h-0.5 bg-stone-950 absolute -top-1"></div>
                  {/* Spout and steam lines */}
                  <div className="absolute left-[-2px] top-1.5 w-1.5 h-1 bg-stone-850 transform -rotate-45 border-r border-t border-stone-955"></div>
                  <div className="absolute left-[-4px] top-[-3px] w-2 h-2 rounded-full border-t-2 border-orange-400 animate-bounce"></div>
                </div>
                <div className="w-2 h-3.5 bg-rose-500 rounded-md -mt-1.5 border-2 border-stone-955 flex items-center justify-center">
                  <div className="w-1 h-1 bg-amber-500 rounded-full"></div>
                </div>
              </div>

              {/* Fire brick grid and wild boiling stew pot over the flame */}
              <div className="w-full h-16 bg-[#b8b0a8] rounded-2xl border-2 border-stone-955 relative overflow-hidden flex flex-col justify-end p-0.5">
                <div className="absolute inset-0 opacity-15 grid grid-cols-4 gap-0.5 grid-rows-3 pointer-events-none">
                  {[...Array(12)].map((_, idx) => <div key={idx} className="border border-stone-805"></div>)}
                </div>
                <div className="h-11 w-full bg-stone-950 border-2 border-stone-955 rounded-xl flex items-end justify-center pb-1">
                  {/* Cast iron stew pot hanging above fire */}
                  <div className="absolute top-1 w-5.5 h-5 bg-stone-900 border-2 border-stone-955 rounded-b-xl flex items-center justify-center">
                    <span className="text-[5px] animate-bounce text-orange-400 font-bold">♨️</span>
                  </div>
                  {/* Active Fire Animation */}
                  <div className="flex space-x-1">
                    <div className="w-2.5 h-5 bg-[#ea580c] rounded-full animate-bounce"></div>
                    <div className="w-3.5 h-8 bg-[#f97316] rounded-full animate-pulse"></div>
                    <div className="w-2.5 h-5 bg-[#b91c1c] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Small cozy round porthole window showing falling snow & fine tree silhouette */}
            <div className="absolute right-8 top-4 w-24 h-24 bg-[#e0f2fe] border-3 border-stone-955 rounded-full overflow-hidden p-1.5 relative shadow-[4px_4px_0px_#111] z-10">
              {/* Curtains on window */}
              <div className="absolute top-0 bottom-0 left-0 w-3.5 bg-red-800 border-r-2 border-stone-955 shadow-md"></div>
              <div className="absolute top-0 bottom-0 right-0 w-3.5 bg-red-800 border-l-2 border-stone-955 shadow-md"></div>
              
              {/* Pine tree shape drawn beautifully with SVG */}
              <svg className="absolute bottom-1 left-2.5 w-14 h-16 pointer-events-none z-10" viewBox="0 0 24 24">
                <polygon points="12,2 5,14 19,14" fill="#2d4a13" stroke="#1c1917" strokeWidth="1.5" />
                <polygon points="12,6 7,20 17,20" fill="#3f6212" stroke="#1c1917" strokeWidth="1.5" />
                <rect x="11" y="20" width="2" height="4" fill="#451a03" stroke="#1c1917" strokeWidth="1.5" />
              </svg>
              
              {/* Falling snow dots */}
              <div className="absolute inset-0 bg-transparent animate-[rain_4s_linear_infinite] pointer-events-none">
                <div className="w-1.5 h-1.5 rounded-full bg-white absolute top-2 left-6"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-white absolute top-8 left-14 animate-pulse"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-white absolute top-12 left-4"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-white absolute top-16 left-20 animate-pulse"></div>
              </div>
            </div>

            {/* Table and items - hidden during non-working animations */}
            <div className={`absolute bottom-0 inset-x-0 transition-all duration-300 flex flex-col justify-end items-center ${
              showDesk 
                ? "h-14 bg-white border-t-3 border-stone-955" 
                : "h-14 bg-[#78350f] border-t-3 border-stone-955 shadow-[inset_0_4px_6px_rgba(0,0,0,0.4)] bg-[repeating-linear-gradient(0deg,transparent,transparent_10px,rgba(0,0,0,0.15)_10px,rgba(0,0,0,0.15)_11px)]"
            }`}>
              {/* Rug pattern layout */}
              <div className="absolute bottom-0 w-5/6 h-3.5 bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,#451a03_4px,#451a03_8px)] opacity-15 border-t-2 border-stone-955"></div>
              
              <div className="absolute bottom-10">
                <CrewCharacter characterId={characterId} pose={pose} height={110} focusActivity={focusActivity} exerciseType={exerciseType} />
              </div>

              {showDesk && (
                <>
                  <div className="absolute bottom-1.5 right-14 w-6.5 h-6 bg-emerald-50 border-2 border-stone-955 rounded-lg flex items-center justify-center shadow-[2px_2px_0px_#111]">
                    <span className="text-[7.5px] text-emerald-850 font-black">🌲</span>
                    {/* Steaming curl */}
                    <div className="absolute -top-3.5 left-2.5 w-2 h-3.5 bg-transparent border-r-2 border-emerald-500 animate-bounce" style={{ borderStyle: 'dotted' }}></div>
                  </div>
                </>
              )}
            </div>
          </div>
        );

      case 'library':
        return (
          <div className="absolute inset-0 bg-[#FAF9F5] flex flex-col justify-end overflow-hidden font-sans border-3 border-stone-955">
            {/* Hanging ivy leafy plant draped on the upper corner */}
            <div className="absolute left-6 top-1 pointer-events-none z-10 flex flex-col items-center animate-pulse">
              <span className="text-emerald-700 font-bold text-sm">🌿</span>
              <div className="w-0.5 h-3 bg-stone-950 -mt-1"></div>
            </div>
            <div className="absolute right-12 top-1 pointer-events-none z-10 flex flex-col items-center animate-pulse" style={{ animationDelay: '0.8s' }}>
              <span className="text-emerald-600 font-bold text-sm">🍃</span>
              <div className="w-0.5 h-5 bg-stone-950 -mt-1"></div>
            </div>

            {/* Magical Floating Glowing Candle */}
            <div className="absolute top-8 left-18 pointer-events-none z-20 flex flex-col items-center animate-bounce">
              <div className="w-3.5 h-3.5 bg-amber-300 rounded-full blur-[2px] animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.95)]"></div>
              <div className="w-2 h-1 bg-orange-500 rounded-full -mt-1"></div>
              <div className="w-3 h-6.5 bg-amber-50 border-2 border-stone-955 rounded-md shadow-[2px_2px_0px_#111]"></div>
              <div className="w-4 h-1.5 bg-yellow-600 border-x border-b border-stone-955 rounded-b-sm"></div>
            </div>

            {/* Glowing fairy search light float or sparkles behind shelves */}
            <div className="absolute top-6 left-1/4 w-3.5 h-3.5 rounded-full bg-emerald-400 opacity-60 filter blur-[1.5px] animate-ping"></div>

            {/* Wooden frame outline for bookshelves */}
            <div className="absolute top-1 inset-x-2 bottom-12 border-x-4 border-stone-955 opacity-30"></div>

            {/* Bookshelf back wall with actual STACKS of horizontal books */}
            <div className="absolute top-2 inset-x-4 bottom-14 grid grid-cols-6 gap-2.5 opacity-95 pointer-events-none">
              {[...Array(6)].map((_, col) => {
                const colorsArr = ['bg-rose-600', 'bg-amber-500', 'bg-stone-700', 'bg-blue-600', 'bg-emerald-600', 'bg-purple-605'];
                return (
                  <div key={col} className="border-r-2 border-b-2 border-stone-955 flex flex-col-reverse justify-start items-center space-y-reverse space-y-1 p-1 rounded-sm bg-stone-100/15 shadow-[2px_2px_0px_rgba(0,0,0,0.05)]">
                    {/* Horizontal stacks of books on each cabinet shelf */}
                    <div className={`w-14 h-4.5 ${colorsArr[col % 6]} border-2 border-stone-955 rounded-sm shadow-[2px_2px_0px_#111] relative flex items-center justify-center`}>
                      <div className="w-11 h-1 bg-white/30 rounded-xs"></div>
                      <span className="absolute right-1 text-[2.5px] font-black text-black/35 leading-none">=</span>
                    </div>
                    <div className={`w-12 h-4 ${colorsArr[(col + 2) % 6]} border-2 border-stone-955 rounded-sm shadow-[2px_2px_0px_#111] relative flex items-center justify-center transform rotate-1`}>
                      <div className="w-8 h-1 bg-white/20 rounded-xs"></div>
                    </div>
                    <div className={`w-13 h-4.5 ${colorsArr[(col + 4) % 6]} border-2 border-stone-955 rounded-sm shadow-[2px_2px_0px_#111] relative flex items-center justify-center transform -rotate-1`}>
                      <div className="w-10 h-0.5 bg-yellow-300 opacity-80 rounded-xs"></div>
                      <span className="absolute text-[3.5px] font-black tracking-wider text-stone-955/45 text-center truncate">SPELL</span>
                    </div>
                    {col % 2 === 0 && (
                      <div className={`w-10 h-3.5 bg-yellow-500 border-2 border-stone-955 rounded-sm shadow-[1.5px_1.5px_0px_#111] transform rotate-6 flex items-center justify-center`}>
                        <div className="w-7 h-0.5 bg-white/40 rounded-xs"></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Open reading armchair cozy outline on left corner - cozy fluffy red velvet armchair */}
            <div className="absolute left-3.5 bottom-12 w-11 h-14 pointer-events-none opacity-95 flex flex-col items-center justify-end z-10">
              {/* Backrest cushion */}
              <div className="w-10 h-11 bg-rose-800 border-2 border-stone-955 rounded-t-[1.5rem] relative shadow-[3px_3px_0px_#111]">
                {/* Accent pillow */}
                <div className="absolute bottom-1 left-2.5 w-5 h-5 bg-yellow-400 border-2 border-stone-955 rounded-lg transform rotate-45 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-yellow-600 rounded-full"></div>
                </div>
              </div>
              {/* Seat base and armrests */}
              <div className="w-12 h-5 bg-rose-900 border-2 border-stone-955 rounded-xl -mt-1 shadow-[2px_2px_0px_#111]"></div>
              {/* Chair feet */}
              <div className="w-9 h-1.5 flex justify-between px-1">
                <div className="w-1.5 h-full bg-amber-950 border-x-2 border-stone-955 rounded-full"></div>
                <div className="w-1.5 h-full bg-amber-950 border-x-2 border-stone-955 rounded-full"></div>
              </div>
            </div>

            {/* Medieval map scroll chest/pedestal on the side shelf */}
            <div className="absolute right-13 bottom-12 w-8 h-14 flex flex-col justify-end items-center pointer-events-none z-10">
              {/* Scroll paper */}
              <div className="w-6 h-7.5 bg-[#fefcbf] border-2 border-stone-955 p-0.5 rounded-lg flex flex-col justify-around shadow-[3px_3px_0px_#111] transform rotate-[-4deg]">
                <div className="h-0.5 w-full bg-amber-805/60 rounded-full"></div>
                <div className="h-0.5 w-full bg-amber-805/60 rounded-full"></div>
              </div>
              {/* Wooden small stand */}
              <div className="w-7.5 h-5.5 bg-amber-800 border-2 border-stone-955 rounded-t-md shadow-[2px_2px_0px_#111]"></div>
            </div>

            {/* Ladder leaning against shelves with cartoon round details */}
            <div className="absolute left-10 bottom-12 w-8 h-32 pointer-events-none">
              <div className="absolute inset-0 border-l border-r border-[#2a2a2a]/10 translate-x-1"></div>
              <div className="h-full border-l-2 border-r-2 border-stone-855 relative flex flex-col justify-between py-2">
                <div className="h-1.5 bg-stone-850 rounded-full shadow-xs"></div>
                <div className="h-1.5 bg-stone-850 rounded-full shadow-xs"></div>
                <div className="h-1.5 bg-stone-850 rounded-full shadow-xs"></div>
                <div className="h-1.5 bg-stone-850 rounded-full shadow-xs"></div>
                <div className="h-1.5 bg-stone-850 rounded-full shadow-xs"></div>
                <div className="h-1.5 bg-stone-850 rounded-full shadow-xs"></div>
              </div>
            </div>

            {/* Globe in Corner */}
            <div className="absolute right-3 bottom-12 w-10 h-14 flex flex-col items-center z-10">
              <div className="w-9 h-9 rounded-full border-2 border-stone-855 bg-sky-200 relative overflow-hidden flex items-center justify-center shadow-md">
                <div className="w-8 h-0.5 bg-stone-850 rotate-12"></div>
                {/* little continent design */}
                <div className="w-4.5 h-3.5 bg-emerald-500/70 rounded-full absolute top-1 left-2"></div>
                <div className="w-4 h-2.5 bg-emerald-500/70 rounded-full absolute bottom-1 right-1"></div>
              </div>
              {/* Curved brass stand arc */}
              <div className="w-1.5 h-4 border-l-2 border-r-2 border-stone-855 -mt-0.5"></div>
              <div className="w-7 h-2 bg-stone-850 rounded-full border border-stone-955 shadow-[2px_2px_0px_#111]"></div>
            </div>

            {/* Reading Desk - conditionally visible */}
            <div className={`absolute bottom-0 inset-x-0 transition-all duration-300 flex flex-col justify-end items-center ${
              showDesk 
                ? "h-12 bg-white border-t-3 border-stone-955" 
                : "h-12 bg-[#451a03] border-t-3 border-stone-955 shadow-[inset_0_4px_6px_rgba(0,0,0,0.55)] bg-[repeating-linear-gradient(90deg,transparent,transparent_20px,rgba(0,0,0,0.05)_20px,rgba(0,0,0,0.05)_21px)]"
            }`}>
              {showDesk && (
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-stone-200 via-transparent to-stone-200"></div>
              )}
              <div className="absolute bottom-8">
                <CrewCharacter characterId={characterId} pose={pose} height={110} focusActivity={focusActivity} exerciseType={exerciseType} />
              </div>
              {showDesk && (
                <>
                  {/* Banker lamp on reading desk */}
                  <div className="absolute bottom-1 right-20 w-6.5 h-7.5 flex flex-col items-center">
                    <div className="w-7 h-4.5 bg-emerald-800 border-2 border-stone-955 rounded-t-full shadow-md"></div>
                    <div className="w-0.5 h-3.5 bg-yellow-500 border-2 border-stone-955 block"></div>
                    <div className="w-4 h-1.5 bg-stone-800 rounded-full border border-stone-955 shadow-[1.5px_1.5px_0px_#111]"></div>
                  </div>
                  {/* Detailed stacks of thick antique books on library floor */}
                  <div className="absolute bottom-1 right-4 flex flex-col space-y-0.5 pointer-events-none z-10 animate-pulse">
                    <div className="w-9 h-2.5 bg-rose-600 border-2 border-stone-955 rounded-md shadow-[2px_2px_0px_#111]"></div>
                    <div className="w-9.5 h-2.5 bg-cyan-600 border-2 border-stone-955 rounded-md shadow-[2px_2px_0px_#111] translate-x-0.5"></div>
                  </div>
                </>
              )}
            </div>
          </div>
        );

      case 'deepspace':
        return (
          <div className="absolute inset-0 bg-[#020205] flex flex-col justify-end overflow-hidden border-3 border-stone-955">
            {/* Colorful Nebula Backdrop Gradient */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#ff007f]/25 via-[#7000ff]/25 to-[#020205] pointer-events-none"></div>

            {/* Twinkling Space Stars - high intensity bold cartoon sparkle dots */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(#ffffff_2.5px,transparent_2.5px)] bg-[size:32px_32px] opacity-60"></div>
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-8 left-12 w-3.5 h-3.5 bg-yellow-300 border-2 border-stone-955 rounded-full animate-ping"></div>
              <div className="absolute top-22 right-14 w-4 h-4 bg-white border-2 border-stone-955 rounded-full animate-pulse" style={{ animationDuration: '2.5s' }}></div>
              <div className="absolute top-32 left-[40%] w-3 h-3 bg-cyan-300 border-2 border-stone-955 rounded-full animate-ping" style={{ animationDuration: '4s' }}></div>
              <div className="absolute top-14 right-28 text-sm animate-bounce text-pink-400 font-bold">✦</div>
            </div>

            {/* Massive Circular Galactic Porthole with a double metal rivet cartoon frame */}
            <div className="absolute top-3 left-6 right-6 bottom-16 bg-[#010410] rounded-full border-4 border-stone-955 overflow-hidden flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.45)]">
              {/* Outer glass highlight glare */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-transparent pointer-events-none z-10"></div>
              
              {/* Planet outline or moon arc drifting with bold cartoon color and 3D look */}
              <div className="absolute border-4 border-[#22c55e]/60 border-b-0 w-36 h-36 rounded-full animate-[spin_100s_linear_infinite]" style={{ bottom: '-45px' }}>
                <div className="absolute -top-3.5 left-12 w-7 h-7 rounded-full bg-[#22c55e] border-3 border-stone-955 shadow-[0_0_15px_#22c55e]" />
              </div>
              
              {/* Beautiful secondary ringed Saturn-style planet in upper corner */}
              <div className="absolute top-3 right-10 w-11 h-11 rounded-full bg-gradient-to-br from-indigo-600 to-purple-800 border-3 border-stone-955 relative flex items-center justify-center shadow-md">
                {/* Thick ring */}
                <div className="absolute w-18 h-4.5 border-3 border-amber-400 bg-amber-300/30 rounded-full transform rotate-12 opacity-95 shadow-md animate-pulse"></div>
              </div>

              {/* Tiny floating sci-fi saucer UFO floating across space */}
              <div className="absolute top-6 left-12 pointer-events-none animate-bounce z-10 flex flex-col items-center">
                <span className="text-2xl filter drop-shadow-[2px_2px_0px_#000]" title="Drifting Cosmic Explorer UFO">🛸</span>
              </div>
            </div>

            {/* Cybernetic glowing wires and piping along corners - styled as thick, glowing neon neon cables */}
            <div className="absolute top-3 left-3 w-14 h-24 border-t-3 border-l-3 border-[#22c55e] rounded-tl-xl pointer-events-none shadow-[2px_2px_0px_#000]">
              <div className="absolute -right-1 top-4 w-3.5 h-2.5 bg-cyan-400 border-2 border-stone-955 rounded-sm animate-pulse"></div>
            </div>
            <div className="absolute top-3 right-3 w-14 h-24 border-t-3 border-r-3 border-purple-500 rounded-tr-xl pointer-events-none shadow-[-2px_2px_0px_#000]">
              <div className="absolute -left-1 top-8 w-3.5 h-2.5 bg-pink-400 border-2 border-stone-955 rounded-sm animate-pulse"></div>
            </div>

            {/* Space Panel Lines overlay / circuit details with control panel lights */}
            <div className="absolute inset-x-8 top-10 h-5 bg-stone-900 border-3 border-stone-955 flex justify-between px-3 rounded-b-xl shadow-md">
              <div className="w-2.5 h-2.5 bg-red-500 border-2 border-stone-955 rounded-full animate-pulse self-center"></div>
              <div className="w-2.5 h-2.5 bg-blue-400 border-2 border-stone-955 rounded-full animate-pulse self-center" style={{ animationDelay: '0.4s' }}></div>
              <div className="w-2.5 h-2.5 bg-yellow-400 border-2 border-stone-955 rounded-full animate-pulse self-center" style={{ animationDelay: '0.8s' }}></div>
            </div>

            {/* Dynamic starry hologram projector projecting a spinning 3D galaxy orbit above head */}
            <div className="absolute top-10 left-[210px] w-20 h-20 pointer-events-none z-10 flex flex-col items-center justify-center">
              <div className="w-9 h-9 rounded-full border-2 border-dashed border-cyan-400 animate-[spin_6s_linear_infinite] flex items-center justify-center">
                <div className="w-5 h-2.5 bg-cyan-400 border-2 border-cyan-200 animate-pulse rounded-full"></div>
              </div>
              <div className="w-4.5 h-2.5 bg-cyan-550 border-3 border-stone-955 rounded-full shadow-md -mt-0.5"></div>
            </div>

            {/* Flat console desk - styled as a glowing retro-future gaming battle-console */}
            <div className={`absolute bottom-0 inset-x-0 transition-all duration-300 flex flex-col justify-end items-center ${
              showDesk 
                ? "h-14 bg-[#0d111c] border-t-3 border-emerald-400 shadow-[0_-2px_12px_rgba(16,185,129,0.3)]" 
                : "h-14 bg-[#090c12] border-t-3 border-stone-955 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] bg-[repeating-linear-gradient(90deg,transparent,transparent_20px,rgba(34,197,94,0.05)_20px,rgba(34,197,94,0.05)_21px)]"
            }`}>
              {showDesk && (
                <>
                  {/* Futuristic holographic monitors */}
                  <div className="absolute bottom-1.5 left-10 w-12 h-10 bg-stone-950 border-2 border-stone-900 rounded-md p-1 flex flex-col justify-between shadow-md">
                    <div className="w-full h-6 bg-emerald-950/80 rounded border-2 border-stone-900 flex items-center justify-center text-[4px] text-green-400 font-mono">
                      {isActive ? <div className="w-8 h-2 bg-green-500/50 animate-pulse border-y border-green-400 rounded-sm"></div> : 'SYS_STB'}
                    </div>
                    <div className="h-1.5 w-5 bg-stone-750 mx-auto rounded-full border-2 border-stone-900 shadow-sm"></div>
                  </div>

                  {/* Zero Gravity Floating Notebook page */}
                  {isActive && (
                    <div className="absolute bottom-14 right-12 w-7 h-9 bg-white border-2 border-stone-955 rounded-lg text-[6.5px] p-1 animate-bounce shadow-md transform rotate-[5deg]">
                      📝<div className="w-full h-1 bg-stone-200 mt-1 rounded-sm"></div>
                    </div>
                  )}

                  {/* Spaceship warm focus mug (Cosmic Thermal Thermos) */}
                  <div className="absolute bottom-1.5 right-10 w-4.5 h-7 flex flex-col justify-end items-center">
                    <div className="w-4 h-5 bg-gradient-to-b from-purple-400 to-indigo-650 border-2 border-stone-955 rounded-sm relative flex items-center justify-center shadow-md">
                      <div className="absolute -left-1.5 top-1 w-2.5 h-3 border-2 border-stone-955 rounded-l-md pointer-events-none"></div>
                      <div className="w-2 h-2 bg-cyan-300 rounded-full scale-50"></div>
                    </div>
                    {/* Steam curl */}
                    <div className="w-1.5 h-2 bg-cyan-200/50 rounded-full blur-xxs animate-pulse mb-1"></div>
                  </div>
                </>
              )}
            </div>

            {/* Draggable and floating character in whole deep space */}
            <div
              id="draggable-space-character"
              style={{
                left: `${getPos('character').x}%`,
                top: `${getPos('character').y}%`,
                position: 'absolute',
                transform: 'translate(-50%, -50%)',
                touchAction: 'none',
              }}
              onMouseDown={(e) => handleStartDrag('character', e)}
              onTouchStart={(e) => handleStartDrag('character', e)}
              className="pointer-events-auto cursor-grab active:cursor-grabbing select-none z-35 animate-[zero-g-float_10s_ease-in-out_infinite] flex flex-col items-center"
              title={`${characterId.toUpperCase()} (Zero-G Space Explorer! Click & drag to float me around!)`}
            >
              <CrewCharacter 
                characterId={characterId} 
                pose={pose} 
                height={100} 
                focusActivity={focusActivity} 
                exerciseType={exerciseType} 
                hasAstronautHelmet={isActive}
              />
            </div>
          </div>
        );

      case 'dojo':
        return (
          <div className="absolute inset-0 bg-[#FAF9F5] flex flex-col justify-end overflow-hidden border-3 border-stone-955">
            {/* Drifting Cherry Blossom Petals */}
            <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
              <span className="absolute top-4 left-1/4 text-xs animate-[bounce_5s_infinite] opacity-75">🌸</span>
              <span className="absolute top-12 right-1/3 text-sm animate-ping opacity-60">🌸</span>
              <span className="absolute top-24 left-[10%] text-xs animate-bounce opacity-80" style={{ animationDelay: '1s' }}>🌸</span>
            </div>

            {/* Shoji screen panels with detailed wood lattices - thick cartoon borders */}
            <div className="absolute top-4 bottom-14 left-4 w-12 border-3 border-stone-955 flex flex-col justify-between p-1.5 rounded-xl bg-[#fffbeb] shadow-md">
              <div className="h-1 bg-stone-955 rounded-full"></div>
              <div className="h-1 bg-stone-955 rounded-full"></div>
              <div className="h-1 bg-stone-955 rounded-full"></div>
              <div className="h-1 bg-stone-955 rounded-full"></div>
            </div>
            <div className="absolute top-4 bottom-14 right-4 w-12 border-3 border-stone-955 flex flex-col justify-between p-1.5 rounded-xl bg-[#fffbeb] shadow-md">
              <div className="h-1 bg-stone-955 rounded-full"></div>
              <div className="h-1 bg-stone-955 rounded-full"></div>
              <div className="h-1 bg-stone-955 rounded-full"></div>
              <div className="h-1 bg-stone-955 rounded-full"></div>
            </div>

            {/* Traditional hanging calligraphy scrolls on both sides - cozy tilted scrolls with cute hanging red tassels */}
            <div className="absolute left-18 top-4 w-9 h-26 bg-[#fefcbf] border-3 border-stone-955 flex flex-col items-center justify-around py-1.5 shadow-[4px_4px_0px_#111] font-serif pointer-events-none transform rotate-[-2deg] rounded-md">
              <div className="w-7 h-2 bg-red-800 rounded-full -mt-1 shadow-md border-2 border-stone-955"></div>
              <span className="text-base font-black text-stone-90c leading-none">力</span>
              <div className="w-5 h-0.5 bg-stone-950/40"></div>
              <span className="text-[5.5px] font-black text-rose-650 tracking-wider">STRENGTH</span>
              {/* Cute little red hanging tassel */}
              <div className="w-1.5 h-3.5 bg-red-650 rounded-b-full border border-stone-955"></div>
            </div>
            <div className="absolute right-18 top-4 w-9 h-26 bg-[#fefcbf] border-3 border-stone-955 flex flex-col items-center justify-around py-1.5 shadow-[4px_4px_0px_#111] font-serif pointer-events-none transform rotate-[2deg] rounded-md">
              <div className="w-7 h-2 bg-red-800 rounded-full -mt-1 shadow-md border-2 border-stone-955"></div>
              <span className="text-base font-black text-stone-90a leading-none">忍</span>
              <div className="w-5 h-0.5 bg-stone-955/40"></div>
              <span className="text-[5.5px] font-black text-rose-655 tracking-wider">PATIENCE</span>
              {/* Cute little red hanging tassel */}
              <div className="w-1.5 h-3.5 bg-red-650 rounded-b-full border border-stone-955"></div>
            </div>

            {/* Beautiful flowering Bonsai Tree on miniature black lacquer stand - extra puffy cartoon fluffy crown with pink blossoms */}
            <div className="absolute left-6 bottom-10 w-11 h-16 pointer-events-none z-10 flex flex-col items-center">
              {/* Foliage - bubbly overlapping cloud style */}
              <div className="w-11 h-8 bg-emerald-950 rounded-full border-3 border-stone-955 relative shadow-md">
                <div className="absolute -top-3 left-1 w-8.5 h-7.5 bg-emerald-800 rounded-full border-b-2 border-stone-900"></div>
                {/* Pink blossom buds */}
                <div className="absolute top-1 right-2.5 w-2 h-2 bg-pink-400 border border-stone-955 rounded-full"></div>
                <div className="absolute top-3 left-1.5 w-1.5 h-1.5 bg-pink-300 border border-stone-955 rounded-full"></div>
                <div className="absolute top-4 left-5 w-2 h-2 bg-pink-405 border border-stone-955 rounded-full animate-bounce"></div>
              </div>
              {/* Bonsai twisted gnarled trunk */}
              <div className="w-3 h-4 bg-amber-955 border-x-3 border-stone-955"></div>
              {/* Hand-painted blue ceramic pot */}
              <div className="w-9 h-3 bg-sky-101 border-3 border-stone-955 rounded-lg flex justify-around px-0.5 items-center">
                <div className="w-1 h-1 bg-sky-500 rounded-full border border-stone-955"></div>
                <div className="w-1 h-1 bg-sky-500 rounded-full border border-stone-955"></div>
              </div>
            </div>

            {/* Crossed katanas on a beautiful wooden display rack on the back wall */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center">
              {/* Miniature sword rack block */}
              <div className="relative w-18 h-7 border-b-3 border-stone-955 flex justify-center">
                <div className="w-1.5 h-5.5 bg-amber-955 border-2 border-stone-955 rounded-lg absolute left-3"></div>
                <div className="w-1.5 h-5.5 bg-amber-955 border-2 border-stone-957 rounded-lg absolute right-3"></div>
                {/* Katana line with sheathe details */}
                <div className="absolute bottom-1 w-15 h-2 bg-gradient-to-r from-stone-850 to-stone-400 border-3 border-stone-955 rounded-md shadow-md flex items-center justify-start pl-1">
                  <div className="w-3.5 h-full bg-red-655 rounded-l-xs border-r-2 border-stone-955"></div>
                </div>
              </div>
            </div>

            {/* Sandbox Raked garden wave ripples - stylized white sand lines */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-48 h-8 opacity-75 border-t-3 border-stone-955 bg-[#e0deda] flex flex-col justify-around py-0.5 rounded-lg">
              <div className="h-0.5 bg-stone-350 rounded-full w-[95%] mx-auto"></div>
              <div className="h-0.5 bg-stone-350 rounded-full w-[90%] mx-auto"></div>
              <div className="h-0.5 bg-stone-350 rounded-full w-[85%] mx-auto"></div>
            </div>

            {/* Dojo platform wooden desk styling - conditionally visible */}
            <div className={`absolute bottom-0 inset-x-0 transition-all duration-300 flex flex-col justify-end items-center ${
              showDesk 
                ? "h-10 bg-[#fafafa] border-t-3 border-stone-955" 
                : "h-10 bg-[#d97706] border-t-3 border-stone-955 bg-[repeating-linear-gradient(90deg,transparent,transparent_24px,rgba(0,0,0,0.15)_24px,rgba(0,0,0,0.15)_25px)]"
            }`}>
              {/* Straw Tatami mat paneling detail */}
              {showDesk && (
                <div className="absolute bottom-0 inset-x-4 h-1.5 bg-[#451a03]/15 border-t-2 border-stone-955"></div>
              )}
              <div className="absolute bottom-8">
                <CrewCharacter characterId={characterId} pose={pose} height={110} focusActivity={focusActivity} exerciseType={exerciseType} />
              </div>

              {showDesk && (
                <>
                  {/* Steaming clay tea set on a tatami mat representation */}
                  <div className="absolute bottom-1 right-6 w-12 h-6 flex items-center justify-around z-10">
                    {/* Bamboo woven placement mat */}
                    <div className="absolute inset-x-0 bottom-0.5 h-2 bg-amber-800 border-t-2 border-stone-955 rounded-md"></div>
                    {/* Teapot */}
                    <div className="w-5 h-4.5 bg-[#c2410c] border-3 border-stone-955 rounded-t-lg relative flex items-center justify-center shadow-md">
                      {/* spout */}
                      <div className="w-1.5 h-1.5 bg-[#c2410c] border-r-2 border-t-2 border-stone-955 absolute -right-1 top-1.5 rounded-sm"></div>
                      {/* handle */}
                      <div className="w-3 h-3 border-2 border-stone-955 rounded-full absolute -left-1.5 top-0.5 pointer-events-none"></div>
                      {isActive && <div className="absolute -top-3.5 left-1 text-[8px] animate-bounce">💨</div>}
                    </div>
                    {/* Tiny cups with little green tea details */}
                    <div className="w-3 h-3 bg-[#ea580c] rounded-full border-2 border-stone-955 flex items-center justify-center relative">
                      <div className="w-1 h-1 bg-emerald-500 rounded-full"></div>
                    </div>
                    <div className="w-3 h-3 bg-[#ea580c] rounded-full border-2 border-stone-955 flex items-center justify-center relative">
                      <div className="w-1 h-1 bg-emerald-500 rounded-full"></div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        );

      case 'diner':
        return (
          <div className="absolute inset-0 bg-[#FFFDF9] flex flex-col justify-end overflow-hidden border-3 border-stone-955">
            {/* Checkerboard floor pattern on lower part with proper perspective - cartoon styled */}
            <div className="absolute bottom-0 inset-x-0 h-14 bg-stone-950 grid grid-cols-12 gap-1.5 opacity-100 p-1">
              {[...Array(24)].map((_, i) => (
                <div key={i} className={`h-6 rounded-md ${i % 2 === 0 ? 'bg-rose-500 border-2 border-stone-955 shadow-sm' : 'bg-white border-2 border-stone-955 shadow-sm'}`}></div>
              ))}
            </div>

            {/* Diner Window outside pale parking lot */}
            <div className="absolute top-4 inset-x-8 bottom-16 bg-[#e2e8f0] border-4 border-stone-955 rounded-xl p-1 shadow-md">
              <div className="h-full w-full relative overflow-hidden bg-gradient-to-b from-sky-400 via-pink-200 to-amber-100 rounded-lg">
                {/* Red outline glowing Neon sign on window */}
                <div className="absolute top-1.5 left-2 px-2 py-0.5 border-3 border-rose-500 text-rose-500 text-[6.5px] font-mono rounded-full bg-stone-950/90 animate-pulse font-extrabold shadow-[2px_2px_0px_#000] z-10">
                  🍔 LO-FI DINER
                </div>

                {/* Blue neon 24/7 sign on top right of window */}
                <div className="absolute top-1.5 right-2 px-2 py-0.5 border-3 border-cyan-400 text-cyan-400 text-[6.5px] font-mono rounded-full bg-stone-950/90 animate-pulse shadow-[2px_2px_0px_#000] font-extrabold z-10">
                  24HR COFFEE ☕
                </div>

                {/* Beautiful cartoon sun setting */}
                <div className="absolute bottom-2 left-10 w-11 h-11 bg-rose-450 border-3 border-stone-955 rounded-full animate-pulse"></div>

                {/* Telephone pole shape */}
                <div className="absolute bottom-0 right-4 w-2 bg-stone-900 h-16 relative border-l-2 border-stone-955">
                  <div className="absolute top-2 -left-3 w-8 h-1.5 bg-stone-900 rounded-full border-2 border-stone-955"></div>
                </div>
              </div>
            </div>

            {/* Red Vinyl Diner Booths on Left & Right - highly cartoony plush curves with bold outlines */}
            <div className="absolute left-2.5 bottom-12 w-11 h-13 pointer-events-none z-10 flex flex-col justify-end">
              {/* Booth Backrest */}
              <div className="w-4.5 h-12 bg-rose-600 border-3 border-stone-955 rounded-t-xl relative flex flex-col justify-around py-0.5 shadow-md">
                <div className="w-2 h-full bg-rose-450 border-r-3 border-stone-955 mx-auto rounded-full"></div>
              </div>
              {/* Booth Cushion */}
              <div className="w-11 h-5 bg-rose-700 border-3 border-stone-955 rounded-lg shadow-md relative">
                <div className="absolute inset-x-2 top-px h-1.5 bg-white opacity-80 rounded-full"></div>
              </div>
            </div>

            <div className="absolute right-2.5 bottom-12 w-11 h-13 pointer-events-none z-10 flex flex-col items-end justify-end">
              {/* Booth Backrest */}
              <div className="w-4.5 h-12 bg-rose-600 border-3 border-stone-955 rounded-t-xl relative flex flex-col justify-around py-0.5 shadow-md">
                <div className="w-2 h-full bg-rose-450 border-l-3 border-stone-955 mx-auto rounded-full"></div>
              </div>
              {/* Booth Cushion */}
              <div className="w-11 h-5 bg-rose-700 border-3 border-stone-955 rounded-lg shadow-md relative">
                <div className="absolute inset-x-2 top-px h-1.5 bg-white opacity-80 rounded-full"></div>
              </div>
            </div>

            {/* Center Diner Table with shiny silver pedestal */}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-12 w-18 h-9 pointer-events-none z-10 flex flex-col items-center justify-end animate-bounce" style={{ animationDuration: '3.5s' }}>
              {/* Tabletop with chrome bumper trim */}
              <div className="w-18 h-4 bg-yellow-50 border-3 border-stone-955 rounded-md relative shadow-md">
                <div className="absolute bottom-0 inset-x-0 h-2 bg-stone-300 rounded-b-sm border-t border-stone-955"></div>
              </div>
              {/* Pedestal pillar */}
              <div className="w-3.5 h-5 bg-stone-300 border-x-3 border-b-3 border-stone-955"></div>
            </div>

            {/* Flashing golden neon Open pointer arrow sign on the side */}
            <div className="absolute top-10 left-3 px-2 py-0.5 border-3 border-yellow-400 rounded-lg text-[6px] text-yellow-300 font-extrabold bg-stone-950 shadow-[2px_2px_0px_#000] animate-pulse">
              OPEN ➔
            </div>

            {/* Ceiling Fan rotating slowly - extremely cartoony */}
            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-24 h-6 pointer-events-none flex flex-col items-center">
              <div className="w-2 bg-stone-900 h-3 border-x-3 border-stone-955"></div>
              {/* Fan blades with animation */}
              <div className="w-24 h-2 bg-stone-900 rounded-full animate-[spin_5s_linear_infinite] border-2 border-stone-955"></div>
            </div>

            {/* Diner booth desk setup - conditionally visible */}
            <div className={`absolute bottom-0 inset-x-0 transition-all duration-300 flex flex-col justify-end items-center ${
              showDesk 
                ? "h-12 bg-white border-t-3 border-stone-955" 
                : "h-12 bg-transparent border-t-3 border-stone-955"
            }`}>
              <div className="absolute bottom-8">
                <CrewCharacter characterId={characterId} pose={pose} height={110} focusActivity={focusActivity} exerciseType={exerciseType} />
              </div>

              {showDesk && (
                <>
                  {/* Stack of Pancakes on a ceramic plate */}
                  <div className="absolute bottom-1 left-24 w-8.5 h-[18px] bg-sky-50 border-3 border-stone-955 rounded-lg flex items-center justify-center shadow-md">
                    {/* Stack layers */}
                    <div className="w-6 h-3 flex flex-col justify-end space-y-[-1px] relative">
                      <div className="w-6 h-1 bg-amber-200 border-t border-amber-350 rounded-md"></div>
                      <div className="w-6 h-1 bg-amber-300 border-t border-amber-350 rounded-md"></div>
                      <div className="w-6 h-1 bg-amber-400 rounded-md relative border-b border-stone-955">
                        {/* Butter square */}
                        <div className="w-2 h-1.5 bg-yellow-300 absolute top-[-1px] left-2 border-2 border-stone-955 rounded-xs"></div>
                      </div>
                    </div>
                  </div>

                  {/* tabletop jukebox on desk - colourful rainbow loops */}
                  <div className="absolute bottom-1 right-24 w-6.5 h-10 bg-amber-100 border-3 border-stone-955 rounded-t-xl flex flex-col justify-between p-0.5 shadow-md">
                    <div className="h-3 w-full bg-gradient-to-r from-red-500 via-yellow-400 to-blue-500 rounded-t-md animate-pulse"></div>
                    <div className="h-5 w-full bg-stone-900 border-2 border-stone-955 rounded-sm flex flex-col justify-around p-0.5">
                      <div className="w-full h-1 bg-cyan-400 animate-pulse"></div>
                      <div className="w-full h-1 bg-pink-500" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>

                  {/* Delicious retro milkshake with striped straw & cherry */}
                  <div className="absolute bottom-1 right-12 w-5.5 h-[19px] bg-[#fdf2f8]/80 border-3 border-stone-955 rounded-t-lg flex flex-col justify-end items-center p-0.5 shadow-sm">
                    {/* Straw */}
                    <div className="w-1.5 h-5 bg-rose-500 absolute top-[-7px] right-1 transform rotate-12 rounded-full border-2 border-stone-955"></div>
                    {/* Cherry */}
                    <div className="w-3 h-3 rounded-full bg-rose-600 top-0.5 absolute shadow-sm border-2 border-stone-955 animate-bounce"></div>
                    {/* glass stem */}
                    <div className="w-3.5 h-1 bg-stone-400 border border-stone-955 rounded-b-md"></div>
                  </div>

                  {/* Diner mustard and ketchup squirt bottles on booth table */}
                  <div className="absolute bottom-1 right-2 w-5 h-6 flex items-end space-x-1">
                    <div className="w-2 h-5 bg-yellow-455 border-3 border-stone-955 rounded-t-md relative">
                      <div className="w-1 h-2 bg-yellow-455 absolute top-[-1.5px] left-0.5 rounded-sm border-t-2 border-x-2 border-stone-955"></div>
                    </div>
                    <div className="w-2 h-5 bg-red-555 border-3 border-stone-955 rounded-t-md relative">
                      <div className="w-1 h-2 bg-red-400 absolute top-[-1.5px] left-0.5 rounded-sm border-t-2 border-x-2 border-stone-955"></div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        );

      case 'penthouse':
        return (
          <div className="absolute inset-0 bg-[#FAFAFC] border-3 border-stone-955 flex flex-col justify-end overflow-hidden">
            {/* Rich walnut panel styling for floors - more cartooning with thick, bold 3px plank seams */}
            <div className="absolute bottom-0 inset-x-0 h-14 bg-gradient-to-b from-[#7c2d12] to-[#451a03] border-t-3 border-stone-955 z-0">
              <div className="w-full h-1.5 border-b-3 border-stone-955/40"></div>
              <div className="w-full h-1.5 border-b-3 border-stone-955/40 mt-1.5"></div>
              <div className="w-full h-1.5 border-b-3 border-stone-955/40 mt-1.5"></div>
            </div>

                 <div className="absolute inset-x-0 top-0 bottom-12 border-b-3 border-stone-955 bg-sky-100/10 overflow-hidden z-0 shadow-md">
              {/* Vibrant daytime sky background (Miami/Dubai inspired) */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#06b6d4] via-[#67e8f9] to-[#fef08a]">
                {/* Warm Glowing Sun - thicker outer cartoon yellow rings */}
                <div className="absolute top-4 left-10 w-14 h-14 bg-amber-300 rounded-full border-3 border-stone-955 shadow-[0_0_20px_#f59e0b] animate-ping" style={{ animationDuration: '4s' }}></div>
                <div className="absolute top-4 left-10 w-14 h-14 bg-yellow-200 rounded-full border-3 border-stone-955 shadow-[inset_0_2px_4px_#fff]"></div>
                
                {/* Drifting white daytime clouds - thick, puffy, and cartoony */}
                <div className="absolute top-5 right-10 w-20 h-8 bg-white rounded-full border-3 border-stone-955 shadow-[3px_3px_0px_#111] animate-[drift_30s_linear_infinite] flex items-center justify-center font-bold text-[7px] text-zinc-400">☁️</div>
                <div className="absolute top-12 left-24 w-14 h-6.5 bg-white/90 rounded-full border-3 border-stone-955 shadow-[3px_3px_0px_#111] animate-[drift_45s_linear_infinite]"></div>
              </div>

              {/* Skyline Skyscrapers - Dubai / Miami Inspired Icons in Daytime with bold cartoony borders */}

              {/* 1. Dubai Sail-Shaped Luxury Tower */}
              <div className="absolute bottom-10 left-8 w-15 h-38 border-l-4 border-t-4 border-stone-955 rounded-tl-[100%] bg-sky-200 relative overflow-hidden z-10 shadow-[4px_4px_0px_#111]">
                {/* Glass reflections */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/95 via-transparent to-transparent"></div>
                <div className="absolute left-2.5 top-5 w-12 h-1.5 bg-white/80 transform rotate-[25deg] rounded-full"></div>
                <div className="absolute left-2 top-12 w-12 h-1.5 bg-white/80 transform rotate-[38deg] rounded-full"></div>
                <div className="absolute left-1.5 top-20 w-12 h-1.5 bg-white/80 transform rotate-[50deg] rounded-full"></div>
                {/* Mast */}
                <div className="absolute right-0 top-0 bottom-0 w-2 bg-stone-955"></div>
                {/* Helipad outrigger */}
                <div className="absolute left-1 top-8 w-6 h-2 bg-sky-400 border-2 border-stone-955 rounded-full"></div>
              </div>

              {/* 2. Miami Hot Pink Art Deco Hotel Tower */}
              <div className="absolute bottom-10 left-[26%] w-13 h-46 bg-purple-900 border-3 border-stone-955 rounded-t-xl z-10 flex flex-col justify-between p-1 shadow-[4px_4px_0px_#111]">
                {/* Neon hot-pink top crown */}
                <div className="w-full h-4 bg-pink-500 rounded-t-lg border-b-2 border-stone-955 shadow-[0_0_15px_#ec4899] relative flex justify-center">
                  <div className="w-2 h-4 bg-white absolute top-[-8px] animate-pulse rounded-full border-2 border-stone-955"></div>
                </div>
                {/* Modern clean windows under the pastel hotel top border */}
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="flex justify-around">
                    <div className="w-2.5 h-2.5 bg-cyan-350 border border-stone-955 rounded-sm animate-pulse"></div>
                    <div className="w-2.5 h-2.5 bg-yellow-101 border border-stone-955 rounded-sm animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                    <div className="w-2.5 h-2.5 bg-white border border-stone-955 rounded-sm"></div>
                  </div>
                ))}
              </div>

              {/* 3. Dubai Burj Supertall Spire (Burj Khalifa Needle) */}
              <div className="absolute bottom-10 left-[48%] -translate-x-1/2 w-10 h-58 z-10 flex flex-col items-center justify-end">
                {/* Spire Node */}
                <div className="w-1.5 h-14 bg-stone-500 relative border-x-2 border-stone-955">
                  <div className="w-2 h-2 bg-red-400 rounded-full absolute -top-1 left-[-2px] animate-ping"></div>
                </div>
                {/* Top tier */}
                <div className="w-4 h-10 bg-zinc-200 border-3 border-stone-955 flex flex-col justify-around rounded-t-md"></div>
                {/* Middle tier */}
                <div className="w-7 h-18 bg-zinc-100 border-3 border-stone-955 flex flex-col justify-between py-1 px-0.5 rounded-t-md shadow-sm">
                  <div className="flex justify-around">
                    <div className="w-1.5 h-1.5 bg-cyan-300 rounded-full border border-stone-955"></div>
                    <div className="w-1.5 h-1.5 bg-cyan-300 rounded-full border border-stone-955"></div>
                  </div>
                  <div className="flex justify-around">
                    <div className="w-1.5 h-1.5 bg-white rounded-full border border-stone-955"></div>
                    <div className="w-1.5 h-1.5 bg-white rounded-full border border-stone-955"></div>
                  </div>
                </div>
                {/* Lower tier */}
                <div className="w-10 h-22 bg-stone-200 border-3 border-stone-955 flex flex-col justify-around p-0.5 rounded-t-md">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex justify-around">
                      <div className="w-2 h-2 bg-sky-350 rounded-sm border border-stone-955"></div>
                      <div className="w-2 h-2 bg-white rounded-sm border border-stone-955"></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Twisted Marina Twister Tower (Cayan Tower style) */}
              <div className="absolute bottom-10 right-[25%] w-12 h-50 bg-amber-100 border-3 border-stone-955 rounded-t-md z-10 flex flex-col justify-between p-1 shadow-[4px_4px_0px_#111]">
                {/* Rounded golden helicopter pad on top */}
                <div className="w-9 h-2 bg-amber-500 self-center rounded-md border-2 border-stone-955"></div>
                {/* Levels twist */}
                {[...Array(8)].map((_, i) => {
                  const alignment = i % 3 === 0 ? "justify-start pl-0.5" : i % 3 === 1 ? "justify-center" : "justify-end pr-0.5";
                  return (
                    <div key={i} className={`flex ${alignment} space-x-1 h-3`}>
                      <div className="w-3.5 h-2.5 bg-sky-250 rounded-sm border border-stone-955"></div>
                      <div className="w-3.5 h-2.5 bg-rose-300 rounded-sm border border-stone-955"></div>
                    </div>
                  );
                })}
              </div>

              {/* 5. Gold Dome Penthouse Supertall (Miami Coast Plaza layout) */}
              <div className="absolute bottom-10 right-8 w-13 h-36 bg-amber-50 border-3 border-stone-955 z-10 flex flex-col justify-between p-1 rounded-t-xl shadow-[4px_4px_0px_#111]">
                {/* Golden dome crown */}
                <div className="w-10 h-5 bg-gradient-to-t from-amber-400 to-yellow-250 rounded-t-full self-center flex items-center justify-center border-2 border-stone-955">
                  <span className="scale-75 text-[4px] font-black text-stone-950 font-mono">GOLD</span>
                </div>
                {/* Luxury windows */}
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex justify-around">
                    <div className="w-2.5 h-1.5 bg-sky-200 rounded-sm border border-stone-955"></div>
                    <div className="w-2.5 h-1.5 bg-amber-200 rounded-sm border border-stone-955"></div>
                    <div className="w-2.5 h-1.5 bg-stone-350 rounded-sm border border-stone-955"></div>
                  </div>
                ))}
              </div>

              {/* Miami / Dubai Marina Ocean Bay during daytime */}
              <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-[#bae6fd] via-[#e0f2fe] to-transparent border-t-2 border-sky-400 z-10">
                {/* Shiny white reflections on the water */}
                <div className="absolute bottom-2 left-[12%] w-12 h-1 bg-white rounded-full"></div>
                <div className="absolute bottom-1 left-[28%] w-16 h-1 bg-white rounded-full animate-pulse"></div>
                <div className="absolute bottom-3 left-[48%] w-24 h-1 bg-white rounded-full"></div>
                <div className="absolute bottom-1.5 left-[72%] w-14 h-1 bg-yellow-200 rounded-full"></div>
                <div className="absolute bottom-2.5 left-[84%] w-10 h-1 bg-white rounded-full animate-pulse"></div>

                {/* Shimmering Sailing luxury yachts / cruisers in daylight */}
                <div className="absolute bottom-4 left-[35%] flex items-end space-x-1 opacity-90 animate-bounce">
                  <div className="w-6 h-2 bg-white border-2 border-stone-955 rounded-bl-sm relative">
                    <div className="absolute top-[-2px] right-0.5 w-3.5 h-2 bg-sky-100 border-2 border-stone-955 rounded-t-xs"></div>
                  </div>
                </div>
                <div className="absolute bottom-3 right-[35%] flex items-end space-x-1 opacity-90">
                  <div className="w-5 h-2 bg-white border-2 border-stone-955 rounded-bl-sm relative">
                    <div className="absolute top-[-2px] right-0.5 w-3 h-2 bg-sky-100 border-2 border-stone-955 rounded-t-xs"></div>
                  </div>
                </div>
              </div>

              {/* Perfectly Styled Silhouette Palm Trees framing the waterfront edges */}
              <svg className="absolute bottom-5 left-1 w-12 h-14 text-emerald-900 z-20 pointer-events-none fill-current filter drop-shadow-[2px_2px_0px_#000]" viewBox="0 0 24 24">
                <path d="M 4,24 Q 8,16, 12,8 Q 11,8, 11,8" stroke="currentColor" strokeWidth="1.8" fill="none" />
                <path d="M 12,8 Q 8,6, 5,9 M 12,8 Q 9,4, 11,1 M 12,8 Q 15,4, 17,2 M 12,8 Q 16,7, 19,10 M 12,8 Q 14,10, 16,13 M 12,8 Q 10,10, 8,13" stroke="currentColor" strokeWidth="1.8" fill="none" />
              </svg>

              <svg className="absolute bottom-6 right-1 w-10 h-13 text-emerald-900 z-20 pointer-events-none fill-current filter drop-shadow-[2px_2px_0px_#000]" viewBox="0 0 24 24">
                <path d="M 20,24 Q 16,17, 12,10" stroke="currentColor" strokeWidth="1.6" fill="none" />
                <path d="M 12,10 Q 8,8, 5,11 M 12,10 Q 10,6, 11,3 M 12,10 Q 14,6, 16,4 M 12,10 Q 16,9, 18,12 M 12,10 Q 13,12, 14,15" stroke="currentColor" strokeWidth="1.6" fill="none" />
              </svg>

              {/* Vertical / Horizontal premium gold/chrome glass panes and dividers */}
              <div className="absolute inset-0 grid grid-cols-6 gap-x-px pointer-events-none opacity-25">
                <div className="h-full border-r-2 border-stone-955"></div>
                <div className="h-full border-r-2 border-stone-955"></div>
                <div className="h-full border-r-2 border-stone-955"></div>
                <div className="h-full border-r-2 border-stone-955"></div>
                <div className="h-full border-r-2 border-stone-955"></div>
                <div className="h-full"></div>
              </div>
              <div className="absolute inset-y-16 inset-x-0 border-b-2 border-stone-955 pointer-events-none opacity-25"></div>
            </div>

            {/* Elegant Side-View Mahogany Pool Table - more cartoonish */}
            <div className="absolute left-3 bottom-12 w-28 h-13 pointer-events-none z-10 flex flex-col justify-end">
              <div className="relative w-full h-11 flex flex-col justify-end">
                {/* Slim, highly-angled top rail edge showing the green felt as a razor-thin line */}
                <div className="w-full h-2.5 bg-[#22c55e] border-t-3 border-x-3 border-stone-955 rounded-t-md relative flex justify-between px-1">
                  {/* Billiard Balls visible resting on the top edge (tiny colored dots overlapping the edge) */}
                  <div className="absolute top-[-3px] left-8 w-2 h-2 bg-yellow-450 rounded-full border-2 border-stone-955"></div>
                  <div className="absolute top-[-3.5px] left-10 w-2 h-2 bg-rose-600 rounded-full border-2 border-stone-955 animate-bounce"></div>
                  <div className="absolute top-[-3px] left-12 w-2 h-2 bg-blue-600 rounded-full border-2 border-stone-955"></div>
                  <div className="absolute top-[-2.5px] right-8 w-2 h-2 bg-white rounded-full border-2 border-stone-955"></div>
                </div>

                {/* Main heavy wooden side apron */}
                <div className="w-full h-5 bg-[#7c2d12] border-x-3 border-b-3 border-stone-955 relative flex justify-between items-center px-1">
                  {/* Inlaid Diamond sights */}
                  <div className="flex space-x-4 absolute inset-x-4 top-1 justify-center">
                    <div className="w-1.5 h-1.5 bg-yellow-50 rotate-45 border border-stone-955"></div>
                    <div className="w-1.5 h-1.5 bg-yellow-50 rotate-45 border border-stone-955"></div>
                    <div className="w-1.5 h-1.5 bg-yellow-50 rotate-45 border border-stone-955"></div>
                  </div>

                  {/* Corner and Middle pocket plates */}
                  <div className="absolute left-[-2px] top-0 w-3.5 h-4 bg-amber-400 border-2 border-stone-955 rounded-b-md shadow-sm"></div>
                  <div className="absolute right-[-2px] top-0 w-3.5 h-4 bg-amber-400 border-2 border-stone-955 rounded-b-md shadow-sm"></div>
                  <div className="absolute left-1/2 -translate-x-1/2 top-0 w-3.5 h-3 bg-amber-400 border-2 border-stone-955 rounded-b-sm shadow-sm"></div>

                  {/* Elegant gold plate sign on side apron */}
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-0.5 w-5 h-1.5 bg-amber-200 rounded-sm border border-stone-955 flex items-center justify-center">
                    <div className="w-3 h-0.5 bg-amber-800 scale-50"></div>
                  </div>
                </div>

                {/* Sturdy carved wooden legs at the bottom corners */}
                <div className="absolute bottom-0 left-1 w-4 h-5 bg-[#451a03] border-x-3 border-stone-955 flex flex-col justify-end">
                  {/* Chrome leveler foot at very bottom */}
                  <div className="w-5 h-1.5 bg-zinc-400 border-2 border-stone-955 rounded-t-md ml-[-2px]"></div>
                </div>
                <div className="absolute bottom-0 right-1 w-4 h-5 bg-[#451a03] border-x-3 border-stone-955 flex flex-col justify-end">
                  {/* Chrome leveler foot at very bottom */}
                  <div className="w-5 h-1.5 bg-zinc-400 border-2 border-stone-955 rounded-t-md ml-[-2px]"></div>
                </div>

                {/* Cue sticks leaning elegantly against the table */}
                <div className="absolute left-2.5 top-[-4px] w-1.5 h-14 bg-amber-300 border-2 border-stone-955 origin-bottom-left hover:rotate-1 transform -rotate-[15deg] z-20 shadow-md flex flex-col justify-between">
                  {/* White cue tip */}
                  <div className="w-full h-1.5 bg-stone-100 border-b border-stone-955"></div>
                  {/* Accent wrapping */}
                  <div className="w-full h-1.5 bg-black"></div>
                </div>
                <div className="absolute left-6 top-[-4px] w-1.5 h-14 bg-amber-300 border-2 border-stone-955 origin-bottom-left hover:-rotate-1 transform rotate-[18deg] z-20 shadow-md flex flex-col justify-between">
                  {/* White cue tip */}
                  <div className="w-full h-1.5 bg-stone-100 border-b border-stone-955"></div>
                  {/* Accent wrapping */}
                  <div className="w-full h-1.5 bg-black"></div>
                </div>
                
                {/* Ball rack holder triangle resting on the side leg/frame */}
                <div className="absolute right-5 bottom-4 w-4 h-4 border-2 border-stone-955 rotate-12 flex items-center justify-center rounded-sm opacity-90">
                  {/* Inside rack detail */}
                  <div className="w-2 h-2 bg-amber-950 rounded-sm"></div>
                </div>
              </div>
            </div>

            {/* Elegant Modern Luxury Couch with normal comfortable form and rounded contouring */}
            <div className="absolute right-2.5 bottom-12 w-28 h-9 pointer-events-none z-10 flex flex-col justify-end">
              <div className="relative w-full h-7">
                {/* Main rounded backrest */}
                <div className="absolute inset-x-2 top-0 h-5 bg-[#fef3c7] border-3 border-stone-955 rounded-t-xl shadow-md flex justify-around px-2">
                  <div className="w-0.5 h-full bg-amber-200/50"></div>
                  <div className="w-0.5 h-full bg-amber-200/50"></div>
                </div>
                {/* Left Armrest (rounded cushion) */}
                <div className="absolute bottom-0 left-0 w-4 h-6.5 bg-[#fde68a] border-3 border-stone-955 rounded-xl z-30 shadow-md"></div>
                {/* Right Armrest (rounded cushion) */}
                <div className="absolute bottom-0 right-0 w-4 h-6.5 bg-[#fde68a] border-3 border-stone-955 rounded-xl z-30 shadow-md"></div>
                {/* Soft plush seat cushions */}
                <div className="absolute bottom-0 inset-x-3 h-4 bg-[#fde68a] border-x-3 border-b-3 border-stone-955 rounded-b-xl z-20 flex items-center justify-around"></div>
                {/* Contrast designer throw pillows sitting comfortably */}
                <div className="w-4.5 h-4.5 bg-rose-500 border-3 border-stone-955 rounded-md rotate-12 absolute left-5 bottom-1.5 z-25 shadow-md flex items-center justify-center font-bold text-[6px]">💖</div>
                <div className="w-4.5 h-4.5 bg-stone-900 border-3 border-stone-955 rounded-md -rotate-12 absolute right-6 bottom-1.5 z-25 shadow-md flex items-center justify-center font-bold text-[6px]">⭐</div>
              </div>
            </div>

            {/* Contemporary hanging brass pendant ceiling lamp centered */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-10 flex flex-col items-center pointer-events-none z-10">
              <div className="w-1 bg-yellow-500 h-6 border-x-2 border-stone-955"></div>
              <div className="w-10 h-4 bg-yellow-500 rounded-t-full border-3 border-stone-955 relative shadow-inner">
                {/* Amber warm glow light bulb */}
                <div className={`absolute -bottom-2 left-3.5 w-3 h-3 rounded-full border-2 border-stone-955 transition-all duration-300 ${isActive ? 'bg-amber-300 shadow-[0_0_15px_#eab308]' : 'bg-stone-300'}`}></div>
              </div>
            </div>

            {/* Glass Console & Desk Section placement */}
            <div className={`absolute bottom-0 inset-x-0 transition-all duration-300 flex flex-col justify-end items-center z-20 ${
              showDesk 
                ? "h-12 bg-transparent" 
                : "h-12 bg-transparent"
            }`}>
              <div className="absolute bottom-8">
                <CrewCharacter characterId={characterId} pose={pose} height={110} focusActivity={focusActivity} exerciseType={exerciseType} />
              </div>

              {showDesk && (
                <>
                  {/* Premium sleek glass slab floating table console */}
                  <div className="absolute bottom-0 inset-x-22 h-1.5 bg-cyan-200 border-t-3 border-stone-955 shadow-md"></div>
                  {/* Luxury golden champagne flute on coaster */}
                  <div className="absolute bottom-1 right-20 w-5 h-6 flex flex-col justify-end items-center pointer-events-none z-30">
                    <div className="w-2.5 h-3.5 bg-gradient-to-b from-amber-200 to-amber-500 rounded-t-sm border-2 border-stone-955 relative flex flex-col justify-between">
                      <div className="w-1 h-1 rounded-full bg-white absolute top-0.5 right-0.5 animate-pulse"></div>
                    </div>
                    <div className="w-0.5 h-1.5 bg-amber-500 border-x border-stone-955"></div>
                    <div className="w-2.5 h-1 bg-amber-600 rounded-full border border-stone-955"></div>
                  </div>

                  {/* Elegant Golden Bonsai bowl plant on desk left */}
                  <div className="absolute bottom-1 left-6 w-6 h-7 flex flex-col items-center z-30">
                    <div className="w-5.5 h-5 bg-[#4d7c0f] rounded-full relative border-2 border-stone-955 shadow-sm">
                      <div className="absolute -top-1.5 left-1 w-2.5 h-2.5 bg-green-500 rounded-full border border-stone-955"></div>
                    </div>
                    <div className="w-4 h-1.5 bg-amber-900 rounded-b-sm border-2 border-stone-955"></div>
                  </div>
                </>
              )}
            </div>
          </div>
        );
    }
  };

  // Render physical items equipped in active workspaces with drag and drop capabilities
  const renderItemDecorations = () => {
    if (!equippedItems || equippedItems.length === 0) return null;
    
    const renderItemContainer = (itemId: string, title: string, content: React.ReactNode) => {
      const scale = itemScales[itemId] || 1;
      const pos = getPos(itemId);
      return (
        <div
          id={`decor-${itemId}`}
          style={{
            left: `${pos.x}%`,
            top: `${pos.y}%`,
            position: 'absolute',
            touchAction: 'none',
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
          }}
          onMouseDown={(e) => handleStartDrag(itemId, e)}
          onTouchStart={(e) => handleTouchStart(itemId, e)}
          onWheel={(e) => handleWheel(itemId, e)}
          className="group flex flex-col items-center pointer-events-auto cursor-grab active:cursor-grabbing select-none"
          title={`${title} (Drag to move, Pinch/Scroll/Click +/- to resize!)`}
        >
          {content}

          {/* Sizing controller bubble on hover */}
          <div className="absolute -bottom-8 bg-white/95 border border-[#2a2a2a] rounded-md px-1 py-0.5 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto scale-75 shadow-sm z-30">
            <button
              onClick={(e) => {
                e.stopPropagation();
                updateScale(itemId, scale - 0.1);
              }}
              className="w-4.5 h-4.5 flex items-center justify-center bg-stone-100 rounded text-[11px] font-black hover:bg-stone-200 cursor-pointer text-stone-700"
            >
              -
            </button>
            <span className="text-[9px] font-bold font-mono text-stone-600">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                updateScale(itemId, scale + 0.1);
              }}
              className="w-4.5 h-4.5 flex items-center justify-center bg-stone-100 rounded text-[11px] font-black hover:bg-stone-200 cursor-pointer text-stone-700"
            >
              +
            </button>
          </div>
        </div>
      );
    };

    return (
      <div className="absolute inset-0 pointer-events-none z-25 select-none font-sans">
        {/* LAVA LAMP (Glows and pulses) */}
        {equippedItems.includes('lava-lamp') && renderItemContainer('lava-lamp', 'Retro Lava Lamp', (
          <div className="flex flex-col items-center animate-pulse">
            <div className="text-xl filter drop-shadow-[0_0_8px_rgba(236,72,153,0.85)]">🔮</div>
            <div className="w-3.5 h-1 bg-amber-900 rounded-full border border-black/20" style={{ marginTop: '-2px' }}></div>
          </div>
        ))}

        {/* GOLD TROPHY (Bounces gold sparkles) */}
        {equippedItems.includes('gold-trophy') && renderItemContainer('gold-trophy', 'Gold Focus Trophy', (
          <div className="text-xl filter drop-shadow-[0_4px_6px_rgba(251,191,36,0.6)] animate-bounce">🏆</div>
        ))}

        {/* SOCCER BALL (Bounces playfully) */}
        {equippedItems.includes('soccer-ball') && renderItemContainer('soccer-ball', 'Classic Soccer Ball', (
          <div className="text-xl filter drop-shadow-[0_4px_4px_rgba(0,0,0,0.3)] hover:animate-bounce">⚽</div>
        ))}

        {/* BASKETBALL (Spins smoothly) */}
        {equippedItems.includes('basketball') && renderItemContainer('basketball', 'Championship Basketball', (
          <div className="text-xl filter drop-shadow-[0_4px_4px_rgba(234,88,12,0.4)] hover:animate-spin">🏀</div>
        ))}

        {/* BOTANICAL BONSAI TREE */}
        {equippedItems.includes('bonsai-tree') && renderItemContainer('bonsai-tree', 'Botanical Bonsai Tree', (
          <div className="text-lg">🪴</div>
        ))}
      </div>
    );
  };

  return (
    <div ref={containerRef} className={`relative w-full h-64 bg-[#f5f5f5] border-2 rounded-lg overflow-hidden ${activeGlowClass}`}>
      {renderRoom()}
      {renderItemDecorations()}
    </div>
  );
};

export default OfficeRoom;
