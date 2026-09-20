import React, { useEffect, useRef, useState, useMemo } from 'react';
import { GameLog as GameLogType, PublicPlayer } from '@/lib/game-engine/types';

interface GameLogProps {
  logs: GameLogType[];
  players?: PublicPlayer[];
  myPlayerId?: string;
  onClose?: () => void;
  className?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onResizeStep?: (delta: number) => void;
  currentWidth?: number;
}

export const GameLog: React.FC<GameLogProps> = ({
  logs,
  players = [],
  myPlayerId,
  onClose,
  className = '',
  isCollapsed = false,
  onToggleCollapse,
  onResizeStep,
  currentWidth,
}) => {
  const [filterPlayerId, setFilterPlayerId] = useState<string>('all');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom whenever logs change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [logs.length, filterPlayerId]);

  const selectedPlayer = useMemo(() => {
    if (filterPlayerId === 'all') return null;
    return players.find((p) => p.id === filterPlayerId) || null;
  }, [filterPlayerId, players]);

  // Filter logs based on selected player
  const filteredLogs = useMemo(() => {
    if (filterPlayerId === 'all') return logs;
    if (!selectedPlayer) return logs;

    const playerName = selectedPlayer.name.trim();

    return logs.filter((log) => {
      // Direct ID match
      if (log.playerId && log.playerId === filterPlayerId) return true;
      if (log.targetPlayerId && log.targetPlayerId === filterPlayerId) return true;

      // Text mentions the player name
      if (playerName && log.text.includes(playerName)) return true;

      return false;
    });
  }, [logs, filterPlayerId, selectedPlayer]);

  const isTurnStartLog = (log: GameLogType) => {
    return (
      log.type === 'turn' ||
      (log.text.includes('نوبت') && log.text.includes('فرا رسید'))
    );
  };

  const getLogColor = (type: GameLogType['type']) => {
    switch (type) {
      case 'attack':
        return 'text-red-300 border-r-2 border-red-500 bg-red-950/30';
      case 'heal':
        return 'text-emerald-300 border-r-2 border-emerald-500 bg-emerald-950/30';
      case 'defense':
        return 'text-cyan-300 border-r-2 border-cyan-500 bg-cyan-950/30';
      case 'equip':
        return 'text-blue-300 border-r-2 border-blue-500 bg-blue-950/30';
      case 'death':
        return 'text-rose-400 font-bold border-r-2 border-rose-600 bg-rose-950/40';
      case 'win':
        return 'text-amber-300 font-black border-r-2 border-amber-500 bg-amber-950/50 text-sm';
      default:
        return 'text-zinc-300 border-r-2 border-saloon-700 bg-saloon-900/40';
    }
  };

  if (isCollapsed) {
    return (
      <div
        onClick={onToggleCollapse}
        className={`bg-saloon-950/92 border border-saloon-800 hover:border-amber-500/70 rounded-3xl p-2 flex flex-col items-center justify-between shadow-2xl backdrop-blur-md cursor-pointer transition-all hover:bg-saloon-900 group ${
          className || 'h-full min-h-[440px] max-h-[620px] w-12'
        }`}
        title="کلیک برای باز کردن وقایع‌نگار سالون"
      >
        <div className="flex flex-col items-center gap-3 pt-2">
          <span className="text-lg group-hover:scale-110 transition-transform">📜</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse?.();
            }}
            className="w-6 h-6 rounded-full bg-saloon-800 hover:bg-amber-600 text-amber-300 hover:text-white flex items-center justify-center text-[10px] font-bold transition-all shadow"
            title="باز کردن وقایع"
          >
            ▶
          </button>
          <span className="text-[10px] font-bold text-amber-400 [writing-mode:vertical-lr] tracking-widest my-2 select-none">
            وقایع‌نگار
          </span>
        </div>
        <div className="flex flex-col items-center pb-2">
          <span className="text-[9px] bg-amber-950 text-amber-300 border border-amber-600/50 px-1.5 py-0.5 rounded-full font-mono font-bold">
            {filteredLogs.length}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-saloon-950/92 border border-saloon-800 rounded-3xl p-3 sm:p-4 flex flex-col shadow-2xl backdrop-blur-md select-none ${
        className || 'h-72 sm:h-80 lg:h-full lg:min-h-[440px] lg:max-h-[620px]'
      }`}
    >
      {/* Header Bar */}
      <div className="pb-2.5 border-b border-saloon-800/80 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">📜</span>
            <span className="text-xs sm:text-sm font-black text-amber-300 truncate">
              وقایع‌نگار سالون
            </span>
            <span className="text-[9px] bg-emerald-950/90 text-emerald-400 border border-emerald-700/60 px-2 py-0.2 rounded-full font-bold animate-pulse hidden sm:inline">
              زنده
            </span>
          </div>
          <div className="flex items-center gap-1">
            {onResizeStep && (
              <div className="hidden sm:flex items-center gap-0.5 bg-saloon-900 border border-saloon-800 rounded-lg p-0.5 mr-1">
                <button
                  type="button"
                  onClick={() => onResizeStep(-40)}
                  className="w-5 h-5 flex items-center justify-center rounded hover:bg-saloon-800 text-zinc-400 hover:text-amber-300 text-xs font-bold transition-colors"
                  title="کوچک‌تر کردن پنجره وقایع (-)"
                >
                  −
                </button>
                <button
                  type="button"
                  onClick={() => onResizeStep(40)}
                  className="w-5 h-5 flex items-center justify-center rounded hover:bg-saloon-800 text-zinc-400 hover:text-amber-300 text-xs font-bold transition-colors"
                  title="بزرگ‌تر کردن پنجره وقایع (+)"
                >
                  +
                </button>
              </div>
            )}
            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="w-6 h-6 rounded-lg bg-saloon-900 hover:bg-saloon-800 border border-saloon-700 text-zinc-400 hover:text-amber-300 flex items-center justify-center text-[10px] transition-colors"
                title="جمع کردن وقایع‌نگار"
              >
                ◀
              </button>
            )}
            <span className="text-[10px] text-zinc-400 bg-saloon-900 border border-saloon-800 px-2 py-0.5 rounded-lg font-medium">
              {filteredLogs.length}
            </span>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-saloon-900 hover:bg-saloon-800 border border-saloon-700 text-zinc-400 hover:text-white flex items-center justify-center text-xs transition-colors"
                title="بستن پنجره وقایع"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Player Filter Bar ("فقط کارهای یه نفر رو نشون بده") */}
        {players.length > 0 && (
          <div className="flex flex-col gap-1.5 pt-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-amber-400/90 font-bold shrink-0 flex items-center gap-1">
                <span>🔍</span>
                <span>فیلتر:</span>
              </span>
              <select
                value={filterPlayerId}
                onChange={(e) => setFilterPlayerId(e.target.value)}
                className="flex-1 bg-saloon-900/95 border border-amber-600/50 hover:border-amber-500 text-amber-200 text-[11px] font-bold rounded-xl px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-amber-500 transition-all cursor-pointer truncate"
              >
                <option value="all">🌐 همه وقایع (تمام بازیکنان)</option>
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.isBot ? '🤖' : '🤠'} {p.name}{' '}
                    {p.id === myPlayerId ? '(شما)' : ''}{' '}
                    {p.isEliminated ? '💀' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Filter Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setFilterPlayerId('all')}
                className={`text-[10px] px-2 py-0.5 rounded-lg font-bold border transition-all ${
                  filterPlayerId === 'all'
                    ? 'bg-amber-600 text-saloon-950 border-amber-400 shadow-sm'
                    : 'bg-saloon-900 hover:bg-saloon-850 text-zinc-400 border-saloon-800'
                }`}
              >
                همه وقایع
              </button>
              {myPlayerId && (
                <button
                  onClick={() => setFilterPlayerId(myPlayerId)}
                  className={`text-[10px] px-2 py-0.5 rounded-lg font-bold border transition-all ${
                    filterPlayerId === myPlayerId
                      ? 'bg-amber-600 text-saloon-950 border-amber-400 shadow-sm'
                      : 'bg-saloon-900 hover:bg-saloon-850 text-amber-300 border-saloon-800'
                  }`}
                >
                  🤠 فقط کارهای من
                </button>
              )}
              {filterPlayerId !== 'all' && (
                <button
                  onClick={() => setFilterPlayerId('all')}
                  className="text-[10px] text-zinc-400 hover:text-amber-400 mr-auto transition-colors"
                >
                  ✕ حذف فیلتر
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Logs Stream */}
      <div className="flex-1 overflow-y-auto space-y-2 pt-2.5 pr-1 scrollbar-thin text-xs">
        {filteredLogs.length === 0 ? (
          <div className="h-full min-h-[140px] flex flex-col items-center justify-center text-center p-4 text-zinc-400">
            <span className="text-3xl mb-1.5">🏜️</span>
            <span className="text-xs font-bold text-zinc-300">
              هیچ واقعه‌ای برای «{selectedPlayer?.name || 'این بازیکن'}» ثبت نشده است.
            </span>
            <button
              onClick={() => setFilterPlayerId('all')}
              className="mt-2.5 text-[11px] bg-saloon-900 hover:bg-saloon-850 text-amber-400 border border-amber-600/40 px-3 py-1 rounded-xl transition-all font-bold"
            >
              نمایش همه وقایع بازی
            </button>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isTurn = isTurnStartLog(log);

            if (isTurn) {
              // Clean Turn Divider with Western Styling
              const cleanTurnText = log.text.replace('🎯 ', '').trim();
              return (
                <div key={log.id} className="my-3 py-1 flex items-center justify-center gap-2">
                  <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-amber-600/40 to-amber-500/70" />
                  <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-saloon-900 border border-amber-500/60 shadow-md text-amber-300 shrink-0 animate-in fade-in zoom-in-95">
                    <span className="text-xs">⏳</span>
                    <span className="text-[10px] sm:text-[11px] font-black tracking-wide">
                      {cleanTurnText}
                    </span>
                    <span className="text-xs">⭐</span>
                  </div>
                  <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent via-amber-600/40 to-amber-500/70" />
                </div>
              );
            }

            // Normal Log Entry
            return (
              <div
                key={log.id}
                className={`py-1.5 px-2.5 rounded-xl leading-relaxed transition-all duration-150 shadow-sm ${getLogColor(
                  log.type
                )}`}
              >
                {log.text}
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
