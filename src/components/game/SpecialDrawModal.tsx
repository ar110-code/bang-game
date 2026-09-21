import React, { useState } from 'react';
import { SpecialDrawPrompt, PublicPlayer, Card } from '@/lib/game-engine/types';
import { CardComponent } from './CardComponent';

interface SpecialDrawModalProps {
  prompt: SpecialDrawPrompt;
  topDiscard: Card | null;
  opponents: PublicPlayer[];
  onResolve: (choice: {
    type: 'deck' | 'discard' | 'player' | 'kit';
    targetPlayerId?: string;
    kitSelectedIndices?: number[];
  }) => void;
}

export const SpecialDrawModal: React.FC<SpecialDrawModalProps> = ({
  prompt,
  topDiscard,
  opponents,
  onResolve,
}) => {
  // State for Jesse Jones target selection
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);

  // State for Kit Carlson: indices of the 2 chosen cards out of 3
  const [selectedKitIndices, setSelectedKitIndices] = useState<number[]>([]);

  // Filter opponents who have at least 1 card in hand
  const validStealTargets = opponents.filter((p) => !p.isEliminated && p.handCount > 0);

  const toggleKitIndex = (index: number) => {
    if (selectedKitIndices.includes(index)) {
      setSelectedKitIndices(selectedKitIndices.filter((i) => i !== index));
    } else {
      if (selectedKitIndices.length < 2) {
        setSelectedKitIndices([...selectedKitIndices, index]);
      } else {
        // Replace the oldest selection
        setSelectedKitIndices([selectedKitIndices[1], index]);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-300">
      <div className="relative bg-[#1f140e] border-2 border-amber-500 rounded-3xl p-5 sm:p-7 max-w-xl w-full text-zinc-100 shadow-[0_0_80px_rgba(245,158,11,0.25)] overflow-hidden">
        {/* Western Header */}
        <div className="text-center mb-5 border-b border-amber-700/40 pb-4">
          <div className="text-3xl mb-1">🤠</div>
          <h2 className="text-lg sm:text-xl font-black text-amber-300 font-western tracking-wide">
            فاز کارت‌کشی ویژه
          </h2>
          <p className="text-xs text-zinc-300 mt-1 font-medium">
            توانایی کاراکتر شما فعال شده است. شیوه کارت‌کشی خود را مشخص کنید:
          </p>
        </div>

        {/* 1. PEDRO RAMIREZ UI */}
        {prompt.characterName === 'pedro_ramirez' && (
          <div className="space-y-4">
            <div className="bg-saloon-950/70 border border-amber-600/40 p-3 rounded-2xl text-xs text-amber-200/90 leading-relaxed text-center">
              ⭐ <strong className="text-amber-400">پدرو رامیرز (Pedro Ramirez):</strong> می‌توانید کارت اول خود را از بالای کارت‌های سوخته بردارید و کارت دوم را از مخزن بکشید، یا هر دو کارت را عادی از مخزن بکشید.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              {/* Option A: Take from Discard */}
              {topDiscard ? (
                <div className="bg-saloon-900/80 border-2 border-amber-500/80 rounded-2xl p-4 flex flex-col items-center justify-between text-center hover:bg-saloon-850 transition-all shadow-md group">
                  <div className="text-xs font-bold text-amber-300 mb-2">
                    گزینه ۱: کارت سوخته وسط میز
                  </div>
                  <div className="my-2 transform group-hover:scale-105 transition-transform">
                    <CardComponent card={topDiscard} size="sm" isPlayable={false} showDetailsOnSelect={false} />
                  </div>
                  <div className="text-[11px] text-zinc-300 mb-3">
                    کارت اول: <strong className="text-amber-300">{topDiscard.titleFa}</strong>
                    <br />
                    کارت دوم: از مخزن کارت‌ها
                  </div>
                  <button
                    onClick={() => onResolve({ type: 'discard' })}
                    className="w-full bg-amber-600 hover:bg-amber-500 active:scale-95 text-saloon-950 font-black text-xs py-2.5 rounded-xl border border-amber-400 transition-all shadow"
                  >
                    برداشتن کارت سوخته
                  </button>
                </div>
              ) : (
                <div className="bg-saloon-950/40 border border-zinc-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center opacity-60">
                  <span className="text-2xl mb-1">🚫</span>
                  <span className="text-xs text-zinc-400">کارت سوخته‌ای در دسترس نیست</span>
                </div>
              )}

              {/* Option B: Standard Deck Draw */}
              <div className="bg-saloon-900/80 border border-saloon-700 rounded-2xl p-4 flex flex-col items-center justify-between text-center hover:bg-saloon-850 hover:border-amber-600/60 transition-all shadow-md">
                <div className="text-xs font-bold text-zinc-200 mb-2">
                  گزینه ۲: کارت‌کشی عادی
                </div>
                <div className="my-2 flex items-center justify-center gap-2">
                  <div className="w-[72px] h-[108px] bg-gradient-to-b from-amber-950 to-saloon-950 border-2 border-amber-600/70 rounded-xl flex flex-col items-center justify-center shadow-lg -rotate-2">
                    <span className="text-xl mb-1">🃏</span>
                    <span className="text-[9px] font-bold text-amber-200">مخزن ۱</span>
                  </div>
                  <div className="w-[72px] h-[108px] bg-gradient-to-b from-amber-950 to-saloon-950 border-2 border-amber-600/70 rounded-xl flex flex-col items-center justify-center shadow-lg rotate-2">
                    <span className="text-xl mb-1">🃏</span>
                    <span className="text-[9px] font-bold text-amber-200">مخزن ۲</span>
                  </div>
                </div>
                <div className="text-[11px] text-zinc-300 mb-3">
                  هر ۲ کارت به صورت تصادفی از مخزن رو خواهند شد.
                </div>
                <button
                  onClick={() => onResolve({ type: 'deck' })}
                  className="w-full bg-saloon-800 hover:bg-saloon-700 active:scale-95 text-zinc-200 font-bold text-xs py-2.5 rounded-xl border border-saloon-600 transition-all"
                >
                  کشیدن ۲ کارت از مخزن
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. JESSE JONES UI */}
        {prompt.characterName === 'jesse_jones' && (
          <div className="space-y-4">
            <div className="bg-saloon-950/70 border border-amber-600/40 p-3 rounded-2xl text-xs text-amber-200/90 leading-relaxed text-center">
              ⭐ <strong className="text-amber-400">جسی جونز (Jesse Jones):</strong> می‌توانید کارت اول خود را تصادفی از دست یکی از حریفان بدزدید و کارت دوم را از مخزن بکشید، یا هر دو را از مخزن بردارید.
            </div>

            {/* Steal targets list */}
            <div>
              <div className="text-xs font-bold text-zinc-300 mb-2 flex items-center justify-between">
                <span>انتخاب بازیکن هدف برای سرقت کارت اول:</span>
                {validStealTargets.length === 0 && (
                  <span className="text-red-400 text-[11px]">(هیچ حریفی کارت در دست ندارد)</span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3 max-h-48 overflow-y-auto p-1">
                {validStealTargets.map((target) => {
                  const isSelected = selectedTargetId === target.id;
                  return (
                    <button
                      key={target.id}
                      onClick={() => setSelectedTargetId(target.id)}
                      className={`p-2 rounded-xl border text-right flex items-center gap-2 transition-all ${
                        isSelected
                          ? 'bg-amber-600/30 border-amber-400 ring-2 ring-amber-400 text-amber-200 scale-102'
                          : 'bg-saloon-900/80 border-saloon-700 text-zinc-300 hover:border-amber-600/50'
                      }`}
                    >
                      <span className="text-base">{target.isBot ? '🤖' : '🤠'}</span>
                      <div className="truncate flex-1">
                        <div className="text-xs font-bold truncate">{target.name}</div>
                        <div className="text-[10px] text-zinc-400">🃏 {target.handCount} کارت</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Steal Button */}
              {validStealTargets.length > 0 && (
                <button
                  disabled={!selectedTargetId}
                  onClick={() => {
                    if (selectedTargetId) {
                      onResolve({ type: 'player', targetPlayerId: selectedTargetId });
                    }
                  }}
                  className={`w-full py-2.5 rounded-xl font-black text-xs transition-all mb-2 flex items-center justify-center gap-1.5 shadow ${
                    selectedTargetId
                      ? 'bg-amber-600 hover:bg-amber-500 text-saloon-950 border border-amber-400 active:scale-95 cursor-pointer'
                      : 'bg-saloon-900 text-zinc-500 border border-saloon-800 cursor-not-allowed'
                  }`}
                >
                  <span>💰 سرقت کارت اول از دست هدف انتخابی + ۱ کارت از مخزن</span>
                </button>
              )}
            </div>

            {/* Standard Deck Fallback */}
            <div className="pt-2 border-t border-saloon-800">
              <button
                onClick={() => onResolve({ type: 'deck' })}
                className="w-full bg-saloon-800 hover:bg-saloon-700 active:scale-95 text-zinc-200 font-bold text-xs py-2.5 rounded-xl border border-saloon-600 transition-all"
              >
                انصراف از سرقت و کشیدن ۲ کارت عادی از مخزن
              </button>
            </div>
          </div>
        )}

        {/* 3. KIT CARLSON UI */}
        {prompt.characterName === 'kit_carlson' && (
          <div className="space-y-4">
            <div className="bg-saloon-950/70 border border-amber-600/40 p-3 rounded-2xl text-xs text-amber-200/90 leading-relaxed text-center">
              ⭐ <strong className="text-amber-400">کیت کارلسون (Kit Carlson):</strong> ۳ کارت بالای مخزن پیش روی شماست. <strong className="text-amber-300">دقیقاً ۲ کارت</strong> را برای نگه داشتن در دست انتخاب کنید. کارت باقیمانده به بالای مخزن بازگردانده می‌شود.
            </div>

            {/* 3 Cards Selection */}
            <div className="flex items-center justify-center gap-2 sm:gap-4 py-2">
              {(prompt.kitCards || []).map((card, idx) => {
                const isSelected = selectedKitIndices.includes(idx);
                return (
                  <div
                    key={card.id || idx}
                    onClick={() => toggleKitIndex(idx)}
                    className={`cursor-pointer transform transition-all duration-200 flex flex-col items-center ${
                      isSelected ? 'scale-105 -translate-y-2' : 'opacity-75 hover:opacity-100'
                    }`}
                  >
                    <div
                      className={`rounded-2xl p-1 transition-all ${
                        isSelected
                          ? 'ring-4 ring-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.6)]'
                          : 'border border-transparent'
                      }`}
                    >
                      <CardComponent card={card} size="sm" isPlayable={false} showDetailsOnSelect={false} />
                    </div>

                    <span
                      className={`text-[10px] font-bold mt-2 px-2 py-0.5 rounded-full ${
                        isSelected
                          ? 'bg-amber-500 text-saloon-950 shadow'
                          : 'bg-saloon-800 text-zinc-400'
                      }`}
                    >
                      {isSelected ? '✓ انتخاب شده' : 'بازگشت به مخزن'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Confirm Button */}
            <button
              disabled={selectedKitIndices.length !== 2}
              onClick={() => {
                if (selectedKitIndices.length === 2) {
                  onResolve({
                    type: 'kit',
                    kitSelectedIndices: selectedKitIndices,
                  });
                }
              }}
              className={`w-full py-3 rounded-xl font-black text-xs sm:text-sm transition-all shadow-lg flex items-center justify-center gap-1.5 ${
                selectedKitIndices.length === 2
                  ? 'bg-amber-600 hover:bg-amber-500 text-saloon-950 border border-amber-400 active:scale-95 cursor-pointer animate-pulse'
                  : 'bg-saloon-900 text-zinc-500 border border-saloon-800 cursor-not-allowed'
              }`}
            >
              {selectedKitIndices.length === 2
                ? 'تأیید انتخاب (نگه داشتن ۲ کارت و بازگرداندن کارت سوم)'
                : `لطفاً ۲ کارت را انتخاب کنید (${selectedKitIndices.length} از ۲)`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
