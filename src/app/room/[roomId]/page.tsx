'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSocket } from '@/lib/socket/client';
import { PublicGameState, PublicPlayer, Card, TargetCardChoice, ActionEffect } from '@/lib/game-engine/types';
import { LobbyRoom } from '@/components/lobby/LobbyRoom';
import { WesternTable } from '@/components/game/WesternTable';
import { HandCards } from '@/components/game/HandCards';
import { ReactionModal } from '@/components/game/ReactionModal';
import { GameLog } from '@/components/game/GameLog';
import { GameOverModal } from '@/components/game/GameOverModal';
import { CharacterRevealModal } from '@/components/game/CharacterRevealModal';
import { CharacterDetailModal } from '@/components/game/CharacterDetailModal';
import { CardDetailModal } from '@/components/game/CardDetailModal';
import { SpecialDrawModal } from '@/components/game/SpecialDrawModal';
import { TargetCardSelectModal } from '@/components/game/TargetCardSelectModal';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { ActionAnimationOverlay } from '@/components/game/ActionAnimationOverlay';
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
  const [gameLogWidth, setGameLogWidth] = useState<number>(320);
  const [isLogCollapsed, setIsLogCollapsed] = useState<boolean>(false);
  const [tableZoomOffset, setTableZoomOffset] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isResizingRef = useRef<boolean>(false);

  // Persist log width & collapse preferences
  useEffect(() => {
    try {
      const savedWidth = localStorage.getItem('bang_log_width');
      if (savedWidth) {
        const w = parseInt(savedWidth, 10);
        if (!isNaN(w) && w >= 160 && w <= 560) setGameLogWidth(w);
      }
      const savedCollapsed = localStorage.getItem('bang_log_collapsed');
      if (savedCollapsed) {
        setIsLogCollapsed(savedCollapsed === 'true');
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('bang_log_width', String(gameLogWidth));
      localStorage.setItem('bang_log_collapsed', String(isLogCollapsed));
    } catch (e) {}
  }, [gameLogWidth, isLogCollapsed]);

  // Compute table dynamic scale and max width class based on GameLog width and manual zoom
  const baseTableScale = useMemo(() => {
    if (isLogCollapsed) return 1.14;
    if (gameLogWidth <= 240) return 1.08;
    if (gameLogWidth <= 320) return 1.0;
    if (gameLogWidth <= 420) return 0.92;
    return 0.84;
  }, [isLogCollapsed, gameLogWidth]);

  const currentTableScale = Math.max(0.65, Math.min(1.4, baseTableScale + tableZoomOffset));

  const tableMaxWidthClass = useMemo(() => {
    if (isLogCollapsed) return 'max-w-7xl';
    if (gameLogWidth <= 240) return 'max-w-6xl';
    if (gameLogWidth <= 340) return 'max-w-5xl';
    return 'max-w-4xl';
  }, [isLogCollapsed, gameLogWidth]);

  const currentCardSize: 'sm' | 'md' | 'lg' = useMemo(() => {
    if (currentTableScale >= 1.08) return 'md';
    if (currentTableScale <= 0.88) return 'sm';
    return 'md';
  }, [currentTableScale]);

  const handleStartResize = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMove = (moveEvent: MouseEvent | TouchEvent) => {
      if (!isResizingRef.current || !containerRef.current) return;
      const clientX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const rect = containerRef.current.getBoundingClientRect();
      const isLogOnLeft = clientX - rect.left < rect.right - clientX;
      const newWidth = isLogOnLeft
        ? Math.max(160, Math.min(560, clientX - rect.left))
        : Math.max(160, Math.min(560, rect.right - clientX));

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
  const isMyTurn = gameState?.currentTurnPlayerId === myPlayerId;

  const selectedCard = useMemo(() => {
    if (!selectedCardId || !myPlayer?.hand) return null;
    return myPlayer.hand.find((c: Card) => c.id === selectedCardId) || null;
  }, [selectedCardId, myPlayer]);

  const handleSelectCard = (card: Card) => {
    soundEngine.playCardDraw();
    if (selectedCardId === card.id) {
      setSelectedCardId(null);
    } else {
      setSelectedCardId(card.id);
    }
  };

  const handlePlaySelectedCard = () => {
    if (!selectedCardId) return;
    const socket = getSocket();
    socket.emit('play_card', { roomId, cardId: selectedCardId });
    setSelectedCardId(null);
  };

  const handleSelectTarget = (targetPlayerId: string) => {
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
    if (!targetSelectModalData) return;
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
    const socket = getSocket();
    socket.emit('discard_card', { roomId, cardId });
  };

  const handleEndTurn = () => {
    const socket = getSocket();
    socket.emit('end_turn', { roomId });
    setSelectedCardId(null);
  };

  const handleResolveSpecialDraw = (choice: {
    type: 'deck' | 'discard' | 'player' | 'kit';
    targetPlayerId?: string;
    kitSelectedIndices?: number[];
  }) => {
    const socket = getSocket();
    socket.emit('resolve_special_draw', { roomId, choice });
  };

  const handleUseSidKetchum = (cardIds: string[]) => {
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
    <div className="min-h-screen flex flex-col bg-saloon-950 text-saloon-100 relative selection:bg-amber-600">
      {/* Top Navigation Bar */}
      <header className="w-full bg-saloon-900/90 border-b border-saloon-800 px-4 py-2 flex items-center justify-between z-20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/')}
            className="text-xs text-zinc-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
          >
            <span>← خروج</span>
          </button>
          <div className="h-4 w-[1px] bg-saloon-700" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">اتاق:</span>
            <span className="text-xs font-black text-amber-400 font-mono tracking-wider">
              {roomId}
            </span>
          </div>
        </div>

        {/* Center Official Game Brand Logo */}
        <div className="hidden sm:flex items-center">
          <BrandLogo variant="compact" size="sm" />
        </div>

        {/* Audio Toggle & User Name & Role Card Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          {myPlayer && gameState.status === 'playing' && (
            <button
              onClick={() => setRevealModalOpen(true)}
              className="text-xs font-bold text-amber-300 hover:text-amber-200 bg-saloon-800 hover:bg-saloon-700 border border-amber-600/50 px-2.5 py-1 rounded-xl transition-all shadow-sm flex items-center gap-1 active:scale-95"
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
              className="text-xs font-bold text-amber-300 hover:text-amber-200 bg-saloon-800 hover:bg-saloon-700 border border-amber-600/50 px-2.5 py-1 rounded-xl transition-all shadow-sm flex items-center gap-1 active:scale-95 lg:hidden"
              title="مشاهده وقایع‌نگار و رخدادهای بازی"
            >
              <span>📜</span>
              <span>وقایع</span>
            </button>
          )}
          <button
            onClick={handleToggleSound}
            className="text-xs text-zinc-300 hover:text-amber-300 bg-saloon-800 border border-saloon-700 px-2.5 py-1 rounded-xl transition-all"
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
        <div className="flex-1 flex items-center justify-center p-4">
          <LobbyRoom
            gameState={gameState}
            myPlayerId={myPlayerId}
            onAddBot={() => getSocket().emit('add_bot', { roomId })}
            onToggleReady={() => getSocket().emit('toggle_ready', { roomId })}
            onStartGame={() => getSocket().emit('start_game', { roomId })}
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-between overflow-y-auto">
          {/* Western Table & Resizable Game Log Arena */}
          <div
            ref={containerRef}
            className="flex-1 flex flex-col lg:flex-row items-center justify-center relative w-full overflow-hidden"
          >
            {/* Western Table with Dynamic Scale and centered Action Effects */}
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
              />
            </div>

            {/* Desktop Draggable Divider Handle */}
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

            {/* Desktop Side Game Log with Dynamic Width & Collapse */}
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
                  setGameLogWidth((prev) => Math.max(160, Math.min(560, prev + delta)));
                }}
                currentWidth={gameLogWidth}
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

          {/* Reaction Modal if attacked */}
          {gameState.pendingReaction && myPlayer && (
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
    </div>
  );
}
