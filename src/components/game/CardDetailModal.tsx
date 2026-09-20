import React, { useEffect } from 'react';
import { Card, CardSuit } from '@/lib/game-engine/types';
import { CardComponent } from './CardComponent';

interface CardDetailModalProps {
  card: Card | null;
  onClose: () => void;
}

export const CardDetailModal: React.FC<CardDetailModalProps> = ({ card, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!card) return null;

  const isBrown = card.border === 'brown';

  const getRankNumber = (rank: string) => {
    const numMap: Record<string, string> = {
      A: '۱',
      J: '۱۱',
      Q: '۱۲',
      K: '۱۳',
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
  };

  const getSuitSymbol = (suit: CardSuit) => {
    switch (suit) {
      case 'hearts':
        return { symbol: '♥', color: 'text-red-500' };
      case 'diamonds':
        return { symbol: '♦', color: 'text-red-500' };
      case 'clubs':
        return { symbol: '♣', color: 'text-amber-200' };
      case 'spades':
        return { symbol: '♠', color: 'text-zinc-200' };
    }
  };

  const suitData = getSuitSymbol(card.suit);
  const rankNumber = getRankNumber(card.rank);

  return (
    <div
      className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative bg-saloon-950 border-2 border-amber-600/80 rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl text-right overflow-hidden flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Close */}
        <div className="w-full flex items-center justify-between border-b border-saloon-800 pb-2.5 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🃏</span>
            <span className="text-sm font-black text-amber-300">{card.titleFa}</span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-saloon-900 border border-saloon-700 text-zinc-400 hover:text-white flex items-center justify-center text-xs transition-colors"
          >
            ✕
          </button>
        </div>

        {/* 2:3 Large Card Visual */}
        <div className="my-2 shadow-2xl">
          <CardComponent card={card} size="lg" isPlayable={false} showDetailsOnSelect={false} />
        </div>

        {/* Details Summary */}
        <div className="w-full bg-saloon-900/90 border border-saloon-800 rounded-2xl p-3 mt-3 text-right">
          <div className="flex items-center justify-between text-xs font-bold mb-2">
            <div className={`flex items-center gap-1 font-black ${suitData.color}`}>
              <span>خال و عدد:</span>
              <span>{rankNumber}</span>
              <span className="text-sm">{suitData.symbol}</span>
            </div>
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] ${
                isBrown
                  ? 'bg-amber-900/90 text-amber-200 border border-amber-700/60'
                  : 'bg-sky-900/90 text-sky-200 border border-sky-600/60'
              }`}
            >
              {isBrown ? 'کارت اکشن (یک‌بار مصرف)' : 'کارت تجهیزات (روی میز می‌ماند)'}
            </span>
          </div>

          {card.range && (
            <div className="text-xs font-bold text-amber-400 mb-2 flex items-center gap-1">
              <span>🎯 اسلحه با برد شلیک:</span>
              <span className="bg-amber-400 text-saloon-950 px-2 py-0.2 rounded font-black text-[11px]">
                {card.range}
              </span>
            </div>
          )}

          <p className="text-xs text-zinc-100 leading-relaxed font-medium mt-1">
            {card.descFa}
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 bg-saloon-800 hover:bg-saloon-700 text-amber-200 font-bold text-xs py-2.5 rounded-xl border border-saloon-700 transition-colors"
        >
          بستن ✕
        </button>
      </div>
    </div>
  );
};
