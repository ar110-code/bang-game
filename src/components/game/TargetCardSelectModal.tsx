import React from 'react';
import { Card, PublicPlayer, TargetCardChoice } from '@/lib/game-engine/types';
import { CardComponent } from './CardComponent';

interface TargetCardSelectModalProps {
  actionCard: Card; // 'cat_balou' or 'panic'
  targetPlayer: PublicPlayer;
  onConfirm: (choice: TargetCardChoice) => void;
  onCancel: () => void;
}

export const TargetCardSelectModal: React.FC<TargetCardSelectModalProps> = ({
  actionCard,
  targetPlayer,
  onConfirm,
  onCancel,
}) => {
  const isPanic = actionCard.name === 'panic';

  // Gather equipped cards
  const eqItems: {
    key: 'weapon' | 'mustang' | 'appaloosa' | 'barrel' | 'jail' | 'dynamite';
    card: Card;
  }[] = [];

  if (targetPlayer.equipment.weapon) {
    eqItems.push({ key: 'weapon', card: targetPlayer.equipment.weapon });
  }
  if (targetPlayer.equipment.mustang) {
    eqItems.push({ key: 'mustang', card: targetPlayer.equipment.mustang });
  }
  if (targetPlayer.equipment.appaloosa) {
    eqItems.push({ key: 'appaloosa', card: targetPlayer.equipment.appaloosa });
  }
  if (targetPlayer.equipment.barrel) {
    eqItems.push({ key: 'barrel', card: targetPlayer.equipment.barrel });
  }
  if (targetPlayer.equipment.jail) {
    eqItems.push({ key: 'jail', card: targetPlayer.equipment.jail });
  }
  if (targetPlayer.equipment.dynamite) {
    eqItems.push({ key: 'dynamite', card: targetPlayer.equipment.dynamite });
  }

  const handCount = targetPlayer.handCount || 0;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-saloon-900 border-2 border-amber-600/80 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative overflow-hidden text-right">
        {/* Top Accent Strip */}
        <div
          className={`absolute top-0 left-0 w-full h-2.5 ${
            isPanic
              ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600'
              : 'bg-gradient-to-r from-red-600 via-orange-500 to-red-600'
          }`}
        />

        {/* Header */}
        <div className="text-center mb-5">
          <div className="text-3xl mb-1.5">{isPanic ? '💰' : '🔥'}</div>
          <h3 className="text-xl font-black text-amber-300">
            {isPanic ? 'سرقت و دستبرد با کارت «تهدید!»' : 'سوزاندن کارت با «کت بالو»'}
          </h3>
          <p className="text-xs text-zinc-300 mt-1">
            هدف: <span className="font-bold text-amber-200">{targetPlayer.name}</span>{' '}
            {targetPlayer.character && `(${targetPlayer.character.nameFa})`}
          </p>
          <p className="text-xs text-zinc-400 mt-0.5">
            {isPanic
              ? 'کارت تهدید فقط از دست حریف در فاصله ۱ فرسخ دزدیده می‌شود. یکی از کارت‌ها را انتخاب کنید:'
              : 'کارت مورد نظر را برای سوزانده شدن و دور انداختن انتخاب کنید:'}
          </p>
        </div>

        {/* Section 1: In-play Equipment Cards (Only for Cat Balou, NOT Panic) */}
        {!isPanic && (
          <div className="mb-5 bg-saloon-950/70 border border-saloon-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <span>🛡️</span>
                <span>تجهیزات و اسلحه‌ها روی میز (روبروی بازیکن):</span>
              </span>
              <span className="text-[11px] text-zinc-400">
                {eqItems.length > 0 ? `${eqItems.length} کارت در بازی` : 'بدون کارت'}
              </span>
            </div>

            {eqItems.length > 0 ? (
              <div className="flex flex-wrap gap-3 justify-center py-1">
                {eqItems.map((item) => (
                  <div
                    key={item.key}
                    onClick={() =>
                      onConfirm({ type: 'equipment', equipmentKey: item.key })
                    }
                    className="cursor-pointer group flex flex-col items-center hover:scale-105 transition-transform"
                  >
                    <CardComponent card={item.card} size="sm" showDetailsOnSelect={false} />
                    <span className="text-[10px] text-amber-400 font-bold mt-1 bg-saloon-900 border border-amber-600/40 px-2 py-0.5 rounded-full group-hover:bg-amber-600 group-hover:text-black transition-colors">
                      سوزاندن این کارت
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-2 text-xs text-zinc-500">
                این بازیکن هیچ اسلحه یا کارتی روبروی خود مجهز نکرده است.
              </div>
            )}
          </div>
        )}

        {/* Section 2: Face-Down Hand Cards (کارت‌های پشت‌رو) */}
        <div className="mb-6 bg-saloon-950/70 border border-saloon-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <span>🎴</span>
              <span>
                {isPanic
                  ? 'کارت‌های در دست بازیکن (سرقت به پشت و شانسی):'
                  : 'کارت‌های در دست بازیکن (سوزاندن به پشت و شانسی):'}
              </span>
            </span>
            <span className="text-[11px] text-zinc-400">
              {handCount > 0 ? `${handCount} کارت در دست` : 'دست خالی'}
            </span>
          </div>

          {handCount > 0 ? (
            <div className="flex flex-wrap gap-2.5 justify-center py-2">
              {Array.from({ length: handCount }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => onConfirm({ type: 'hand', handIndex: idx })}
                  className="group relative w-[72px] h-[108px] rounded-xl bg-gradient-to-b from-amber-950 via-stone-900 to-amber-950 border-2 border-amber-700/60 hover:border-amber-400 hover:scale-105 active:scale-95 transition-all shadow-md flex flex-col items-center justify-center p-1.5 cursor-pointer text-center shrink-0"
                >
                  {/* Western pattern watermark */}
                  <div className="w-8 h-8 rounded-full border border-amber-600/40 flex items-center justify-center text-sm mb-1 group-hover:bg-amber-600/20 transition-colors">
                    🤠
                  </div>
                  <span className="text-[10px] font-bold text-amber-200">کارت #{idx + 1}</span>
                  <span className="text-[9px] text-zinc-400 group-hover:text-amber-300 mt-1">
                    {isPanic ? 'سرقت' : 'سوزاندن'}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-3 text-xs text-rose-300 font-bold">
              {isPanic
                ? 'این بازیکن هیچ کارتی در دست ندارد (کارت تهدید فقط از دست دزدیده می‌شود)!'
                : 'این بازیکن کارتی در دست ندارد.'}
            </div>
          )}
        </div>

        {/* Cancel Button */}
        <div className="flex justify-center">
          <button
            onClick={onCancel}
            className="w-full sm:w-auto min-w-[160px] bg-stone-800 hover:bg-stone-700 text-zinc-300 hover:text-white font-bold text-xs py-2.5 px-6 rounded-xl border border-stone-600 transition-all active:scale-98 shadow"
          >
            انصراف و بازگشت
          </button>
        </div>
      </div>
    </div>
  );
};
