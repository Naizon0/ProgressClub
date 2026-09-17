import React, { useState } from 'react';
import { AppState, CharacterInfo } from '../types';
import { CHARACTERS, ROOMS, ROOM_ITEMS } from '../data';
import CrewCharacter from './CrewCharacter';
import {
  Sparkles,
  Star,
  Gamepad,
  ArrowLeft,
  Check,
  Compass,
  Info,
  Sprout,
  Crown,
} from 'lucide-react';

interface ShopViewProps {
  state: AppState;
  onPurchaseCharacterBix: (id: string, costBix: number) => void;
  onPurchaseRoomBix: (id: string, costBix: number) => void;
  onBuyBundleCharacters: () => void;
  onBuyBundleRooms: () => void;
  onPurchaseRoomItemBix: (id: string, costBix: number) => void;
  onToggleRoomItem: (id: string) => void;
  onOpenMembershipModal?: () => void;
}

// Extra designer features to make items highly enticing
const CHARACTER_EXTRAS: Record<string, {
  rarity: string;
  perk: string;
  badge: string;
  focusType: string;
  stats: { focus: number; calm: number; grit: number };
  glowColor: string;
}> = {
  cipher: {
    rarity: 'ORIGINAL MYSTERY',
    perk: 'Ghost Protocol: Cloaks user output. Keeps social status focused on pure silent work.',
    badge: 'Base Recon',
    focusType: 'Aesthetic Chill',
    stats: { focus: 85, calm: 90, grit: 75 },
    glowColor: 'group-hover:shadow-[0_0_20px_rgba(24,24,27,0.4)] border-neutral-800',
  },
  blaze: {
    rarity: 'COSMIC SUNSPOT',
    perk: 'Incinerate Friction: Provides a psychological high-energy sprint boost for fast deadlines.',
    badge: 'Inferno Core',
    focusType: 'Maximum Sprint',
    stats: { focus: 98, calm: 50, grit: 95 },
    glowColor: 'group-hover:shadow-[0_0_20px_rgba(194,65,12,0.4)] border-orange-500',
  },
  frost: {
    rarity: 'CRYO-CORE SPHERE',
    perk: 'Absolute Zero Noise: Reduces alarm anxiety in high-pressure study bursts. Soft cold serenity.',
    badge: 'Glacier Shield',
    focusType: 'Vibrationless State',
    stats: { focus: 88, calm: 99, grit: 82 },
    glowColor: 'group-hover:shadow-[0_0_20px_rgba(56,189,248,0.4)] border-sky-400',
  },
  dusk: {
    rarity: 'NEON LUNAR ARC',
    perk: 'Nocturnal Accord: Synergizes with dark workspaces. Amplifies relaxation during late hours.',
    badge: 'Twilight Guild',
    focusType: 'Midnight Drifting',
    stats: { focus: 94, calm: 92, grit: 90 },
    glowColor: 'group-hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] border-purple-500',
  },
  ember: {
    rarity: 'MICRO-BURNER',
    perk: 'Stardust Catalyst: Ignites micro-milestones. Prompts acceleration on ticking rapid checklists.',
    badge: 'Spark Class',
    focusType: 'Milestone Burst',
    stats: { focus: 95, calm: 70, grit: 88 },
    glowColor: 'group-hover:shadow-[0_0_20px_rgba(220,38,38,0.4)] border-red-600',
  },
  mantis: {
    rarity: 'EMERALD SHAMAN',
    perk: 'Rhythmic Pacing: Helps stabilize respiration patterns during deep tactical study grids.',
    badge: 'Great Monk',
    focusType: 'Fluid Pacing',
    stats: { focus: 90, calm: 98, grit: 85 },
    glowColor: 'group-hover:shadow-[0_0_20px_rgba(72,187,120,0.4)] border-emerald-500',
  },
  volt: {
    rarity: 'KINETIC STORMCALL',
    perk: 'Hyper-Charged Current: Energizes mind during fatigue. Great for breaking blank-page mental blocks.',
    badge: 'Tesla Core',
    focusType: 'Voltage Surge',
    stats: { focus: 99, calm: 45, grit: 98 },
    glowColor: 'group-hover:shadow-[0_0_20px_rgba(234,179,8,0.4)] border-yellow-400',
  },
  monument: {
    rarity: 'IMMORTAL TITAN',
    perk: 'Stark Inertia Force: Statically immovable resolve. Projects an unbendable gravity aura of absolute focus.',
    badge: 'Prestige Legend',
    focusType: 'Null distraction',
    stats: { focus: 100, calm: 100, grit: 100 },
    glowColor: 'group-hover:shadow-[0_0_25px_rgba(245,245,245,0.7)] border-stone-200',
  },
};

