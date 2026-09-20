import React, { useMemo } from 'react';
import { PublicGameState, PublicPlayer, Card } from '@/lib/game-engine/types';
import { PlayerSeat } from './PlayerSeat';
import { CardComponent } from './CardComponent';
import { canShootTarget, calculateEffectiveDistance } from '@/lib/game-engine/distance';

interface WesternTableProps {
  gameState: PublicGameState;
  myPlayerId: string;
  selectedCard: Card | null;
  onSelectTarget: (targetPlayerId: string) => void;
  onInspectPlayer?: (player: PublicPlayer) => void;
  onInspectCard?: (card: Card) => void;
}

export const WesternTable: React.FC<WesternTableProps> = ({
  gameState,
  myPlayerId,
  selectedCard,
  onSelectTarget,
  onInspectPlayer,
  onInspectCard,
}) => {
  const myPlayer = gameState.players.find((p) => p.id === myPlayerId);

  // Order players starting from myPlayer at index 0, followed by clockwise order around the table
  const orderedPlayers = useMemo(() => {
    const all = [...gameState.players];
    const myIndex = all.findIndex((p) => p.id === myPlayerId);
    if (myIndex === -1) return all;
    return [...all.slice(myIndex), ...all.slice(0, myIndex)];
  }, [gameState.players, myPlayerId]);

  // Check which players can be targeted by the selected card
  const isTargetable = (target: PublicPlayer): boolean => {
    if (!selectedCard || !myPlayer || myPlayer.isEliminated || target.isEliminated || target.id === myPlayerId) {
      return false;
    }

    // Bang or Calamity Janet using Missed as Bang
    const isBangCard =
      selectedCard.name === 'bang' ||
      (myPlayer.character?.name === 'calamity_janet' && selectedCard.name === 'missed');

    if (isBangCard) {
      const mockState = {
        players: gameState.players.map((p) => ({
          ...p,
          hand: [],
        })),
      } as any;
      return canShootTarget(mockState, myPlayerId, target.id);
    }

    if (selectedCard.name === 'panic') {
      const mockState = {
        players: gameState.players.map((p) => ({
          ...p,
          hand: [],
        })),
      } as any;
      const dist = calculateEffectiveDistance(mockState, myPlayerId, target.id);
      return dist <= 1;
    }

    if (selectedCard.name === 'cat_balou' || selectedCard.name === 'duel') {
      return true; // Any distance!
    }

    if (selectedCard.name === 'jail') {
      return target.role !== 'sheriff' && !target.equipment.jail;
    }

    return false;
  };

  const getEffectiveDistanceForPlayer = (target: PublicPlayer): number | undefined => {
    if (!myPlayer || myPlayer.isEliminated || target.isEliminated || target.id === myPlayerId) {
      return undefined;
    }
    const mockState = {
      players: gameState.players.map((p) => ({
        ...p,
        hand: [],
      })),
    } as any;
    const dist = calculateEffectiveDistance(mockState, myPlayerId, target.id);
    return dist >= 900 ? undefined : dist;
  };

  const totalPlayers = orderedPlayers.length;

  return (
    <div className="relative w-full flex-1 flex items-center justify-center py-3 sm:py-10 px-1 sm:px-6 min-h-[480px] sm:min-h-[660px]">
      {/* Outer Table Arena Container */}
      <div className="relative w-full max-w-5xl h-full min-h-[460px] sm:min-h-[600px] flex items-center justify-center">
        {/* The Oval Poker/Western Table Base */}
        <div className="absolute inset-2 sm:inset-10 western-felt rounded-[60px] sm:rounded-[200px] border-[8px] sm:border-[22px] border-[#361f14] outline outline-2 sm:outline-4 outline-amber-950/80 shadow-[inset_0_0_80px_rgba(0,0,0,0.85),0_25px_60px_rgba(0,0,0,0.9)] flex items-center justify-center overflow-hidden z-0">
          {/* Subtle felt rings & wood inlay watermark */}
          <div className="absolute inset-4 sm:inset-10 rounded-[50px] sm:rounded-[180px] border border-emerald-500/10 pointer-events-none" />

          {/* Table Center Features */}
          <div className="flex items-center justify-center gap-3 sm:gap-12 z-10 select-none">
            {/* Draw Deck Stack */}
            <div className="flex flex-col items-center">
              <div className="relative w-12 sm:w-20 aspect-[2/3] bg-gradient-to-b from-amber-950 via-amber-900 to-amber-950 border-2 border-amber-600/70 rounded-xl shadow-2xl flex flex-col items-center justify-center p-1 sm:p-2 text-center transform -rotate-1 hover:rotate-0 transition-transform">
                <div className="absolute -top-1 -right-1 w-full h-full border border-amber-500/30 rounded-xl bg-amber-950/40 -z-10 transform rotate-2" />
                <span className="text-base sm:text-2xl mb-0.5 sm:mb-1">🃏</span>
                <span className="text-[8px] sm:text-[10px] font-black text-amber-200">مخزن</span>
                <span className="text-[9px] sm:text-xs font-bold text-amber-400">
                  {gameState.deckCount}
                </span>
              </div>
            </div>

            {/* Central Bang! Emblem - Hidden on mobile to keep felt clear */}
            <div className="hidden sm:flex text-center opacity-35 flex-col items-center pointer-events-none">
              <span className="text-3xl sm:text-4xl text-amber-400">⭐</span>
              <div className="text-2xl sm:text-4xl font-black tracking-widest text-amber-400 font-western">
                BANG!
              </div>
              <div className="text-[10px] sm:text-xs font-bold text-amber-300">
                غرب وحشی
              </div>
            </div>

            {/* Discard Pile */}
            <div className="flex flex-col items-center">
              {gameState.topDiscard ? (
                <div
                  className="transform rotate-3 shadow-2xl hover:rotate-0 transition-transform cursor-pointer"
                  onClick={() => onInspectCard?.(gameState.topDiscard!)}
                  title="کلیک برای مشاهده توضیحات کامل کارت"
                >
                  <CardComponent card={gameState.topDiscard} size="sm" isPlayable={false} />
                </div>
              ) : (
                <div className="w-12 sm:w-20 aspect-[2/3] border-2 border-dashed border-emerald-800/40 rounded-xl flex items-center justify-center text-[8px] sm:text-[10px] text-emerald-300/40 text-center p-1">
                  کارت‌های سوخته
                </div>
              )}
              <span className="text-[8px] sm:text-[10px] text-emerald-400/60 mt-1 font-semibold">
                سوخته
              </span>
            </div>
          </div>
        </div>

        {/* Players Seated Radially Around the Table Perimeter */}
        {orderedPlayers.map((player, index) => {
          // Angle in radians:
          // index 0 (myPlayer) is at PI/2 = 90 deg (Bottom Center)
          // other players are distributed clockwise
          const angle = Math.PI / 2 + (2 * Math.PI * index) / totalPlayers;

          // Safe Elliptical radii percentage from center:
          const rx = 36;
          const ry = 30;

          const leftPercent = 50 + rx * Math.cos(angle);
          const topPercent = 50 + ry * Math.sin(angle);

          const isMe = player.id === myPlayerId;
          const isTarget = isTargetable(player);
          const actionType = isTarget ? (
            selectedCard?.name === 'jail'
              ? 'jail'
              : selectedCard?.name === 'panic'
              ? 'panic'
              : selectedCard?.name === 'cat_balou'
              ? 'cat_balou'
              : selectedCard?.name === 'duel'
              ? 'duel'
              : 'bang'
          ) : null;

          return (
            <div
              key={player.id}
              className="absolute transition-all duration-500 ease-out"
              style={{
                left: `${leftPercent}%`,
                top: `${topPercent}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <PlayerSeat
                player={player}
                isMe={isMe}
                isCurrentTurn={gameState.currentTurnPlayerId === player.id}
                isTargetable={isTarget}
                targetActionType={actionType}
                effectiveDistance={isMe ? undefined : getEffectiveDistanceForPlayer(player)}
                onSelectTarget={() => onSelectTarget(player.id)}
                onInspect={onInspectPlayer}
                compact={true}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
