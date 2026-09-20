import React, { useEffect, useState } from 'react';
import { ActionEffect } from '@/lib/game-engine/types';
import { soundEngine } from '@/lib/audio/soundEffects';

interface ActionAnimationOverlayProps {
  effect: ActionEffect | null;
}

export const ActionAnimationOverlay: React.FC<ActionAnimationOverlayProps> = ({ effect }) => {
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

  return (
    <div
      onClick={() => setIsVisible(false)}
      className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center overflow-hidden animate-in fade-in duration-150"
    >
      {/* 1. Action Banner at Top */}
      <div className="absolute top-16 sm:top-20 z-50 flex flex-col items-center animate-in slide-in-from-top-6 duration-300">
        <div className="bg-saloon-950/95 border-2 border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.5)] px-4 sm:px-6 py-2 rounded-2xl flex items-center gap-2.5 backdrop-blur-md">
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
                <span className="text-purple-300 font-black text-sm sm:text-base">
                  دوئل تن‌به‌تن مرگبار!
                </span>
                <span className="text-zinc-300 text-xs sm:text-sm block">
                  {currentEffect.sourcePlayerName} در برابر {currentEffect.targetPlayerName}
                </span>
              </div>
            </>
          )}

          {currentEffect.type === 'dynamite_explode' && (
            <>
              <span className="text-2xl sm:text-3xl animate-pulse">🧨</span>
              <div className="text-right">
                <span className="text-red-500 font-black text-sm sm:text-base">
                  بومممم! دینامیت منفجر شد!
                </span>
                <span className="text-zinc-200 text-xs sm:text-sm block">
                  ۳ جان از {currentEffect.targetPlayerName} کم شد!
                </span>
              </div>
            </>
          )}

          {currentEffect.type === 'barrel_success' && (
            <>
              <span className="text-2xl sm:text-3xl">🛡️</span>
              <div className="text-right">
                <span className="text-sky-300 font-black text-sm sm:text-base">
                  دفاع موفق با بشکه!
                </span>
                <span className="text-amber-300 text-xs sm:text-sm mr-1">
                  کارت دل ♥ رو شد و گلوله به خطا رفت!
                </span>
              </div>
            </>
          )}

          {currentEffect.type === 'cat_balou' && (
            <>
              <span className="text-2xl sm:text-3xl">🔥</span>
              <div className="text-right">
                <span className="text-orange-400 font-black text-sm sm:text-base">
                  کت بالو!
                </span>
                <span className="text-zinc-200 text-xs sm:text-sm mr-1">
                  کارت {currentEffect.targetPlayerName} به آتش کشیده شد!
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
      {/* ================= BANG! REVOLVER SHOOTING ANIMATION ================= */}
      {currentEffect.type === 'bang' && (
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Subtle Flash Overlay */}
          <div className="absolute inset-0 bg-amber-500/15 animate-ping duration-300 pointer-events-none" />

          {/* Western Colt .45 Revolver Assembly */}
          <div className="relative flex items-center justify-center translate-y-12 sm:translate-y-8">
            {/* The Revolver SVG */}
            <svg
              className="w-64 h-64 sm:w-84 sm:h-84 drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)] -rotate-12"
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
              {/* Grip Woodgrain Lines */}
              <path d="M 55 170 C 65 190 75 220 85 225" stroke="#7a3b1e" strokeWidth="2" />
              <path d="M 75 160 C 85 185 95 210 100 215" stroke="#7a3b1e" strokeWidth="2" />
              {/* Brass Grip Medallion */}
              <circle cx="80" cy="180" r="5" fill="#f59e0b" stroke="#78350f" strokeWidth="1.5" />

              {/* Trigger Guard & Trigger */}
              <path
                d="M 125 140 C 125 165 155 165 165 140"
                stroke="#475569"
                strokeWidth="5"
                fill="none"
              />
              <path
                d="M 140 140 C 138 152 145 155 148 152"
                stroke="#cbd5e1"
                strokeWidth="3.5"
                fill="none"
              />

              {/* Revolver Frame / Receiver */}
              <path
                d="M 105 110 L 125 140 L 180 140 L 180 110 L 175 95 L 120 95 Z"
                fill="#334155"
                stroke="#1e293b"
                strokeWidth="4"
              />

              {/* Revolver Cylinder */}
              <rect
                x="170"
                y="92"
                width="60"
                height="45"
                rx="6"
                fill="#1e293b"
                stroke="#0f172a"
                strokeWidth="4"
              />
              {/* Cylinder Flutes */}
              <line x1="170" y1="102" x2="230" y2="102" stroke="#475569" strokeWidth="3" />
              <line x1="170" y1="115" x2="230" y2="115" stroke="#475569" strokeWidth="3" />
              <line x1="170" y1="126" x2="230" y2="126" stroke="#475569" strokeWidth="3" />

              {/* Hammer (Cocked Back) */}
              <path
                d="M 105 105 C 95 90 90 85 85 92 C 85 98 98 110 105 110 Z"
                fill="#475569"
                stroke="#1e293b"
                strokeWidth="3"
              />

              {/* Long Octagonal Barrel */}
              <path
                d="M 230 100 L 360 100 L 360 122 L 230 122 Z"
                fill="#334155"
                stroke="#1e293b"
                strokeWidth="4"
              />
              {/* Barrel Highlight */}
              <line x1="230" y1="105" x2="360" y2="105" stroke="#64748b" strokeWidth="2" />
              {/* Front Sight Bead */}
              <polygon points="350,100 355,92 360,100" fill="#cbd5e1" stroke="#1e293b" strokeWidth="1.5" />
              {/* Ejector Rod Housing */}
              <rect x="230" y="122" width="90" height="8" rx="2" fill="#1e293b" />
            </svg>

            {/* Explosive Muzzle Flash at the Barrel End */}
            <div className="absolute -top-8 right-0 sm:right-4 pointer-events-none animate-pulse">
              <svg className="w-36 h-36 sm:w-48 sm:h-48" viewBox="0 0 100 100">
                <polygon
                  points="50,10 65,40 95,50 65,60 50,90 35,60 5,50 35,40"
                  fill="url(#fireGradient)"
                />
                <polygon
                  points="50,20 60,42 85,50 60,58 50,80 40,58 15,50 40,42"
                  fill="#fef08a"
                />
                <circle cx="50" cy="50" r="16" fill="#ffffff" />
                <defs>
                  <radialGradient id="fireGradient">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="30%" stopColor="#fef08a" />
                    <stop offset="60%" stopColor="#f97316" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                  </radialGradient>
                </defs>
              </svg>
            </div>

            {/* Glowing Golden Tracer Bullet Streak */}
            <div className="absolute top-10 left-[85%] w-72 sm:w-96 h-3 bg-gradient-to-r from-amber-300 via-yellow-400 to-transparent rounded-full shadow-[0_0_20px_#f59e0b] pointer-events-none" />

            {/* Smoke Puff Clouds */}
            <div className="absolute -top-12 right-0 flex gap-2 pointer-events-none">
              <div className="w-12 h-12 rounded-full bg-white/40 blur-md animate-ping" />
              <div className="w-16 h-16 rounded-full bg-zinc-300/30 blur-lg animate-pulse" />
            </div>
          </div>
        </div>
      )}

      {/* ================= MISSED! (زپلشک) ANIMATION ================= */}
      {currentEffect.type === 'missed' && (
        <div className="relative flex flex-col items-center justify-center animate-in zoom-in-75 duration-200">
          <div className="relative">
            <span className="text-8xl sm:text-9xl drop-shadow-[0_10px_25px_rgba(0,0,0,0.8)]">
              🛡️
            </span>
            {/* Spark ricochet sparks */}
            <div className="absolute top-4 right-2 text-4xl animate-ping">✨</div>
            <div className="absolute bottom-4 left-2 text-3xl animate-ping duration-300">💥</div>
          </div>
          <span className="mt-4 bg-gradient-to-r from-sky-500 via-blue-600 to-sky-500 text-white font-black text-2xl sm:text-4xl px-8 py-2 rounded-2xl shadow-2xl border-2 border-sky-300 animate-bounce">
            زپلشک! (Missed!)
          </span>
        </div>
      )}

      {/* ================= BEER (نوشیدنی) ANIMATION ================= */}
      {currentEffect.type === 'beer' && (
        <div className="relative flex flex-col items-center justify-center animate-in zoom-in-50 duration-200">
          <div className="relative">
            <span className="text-8xl sm:text-9xl animate-bounce drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)]">
              🍺
            </span>
            {/* Golden Hearts Rising */}
            <div className="absolute -top-6 -right-4 text-4xl text-red-500 animate-pulse">❤️</div>
            <div className="absolute -top-12 left-2 text-3xl text-red-500 animate-bounce">❤️</div>
          </div>
          <span className="mt-4 bg-gradient-to-r from-emerald-600 via-green-500 to-emerald-600 text-white font-black text-xl sm:text-3xl px-6 py-2 rounded-2xl shadow-2xl border-2 border-emerald-300 flex items-center gap-2">
            <span>✨</span>
            <span>بازیابی ۱ واحد جان (+1 HP)</span>
            <span>✨</span>
          </span>
        </div>
      )}

      {/* ================= GATLING (مسلسل) ANIMATION ================= */}
      {currentEffect.type === 'gatling' && (
        <div className="relative flex flex-col items-center justify-center">
          <div className="relative flex items-center gap-2 animate-pulse">
            <span className="text-8xl sm:text-9xl drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)]">
              💥
            </span>
          </div>
          <span className="mt-4 bg-gradient-to-r from-red-600 via-orange-600 to-red-600 text-white font-black text-xl sm:text-3xl px-8 py-2 rounded-2xl shadow-2xl border-2 border-amber-400 animate-pulse">
            ⚡ رگبار مسلسل گاتلینگ به تمام بازیکنان!
          </span>
        </div>
      )}

      {/* ================= INDIANS (سرخ‌پوست‌ها) ANIMATION ================= */}
      {currentEffect.type === 'indians' && (
        <div className="relative flex flex-col items-center justify-center animate-in zoom-in-90 duration-200">
          <div className="flex gap-4 items-center">
            <span className="text-6xl sm:text-8xl animate-bounce">🏹</span>
            <span className="text-6xl sm:text-8xl animate-pulse">🔥</span>
            <span className="text-6xl sm:text-8xl animate-bounce">🏹</span>
          </div>
          <span className="mt-4 bg-gradient-to-r from-amber-700 via-orange-700 to-amber-800 text-white font-black text-xl sm:text-3xl px-8 py-2 rounded-2xl shadow-2xl border-2 border-amber-400">
            حمله سرخ‌پوست‌ها! شلیک بنگ برای دفاع لازم است!
          </span>
        </div>
      )}

      {/* ================= DUEL (دوئل) ANIMATION ================= */}
      {currentEffect.type === 'duel' && (
        <div className="relative flex flex-col items-center justify-center animate-in zoom-in-75 duration-200">
          <div className="flex items-center gap-6">
            <span className="text-7xl sm:text-9xl rotate-45">🔫</span>
            <span className="text-5xl sm:text-7xl font-black text-amber-400 animate-ping">VS</span>
            <span className="text-7xl sm:text-9xl -rotate-45 scale-x-[-1]">🔫</span>
          </div>
          <span className="mt-4 bg-gradient-to-r from-purple-800 via-indigo-800 to-purple-800 text-white font-black text-xl sm:text-3xl px-8 py-2 rounded-2xl shadow-2xl border-2 border-purple-400">
            دوئل مرگبار غرب وحشی!
          </span>
        </div>
      )}

      {/* ================= DYNAMITE (دینامیت) ANIMATION ================= */}
      {currentEffect.type === 'dynamite_explode' && (
        <div className="relative flex flex-col items-center justify-center animate-in zoom-in-50 duration-200">
          <div className="relative flex items-center justify-center">
            <span className="text-8xl sm:text-9xl animate-ping">💥</span>
            <span className="absolute text-6xl sm:text-8xl">🧨</span>
          </div>
          <span className="mt-6 bg-gradient-to-r from-red-700 via-red-600 to-red-700 text-white font-black text-xl sm:text-3xl px-8 py-2 rounded-2xl shadow-2xl border-2 border-amber-400 animate-bounce">
            💥 دینامیت منفجر شد (-۳ جان)!
          </span>
        </div>
      )}

      {/* ================= BARREL (بشکه) ANIMATION ================= */}
      {currentEffect.type === 'barrel_success' && (
        <div className="relative flex flex-col items-center justify-center animate-in zoom-in-75 duration-200">
          <div className="relative">
            <span className="text-8xl sm:text-9xl drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)]">
              🛡️
            </span>
            <span className="absolute -top-4 -right-4 text-5xl text-red-500 animate-bounce">
              ♥
            </span>
          </div>
          <span className="mt-4 bg-gradient-to-r from-sky-600 via-blue-600 to-sky-600 text-white font-black text-xl sm:text-3xl px-8 py-2 rounded-2xl shadow-2xl border-2 border-sky-300">
            دفاع موفق بشکه! کارت دل ♥ رو شد!
          </span>
        </div>
      )}

      {/* ================= CAT BALOU (کت بالو) ANIMATION ================= */}
      {currentEffect.type === 'cat_balou' && (
        <div className="relative flex flex-col items-center justify-center animate-in zoom-in-75 duration-200">
          <div className="relative">
            <span className="text-8xl sm:text-9xl drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)]">
              🔥
            </span>
            <span className="absolute inset-0 text-5xl flex items-center justify-center animate-spin duration-1000">
              🎴
            </span>
          </div>
          <span className="mt-4 bg-gradient-to-r from-orange-600 via-red-600 to-orange-600 text-white font-black text-xl sm:text-3xl px-8 py-2 rounded-2xl shadow-2xl border-2 border-orange-400">
            کارت با کت بالو به خاکستر تبدیل شد!
          </span>
        </div>
      )}
    </div>
  );
};
