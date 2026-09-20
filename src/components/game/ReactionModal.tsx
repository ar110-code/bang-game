import React from 'react';
import { PendingReaction, Card, Player } from '@/lib/game-engine/types';
import { CardComponent } from './CardComponent';

interface ReactionModalProps {
  pendingReaction: PendingReaction;
  myPlayer: Player;
  attackerName: string;
  onRespond: (action: 'play' | 'pass', cardId?: string) => void;
}

export const ReactionModal: React.FC<ReactionModalProps> = ({
  pendingReaction,
  myPlayer,
  attackerName,
  onRespond,
}) => {
  const isTarget =
    pendingReaction.type === 'duel'
      ? pendingReaction.duelTurnPlayerId === myPlayer.id
      : pendingReaction.targetPlayerId === myPlayer.id;

  const isSelfAttack =
    pendingReaction.sourcePlayerId === myPlayer.id &&
    (pendingReaction.type === 'gatling' || pendingReaction.type === 'indians');

  if (!isTarget || isSelfAttack) return null;

  // GENERAL STORE INTERACTIVE SELECTION
  if (pendingReaction.type === 'general_store') {
    const storeCards = pendingReaction.generalStoreCards || [];
    return (
      <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div className="bg-saloon-900 border-2 border-amber-600/80 rounded-3xl p-6 sm:p-7 max-w-3xl sm:max-w-4xl w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-center max-h-[90vh] overflow-y-auto">
          <div className="mb-4">
            <span className="text-4xl mb-2 block animate-bounce">🏪</span>
            <h3 className="text-xl font-black text-amber-300 mb-1">فروشگاه شهر غرب وحشی</h3>
            <p className="text-xs text-zinc-300">
              نوبت شماست! یکی از کارت‌های روی میز را انتخاب کنید تا به دست شما افزوده شود:
            </p>
          </div>

          <div className="mb-6">
            <div className="text-xs font-semibold text-zinc-400 mb-3">
              کارت‌های باقیمانده در فروشگاه ({storeCards.length} کارت):
            </div>
            {storeCards.length > 0 ? (
              <div className="flex flex-wrap justify-center gap-2.5 sm:gap-3 py-2">
                {storeCards.map((card) => (
                  <div
                    key={card.id}
                    className="cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => onRespond('play', card.id)}
                  >
                    <CardComponent
                      card={card}
                      size="sm"
                      onClick={() => onRespond('play', card.id)}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-saloon-950/60 rounded-xl p-4 text-center text-xs text-zinc-400 border border-amber-900/50">
                هیچ کارتی در فروشگاه باقی نمانده است.
              </div>
            )}
          </div>

          <div className="flex justify-center">
            {storeCards.length > 0 ? (
              <button
                onClick={() => onRespond('play', storeCards[0].id)}
                className="w-full bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-sm py-2.5 px-4 rounded-xl transition-colors shadow-lg active:scale-98"
              >
                انتخاب اولین کارت دسترسی‌پذیر
              </button>
            ) : (
              <button
                onClick={() => onRespond('pass')}
                className="w-full bg-stone-700 hover:bg-stone-600 text-white font-bold text-sm py-2.5 px-4 rounded-xl transition-colors shadow-lg active:scale-98"
              >
                پایان دور فروشگاه
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // STANDARD DEFENSIVE REACTIONS (Bang, Gatling, Indians, Duel)
  const requiredCardName = pendingReaction.requiredCard;
  const matchingCards = myPlayer.hand.filter((c) => {
    if (c.name === requiredCardName) return true;
    if (myPlayer.character?.name === 'calamity_janet') {
      if (requiredCardName === 'missed' && c.name === 'bang') return true;
      if (requiredCardName === 'bang' && c.name === 'missed') return true;
    }
    return false;
  });

  const getAttackTitle = () => {
    switch (pendingReaction.type) {
      case 'bang':
        return `🔫 ${attackerName} به شما شلیک کرد!`;
      case 'gatling':
        return `💥 مسلسل ${attackerName} شما را به رگبار بست!`;
      case 'indians':
        return `🏹 حمله سرخ‌پوست‌ها! نیاز به شلیک متقابل (بنگ!) دارید!`;
      case 'duel':
        return `⚔️ در دوئل با ${attackerName} هستید! نوبت شلیک شماست!`;
      default:
        return 'واکنش دفاعی لازم است!';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-saloon-900 border-2 border-red-600/80 rounded-2xl p-6 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="text-center mb-4">
          <span className="text-3xl mb-2 block animate-bounce">⚠️</span>
          <h3 className="text-lg font-black text-red-400 mb-1">{getAttackTitle()}</h3>
          <p className="text-xs text-zinc-300">
            برای دفع این حمله باید کارت{' '}
            <span className="font-bold text-amber-300">
              {requiredCardName === 'missed' ? '«زپلشک!»' : '«بنگ!»'}
            </span>{' '}
            بازی کنید.
          </p>

          {pendingReaction.missedNeeded > 1 && (
            <div className="mt-2 text-xs font-bold text-amber-300 bg-amber-950/70 border border-amber-700/60 rounded-xl p-2">
              ⚠️ شلیک اسلبِ قاتل نیازمند {pendingReaction.missedNeeded} کارت زپلشک! است!
              <div className="text-zinc-300 font-normal mt-0.5">
                (تاکنون {pendingReaction.missedPlayed} از {pendingReaction.missedNeeded} دفاع انجام شده است)
              </div>
            </div>
          )}

          {myPlayer.character?.name === 'calamity_janet' && (
            <div className="mt-2 text-xs font-bold text-cyan-300 bg-cyan-950/80 border border-cyan-600/60 rounded-xl p-2 animate-pulse">
              ⚡ قابلیت کالامیتی جنت: شما می‌توانید هم کارت «بنگ!» و هم «زپلشک!» را برای دفاع انتخاب کنید!
            </div>
          )}
        </div>

        {/* Defense Cards */}
        <div className="mb-6">
          <div className="text-xs font-semibold text-zinc-400 mb-2 text-center">
            کارت‌های دفاعی موجود در دست شما:
          </div>
          {matchingCards.length > 0 ? (
            <div className="flex justify-center gap-3 overflow-x-auto py-2">
              {matchingCards.map((card) => (
                <div key={card.id} className="cursor-pointer hover:scale-105 transition-transform">
                  <CardComponent
                    card={card}
                    size="sm"
                    onClick={() => onRespond('play', card.id)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-saloon-950/60 rounded-xl p-4 text-center text-xs text-red-300 border border-red-900/50">
              هیچ کارت مناسبی برای دفاع در دست ندارید!
            </div>
          )}
        </div>

        {/* Pass Button */}
        <div className="flex justify-center">
          <button
            onClick={() => onRespond('pass')}
            className="w-full bg-red-800 hover:bg-red-700 text-white font-bold text-sm py-2.5 px-4 rounded-xl border border-red-600 transition-colors shadow-lg active:scale-98"
          >
            {pendingReaction.type === 'duel'
              ? 'تسلیم در دوئل و دریافت صدمه (-۱ جان)'
              : 'صدمه دیدن (-۱ جان)'}
          </button>
        </div>
      </div>
    </div>
  );
};
