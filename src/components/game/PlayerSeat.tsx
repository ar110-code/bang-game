import React, { useState } from 'react';
import { PublicPlayer } from '@/lib/game-engine/types';
import { BulletIndicator } from '../ui/BulletIndicator';

export type TargetActionType = 'bang' | 'jail' | 'panic' | 'cat_balou' | 'duel' | null;

interface PlayerSeatProps {
  player: PublicPlayer;
  isMe: boolean;
  isCurrentTurn: boolean;
  isTargetable?: boolean;
  targetActionType?: TargetActionType;
  effectiveDistance?: number;
  onSelectTarget?: () => void;
  onInspect?: (player: PublicPlayer) => void;
  compact?: boolean;
}

export const PlayerSeat: React.FC<PlayerSeatProps> = ({
  player,
  isMe,
  isCurrentTurn,
  isTargetable = false,
  targetActionType = null,
  effectiveDistance,
  onSelectTarget,
  onInspect,
  compact = false,
}) => {
  const isDead = player.isEliminated;
  const [charImgError, setCharImgError] = useState(false);
  const [roleImgError, setRoleImgError] = useState(false);

  // Role visibility: Sheriff is always known to everyone.
  // Other roles are only visible to the player themselves, or once dead.
  const isRoleKnown =
    player.role === 'sheriff' || isMe || isDead || (player.role !== 'hidden' && player.role !== undefined);

  const getRoleTitle = (role: string) => {
    switch (role) {
      case 'sheriff':
        return { label: 'کلانتر ⭐', color: 'text-amber-400 bg-amber-950/85 border-amber-500/50' };
      case 'deputy':
        return { label: 'معاون 🛡️', color: 'text-blue-300 bg-blue-950/85 border-blue-500/50' };
      case 'outlaw':
        return { label: 'یاغی 💀', color: 'text-red-300 bg-red-950/85 border-red-500/50' };
      case 'renegade':
        return { label: 'خائن 🐍', color: 'text-purple-300 bg-purple-950/85 border-purple-500/50' };
      default:
        return { label: 'نقش مخفی ❓', color: 'text-zinc-300 bg-zinc-950/85 border-zinc-700/50' };
    }
  };

  const roleInfo = getRoleTitle(isRoleKnown ? player.role : 'hidden');

  // Thematic configuration for different targetable actions (Jail, Bang, Panic, etc.)
  const getTargetConfig = () => {
    switch (targetActionType) {
      case 'jail':
        return {
          label: 'به هلفدونی',
          icon: '🔒',
          btnClass:
            'bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-700 hover:from-blue-600 hover:to-indigo-600 text-white border-blue-400/80 shadow-md shadow-blue-950/60',
          seatHighlight:
            'ring-2 ring-blue-400 shadow-[0_0_24px_rgba(96,165,250,0.55)] border-blue-500',
        };
      case 'panic':
        return {
          label: 'سرقت کارت',
          icon: '💰',
          btnClass:
            'bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 hover:from-amber-500 hover:to-yellow-400 text-saloon-950 border-amber-300 shadow-md shadow-amber-950/60',
          seatHighlight:
            'ring-2 ring-amber-400 shadow-[0_0_24px_rgba(251,191,36,0.55)] border-amber-400',
        };
      case 'cat_balou':
        return {
          label: 'سوزاندن کارت',
          icon: '🔥',
          btnClass:
            'bg-gradient-to-r from-orange-600 via-red-600 to-orange-600 hover:from-orange-500 hover:to-red-500 text-white border-orange-400 shadow-md shadow-orange-950/60',
          seatHighlight:
            'ring-2 ring-orange-500 shadow-[0_0_24px_rgba(249,115,22,0.55)] border-orange-500',
        };
      case 'duel':
        return {
          label: 'دوئل',
          icon: '⚔️',
          btnClass:
            'bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-700 hover:from-purple-600 hover:to-indigo-600 text-white border-purple-400 shadow-md shadow-purple-950/60',
          seatHighlight:
            'ring-2 ring-purple-500 shadow-[0_0_24px_rgba(168,85,247,0.55)] border-purple-500',
        };
      case 'bang':
      default:
        return {
          label: 'شلیک',
          icon: '🎯',
          btnClass:
            'bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white border-red-300 shadow-md shadow-red-950/60',
          seatHighlight:
            'ring-2 ring-red-500 shadow-[0_0_24px_rgba(239,68,68,0.55)] border-red-500',
        };
    }
  };

  const targetConfig = isTargetable ? getTargetConfig() : null;

  return (
    <div
      onClick={isTargetable ? onSelectTarget : () => onInspect?.(player)}
      className={`relative flex flex-col p-1 sm:p-2 rounded-2xl transition-all duration-200 select-none z-20 ${
        compact ? 'w-[114px] sm:w-56' : 'w-32 sm:w-60'
      } ${
        isCurrentTurn
          ? 'bg-saloon-900/95 ring-2 ring-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.4)] border-amber-500'
          : 'bg-saloon-950/92 border border-saloon-700/80 shadow-xl'
      } ${isDead ? 'opacity-40 grayscale' : 'cursor-pointer hover:border-amber-600/80'} ${
        isTargetable && targetConfig ? targetConfig.seatHighlight : ''
      }`}
    >
      {/* Top Main Row in RTL: 
          1st Child (Right side): 2:3 Role Card
          2nd Child (Center): Info, Bullets, Turn Badge, Target Action
          3rd Child (Left side): 2:3 Character Card
      */}
      <div className="flex items-center justify-between gap-1 w-full">
        {/* RIGHT SIDE (First in RTL): 2:3 Role Card */}
        <div
          className="relative w-8 h-[48px] sm:w-11 sm:h-[66px] rounded-lg sm:rounded-xl overflow-hidden border border-amber-600/70 shadow-md shrink-0 bg-saloon-900 self-center"
          title={isRoleKnown ? `نقش: ${roleInfo.label}` : 'نقش مخفی بازیکن'}
        >
          {isRoleKnown && !roleImgError ? (
            <img
              src={`/assets/roles/${player.role}.jpg`}
              alt={roleInfo.label}
              className="w-full h-full object-cover"
              onError={() => setRoleImgError(true)}
            />
          ) : (
            <img
              src="/assets/cards/back_role.jpg"
              alt="نقش مخفی"
              className="w-full h-full object-cover"
            />
          )}
          {/* Role Title Overlay Badge */}
          <div
            className={`absolute inset-x-0 bottom-0 backdrop-blur-sm text-[7px] sm:text-[9px] font-black text-center py-0.2 sm:py-0.5 truncate px-0.5 border-t ${roleInfo.color}`}
          >
            {roleInfo.label}
          </div>
        </div>

        {/* CENTER COLUMN: Name, Bullets, Turn Badge, and Target Action */}
        <div className="flex-1 flex flex-col items-center justify-between text-center px-0.5 min-w-0 py-0.5">
          {/* Name & Bot/Player Indicator */}
          <div className="flex items-center gap-0.5 sm:gap-1 justify-center max-w-full truncate">
            <span className="text-[10px] sm:text-xs">{player.isBot ? '🤖' : '🤠'}</span>
            <span className="font-black text-[9px] sm:text-xs truncate max-w-[42px] sm:max-w-[100px] text-zinc-100">
              {player.name}
            </span>
            {isMe && <span className="text-[8px] sm:text-[9px] font-bold text-amber-400 shrink-0">(شما)</span>}
          </div>

          {/* Turn Indicator or Active Status */}
          {isCurrentTurn ? (
            <span className="bg-amber-500 text-saloon-950 px-1.5 py-0.2 rounded-full text-[7px] sm:text-[9px] font-black animate-pulse shadow-sm">
              نوبت
            </span>
          ) : (
            <div className="h-2.5 sm:h-3" />
          )}

          {/* Health Bullets */}
          <div className="scale-[0.65] sm:scale-90 origin-center my-0 sm:my-0.5">
            <BulletIndicator currentHp={player.currentHp} maxHp={player.maxHp} size="sm" />
          </div>

          {/* Hand Count and Effective Distance Badges */}
          <div className="flex items-center gap-0.5 sm:gap-1 justify-center flex-wrap">
            <span className="text-[7px] sm:text-[9px] text-amber-200/90 bg-saloon-900/90 px-1 py-0.2 sm:px-1.5 sm:py-0.5 rounded border border-saloon-800 font-bold">
              🃏 {player.handCount}
            </span>
            {effectiveDistance !== undefined && effectiveDistance > 0 && effectiveDistance < 900 && !isMe && !isDead && (
              <span className="text-[7px] sm:text-[9px] text-amber-300 bg-amber-950/90 border border-amber-600/50 px-1 py-0.2 sm:px-1.5 sm:py-0.5 rounded font-bold">
                🎯 {effectiveDistance}
              </span>
            )}
          </div>

          {/* Clean, Thematic Target Action Button (No aggressive bouncing or stretching!) */}
          {isTargetable && targetConfig && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelectTarget?.();
              }}
              className={`w-full mt-0.5 font-black text-[8px] sm:text-xs py-0.5 sm:py-1 px-1 rounded sm:rounded-lg shadow border flex items-center justify-center gap-0.5 transition-all duration-150 active:scale-95 ${targetConfig.btnClass}`}
            >
              <span>{targetConfig.icon}</span>
              <span className="truncate">{targetConfig.label}</span>
            </button>
          )}
        </div>

        {/* LEFT SIDE (Last in RTL): 2:3 Character Card */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            onInspect?.(player);
          }}
          className="relative w-8 h-[48px] sm:w-11 sm:h-[66px] rounded-lg sm:rounded-xl overflow-hidden border border-amber-600/70 shadow-md shrink-0 bg-saloon-900 group cursor-pointer self-center"
          title={`کاراکتر: ${player.character?.nameFa || 'ناشناس'} (برای جزئیات کلیک کنید)`}
        >
          {player.character && !charImgError ? (
            <img
              src={`/assets/characters/${player.character.name}.jpg`}
              alt={player.character.nameFa}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => setCharImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-saloon-950 text-amber-400 p-0.5 text-center">
              <span className="text-base">{player.isBot ? '🤖' : '🤠'}</span>
            </div>
          )}
          {/* Character Name Overlay Badge */}
          {player.character && (
            <div className="absolute inset-x-0 bottom-0 bg-black/85 backdrop-blur-sm text-[7px] sm:text-[9px] font-black text-amber-300 text-center py-0.2 sm:py-0.5 truncate px-0.5 border-t border-amber-500/30">
              {player.character.nameFa}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section: Character Ability Summary */}
      {player.character && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            onInspect?.(player);
          }}
          className="w-full bg-saloon-900/90 hover:bg-saloon-850 hover:border-amber-500/70 rounded-md sm:rounded-lg py-0.2 sm:py-0.5 px-1 sm:px-2 mt-1 text-center border border-saloon-800 cursor-pointer group transition-all"
          title={`قابلیت ${player.character.nameFa}: ${player.character.descFa}`}
        >
          <span className="text-[8px] sm:text-[10px] text-amber-300 font-bold truncate block">
            ⚡ {player.character.descFa || player.character.titleFa}
          </span>
        </div>
      )}

      {/* Bottom Section: Equipped Blue Cards & Equipment */}
      <div className="flex flex-wrap gap-0.5 sm:gap-1 items-center justify-center mt-1 w-full min-h-[14px]">
        {player.equipment.weapon && (
          <span
            className="bg-blue-900/90 text-blue-200 border border-blue-600/70 px-1 py-0.2 rounded text-[7px] sm:text-[9px] font-bold"
            title={`اسلحه: ${player.equipment.weapon.titleFa} (برد ${player.equipment.weapon.range})`}
          >
            🔫 برد {player.equipment.weapon.range}
          </span>
        )}
        {player.equipment.mustang && (
          <span
            className="bg-amber-900/90 text-amber-200 border border-amber-600/70 px-1 py-0.2 rounded text-[7px] sm:text-[9px] font-bold"
            title="اسب موستانگ (+۱ فاصله از سایرین)"
          >
            🐎 موستانگ
          </span>
        )}
        {player.equipment.appaloosa && (
          <span
            className="bg-cyan-900/90 text-cyan-200 border border-cyan-600/70 px-1 py-0.2 rounded text-[7px] sm:text-[9px] font-bold"
            title="اسب آپالوزا (-۱ فاصله دید به سایرین)"
          >
            🔍 آپالوزا
          </span>
        )}
        {player.equipment.barrel && (
          <span
            className="bg-stone-800/90 text-stone-200 border border-stone-600 px-1 py-0.2 rounded text-[7px] sm:text-[9px] font-bold"
            title="بشکه دفاعی (شانس دل برای دفع شلیک)"
          >
            🛡️ بشکه
          </span>
        )}
        {player.equipment.jail && (
          <span
            className="bg-red-900/90 text-red-200 border border-red-600 px-1 py-0.2 rounded text-[7px] sm:text-[9px] font-bold animate-pulse"
            title="زندانی در هلفدونی"
          >
            🔒 زندان
          </span>
        )}
        {player.equipment.dynamite && (
          <span
            className="bg-orange-900/90 text-orange-200 border border-orange-500 px-1 py-0.2 rounded text-[7px] sm:text-[9px] font-bold animate-bounce"
            title="دینامیت فعال"
          >
            🧨 دینامیت
          </span>
        )}
      </div>
    </div>
  );
};
