import React, { useState } from 'react';
import { Card, TurnPhase } from '@/lib/game-engine/types';
import { CardComponent } from './CardComponent';

interface HandCardsProps {
  cards: Card[];
  selectedCardId: string | null;
  isMyTurn: boolean;
  turnPhase: TurnPhase;
  characterName?: string;
  currentHp?: number;
  maxHp?: number;
  onSelectCard: (card: Card) => void;
  onPlaySelectedCard: () => void;
  onCancelSelection: () => void;
  onEndTurn: () => void;
  onDiscardCard: (cardId: string) => void;
  onUseSidKetchum?: (cardIds: string[]) => void;
}

export const HandCards: React.FC<HandCardsProps> = ({
  cards,
  selectedCardId,
  isMyTurn,
  turnPhase,
  characterName,
  currentHp,
  maxHp,
  onSelectCard,
  onPlaySelectedCard,
  onCancelSelection,
  onEndTurn,
  onDiscardCard,
  onUseSidKetchum,
}) => {
  const [isSidHealingMode, setIsSidHealingMode] = useState(false);
  const [sidSelectedCardIds, setSidSelectedCardIds] = useState<string[]>([]);

  const selectedCard = cards.find((c) => c.id === selectedCardId);

  // Calamity Janet ability: can use Missed as Bang on her turn!
  const isCalamityBang = characterName === 'calamity_janet' && selectedCard?.name === 'missed';

  // Cards that don't need targeting
  const isSelfPlayable =
    selectedCard &&
    (selectedCard.name === 'beer' ||
      selectedCard.name === 'saloon' ||
      selectedCard.name === 'stagecoach' ||
      selectedCard.name === 'wells_fargo' ||
      selectedCard.name === 'general_store' ||
      selectedCard.name === 'gatling' ||
      selectedCard.name === 'indians' ||
      selectedCard.name === 'mustang' ||
      selectedCard.name === 'appaloosa' ||
      selectedCard.name === 'barrel' ||
      selectedCard.name === 'dynamite' ||
      selectedCard.name === 'volcanic' ||
      selectedCard.name === 'schofield' ||
      selectedCard.name === 'remington' ||
      selectedCard.name === 'rev_carabine' ||
      selectedCard.name === 'winchester');

  // Cards that require clicking a player seat on the table
  const isTargetRequired =
    selectedCard &&
    (selectedCard.name === 'bang' ||
      isCalamityBang ||
      selectedCard.name === 'panic' ||
      selectedCard.name === 'cat_balou' ||
      selectedCard.name === 'jail' ||
      selectedCard.name === 'duel');

  const isDiscardPhase = turnPhase === 'discard';
  const canSidHeal =
    characterName === 'sid_ketchum' &&
    isMyTurn &&
    !isDiscardPhase &&
    currentHp !== undefined &&
    maxHp !== undefined &&
    currentHp < maxHp &&
    cards.length >= 2;

  const toggleSidCard = (id: string) => {
    if (sidSelectedCardIds.includes(id)) {
      setSidSelectedCardIds(sidSelectedCardIds.filter((c) => c !== id));
    } else {
      if (sidSelectedCardIds.length < 2) {
        setSidSelectedCardIds([...sidSelectedCardIds, id]);
      } else {
        setSidSelectedCardIds([sidSelectedCardIds[1], id]);
      }
    }
  };

  const handleConfirmSidHeal = () => {
    if (sidSelectedCardIds.length === 2 && onUseSidKetchum) {
      onUseSidKetchum(sidSelectedCardIds);
      setIsSidHealingMode(false);
      setSidSelectedCardIds([]);
    }
  };

  return (
    <div className="w-full bg-saloon-900/95 border-t border-saloon-700/80 backdrop-blur-md px-3 sm:px-4 py-3 shadow-2xl flex flex-col items-center z-20">
      {/* Action Bar Above Hand Cards */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-2 px-2 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {isSidHealingMode ? (
            <div className="bg-red-500/20 text-red-300 border border-red-500/40 px-3 py-1 rounded-xl text-xs font-bold animate-pulse">
              🩸 ۲ کارت برای سوزاندن و بازیابی ۱ جان انتخاب کنید ({sidSelectedCardIds.length} از ۲)
            </div>
          ) : isDiscardPhase ? (
            <div className="bg-red-500/20 text-red-300 border border-red-500/40 px-3 py-1 rounded-xl text-xs font-bold animate-pulse">
              ⚠️ کارت‌های اضافی را با کلیک روی کارت‌ها دور بیندازید تا تعداد کارت‌ها با جان شما برابر شود.
            </div>
          ) : isMyTurn ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-xl text-xs font-bold">
                🎯 نوبت شماست!
              </span>
              {selectedCard && isTargetRequired && (
                <span
                  className={`px-3 py-1 rounded-xl text-xs font-bold ${
                    selectedCard.name === 'jail'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/50'
                      : selectedCard.name === 'panic'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                      : selectedCard.name === 'cat_balou'
                      ? 'bg-orange-500/20 text-orange-300 border border-orange-500/50'
                      : selectedCard.name === 'duel'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50'
                      : 'bg-red-500/20 text-red-300 border border-red-500/40'
                  }`}
                >
                  {isCalamityBang
                    ? '🎯 شلیک زپلشک جای بنگ (قابلیت کالامیتی جنت) — روی یک هدف در میز کلیک کنید'
                    : selectedCard.name === 'jail'
                    ? '🔒 به هلفدونی انداختن: روی بازیکن مورد نظر در میز کلیک کنید (کلانتر را نمی‌توان به زندان فرستاد)'
                    : selectedCard.name === 'panic'
                    ? '💰 تهدید: روی بازیکن مورد نظر در برد ۱ کلیک کنید'
                    : selectedCard.name === 'cat_balou'
                    ? '🔥 کت بالو: روی بازیکن مورد نظر کلیک کنید تا یک کارت او بسوزد'
                    : selectedCard.name === 'duel'
                    ? '⚔️ دوئل: روی بازیکن مورد نظر کلیک کنید'
                    : '🎯 شلیک: روی بازیکن مورد نظر در برد اسلحه کلیک کنید'}
                </span>
              )}
            </div>
          ) : (
            <span className="text-zinc-400 text-xs">در انتظار نوبت سایر بازیکنان...</span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Sid Ketchum Heal Ability Toggle */}
          {canSidHeal && !isSidHealingMode && (
            <button
              onClick={() => {
                setIsSidHealingMode(true);
                setSidSelectedCardIds([]);
                onCancelSelection();
              }}
              className="bg-red-950/80 hover:bg-red-900 active:scale-95 text-red-200 border border-red-600/70 text-xs font-bold px-3 py-2 rounded-xl shadow transition-all flex items-center gap-1"
              title="سوزاندن ۲ کارت دلخواه برای بازیابی ۱ جان"
            >
              <span>🩸 درمان سید کچام (+۱ جان)</span>
            </button>
          )}

          {isSidHealingMode && (
            <div className="flex items-center gap-2">
              <button
                disabled={sidSelectedCardIds.length !== 2}
                onClick={handleConfirmSidHeal}
                className={`text-xs font-bold px-3 py-2 rounded-xl shadow transition-all flex items-center gap-1 ${
                  sidSelectedCardIds.length === 2
                    ? 'bg-red-600 hover:bg-red-500 text-white border border-red-400 active:scale-95 animate-pulse cursor-pointer'
                    : 'bg-saloon-800 text-zinc-500 border border-saloon-700 cursor-not-allowed'
                }`}
              >
                <span>🩸 تأیید درمان ({sidSelectedCardIds.length} از ۲)</span>
              </button>
              <button
                onClick={() => {
                  setIsSidHealingMode(false);
                  setSidSelectedCardIds([]);
                }}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs px-2.5 py-2 rounded-xl border border-zinc-600"
              >
                انصراف
              </button>
            </div>
          )}

          {isMyTurn && !isDiscardPhase && !isSidHealingMode && (
            <button
              onClick={onEndTurn}
              className="bg-saloon-800 hover:bg-saloon-700 active:scale-95 text-amber-200 border border-amber-600/50 text-xs font-bold px-4 py-2 rounded-xl shadow transition-all flex items-center gap-1"
            >
              <span>پایان نوبت ⏭️</span>
            </button>
          )}
        </div>
      </div>

      {/* Selected Card Explanation Banner ("با کلیک رو هر کارت توضیحاتش بیاد") */}
      {selectedCard && !isSidHealingMode && (
        <div className="w-full max-w-4xl bg-saloon-950/95 border-2 border-amber-500/80 rounded-2xl p-2.5 sm:p-3 mb-2 shadow-2xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 backdrop-blur-md">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl shrink-0">📜</span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-amber-300 text-xs sm:text-sm">
                  {selectedCard.titleFa}
                </span>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${
                    selectedCard.border === 'brown'
                      ? 'bg-amber-900/90 text-amber-200 border border-amber-700/60'
                      : 'bg-sky-900/90 text-sky-200 border border-sky-600/60'
                  }`}
                >
                  {selectedCard.border === 'brown'
                    ? 'کارت اکشن (یک‌بار مصرف)'
                    : 'کارت تجهیزات (روی میز می‌ماند)'}
                </span>
                {selectedCard.range && (
                  <span className="bg-amber-400 text-saloon-950 px-1.5 py-0.2 rounded-md text-[9px] font-black">
                    برد اسلحه: {selectedCard.range}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-100 mt-1 leading-relaxed font-medium">
                {selectedCard.descFa}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isSelfPlayable && isMyTurn && !isDiscardPhase && (
              <button
                onClick={onPlaySelectedCard}
                className="bg-amber-600 hover:bg-amber-500 active:scale-95 text-white text-xs font-bold px-3.5 sm:px-4 py-2 rounded-xl shadow-lg border border-amber-400 transition-all flex items-center gap-1"
              >
                <span>⚡ بازی کردن</span>
              </button>
            )}
            <button
              onClick={onCancelSelection}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs px-2.5 sm:px-3 py-2 rounded-xl border border-zinc-600 transition-colors"
              title="بستن توضیحات و لغو انتخاب"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Cards Scrollable Carousel */}
      <div className="w-full max-w-5xl flex items-end justify-center gap-3 overflow-x-auto py-2 px-4 scrollbar-thin">
        {cards.length === 0 ? (
          <div className="py-6 text-zinc-500 text-xs italic">
            دست شما خالی است! در نوبت بعدی کارت می‌کشید.
          </div>
        ) : (
          cards.map((card) => {
            const isSelected = isSidHealingMode
              ? sidSelectedCardIds.includes(card.id)
              : card.id === selectedCardId;

            return (
              <div key={card.id} className="flex-shrink-0">
                <CardComponent
                  card={card}
                  isSelected={isSelected}
                  isPlayable={isMyTurn || isDiscardPhase || isSidHealingMode}
                  onClick={() => {
                    if (isSidHealingMode) {
                      toggleSidCard(card.id);
                    } else if (isDiscardPhase) {
                      onDiscardCard(card.id);
                    } else {
                      // Clicking on already selected card can toggle or keep selected
                      if (selectedCardId === card.id) {
                        onCancelSelection();
                      } else {
                        onSelectCard(card);
                      }
                    }
                  }}
                  size="md"
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
