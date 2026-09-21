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
  cardSize?: 'xs' | 'sm' | 'md' | 'lg';
  isEffectActive?: boolean;
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
  cardSize = 'md',
  isEffectActive = false,
}) => {
  const [isSidHealingMode, setIsSidHealingMode] = useState(false);
  const [sidSelectedCardIds, setSidSelectedCardIds] = useState<string[]>([]);
  const [cardZoom, setCardZoom] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('bang_hand_card_zoom');
        if (saved) {
          const parsed = parseInt(saved, 10);
          if (!isNaN(parsed) && parsed >= 60 && parsed <= 150) return parsed;
        }
      } catch (e) {}
    }
    return 100;
  });
  const [isHandCollapsed, setIsHandCollapsed] = useState<boolean>(false);

  const handleZoomIn = () => {
    setCardZoom((prev) => {
      const next = Math.min(140, prev + 10);
      try { localStorage.setItem('bang_hand_card_zoom', String(next)); } catch (e) {}
      return next;
    });
  };

  const handleZoomOut = () => {
    setCardZoom((prev) => {
      const next = Math.max(65, prev - 10);
      try { localStorage.setItem('bang_hand_card_zoom', String(next)); } catch (e) {}
      return next;
    });
  };

  const handleResetZoom = () => {
    setCardZoom(100);
    try { localStorage.setItem('bang_hand_card_zoom', '100'); } catch (e) {}
  };

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

  if (isHandCollapsed) {
    return (
      <div className="w-full bg-saloon-900/95 border-t border-saloon-700/80 px-2 sm:px-4 py-1.5 shadow-2xl flex items-center justify-between z-20 shrink-0 backdrop-blur-md select-none">
        <div
          onClick={() => setIsHandCollapsed(false)}
          className="flex items-center gap-2 cursor-pointer hover:text-amber-300 transition-colors"
          title="برای باز کردن دست کارت‌ها کلیک کنید"
        >
          <span className="text-sm">🃏</span>
          <span className="text-xs font-black text-amber-300">
            دست شما ({cards.length} کارت)
          </span>
          {isMyTurn ? (
            <span className="bg-amber-500 text-saloon-950 px-2 py-0.2 rounded-full text-[8px] font-black animate-pulse">
              نوبت شماست
            </span>
          ) : (
            <span className="text-[10px] text-zinc-400 font-bold hidden sm:inline">
              (در انتظار سایرین)
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {isMyTurn && !isDiscardPhase && !isSidHealingMode && (
            <button
              disabled={isEffectActive}
              onClick={onEndTurn}
              className="bg-saloon-800 hover:bg-saloon-700 text-amber-200 border border-amber-600/50 text-xs font-bold px-3 py-1 rounded-xl shadow transition-all active:scale-95"
            >
              پایان نوبت ⏭️
            </button>
          )}
          <button
            onClick={() => setIsHandCollapsed(false)}
            className="bg-amber-600 hover:bg-amber-500 text-saloon-950 font-black text-xs px-2.5 sm:px-3 py-1 rounded-xl shadow flex items-center gap-1 active:scale-95 transition-all"
            title="نمایش کارت‌های در دست"
          >
            <span>▲</span>
            <span>نمایش کارت‌ها</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-saloon-900/95 border-t border-saloon-700/80 backdrop-blur-md px-1.5 sm:px-4 py-1 sm:py-2 shadow-2xl flex flex-col items-center z-20 shrink-0">
      {/* Action Bar Above Hand Cards */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-1 px-1 flex-wrap gap-1 sm:gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          {isEffectActive ? (
            <div className="bg-amber-500/20 text-amber-200 border border-amber-500/40 px-2 sm:px-3 py-0.5 sm:py-1 rounded-xl text-[10px] sm:text-xs font-bold animate-pulse flex items-center gap-1">
              <span className="text-xs">⏳</span>
              <span className="truncate">در حال اجرای شلیک و انیمیشن نبرد...</span>
            </div>
          ) : isSidHealingMode ? (
            <div className="bg-red-500/20 text-red-300 border border-red-500/40 px-2 sm:px-3 py-0.5 sm:py-1 rounded-xl text-[10px] sm:text-xs font-bold animate-pulse">
              🩸 ۲ کارت برای سوزاندن و بازیابی ۱ جان انتخاب کنید ({sidSelectedCardIds.length} از ۲)
            </div>
          ) : isDiscardPhase ? (
            <div className="bg-red-500/20 text-red-300 border border-red-500/40 px-2 sm:px-3 py-0.5 sm:py-1 rounded-xl text-[10px] sm:text-xs font-bold animate-pulse">
              ⚠️ کارت‌های اضافی را دور بیندازید تا تعداد با جان برابر شود.
            </div>
          ) : isMyTurn ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 sm:px-3 py-0.5 sm:py-1 rounded-xl text-[10px] sm:text-xs font-bold">
                🎯 نوبت شماست!
              </span>
              {selectedCard && isTargetRequired && (
                <span
                  className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-xl text-[10px] sm:text-xs font-bold truncate max-w-[200px] sm:max-w-none ${
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
                    ? '🎯 شلیک زپلشک — روی هدف در میز کلیک کنید'
                    : selectedCard.name === 'jail'
                    ? '🔒 هلفدونی: روی بازیکن در میز کلیک کنید'
                    : selectedCard.name === 'panic'
                    ? '💰 تهدید: روی بازیکن در برد ۱ کلیک کنید'
                    : selectedCard.name === 'cat_balou'
                    ? '🔥 کت بالو: روی بازیکن کلیک کنید'
                    : selectedCard.name === 'duel'
                    ? '⚔️ دوئل: روی بازیکن کلیک کنید'
                    : '🎯 شلیک: روی بازیکن در برد اسلحه کلیک کنید'}
                </span>
              )}
            </div>
          ) : (
            <span className="text-zinc-400 text-[10px] sm:text-xs">در انتظار نوبت سایر بازیکنان...</span>
          )}
        </div>

        {/* Right Actions: Zoom Controls + End Turn / Sid Heal + Collapse Button */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Card Size Zoom Mini-Toolbar */}
          <div className="flex items-center gap-0.5 bg-saloon-950/85 border border-saloon-700/80 rounded-xl px-1 sm:px-1.5 py-0.5 select-none text-xs">
            <button
              type="button"
              onClick={handleZoomOut}
              className="w-5 h-5 rounded bg-saloon-800 hover:bg-saloon-700 active:scale-95 text-zinc-200 hover:text-amber-300 font-black flex items-center justify-center text-[10px] transition-all"
              title="کوچک‌تر کردن کارت‌ها"
            >
              🔍−
            </button>
            <span className="text-[9px] sm:text-[10px] font-mono font-black text-amber-400 min-w-[26px] sm:min-w-[30px] text-center">
              {cardZoom}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              className="w-5 h-5 rounded bg-saloon-800 hover:bg-saloon-700 active:scale-95 text-zinc-200 hover:text-amber-300 font-black flex items-center justify-center text-[10px] transition-all"
              title="بزرگ‌تر کردن کارت‌ها"
            >
              🔍+
            </button>
            {cardZoom !== 100 && (
              <button
                type="button"
                onClick={handleResetZoom}
                className="text-[9px] text-zinc-500 hover:text-zinc-300 px-0.5 transition-colors"
                title="ریست اندازه کارت‌ها به ۱۰۰٪"
              >
                ↺
              </button>
            )}
            <div className="w-[1px] h-3 bg-saloon-700 mx-0.5" />
            <button
              type="button"
              onClick={() => setIsHandCollapsed(true)}
              className="text-[9px] text-zinc-400 hover:text-amber-300 px-1 py-0.5 rounded hover:bg-saloon-800 transition-colors flex items-center gap-0.5"
              title="بستن نوار کارت‌ها برای دیدن کامل میز"
            >
              <span>▼</span>
              <span className="hidden sm:inline">بستن دست</span>
            </button>
          </div>

          {/* Sid Ketchum Heal Ability Toggle */}
          {canSidHeal && !isSidHealingMode && (
            <button
              disabled={isEffectActive}
              onClick={() => {
                setIsSidHealingMode(true);
                setSidSelectedCardIds([]);
                onCancelSelection();
              }}
              className="bg-red-950/80 hover:bg-red-900 disabled:opacity-40 disabled:pointer-events-none active:scale-95 text-red-200 border border-red-600/70 text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-1 sm:py-2 rounded-xl shadow transition-all flex items-center gap-1"
              title="سوزاندن ۲ کارت دلخواه برای بازیابی ۱ جان"
            >
              <span>🩸 درمان سید (+۱ جان)</span>
            </button>
          )}

          {isSidHealingMode && (
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                disabled={sidSelectedCardIds.length !== 2 || isEffectActive}
                onClick={handleConfirmSidHeal}
                className={`text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-1 sm:py-2 rounded-xl shadow transition-all flex items-center gap-1 ${
                  sidSelectedCardIds.length === 2 && !isEffectActive
                    ? 'bg-red-600 hover:bg-red-500 text-white border border-red-400 active:scale-95 animate-pulse cursor-pointer'
                    : 'bg-saloon-800 text-zinc-500 border border-saloon-700 cursor-not-allowed'
                }`}
              >
                <span>🩸 تأیید درمان</span>
              </button>
              <button
                onClick={() => {
                  setIsSidHealingMode(false);
                  setSidSelectedCardIds([]);
                }}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] sm:text-xs px-2 py-1 sm:py-2 rounded-xl border border-zinc-600"
              >
                انصراف
              </button>
            </div>
          )}

          {isMyTurn && !isDiscardPhase && !isSidHealingMode && (
            <button
              disabled={isEffectActive}
              onClick={onEndTurn}
              className="bg-saloon-800 hover:bg-saloon-700 disabled:opacity-40 disabled:pointer-events-none active:scale-95 text-amber-200 border border-amber-600/50 text-[10px] sm:text-xs font-bold px-2.5 sm:px-4 py-1 sm:py-2 rounded-xl shadow transition-all flex items-center gap-1 shrink-0"
            >
              <span>پایان نوبت ⏭️</span>
            </button>
          )}
        </div>
      </div>

      {/* Selected Card Explanation Banner ("با کلیک رو هر کارت توضیحاتش بیاد") */}
      {selectedCard && !isSidHealingMode && (
        <div className="w-full max-w-4xl bg-saloon-950/95 border-2 border-amber-500/80 rounded-xl p-1.5 sm:p-2.5 mb-1 sm:mb-2 shadow-2xl flex items-center justify-between gap-2 animate-in fade-in slide-in-from-bottom-2 backdrop-blur-md">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl sm:text-2xl shrink-0">📜</span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-black text-amber-300 text-xs sm:text-sm">
                  {selectedCard.titleFa}
                </span>
                <span
                  className={`text-[8px] sm:text-[9px] font-bold px-1.5 py-0.2 rounded-md ${
                    selectedCard.border === 'brown'
                      ? 'bg-amber-900/90 text-amber-200 border border-amber-700/60'
                      : 'bg-sky-900/90 text-sky-200 border border-sky-600/60'
                  }`}
                >
                  {selectedCard.border === 'brown'
                    ? 'کارت اکشن (یک‌بار مصرف)'
                    : 'کارت تجهیزات (روی میز می‌ماند)'}
                </span>
                {selectedCard.name === 'volcanic' ? (
                  <span className="bg-gradient-to-r from-red-600 via-amber-500 to-red-600 text-white px-1.5 py-0.2 rounded-md text-[8px] sm:text-[9px] font-black animate-pulse flex items-center gap-1 shadow">
                    <span>⚡</span>
                    <span>ولکانو: شلیک نامحدود (برد ۱)</span>
                  </span>
                ) : selectedCard.range ? (
                  <span className="bg-amber-400 text-saloon-950 px-1.5 py-0.2 rounded-md text-[8px] sm:text-[9px] font-black flex items-center gap-1 shadow">
                    <span>🔫</span>
                    <span>اسلحه برد {selectedCard.range} فرسنگ</span>
                  </span>
                ) : null}

                {selectedCard.name === 'barrel' && (
                  <span className="bg-gradient-to-r from-sky-500 to-blue-600 text-white px-1.5 py-0.2 rounded-md text-[8px] sm:text-[9px] font-black flex items-center gap-1 shadow">
                    <span>🛡️</span>
                    <span>بشکه دفاعی: شانس دفع با دل ♥</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-zinc-100 mt-0.5 leading-snug font-medium line-clamp-2 sm:line-clamp-none">
                {selectedCard.descFa}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isSelfPlayable && isMyTurn && !isDiscardPhase && (
              <button
                disabled={isEffectActive}
                onClick={onPlaySelectedCard}
                className="bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:pointer-events-none active:scale-95 text-white text-xs font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl shadow-lg border border-amber-400 transition-all flex items-center gap-1"
              >
                <span>⚡ بازی کردن</span>
              </button>
            )}
            <button
              onClick={onCancelSelection}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs px-2 sm:px-2.5 py-1.5 sm:py-2 rounded-xl border border-zinc-600 transition-colors"
              title="بستن توضیحات و لغو انتخاب"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Cards Scrollable Carousel */}
      <div className="w-full max-w-5xl flex items-end justify-center gap-1.5 sm:gap-3 overflow-x-auto py-1 sm:py-2 px-1 sm:px-4 scrollbar-thin">
        {cards.length === 0 ? (
          <div className="py-4 sm:py-6 text-zinc-500 text-xs italic">
            دست شما خالی است! در نوبت بعدی کارت می‌کشید.
          </div>
        ) : (
          (() => {
            const currentBaseWidth = cardSize === 'xs' ? 54 : cardSize === 'sm' ? 72 : cardSize === 'lg' ? 132 : 88;
            const currentBaseHeight = cardSize === 'xs' ? 81 : cardSize === 'sm' ? 108 : cardSize === 'lg' ? 198 : 132;
            const scaledWidth = Math.round(currentBaseWidth * (cardZoom / 100));
            const scaledHeight = Math.round(currentBaseHeight * (cardZoom / 100));

            return cards.map((card) => {
              const isSelected = isSidHealingMode
                ? sidSelectedCardIds.includes(card.id)
                : card.id === selectedCardId;

              return (
                <div
                  key={card.id}
                  style={{
                    width: `${scaledWidth}px`,
                    minWidth: `${scaledWidth}px`,
                    maxWidth: `${scaledWidth}px`,
                    height: `${scaledHeight}px`,
                    minHeight: `${scaledHeight}px`,
                    maxHeight: `${scaledHeight}px`,
                  }}
                  className={`flex-shrink-0 transition-all duration-200 ${
                    isEffectActive ? 'pointer-events-none opacity-50 grayscale-[25%]' : ''
                  }`}
                >
                  <CardComponent
                    card={card}
                    size={cardSize}
                    scale={cardZoom / 100}
                    isSelected={isSelected}
                    isPlayable={!isEffectActive && (isMyTurn || isDiscardPhase || isSidHealingMode)}
                    showDetailsOnSelect={false}
                    onClick={() => {
                      if (isEffectActive) return;
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
                  />
                </div>
              );
            });
          })()
        )}
      </div>
    </div>
  );
};
