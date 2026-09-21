import React, { useState } from 'react';
import { Card, CardSuit } from '@/lib/game-engine/types';

interface CardComponentProps {
  card: Card;
  isSelected?: boolean;
  isPlayable?: boolean;
  onClick?: () => void;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  scale?: number;
  showDetailsOnSelect?: boolean;
}

const CARD_ART_MAP: Record<string, string> = {
  bang: '/assets/cards/bang.jpg',
  missed: '/assets/cards/missed.jpg',
  beer: '/assets/cards/beer.jpg',
  dynamite: '/assets/cards/dynamite.jpg',
  gatling: '/assets/cards/gatling.jpg',
  general_store: '/assets/cards/general_store.jpg',
  saloon: '/assets/cards/saloon.jpg',
  indians: '/assets/cards/indians.jpg',
  stagecoach: '/assets/cards/stagecoach.jpg',
  wells_fargo: '/assets/cards/wells_fargo.jpg',
  panic: '/assets/cards/panic.jpg',
  cat_balou: '/assets/cards/cat_balou.jpg',
  duel: '/assets/cards/duel.jpg',
  barrel: '/assets/cards/barrel.jpg',
  jail: '/assets/cards/jail.jpg',
  volcanic: '/assets/cards/volcanic.jpg',
  schofield: '/assets/cards/schofield.jpg',
  remington: '/assets/cards/remington.jpg',
  rev_carabine: '/assets/cards/rev_carabine.jpg',
  winchester: '/assets/cards/winchester.jpg',
  mustang: '/assets/cards/mustang.jpg',
  appaloosa: '/assets/cards/appaloosa.jpg',
};

