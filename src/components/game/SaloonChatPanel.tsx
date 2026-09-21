import React, { useState, useEffect, useRef } from 'react';
import { PublicPlayer, ChatMessage } from '@/lib/game-engine/types';
import { getSocket } from '@/lib/socket/client';
import { useWebRTCVoice } from '@/lib/hooks/useWebRTCVoice';

export type WebRTCVoiceController = ReturnType<typeof useWebRTCVoice>;

interface SaloonChatPanelProps {
  roomId: string;
  myPlayerId: string;
  playerName: string;
  players: PublicPlayer[];
  currentWidth: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onClose?: () => void;
  onResizeStep: (delta: number) => void;
  className?: string;
  unreadCount?: number;
  onResetUnread?: () => void;
  onSpeakingPeersChange?: (speakingPlayerIds: string[]) => void;
  voiceController: WebRTCVoiceController;
}

const QUICK_EMOTES = [
  '🤠 دست مریزاد!',
  '🔫 حسابتو می‌رسم یاغی!',
  '💨 تیرم به سنگ خورد!',
  '🍺 بریم سالون یک نوشیدنی بزنیم!',
  '⭐ تسلیم شو کلانتر!',
  '🎯 شلیک بعدی به توئه!',
  '🛡️ سپر فولادی دارم!',
  '💀 وقت مردنته!',
];

