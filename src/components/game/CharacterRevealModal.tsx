import React from 'react';
import { Player, Role } from '@/lib/game-engine/types';
import { BulletIndicator } from '../ui/BulletIndicator';

interface CharacterRevealModalProps {
  myPlayer: Player;
  revealCountdown?: number | null;
  onClose: () => void;
}

export const CharacterRevealModal: React.FC<CharacterRevealModalProps> = ({
  myPlayer,
  revealCountdown,
  onClose,
}) => {
  const role = myPlayer.role;
  const character = myPlayer.character;

  const getRoleDetails = (role: Role) => {
    switch (role) {
      case 'sheriff':
        return {
          title: '⭐ کلانتر شهر (Sheriff)',
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/60',
          goal: 'برقراری نظم و قانون در شهر با حذف تمام یاغی‌ها و خائن.',
          note: 'نقش شما برای همه آشکار است و ۱ جان اضافه نسبت به کاراکترتان دریافت کرده‌اید.',
          isPublic: true,
        };
      case 'deputy':
        return {
          title: '🛡️ معاون کلانتر (Deputy)',
          badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/60',
          goal: 'محافظت از کلانتر و کمک به او برای از بین بردن تمام یاغی‌ها و خائن.',
          note: 'این نقش محرمانه است. اگر کلانتر اشتباهاً شما را بکشد، تمام کارت‌هایش مصادره می‌شود!',
          isPublic: false,
        };
      case 'outlaw':
        return {
          title: '💀 یاغی سرکش (Outlaw)',
          badgeColor: 'bg-red-500/20 text-red-300 border-red-500/60',
          goal: 'کشتن کلانتر! به محض مرگ کلانتر، تیم یاغی‌ها فوراً برنده بازی می‌شود.',
          note: 'این نقش محرمانه است. هر بازیکنی که یاغی را بکشد، ۳ کارت پاداش می‌گیرد.',
          isPublic: false,
        };
      case 'renegade':
        return {
          title: '👑 خائن و فرصت‌طلب (Renegade)',
          badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/60',
          goal: 'تنها برنده شدن! باید آخرین بازمانده بازی باشید و در دوئل نهایی کلانتر را بکشید.',
          note: 'این نقش محرمانه است. تا یاغی‌ها زنده هستند با کلانتر مدارا کنید تا حذف نشود!',
          isPublic: false,
        };
    }
  };

  const roleInfo = getRoleDetails(role);

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-saloon-900 border-2 border-amber-600/80 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative overflow-hidden text-right">
        {/* Background Saloon Watermark */}
        <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-2 bg-saloon-950 border border-saloon-700 px-3.5 py-1 rounded-full text-xs font-bold text-amber-300 mb-2">
            <span>📜</span>
            <span>شناسنامه وسترن شما</span>
          </div>
          <h2 className="text-2xl font-black text-amber-200 font-western">
            شخصیت و مأموریت محرمانه
          </h2>
        </div>

        {/* Countdown Timer Banner */}
        {typeof revealCountdown === 'number' && revealCountdown > 0 && (
          <div className="mb-4 bg-gradient-to-r from-amber-950/90 via-saloon-900 to-amber-950/90 border-2 border-amber-500/70 rounded-2xl p-3 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl animate-spin" style={{ animationDuration: '4s' }}>
                ⏳
              </span>
              <div className="text-right">
                <div className="text-xs font-black text-amber-300">
                  مهلت بررسی نقش و مشخصات کاراکتر
                </div>
                <div className="text-[11px] text-zinc-300 font-medium">
                  بازی پس از اتمام تایمر برای همه آغاز می‌شود
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center bg-saloon-950 border-2 border-amber-400 w-12 h-12 rounded-2xl shadow-inner">
              <span className="text-lg font-black text-amber-300 leading-none">
                {revealCountdown}
              </span>
              <span className="text-[9px] text-amber-400/80 font-bold">ثانیه</span>
            </div>
          </div>
        )}

        {/* Section 1: Role Card */}
        <div className="bg-saloon-950/80 border border-saloon-700 rounded-2xl p-4 mb-4 shadow-inner flex gap-3.5 items-center">
          <div className="w-20 sm:w-24 aspect-[2/3] rounded-2xl overflow-hidden border-2 border-amber-500/70 shadow-md flex-shrink-0 bg-saloon-900 flex items-center justify-center">
            <img
              src={`/assets/roles/${role}.jpg`}
              alt={roleInfo.title}
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-zinc-400">نقش شما در بازی:</span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-black border ${roleInfo.badgeColor}`}
              >
                {roleInfo.title}
              </span>
            </div>
            <p className="text-xs text-zinc-200 font-medium leading-relaxed mb-1.5">
              🎯 <span className="font-bold text-amber-200">هدف اصلی:</span> {roleInfo.goal}
            </p>
            <div className="text-[11px] text-zinc-400 bg-saloon-900/60 p-2 rounded-xl border border-saloon-800">
              {roleInfo.note}
            </div>
          </div>
        </div>

        {/* Section 2: Character Card & Ability */}
        {character && (
          <div className="bg-saloon-950/80 border border-saloon-700 rounded-2xl p-4 mb-5 shadow-inner">
            <div className="flex items-center gap-3.5 mb-3 border-b border-saloon-800 pb-2.5">
              <div className="w-20 sm:w-24 aspect-[2/3] rounded-2xl overflow-hidden border-2 border-amber-500/70 shadow-md flex items-center justify-center bg-saloon-900 flex-shrink-0">
                <img
                  src={`/assets/characters/${character.name}.jpg`}
                  alt={character.nameFa}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                    if (e.currentTarget.parentElement) {
                      e.currentTarget.parentElement.innerText = '🤠';
                      e.currentTarget.parentElement.className =
                        'w-14 h-14 rounded-2xl bg-amber-800 border-2 border-amber-500 flex items-center justify-center text-3xl shadow flex-shrink-0';
                    }
                  }}
                />
              </div>
              <div className="flex-1">
                <div className="text-lg font-black text-amber-300">
                  {character.nameFa}
                </div>
                <div className="text-xs text-zinc-400 font-medium">
                  {character.titleFa}
                </div>
              </div>
            </div>

            {/* Special Ability Box */}
            <div className="bg-gradient-to-r from-amber-950/60 to-saloon-900/80 border border-amber-600/40 rounded-xl p-3 mb-3">
              <div className="text-xs font-black text-amber-400 mb-1 flex items-center gap-1.5">
                <span>⚡</span>
                <span>قابلیت ویژه کاراکتر:</span>
              </div>
              <p className="text-xs text-zinc-100 font-medium leading-relaxed">
                {character.descFa}
              </p>
            </div>

            {/* Health (Bullets) Display */}
            <div className="flex items-center justify-between bg-saloon-900/50 p-2.5 rounded-xl border border-saloon-800">
              <div className="text-xs font-bold text-zinc-300">
                میزان جان (گلوله‌ها):
              </div>
              <div className="flex items-center gap-2">
                <BulletIndicator currentHp={myPlayer.currentHp} maxHp={myPlayer.maxHp} size="md" />
                <span className="text-xs font-black text-amber-400">
                  {myPlayer.maxHp} جان
                </span>
              </div>
            </div>
            <p className="text-[10px] text-zinc-400 mt-1.5 px-1">
              * حداکثر تعداد کارت‌هایی که در پایان نوبت می‌توانید در دست نگه دارید برابر با جان فعلی شماست.
            </p>
          </div>
        )}

        {/* Enter / Acknowledge Button */}
        <button
          onClick={onClose}
          className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-saloon-950 font-black text-sm py-3.5 px-6 rounded-2xl shadow-xl border border-amber-300 transition-all active:scale-98 flex items-center justify-center gap-2"
        >
          {typeof revealCountdown === 'number' && revealCountdown > 0 ? (
            <span>متوجه شدم (شروع رسمی تا {revealCountdown} ثانیه دیگر) 🤠</span>
          ) : (
            <span>آماده نبرد هستم! ورود به سالون 🤠</span>
          )}
        </button>
      </div>
    </div>
  );
};
