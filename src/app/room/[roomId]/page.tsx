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
      setGameState((prev) => {
        // Play sounds based on events
        if (state.status === 'playing') {
          if (state.logs.length > (prev?.logs.length || 0)) {
            const lastLog = state.logs[state.logs.length - 1];
            if (lastLog?.type === 'attack') soundEngine.playGunshot();
            if (lastLog?.type === 'heal') soundEngine.playHeal();
            if (lastLog?.text.includes('منفجر')) soundEngine.playExplosion();
          }
        }
        return state;
      });
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
      {/* Animated Card Action Visuals & Procedural Western Audio Overlay */}
      <ActionAnimationOverlay effect={activeEffect || gameState.lastEffect || null} />

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
          {/* Western Table */}
          <div className="flex-1 flex flex-col md:flex-row items-center justify-center relative">
            <WesternTable
              gameState={gameState}
              myPlayerId={myPlayerId}
              selectedCard={selectedCard}
              onSelectTarget={handleSelectTarget}
              onInspectPlayer={(p) => setInspectedPlayer(p)}
              onInspectCard={(c) => setInspectedCard(c)}
            />

            {/* Desktop Side Game Log with Player Filtering & Turn Dividers */}
            <div className="hidden lg:block w-84 p-4 self-stretch">
              <GameLog
                logs={gameState.logs}
                players={gameState.players}
                myPlayerId={myPlayerId}
              />
            </div>
          </div>

          {/* Player's Hand Cards Dock */}
          {myPlayer && !myPlayer.isEliminated && (
            <HandCards
              cards={myPlayer.hand}
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
