import React, { useMemo } from 'react';
import { PublicGameState, PublicPlayer, Card, ActionEffect } from '@/lib/game-engine/types';
import { PlayerSeat } from './PlayerSeat';
import { CardComponent } from './CardComponent';
import { ActionAnimationOverlay } from './ActionAnimationOverlay';
import { canShootTarget, calculateEffectiveDistance } from '@/lib/game-engine/distance';

interface WesternTableProps {
  gameState: PublicGameState;
  myPlayerId: string;
  selectedCard: Card | null;
  onSelectTarget: (targetPlayerId: string) => void;
  onInspectPlayer?: (player: PublicPlayer) => void;
  onInspectCard?: (card: Card) => void;
  activeEffect?: ActionEffect | null;
  tableScale?: number;
  maxWidthClass?: string;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetZoom?: () => void;
}

export const WesternTable: React.FC<WesternTableProps> = ({
  gameState,
  myPlayerId,
  selectedCard,
  onSelectTarget,
  onInspectPlayer,
  onInspectCard,
  activeEffect,
  tableScale = 1,
  maxWidthClass,
  onZoomIn,
  onZoomOut,
  onResetZoom,
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
    <div className="relative w-full flex-1 flex flex-col items-center justify-center py-2 sm:py-6 px-1 sm:px-4 min-h-[440px] sm:min-h-[600px] overflow-hidden">
      {/* Zoom / Scale Mini Toolbar at Top Right */}
      {(onZoomIn || onZoomOut) && (
        <div className="absolute top-2 right-2 sm:right-4 z-30 flex items-center gap-1.5 bg-saloon-900/85 border border-saloon-700/80 rounded-2xl px-2.5 py-1 backdrop-blur-md shadow-lg text-xs select-none">
          <span className="text-[10px] text-zinc-400 font-bold hidden sm:inline">اندازه میز:</span>
          <button
            type="button"
            onClick={onZoomOut}
            className="w-6 h-6 rounded-lg bg-saloon-800 hover:bg-saloon-700 active:scale-95 text-zinc-200 hover:text-amber-300 font-black flex items-center justify-center transition-all text-xs"
            title="کوچک‌تر کردن میز و کارت‌ها (-)"
          >
            🔍−
          </button>
          <span className="text-[11px] font-mono font-black text-amber-400 min-w-[34px] text-center">
            {Math.round((tableScale || 1) * 100)}%
          </span>
          <button
            type="button"
            onClick={onZoomIn}
            className="w-6 h-6 rounded-lg bg-saloon-800 hover:bg-saloon-700 active:scale-95 text-zinc-200 hover:text-amber-300 font-black flex items-center justify-center transition-all text-xs"
            title="بزرگ‌تر کردن میز و کارت‌ها (+)"
          >
            🔍+
          </button>
          {onResetZoom && (
            <button
              type="button"
              onClick={onResetZoom}
              className="text-[10px] text-zinc-500 hover:text-zinc-300 px-1 py-0.5 rounded transition-colors"
              title="ریست اندازه میز به حالت خودکار"
            >
              ↺
            </button>
          )}
        </div>
      )}

      {/* Outer Table Arena Container with Dynamic Size and Scale */}
      <div
        className={`relative w-full ${maxWidthClass || 'max-w-5xl'} h-full min-h-[440px] sm:min-h-[580px] flex items-center justify-center transition-all duration-300 origin-center`}
        style={{
          transform: `scale(${tableScale || 1})`,
        }}
      >
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

        {/* Action Animation Overlay - CENTERED EXACTLY IN THE TABLE FELT! */}
        <ActionAnimationOverlay
          effect={activeEffect || gameState.lastEffect || null}
          containerMode="table"
        />
      </div>
    </div>
  );
};
