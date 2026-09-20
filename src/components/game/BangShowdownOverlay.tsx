import React, { useEffect, useState } from 'react';
import { PublicGameState, PublicPlayer, ActionEffect, Card } from '@/lib/game-engine/types';
import { BulletIndicator } from '../ui/BulletIndicator';
import { CardComponent } from './CardComponent';
import { soundEngine } from '@/lib/audio/soundEffects';

interface BangShowdownOverlayProps {
  gameState: PublicGameState;
  myPlayerId: string;
  activeEffect: ActionEffect | null;
  onRespondReaction: (action: 'play' | 'pass', cardId?: string) => void;
  onDismissEffect?: () => void;
}

type ShowdownStatus = 'aiming' | 'defended' | 'hit';

export const BangShowdownOverlay: React.FC<BangShowdownOverlayProps> = ({
  gameState,
  myPlayerId,
  activeEffect,
  onRespondReaction,
  onDismissEffect,
}) => {
  // Current active duel state
  const [status, setStatus] = useState<ShowdownStatus>('aiming');
  const [defenseReason, setDefenseReason] = useState<'missed' | 'barrel'>('missed');
  const [isVisible, setIsVisible] = useState(false);
  const [cachedShooter, setCachedShooter] = useState<PublicPlayer | null>(null);
  const [cachedDefender, setCachedDefender] = useState<PublicPlayer | null>(null);
  const [attackerImgError, setAttackerImgError] = useState(false);
  const [defenderImgError, setDefenderImgError] = useState(false);

  const pendingReaction = gameState.pendingReaction;
  const isBangPending = pendingReaction?.type === 'bang';

  // Determine current shooter and defender from pendingReaction or activeEffect
  const currentShooterId = isBangPending
    ? pendingReaction.sourcePlayerId
    : activeEffect?.sourcePlayerId;

  const currentDefenderId = isBangPending
    ? pendingReaction.targetPlayerId
    : activeEffect?.targetPlayerId;

  const shooter = gameState.players.find((p) => p.id === currentShooterId) || cachedShooter;
  const defender = gameState.players.find((p) => p.id === currentDefenderId) || cachedDefender;

  // Keep cache of participants so cards don't disappear during exit animation
  useEffect(() => {
    if (shooter) setCachedShooter(shooter);
    if (defender) setCachedDefender(defender);
  }, [shooter, defender]);

  // Handle Showdown lifecycle and state transitions
  useEffect(() => {
    // 1. Pending Bang Reaction (waiting for defense)
    if (isBangPending) {
      setIsVisible(true);
      setStatus('aiming');
      return;
    }

    // 2. Active Effect triggered
    if (activeEffect) {
      if (activeEffect.type === 'bang') {
        setIsVisible(true);
        setStatus('aiming');
        if (!isBangPending) {
          const t = setTimeout(() => {
            setIsVisible(false);
            onDismissEffect?.();
          }, 2000);
          return () => clearTimeout(t);
        }
      } else if (activeEffect.type === 'missed') {
        setIsVisible(true);
        setStatus('defended');
        setDefenseReason('missed');
        soundEngine.playRicochet();
        const t = setTimeout(() => {
          setIsVisible(false);
          onDismissEffect?.();
        }, 2000);
        return () => clearTimeout(t);
      } else if (activeEffect.type === 'barrel_success') {
        setIsVisible(true);
        setStatus('defended');
        setDefenseReason('barrel');
        soundEngine.playBarrelDefense();
        const t = setTimeout(() => {
          setIsVisible(false);
          onDismissEffect?.();
        }, 2000);
        return () => clearTimeout(t);
      } else if (activeEffect.type === 'hit') {
        // Trigger showdown damage outcome
        if (activeEffect.targetPlayerId) {
          setIsVisible(true);
          setStatus('hit');
          soundEngine.playDamageHit();
          const t = setTimeout(() => {
            setIsVisible(false);
            onDismissEffect?.();
          }, 2000);
          return () => clearTimeout(t);
        }
      }
    } else if (!isBangPending && status === 'aiming') {
      // Pending reaction finished without an explicit effect
      setIsVisible(false);
      onDismissEffect?.();
    }
  }, [isBangPending, activeEffect?.id, activeEffect?.type]);

  if (!isVisible || !shooter || !defender) return null;

  const isMeDefender = myPlayerId === defender.id;
  const isMeShooter = myPlayerId === shooter.id;

  // Available defense cards for defender from myPlayer hand
  const myPlayerFull = gameState.myPlayer;
  const matchingCards: Card[] = [];
  if (isMeDefender && myPlayerFull && isBangPending) {
    const required = pendingReaction.requiredCard;
    myPlayerFull.hand.forEach((card) => {
      if (card.name === required) {
        matchingCards.push(card);
      } else if (myPlayerFull.character?.name === 'calamity_janet' && card.name === 'bang') {
        matchingCards.push(card);
      }
    });
  }

  // Role visibility logic
  const isRoleRevealed = (p: PublicPlayer) => {
    return p.role === 'sheriff' || p.id === myPlayerId || p.isEliminated || (p.role !== 'hidden' && p.role !== undefined);
  };

  const getRoleBadge = (role: string, isKnown: boolean) => {
    if (!isKnown) {
      return { label: 'نقش مخفی ❓', color: 'bg-zinc-800 text-zinc-300 border-zinc-700' };
    }
    switch (role) {
      case 'sheriff':
        return { label: 'کلانتر ⭐', color: 'bg-amber-950 text-amber-300 border-amber-500' };
      case 'deputy':
        return { label: 'معاون 🛡️', color: 'bg-blue-950 text-blue-300 border-blue-500' };
      case 'outlaw':
        return { label: 'یاغی 💀', color: 'bg-red-950 text-red-300 border-red-500' };
      case 'renegade':
        return { label: 'خائن 🐍', color: 'bg-purple-950 text-purple-300 border-purple-500' };
      default:
        return { label: 'نقش مخفی ❓', color: 'bg-zinc-800 text-zinc-300 border-zinc-700' };
    }
  };

  const shooterRoleBadge = getRoleBadge(shooter.role, isRoleRevealed(shooter));
  const defenderRoleBadge = getRoleBadge(defender.role, isRoleRevealed(defender));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 select-none animate-in fade-in duration-200">
      {/* 1. Darkened & Blurred Table Background */}
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-md transition-all duration-300"
        onClick={() => {
          if (!isBangPending) setIsVisible(false);
        }}
      />

      {/* Western radial spotlight */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(180,83,9,0.15)_0%,rgba(0,0,0,0.85)_80%)] pointer-events-none" />

      {/* 2. Central Showdown Container */}
      <div className="relative z-10 w-full max-w-3xl flex flex-col items-center justify-center">
        {/* Dismiss Button (for spectators / finished outcomes) */}
        {!isBangPending && (
          <button
            onClick={() => setIsVisible(false)}
            className="absolute -top-10 left-2 text-zinc-400 hover:text-white text-xs sm:text-sm bg-zinc-900/80 border border-zinc-700/80 px-3 py-1 rounded-full transition-all"
          >
            ✕ بستن
          </button>
        )}

        {/* Top Header & Announcement Banner */}
        <div className="text-center mb-4 sm:mb-6" dir="rtl">
          {status === 'aiming' && (
            <div className="inline-flex flex-col items-center gap-1 animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-red-900/90 via-amber-900/90 to-red-900/90 border border-red-500/60 shadow-lg shadow-red-950/50">
                <span className="text-base sm:text-xl animate-pulse">💥</span>
                <span className="text-xs sm:text-sm font-black text-amber-200 font-western tracking-wide">
                  شلیک بنگ! (BANG!)
                </span>
                <span className="text-base sm:text-xl animate-pulse">🎯</span>
              </div>
              <p className="text-[11px] sm:text-xs text-zinc-300 mt-1 font-medium">
                <span className="text-amber-300 font-bold">{shooter.name}</span> به سمت{' '}
                <span className="text-red-300 font-bold">{defender.name}</span> شلیک کرد!
              </p>
            </div>
          )}

          {status === 'defended' && (
            <div className="inline-flex flex-col items-center gap-1 animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-emerald-950 via-teal-900 to-emerald-950 border-2 border-emerald-500/80 shadow-xl shadow-emerald-950/80 animate-bounce">
                <span className="text-xl sm:text-2xl">
                  {defenseReason === 'barrel' ? '🛢️' : '🛡️'}
                </span>
                <span className="text-sm sm:text-base font-black text-emerald-300 font-western">
                  {defenseReason === 'barrel' ? 'سنگر بشکه! گلوله دفع شد!' : 'زپلشک! گلوله کمانه کرد!'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-emerald-200 font-semibold mt-1">
                {defenseReason === 'barrel'
                  ? `${defender.name} با مهارت پشت بشکه سنگر گرفت!`
                  : `${defender.name} با کارت زپلشک! از اصابت گلوله جاخالی داد!`}
              </p>
            </div>
          )}

          {status === 'hit' && (
            <div className="inline-flex flex-col items-center gap-1 animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-red-950 via-rose-900 to-red-950 border-2 border-red-500/90 shadow-xl shadow-red-950/80 animate-pulse">
                <span className="text-xl sm:text-2xl">💥</span>
                <span className="text-sm sm:text-base font-black text-red-200 font-western">
                  اصابت گلوله! صدمه وارد شد!
                </span>
                <span className="text-xl sm:text-2xl">💔</span>
              </div>
              <p className="text-xs sm:text-sm text-red-300 font-bold mt-1">
                {defender.name} ۱ جان از دست داد!
              </p>
            </div>
          )}
        </div>

        {/* 3. The Standoff Arena: Shooter on LEFT, Bullet in Center, Defender on RIGHT (dir="ltr") */}
        <div className="w-full flex items-center justify-between sm:justify-center gap-2 sm:gap-8 px-2" dir="ltr">
          
          {/* ================= LEFT DUELIST: SHOOTER (شلیک‌کننده سمت چپ) ================= */}
          <div className="flex flex-col items-center relative group w-36 sm:w-48 shrink-0" dir="rtl">
            {/* Shooter Tag */}
            <div className="mb-2 px-2.5 py-0.5 rounded-md bg-amber-600/90 text-stone-950 font-black text-[10px] sm:text-xs tracking-wider shadow-md flex items-center gap-1">
              <span>🎯</span>
              <span>شلیک‌کننده</span>
            </div>

            {/* Character Card Box */}
            <div
              className={`relative w-full rounded-2xl overflow-hidden border-2 transition-all duration-300 shadow-2xl bg-saloon-950 ${
                status === 'aiming'
                  ? 'border-amber-500 shadow-amber-500/30 ring-1 ring-amber-400/50'
                  : 'border-zinc-700'
              }`}
            >
              {/* Character Portrait */}
              <div className="relative aspect-[3/4] w-full bg-zinc-900 overflow-hidden">
                {!attackerImgError && shooter.character ? (
                  <img
                    src={`/assets/characters/${shooter.character.name}.jpg`}
                    alt={shooter.character.titleFa}
                    onError={() => setAttackerImgError(true)}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-saloon-900 p-2 text-center">
                    <span className="text-4xl mb-1">🤠</span>
                    <span className="text-xs text-amber-200 font-bold">
                      {shooter.character?.titleFa || shooter.name}
                    </span>
                  </div>
                )}

                {/* Dark gradient overlay for typography readability */}
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/95 via-black/60 to-transparent pointer-events-none" />

                {/* Character Name in Persian */}
                <div className="absolute bottom-1.5 inset-x-1.5 text-center pointer-events-none">
                  <div className="text-xs sm:text-sm font-black text-amber-300 truncate drop-shadow-md">
                    {shooter.character?.titleFa || 'هفت‌تیرکش'}
                  </div>
                  <div className="text-[10px] sm:text-xs text-zinc-300 truncate drop-shadow">
                    {shooter.name}
                  </div>
                </div>

                {/* Role Badge */}
                <div className="absolute top-2 right-2">
                  <span
                    className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-md ${shooterRoleBadge.color}`}
                  >
                    {shooterRoleBadge.label}
                  </span>
                </div>
              </div>

              {/* Bottom Health Bar */}
              <div className="p-2 sm:p-2.5 bg-saloon-900/90 border-t border-amber-900/60 flex flex-col items-center gap-1">
                <BulletIndicator
                  currentHp={shooter.currentHp}
                  maxHp={shooter.maxHp}
                  size="sm"
                />
                <span className="text-[10px] sm:text-xs text-amber-200/90 font-bold">
                  {shooter.currentHp} از {shooter.maxHp} جان
                </span>
              </div>
            </div>

            {/* Revolver / Gun Graphic extending from the RIGHT of the card pointing toward Defender */}
            <div className="absolute -right-5 sm:-right-8 top-20 sm:top-24 z-20 pointer-events-none">
              <div className="relative">
                <svg
                  viewBox="0 0 100 60"
                  className="w-14 sm:w-20 h-9 sm:h-12 drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]"
                >
                  {/* Handle */}
                  <path d="M12 28 Q4 42 16 56 Q28 58 26 44 Q25 34 20 28 Z" fill="#78350f" stroke="#451a03" strokeWidth="2" />
                  {/* Trigger */}
                  <path d="M22 34 Q28 36 26 42" stroke="#cbd5e0" strokeWidth="2" fill="none" />
                  {/* Cylinder */}
                  <circle cx="28" cy="24" r="14" fill="#4a5568" stroke="#1a202c" strokeWidth="2" />
                  <circle cx="28" cy="24" r="4" fill="#a0aec0" />
                  {/* Gun Barrel extending to the right */}
                  <rect x="28" y="18" width="55" height="12" rx="2" fill="#2d3748" stroke="#1a202c" strokeWidth="2" />
                  <rect x="83" y="16" width="6" height="16" rx="1" fill="#4a5568" />
                </svg>

                {/* Muzzle Flash if Shooting */}
                {status === 'aiming' && (
                  <div className="absolute right-0 top-3 w-5 h-5 rounded-full bg-amber-400/90 blur-xs animate-ping" />
                )}
              </div>
            </div>
          </div>

          {/* ================= CENTER: BULLET TRAJECTORY (نماد تیر که یکبار پرواز می‌کند) ================= */}
          <div className="flex-1 flex flex-col items-center justify-center relative min-w-[70px] sm:min-w-[150px] px-1 sm:px-4">
            
            {/* Trajectory flight lane */}
            <div className="relative w-full h-12 flex items-center justify-center overflow-visible">
              {/* Laser / Bullet Trail Guide Line */}
              <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-amber-500/80 via-red-500/60 to-amber-500/40 border-t border-dashed border-amber-400/50" />

              {/* Dynamic Flying Bullet - Travels ONCE from Left to Right and holds at target */}
              {status === 'aiming' && (
                <div className="absolute z-30 flex items-center animate-western-bullet">
                  {/* Fire & Smoke Tail */}
                  <span className="text-xs sm:text-sm -mr-1 animate-pulse select-none">🔥</span>
                  {/* Brass Bullet SVG pointing right */}
                  <svg viewBox="0 0 40 18" className="w-8 sm:w-12 h-4 sm:h-6 drop-shadow-md">
                    <defs>
                      <linearGradient id="bulletGold" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#d97706" />
                        <stop offset="60%" stopColor="#fde047" />
                        <stop offset="100%" stopColor="#ca8a04" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M2 3 L22 3 Q38 9 22 15 L2 15 Q5 9 2 3 Z"
                      fill="url(#bulletGold)"
                      stroke="#78350f"
                      strokeWidth="1"
                    />
                  </svg>
                </div>
              )}

              {/* Deflection Clang / Sparks on the right near defender */}
              {status === 'defended' && (
                <div className="absolute right-2 sm:right-6 flex flex-col items-center animate-in zoom-in-75 duration-150 z-30" dir="rtl">
                  <span className="text-2xl sm:text-4xl animate-spin">✨</span>
                  <span className="text-[10px] sm:text-xs font-black text-amber-300 bg-black/80 px-2 py-0.5 rounded-md border border-amber-500 mt-1 shadow">
                    کمانه! 🛡️
                  </span>
                </div>
              )}

              {/* Hit Explosion Burst on the right near defender */}
              {status === 'hit' && (
                <div className="absolute right-2 sm:right-6 flex flex-col items-center animate-in zoom-in duration-100 z-30">
                  <span className="text-3xl sm:text-5xl animate-ping">💥</span>
                </div>
              )}
            </div>

            {/* Slab the Killer Indicator if applicable */}
            {pendingReaction?.missedNeeded && pendingReaction.missedNeeded > 1 ? (
              <div className="mt-2 text-center" dir="rtl">
                <div className="bg-red-950/90 border border-red-600/70 text-red-200 text-[10px] sm:text-xs px-2.5 py-1 rounded-xl font-bold shadow-md">
                  ⚠️ شلیک اسلبِ قاتل
                  <div className="text-amber-300 font-black mt-0.5">
                    ({pendingReaction.missedPlayed} از {pendingReaction.missedNeeded} دفاع شده)
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* ================= RIGHT DUELIST: DEFENDER (مدافع سمت راست) ================= */}
          <div
            className={`flex flex-col items-center relative group w-36 sm:w-48 shrink-0 ${
              status === 'hit' ? 'animate-western-shake' : ''
            }`}
            dir="rtl"
          >
            {/* Defender Tag */}
            <div className="mb-2 px-2.5 py-0.5 rounded-md bg-red-600/90 text-white font-black text-[10px] sm:text-xs tracking-wider shadow-md flex items-center gap-1">
              <span>🛡️</span>
              <span>مدافع در تیررس</span>
            </div>

            {/* Character Card Box */}
            <div
              className={`relative w-full rounded-2xl overflow-hidden border-2 transition-all duration-300 shadow-2xl bg-saloon-950 ${
                status === 'hit'
                  ? 'border-red-600 shadow-red-600/60 ring-2 ring-red-500'
                  : status === 'defended'
                  ? 'border-emerald-500 shadow-emerald-500/50 ring-2 ring-emerald-400'
                  : 'border-amber-600/60'
              }`}
            >
              {/* Character Portrait */}
              <div className="relative aspect-[3/4] w-full bg-zinc-900 overflow-hidden">
                {!defenderImgError && defender.character ? (
                  <img
                    src={`/assets/characters/${defender.character.name}.jpg`}
                    alt={defender.character.titleFa}
                    onError={() => setDefenderImgError(true)}
                    className={`w-full h-full object-cover transition-transform duration-300 ${
                      status === 'hit' ? 'filter brightness-125 sepia hue-rotate-320' : ''
                    }`}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-saloon-900 p-2 text-center">
                    <span className="text-4xl mb-1">🤠</span>
                    <span className="text-xs text-amber-200 font-bold">
                      {defender.character?.titleFa || defender.name}
                    </span>
                  </div>
                )}

                {/* Dark gradient overlay */}
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/95 via-black/60 to-transparent pointer-events-none" />

                {/* Character Name in Persian */}
                <div className="absolute bottom-1.5 inset-x-1.5 text-center pointer-events-none">
                  <div className="text-xs sm:text-sm font-black text-amber-300 truncate drop-shadow-md">
                    {defender.character?.titleFa || 'یاغی'}
                  </div>
                  <div className="text-[10px] sm:text-xs text-zinc-300 truncate drop-shadow">
                    {defender.name}
                  </div>
                </div>

                {/* Role Badge */}
                <div className="absolute top-2 right-2">
                  <span
                    className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-md ${defenderRoleBadge.color}`}
                  >
                    {defenderRoleBadge.label}
                  </span>
                </div>

                {/* DEFENSE SUCCESS OVERLAY (Shield or Barrel) */}
                {status === 'defended' && (
                  <div className="absolute inset-0 bg-emerald-950/70 backdrop-blur-xs flex flex-col items-center justify-center p-2 text-center animate-in zoom-in-75 duration-200 z-30">
                    <span className="text-4xl sm:text-5xl mb-1 animate-bounce">
                      {defenseReason === 'barrel' ? '🛢️' : '🛡️'}
                    </span>
                    <span className="text-xs sm:text-sm font-black text-emerald-200 bg-emerald-900/90 px-2 py-0.5 rounded-md border border-emerald-400 shadow">
                      {defenseReason === 'barrel' ? 'دفاع بشکه!' : 'زپلشک!'}
                    </span>
                  </div>
                )}

                {/* HIT DAMAGE OVERLAY (Blood burst & -1 HP) */}
                {status === 'hit' && (
                  <div className="absolute inset-0 bg-red-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-2 text-center animate-in zoom-in-90 duration-150 z-30">
                    <span className="text-4xl sm:text-5xl mb-1 animate-ping">💥</span>
                    <span className="text-sm sm:text-base font-black text-white bg-red-800 px-3 py-1 rounded-xl border-2 border-red-400 shadow-xl animate-bounce">
                      -۱ جان 💔
                    </span>
                  </div>
                )}
              </div>

              {/* Bottom Health Bar */}
              <div className="p-2 sm:p-2.5 bg-saloon-900/90 border-t border-amber-900/60 flex flex-col items-center gap-1">
                <BulletIndicator
                  currentHp={defender.currentHp}
                  maxHp={defender.maxHp}
                  size="sm"
                />
                <span className="text-[10px] sm:text-xs text-amber-200/90 font-bold">
                  {defender.currentHp} از {defender.maxHp} جان
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. DEFENDER INTERACTIVE ACTION BAR (Only shown when reaction is active) */}
        {isBangPending && (
          <div className="mt-5 w-full max-w-xl bg-saloon-900/95 border-2 border-amber-600/80 rounded-2xl p-3.5 sm:p-4 shadow-2xl animate-in slide-in-from-bottom-3 duration-200 text-center" dir="rtl">
            {isMeDefender ? (
              <div>
                <div className="flex items-center justify-center gap-2 mb-2 text-xs sm:text-sm font-bold text-amber-200">
                  <span>⚠️</span>
                  <span>
                    برای دفع این شلیک، یک کارت{' '}
                    <span className="text-amber-400 font-black">«زپلشک!»</span> بازی کنید:
                  </span>
                </div>

                {myPlayerFull?.character?.name === 'calamity_janet' && (
                  <div className="text-[11px] text-cyan-300 font-bold bg-cyan-950/80 border border-cyan-700/60 rounded-xl p-1.5 mb-3">
                    ⚡ قابلیت کالامیتی جنت: می‌توانید با کارت «بنگ!» نیز دفاع کنید!
                  </div>
                )}

                {/* Hand cards suitable for defense */}
                {matchingCards.length > 0 ? (
                  <div className="mb-3">
                    <div className="flex justify-center gap-3 overflow-x-auto py-1">
                      {matchingCards.map((card) => (
                        <div
                          key={card.id}
                          className="cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                          onClick={() => onRespondReaction('play', card.id)}
                        >
                          <CardComponent
                            card={card}
                            size="sm"
                            onClick={() => onRespondReaction('play', card.id)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-950/70 border border-red-800/60 rounded-xl p-2.5 mb-3 text-xs text-red-200">
                    هیچ کارت دفاعی (زپلشک!) در دست ندارید!
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-center gap-3">
                  {matchingCards.length > 0 && (
                    <button
                      onClick={() => onRespondReaction('play', matchingCards[0].id)}
                      className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm py-2.5 px-4 rounded-xl border border-emerald-400 shadow-lg shadow-emerald-950/50 transition-all active:scale-98"
                    >
                      🛡️ دفاع با زپلشک!
                    </button>
                  )}

                  <button
                    onClick={() => onRespondReaction('pass')}
                    className={`${
                      matchingCards.length > 0 ? 'w-40' : 'w-full'
                    } bg-gradient-to-r from-red-800 to-rose-900 hover:from-red-700 hover:to-rose-800 text-white font-bold text-xs sm:text-sm py-2.5 px-4 rounded-xl border border-red-500 shadow-lg shadow-red-950/50 transition-all active:scale-98`}
                  >
                    صدمه دیدن (-۱ جان) 💥
                  </button>
                </div>
              </div>
            ) : isMeShooter ? (
              <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-amber-300 font-bold animate-pulse">
                <span>⏳</span>
                <span>در انتظار واکنش دفاعی {defender.name}... گلوله به سمت او شلیک شده است!</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-zinc-300 font-medium">
                <span>⏳</span>
                <span>
                  در انتظار دفاع{' '}
                  <span className="text-amber-300 font-bold">{defender.name}</span> در برابر شلیک{' '}
                  <span className="text-red-300 font-bold">{shooter.name}</span>...
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Scoped CSS Keyframe Motion Animations */}
      <style jsx>{`
        @keyframes westernBulletFlightOnce {
          0% {
            left: 4%;
            opacity: 0;
            transform: scale(0.7);
          }
          15% {
            opacity: 1;
            transform: scale(1.1);
          }
          85% {
            opacity: 1;
            transform: scale(1);
          }
          100% {
            left: 84%;
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes westernShakeCard {
          0%, 100% {
            transform: translateX(0) rotate(0deg);
          }
          20% {
            transform: translateX(-8px) rotate(-3deg);
          }
          40% {
            transform: translateX(8px) rotate(3deg);
          }
          60% {
            transform: translateX(-5px) rotate(-1.5deg);
          }
          80% {
            transform: translateX(5px) rotate(1.5deg);
          }
        }

        .animate-western-bullet {
          animation: westernBulletFlightOnce 0.45s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        .animate-western-shake {
          animation: westernShakeCard 0.4s ease-in-out;
        }
      `}</style>
    </div>
  );
};
