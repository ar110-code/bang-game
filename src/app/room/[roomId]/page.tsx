'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSocket } from '@/lib/socket/client';
import { PublicGameState, PublicPlayer, Card, TargetCardChoice, ActionEffect } from '@/lib/game-engine/types';
import { LobbyRoom } from '@/components/lobby/LobbyRoom';
import { WesternTable } from '@/components/game/WesternTable';
import { HandCards } from '@/components/game/HandCards';
import { ReactionModal } from '@/components/game/ReactionModal';
import { BangShowdownOverlay } from '@/components/game/BangShowdownOverlay';
import { GameLog } from '@/components/game/GameLog';
import { GameOverModal } from '@/components/game/GameOverModal';
import { CharacterRevealModal } from '@/components/game/CharacterRevealModal';
import { CharacterDetailModal } from '@/components/game/CharacterDetailModal';
import { CardDetailModal } from '@/components/game/CardDetailModal';
import { SpecialDrawModal } from '@/components/game/SpecialDrawModal';
import { TargetCardSelectModal } from '@/components/game/TargetCardSelectModal';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { ActionAnimationOverlay } from '@/components/game/ActionAnimationOverlay';
import { SaloonChatPanel } from '@/components/game/SaloonChatPanel';
import { useWebRTCVoice } from '@/lib/hooks/useWebRTCVoice';
import { soundEngine } from '@/lib/audio/soundEffects';

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = ((params?.roomId as string) || '').toUpperCase();

  const [playerName, setPlayerName] = useState<string>('');
  const [nameModalOpen, setNameModalOpen] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [gameState, setGameState] = useState<PublicGameState | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeEffect, setActiveEffect] = useState<ActionEffect | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(!soundEngine.isMuted());

  // Selected card in hand for targeting
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  // Target card selection modal for Cat Balou / Panic
  const [targetSelectModalData, setTargetSelectModalData] = useState<{
    actionCard: Card;
    targetPlayer: PublicPlayer;
  } | null>(null);

  // Role & Character reveal modal at game start
  const [revealModalOpen, setRevealModalOpen] = useState(false);
  const [hasShownReveal, setHasShownReveal] = useState(false);

  // Character detail / ability inspector modal
  const [inspectedPlayer, setInspectedPlayer] = useState<PublicPlayer | null>(null);

  // Card detail / description inspector modal
  const [inspectedCard, setInspectedCard] = useState<Card | null>(null);

  // Mobile/Tablet Game Log modal toggle
  const [logModalOpen, setLogModalOpen] = useState(false);

  // Desktop Game Log resizable width & collapse state
  const [gameLogWidth, setGameLogWidth] = useState<number>(300);
  const [isLogCollapsed, setIsLogCollapsed] = useState<boolean>(false);
  const [tableZoomOffset, setTableZoomOffset] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isResizingRef = useRef<boolean>(false);

  // Desktop Saloon Chat resizable width, collapse & hide state
  const [chatWidth, setChatWidth] = useState<number>(280);
  const [isChatCollapsed, setIsChatCollapsed] = useState<boolean>(false);
  const [isChatHidden, setIsChatHidden] = useState<boolean>(false);
  const [chatMobileOpen, setChatMobileOpen] = useState<boolean>(false);
  const [chatUnreadCount, setChatUnreadCount] = useState<number>(0);
  const [speakingPlayerIds, setSpeakingPlayerIds] = useState<string[]>([]);
  const isResizingChatRef = useRef<boolean>(false);

  // Persist log width & collapse preferences
  useEffect(() => {
    try {
      const savedLogWidth = localStorage.getItem('bang_log_width');
      if (savedLogWidth) {
        const w = parseInt(savedLogWidth, 10);
        if (!isNaN(w) && w >= 160 && w <= 520) setGameLogWidth(w);
      }
      const savedLogCollapsed = localStorage.getItem('bang_log_collapsed');
      if (savedLogCollapsed) {
        setIsLogCollapsed(savedLogCollapsed === 'true');
      }

      const savedChatWidth = localStorage.getItem('bang_chat_width');
      if (savedChatWidth) {
        const cw = parseInt(savedChatWidth, 10);
        if (!isNaN(cw) && cw >= 180 && cw <= 520) setChatWidth(cw);
      }
      const savedChatCollapsed = localStorage.getItem('bang_chat_collapsed');
      if (savedChatCollapsed) {
        setIsChatCollapsed(savedChatCollapsed === 'true');
      }
      const savedChatHidden = localStorage.getItem('bang_chat_hidden');
      if (savedChatHidden) {
        setIsChatHidden(savedChatHidden === 'true');
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('bang_log_width', String(gameLogWidth));
      localStorage.setItem('bang_log_collapsed', String(isLogCollapsed));
      localStorage.setItem('bang_chat_width', String(chatWidth));
      localStorage.setItem('bang_chat_collapsed', String(isChatCollapsed));
      localStorage.setItem('bang_chat_hidden', String(isChatHidden));
    } catch (e) {}
  }, [gameLogWidth, isLogCollapsed, chatWidth, isChatCollapsed, isChatHidden]);

  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isMobilePortrait, setIsMobilePortrait] = useState<boolean>(false);

  useEffect(() => {
    const handleResize = () => {
      const small = window.innerWidth < 1024;
      setIsMobile(small);
      setIsMobilePortrait(small && window.innerHeight >= window.innerWidth);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Compute table dynamic scale and max width class based on side panels and manual zoom
  const baseTableScale = useMemo(() => {
    if (isMobile) {
      if (isMobilePortrait) {
        if (typeof window !== 'undefined') {
          if (window.innerHeight < 680) {
            return 0.82; // Phone screen with browser bars (like iPhone SE/8/Safari)
          }
          if (window.innerWidth < 375) {
            return 0.86;
          }
          return 0.92;
        }
        return 0.86;
      }
      return 0.76;
    }

    const leftWidth = isLogCollapsed ? 48 : gameLogWidth;
    const rightWidth = isChatHidden ? 0 : (isChatCollapsed ? 48 : chatWidth);
    const totalSideWidth = leftWidth + rightWidth;

    if (totalSideWidth <= 100) return 1.15;
    if (totalSideWidth <= 350) return 1.08;
    if (totalSideWidth <= 580) return 0.98;
    if (totalSideWidth <= 750) return 0.88;
    return 0.80;
  }, [isMobile, isMobilePortrait, isLogCollapsed, gameLogWidth, isChatHidden, isChatCollapsed, chatWidth]);

  const currentTableScale = Math.max(0.55, Math.min(1.4, baseTableScale + tableZoomOffset));

  const tableMaxWidthClass = useMemo(() => {
    if (isMobile) return 'max-w-full';
    const leftWidth = isLogCollapsed ? 48 : gameLogWidth;
    const rightWidth = isChatHidden ? 0 : (isChatCollapsed ? 48 : chatWidth);
    const totalSideWidth = leftWidth + rightWidth;

    if (totalSideWidth <= 100) return 'max-w-7xl';
    if (totalSideWidth <= 420) return 'max-w-6xl';
    if (totalSideWidth <= 650) return 'max-w-5xl';
    return 'max-w-4xl';
  }, [isMobile, isLogCollapsed, gameLogWidth, isChatHidden, isChatCollapsed, chatWidth]);

  const currentCardSize: 'sm' | 'md' | 'lg' = useMemo(() => {
    if (isMobile) return 'sm';
    if (currentTableScale >= 1.08) return 'md';
    if (currentTableScale <= 0.88) return 'sm';
    return 'md';
  }, [isMobile, currentTableScale]);

  // Resize handler for Left Game Log
  const handleStartResize = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMove = (moveEvent: MouseEvent | TouchEvent) => {
      if (!isResizingRef.current || !containerRef.current) return;
      const clientX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const rect = containerRef.current.getBoundingClientRect();
      const newWidth = Math.max(160, Math.min(520, clientX - rect.left));

      setGameLogWidth(newWidth);
      if (isLogCollapsed) setIsLogCollapsed(false);
    };

    const onEnd = () => {
      isResizingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onEnd);
  };

  // Resize handler for Right Saloon Chat Panel
  const handleStartChatResize = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    isResizingChatRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMove = (moveEvent: MouseEvent | TouchEvent) => {
      if (!isResizingChatRef.current || !containerRef.current) return;
      const clientX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const rect = containerRef.current.getBoundingClientRect();
      const newWidth = Math.max(180, Math.min(520, rect.right - clientX));

      setChatWidth(newWidth);
      if (isChatCollapsed) setIsChatCollapsed(false);
    };

    const onEnd = () => {
      isResizingChatRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onEnd);
  };

  // Listen for chat messages to increment unread counter when chat is hidden or collapsed
  useEffect(() => {
    const socket = getSocket();
    const handleNewMessage = () => {
      if (isChatCollapsed || isChatHidden) {
        setChatUnreadCount((prev) => prev + 1);
      }
    };
    socket.on('new_chat_message', handleNewMessage);
    return () => {
      socket.off('new_chat_message', handleNewMessage);
    };
  }, [isChatCollapsed, isChatHidden]);

  useEffect(() => {
    let storedId = sessionStorage.getItem('bang_player_id');
    if (!storedId) {
      storedId = `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      sessionStorage.setItem('bang_player_id', storedId);
    }
    const savedName = sessionStorage.getItem('bang_player_name');
    if (savedName) {
      setPlayerName(savedName);
    } else {
      setNameModalOpen(true);
    }
  }, []);

  useEffect(() => {
    if (!playerName || !roomId) return;

    const socket = getSocket();
    const playerId = sessionStorage.getItem('bang_player_id') || undefined;

    const emitJoin = () => {
      socket.emit('join_room', { roomId, playerName, playerId });
    };

    emitJoin();
    socket.on('connect', emitJoin);

    socket.on('game_state', (state: PublicGameState) => {
      setGameState(state);
    });

    socket.on('error_message', (msg: string) => {
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(null), 4000);
    });

    socket.on('action_effect', (eff: ActionEffect) => {
      setActiveEffect(eff);
    });

    return () => {
      socket.off('connect', emitJoin);
      socket.off('game_state');
      socket.off('error_message');
      socket.off('action_effect');
    };
  }, [playerName, roomId]);

  // Automatically show character and role reveal modal when game starts
  useEffect(() => {
    if (gameState?.status === 'playing' && !hasShownReveal && gameState.myPlayer?.character) {
      setRevealModalOpen(true);
      setHasShownReveal(true);
    }
    if (gameState?.status === 'lobby') {
      setHasShownReveal(false);
    }
  }, [gameState?.status, gameState?.myPlayer?.character, hasShownReveal]);

  // Auto-close reveal modal when countdown finishes
  const prevCountdownRef = useRef<number | null | undefined>(undefined);
  useEffect(() => {
    if (
      prevCountdownRef.current !== undefined &&
      prevCountdownRef.current !== null &&
      prevCountdownRef.current > 0 &&
      !gameState?.revealCountdown
    ) {
      setRevealModalOpen(false);
    }
    prevCountdownRef.current = gameState?.revealCountdown;
  }, [gameState?.revealCountdown]);

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    let storedId = sessionStorage.getItem('bang_player_id');
    if (!storedId) {
      storedId = `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      sessionStorage.setItem('bang_player_id', storedId);
    }
    sessionStorage.setItem('bang_player_name', nameInput.trim());
    setPlayerName(nameInput.trim());
    setNameModalOpen(false);
  };

  const handleToggleSound = () => {
    const isMuted = soundEngine.toggleMute();
    setSoundEnabled(!isMuted);
  };

  const myPlayer = gameState?.myPlayer || null;
  const myPlayerId =
    myPlayer?.id ||
    (playerName
      ? gameState?.players.find(
          (p) => p.name.trim().toLowerCase() === playerName.trim().toLowerCase()
        )?.id
      : '') ||
    '';

  const effectivePlayerId =
    myPlayerId ||
    (typeof window !== 'undefined' ? sessionStorage.getItem('bang_player_id') || '' : '');

  // Persistent WebRTC Voice Controller across lobby and game phases
  const voiceController = useWebRTCVoice({
    roomId,
    myPlayerId: effectivePlayerId,
    playerName,
  });

  // Sync active speakers to state for real-time visual indicator rings on seats and lobby
  useEffect(() => {
    const activeSpeaking: string[] = [];
    if (voiceController.isSpeaking && effectivePlayerId) {
      activeSpeaking.push(effectivePlayerId);
    }
    voiceController.voicePeers.forEach((p) => {
      if (p.isSpeaking && p.playerId) {
        activeSpeaking.push(p.playerId);
      }
    });
    setSpeakingPlayerIds(activeSpeaking);
  }, [voiceController.isSpeaking, voiceController.voicePeers, effectivePlayerId]);

  const isMyTurn = gameState?.currentTurnPlayerId === myPlayerId;

  const selectedCard = useMemo(() => {
    if (!selectedCardId || !myPlayer?.hand) return null;
    return myPlayer.hand.find((c: Card) => c.id === selectedCardId) || null;
  }, [selectedCardId, myPlayer]);

  // Action lock: Active while a Bang showdown, attack effect, or resolution animation is in progress
  const isBangShowdownActive = Boolean(
    (activeEffect &&
      (activeEffect.type === 'bang' ||
        activeEffect.type === 'missed' ||
        activeEffect.type === 'hit' ||
        activeEffect.type === 'barrel_success')) ||
      gameState?.pendingReaction?.type === 'bang'
  );

  const isGameActionLocked = isBangShowdownActive || Boolean(activeEffect);

  const handleSelectCard = (card: Card) => {
    if (isGameActionLocked) {
      setErrorMessage('تا اتمام انیمیشن شلیک و رخداد فعلی، امکان انتخاب یا بازی کارت وجود ندارد.');
      return;
    }
    soundEngine.playCardDraw();
    if (selectedCardId === card.id) {
      setSelectedCardId(null);
    } else {
      setSelectedCardId(card.id);
    }
  };

  const handlePlaySelectedCard = () => {
    if (isGameActionLocked) {
      setErrorMessage('تا اتمام انیمیشن شلیک، امکان بازی کارت وجود ندارد.');
      return;
    }
    if (!selectedCardId) return;
    const socket = getSocket();
    socket.emit('play_card', { roomId, cardId: selectedCardId });
    setSelectedCardId(null);
  };

  const handleSelectTarget = (targetPlayerId: string) => {
    if (isGameActionLocked) {
      setErrorMessage('تا اتمام انیمیشن شلیک، امکان هدف‌گیری و شلیک مجدد وجود ندارد.');
      return;
    }
    if (!selectedCardId) return;

    // Check if playing Cat Balou or Panic: open interactive card selection modal!
    if (selectedCard && (selectedCard.name === 'cat_balou' || selectedCard.name === 'panic')) {
      const targetP = gameState?.players.find((p) => p.id === targetPlayerId);
      if (targetP) {
        if (selectedCard.name === 'panic') {
          if (targetP.handCount <= 0) {
            setErrorMessage('این بازیکن هیچ کارتی در دست ندارد (کارت تهدید فقط از دست حریف قابل سرقت است).');
            return;
          }
          // If target only has 1 card in hand, steal it directly without modal for ultra-fast action
          if (targetP.handCount === 1) {
            const socket = getSocket();
            socket.emit('play_card', {
              roomId,
              cardId: selectedCardId,
              targetPlayerId,
              targetCardChoice: { type: 'hand', handIndex: 0 },
            });
            setSelectedCardId(null);
            return;
          }
        }

        setTargetSelectModalData({
          actionCard: selectedCard,
          targetPlayer: targetP,
        });
        return;
      }
    }

    const socket = getSocket();
    socket.emit('play_card', {
      roomId,
      cardId: selectedCardId,
      targetPlayerId,
    });
    setSelectedCardId(null);
  };

  const handleConfirmTargetCard = (choice: TargetCardChoice) => {
    if (isGameActionLocked || !targetSelectModalData) return;
    const socket = getSocket();
    socket.emit('play_card', {
      roomId,
      cardId: targetSelectModalData.actionCard.id,
      targetPlayerId: targetSelectModalData.targetPlayer.id,
      targetCardChoice: choice,
    });
    setTargetSelectModalData(null);
    setSelectedCardId(null);
  };

  const handleRespondReaction = (action: 'play' | 'pass', cardId?: string) => {
    const socket = getSocket();
    socket.emit('respond_reaction', { roomId, action, cardId });
  };

  const handleDiscardCard = (cardId: string) => {
    if (isGameActionLocked) {
      setErrorMessage('تا اتمام انیمیشن شلیک، امکان سوزاندن کارت وجود ندارد.');
      return;
    }
    const socket = getSocket();
    socket.emit('discard_card', { roomId, cardId });
  };

  const handleEndTurn = () => {
    if (isGameActionLocked) {
      setErrorMessage('تا اتمام انیمیشن شلیک، امکان پایان نوبت وجود ندارد.');
      return;
    }
    const socket = getSocket();
    socket.emit('end_turn', { roomId });
    setSelectedCardId(null);
  };

  const handleResolveSpecialDraw = (choice: {
    type: 'deck' | 'discard' | 'player' | 'kit';
    targetPlayerId?: string;
    kitSelectedIndices?: number[];
  }) => {
    if (isGameActionLocked) return;
    const socket = getSocket();
    socket.emit('resolve_special_draw', { roomId, choice });
  };

  const handleUseSidKetchum = (cardIds: string[]) => {
    if (isGameActionLocked) {
      setErrorMessage('تا اتمام انیمیشن شلیک، امکان بازیابی جان وجود ندارد.');
      return;
    }
    const socket = getSocket();
    socket.emit('use_sid_ketchum', { roomId, cardIds });
  };

  // Name Prompt Modal
  if (nameModalOpen) {
    return (
      <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
        <div className="bg-saloon-900 border border-saloon-700 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl">
          <div className="text-3xl mb-2">🤠</div>
          <h2 className="text-lg font-bold text-amber-300 mb-2">ورود به اتاق وسترن</h2>
          <p className="text-xs text-zinc-400 mb-4">لطفاً ابتدا نام یا لقبی برای خود انتخاب کنید:</p>
          <form onSubmit={handleNameSubmit} className="space-y-4">
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="نام مستعار شما..."
              maxLength={20}
              className="w-full bg-saloon-950 border border-saloon-700 rounded-xl px-4 py-2.5 text-sm text-center text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold"
              autoFocus
            />
            <button
              type="submit"
              className="w-full bg-amber-600 hover:bg-amber-500 text-saloon-950 font-black text-sm py-3 rounded-xl border border-amber-400 transition-all shadow"
            >
              پیوستن به بازی
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen text-amber-300">
        <div className="text-4xl mb-3 animate-spin">⭐</div>
        <p className="text-sm font-bold">در حال اتصال به سالون بازی...</p>
      </div>
    );
  }

  const attackerPlayer = gameState.players.find(
    (p) => p.id === gameState.pendingReaction?.sourcePlayerId
  );

  return (
    <div className="h-screen h-[100dvh] max-h-[100dvh] w-full flex flex-col bg-saloon-950 text-saloon-100 relative selection:bg-amber-600 overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="w-full bg-saloon-900/90 border-b border-saloon-800 px-1.5 sm:px-4 py-1 sm:py-2 flex items-center justify-between z-20 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-1.5 sm:gap-3">
          <button
            onClick={() => router.push('/')}
            className="text-[11px] sm:text-xs text-zinc-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
          >
            <span>← خروج</span>
          </button>
          <div className="h-3.5 w-[1px] bg-saloon-700" />
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] sm:text-xs text-zinc-400">اتاق:</span>
            <span className="text-[11px] sm:text-xs font-black text-amber-400 font-mono tracking-wider">
              {roomId}
            </span>
          </div>
        </div>

        {/* Center Official Game Brand Logo */}
        <div className="hidden sm:flex items-center">
          <BrandLogo variant="compact" size="sm" />
        </div>

        {/* Audio Toggle & User Name & Role Card Button */}
        <div className="flex items-center gap-1 sm:gap-3">
          {myPlayer && gameState.status === 'playing' && (
            <button
              onClick={() => setRevealModalOpen(true)}
              className="text-[11px] sm:text-xs font-bold text-amber-300 hover:text-amber-200 bg-saloon-800 hover:bg-saloon-700 border border-amber-600/50 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg sm:rounded-xl transition-all shadow-sm flex items-center gap-1 active:scale-95"
              title="مشاهده مشخصات نقش، کاراکتر و قابلیت شما"
            >
              <span>📜</span>
              <span className="hidden sm:inline">نقش و کاراکتر من</span>
              <span className="sm:hidden">کارت من</span>
            </button>
          )}
          {/* Game Log Mobile Toggle Button */}
          {gameState.status === 'playing' && (
            <button
              onClick={() => setLogModalOpen(true)}
              className="text-[11px] sm:text-xs font-bold text-amber-300 hover:text-amber-200 bg-saloon-800 hover:bg-saloon-700 border border-amber-600/50 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg sm:rounded-xl transition-all shadow-sm flex items-center gap-1 active:scale-95 lg:hidden"
              title="مشاهده وقایع‌نگار و رخدادهای بازی"
            >
              <span>📜</span>
              <span>وقایع</span>
            </button>
          )}

          {/* Saloon Chat & Voice Toggle Button */}
          <button
            onClick={() => {
              if (window.innerWidth < 1024) {
                setChatMobileOpen(true);
              } else {
                if (isChatHidden) {
                  setIsChatHidden(false);
                  setIsChatCollapsed(false);
                } else if (isChatCollapsed) {
                  setIsChatCollapsed(false);
                } else {
                  setIsChatCollapsed(true);
                }
              }
              setChatUnreadCount(0);
            }}
            className="text-[11px] sm:text-xs font-bold text-amber-300 hover:text-amber-200 bg-saloon-800 hover:bg-saloon-700 border border-amber-600/50 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg sm:rounded-xl transition-all shadow-sm flex items-center gap-1 active:scale-95 relative"
            title="چت متنی و گفتگوی صوتی سالون وسترن"
          >
            <span>💬</span>
            <span className="hidden sm:inline">چت و ویس</span>
            <span className="sm:hidden">چت</span>
            {voiceController.isConnected && (
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.9)]" />
            )}
            {chatUnreadCount > 0 && (
              <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-red-600 text-white text-[8px] sm:text-[9px] font-black flex items-center justify-center animate-bounce shadow">
                {chatUnreadCount > 9 ? '+۹' : chatUnreadCount}
              </span>
            )}
          </button>
          <button
            onClick={handleToggleSound}
            className="text-[11px] sm:text-xs text-zinc-300 hover:text-amber-300 bg-saloon-800 border border-saloon-700 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg sm:rounded-xl transition-all"
            title={soundEnabled ? 'صدا روشن' : 'صدا خاموش'}
          >
            {soundEnabled ? '🔊 صدا' : '🔇 بی‌صدا'}
          </button>
          <span className="text-xs font-bold text-zinc-200 bg-saloon-950 px-2.5 py-1 rounded-xl border border-saloon-800 truncate max-w-[120px]">
            🤠 {playerName}
          </span>
        </div>
      </header>

      {/* Floating Error Toast */}
      {errorMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-red-900 text-white text-xs font-bold px-4 py-2 rounded-2xl shadow-2xl border border-red-500 animate-in fade-in slide-in-from-top-4">
          ⚠️ {errorMessage}
        </div>
      )}

      {/* Main Content: Lobby or Playing */}
      {gameState.status === 'lobby' ? (
        <div className="flex-1 flex flex-col lg:flex-row items-center justify-between w-full overflow-hidden p-2 sm:p-4 gap-4">
          <div className="flex-1 w-full overflow-y-auto max-h-[calc(100vh-80px)] flex items-center justify-center">
            <LobbyRoom
              gameState={gameState}
              myPlayerId={myPlayerId}
              onAddBot={() => getSocket().emit('add_bot', { roomId })}
              onToggleReady={() => getSocket().emit('toggle_ready', { roomId })}
              onStartGame={() => getSocket().emit('start_game', { roomId })}
              speakingPlayerIds={speakingPlayerIds}
              isVoiceConnected={voiceController.isConnected}
              onOpenVoiceChat={() => {
                if (window.innerWidth < 1024) {
                  setChatMobileOpen(true);
                } else {
                  setIsChatHidden(false);
                  setIsChatCollapsed(false);
                }
              }}
            />
          </div>

          {/* Desktop Right Side Saloon Chat & Voice Panel (Lobby) */}
          <div
            style={{
              width: isChatCollapsed ? 48 : chatWidth,
              transition: isResizingChatRef.current ? 'none' : 'width 0.2s ease-out',
            }}
            className={`${isChatHidden ? 'hidden' : 'hidden lg:block'} p-2 sm:p-3 self-stretch shrink-0 overflow-hidden`}
          >
            <SaloonChatPanel
              roomId={roomId}
              myPlayerId={myPlayerId}
              playerName={playerName}
              players={gameState.players}
              currentWidth={chatWidth}
              isCollapsed={isChatCollapsed}
              onToggleCollapse={() => setIsChatCollapsed((prev) => !prev)}
              onClose={() => setIsChatHidden(true)}
              onResizeStep={(delta) => {
                if (isChatCollapsed) setIsChatCollapsed(false);
                setChatWidth((prev) => Math.max(180, Math.min(520, prev + delta)));
              }}
              unreadCount={chatUnreadCount}
              onResetUnread={() => setChatUnreadCount(0)}
              onSpeakingPeersChange={setSpeakingPlayerIds}
              voiceController={voiceController}
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col justify-between overflow-hidden">
          {/* Western Table, Game Log & Saloon Chat Arena */}
          <div
            ref={containerRef}
            dir="ltr"
            className="flex-1 min-h-0 flex flex-col lg:flex-row items-center justify-between relative w-full overflow-hidden"
          >
            {/* 1. Desktop Left Side Game Log */}
            <div
              style={{
                width: isLogCollapsed ? 48 : gameLogWidth,
                transition: isResizingRef.current ? 'none' : 'width 0.2s ease-out',
              }}
              className="hidden lg:block p-2 sm:p-3 self-stretch shrink-0 overflow-hidden"
            >
              <GameLog
                logs={gameState.logs}
                players={gameState.players}
                myPlayerId={myPlayerId}
                isCollapsed={isLogCollapsed}
                onToggleCollapse={() => setIsLogCollapsed((prev) => !prev)}
                onResizeStep={(delta) => {
                  if (isLogCollapsed) setIsLogCollapsed(false);
                  setGameLogWidth((prev) => Math.max(160, Math.min(520, prev + delta)));
                }}
                currentWidth={gameLogWidth}
              />
            </div>

            {/* Desktop Draggable Divider Handle for Game Log */}
            <div
              onMouseDown={handleStartResize}
              onTouchStart={handleStartResize}
              className="hidden lg:flex w-2.5 hover:w-3.5 hover:bg-amber-500/25 active:bg-amber-500/50 cursor-col-resize items-center justify-center group transition-all self-stretch select-none z-20 shrink-0"
              title="برای تغییر اندازه وقایع‌نگار بکشید"
            >
              <div className="w-1 h-14 rounded-full bg-saloon-800 group-hover:bg-amber-400 group-active:bg-amber-300 transition-colors flex flex-col items-center justify-center gap-1">
                <span className="w-0.5 h-0.5 rounded-full bg-zinc-400" />
                <span className="w-0.5 h-0.5 rounded-full bg-zinc-400" />
                <span className="w-0.5 h-0.5 rounded-full bg-zinc-400" />
              </div>
            </div>

            {/* 2. Center Western Table with Dynamic Scale and centered Action Effects */}
            <div className="flex-1 w-full h-full flex items-center justify-center relative overflow-hidden">
              <WesternTable
                gameState={gameState}
                myPlayerId={myPlayerId}
                selectedCard={selectedCard}
                onSelectTarget={handleSelectTarget}
                onInspectPlayer={(p) => setInspectedPlayer(p)}
                onInspectCard={(c) => setInspectedCard(c)}
                activeEffect={activeEffect}
                onEffectComplete={() => setActiveEffect(null)}
                tableScale={currentTableScale}
                maxWidthClass={tableMaxWidthClass}
                onZoomIn={() => setTableZoomOffset((prev) => Math.min(0.35, prev + 0.08))}
                onZoomOut={() => setTableZoomOffset((prev) => Math.max(-0.35, prev - 0.08))}
                onResetZoom={() => setTableZoomOffset(0)}
                speakingPlayerIds={speakingPlayerIds}
                isActionLocked={isGameActionLocked}
                isMobile={isMobilePortrait}
              />
            </div>

            {/* Desktop Draggable Divider Handle for Saloon Chat */}
            {!isChatHidden && (
              <div
                onMouseDown={handleStartChatResize}
                onTouchStart={handleStartChatResize}
                className="hidden lg:flex w-2.5 hover:w-3.5 hover:bg-amber-500/25 active:bg-amber-500/50 cursor-col-resize items-center justify-center group transition-all self-stretch select-none z-20 shrink-0"
                title="برای تغییر اندازه چت سالون بکشید"
              >
                <div className="w-1 h-14 rounded-full bg-saloon-800 group-hover:bg-amber-400 group-active:bg-amber-300 transition-colors flex flex-col items-center justify-center gap-1">
                  <span className="w-0.5 h-0.5 rounded-full bg-zinc-400" />
                  <span className="w-0.5 h-0.5 rounded-full bg-zinc-400" />
                  <span className="w-0.5 h-0.5 rounded-full bg-zinc-400" />
                </div>
              </div>
            )}

            {/* 3. Desktop Right Side Saloon Chat & Voice Panel */}
            <div
              style={{
                width: isChatCollapsed ? 48 : chatWidth,
                transition: isResizingChatRef.current ? 'none' : 'width 0.2s ease-out',
              }}
              className={`${isChatHidden ? 'hidden' : 'hidden lg:block'} p-2 sm:p-3 self-stretch shrink-0 overflow-hidden`}
            >
              <SaloonChatPanel
                roomId={roomId}
                myPlayerId={myPlayerId}
                playerName={playerName}
                players={gameState.players}
                currentWidth={chatWidth}
                isCollapsed={isChatCollapsed}
                onToggleCollapse={() => setIsChatCollapsed((prev) => !prev)}
                onClose={() => setIsChatHidden(true)}
                onResizeStep={(delta) => {
                  if (isChatCollapsed) setIsChatCollapsed(false);
                  setChatWidth((prev) => Math.max(180, Math.min(520, prev + delta)));
                }}
                unreadCount={chatUnreadCount}
                onResetUnread={() => setChatUnreadCount(0)}
                onSpeakingPeersChange={setSpeakingPlayerIds}
                voiceController={voiceController}
              />
            </div>
          </div>

          {/* Player's Hand Cards Dock */}
          {myPlayer && !myPlayer.isEliminated && (
            <HandCards
              cards={myPlayer.hand}
              cardSize={currentCardSize}
              selectedCardId={selectedCardId}
              isMyTurn={isMyTurn}
              turnPhase={gameState.turnPhase}
              characterName={myPlayer.character?.name}
              currentHp={myPlayer.currentHp}
              maxHp={myPlayer.maxHp}
              onSelectCard={handleSelectCard}
              onPlaySelectedCard={handlePlaySelectedCard}
              onCancelSelection={() => setSelectedCardId(null)}
              onEndTurn={handleEndTurn}
              onDiscardCard={handleDiscardCard}
              onUseSidKetchum={handleUseSidKetchum}
              isEffectActive={isGameActionLocked}
            />
          )}

          {/* Role Reveal Countdown Global Banner (Visible during initial reveal) */}
          {typeof gameState.revealCountdown === 'number' && gameState.revealCountdown > 0 && (
            <div className="fixed top-14 left-1/2 -translate-x-1/2 bg-saloon-900/95 border-2 border-amber-500 text-amber-200 px-6 py-2.5 rounded-2xl shadow-2xl z-40 flex items-center gap-3 animate-pulse text-xs font-bold">
              <span className="text-xl">⏳</span>
              <span>
                زمان مطالعه نقش‌ها — بازی تا{' '}
                <span className="text-white font-black text-sm px-2 py-0.5 bg-amber-600 rounded-lg mx-1">
                  {gameState.revealCountdown}
                </span>{' '}
                ثانیه دیگر رسماً آغاز می‌شود!
              </span>
            </div>
          )}

          {/* General Store In-Progress Banner for Waiting Players */}
          {gameState.pendingReaction?.type === 'general_store' &&
            gameState.pendingReaction.targetPlayerId !== myPlayer?.id && (
              <div className="fixed top-14 left-1/2 -translate-x-1/2 bg-saloon-900/95 border-2 border-amber-500 text-amber-200 px-5 py-2.5 rounded-2xl shadow-2xl z-40 flex items-center gap-3 animate-pulse text-xs font-bold">
                <span className="text-lg">🏪</span>
                <span>
                  فروشگاه باز است — در حال حاضر نوبت{' '}
                  <span className="text-white font-black underline">
                    {gameState.players.find((p) => p.id === gameState.pendingReaction?.targetPlayerId)?.name}
                  </span>{' '}
                  است که کارت انتخاب کند...
                </span>
              </div>
            )}

          {/* Cinematic Western Bang Showdown Arena (Table blurs, shooter & defender standoff side by side) */}
          <BangShowdownOverlay
            gameState={gameState}
            myPlayerId={myPlayerId}
            activeEffect={activeEffect}
            onRespondReaction={handleRespondReaction}
            onDismissEffect={() => setActiveEffect(null)}
          />

          {/* Reaction Modal for non-bang attacks (General Store, Duel, Indians, Gatling) */}
          {gameState.pendingReaction && gameState.pendingReaction.type !== 'bang' && myPlayer && (
            <ReactionModal
              pendingReaction={gameState.pendingReaction}
              myPlayer={myPlayer}
              attackerName={attackerPlayer?.name || 'حریف'}
              onRespond={handleRespondReaction}
            />
          )}

          {/* Game Over Modal */}
          {gameState.status === 'game_over' && gameState.winner && (
            <GameOverModal
              winner={gameState.winner}
              players={gameState.players}
              onBackToLobby={() => {
                // Return to home or reload room
                router.push('/');
              }}
            />
          )}

          {/* Character & Role Reveal Modal (Auto-pops at game start or on button click) */}
          {revealModalOpen && myPlayer && (
            <CharacterRevealModal
              myPlayer={myPlayer}
              revealCountdown={gameState.revealCountdown}
              onClose={() => setRevealModalOpen(false)}
            />
          )}

          {/* Mid-Game Character & Ability Inspector Modal (Click on any player seat) */}
          {inspectedPlayer && (
            <CharacterDetailModal
              player={inspectedPlayer}
              isMe={inspectedPlayer.id === myPlayer?.id}
              onClose={() => setInspectedPlayer(null)}
            />
          )}

          {/* Card Detail & Rules Inspector Modal */}
          {inspectedCard && (
            <CardDetailModal
              card={inspectedCard}
              onClose={() => setInspectedCard(null)}
            />
          )}

          {/* Interactive Special Draw Modal (Pedro Ramirez, Jesse Jones, Kit Carlson) */}
          {gameState.turnPhase === 'draw' &&
            gameState.specialDrawPrompt &&
            myPlayer &&
            gameState.specialDrawPrompt.playerId === myPlayer.id && (
              <SpecialDrawModal
                prompt={gameState.specialDrawPrompt}
                topDiscard={gameState.topDiscard}
                opponents={gameState.players.filter((p) => p.id !== myPlayer.id)}
                onResolve={handleResolveSpecialDraw}
              />
            )}

          {/* Interactive Target Card Selection Modal (Cat Balou & Panic) */}
          {targetSelectModalData && (
            <TargetCardSelectModal
              actionCard={targetSelectModalData.actionCard}
              targetPlayer={targetSelectModalData.targetPlayer}
              onConfirm={handleConfirmTargetCard}
              onCancel={() => setTargetSelectModalData(null)}
            />
          )}

          {/* Mobile Game Log Modal */}
          {logModalOpen && (
            <div
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 select-none animate-in fade-in duration-200 lg:hidden"
              onClick={() => setLogModalOpen(false)}
            >
              <div
                className="relative bg-saloon-950 border-2 border-amber-600/80 rounded-3xl max-w-md w-full p-2 shadow-2xl text-right overflow-hidden flex flex-col h-[520px]"
                onClick={(e) => e.stopPropagation()}
              >
                <GameLog
                  logs={gameState.logs}
                  players={gameState.players}
                  myPlayerId={myPlayerId}
                  onClose={() => setLogModalOpen(false)}
                  className="h-full border-none shadow-none p-2 bg-transparent"
                />
              </div>
            </div>
          )}

        </div>
      )}

      {/* Floating Reopen Chat Button (when hidden on desktop, in either lobby or playing) */}
      {isChatHidden && (
        <button
          onClick={() => {
            setIsChatHidden(false);
            setIsChatCollapsed(false);
            setChatUnreadCount(0);
          }}
          className="hidden lg:flex fixed bottom-28 right-5 z-40 bg-gradient-to-r from-amber-800 to-saloon-900 hover:from-amber-700 hover:to-saloon-800 border-2 border-amber-500/80 hover:border-amber-400 text-amber-200 hover:text-white px-4 py-2.5 rounded-2xl shadow-2xl items-center gap-2 text-xs font-black transition-all hover:scale-105 active:scale-95 group select-none"
          title="نمایش مجدد چت و ویس‌چت سالون"
        >
          <span className="text-base group-hover:rotate-12 transition-transform">💬</span>
          <span>چت و ویس سالون</span>
          {chatUnreadCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-black flex items-center justify-center animate-bounce shadow">
              {chatUnreadCount > 9 ? '+۹' : chatUnreadCount}
            </span>
          )}
          <span className="text-emerald-400 text-xs">🎙️</span>
        </button>
      )}

      {/* Saloon Chat Modal (For Mobile screens or Lobby view) */}
      {chatMobileOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 select-none animate-in fade-in duration-200"
          onClick={() => setChatMobileOpen(false)}
        >
          <div
            className="relative bg-saloon-950 border-2 border-amber-600/80 rounded-3xl max-w-md w-full p-2 shadow-2xl text-right overflow-hidden flex flex-col h-[560px]"
            onClick={(e) => e.stopPropagation()}
          >
            <SaloonChatPanel
              roomId={roomId}
              myPlayerId={myPlayerId}
              playerName={playerName}
              players={gameState.players}
              currentWidth={360}
              isCollapsed={false}
              onToggleCollapse={() => setChatMobileOpen(false)}
              onClose={() => setChatMobileOpen(false)}
              onResizeStep={() => {}}
              className="h-full border-none shadow-none p-1 bg-transparent w-full"
              unreadCount={chatUnreadCount}
              onResetUnread={() => setChatUnreadCount(0)}
              onSpeakingPeersChange={setSpeakingPlayerIds}
              voiceController={voiceController}
            />
          </div>
        </div>
      )}
    </div>
  );
}