const ROOM_EXTRAS: Record<string, {
  perk: string;
  theme: string;
  meters: { ambience: number; productivity: number; comfort: number };
  colorBadge: string;
  bgGradient: string;
}> = {
  rooftop: {
    perk: 'Oxygen-Rich Flora: Fresh garden air and gentle leaf whispers. Drops respiratory stress.',
    theme: 'Lush Sunlit Greenhouse',
    meters: { ambience: 98, productivity: 82, comfort: 78 },
    colorBadge: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    bgGradient: 'from-emerald-50 to-teal-50/20',
  },
  latenight: {
    perk: 'Midnight Skyline: Endless twinkling neon highway stars. Ultimate quiet space for deep work.',
    theme: 'Futuristic Cyber Loft',
    meters: { ambience: 99, productivity: 90, comfort: 82 },
    colorBadge: 'bg-purple-50 border-purple-200 text-purple-700',
    bgGradient: 'from-purple-50 to-indigo-50/20',
  },
  cabin: {
    perk: 'Pine Needle Cozy: Sound of soft heavy rain beating on raw log glass. Immense physical comfort.',
    theme: 'Rainy Hygge Sanctuary',
    meters: { ambience: 94, productivity: 75, comfort: 99 },
    colorBadge: 'bg-amber-50 border-amber-200 text-amber-700',
    bgGradient: 'from-amber-50 to-yellow-50/20',
  },
  library: {
    perk: 'Polished Oak Silence: Thousands of leather-bound concentration relics. Standard scholar bonus.',
    theme: 'Archival Concentration Vault',
    meters: { ambience: 92, productivity: 98, comfort: 76 },
    colorBadge: 'bg-blue-50 border-blue-200 text-blue-700',
    bgGradient: 'from-blue-50 to-cyan-50/20',
  },
  deepspace: {
    perk: 'Cosmological Void: Total weightless zero-vibration sensory capsule. Absolutely zero sound travel.',
    theme: 'Gravityless Isolation Pod',
    meters: { ambience: 100, productivity: 99, comfort: 70 },
    colorBadge: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    bgGradient: 'from-indigo-50 to-violet-50/20',
  },
  dojo: {
    perk: 'Sand-Raked Bamboo: Perfect tatami mat scent. Clear thoughts lead to precise execution flow.',
    theme: 'Ancient Mindfulness Field',
    meters: { ambience: 91, productivity: 91, comfort: 88 },
    colorBadge: 'bg-rose-50 border-rose-200 text-rose-700',
    bgGradient: 'from-rose-50 to-pink-50/20',
  },
  diner: {
    perk: 'Classic Jazz Corner: Muffled coffee brewing sounds & soft vinyl booth. Retro social warmth.',
    theme: '24/7 Nostalgic Griddle',
    meters: { ambience: 89, productivity: 85, comfort: 94 },
    colorBadge: 'bg-orange-50 border-orange-200 text-orange-750',
    bgGradient: 'from-orange-50 to-red-50/20',
  },
  penthouse: {
    perk: 'Vanguard Skyline: Glazed master peak look over the business district. Ambition-fueling scale.',
    theme: 'Summit Prestige Suite',
    meters: { ambience: 99, productivity: 96, comfort: 96 },
    colorBadge: 'bg-yellow-50 border-yellow-300 text-yellow-750',
    bgGradient: 'from-yellow-50 to-amber-50/20',
  },
};

const ITEM_EXTRAS: Record<string, {
  effect: string;
  rarity: string;
  rarityBadgeClass: string;
}> = {
  'lava-lamp': {
    effect: 'Slow-drift rhythmic thermal glow that synchronizes heart rate and relaxes optic tension.',
    rarity: 'VINTAGE KINETIC ★★★',
    rarityBadgeClass: 'bg-gradient-to-r from-fuchsia-100 to-pink-100 text-pink-700 border-pink-300 font-bold',
  },
  'soccer-ball': {
    effect: 'Increases foot coordination and physical stamina while seated, helping release fidget energy.',
    rarity: 'STREET ATHLETE ★★',
    rarityBadgeClass: 'bg-gradient-to-r from-blue-100 to-sky-100 text-blue-700 border-blue-300 font-semibold',
  },
  'basketball': {
    effect: 'Channels MVP game-winning mindset. Highly dynamic spin physics for relentless focus blocks.',
    rarity: 'CHAMPIONSHIP HARDCOURT ★★★',
    rarityBadgeClass: 'bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 border-orange-300 font-semibold',
  },
  'gold-trophy': {
    effect: 'Triple-gilded 24-karat high-shine monument reflecting supreme success and dedication.',
    rarity: 'SUPREME TYCOON ★★★**',
    rarityBadgeClass: 'bg-gradient-to-r from-amber-100 via-yellow-100 to-amber-200 text-amber-800 border-yellow-400 font-extrabold animate-pulse',
  },
  'bonsai-tree': {
    effect: 'A 400-year-old miniature pine symbolizing meticulous botanical discipline and clean thoughts.',
    rarity: 'LEGENDARY CLASSIC ★★★★',
    rarityBadgeClass: 'bg-gradient-to-r from-teal-100 to-emerald-100 text-teal-800 border-teal-300 font-bold',
  },
};

