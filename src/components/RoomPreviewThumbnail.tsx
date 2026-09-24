import React from 'react';

interface RoomPreviewThumbnailProps {
  roomId: string;
  isOwned?: boolean;
  className?: string;
}

export const RoomPreviewThumbnail: React.FC<RoomPreviewThumbnailProps> = ({
  roomId,
  isOwned = false,
  className = '',
}) => {
  const renderPreviewContent = () => {
    switch (roomId) {
      case 'rooftop':
        return (
          <div className="absolute inset-0 bg-gradient-to-b from-[#38bdf8] via-[#a5f3fc] to-[#fef08a] overflow-hidden flex flex-col justify-between">
            {/* Stars & Sun Flare */}
            <div className="absolute top-2 right-8 w-6 h-6 bg-yellow-300/80 rounded-full blur-[2px] animate-pulse" />
            <div className="absolute top-2 left-6 w-1.5 h-1.5 bg-white rounded-full animate-ping" />

            {/* Floating Clouds */}
            <div className="absolute top-2 left-4 w-14 h-5 bg-white rounded-full border border-stone-800/40 shadow-xs flex items-center justify-center">
              <div className="w-6 h-6 bg-white rounded-full -mt-2 -ml-2 border-t border-stone-800/40" />
            </div>
            <div className="absolute top-5 right-10 w-16 h-6 bg-white rounded-full border border-stone-800/40 shadow-xs">
              <div className="w-8 h-8 bg-white rounded-full -mt-3 ml-3 border-t border-stone-800/40" />
            </div>

            {/* City Skyline */}
            <div className="absolute bottom-6 inset-x-0 h-10 flex items-end justify-between px-3 pointer-events-none opacity-90">
              <div className="w-6 h-9 bg-amber-100 border border-stone-800 rounded-t-sm relative">
                <div className="w-1 h-1 bg-yellow-400 rounded-xs mt-1 mx-auto" />
              </div>
              <div className="w-8 h-10 bg-sky-200 border border-stone-800 rounded-t-md relative flex flex-col justify-around p-0.5">
                <div className="w-1.5 h-1 bg-yellow-300 rounded-xs" />
                <div className="w-1.5 h-1 bg-yellow-300 rounded-xs self-end" />
              </div>
              <div className="w-6 h-7 bg-rose-200 border border-stone-800 rounded-t-xs" />
              <div className="w-7 h-11 bg-yellow-100 border border-stone-800 rounded-t-lg relative">
                <div className="w-2 h-2 bg-orange-400 rounded-full mx-auto mt-1" />
              </div>
              <div className="w-8 h-8 bg-emerald-100 border border-stone-800 rounded-t-md" />
            </div>

            {/* Parapet & Planters */}
            <div className="absolute bottom-0 inset-x-0 h-6 bg-stone-100 border-t-2 border-stone-850 flex items-center justify-between px-3">
              <div className="flex items-end space-x-1 -mt-3">
                <div className="w-2.5 h-4 bg-emerald-600 rounded-t-full border border-stone-800 relative">
                  <span className="text-[6px] absolute -top-1.5 left-0">🌸</span>
                </div>
                <div className="w-3 h-5 bg-lime-600 rounded-t-full border border-stone-800" />
              </div>
              <div className="text-[8px] font-mono font-bold text-stone-500 uppercase tracking-tighter">ROOFTOP</div>
              <div className="flex items-center space-x-1 -mt-2">
                <div className="w-3.5 h-4 bg-slate-700 border border-stone-800 rounded-xs flex flex-col justify-around p-0.5">
                  <div className="h-0.5 bg-yellow-400 rounded-xs" />
                </div>
              </div>
            </div>
          </div>
        );

      case 'latenight':
        return (
          <div className="absolute inset-0 bg-gradient-to-b from-[#090a16] via-[#12142e] to-[#251e3e] overflow-hidden flex flex-col justify-between">
            {/* Stars & Neon Crescent Moon */}
            <div className="absolute top-2 left-6 w-1 h-1 bg-white rounded-full animate-ping" />
            <div className="absolute top-4 left-1/3 w-1.5 h-1.5 bg-cyan-200 rounded-full" />
            <div className="absolute top-3 right-8 w-5 h-5 rounded-full border-t-2 border-r-2 border-yellow-200 shadow-[0_0_8px_rgba(254,240,138,0.7)]" />

            {/* Lit Skyscrapers */}
            <div className="absolute bottom-6 inset-x-0 h-14 flex items-end justify-between px-2.5 pointer-events-none">
              <div className="w-8 h-12 bg-indigo-950 border border-purple-500/50 rounded-t-sm p-1 grid grid-cols-2 gap-0.5">
                <div className="w-1.5 h-1.5 bg-yellow-300 rounded-xs animate-pulse" />
                <div className="w-1.5 h-1.5 bg-yellow-200/50 rounded-xs" />
                <div className="w-1.5 h-1.5 bg-cyan-300 rounded-xs" />
              </div>
              <div className="w-10 h-14 bg-slate-950 border border-cyan-500/50 rounded-t-md p-1 flex flex-col justify-between">
                <div className="w-full h-0.5 bg-cyan-400 shadow-[0_0_4px_cyan]" />
                <div className="grid grid-cols-3 gap-0.5">
                  <div className="w-1 h-1.5 bg-yellow-300 rounded-2xs" />
                  <div className="w-1 h-1.5 bg-yellow-300 rounded-2xs" />
                  <div className="w-1 h-1.5 bg-yellow-100 rounded-2xs" />
                </div>
                <div className="w-full h-1 bg-purple-500/40 rounded-xs" />
              </div>
              <div className="w-7 h-10 bg-indigo-900/90 border border-purple-400/40 rounded-t-xs p-1">
                <div className="w-1 h-1 bg-rose-400 rounded-full animate-ping" />
              </div>
              <div className="w-9 h-13 bg-slate-900 border border-purple-500/60 rounded-t-sm p-1">
                <div className="grid grid-cols-2 gap-1">
                  <div className="w-1.5 h-1.5 bg-amber-300 rounded-2xs" />
                  <div className="w-1.5 h-1.5 bg-amber-200/30 rounded-2xs" />
                </div>
              </div>
            </div>

            {/* Cyber Desk Floor Strip */}
            <div className="absolute bottom-0 inset-x-0 h-6 bg-gradient-to-r from-purple-950 via-indigo-950 to-purple-950 border-t-2 border-purple-500/60 flex items-center justify-between px-3">
              <span className="text-[7px] font-mono text-purple-300 font-bold uppercase tracking-widest">MIDNIGHT SKYLINE</span>
              <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_cyan] animate-pulse" />
            </div>
          </div>
        );

      case 'cabin':
        return (
          <div className="absolute inset-0 bg-gradient-to-b from-[#451a03] via-[#78350f] to-[#92400e] overflow-hidden flex flex-col justify-between">
            {/* Log Planks Pattern */}
            <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_10px,rgba(0,0,0,0.15)_10px,rgba(0,0,0,0.15)_12px)] pointer-events-none" />

            {/* Cozy Forest Rain Window */}
            <div className="absolute top-2 left-4 w-28 h-14 bg-gradient-to-b from-slate-700 to-emerald-950 rounded-lg border-2 border-amber-950 shadow-inner overflow-hidden p-1 flex items-end justify-around">
              {/* Rain Streaks */}
              <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_45%,rgba(255,255,255,0.25)_46%,transparent_50%)] bg-[length:10px_10px]" />
              {/* Evergreen Pines */}
              <div className="w-4 h-9 bg-emerald-900 rounded-t-full border border-black/40" />
              <div className="w-5 h-11 bg-emerald-800 rounded-t-full border border-black/40" />
              <div className="w-4 h-8 bg-emerald-900 rounded-t-full border border-black/40" />
            </div>

            {/* Fireplace Hearth on Right */}
            <div className="absolute top-2 right-4 w-14 h-15 bg-stone-900 border-2 border-amber-950 rounded-t-lg p-1 flex flex-col justify-between items-center shadow-lg">
              <div className="w-full h-1 bg-amber-700 rounded-xs" />
              <div className="w-8 h-8 bg-black rounded-t-full flex items-center justify-center relative overflow-hidden">
                <div className="w-4 h-6 bg-gradient-to-t from-red-600 via-orange-500 to-yellow-300 rounded-full animate-bounce shadow-[0_0_12px_orange]" />
              </div>
            </div>

            {/* Hearth Floor & Rug */}
            <div className="absolute bottom-0 inset-x-0 h-6 bg-[#381602] border-t-2 border-amber-950 flex items-center justify-center">
              <div className="w-32 h-3.5 bg-amber-700/80 rounded-full border border-amber-900 flex items-center justify-center">
                <span className="text-[7px] font-bold text-amber-200 tracking-wider">HYGGE SANCTUARY</span>
              </div>
            </div>
          </div>
        );

      case 'library':
        return (
          <div className="absolute inset-0 bg-gradient-to-b from-[#1c1917] via-[#292524] to-[#44403c] overflow-hidden flex flex-col justify-between">
            {/* Bookshelves rows */}
            <div className="absolute top-1 inset-x-2 h-16 flex justify-between gap-1.5">
              {/* Shelf 1 */}
              <div className="flex-1 bg-[#29170e] border-2 border-[#150a05] rounded-t-sm p-1 flex flex-col justify-between">
                <div className="flex items-end justify-around h-6 border-b border-amber-900/60 pb-0.5">
                  <div className="w-2 h-5 bg-rose-700 rounded-2xs" />
                  <div className="w-1.5 h-6 bg-amber-500 rounded-2xs" />
                  <div className="w-2.5 h-4.5 bg-emerald-700 rounded-2xs" />
                  <div className="w-2 h-5 bg-blue-700 rounded-2xs" />
                  <div className="w-1.5 h-5.5 bg-yellow-600 rounded-2xs" />
                </div>
                <div className="flex items-end justify-around h-6">
                  <div className="w-2 h-5 bg-purple-700 rounded-2xs" />
                  <div className="w-2 h-5.5 bg-emerald-800 rounded-2xs" />
                  <div className="w-1.5 h-4.5 bg-rose-800 rounded-2xs" />
                  <div className="w-2.5 h-5 bg-amber-600 rounded-2xs" />
                </div>
              </div>

              {/* Arch Stained Glass Window in Center */}
              <div className="w-14 h-16 bg-gradient-to-b from-sky-950 to-indigo-900 border-2 border-amber-950 rounded-t-full flex items-center justify-center relative overflow-hidden">
                <div className="w-5 h-5 rounded-full border-t border-r border-yellow-200" />
                <div className="absolute bottom-1 w-6 h-3 bg-emerald-600/90 rounded-t-lg border border-black shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              </div>

              {/* Shelf 2 */}
              <div className="flex-1 bg-[#29170e] border-2 border-[#150a05] rounded-t-sm p-1 flex flex-col justify-between">
                <div className="flex items-end justify-around h-6 border-b border-amber-900/60 pb-0.5">
                  <div className="w-2 h-5.5 bg-blue-800 rounded-2xs" />
                  <div className="w-2 h-4.5 bg-yellow-500 rounded-2xs" />
                  <div className="w-1.5 h-6 bg-rose-700 rounded-2xs" />
                </div>
                <div className="flex items-end justify-around h-6">
                  <div className="w-2 h-5 bg-amber-700 rounded-2xs" />
                  <div className="w-2.5 h-4.5 bg-emerald-700 rounded-2xs" />
                  <div className="w-1.5 h-5.5 bg-sky-700 rounded-2xs" />
                </div>
              </div>
            </div>

            {/* Parquet Floor */}
            <div className="absolute bottom-0 inset-x-0 h-6 bg-[#3a1d0f] border-t-2 border-amber-950 flex items-center justify-between px-3">
              <span className="text-[7px] font-serif font-black text-amber-200/90 tracking-widest">ARCHIVAL VAULT</span>
              <span className="text-[10px]">📖</span>
            </div>
          </div>
        );

      case 'deepspace':
        return (
          <div className="absolute inset-0 bg-gradient-to-b from-[#030712] via-[#0f172a] to-[#1e1b4b] overflow-hidden flex flex-col justify-between">
            {/* Starfield & Galaxy Swirl */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-fuchsia-900/30 via-transparent to-transparent" />
            <div className="absolute top-2 left-6 w-1.5 h-1.5 bg-cyan-200 rounded-full animate-ping" />
            <div className="absolute top-3 left-1/2 w-1 h-1 bg-white rounded-full animate-pulse" />
            <div className="absolute top-4 right-10 w-2 h-2 bg-yellow-100 rounded-full animate-pulse" />

            {/* Earth Orb through Geodesic Glass */}
            <div className="absolute top-2 right-8 w-12 h-12 rounded-full bg-gradient-to-tr from-blue-700 via-teal-400 to-sky-200 border-2 border-cyan-400/50 shadow-[0_0_15px_rgba(56,189,248,0.7)] flex items-center justify-center overflow-hidden">
              <div className="w-8 h-4 bg-emerald-500/70 rounded-full blur-[1px] transform -rotate-12" />
            </div>

            {/* Orbital Station Dome Frames */}
            <div className="absolute inset-x-0 top-0 h-16 pointer-events-none">
              <div className="w-full h-full border-b-2 border-cyan-500/30 [clip-path:polygon(0_0,50%_40%,100%_0)]" />
            </div>

            {/* Holographic Floor Grid */}
            <div className="absolute bottom-0 inset-x-0 h-6 bg-slate-950 border-t-2 border-cyan-500/80 flex items-center justify-between px-3 shadow-[0_-4px_10px_rgba(6,182,212,0.3)]">
              <span className="text-[7px] font-mono text-cyan-300 font-extrabold tracking-widest">ORBITAL OBSERVATORY</span>
              <span className="text-[9px] text-cyan-400 animate-pulse">🛰️</span>
            </div>
          </div>
        );

      case 'dojo':
        return (
          <div className="absolute inset-0 bg-gradient-to-b from-[#fef3c7] via-[#fde68a] to-[#fef08a] overflow-hidden flex flex-col justify-between">
            {/* Bamboo Garden View in Center */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-14 bg-gradient-to-b from-sky-200 to-emerald-100 border-2 border-amber-900 rounded-md p-1 flex justify-around items-end overflow-hidden shadow-inner">
              <div className="w-2 h-12 bg-emerald-700 rounded-t-sm" />
              <div className="w-2.5 h-14 bg-emerald-600 rounded-t-sm" />
              <div className="w-2 h-11 bg-emerald-800 rounded-t-sm" />
              <div className="w-2 h-13 bg-emerald-700 rounded-t-sm" />
            </div>

            {/* Shoji Paper Screens (Left & Right) */}
            <div className="absolute top-1 left-2 w-14 h-16 bg-white/95 border-2 border-amber-950 rounded-sm p-1 grid grid-cols-2 grid-rows-3 gap-0.5 shadow-sm">
              <div className="border border-amber-900/40 rounded-2xs" />
              <div className="border border-amber-900/40 rounded-2xs" />
              <div className="border border-amber-900/40 rounded-2xs" />
              <div className="border border-amber-900/40 rounded-2xs" />
              <div className="border border-amber-900/40 rounded-2xs" />
              <div className="border border-amber-900/40 rounded-2xs" />
            </div>

            <div className="absolute top-1 right-2 w-14 h-16 bg-white/95 border-2 border-amber-950 rounded-sm p-1 grid grid-cols-2 grid-rows-3 gap-0.5 shadow-sm">
              <div className="border border-amber-900/40 rounded-2xs" />
              <div className="border border-amber-900/40 rounded-2xs" />
              <div className="border border-amber-900/40 rounded-2xs" />
              <div className="border border-amber-900/40 rounded-2xs" />
              <div className="border border-amber-900/40 rounded-2xs" />
              <div className="border border-amber-900/40 rounded-2xs" />
            </div>

            {/* Tatami Mats Floor */}
            <div className="absolute bottom-0 inset-x-0 h-6 bg-[#d97706]/30 border-t-2 border-amber-950 flex items-center justify-between px-3">
              <span className="text-[7px] font-mono font-bold text-amber-950 tracking-wider">ZEN TATAMI DOJO</span>
              <span className="text-[10px]">🎋</span>
            </div>
          </div>
        );

      case 'diner':
        return (
          <div className="absolute inset-0 bg-gradient-to-b from-[#7f1d1d] via-[#991b1b] to-[#18181b] overflow-hidden flex flex-col justify-between">
            {/* Retro Diner Walls */}
            <div className="absolute top-2 left-4 w-28 h-13 bg-slate-900 border-2 border-stone-850 rounded-lg overflow-hidden flex items-center justify-center p-1 shadow-inner">
              <span className="text-[9px] font-black tracking-widest text-cyan-300 drop-shadow-[0_0_6px_cyan] animate-pulse">
                ★ 24/7 OPEN ★
              </span>
            </div>

            {/* Red Vinyl Booth Tufting on Right */}
            <div className="absolute top-2 right-4 w-16 h-14 bg-red-700 border-2 border-stone-900 rounded-t-xl p-1 flex flex-col justify-around">
              <div className="w-full h-1 bg-red-900 rounded-full" />
              <div className="w-full h-1 bg-red-900 rounded-full" />
              <div className="w-full h-1 bg-red-900 rounded-full" />
            </div>

            {/* Checkerboard Tile Floor */}
            <div className="absolute bottom-0 inset-x-0 h-6 bg-stone-900 border-t-2 border-stone-900 flex items-center justify-between px-3 bg-[repeating-conic-gradient(#18181b_0%_25%,#f4f4f5_0%_50%)] bg-[length:12px_12px]">
              <span className="bg-black/90 text-white text-[7px] font-black uppercase px-2 py-0.5 rounded border border-white/20">
                CLASSIC DINER
              </span>
              <span className="text-[10px]">☕</span>
            </div>
          </div>
        );

      case 'penthouse':
        return (
          <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a] via-[#1e293b] to-[#334155] overflow-hidden flex flex-col justify-between">
            {/* Golden City Skyline */}
            <div className="absolute inset-x-0 top-0 h-16 flex items-end justify-between px-2 pointer-events-none opacity-95">
              <div className="w-9 h-14 bg-slate-950 border border-amber-400/40 rounded-t-sm p-1">
                <div className="grid grid-cols-2 gap-0.5">
                  <div className="w-1.5 h-1.5 bg-amber-300 shadow-[0_0_4px_gold]" />
                  <div className="w-1.5 h-1.5 bg-yellow-200" />
                </div>
              </div>
              <div className="w-12 h-16 bg-slate-900 border border-amber-300/50 rounded-t-md p-1 flex flex-col justify-between">
                <div className="w-full h-0.5 bg-amber-400 shadow-[0_0_6px_gold]" />
                <div className="grid grid-cols-3 gap-0.5">
                  <div className="w-1 h-1 bg-yellow-300 shadow-[0_0_3px_gold]" />
                  <div className="w-1 h-1 bg-yellow-200" />
                  <div className="w-1 h-1 bg-amber-300 shadow-[0_0_3px_gold]" />
                </div>
              </div>
              <div className="w-8 h-12 bg-slate-950 border border-amber-400/40 rounded-t-xs" />
              <div className="w-10 h-15 bg-slate-900 border border-amber-300/40 rounded-t-sm" />
            </div>

            {/* Chandelier Glow & Panoramic Glass Pillars */}
            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-yellow-300/40 blur-[4px] animate-pulse" />
            <div className="absolute inset-x-0 top-0 h-16 pointer-events-none border-b border-amber-300/30 flex justify-around">
              <div className="w-0.5 h-full bg-amber-300/30" />
              <div className="w-0.5 h-full bg-amber-300/30" />
            </div>

            {/* Marble Floor & Designer Banner */}
            <div className="absolute bottom-0 inset-x-0 h-6 bg-slate-100 border-t-2 border-stone-850 flex items-center justify-between px-3">
              <span className="text-[7px] font-mono font-black text-stone-900 uppercase tracking-widest">PENTHOUSE SUITE</span>
              <span className="text-[9px] text-amber-600 font-bold">✨ LUXURY</span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={`w-full h-24 sm:h-28 rounded-xl relative overflow-hidden border-2 border-[#2a2a2a] shadow-xs select-none ${className}`}
    >
      {renderPreviewContent()}

      {/* Floating Status Badge */}
      <div className="absolute top-1.5 right-1.5 z-10">
        {isOwned ? (
          <span className="bg-[#22c55e] text-black text-[8px] font-black uppercase px-2 py-0.5 rounded-full border border-black shadow-xs flex items-center gap-1">
            <span>✓</span>
            <span>Unlocked</span>
          </span>
        ) : (
          <span className="bg-black/80 backdrop-blur-xs text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full border border-white/20 shadow-xs flex items-center gap-1">
            <span>👁️</span>
            <span>Preview</span>
          </span>
        )}
      </div>
    </div>
  );
};

export default RoomPreviewThumbnail;
