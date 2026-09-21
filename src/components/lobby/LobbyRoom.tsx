import React, { useState } from 'react';
import { PublicGameState, PublicPlayer } from '@/lib/game-engine/types';

interface LobbyRoomProps {
  gameState: PublicGameState;
  myPlayerId: string;
  onAddBot: () => void;
  onToggleReady: () => void;
  onStartGame: () => void;
  speakingPlayerIds?: string[];
  isVoiceConnected?: boolean;
  onOpenVoiceChat?: () => void;
}

export const LobbyRoom: React.FC<LobbyRoomProps> = ({
  gameState,
  myPlayerId,
  onAddBot,
  onToggleReady,
  onStartGame,
  speakingPlayerIds = [],
  isVoiceConnected = false,
  onOpenVoiceChat,
}) => {
  const [copied, setCopied] = useState(false);
  const myPlayer = gameState.players.find((p) => p.id === myPlayerId);
  const isHost = myPlayer?.isHost || false;
  const canStart = isHost && gameState.players.length >= 4;

  const copyInviteLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-2 sm:p-4 flex flex-col items-center animate-in fade-in duration-300">
      {/* Saloon Header */}
      <div className="text-center mb-2 sm:mb-5">
        <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-amber-500/10 border border-amber-500/30 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-amber-400 text-[11px] sm:text-xs font-bold mb-1 sm:mb-2">
          <span>⭐</span>
          <span>لابی بازی آنلاین غرب وحشی (BANG!)</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-amber-200 font-western tracking-wide">
          اتاق هفت‌تیرکش‌ها
        </h1>
      </div>

      {/* Saloon Voice & Chat Status Banner */}
      <div className="w-full bg-gradient-to-r from-saloon-900 via-amber-950/30 to-saloon-900 border border-amber-600/30 hover:border-amber-500/60 rounded-2xl sm:rounded-3xl p-2.5 sm:p-4 mb-2 sm:mb-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4 transition-all">
        <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-base sm:text-xl shadow-inner shrink-0">
            🎙️
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-xs sm:text-sm font-black text-amber-300 truncate">گفتگوی صوتی و چت سالون</span>
              {isVoiceConnected && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              )}
            </div>
            <div className="text-[10px] sm:text-xs text-zinc-400 truncate sm:whitespace-normal">
              {isVoiceConnected
                ? '✅ به ویس‌چت متصل هستید (صحبت کنید)'
                : 'می‌توانید همین حالا با دوستان خود صحبت و چت کنید.'}
            </div>
          </div>
        </div>

        {onOpenVoiceChat && (
          <button
            onClick={onOpenVoiceChat}
            className={`w-full sm:w-auto text-xs font-bold px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-all shadow active:scale-95 flex items-center justify-center gap-1.5 sm:gap-2 shrink-0 ${
              isVoiceConnected
                ? 'bg-emerald-800 hover:bg-emerald-700 text-white border border-emerald-500/60 shadow-emerald-950/40'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border border-emerald-400 shadow-lg'
            }`}
          >
            <span>{isVoiceConnected ? '⚙️ پنل چت و ویس' : '🎙️ ورود به گفتگوی صوتی'}</span>
          </button>
        )}
      </div>

      {/* Room Code & Share Card */}
      <div className="w-full bg-saloon-900 border border-saloon-700/60 rounded-2xl sm:rounded-3xl p-3 sm:p-5 mb-2 sm:mb-4 shadow-xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="text-[11px] sm:text-xs text-zinc-400">کد اتاق:</div>
          <div className="text-xl sm:text-2xl font-black tracking-wider text-amber-400 font-mono">
            {gameState.roomId}
          </div>
        </div>

        <button
          onClick={copyInviteLink}
          className="bg-saloon-800 hover:bg-saloon-700 text-amber-200 border border-amber-600/40 text-[11px] sm:text-xs font-bold px-3 sm:px-4 py-1.5 sm:py-2.5 rounded-xl transition-all shadow active:scale-95 flex items-center gap-1 shrink-0"
        >
          <span>{copied ? '✅ کپی شد!' : '📋 کپی لینک دعوت'}</span>
        </button>
      </div>

      {/* Players List Grid */}
      <div className="w-full bg-saloon-900 border border-saloon-700/60 rounded-2xl sm:rounded-3xl p-3 sm:p-6 mb-2 sm:mb-4 shadow-xl">
        <div className="flex items-center justify-between mb-2 sm:mb-4 border-b border-saloon-800 pb-2 sm:pb-3">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="font-bold text-xs sm:text-base text-zinc-100">فهرست بازیکنان</span>
            <span className="bg-saloon-800 text-amber-300 text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-semibold">
              {gameState.players.length} از ۷
            </span>
          </div>

          {gameState.players.length < 7 && (
            <button
              onClick={onAddBot}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-600 text-[11px] sm:text-xs px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl transition-all active:scale-95 flex items-center gap-1"
            >
              <span>🤖 افزودن ربات</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 mb-2 sm:mb-4">
          {gameState.players.map((p, index) => {
            const isSpeaking = speakingPlayerIds.includes(p.id);
            return (
              <div
                key={p.id}
                className={`flex items-center justify-between p-2 sm:p-3 rounded-xl sm:rounded-2xl border transition-all ${
                  isSpeaking
                    ? 'ring-2 ring-emerald-400 bg-emerald-950/40 border-emerald-500/80 shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-pulse'
                    : p.id === myPlayerId
                    ? 'bg-amber-950/40 border-amber-500/50 shadow-md'
                    : 'bg-saloon-950/50 border-saloon-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full border flex items-center justify-center text-sm relative transition-all ${
                      isSpeaking
                        ? 'bg-emerald-900 border-emerald-400 text-emerald-200'
                        : 'bg-saloon-800 border-saloon-700'
                    }`}
                  >
                    {p.isBot ? '🤖' : '🤠'}
                    {isSpeaking && (
                      <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border border-saloon-950 rounded-full flex items-center justify-center text-[8px] animate-pulse">
                        🎙️
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-zinc-200 flex items-center gap-1">
                      <span>{p.name}</span>
                      {p.isHost && <span title="میزبان">👑</span>}
                      {p.id === myPlayerId && (
                        <span className="text-[10px] text-amber-400">(شما)</span>
                      )}
                    </div>
                    <div className="text-[10px] text-zinc-400">صندلی #{index + 1}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {isSpeaking && (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 border border-emerald-500/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span>صحبت...</span>
                    </span>
                  )}
                  {p.isReady ? (
                    <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800 px-2 py-0.5 rounded-full">
                      آماده ✅
                    </span>
                  ) : (
                    <span className="text-[11px] text-zinc-500 bg-zinc-800/40 px-2 py-0.5 rounded-full">
                      در انتظار
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Empty Slots */}
          {Array.from({ length: 7 - gameState.players.length }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-center p-3 rounded-2xl border border-dashed border-saloon-800 text-zinc-600 text-xs"
            >
              صندلی خالی (در انتظار بازیکن)
            </div>
          ))}
        </div>

        {gameState.players.length < 4 && (
          <div className="bg-amber-900/20 text-amber-300 border border-amber-700/30 p-3 rounded-xl text-xs text-center">
            💡 برای شروع بازی حداقل به ۴ بازیکن نیاز است. می‌توانید با زدن دکمه «افزودن ربات» جایگاه‌های خالی را پر کنید.
          </div>
        )}
      </div>

      {/* Lobby Controls */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={onToggleReady}
          className={`w-full sm:w-auto px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg active:scale-95 ${
            myPlayer?.isReady
              ? 'bg-zinc-800 text-zinc-300 border border-zinc-600'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400'
          }`}
        >
          {myPlayer?.isReady ? 'لغو آماده‌باش ❌' : 'اعلام آمادگی (Ready) ✅'}
        </button>

        {isHost && (
          <button
            onClick={onStartGame}
            disabled={!canStart}
            className={`w-full sm:w-auto px-8 py-3 rounded-2xl font-black text-sm transition-all shadow-xl active:scale-95 ${
              canStart
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-saloon-950 border border-amber-300 scale-105'
                : 'bg-zinc-800 text-zinc-600 border border-zinc-700 cursor-not-allowed opacity-50'
            }`}
          >
            شروع بازی وسترن (Start Game) 🎯
          </button>
        )}
      </div>
    </div>
  );
};