export const ShopView: React.FC<ShopViewProps> = ({
  state,
  onPurchaseCharacterBix,
  onPurchaseRoomBix,
  onBuyBundleCharacters,
  onBuyBundleRooms,
  onPurchaseRoomItemBix,
  onToggleRoomItem,
  onOpenMembershipModal,
}) => {
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterInfo | null>(null);
  const [detailPoseIndex, setDetailPoseIndex] = useState(0); // 0 = idle, 1 = typing, 2 = celebrating

  // Automatically cycle poses in the detail view
  React.useEffect(() => {
    if (!selectedCharacter) return;
    const timer = setInterval(() => {
      setDetailPoseIndex((prev) => (prev + 1) % 3);
    }, 2500);
    return () => clearInterval(timer);
  }, [selectedCharacter]);

  const detailPoses: Array<'idle' | 'typing' | 'celebrating'> = ['idle', 'typing', 'celebrating'];

  const isCharacterOwned = (id: string) => state.ownedCharacters.includes(id);
  const isRoomOwned = (id: string) => state.ownedRooms.includes(id);
  const isItemOwned = (id: string) => (state.ownedItems || []).includes(id);
  const isItemEquipped = (id: string) => (state.equippedItems || []).includes(id);

  const unownedRooms = ROOMS.filter(r => !isRoomOwned(r.id));
  const unownedCharacters = CHARACTERS.filter(c => !isCharacterOwned(c.id));

  return (
    <div className="space-y-10 w-full max-w-md mx-auto relative pb-24">
      {/* Dynamic Header & Balance block */}
      <div className="bg-[#22c55e]/10 border-2 border-[#22c55e] p-4 rounded-xl flex justify-between items-center text-sm font-extrabold text-[#0a0a0a] shadow-[3px_3px_0px_0px_rgba(34,197,94,1)]">
        <div className="flex items-center space-x-2">
          <span className="inline-flex h-3 w-3 rounded-full bg-[#22c55e] animate-ping" />
          <span className="tracking-wider uppercase text-xs">YOUR EARNED BALANCE:</span>
        </div>
        <div className="flex items-center space-x-1.5 bg-white border border-[#22c55e] px-3 py-1 rounded-lg">
          <span className="text-base text-[#22c55e] font-black">🪙 {state.bixBalance}</span>
          <span className="text-[10px] font-black text-emerald-500 tracking-wider">BIX</span>
        </div>
      </div>

      {/* Executive Club Membership Card */}
      {state.isExecutive ? (
        <div className="bg-gradient-to-r from-amber-500/15 via-yellow-400/10 to-emerald-500/15 border-2 border-amber-400 dark:border-amber-500/60 rounded-2xl p-4.5 space-y-2.5 shadow-[4px_4px_0px_0px_rgba(245,158,11,1)] relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Crown className="h-4 w-4 text-amber-500 fill-amber-400" />
              <h2 className="text-xs font-black tracking-widest text-[#0a0a0a] dark:text-zinc-100 uppercase">
                EXECUTIVE MEMBERSHIP ACTIVE
              </h2>
            </div>
            <span className="text-[9px] font-black uppercase bg-[#22c55e] text-black px-2 py-0.5 rounded-full border border-black shadow-xs">
              {state.subscriptionPlan.toUpperCase()} PASS
            </span>
          </div>
          <p className="text-xs text-[#1a1a1a]/80 dark:text-zinc-300 font-medium">
            ⚡ <strong>2x Bix Multiplier</strong> active on all sessions • VIP Deep Space Workspace unlocked • Executive Analytics enabled.
          </p>
          <div className="pt-1">
            <button
              type="button"
              id="manage-executive-shop-btn"
              onClick={onOpenMembershipModal}
              className="text-[11px] font-black uppercase text-amber-700 dark:text-amber-300 hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>Manage Executive Pass</span>
              <span>&rarr;</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border-2 border-[#2a2a2a] dark:border-zinc-700 rounded-2xl p-4.5 space-y-3 shadow-[4px_4px_0px_0px_rgba(10,10,10,1)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Crown className="h-4 w-4 text-amber-500 fill-amber-400" />
              <h2 className="text-xs font-black tracking-widest text-[#0a0a0a] dark:text-zinc-100 uppercase">
                EXECUTIVE PASS MEMBERSHIP
              </h2>
            </div>
            <span className="text-[9px] font-black uppercase bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 px-2 py-0.5 rounded border border-amber-300">
              VIP PASS
            </span>
          </div>
          <p className="text-xs text-[#1a1a1a]/80 dark:text-zinc-300 font-medium leading-relaxed">
            Double your focus earnings, unlock the VIP Deep Space cabin, and access multi-month habit forecasting.
          </p>
          <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-stone-600 dark:text-zinc-400">
            <div className="flex items-center gap-1.5">
              <span className="text-emerald-500">⚡</span> 2x Focus Bix Rate
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-indigo-500">🌌</span> VIP Deep Space Room
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-amber-500">📈</span> Executive Analytics
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-emerald-600">🛡️</span> Streak Protection
            </div>
          </div>
          <button
            type="button"
            id="unlock-executive-shop-btn"
            onClick={onOpenMembershipModal}
            className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-black text-xs font-black uppercase rounded-xl border-2 border-stone-900 shadow-xs active:translate-y-px transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Crown className="w-3.5 h-3.5 fill-black" />
            <span>Join Executive Club ($12/yr, $5.50/mo, or $1.50/wk)</span>
          </button>
        </div>
      )}

      {/* Rewards info banner */}
      <div className="bg-white border-2 border-[#2a2a2a] rounded-2xl p-4.5 space-y-2 shadow-[4px_4px_0px_0px_rgba(10,10,10,1)]">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-4 w-4 text-[#22c55e]" />
          <h2 className="text-xs font-black tracking-widest text-[#0a0a0a] uppercase">100% EARNED REWARDS</h2>
        </div>
        <p className="text-xs text-[#1a1a1a]/80 leading-relaxed font-medium">
          Every workspace, desk toy companion, and cozy room decor in Progress Club is <strong>100% free</strong> and unlocked exclusively with <strong>Bix earned from your focus sessions</strong>.
        </p>
      </div>

      {/* SECTION 1: WORKSPACE ROOMS */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 border-b-2 border-stone-200 pb-2">
          <Compass className="h-5 w-5 text-stone-800 text-left shrink-0" />
          <h2 className="text-xs font-black tracking-widest text-[#0a0a0a] uppercase">UPGRADE YOUR WORKSPACE SPHERE</h2>
        </div>

        {/* Room Bundle Banner */}
        {unownedRooms.length > 0 && (
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 border-2 border-[#2a2a2a] rounded-xl overflow-hidden flex flex-col justify-between shadow-[4px_4px_0px_0px_rgba(10,10,10,1)]">
            <div className="bg-[#22c55e] p-3 text-center border-b-2 border-[#2a2a2a] relative">
              <span className="absolute top-1 left-2 bg-black uppercase text-white font-serif italic text-[8px] font-black tracking-widest px-1.5 rounded">BUNDLE SAVINGS</span>
              <h3 className="text-xs font-black text-[#0a0a0a] uppercase tracking-widest">WORLD ATLAS ROOM BUNDLE</h3>
              <p className="text-[10px] font-bold text-[#0a0a0a]/80">Unlocks all 8 dynamic workspace environments at once</p>
            </div>
            <div className="p-3 bg-white flex justify-center">
              <button
                id="room-bundle-bix"
                onClick={onBuyBundleRooms}
                disabled={state.bixBalance < 4800}
                className={`w-full py-2.5 bg-[#22c55e] text-[#0a0a0a] text-xs font-black uppercase rounded-lg border-2 border-stone-900 ${
                  state.bixBalance < 4800
                    ? 'opacity-40 cursor-not-allowed'
                    : 'hover:bg-emerald-400 hover:shadow-[2px_2px_0px_0px_rgba(10,10,10,1)] transition-all cursor-pointer'
                }`}
              >
                Unlock All Workspaces • 4,800 Bix 🪙
              </button>
            </div>
          </div>
        )}

        {/* Room cards list */}
        <div className="space-y-4">
          {ROOMS.map((room) => {
            const owned = isRoomOwned(room.id);
            const extra = ROOM_EXTRAS[room.id] || {
              perk: 'Focus upgrade.',
              theme: 'Custom theme',
              meters: { ambience: 80, productivity: 80, comfort: 80 },
              colorBadge: 'bg-stone-50 border-stone-200 text-stone-600',
              bgGradient: 'from-stone-50 to-stone-100/10',
            };

            return (
              <div
                key={room.id}
                className={`bg-white border-2 border-[#2a2a2a] p-4.5 rounded-2xl flex flex-col space-y-3.5 relative overflow-hidden transition-all hover:translate-x-px hover:translate-y-px hover:shadow-[4px_4px_0px_0px_rgba(10,10,10,1)] shadow-[3px_3px_0px_0px_rgba(10,10,10,1)] bg-gradient-to-br ${extra.bgGradient}`}
              >
                {/* Upper Details */}
                <div className="flex justify-between items-start">
                  <div className="space-y-1 w-3/4">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-black text-[#0a0a0a] uppercase tracking-wide">{room.name}</h4>
                      {owned ? (
                        <span className="text-[8px] font-black text-[#22c55e] bg-[#22c55e]/10 border-2 border-[#22c55e] px-1.5 rounded-md uppercase">Installed</span>
                      ) : (
                        <span className="text-[8px] font-bold text-stone-500 bg-stone-100 border border-stone-250 px-1.5 rounded-md uppercase">Available</span>
                      )}
                    </div>
                    <p className="text-[10px] text-stone-400 font-serif font-black italic tracking-wider">{extra.theme}</p>
                    <p className="text-[11px] text-[#1a1a1a]/85 leading-relaxed font-medium">{room.copy}</p>
                  </div>

                  <div className="text-right">
                    {owned ? (
                      <Check className="h-6 w-6 text-[#22c55e] ml-auto stroke-[3]" />
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-white text-[11px] font-black border-2 border-stone-900 px-2.5 py-0.5 rounded-full select-none">
                        <span>🪙</span>
                        <span>{room.priceBix} Bix</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Specialty perk strip */}
                <div className="bg-white/80 border border-stone-300 rounded-lg p-2 text-[10px] text-stone-700 leading-snug flex items-center space-x-1.5 shadow-sm">
                  <span className="text-emerald-500 font-black shrink-0">✦</span>
                  <span><strong className="text-stone-900 font-bold">Resonance Perk:</strong> {extra.perk}</span>
                </div>

                {/* Aesthetic metrics meters */}
                <div className="grid grid-cols-3 gap-2.5 pt-1 text-[9px] font-black text-stone-500">
                  <div className="space-y-0.5">
                    <div className="flex justify-between">
                      <span>AMBIENCE</span>
                      <span className="text-stone-800">{extra.meters.ambience}/100</span>
                    </div>
                    <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden border border-stone-300">
                      <div className="bg-[#22c55e] h-full rounded-full" style={{ width: `${extra.meters.ambience}%` }} />
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex justify-between">
                      <span>FOCUS AURA</span>
                      <span className="text-stone-800">{extra.meters.productivity}/100</span>
                    </div>
                    <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden border border-stone-300">
                      <div className="bg-amber-400 h-full rounded-full" style={{ width: `${extra.meters.productivity}%` }} />
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex justify-between">
                      <span>COMFORT</span>
                      <span className="text-stone-800">{extra.meters.comfort}/100</span>
                    </div>
                    <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden border border-stone-300">
                      <div className="bg-sky-400 h-full rounded-full" style={{ width: `${extra.meters.comfort}%` }} />
                    </div>
                  </div>
                </div>

                {/* Purchase buttons */}
                {!owned && (
                  <div className="border-t border-stone-200/60 pt-2.5 flex items-center justify-between">
                    <div className="text-[10px] font-black text-[#22c55e] flex items-center space-x-1.5">
                      <span>🪙 Cost:</span>
                      <strong className="bg-[#22c55e]/10 px-1.5 py-0.5 rounded text-xs border border-[#22c55e]/40">{`${room.priceBix} Bix`}</strong>
                    </div>

                    <button
                      id={`rect-buy-bix-${room.id}`}
                      onClick={() => onPurchaseRoomBix(room.id, room.priceBix)}
                      disabled={state.bixBalance < room.priceBix}
                      className={`py-1.5 px-4 bg-[#22c55e] text-[#0a0a0a] text-[10px] uppercase font-black border-2 border-stone-900 rounded-lg ${
                        state.bixBalance < room.priceBix
                          ? 'opacity-30 cursor-not-allowed'
                          : 'hover:bg-emerald-400 hover:shadow-[2px_2px_0px_0px_rgba(10,10,10,1)] transition-all cursor-pointer'
                      }`}
                    >
                      Unlock Workspace
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: ROOM DECOR & UPGRADES */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 border-b-2 border-stone-200 pb-2">
          <Sprout className="h-5 w-5 text-stone-800 text-left shrink-0" />
          <h2 className="text-xs font-black tracking-widest text-[#0a0a0a] uppercase">DECORATE YOUR CABINET COZY</h2>
        </div>
        <p className="text-xs text-[#1a1a1a]/70 font-medium leading-relaxed">
          Unlock decorative artifacts to personalize your dynamic cabin slots! <strong>Equipped items</strong> automatically render live in your focus room.
        </p>

        <div className="space-y-3.5">
          {ROOM_ITEMS.map((item) => {
            const owned = isItemOwned(item.id);
            const equipped = isItemEquipped(item.id);
            const extra = ITEM_EXTRAS[item.id] || {
              effect: 'Cosmetic glow item.',
              rarity: 'REGULAR DECOR',
              rarityBadgeClass: 'bg-stone-100 text-stone-850',
            };

            return (
              <div
                key={item.id}
                className="bg-white border-2 border-[#2a2a2a] p-4.5 rounded-2xl flex items-center justify-between shadow-[3px_3px_0px_0px_rgba(10,10,10,1)] hover:translate-x-px hover:translate-y-px hover:shadow-[4px_4px_0px_0px_rgba(10,10,10,1)] transition-all"
              >
                <div className="flex items-center space-x-3.5 w-2/3">
                  <div className="text-3xl bg-stone-50 border-2 border-stone-300 w-13 h-13 rounded-xl flex items-center justify-center shadow-inner hover:-rotate-6 transition-transform select-none shrink-0">
                    {item.icon}
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-1.5 flex-wrap">
                      <h4 className="text-xs font-black text-[#0a0a0a] uppercase">{item.name}</h4>
                      <span className={`text-[7px] font-black border px-1.5 py-0.2 rounded uppercase ${extra.rarityBadgeClass}`}>
                        {extra.rarity}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#1a1a1a]/85 leading-snug font-medium pb-0.5">{item.copy}</p>

                    <p className="text-[10px] text-stone-500 font-medium leading-snug italic">
                      <strong className="text-amber-500">Aura Spark:</strong> {extra.effect}
                    </p>

                    {!owned && (
                      <div className="text-[10px] font-extrabold text-stone-600 pt-1">
                        Price: <span className="text-[#22c55e] font-black">🪙 {item.priceBix} Bix</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="w-1/3 flex flex-col space-y-1.5 text-right pl-3.5">
                  {owned ? (
                    <button
                      id={`toggle-item-${item.id}`}
                      onClick={() => onToggleRoomItem(item.id)}
                      className={`w-full py-2.5 text-xs font-black uppercase rounded-lg border-2 transition-all cursor-pointer ${
                        equipped
                          ? 'bg-[#22c55e] text-stone-900 border-stone-900 shadow-[2px_2px_0px_0px_rgba(10,10,10,1)]'
                          : 'bg-white text-stone-400 hover:text-stone-900 border-stone-200 hover:border-stone-400'
                      }`}
                    >
                      {equipped ? '✓ Equipped' : 'Unequipped'}
                    </button>
                  ) : (
                    <button
                      id={`rect-buy-item-bix-${item.id}`}
                      onClick={() => onPurchaseRoomItemBix(item.id, item.priceBix)}
                      disabled={state.bixBalance < item.priceBix}
                      className={`py-2 px-3 bg-[#22c55e] text-stone-900 text-[10px] uppercase font-black border-2 border-stone-900 rounded-lg ${
                        state.bixBalance < item.priceBix
                          ? 'opacity-35 cursor-not-allowed'
                          : 'hover:bg-emerald-400 hover:shadow-[1px_1px_0px_0px_rgba(10,10,10,1)] transition-all cursor-pointer'
                      }`}
                    >
                      {item.priceBix} Bix
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: YOUR CREW */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 border-b-2 border-stone-200 pb-2">
          <Gamepad className="h-5 w-5 text-stone-800 text-left shrink-0" />
          <h2 className="text-xs font-black tracking-widest text-[#0a0a0a] uppercase">COLLECT YOUR DESK CREW</h2>
        </div>
        <p className="text-xs text-[#1a1a1a]/70 font-medium leading-relaxed">
          Each companion features an <strong>interactive stat grid</strong> and specialized <strong>concentration aura.</strong> Collect all 8 to complete your master desktop roster!
        </p>

        {/* Bundle Banner */}
        {unownedCharacters.length > 0 && (
          <div className="bg-gradient-to-br from-[#fff7ed] to-orange-100/30 border-2 border-[#2a2a2a] rounded-xl overflow-hidden flex flex-col justify-between shadow-[4px_4px_0px_0px_rgba(10,10,10,1)]">
            <div className="bg-[#22c55e] p-3 text-center border-b-2 border-[#2a2a2a] relative">
              <span className="absolute top-1 left-2 bg-black uppercase text-white font-serif italic text-[8px] font-black tracking-widest px-1.5 rounded">ROSTER BUNDLE</span>
              <h3 className="text-xs font-black text-[#0a0a0a] uppercase tracking-widest">COMPLETE ROSTER BUNDLE</h3>
              <p className="text-[10px] font-semibold text-[#0a0a0a]/85">Unlocks Blaze, Frost, Dusk, Ember, Mantis, Volt, and Monument together!</p>
            </div>
            <div className="p-3 bg-white flex justify-center">
              <button
                id="crew-bundle-bix"
                onClick={onBuyBundleCharacters}
                disabled={state.bixBalance < 7200}
                className={`w-full py-2.5 bg-[#22c55e] text-[#0a0a0a] text-xs font-black uppercase rounded-lg border-2 border-stone-900 ${
                  state.bixBalance < 7200
                    ? 'opacity-40 cursor-not-allowed'
                    : 'hover:bg-emerald-400 hover:shadow-[2px_2px_0px_0px_rgba(10,10,10,1)] transition-all cursor-pointer'
                }`}
              >
                Unlock Entire Roster • 7,200 Bix 🪙
              </button>
            </div>
          </div>
        )}

        {/* 2-Column Grid */}
        <div className="grid grid-cols-2 gap-3.5 pt-1">
          {CHARACTERS.map((char) => {
            const owned = isCharacterOwned(char.id);
            const extra = CHARACTER_EXTRAS[char.id] || {
              rarity: 'COLLECTIBLE',
              perk: 'Focus companion.',
              badge: 'Cadet',
              focusType: 'Standard focus',
              stats: { focus: 80, calm: 80, grit: 80 },
              glowColor: 'group-hover:shadow-[0_0_10px_rgba(34,197,94,0.3)] border-stone-400',
            };

            return (
              <div
                key={char.id}
                id={`char-card-${char.id}`}
                onClick={() => setSelectedCharacter(char)}
                className={`group bg-white border-2 border-stone-900 p-3 rounded-2xl flex flex-col justify-between cursor-pointer hover:-translate-y-1.5 hover:shadow-[5px_5px_0px_0px_rgba(34,197,94,1)] shadow-[3px_3px_0px_0px_rgba(10,10,10,1)] transition-all relative ${
                  !owned ? 'bg-[#fafafa]' : ''
                }`}
              >
                {owned && (
                  <span className="absolute top-2 right-2 text-[7px] bg-white border-2 border-[#22c55e] text-[#22c55e] px-1.5 py-0.2 font-black rounded uppercase">
                    owned
                  </span>
                )}

                {/* Character visual with specialized glowing container */}
                <div className="flex justify-center items-center h-26 mb-2 rounded-xl bg-radial from-stone-50 to-stone-100/50 border border-stone-200 shadow-inner group-hover:bg-white transition-colors relative overflow-hidden">
                  <div className={`absolute inset-0 rounded-xl transition-all opacity-0 group-hover:opacity-100 shadow-inner ${owned ? extra.glowColor : ''}`} />
                  <div className={`relative z-10 ${!owned ? 'opacity-85 filter grayscale-[25%]' : ''}`}>
                    <CrewCharacter characterId={char.id} pose="idle" height={82} />
                  </div>
                </div>

                <div className="space-y-1 pl-0.5">
                  <div className="flex items-center space-x-1 flex-wrap">
                    <span className="text-[7px] font-black text-[#22c55e] uppercase tracking-wider">{extra.badge}</span>
                  </div>
                  <h4 className="text-xs font-black uppercase text-[#0a0a0a] group-hover:text-[#22c55e] transition-colors">{char.name}</h4>
                  <p className="text-[10px] text-stone-500 font-medium leading-snug line-clamp-1 italic">
                    {char.copy}
                  </p>
                  
                  {/* Small stat feature */}
                  <div className="text-[9px] font-black text-stone-700 flex items-center space-x-1 bg-stone-50 border border-stone-100 rounded-md p-1.5">
                    <Star className="h-2.5 w-2.5 text-amber-400 shrink-0 fill-amber-400" />
                    <span className="uppercase text-[8px] tracking-wider">Series 1 COMPANION</span>
                  </div>
                </div>

                {/* Grid Item Prices */}
                {!owned && (
                  <div className="border-t border-[#eeeeee] pt-2 mt-2.5 flex justify-between items-center text-[9px] font-black text-[#22c55e]">
                    <span>🪙 Unlock:</span>
                    <strong className="text-[#22c55e]">{char.priceBix} Bix</strong>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* FULL-SCREEN CHARACTER DETAILS MODAL */}
      {selectedCharacter && (() => {
        const extra = CHARACTER_EXTRAS[selectedCharacter.id] || {
          rarity: 'COLLECTIBLE',
          perk: 'Focus companion.',
          badge: 'Cadet',
          focusType: 'Standard Focus',
          stats: { focus: 80, calm: 80, grit: 80 },
          glowColor: '',
        };

        return (
          <div className="fixed inset-0 z-50 bg-[#fafafa] flex flex-col justify-between p-6 overflow-y-auto max-h-screen">
            {/* Header block status */}
            <div className="text-left space-y-4">
              <button
                id="close-char-detail-btn"
                onClick={() => setSelectedCharacter(null)}
                className="inline-flex items-center space-x-1.5 text-stone-500 hover:text-black font-extrabold uppercase text-xs tracking-wider py-1 cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4 stroke-[3]" />
                <span>&larr; BACK TO ROSTER</span>
              </button>

              <div className="border-b-4 border-stone-900 pb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-black bg-black text-[#22c55e] tracking-widest px-2.5 py-0.5 rounded-md uppercase">
                    {extra.rarity}
                  </span>
                  <span className="text-[10px] font-extrabold bg-white border border-stone-300 text-stone-600 tracking-wider px-2 py-0.5 rounded-md">
                    SERIES 01
                  </span>
                </div>

                <h1 className="text-3xl font-black text-[#0a0a0a] uppercase tracking-tight mt-1.5 flex items-center justify-between">
                  <span>{selectedCharacter.name}</span>
                  <span className="text-sm font-black text-stone-400 font-mono">SPEC_ID: {selectedCharacter.id.toUpperCase()}</span>
                </h1>
                <p className="text-xs text-[#1a1a1a]/70 font-semibold mt-1">
                  &ldquo;{selectedCharacter.copy}&rdquo;
                </p>
              </div>
            </div>

            {/* Cycling Animations Showcase Box */}
            <div className="my-6 bg-white border-4 border-stone-900 rounded-2xl p-5 flex flex-col items-center justify-center space-y-4.5 shadow-[5px_5px_0px_0px_rgba(10,10,10,1)] relative overflow-hidden bg-radial from-stone-50 to-stone-50/10">
              <div className="absolute top-2 left-3 text-[8.5px] font-black text-stone-300 uppercase tracking-widest select-none">
                active visual motor render
              </div>
              
              <div className="h-42 flex items-center justify-center relative z-10 scale-110">
                <CrewCharacter
                  characterId={selectedCharacter.id}
                  pose={detailPoses[detailPoseIndex]}
                  height={155}
                />
              </div>

              {/* Status cycles */}
              <div className="flex space-x-2 relative z-10">
                {detailPoses.map((pose, pIdx) => (
                  <span
                    key={pose}
                    className={`text-[9.5px] font-black uppercase tracking-widest px-3 py-1 rounded-md border-2 transition-all ${
                      pIdx === detailPoseIndex
                        ? 'bg-black text-[#22c55e] border-black scale-105 shadow-sm'
                        : 'bg-stone-50 border-stone-200 text-stone-400'
                    }`}
                  >
                    {pose}
                  </span>
                ))}
              </div>
            </div>

            {/* Spec Attributes Sheet & Perk block */}
            <div className="space-y-4 text-left">
              <div className="bg-stone-50 border-2 border-stone-900 rounded-xl p-4.5 space-y-3 shadow-[2.5px_2.5px_0px_0px_rgba(10,10,10,1)]">
                <h3 className="text-[10px] font-black uppercase tracking-wider text-stone-400 flex items-center space-x-1">
                  <Info className="h-3 w-3" />
                  <span>CORE BIOMETRIC SPEC SHEET</span>
                </h3>

                <div className="grid grid-cols-2 gap-3 pb-1 border-b border-stone-200 text-[10px] font-bold text-stone-600">
                  <div>
                    <span className="block text-stone-400 text-[8.5px] font-black uppercase">Material Resin:</span>
                    <span className="text-stone-900 font-extrabold uppercase">Matte Poly-Vinyl</span>
                  </div>
                  <div>
                    <span className="block text-stone-400 text-[8.5px] font-black uppercase">Concentration Aura:</span>
                    <strong className="text-amber-500 uppercase">{extra.focusType}</strong>
                  </div>
                </div>

                <div className="text-[11px] font-semibold text-stone-700 leading-relaxed pt-1 flex items-start space-x-1.5">
                  <Sparkles className="h-4 w-4 text-amber-400 shrink-0 fill-amber-400" />
                  <span>
                    <strong className="text-stone-900 font-extrabold">Ultimate Passive Skill:</strong> {extra.perk}
                  </span>
                </div>
              </div>

              {/* Stat meters list */}
              <div className="space-y-2.5">
                <h3 className="text-[10px] font-black uppercase tracking-wider text-stone-500">RESISTANCE PERFORMANCE STATS</h3>
                <div className="bg-white border-2 border-stone-900 rounded-xl p-4 space-y-3">
                  {/* Stat 1 */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-black">
                      <span className="text-stone-500">PRODUCTIVITY INDEX SCORE</span>
                      <strong className="text-stone-900">{extra.stats.focus}%</strong>
                    </div>
                    <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden border border-stone-900">
                      <div className="bg-[#22c55e] h-full rounded-full border-r border-stone-900" style={{ width: `${extra.stats.focus}%` }} />
                    </div>
                  </div>

                  {/* Stat 2 */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-black">
                      <span className="text-stone-500">CALM RESPIRATION STEADINESS</span>
                      <strong className="text-stone-900">{extra.stats.calm}%</strong>
                    </div>
                    <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden border border-stone-900">
                      <div className="bg-sky-400 h-full rounded-full border-r border-stone-900" style={{ width: `${extra.stats.calm}%` }} />
                    </div>
                  </div>

                  {/* Stat 3 */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-black">
                      <span className="text-stone-500">GRIT STREAK RESILIENCE</span>
                      <strong className="text-stone-900">{extra.stats.grit}%</strong>
                    </div>
                    <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden border border-stone-900">
                      <div className="bg-amber-400 h-full rounded-full border-r border-stone-900" style={{ width: `${extra.stats.grit}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer action block */}
            <div className="space-y-3 pt-6">
              {isCharacterOwned(selectedCharacter.id) ? (
                <div className="bg-emerald-50 border-2 border-[#22c55e] text-[#22c55e] p-4 rounded-xl text-center font-black text-xs uppercase tracking-widest shadow-sm">
                  🎉 Buddy is equipped and ready on your roster!
                </div>
              ) : (
                <button
                  id="welcome-char-modal-bix"
                  onClick={() => {
                    onPurchaseCharacterBix(selectedCharacter.id, selectedCharacter.priceBix);
                    setSelectedCharacter(null);
                  }}
                  disabled={state.bixBalance < selectedCharacter.priceBix}
                  className={`w-full py-4 bg-[#22c55e] text-stone-950 text-xs font-black uppercase tracking-wider rounded-xl border-2 border-stone-900 shadow-[4px_4px_0px_0px_rgba(10,10,10,1)] ${
                    state.bixBalance < selectedCharacter.priceBix
                      ? 'opacity-40 cursor-not-allowed shadow-none'
                      : 'hover:bg-emerald-400 active:translate-y-px transition-all cursor-pointer'
                  }`}
                >
                  Unlock {selectedCharacter.name} • {selectedCharacter.priceBix} Bix 🪙
                </button>
              )}

              <button
                id="close-char-detail-bottom"
                onClick={() => setSelectedCharacter(null)}
                className="w-full text-center text-[10px] text-stone-400 hover:text-stone-900 uppercase font-black tracking-widest py-1.5 cursor-pointer"
              >
                Browse more items
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default ShopView;