export const CardComponent: React.FC<CardComponentProps> = ({
  card,
  isSelected = false,
  isPlayable = true,
  onClick,
  size = 'md',
  scale,
  showDetailsOnSelect = false,
}) => {
  const [imgError, setImgError] = useState(false);

  const getRankNumber = (rank: string) => {
    switch (rank) {
      case 'A':
        return '۱';
      case 'J':
        return '۱۱';
      case 'Q':
        return '۱۲';
      case 'K':
        return '۱۳';
      default:
        const numMap: Record<string, string> = {
          '1': '۱',
          '2': '۲',
          '3': '۳',
          '4': '۴',
          '5': '۵',
          '6': '۶',
          '7': '۷',
          '8': '۸',
          '9': '۹',
          '10': '۱۰',
          '11': '۱۱',
          '12': '۱۲',
          '13': '۱۳',
          '14': '۱۴',
          '15': '۱۵',
        };
        return numMap[rank] || rank;
    }
  };

  // Only the suit symbol and color (no Persian words like دل or خشت)
  const getSuitSymbol = (suit: CardSuit) => {
    switch (suit) {
      case 'hearts':
        return { symbol: '♥', color: 'text-red-500' };
      case 'diamonds':
        return { symbol: '♦', color: 'text-red-500' };
      case 'clubs':
        return { symbol: '♣', color: 'text-zinc-200' };
      case 'spades':
        return { symbol: '♠', color: 'text-zinc-200' };
    }
  };

  const suitData = getSuitSymbol(card.suit);
  const rankNumber = getRankNumber(card.rank);
  const isBrown = card.border === 'brown';

  // Standardized 2:3 card dimensions:
  // xs: 54x81px (Table discard on mobile, compact slots)
  // sm: 72x108px (Modals, table discard on desktop, small hand)
  // md: 88x132px (Default hand cards)
  // lg: 132x198px (Inspect card modal)
  const baseWidth = size === 'xs' ? 54 : size === 'sm' ? 72 : size === 'lg' ? 132 : 88;
  const baseHeight = size === 'xs' ? 81 : size === 'sm' ? 108 : size === 'lg' ? 198 : 132;
  
  const finalWidth = scale ? Math.round(baseWidth * scale) : baseWidth;
  const finalHeight = scale ? Math.round(baseHeight * scale) : baseHeight;

  const cardStyle: React.CSSProperties = {
    width: `${finalWidth}px`,
    minWidth: `${finalWidth}px`,
    maxWidth: `${finalWidth}px`,
    height: `${finalHeight}px`,
    minHeight: `${finalHeight}px`,
    maxHeight: `${finalHeight}px`,
    boxSizing: 'border-box',
  };

  return (
    <div
      onClick={isPlayable ? onClick : undefined}
      style={cardStyle}
      className={`relative select-none rounded-xl sm:rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-200 group flex-shrink-0 p-1 sm:p-1.5 ${
        card.name === 'barrel'
          ? 'border-2 border-sky-400 shadow-[0_0_16px_rgba(56,189,248,0.45)] ring-1 ring-sky-300/60'
          : card.name === 'volcanic'
          ? 'border-2 border-amber-400 shadow-[0_0_16px_rgba(245,158,11,0.5)] ring-1 ring-red-400/60'
          : card.range
          ? 'border-2 border-amber-400 shadow-[0_0_14px_rgba(245,158,11,0.35)] ring-1 ring-amber-300/40'
          : isBrown
          ? 'border-2 border-amber-600/90 shadow-[0_8px_20px_rgba(0,0,0,0.5)]'
          : 'border-2 border-sky-500/90 shadow-[0_8px_20px_rgba(0,0,0,0.5)]'
      } ${
        isSelected
          ? 'ring-3 sm:ring-4 ring-amber-400 -translate-y-2 sm:-translate-y-3 shadow-2xl scale-[1.03] z-30'
          : 'hover:-translate-y-1 hover:shadow-xl'
      } ${isPlayable ? 'cursor-pointer' : 'opacity-85'}`}
    >
      {/* 2:3 Full Background Image Covering the Entire Card */}
      <div className="absolute inset-0 w-full h-full z-0 bg-saloon-950 overflow-hidden pointer-events-none">
        {!imgError && CARD_ART_MAP[card.name] ? (
          <img
            src={CARD_ART_MAP[card.name]}
            alt={card.titleFa}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            className={`w-full h-full flex flex-col items-center justify-center p-3 text-center ${
              isBrown
                ? 'bg-gradient-to-b from-[#3a2012] to-[#1e1008]'
                : 'bg-gradient-to-b from-[#0f243b] to-[#08131f]'
            }`}
          >
            <span className="text-3xl mb-1">
              {card.name === 'bang' && '🔫'}
              {card.name === 'missed' && '💨'}
              {card.name === 'beer' && '🍺'}
              {card.name === 'saloon' && '🍻'}
              {card.name === 'stagecoach' && '🐴'}
              {card.name === 'wells_fargo' && '🚂'}
              {card.name === 'general_store' && '🏪'}
              {card.name === 'panic' && '💰'}
              {card.name === 'cat_balou' && '🔥'}
              {card.name === 'gatling' && '💥'}
              {card.name === 'indians' && '🏹'}
              {card.name === 'duel' && '⚔️'}
              {card.name === 'barrel' && '🛡️'}
              {card.name === 'jail' && '🔒'}
              {card.name === 'dynamite' && '🧨'}
              {card.border === 'blue' && '🎯'}
            </span>
          </div>
        )}
        {/* Subtle overlay gradient to ensure high readability for top and bottom elements */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/70 pointer-events-none" />
      </div>

      {/* Top Box: Title and Range / Ability Badge */}
      <div
        className={`relative z-10 rounded-lg px-1.5 py-0.5 flex items-center justify-between gap-1 shadow-md backdrop-blur-md w-full max-w-full min-w-0 overflow-hidden ${
          card.name === 'barrel'
            ? 'bg-sky-950/90 border border-sky-400/60'
            : card.name === 'volcanic'
            ? 'bg-red-950/90 border border-amber-400/60'
            : card.range
            ? 'bg-amber-950/90 border border-amber-400/60'
            : isBrown
            ? 'bg-amber-950/80 border border-amber-600/40'
            : 'bg-blue-950/80 border border-blue-500/40'
        }`}
      >
        <span className="font-black text-amber-200 text-[9px] sm:text-[10px] truncate leading-tight flex items-center gap-0.5 min-w-0">
          {card.name === 'barrel' && <span className="text-sky-300 shrink-0">🛡️</span>}
          {card.name === 'volcanic' && <span className="text-amber-400 shrink-0 animate-pulse">⚡</span>}
          {card.range && card.name !== 'volcanic' && <span className="text-amber-400 shrink-0">🔫</span>}
          <span className="truncate">{card.titleFa}</span>
        </span>
        
        {size !== 'xs' && finalWidth >= 68 && (
          card.name === 'volcanic' ? (
            <span className="bg-gradient-to-r from-red-600 via-amber-500 to-red-600 text-white px-1 py-0.2 rounded text-[7px] sm:text-[8px] font-black leading-none shrink-0 shadow animate-pulse whitespace-nowrap">
              نامحدود
            </span>
          ) : card.range ? (
            <span className="bg-gradient-to-r from-amber-400 to-yellow-300 text-saloon-950 px-1 py-0.2 rounded text-[7px] sm:text-[8px] font-black leading-none shrink-0 shadow whitespace-nowrap">
              برد {card.range}
            </span>
          ) : card.name === 'barrel' ? (
            <span className="bg-gradient-to-r from-sky-400 to-blue-600 text-white px-1 py-0.2 rounded text-[7px] sm:text-[8px] font-black leading-none shrink-0 shadow whitespace-nowrap">
              دل ♥
            </span>
          ) : null
        )}
      </div>

      {/* Bottom Subtle Transparent Description (taking minimal space) */}
      {size !== 'xs' && size !== 'sm' && !isSelected && finalWidth >= 84 && (
        <div className="absolute inset-x-0 bottom-0 pb-1 pt-4 pr-1 pl-12 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none text-right z-10 overflow-hidden">
          <p className="text-[8px] sm:text-[9px] text-zinc-200/95 font-medium truncate leading-tight">
            {card.name === 'barrel' ? (
              <span className="text-sky-300 font-bold">🛡️ شانس دفع با دل ♥</span>
            ) : card.name === 'volcanic' ? (
              <span className="text-amber-300 font-bold">⚡ شلیک نامحدود (برد ۱)</span>
            ) : card.range ? (
              <span className="text-amber-200 font-bold">🔫 اسلحه با برد {card.range}</span>
            ) : (
              card.descFa
            )}
          </p>
        </div>
      )}

      {/* Bottom-Left Small Suit & Rank Badge (Icon + Number only, e.g. 11 ♥) */}
      <div
        className={`absolute bottom-1 left-1 z-20 flex items-center gap-0.5 bg-black/80 backdrop-blur-md px-1 py-0.5 rounded border border-white/20 text-[9px] sm:text-[10px] font-black shadow-md ${suitData.color}`}
        title={`ورق: ${rankNumber} ${suitData.symbol}`}
      >
        <span className="text-zinc-100">{rankNumber}</span>
        <span className="text-[10px] leading-none">{suitData.symbol}</span>
      </div>

      {/* Full Details Overlay on Card when Clicked/Selected */}
      {showDetailsOnSelect && isSelected && (
        <div className="absolute inset-0 bg-black/88 backdrop-blur-md rounded-xl sm:rounded-2xl p-2 flex flex-col justify-between text-right animate-in fade-in zoom-in-95 duration-150 z-30 border-2 border-amber-400 overflow-y-auto">
          <div>
            <div className="flex items-center justify-between border-b border-white/15 pb-1 mb-1.5">
              <span className="font-black text-xs text-amber-300 flex items-center gap-1">
                {card.name === 'barrel' && <span>🛡️</span>}
                {card.name === 'volcanic' && <span>⚡</span>}
                {card.range && card.name !== 'volcanic' && <span>🔫</span>}
                <span>{card.titleFa}</span>
              </span>
              <div className={`flex items-center gap-1 ${suitData.color} text-xs font-black`}>
                <span className="text-white">{rankNumber}</span>
                <span>{suitData.symbol}</span>
              </div>
            </div>

            {/* Special Highlighted Ability Banners */}
            {card.name === 'barrel' && (
              <div className="text-[10px] text-sky-200 font-black mb-1.5 p-1.5 rounded-lg bg-sky-950/90 border border-sky-400/80 flex items-center gap-1.5">
                <span className="text-lg">🛡️</span>
                <div>
                  <div className="font-black text-sky-300">قابلیت دفاعی بشکه (Barrel):</div>
                  <div className="text-[9px] text-zinc-200 font-normal">هنگام شلیک بنگ، ۱ کارت رو می‌شود؛ اگر دل ♥ باشد گلوله بی‌اثر می‌شود.</div>
                </div>
              </div>
            )}
            {card.name === 'volcanic' && (
              <div className="text-[10px] text-amber-200 font-black mb-1.5 p-1.5 rounded-lg bg-amber-950/90 border border-amber-400/80 flex items-center gap-1.5">
                <span className="text-lg">⚡</span>
                <div>
                  <div className="font-black text-amber-300">قابلیت ویژه ولکانو (Volcanic):</div>
                  <div className="text-[9px] text-zinc-200 font-normal">شلیک نامحدود بنگ در هر نوبت! (برد شلیک ۱ فرسخ)</div>
                </div>
              </div>
            )}
            {card.range && card.name !== 'volcanic' && (
              <div className="text-[10px] text-amber-200 font-black mb-1.5 p-1.5 rounded-lg bg-saloon-900/90 border border-amber-500/70 flex items-center gap-1.5">
                <span className="text-lg">🔫</span>
                <div>
                  <div className="font-black text-amber-300">سلاح جنگی ({card.titleFa}):</div>
                  <div className="text-[9px] text-zinc-200 font-normal">برد شلیک شما را به {card.range} فرسنگ افزایش می‌دهد.</div>
                </div>
              </div>
            )}

            <p className="text-[10px] sm:text-[11px] leading-relaxed text-zinc-100 font-medium select-none">
              {card.descFa}
            </p>
          </div>
          <div className="text-[9px] text-center py-0.5 rounded-md border font-bold text-amber-200 bg-saloon-900/90 border-saloon-700/80">
            {isBrown ? 'کارت اکشن (یک‌بار مصرف)' : 'کارت تجهیزات (روی میز می‌ماند)'}
          </div>
        </div>
      )}
    </div>
  );
};