export const SaloonChatPanel: React.FC<SaloonChatPanelProps> = ({
  roomId,
  myPlayerId,
  playerName,
  players,
  currentWidth,
  isCollapsed,
  onToggleCollapse,
  onClose,
  onResizeStep,
  className = '',
  unreadCount = 0,
  onResetUnread,
  onSpeakingPeersChange,
  voiceController,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // WebRTC Voice Hook passed from parent (persistent across views)
  const {
    isConnected,
    isMuted,
    isDeafened,
    isSpeaking,
    voicePeers,
    error: voiceError,
    joinVoice,
    leaveVoice,
    toggleMute,
    toggleDeafen,
  } = voiceController;

  // Notify parent of active speaking player IDs so WesternTable & Lobby can light up seats
  useEffect(() => {
    const activeSpeaking: string[] = [];
    if (isSpeaking && myPlayerId) {
      activeSpeaking.push(myPlayerId);
    }
    voicePeers.forEach((p) => {
      if (p.isSpeaking && p.playerId) {
        activeSpeaking.push(p.playerId);
      }
    });
    onSpeakingPeersChange?.(activeSpeaking);
  }, [isSpeaking, voicePeers, myPlayerId, onSpeakingPeersChange]);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!isCollapsed) {
      scrollToBottom();
      onResetUnread?.();
    }
  }, [messages.length, isCollapsed]);

  // Socket listeners for chat messages
  useEffect(() => {
    const socket = getSocket();

    socket.on('chat_history', (history: ChatMessage[]) => {
      setMessages(history);
    });

    socket.on('new_chat_message', (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    });

    // Request initial history
    socket.emit('get_chat_history', { roomId });

    return () => {
      socket.off('chat_history');
      socket.off('new_chat_message');
    };
  }, [roomId]);

  const handleSendMessage = (e?: React.FormEvent, customText?: string, type: 'text' | 'quick' = 'text') => {
    if (e) e.preventDefault();
    const textToSend = customText || inputText;
    const clean = textToSend.trim();
    if (!clean) return;

    const socket = getSocket();
    socket.emit('send_chat_message', {
      roomId,
      text: clean,
      type,
    });

    if (!customText) {
      setInputText('');
    }
  };

  const formatTime = (timestamp: number) => {
    const d = new Date(timestamp);
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  };

  // If collapsed: show stylish slim saloon pillar
  if (isCollapsed) {
    return (
      <div
        onClick={onToggleCollapse}
        className={`bg-saloon-950/95 border border-saloon-800 hover:border-amber-500/70 rounded-3xl p-2 flex flex-col items-center justify-between shadow-2xl backdrop-blur-md cursor-pointer transition-all hover:bg-saloon-900 group select-none ${
          className || 'h-full min-h-[440px] max-h-[620px] w-12'
        }`}
        title="کلیک برای باز کردن چت و ویس‌چت سالون"
      >
        <div className="flex flex-col items-center gap-2 pt-2 relative">
          <span className="text-xl group-hover:scale-110 transition-transform">💬</span>
          {unreadCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-black flex items-center justify-center animate-bounce shadow-md">
              {unreadCount > 9 ? '+۹' : unreadCount}
            </span>
          )}
          {isConnected && (
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
          )}
        </div>

        {/* Vertical Text */}
        <div className="text-[11px] font-black text-amber-400 tracking-wider [writing-mode:vertical-rl] rotate-180 opacity-80 group-hover:opacity-100 flex items-center gap-2 py-4">
          <span>چت و ویس سالون</span>
          {isConnected && <span className="text-[9px] text-emerald-400 font-bold">🎙️ زنده</span>}
        </div>

        <div className="pb-2 flex flex-col items-center gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse();
            }}
            className="w-7 h-7 rounded-full bg-saloon-800 hover:bg-amber-600 hover:text-stone-950 text-amber-400 flex items-center justify-center text-xs transition-colors shadow"
            title="باز کردن پنل"
          >
            ◀
          </button>
          {onClose && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="w-6 h-6 rounded-full bg-red-950/80 hover:bg-red-700 text-red-300 hover:text-white flex items-center justify-center text-[10px] transition-colors shadow border border-red-800/60"
              title="بستن و هاید کردن کامل پنل"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      className={`bg-saloon-950/95 border border-saloon-800 rounded-3xl shadow-2xl backdrop-blur-md flex flex-col overflow-hidden text-right transition-all select-none ${
        className || 'h-full min-h-[440px] max-h-[640px]'
      }`}
      style={{ width: currentWidth }}
    >
      {/* 1. Header with Controls & Resize Buttons */}
      <div className="bg-saloon-900/90 border-b border-amber-900/60 p-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg">💬</span>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-amber-300 font-western">چت سالون وسترن</h3>
            <span className="text-[10px] text-zinc-400">اتاق گفتگو و ارتباط زنده</span>
          </div>
        </div>

        {/* Resize, Minimize & Close Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onResizeStep(-40)}
            className="w-6 h-6 rounded-lg bg-saloon-800 hover:bg-amber-600 hover:text-stone-950 text-amber-300 flex items-center justify-center text-xs font-bold transition-all"
            title="کوچک‌تر کردن عرض پنل"
          >
            -
          </button>
          <button
            onClick={() => onResizeStep(40)}
            className="w-6 h-6 rounded-lg bg-saloon-800 hover:bg-amber-600 hover:text-stone-950 text-amber-300 flex items-center justify-center text-xs font-bold transition-all"
            title="بزرگ‌تر کردن عرض پنل"
          >
            +
          </button>
          <button
            onClick={onToggleCollapse}
            className="w-6 h-6 rounded-lg bg-saloon-800 hover:bg-saloon-700 text-zinc-300 hover:text-white flex items-center justify-center text-xs font-bold transition-all border border-saloon-700"
            title="جمع کردن به نوار باریک"
          >
            ▶
          </button>
          <button
            onClick={onClose || onToggleCollapse}
            className="w-6 h-6 rounded-lg bg-red-950/80 hover:bg-red-700 text-red-300 hover:text-white flex items-center justify-center text-xs font-black transition-all ml-1 border border-red-800/60"
            title="بستن و هاید کردن کامل چت"
          >
            ✕
          </button>
        </div>
      </div>

      {/* 2. Voice Chat Bar (WebRTC) */}
      <div className="bg-gradient-to-r from-saloon-900 via-amber-950/40 to-saloon-900 border-b border-saloon-800 p-2.5 shrink-0">
        {!isConnected ? (
          <button
            onClick={joinVoice}
            className="w-full py-1.5 px-3 rounded-xl bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs flex items-center justify-center gap-2 border border-emerald-500/60 shadow-md shadow-emerald-950/50 transition-all active:scale-98"
          >
            <span>🎙️</span>
            <span>ورود به گفتگوی صوتی (ویس‌چت سالون)</span>
          </button>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <span className="text-[11px] font-black text-emerald-300">
                  ویس متصل است ({voicePeers.length + 1} نفر)
                </span>
              </div>

              {/* Voice Controls: Mute, Deafen, Disconnect */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={toggleMute}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 border ${
                    isMuted
                      ? 'bg-red-900/90 text-red-200 border-red-600'
                      : 'bg-emerald-900/90 text-emerald-200 border-emerald-500'
                  }`}
                  title={isMuted ? 'وصل کردن میکروفون' : 'قطع کردن میکروفون'}
                >
                  <span>{isMuted ? '🔇' : '🎙️'}</span>
                  <span>{isMuted ? 'بی‌صدا' : 'روشن'}</span>
                </button>

                <button
                  onClick={toggleDeafen}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 border ${
                    isDeafened
                      ? 'bg-purple-900/90 text-purple-200 border-purple-600'
                      : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                  }`}
                  title={isDeafened ? 'باز کردن صدای دیگران' : 'قطع صدای دیگران'}
                >
                  <span>{isDeafened ? '🔇' : '🔊'}</span>
                </button>

                <button
                  onClick={leaveVoice}
                  className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-red-800 text-zinc-400 hover:text-white text-xs transition-colors border border-zinc-700"
                  title="خروج از ویس"
                >
                  خروج
                </button>
              </div>
            </div>

            {/* Speaking Member Avatars Row */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              {/* Me */}
              <div
                className={`relative px-2 py-0.5 rounded-lg border flex items-center gap-1 text-[10px] font-bold ${
                  isSpeaking
                    ? 'border-emerald-400 bg-emerald-950/80 text-emerald-300 ring-2 ring-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)] animate-pulse'
                    : isMuted
                    ? 'border-red-800/60 bg-red-950/40 text-red-300'
                    : 'border-zinc-700 bg-zinc-900/80 text-zinc-300'
                }`}
                title="شما"
              >
                <span>{isMuted ? '🔇' : isSpeaking ? '🔊' : '🎙️'}</span>
                <span>شما</span>
              </div>

              {/* Other connected voice peers */}
              {voicePeers.map((peer) => (
                <div
                  key={peer.socketId}
                  className={`relative px-2 py-0.5 rounded-lg border flex items-center gap-1 text-[10px] font-bold ${
                    peer.isSpeaking
                      ? 'border-emerald-400 bg-emerald-950/80 text-emerald-300 ring-2 ring-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)] animate-pulse'
                      : peer.isMuted
                      ? 'border-red-800/60 bg-red-950/40 text-red-300'
                      : 'border-zinc-700 bg-zinc-900/80 text-zinc-300'
                  }`}
                  title={peer.name}
                >
                  <span>{peer.isMuted ? '🔇' : peer.isSpeaking ? '🔊' : '🎙️'}</span>
                  <span className="truncate max-w-[70px]">{peer.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {voiceError && (
          <div className="mt-1 text-[10px] text-red-300 bg-red-950/80 p-1.5 rounded-lg border border-red-800">
            ⚠️ {voiceError}
          </div>
        )}
      </div>

      {/* 3. Messages List Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 font-sans">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-zinc-500">
            <span className="text-3xl mb-2 opacity-50">🌵</span>
            <span className="text-xs font-semibold">هنوز پیامی در سالون ارسال نشده است.</span>
            <span className="text-[10px] text-zinc-600 mt-1">اولین نفری باشید که سر صحبت را باز می‌کند!</span>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === myPlayerId;
            const isQuick = msg.type === 'quick';

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-start' : 'items-end'}`}
              >
                {/* Sender Header */}
                <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px]">
                  <span className="font-bold text-amber-300">
                    {msg.senderName}
                    {isMe && ' (شما)'}
                  </span>
                  {msg.senderCharacterTitleFa && (
                    <span className="text-zinc-500 text-[9px]">({msg.senderCharacterTitleFa})</span>
                  )}
                  {msg.senderRole === 'sheriff' && (
                    <span className="text-amber-400 bg-amber-950/80 px-1 rounded text-[8px] border border-amber-600/50">
                      ⭐ کلانتر
                    </span>
                  )}
                  <span className="text-zinc-500 text-[9px] mr-1">{formatTime(msg.timestamp)}</span>
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed break-words shadow-md ${
                    isMe
                      ? 'bg-amber-950/80 text-amber-100 border border-amber-600/60 rounded-tr-xs'
                      : isQuick
                      ? 'bg-saloon-900 text-cyan-200 border border-cyan-700/60 rounded-tl-xs italic font-semibold'
                      : 'bg-zinc-900/90 text-zinc-200 border border-zinc-700/60 rounded-tl-xs'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 4. Quick Western Emotes Ribbon */}
      <div className="bg-saloon-900/90 border-t border-saloon-800 px-2 py-1.5 shrink-0">
        <div className="text-[10px] text-zinc-400 font-bold mb-1 flex items-center gap-1">
          <span>⚡</span>
          <span>پیام‌های سریع وسترن:</span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {QUICK_EMOTES.map((emote, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(undefined, emote, 'quick')}
              className="px-2.5 py-1 rounded-full bg-saloon-800 hover:bg-amber-600 hover:text-stone-950 text-amber-300 text-[10px] font-medium whitespace-nowrap transition-all border border-amber-900/50 active:scale-95 shadow-xs"
            >
              {emote}
            </button>
          ))}
        </div>
      </div>

      {/* 5. Input Bar */}
      <form
        onSubmit={handleSendMessage}
        className="bg-saloon-900 border-t border-amber-900/60 p-2.5 flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="پیامی در سالون بنویسید..."
          maxLength={300}
          className="flex-1 bg-saloon-950 border border-zinc-700 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 outline-none transition-colors"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 disabled:opacity-40 disabled:pointer-events-none text-stone-950 font-black text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-1"
          title="ارسال پیام"
        >
          <span>ارسال</span>
          <span>↵</span>
        </button>
      </form>
    </div>
  );
};
