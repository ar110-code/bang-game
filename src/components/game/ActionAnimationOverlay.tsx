import React, { useEffect, useState } from 'react';
import { ActionEffect } from '@/lib/game-engine/types';
import { soundEngine } from '@/lib/audio/soundEffects';

interface ActionAnimationOverlayProps {
  effect: ActionEffect | null;
  containerMode?: 'table' | 'fullscreen';
}

export const ActionAnimationOverlay: React.FC<ActionAnimationOverlayProps> = ({
  effect,
  containerMode = 'table',
}) => {
  const [currentEffect, setCurrentEffect] = useState<ActionEffect | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!effect) return;

    setCurrentEffect(effect);
    setIsVisible(true);

    switch (effect.type) {
      case 'bang':
        soundEngine.playGunshot();
        break;
      case 'jail':
        soundEngine.playJailDoor();
        break;
      case 'stagecoach':
        soundEngine.playStagecoach();
        break;
      case 'general_store':
        soundEngine.playStoreBell();
        break;
      case 'saloon':
        soundEngine.playSaloonPiano();
        break;
      case 'missed':
        soundEngine.playRicochet();
        break;
      case 'beer':
        soundEngine.playBeerDrink();
        break;
      case 'gatling':
        soundEngine.playGatling();
        break;
      case 'indians':
        soundEngine.playArrow();
        break;
      case 'duel':
        soundEngine.playDuelClash();
        break;
      case 'dynamite_explode':
        soundEngine.playExplosion();
        break;
      case 'barrel_success':
        soundEngine.playBarrelDefense();
        break;
      case 'cat_balou':
        soundEngine.playFireBurn();
        break;
      case 'panic':
        soundEngine.playCardSnap();
        break;
    }

    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 1800);

    return () => clearTimeout(timer);
  }, [effect?.id]);

  if (!isVisible || !currentEffect) return null;

  const isTableMode = containerMode === 'table';

  return (
    <div
      onClick={() => setIsVisible(false)}
      className={`${
        isTableMode
          ? 'absolute inset-0 z-40'
          : 'fixed inset-0 z-50'
      } pointer-events-none flex items-center justify-center overflow-visible animate-in fade-in duration-150`}
    >
      {/* Scoped CSS Keyframe Motion Animations */}
      <style jsx>{`
        @keyframes westernGunRecoil {
          0% {
            transform: translate(-30px, 25px) rotate(-16deg) scale(0.85);
            opacity: 0;
          }
          15% {
            transform: translate(0px, 0px) rotate(-10deg) scale(1);
            opacity: 1;
          }
          24% {
            transform: translate(0px, 0px) rotate(-10deg);
          }
          27% {
            /* Heavy physical recoil kick */
            transform: translate(-34px, -22px) rotate(-35deg) scale(1.08);
          }
          36% {
            transform: translate(-20px, -14px) rotate(-28deg);
          }
          48% {
            transform: translate(-6px, -4px) rotate(-14deg);
          }
          62% {
            transform: translate(0px, 0px) rotate(-10deg);
          }
          85% {
            transform: translate(0px, 0px) rotate(-10deg);
            opacity: 1;
          }
          100% {
            transform: translate(-25px, 15px) rotate(-20deg);
            opacity: 0;
          }
        }

        @keyframes bulletFlyAcross {
          0%, 25% {
            opacity: 0;
            transform: translate(0px, 0px) scale(0.3);
          }
          28% {
            opacity: 1;
            transform: translate(25px, -4px) scale(1);
          }
          45% {
            opacity: 1;
            transform: translate(220px, -14px) scale(1);
          }
          62% {
            opacity: 1;
            transform: translate(440px, -20px) scale(1);
          }
          68% {
            opacity: 0.9;
            transform: translate(480px, -22px) scale(1.05);
          }
          76%, 100% {
            opacity: 0;
            transform: translate(500px, -23px) scale(0);
          }
        }

        @keyframes bulletShellEject {
          0%, 26% {
            opacity: 0;
            transform: translate(0px, 0px) rotate(0deg);
          }
          30% {
            opacity: 1;
            transform: translate(15px, -35px) rotate(120deg);
          }
          45% {
            opacity: 1;
            transform: translate(35px, -50px) rotate(280deg);
          }
          60% {
            opacity: 0.9;
            transform: translate(55px, -10px) rotate(440deg);
          }
          75% {
            opacity: 0;
            transform: translate(70px, 30px) rotate(540deg);
          }
          100% {
            opacity: 0;
          }
        }

        @keyframes impactHitSpark {
          0%, 58% {
            opacity: 0;
            transform: scale(0);
          }
          63% {
            opacity: 1;
            transform: scale(1.4);
          }
          76% {
            opacity: 1;
            transform: scale(1);
          }
          90%, 100% {
            opacity: 0;
            transform: scale(0.6);
          }
        }

        @keyframes jailBarsDrop {
          0% {
            transform: translateY(-160%) scale(0.9);
            opacity: 0;
          }
          40% {
            transform: translateY(8%) scale(1.02);
            opacity: 1;
          }
          55% {
            transform: translateY(-4%) scale(1);
          }
          66% {
            transform: translateY(0%) scale(1);
          }
          85% {
            opacity: 1;
            transform: scale(1);
          }
          100% {
            opacity: 0;
            transform: scale(0.95);
          }
        }

        @keyframes padlockSnap {
          0%, 42% {
            opacity: 0;
            transform: scale(2.2) rotate(-20deg);
          }
          58% {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
          68% {
            transform: scale(1.1) rotate(6deg);
          }
          76% {
            transform: scale(1) rotate(0deg);
          }
          88% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }

        @keyframes stagecoachRoll {
          0% {
            transform: translateX(-150%) scale(0.85);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          50% {
            transform: translateX(0%) scale(1.05);
            opacity: 1;
          }
          80% {
            opacity: 1;
          }
          100% {
            transform: translateX(150%) scale(0.95);
            opacity: 0;
          }
        }
      `}</style>

      {/* 1. Action Banner at Top */}
      <div
        className={`absolute ${
          isTableMode ? '-top-3 sm:-top-5' : 'top-16 sm:top-20'
        } z-50 flex flex-col items-center animate-in slide-in-from-top-4 duration-300 pointer-events-auto`}
      >
        <div className="bg-saloon-950/95 border-2 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.4)] px-4 sm:px-6 py-2 rounded-2xl flex items-center gap-2.5 backdrop-blur-md">
          {currentEffect.type === 'bang' && (
            <>
              <span className="text-2xl sm:text-3xl animate-bounce">💥</span>
              <div className="text-right">
                <span className="text-amber-400 font-black text-sm sm:text-base">
                  {currentEffect.sourcePlayerName || 'بازیکن'}
                </span>
                <span className="text-zinc-200 text-xs sm:text-sm font-bold mx-1">
                  به سمت
                </span>
                <span className="text-red-400 font-black text-sm sm:text-base">
                  {currentEffect.targetPlayerName || 'هدف'}
                </span>
                <span className="text-amber-300 font-bold text-xs sm:text-sm mr-1">
                  شلیک کرد! (بنگ!)
                </span>
              </div>
            </>
          )}

          {currentEffect.type === 'jail' && (
            <>
              <span className="text-2xl sm:text-3xl animate-bounce">🔒</span>
              <div className="text-right">
                <span className="text-amber-400 font-black text-sm sm:text-base">
                  {currentEffect.sourcePlayerName || 'کلانتر'}
                </span>
                <span className="text-zinc-200 text-xs sm:text-sm font-bold mx-1">
                  ،
                </span>
                <span className="text-blue-300 font-black text-sm sm:text-base">
                  {currentEffect.targetPlayerName || 'متهم'}
                </span>
                <span className="text-amber-300 font-bold text-xs sm:text-sm mr-1">
                  را روانه هلفدونی کرد!
                </span>
              </div>
            </>
          )}

          {currentEffect.type === 'saloon' && (
            <>
              <span className="text-2xl sm:text-3xl animate-bounce">🍻</span>
              <div className="text-right">
                <span className="text-amber-400 font-black text-sm sm:text-base">
                  {currentEffect.sourcePlayerName}
                </span>
                <span className="text-emerald-300 font-bold text-xs sm:text-sm mr-1">
                  همه را در سالون به یک دور نوشیدنی مهمان کرد! (+۱ جان به همه)
                </span>
              </div>
            </>
          )}

          {currentEffect.type === 'stagecoach' && (
            <>
              <span className="text-2xl sm:text-3xl animate-bounce">🐴</span>
              <div className="text-right">
                <span className="text-amber-400 font-black text-sm sm:text-base">
                  {currentEffect.cardName === 'wells_fargo' ? 'محموله ولز فارگو' : 'دلیجان وسترن'}
                </span>
                <span className="text-amber-200 font-bold text-xs sm:text-sm mr-1">
                  به {currentEffect.sourcePlayerName} رسید!
                </span>
              </div>
            </>
          )}

          {currentEffect.type === 'general_store' && (
            <>
              <span className="text-2xl sm:text-3xl animate-bounce">🏪</span>
              <div className="text-right">
                <span className="text-amber-400 font-black text-sm sm:text-base">
                  {currentEffect.sourcePlayerName}
                </span>
                <span className="text-amber-200 font-bold text-xs sm:text-sm mr-1">
                  کارت‌های فروشگاه عمومی را روی میز چید!
                </span>
              </div>
            </>
          )}

          {currentEffect.type === 'missed' && (
            <>
              <span className="text-2xl sm:text-3xl">💨</span>
              <div className="text-right">
                <span className="text-sky-300 font-black text-sm sm:text-base">
                  {currentEffect.sourcePlayerName || 'بازیکن'}
                </span>
                <span className="text-zinc-200 text-xs sm:text-sm font-bold mr-1">
                  با زیرکی جاخالی داد! (زپلشک!)
                </span>
              </div>
            </>
          )}

          {currentEffect.type === 'beer' && (
            <>
              <span className="text-2xl sm:text-3xl animate-bounce">🍺</span>
              <div className="text-right">
                <span className="text-amber-400 font-black text-sm sm:text-base">
                  {currentEffect.sourcePlayerName || 'بازیکن'}
                </span>
                <span className="text-emerald-300 text-xs sm:text-sm font-bold mr-1">
                  یک نوشیدنی خنک زد! (+۱ جان)
                </span>
              </div>
            </>
          )}

          {currentEffect.type === 'gatling' && (
            <>
              <span className="text-2xl sm:text-3xl">💥</span>
              <div className="text-right">
                <span className="text-amber-400 font-black text-sm sm:text-base">
                  {currentEffect.sourcePlayerName || 'بازیکن'}
                </span>
                <span className="text-red-400 text-xs sm:text-sm font-bold mr-1">
                  همه را به رگبار مسلسل گاتلینگ بست!
                </span>
              </div>
            </>
          )}

          {currentEffect.type === 'indians' && (
            <>
              <span className="text-2xl sm:text-3xl">🏹</span>
              <div className="text-right">
                <span className="text-amber-400 font-black text-sm sm:text-base">
                  {currentEffect.sourcePlayerName || 'بازیکن'}
                </span>
                <span className="text-orange-400 text-xs sm:text-sm font-bold mr-1">
                  سرخ‌پوست‌ها را به حمله فراخواند!
                </span>
              </div>
            </>
          )}

          {currentEffect.type === 'duel' && (
            <>
              <span className="text-2xl sm:text-3xl">⚔️</span>
              <div className="text-right">
                <span className="text-purple-400 font-black text-sm sm:text-base">
                  دوئل مرگبار!
                </span>
                <span className="text-zinc-200 text-xs sm:text-sm mr-1">
                  {currentEffect.sourcePlayerName} در برابر {currentEffect.targetPlayerName}
                </span>
              </div>
            </>
          )}

          {currentEffect.type === 'dynamite_explode' && (
            <>
              <span className="text-2xl sm:text-3xl animate-bounce">🧨</span>
              <div className="text-right">
                <span className="text-red-400 font-black text-sm sm:text-base">
                  انفجار مهیب دینامیت!
                </span>
                <span className="text-amber-300 text-xs sm:text-sm mr-1">
                  ۳ جان از دست رفت!
                </span>
              </div>
            </>
          )}

          {currentEffect.type === 'barrel_success' && (
            <>
              <span className="text-2xl sm:text-3xl">🛡️</span>
              <div className="text-right">
                <span className="text-sky-300 font-black text-sm sm:text-base">
                  دفاع موفق بشکه!
                </span>
                <span className="text-zinc-200 text-xs sm:text-sm mr-1">
                  کارت دل آمد — گلوله دفع شد!
                </span>
              </div>
            </>
          )}

          {currentEffect.type === 'cat_balou' && (
            <>
              <span className="text-2xl sm:text-3xl">🔥</span>
              <div className="text-right">
                <span className="text-orange-400 font-black text-sm sm:text-base">
                  کارت کت بالو!
                </span>
                <span className="text-zinc-200 text-xs sm:text-sm mr-1">
                  یک کارت سوزانده و خاکستر شد!
                </span>
              </div>
            </>
          )}

          {currentEffect.type === 'panic' && (
            <>
              <span className="text-2xl sm:text-3xl">💰</span>
              <div className="text-right">
                <span className="text-yellow-400 font-black text-sm sm:text-base">
                  تهدید و دستبرد!
                </span>
                <span className="text-zinc-200 text-xs sm:text-sm mr-1">
                  {currentEffect.sourcePlayerName} یک کارت از {currentEffect.targetPlayerName} ربود!
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 2. Visual Center Animations */}
      {/* ================= BANG! ANIMATED REVOLVER WITH RECOIL, FLYING BULLET & SHELL ================= */}
      {currentEffect.type === 'bang' && (
        <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
          {/* Western Colt .45 Revolver Assembly with Physical Recoil Motion */}
          <div
            className="relative flex items-center justify-center -translate-x-16 sm:-translate-x-24"
            style={{
              animation: 'westernGunRecoil 1.8s cubic-bezier(0.25, 1, 0.5, 1) forwards',
              transformOrigin: '70px 180px',
            }}
          >
            {/* The Revolver SVG */}
            <svg
              className="w-48 h-48 sm:w-64 sm:h-64 drop-shadow-[0_12px_24px_rgba(0,0,0,0.9)]"
              viewBox="0 0 400 240"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Wooden Grip */}
              <path
                d="M 60 140 C 50 170 30 210 50 230 C 65 240 95 235 110 200 C 120 180 125 155 125 140 Z"
                fill="#5c2c16"
                stroke="#381708"
                strokeWidth="4"
              />
              <path d="M 55 170 C 65 190 75 220 85 225" stroke="#7a3b1e" strokeWidth="2" />
              <path d="M 75 160 C 85 185 95 210 100 215" stroke="#7a3b1e" strokeWidth="2" />
              <circle cx="80" cy="180" r="5" fill="#f59e0b" stroke="#78350f" strokeWidth="1.5" />

              {/* Trigger Guard & Trigger */}
              <path d="M 125 140 C 125 165 155 165 165 140" stroke="#475569" strokeWidth="5" fill="none" />
              <path d="M 140 140 C 138 152 145 155 148 152" stroke="#cbd5e1" strokeWidth="3.5" fill="none" />

              {/* Revolver Frame / Receiver */}
              <path d="M 105 110 L 125 140 L 180 140 L 180 110 L 175 95 L 120 95 Z" fill="#334155" stroke="#1e293b" strokeWidth="4" />

              {/* Revolver Cylinder */}
              <rect x="170" y="92" width="60" height="45" rx="6" fill="#1e293b" stroke="#0f172a" strokeWidth="4" />
              <line x1="170" y1="102" x2="230" y2="102" stroke="#475569" strokeWidth="3" />
              <line x1="170" y1="115" x2="230" y2="115" stroke="#475569" strokeWidth="3" />
              <line x1="170" y1="126" x2="230" y2="126" stroke="#475569" strokeWidth="3" />

              {/* Hammer */}
              <path d="M 105 105 C 95 90 90 85 85 92 C 85 98 98 110 105 110 Z" fill="#475569" stroke="#1e293b" strokeWidth="3" />

              {/* Long Octagonal Barrel */}
              <path d="M 230 100 L 360 100 L 360 122 L 230 122 Z" fill="#334155" stroke="#1e293b" strokeWidth="4" />
              <line x1="230" y1="105" x2="360" y2="105" stroke="#64748b" strokeWidth="2" />
              <polygon points="350,100 355,92 360,100" fill="#cbd5e1" stroke="#1e293b" strokeWidth="1.5" />
              <rect x="230" y="122" width="90" height="8" rx="2" fill="#1e293b" />
            </svg>

            {/* Ejected Spinning Brass Shell Casing */}
            <div
              className="absolute top-12 left-28 pointer-events-none"
              style={{ animation: 'bulletShellEject 1.8s ease-out forwards' }}
            >
              <div className="w-2.5 h-4 bg-gradient-to-b from-amber-300 to-amber-600 rounded-sm border border-amber-700 shadow" />
            </div>

            {/* Gunsmoke Billow Puff */}
            <div className="absolute top-8 right-2 flex gap-1.5 pointer-events-none opacity-80">
              <div className="w-8 h-8 rounded-full bg-zinc-300/40 blur-md animate-ping" />
              <div className="w-12 h-12 rounded-full bg-zinc-400/30 blur-lg animate-pulse" />
            </div>
          </div>

          {/* PHYSICAL FLYING 3D BULLET SHOOTING OUT OF BARREL ACROSS TABLE */}
          <div
            className="absolute left-1/2 top-1/2 -translate-y-4 pointer-events-none"
            style={{
              animation: 'bulletFlyAcross 1.8s cubic-bezier(0.1, 0.7, 0.1, 1) forwards',
            }}
          >
            <div className="relative flex items-center">
              {/* Detailed 3D Brass Bullet with Speed Trail */}
              <svg className="w-16 h-7 sm:w-20 sm:h-8 drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]" viewBox="0 0 65 24" fill="none">
                <defs>
                  <linearGradient id="bulletCopperGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#b45309" />
                    <stop offset="60%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#fef08a" />
                  </linearGradient>
                  <linearGradient id="bulletBrassGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fef08a" />
                    <stop offset="50%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#78350f" />
                  </linearGradient>
                </defs>
                {/* Motion Speed Trail Line */}
                <line x1="0" y1="12" x2="15" y2="12" stroke="#f59e0b" strokeWidth="3" strokeDasharray="3 2" opacity="0.8" />
                {/* Brass Casing */}
                <rect x="12" y="5" width="30" height="14" rx="2" fill="url(#bulletBrassGrad)" stroke="#78350f" strokeWidth="1" />
                {/* Cannelure Groove */}
                <line x1="30" y1="5" x2="30" y2="19" stroke="#78350f" strokeWidth="1.5" />
                {/* Pointed Aerodynamic Nose Cone */}
                <path d="M 42 5 C 52 5 60 10 63 12 C 60 14 52 19 42 19 Z" fill="url(#bulletCopperGrad)" stroke="#78350f" strokeWidth="0.8" />
                {/* Gleaming Light Specular */}
                <line x1="16" y1="8" x2="52" y2="8" stroke="#ffffff" strokeWidth="1.5" opacity="0.85" />
              </svg>
            </div>
          </div>

          {/* Impact Spark / Hit Mark on Opposite Side */}
          <div
            className="absolute right-8 sm:right-16 top-1/2 -translate-y-4 pointer-events-none"
            style={{ animation: 'impactHitSpark 1.8s ease-out forwards' }}
          >
            <div className="relative flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-saloon-950 border-2 border-stone-700 shadow-[inset_0_0_10px_#000000] flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-black" />
              </div>
              <span className="absolute -top-2 -right-2 text-xl animate-ping">💥</span>
              <span className="absolute -bottom-1 -left-1 text-base">✨</span>
            </div>
          </div>
        </div>
      )}

      {/* ================= JAIL (هلفدونی) HEAVY STEEL PRISON BARS & PADLOCK ================= */}
      {currentEffect.type === 'jail' && (
        <div className="relative w-full h-full flex items-center justify-center pointer-events-none select-none">
          {/* Iron Prison Cell Bars Slamming Down */}
          <div
            className="relative flex flex-col items-center justify-center"
            style={{ animation: 'jailBarsDrop 1.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards' }}
          >
            {/* The Prison Bars SVG */}
            <svg
              className="w-64 h-64 sm:w-80 sm:h-80 drop-shadow-[0_20px_40px_rgba(0,0,0,0.95)]"
              viewBox="0 0 320 320"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Outer Heavy Iron Frame */}
              <rect x="20" y="20" width="280" height="280" rx="16" fill="#18181b" stroke="#3f3f46" strokeWidth="8" />
              {/* Weathered Texture Line */}
              <rect x="28" y="28" width="264" height="264" rx="10" stroke="#71717a" strokeWidth="2" strokeDasharray="6 4" />

              {/* Vertical Solid Steel Bars with Rivets */}
              {[60, 100, 140, 180, 220, 260].map((x, idx) => (
                <g key={idx}>
                  <line x1={x + 3} y1="28" x2={x + 3} y2="292" stroke="#09090b" strokeWidth="12" />
                  <line x1={x} y1="28" x2={x} y2="292" stroke="#52525b" strokeWidth="10" strokeLinecap="round" />
                  <line x1={x - 2} y1="30" x2={x - 2} y2="290" stroke="#a1a1aa" strokeWidth="2" />
                  <circle cx={x} cy="38" r="4" fill="#27272a" stroke="#71717a" strokeWidth="1.5" />
                  <circle cx={x} cy="282" r="4" fill="#27272a" stroke="#71717a" strokeWidth="1.5" />
                  <circle cx={x} cy="160" r="3.5" fill="#27272a" stroke="#71717a" strokeWidth="1" />
                </g>
              ))}

              {/* Horizontal Reinforcing Crossbeams */}
              <rect x="20" y="70" width="280" height="16" fill="#27272a" stroke="#3f3f46" strokeWidth="3" />
              <rect x="20" y="234" width="280" height="16" fill="#27272a" stroke="#3f3f46" strokeWidth="3" />
              <rect x="20" y="152" width="280" height="16" fill="#27272a" stroke="#3f3f46" strokeWidth="3" />
            </svg>

            {/* Massive Steel Padlock Snapping Shut in Center */}
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{ animation: 'padlockSnap 1.8s ease-out forwards' }}
            >
              <div className="relative flex flex-col items-center">
                <svg className="w-28 h-32 sm:w-36 sm:h-40 drop-shadow-[0_15px_30px_rgba(0,0,0,0.9)]" viewBox="0 0 120 140" fill="none">
                  {/* Heavy Padlock Shackle */}
                  <path
                    d="M 35 65 L 35 40 C 35 22 50 12 60 12 C 70 12 85 22 85 40 L 85 65"
                    stroke="#a1a1aa"
                    strokeWidth="12"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M 38 40 C 38 26 48 18 60 18 C 72 18 82 26 82 40"
                    stroke="#ffffff"
                    strokeWidth="3"
                    strokeOpacity="0.7"
                    fill="none"
                  />
                  {/* Heavy Brass/Steel Lock Body */}
                  <rect x="20" y="60" width="80" height="70" rx="14" fill="#d97706" stroke="#78350f" strokeWidth="5" />
                  <rect x="26" y="66" width="68" height="58" rx="8" fill="#f59e0b" />
                  {/* Keyhole */}
                  <circle cx="60" cy="90" r="7" fill="#18181b" />
                  <polygon points="56,92 64,92 62,108 58,108" fill="#18181b" />
                  <circle cx="32" cy="72" r="3" fill="#78350f" />
                  <circle cx="88" cy="72" r="3" fill="#78350f" />
                  <circle cx="32" cy="118" r="3" fill="#78350f" />
                  <circle cx="88" cy="118" r="3" fill="#78350f" />
                </svg>
                {/* Prison Label */}
                <div className="mt-[-8px] bg-red-950/95 border-2 border-red-500 text-red-200 px-4 py-1 rounded-xl shadow-2xl font-black text-xs tracking-wider animate-pulse flex items-center gap-1.5">
                  <span>🔒</span>
                  <span>هلفدونی (بازداشتگاه کلانتری)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= STAGECOACH (دلیجان و ولز فارگو) ANIMATION ================= */}
      {currentEffect.type === 'stagecoach' && (
        <div className="relative w-full h-full flex items-center justify-center pointer-events-none select-none">
          <div
            className="relative flex items-center justify-center"
            style={{ animation: 'stagecoachRoll 1.8s ease-in-out forwards' }}
          >
            <svg className="w-56 h-40 sm:w-72 sm:h-52 drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)]" viewBox="0 0 340 200" fill="none">
              <rect x="90" y="50" width="150" height="90" rx="18" fill="#78350f" stroke="#451a03" strokeWidth="4" />
              <rect x="140" y="65" width="50" height="50" rx="8" fill="#fef08a" stroke="#451a03" strokeWidth="3" opacity="0.85" />
              <line x1="165" y1="65" x2="165" y2="115" stroke="#451a03" strokeWidth="2.5" />
              <line x1="140" y1="90" x2="190" y2="90" stroke="#451a03" strokeWidth="2.5" />
              <rect x="110" y="32" width="110" height="18" rx="6" fill="#b45309" stroke="#451a03" strokeWidth="3" />
              <circle cx="130" cy="41" r="5" fill="#f59e0b" />
              <circle cx="165" cy="41" r="6" fill="#fef08a" />
              <circle cx="200" cy="41" r="5" fill="#f59e0b" />
              <polygon points="60,80 90,80 90,110 70,110" fill="#451a03" />

              {/* Spinning Wagon Wheels */}
              <g className="animate-spin" style={{ transformOrigin: '115px 145px', animationDuration: '0.6s' }}>
                <circle cx="115" cy="145" r="32" fill="#292524" stroke="#d97706" strokeWidth="4" />
                <circle cx="115" cy="145" r="8" fill="#f59e0b" />
                <line x1="115" y1="113" x2="115" y2="177" stroke="#d97706" strokeWidth="2.5" />
                <line x1="83" y1="145" x2="147" y2="145" stroke="#d97706" strokeWidth="2.5" />
                <line x1="92" y1="122" x2="138" y2="168" stroke="#d97706" strokeWidth="2" />
                <line x1="92" y1="168" x2="138" y2="122" stroke="#d97706" strokeWidth="2" />
              </g>
              <g className="animate-spin" style={{ transformOrigin: '215px 145px', animationDuration: '0.6s' }}>
                <circle cx="215" cy="145" r="32" fill="#292524" stroke="#d97706" strokeWidth="4" />
                <circle cx="215" cy="145" r="8" fill="#f59e0b" />
                <line x1="215" y1="113" x2="215" y2="177" stroke="#d97706" strokeWidth="2.5" />
                <line x1="183" y1="145" x2="247" y2="145" stroke="#d97706" strokeWidth="2.5" />
                <line x1="192" y1="122" x2="238" y2="168" stroke="#d97706" strokeWidth="2" />
                <line x1="192" y1="168" x2="238" y2="122" stroke="#d97706" strokeWidth="2" />
              </g>
              <text x="10" y="125" fontSize="48" fill="#000000">🐎</text>
            </svg>
          </div>
        </div>
      )}

      {/* ================= SALOON (کافه سالون) ANIMATION ================= */}
      {currentEffect.type === 'saloon' && (
        <div className="relative w-full h-full flex flex-col items-center justify-center pointer-events-none select-none animate-in zoom-in-75 duration-200">
          <div className="flex items-center gap-6">
            <span className="text-5xl sm:text-6xl animate-bounce" style={{ animationDelay: '0s' }}>🍺</span>
            <span className="text-6xl sm:text-7xl animate-bounce" style={{ animationDelay: '0.15s' }}>🍻</span>
            <span className="text-5xl sm:text-6xl animate-bounce" style={{ animationDelay: '0.3s' }}>🍺</span>
          </div>
          <div className="mt-3 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 text-saloon-950 font-black text-sm sm:text-lg px-5 py-1.5 rounded-2xl border-2 border-amber-300 shadow-2xl animate-pulse">
            یک دور نوشیدنی در سالون به حساب حاکم! (+۱ جان به همه)
          </div>
        </div>
      )}

      {/* ================= GENERAL STORE (فروشگاه) ANIMATION ================= */}
      {currentEffect.type === 'general_store' && (
        <div className="relative w-full h-full flex flex-col items-center justify-center pointer-events-none select-none animate-in zoom-in-75 duration-200">
          <div className="relative flex items-center justify-center">
            <span className="text-6xl sm:text-7xl drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]">🏪</span>
            <div className="absolute -top-3 -right-3 text-2xl animate-bounce">🪙</div>
            <div className="absolute -bottom-2 -left-3 text-2xl animate-bounce" style={{ animationDelay: '0.2s' }}>🃏</div>
          </div>
          <div className="mt-3 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 text-white font-black text-xs sm:text-base px-5 py-1.5 rounded-2xl border-2 border-emerald-300 shadow-2xl animate-pulse">
            فروشگاه باز شد — کارت‌ها روی میز قرار گرفتند!
          </div>
        </div>
      )}

      {/* ================= MISSED! (زپلشک) ANIMATION ================= */}
      {currentEffect.type === 'missed' && (
        <div className="relative flex flex-col items-center justify-center animate-in zoom-in-75 duration-200">
          <div className="relative">
            <span className="text-7xl sm:text-8xl drop-shadow-[0_10px_25px_rgba(0,0,0,0.8)]">
              🛡️
            </span>
            <div className="absolute top-2 right-1 text-3xl animate-ping">✨</div>
            <div className="absolute bottom-2 left-1 text-2xl animate-ping duration-300">💥</div>
          </div>
          <span className="mt-3 bg-gradient-to-r from-sky-500 via-blue-600 to-sky-500 text-white font-black text-xl sm:text-3xl px-6 py-1.5 rounded-2xl shadow-2xl border-2 border-sky-300 animate-bounce">
            زپلشک! (Missed!)
          </span>
        </div>
      )}

      {/* ================= BEER (نوشیدنی) ANIMATION ================= */}
      {currentEffect.type === 'beer' && (
        <div className="relative flex flex-col items-center justify-center animate-in zoom-in-75 duration-200">
          <div className="relative">
            <span className="text-7xl sm:text-8xl drop-shadow-[0_10px_25px_rgba(0,0,0,0.8)]">
              🍺
            </span>
            <span className="absolute -top-3 -right-3 text-3xl animate-bounce">❤️</span>
            <span className="absolute -top-6 left-2 text-2xl animate-pulse">✨</span>
          </div>
          <span className="mt-3 bg-gradient-to-r from-emerald-600 via-green-500 to-emerald-600 text-white font-black text-xl sm:text-3xl px-6 py-1.5 rounded-2xl shadow-2xl border-2 border-emerald-300 animate-bounce">
            +۱ جان (نوشیدنی سالون)
          </span>
        </div>
      )}

      {/* ================= GATLING (مسلسل) ANIMATION ================= */}
      {currentEffect.type === 'gatling' && (
        <div className="relative flex flex-col items-center justify-center animate-in zoom-in-75 duration-150">
          <div className="flex items-center gap-4">
            <span className="text-6xl sm:text-7xl animate-pulse">🔫</span>
            <span className="text-7xl sm:text-8xl animate-bounce">💥</span>
            <span className="text-6xl sm:text-7xl animate-pulse">🔫</span>
          </div>
          <span className="mt-3 bg-gradient-to-r from-red-600 via-amber-600 to-red-600 text-white font-black text-xl sm:text-3xl px-6 py-1.5 rounded-2xl shadow-2xl border-2 border-amber-400 animate-pulse">
            رگبار مسلسل گاتلینگ!
          </span>
        </div>
      )}

      {/* ================= INDIANS (سرخ‌پوست‌ها) ANIMATION ================= */}
      {currentEffect.type === 'indians' && (
        <div className="relative flex flex-col items-center justify-center animate-in zoom-in-75 duration-200">
          <div className="flex items-center gap-4">
            <span className="text-6xl sm:text-7xl transform -rotate-45 animate-bounce">🏹</span>
            <span className="text-7xl sm:text-8xl animate-pulse">🔥</span>
            <span className="text-6xl sm:text-7xl transform rotate-45 animate-bounce">🏹</span>
          </div>
          <span className="mt-3 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 text-white font-black text-xl sm:text-3xl px-6 py-1.5 rounded-2xl shadow-2xl border-2 border-orange-400 animate-bounce">
            حمله سرخ‌پوست‌ها! (زپلشک بدهید)
          </span>
        </div>
      )}

      {/* ================= DUEL (دوئل) ANIMATION ================= */}
      {currentEffect.type === 'duel' && (
        <div className="relative flex flex-col items-center justify-center animate-in zoom-in-75 duration-200">
          <div className="flex items-center gap-3">
            <span className="text-6xl sm:text-7xl transform rotate-45 animate-pulse">🔫</span>
            <span className="text-5xl sm:text-6xl text-amber-400 animate-ping">⚡</span>
            <span className="text-6xl sm:text-7xl transform -rotate-45 scale-x-[-1] animate-pulse">🔫</span>
          </div>
          <span className="mt-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 text-white font-black text-xl sm:text-3xl px-6 py-1.5 rounded-2xl shadow-2xl border-2 border-purple-300 animate-pulse">
            دوئل تن به تن!
          </span>
        </div>
      )}

      {/* ================= DYNAMITE EXPLODE (دینامیت) ANIMATION ================= */}
      {currentEffect.type === 'dynamite_explode' && (
        <div className="relative flex flex-col items-center justify-center animate-in zoom-in-75 duration-100">
          <div className="flex items-center gap-4">
            <span className="text-7xl sm:text-8xl animate-bounce">🧨</span>
            <span className="text-8xl sm:text-9xl animate-pulse">💥</span>
          </div>
          <span className="mt-3 bg-gradient-to-r from-red-600 via-rose-700 to-red-600 text-white font-black text-2xl sm:text-4xl px-8 py-2 rounded-2xl shadow-2xl border-2 border-red-400 animate-bounce">
            دینامیت منفجر شد! (-۳ جان)
          </span>
        </div>
      )}

      {/* ================= BARREL DEFENSE (بشکه) ANIMATION ================= */}
      {currentEffect.type === 'barrel_success' && (
        <div className="relative flex flex-col items-center justify-center animate-in zoom-in-75 duration-200">
          <div className="relative">
            <span className="text-7xl sm:text-8xl drop-shadow-[0_10px_25px_rgba(0,0,0,0.8)]">
              🛢️
            </span>
            <span className="absolute -top-3 -right-2 text-3xl animate-bounce">❤️</span>
            <span className="absolute -bottom-2 -left-2 text-3xl text-emerald-400 font-black animate-pulse">✓</span>
          </div>
          <span className="mt-3 bg-gradient-to-r from-amber-700 via-yellow-600 to-amber-700 text-white font-black text-xl sm:text-3xl px-6 py-1.5 rounded-2xl shadow-2xl border-2 border-amber-300 animate-bounce">
            بشکه جانت را نجات داد! (کارت دل ♥)
          </span>
        </div>
      )}

      {/* ================= CAT BALOU (کت بالو) ANIMATION ================= */}
      {currentEffect.type === 'cat_balou' && (
        <div className="relative flex flex-col items-center justify-center animate-in zoom-in-75 duration-200">
          <div className="relative flex items-center justify-center">
            <span className="text-6xl sm:text-7xl animate-pulse">🃏</span>
            <span className="absolute text-7xl sm:text-8xl animate-bounce">🔥</span>
          </div>
          <span className="mt-3 bg-gradient-to-r from-orange-600 via-red-600 to-orange-600 text-white font-black text-xl sm:text-3xl px-6 py-1.5 rounded-2xl shadow-2xl border-2 border-orange-300 animate-bounce">
            کارت سوخت! (کت بالو)
          </span>
        </div>
      )}

      {/* ================= PANIC (تهدید / دزدی) ANIMATION ================= */}
      {currentEffect.type === 'panic' && (
        <div className="relative flex flex-col items-center justify-center animate-in zoom-in-75 duration-200">
          <div className="flex items-center gap-3">
            <span className="text-6xl sm:text-7xl animate-pulse">🥷</span>
            <span className="text-5xl sm:text-6xl animate-bounce">💨</span>
            <span className="text-6xl sm:text-7xl animate-bounce">💰</span>
          </div>
          <span className="mt-3 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 text-saloon-950 font-black text-xl sm:text-3xl px-6 py-1.5 rounded-2xl shadow-2xl border-2 border-amber-300 animate-bounce">
            دستبرد سریع! (تهدید)
          </span>
        </div>
      )}
    </div>
  );
};
