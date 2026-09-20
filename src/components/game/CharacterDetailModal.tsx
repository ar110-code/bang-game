import React, { useEffect } from 'react';
import { PublicPlayer } from '@/lib/game-engine/types';
import { BulletIndicator } from '../ui/BulletIndicator';

interface CharacterDetailModalProps {
  player: PublicPlayer | null;
  isMe: boolean;
  onClose: () => void;
}

export const CharacterDetailModal: React.FC<CharacterDetailModalProps> = ({
  player,
  isMe,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!player || !player.character) return null;

  const char = player.character;
  const isDead = player.isEliminated;

  const getRoleDetails = () => {
    if (player.role === 'sheriff') {
      return {
        title: 'کلانتر شهر (Sheriff)',
        desc: 'رهبر قانون و امنیت در شهر. باید تمام یاغی‌ها و خائن را از بین ببرد تا شهر به آرامش برسد.',
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/60',
        icon: '⭐',
      };
    }
    if (player.role === 'deputy') {
      return {
        title: 'معاون کلانتر (Deputy)',
        desc: 'حامی وفادار کلانتر. باید به هر قیمتی از کلانتر محافظت کند و یاغی‌ها را نابود سازد.',
        badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/60',
        icon: '🛡️',
      };
    }
    if (player.role === 'outlaw') {
      return {
        title: 'یاغی فراری (Outlaw)',
        desc: 'تیرانداز قانون‌شکن. هدف اصلی او ترور و از پا درآوردن کلانتر است.',
        badgeColor: 'bg-red-500/20 text-red-300 border-red-500/60',
        icon: '💀',
      };
    }
    if (player.role === 'renegade') {
      return {
        title: 'خائن دوچهره (Renegade)',
        desc: 'تک‌رو بی‌رحم. باید تمام بازیکنان دیگر را به جان هم بیندازد و در نهایت در یک دوئل پایانی کلانتر را بکشد.',
        badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/60',
        icon: '🎭',
      };
    }
    return {
      title: 'نقش مخفی و سرّی',
      desc: 'نقش این بازیکن پنهان است و تنها پس از کشته شدن هویت واقعی‌اش بر ملا خواهد شد.',
      badgeColor: 'bg-zinc-800/80 text-zinc-400 border-zinc-700/60',
      icon: '❓',
    };
  };

  const roleInfo = getRoleDetails();

  return (
    <div
      className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative bg-[#1f140e] border-2 border-amber-600/70 rounded-3xl p-5 sm:p-7 max-w-lg w-full text-zinc-100 shadow-[0_20px_60px_rgba(0,0,0,0.95)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Western Background Watermark */}
        <div className="absolute -top-12 -right-12 text-[140px] text-amber-500/5 pointer-events-none font-western">
          BANG
        </div>

        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-amber-700/40 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🤠</span>
            <h2 className="text-base sm:text-lg font-black text-amber-400">
              شناسنامه کاراکتر و توانایی
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-saloon-900/80 hover:bg-saloon-800 border border-saloon-700 text-zinc-400 hover:text-white flex items-center justify-center text-sm transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Character Title & Name */}
        <div className="flex items-center gap-3.5 mb-4 bg-saloon-950/70 p-3 rounded-2xl border border-saloon-800/80">
          <div className="w-20 sm:w-24 aspect-[2/3] rounded-2xl bg-saloon-900 border-2 border-amber-600/70 flex items-center justify-center shadow-lg flex-shrink-0 overflow-hidden">
            {isDead ? (
              <span className="text-2xl">💀</span>
            ) : (
              <img
                src={`/assets/characters/${char.name}.jpg`}
                alt={char.nameFa}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                  if (e.currentTarget.parentElement) {
                    e.currentTarget.parentElement.innerText = player.isBot ? '🤖' : '🤠';
                  }
                }}
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-black text-amber-300">
                {char.nameFa}
              </h3>
              {isMe && (
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/50 px-2 py-0.2 rounded-full text-[10px] font-bold">
                  (شما)
                </span>
              )}
              {isDead && (
                <span className="bg-red-950/80 text-red-400 border border-red-800 px-2 py-0.2 rounded-full text-[10px] font-bold">
                  کشته شده
                </span>
              )}
            </div>
            <p className="text-xs text-amber-500/90 font-bold">{char.titleFa}</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              بازیکن: <span className="text-zinc-200 font-bold">{player.name}</span>
            </p>
          </div>
        </div>

        {/* Health & Hand Status */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          <div className="bg-saloon-950/60 border border-saloon-800/60 p-2.5 rounded-2xl flex flex-col items-center justify-center text-center">
            <span className="text-[11px] text-zinc-400 mb-1">میزان جان (HP)</span>
            <BulletIndicator currentHp={player.currentHp} maxHp={player.maxHp} size="md" />
            <span className="text-xs font-black text-amber-400 mt-1">
              {player.currentHp} از {player.maxHp} جان
            </span>
          </div>

          <div className="bg-saloon-950/60 border border-saloon-800/60 p-2.5 rounded-2xl flex flex-col items-center justify-center text-center">
            <span className="text-[11px] text-zinc-400 mb-1">کارت‌های دست</span>
            <div className="flex items-center gap-1.5 text-amber-300 font-black text-base my-0.5">
              <span>🃏</span>
              <span>{player.handCount}</span>
            </div>
            <span className="text-[10px] text-zinc-400">
              {player.handCount > player.currentHp
                ? '⚠️ نیازمند دور ریختن کارت در پایان نوبت'
                : 'در حد مجاز جان'}
            </span>
          </div>
        </div>

        {/* Ability Box (Feature Highlight) */}
        <div className="bg-gradient-to-br from-amber-950/50 via-saloon-900/60 to-amber-950/40 border border-amber-500/50 p-3.5 rounded-2xl mb-4 shadow-lg">
          <div className="flex items-center gap-1.5 mb-1.5 text-amber-300 font-black text-xs sm:text-sm">
            <span>⚡</span>
            <span>قابلیت و نیروی ویژه کاراکتر:</span>
          </div>
          <p className="text-xs sm:text-sm text-amber-100/90 leading-relaxed text-justify font-medium">
            {char.descFa}
          </p>
        </div>

        {/* Equipment Badges / Items */}
        <div className="bg-saloon-950/60 border border-saloon-800/60 p-3 rounded-2xl mb-4">
          <div className="text-[11px] font-bold text-zinc-400 mb-2 flex items-center gap-1">
            <span>🎒</span>
            <span>تجهیزات مجهز شده روبروی بازیکن:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {player.equipment.weapon && (
              <div className="bg-gradient-to-r from-amber-950/90 via-saloon-900 to-amber-950/90 text-amber-200 border-2 border-amber-400/90 shadow-md px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center justify-between gap-2 w-full">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">🔫</span>
                  <span className="font-black text-amber-300">
                    اسلحه: {player.equipment.weapon.titleFa}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="bg-amber-400 text-saloon-950 px-1.5 py-0.5 rounded text-[10px] font-black">
                    برد شلیک: {player.equipment.weapon.range} فرسنگ
                  </span>
                  {player.equipment.weapon.name === 'volcanic' && (
                    <span className="bg-red-600 text-white px-1.5 py-0.5 rounded text-[10px] font-black animate-pulse">
                      ⚡ تیر نامحدود
                    </span>
                  )}
                </div>
              </div>
            )}
            {player.equipment.barrel && (
              <div className="bg-gradient-to-r from-sky-950/90 via-blue-900 to-sky-950/90 text-sky-200 border-2 border-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.4)] px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center justify-between gap-2 w-full ring-1 ring-sky-300/40">
                <div className="flex items-center gap-1.5">
                  <span className="text-base text-sky-300">🛡️</span>
                  <span className="font-black text-sky-200">
                    بشکه دفاعی (Barrel)
                  </span>
                </div>
                <span className="bg-sky-500 text-white px-2 py-0.5 rounded text-[10px] font-black shadow">
                  تست شانس دل ♥ (دفاع خودکار در برابر بنگ)
                </span>
              </div>
            )}
            {player.equipment.jail && (
              <span className="bg-red-950/80 text-red-300 border border-red-700 px-2 py-1 rounded-xl text-xs font-bold animate-pulse flex items-center gap-1">
                <span>🔒</span>
                <span>زندانی قانون</span>
              </span>
            )}
            {player.equipment.dynamite && (
              <span className="bg-orange-950/80 text-orange-300 border border-orange-600 px-2 py-1 rounded-xl text-xs font-bold flex items-center gap-1">
                <span>🧨</span>
                <span>دینامیت آماده انفجار</span>
              </span>
            )}
            {!player.equipment.weapon &&
              !player.equipment.mustang &&
              !player.equipment.appaloosa &&
              !player.equipment.barrel &&
              !player.equipment.jail &&
              !player.equipment.dynamite && (
                <span className="text-xs text-zinc-500 italic py-0.5">
                  هیچ وسیله یا سلاحی فعال نیست (اسلحه پیش‌فرض: کلت با برد ۱).
                </span>
              )}
          </div>
        </div>

        {/* Role Identity Box */}
        <div
          className={`p-3 rounded-2xl border mb-5 flex items-start gap-3 ${roleInfo.badgeColor}`}
        >
          {player.role !== 'hidden' ? (
            <div className="w-14 aspect-[2/3] rounded-xl overflow-hidden border border-current shadow-sm flex-shrink-0 bg-saloon-950 flex items-center justify-center">
              <img
                src={`/assets/roles/${player.role}.jpg`}
                alt={roleInfo.title}
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          ) : (
            <span className="text-xl flex-shrink-0">{roleInfo.icon}</span>
          )}
          <div>
            <div className="text-xs font-black mb-0.5">{roleInfo.title}</div>
            <p className="text-[11px] leading-relaxed opacity-90">{roleInfo.desc}</p>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full bg-saloon-800 hover:bg-saloon-700 active:scale-95 text-amber-200 font-black text-xs sm:text-sm py-2.5 rounded-xl border border-amber-600/50 transition-all shadow-md flex items-center justify-center gap-1.5"
        >
          <span>متوجه شدم (بستن)</span>
        </button>
      </div>
    </div>
  );
};
