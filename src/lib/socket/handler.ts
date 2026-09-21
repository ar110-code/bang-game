import { Server, Socket } from 'socket.io';
import { GameState, TargetCardChoice, ChatMessage, VoicePeerState } from '../game-engine/types';
import {
  createInitialState,
  addPlayerToRoom,
  removePlayerFromRoom,
  startGame,
  startTurn,
  playCard,
  respondToReaction,
  discardExcessCard,
  endTurn,
  resolveSpecialDraw,
  useSidKetchumHeal,
  sanitizeGameStateForPlayer,
} from '../game-engine/engine';
import { executeBotTurn } from '../game-engine/bot';

const rooms = new Map<string, GameState>();
const socketPlayerMap = new Map<string, { roomId: string; playerId: string }>();
const botActionTimers = new Map<string, NodeJS.Timeout>();
const roomCountdownTimers = new Map<string, NodeJS.Timeout>();
const roomChatMap = new Map<string, ChatMessage[]>();
const voiceRooms = new Map<string, Map<string, VoicePeerState>>();
const roomEffectLocks = new Map<string, number>();

export function setupSocketHandlers(io: Server) {
  function broadcastState(roomId: string) {
    const state = rooms.get(roomId);
    if (!state) return;

    // Send personalized sanitized state to each player in room
    const roomSockets = io.sockets.adapter.rooms.get(roomId);
    if (roomSockets) {
      for (const socketId of roomSockets) {
        const mapping = socketPlayerMap.get(socketId);
        if (mapping && mapping.roomId === roomId) {
          const sanitized = sanitizeGameStateForPlayer(state, mapping.playerId);
          io.to(socketId).emit('game_state', sanitized);
        }
      }
    }

    if (state.lastEffect) {
      const effType = state.lastEffect.type;
      io.to(roomId).emit('action_effect', state.lastEffect);

      // Lock room actions during animations so no one can play cards or end turn prematurely
      if (effType === 'missed' || effType === 'hit' || effType === 'barrel_success') {
        roomEffectLocks.set(roomId, Date.now() + 2200);
      } else if (effType === 'bang' && !state.pendingReaction) {
        roomEffectLocks.set(roomId, Date.now() + 2500);
      } else if (effType === 'dynamite_explode') {
        roomEffectLocks.set(roomId, Date.now() + 2500);
      } else if (effType === 'gatling' || effType === 'indians') {
        roomEffectLocks.set(roomId, Date.now() + 1800);
      }

      state.lastEffect = null;
    }

    // Check if a Bot needs to take an action with a safe guarded timer
    let botTargetId: string | null = null;
    if (state.status === 'playing' && (!state.revealCountdown || state.revealCountdown <= 0)) {
      if (state.pendingReaction) {
        const targetId =
          state.pendingReaction.type === 'duel'
            ? state.pendingReaction.duelTurnPlayerId
            : state.pendingReaction.targetPlayerId;

        const targetPlayer = state.players.find((p) => p.id === targetId);
        if (targetPlayer?.isBot && !targetPlayer.isEliminated) {
          botTargetId = targetPlayer.id;
        }
      } else if (state.currentTurnPlayerId) {
        const turnPlayer = state.players.find((p) => p.id === state.currentTurnPlayerId);
        if (turnPlayer?.isBot && !turnPlayer.isEliminated) {
          botTargetId = turnPlayer.id;
        }
      }
    }

    const existingTimer = botActionTimers.get(roomId);
    if (botTargetId) {
      if (!existingTimer) {
        // Paced bot thinking and reaction time:
        // Wait until any active attack/showdown animation completes, plus natural thinking delay
        const lockUntil = roomEffectLocks.get(roomId) || 0;
        const now = Date.now();
        const lockWait = lockUntil > now ? lockUntil - now : 0;

        let baseDelay = 1800;
        if (state.pendingReaction) {
          // Bot responding to Bang / Duel / Indians attack
          baseDelay = 2000 + Math.floor(Math.random() * 500); // 2.0s - 2.5s
        } else if (state.turnPhase === 'discard') {
          // Discarding cards
          baseDelay = 1300 + Math.floor(Math.random() * 400); // 1.3s - 1.7s
        } else {
          // Normal action phase (equipping, playing utility, shooting)
          baseDelay = 1800 + Math.floor(Math.random() * 600); // 1.8s - 2.4s
        }

        const totalDelay = lockWait + baseDelay;

        const timer = setTimeout(() => {
          botActionTimers.delete(roomId);
          const currentState = rooms.get(roomId);
          if (currentState && currentState.status === 'playing') {
            executeBotTurn(currentState, botTargetId!, () => broadcastState(roomId));
          }
        }, totalDelay);
        botActionTimers.set(roomId, timer);
      }
    } else if (existingTimer) {
      clearTimeout(existingTimer);
      botActionTimers.delete(roomId);
    }
  }

  io.on('connection', (socket: Socket) => {
    socket.on(
      'join_room',
      ({
        roomId,
        playerName,
        playerId: requestedPlayerId,
      }: {
        roomId: string;
        playerName: string;
        playerId?: string;
      }) => {
        const cleanRoomId = roomId.toUpperCase().trim();
        let state = rooms.get(cleanRoomId);

        if (!state) {
          state = createInitialState(cleanRoomId);
          rooms.set(cleanRoomId, state);
        }

        const normName = playerName ? playerName.trim().toLowerCase() : '';

        // Check if player already in room by persistent playerId or normalized name
        let player = state.players.find(
          (p) =>
            !p.isBot &&
            ((requestedPlayerId && p.id === requestedPlayerId) ||
              (normName && p.name.trim().toLowerCase() === normName))
        );

        if (!player) {
          if (state.status !== 'lobby') {
            socket.emit('error_message', 'بازی از قبل شروع شده است.');
            return;
          }
          const playerId =
            requestedPlayerId ||
            `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          player = addPlayerToRoom(state, playerId, playerName.trim(), false) || undefined;
        }

        if (player) {
          socket.join(cleanRoomId);
          socketPlayerMap.set(socket.id, { roomId: cleanRoomId, playerId: player.id });
          broadcastState(cleanRoomId);

          // Emit chat history to joining player
          const chatHistory = roomChatMap.get(cleanRoomId) || [];
          socket.emit('chat_history', chatHistory);
        }
      }
    );

    socket.on('add_bot', ({ roomId }: { roomId: string }) => {
      const cleanRoomId = roomId.toUpperCase().trim();
      const state = rooms.get(cleanRoomId);
      if (!state || state.status !== 'lobby' || state.players.length >= 7) return;

      const botNames = ['بیلی هفت‌تیرکش', 'کلانتر پیت', 'جک دیوانه', 'رد داگ', 'تگزاس جیم', 'داک هالیدی'];
      const unusedNames = botNames.filter((name) => !state.players.some((p) => p.name.includes(name)));
      const botName = (unusedNames[0] || `ربات ${state.players.length + 1}`) + ' 🤖';

      const botId = `bot_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
      addPlayerToRoom(state, botId, botName, true);
      broadcastState(cleanRoomId);
    });

    socket.on('toggle_ready', ({ roomId }: { roomId: string }) => {
      const cleanRoomId = roomId.toUpperCase().trim();
      const state = rooms.get(cleanRoomId);
      const mapping = socketPlayerMap.get(socket.id);
      if (!state || !mapping) return;

      const player = state.players.find((p) => p.id === mapping.playerId);
      if (player) {
        player.isReady = !player.isReady;
        broadcastState(cleanRoomId);
      }
    });

    socket.on('start_game', ({ roomId }: { roomId: string }) => {
      const cleanRoomId = roomId.toUpperCase().trim();
      const state = rooms.get(cleanRoomId);
      const mapping = socketPlayerMap.get(socket.id);
      if (!state || !mapping) return;

      const host = state.players.find((p) => p.id === mapping.playerId && p.isHost);
      if (!host) {
        socket.emit('error_message', 'فقط میزبان می‌تواند بازی را آغاز کند.');
        return;
      }

      if (state.players.length < 4) {
        socket.emit('error_message', 'برای شروع بازی حداقل به ۴ بازیکن نیاز است.');
        return;
      }

      const started = startGame(state);
      if (started) {
        // Clear any prior timer for this room
        const existingCountdown = roomCountdownTimers.get(cleanRoomId);
        if (existingCountdown) {
          clearInterval(existingCountdown);
          roomCountdownTimers.delete(cleanRoomId);
        }

        broadcastState(cleanRoomId);

        let count = 7;
        const countdownInterval = setInterval(() => {
          const currentState = rooms.get(cleanRoomId);
          if (!currentState || currentState.status !== 'playing') {
            clearInterval(countdownInterval);
            roomCountdownTimers.delete(cleanRoomId);
            return;
          }

          count -= 1;
          currentState.revealCountdown = count;

          if (count <= 0) {
            clearInterval(countdownInterval);
            roomCountdownTimers.delete(cleanRoomId);
            currentState.revealCountdown = null;

            // Start first turn for the Sheriff
            const sheriff = currentState.players.find((p) => p.role === 'sheriff');
            if (sheriff) {
              startTurn(currentState, sheriff.id);
            }
          }

          broadcastState(cleanRoomId);
        }, 1000);

        roomCountdownTimers.set(cleanRoomId, countdownInterval);
      }
    });

    socket.on(
      'play_card',
      ({
        roomId,
        cardId,
        targetPlayerId,
        targetCardChoice,
      }: {
        roomId: string;
        cardId: string;
        targetPlayerId?: string;
        targetCardChoice?: TargetCardChoice;
      }) => {
        const cleanRoomId = roomId.toUpperCase().trim();
        const state = rooms.get(cleanRoomId);
        const mapping = socketPlayerMap.get(socket.id);
        if (!state || !mapping) return;

        const lockUntil = roomEffectLocks.get(cleanRoomId);
        if (lockUntil && Date.now() < lockUntil) {
          socket.emit('error_message', 'لطفاً تا پایان انیمیشن شلیک و افکت بازی منتظر بمانید.');
          return;
        }

        if (state.pendingReaction) {
          socket.emit('error_message', 'ابتدا باید به شلیک یا رخداد فعلی بازی پاسخ داده شود.');
          return;
        }

        const result = playCard(state, mapping.playerId, cardId, targetPlayerId, targetCardChoice);
        if (!result.success && result.message) {
          socket.emit('error_message', result.message);
        }
        broadcastState(cleanRoomId);
      }
    );

    socket.on('respond_reaction', ({ roomId, action, cardId }: { roomId: string; action: 'play' | 'pass'; cardId?: string }) => {
      const cleanRoomId = roomId.toUpperCase().trim();
      const state = rooms.get(cleanRoomId);
      const mapping = socketPlayerMap.get(socket.id);
      if (!state || !mapping) return;

      const result = respondToReaction(state, mapping.playerId, action, cardId);
      if (!result.success && result.message) {
        socket.emit('error_message', result.message);
      }
      broadcastState(cleanRoomId);
    });

    socket.on('discard_card', ({ roomId, cardId }: { roomId: string; cardId: string }) => {
      const cleanRoomId = roomId.toUpperCase().trim();
      const state = rooms.get(cleanRoomId);
      const mapping = socketPlayerMap.get(socket.id);
      if (!state || !mapping) return;

      const lockUntil = roomEffectLocks.get(cleanRoomId);
      if (lockUntil && Date.now() < lockUntil) {
        socket.emit('error_message', 'لطفاً تا پایان انیمیشن شلیک منتظر بمانید.');
        return;
      }

      if (state.pendingReaction) {
        socket.emit('error_message', 'در حال حاضر واکنشی در جریان است و نمی‌توانید کارت بسوزانید.');
        return;
      }

      const result = discardExcessCard(state, mapping.playerId, cardId);
      if (!result.success && result.message) {
        socket.emit('error_message', result.message);
      }
      broadcastState(cleanRoomId);
    });

    socket.on('end_turn', ({ roomId }: { roomId: string }) => {
      const cleanRoomId = roomId.toUpperCase().trim();
      const state = rooms.get(cleanRoomId);
      const mapping = socketPlayerMap.get(socket.id);
      if (!state || !mapping) return;

      const lockUntil = roomEffectLocks.get(cleanRoomId);
      if (lockUntil && Date.now() < lockUntil) {
        socket.emit('error_message', 'لطفاً تا پایان انیمیشن شلیک منتظر بمانید.');
        return;
      }

      if (state.pendingReaction) {
        socket.emit('error_message', 'در حال حاضر واکنشی در جریان است و نمی‌توانید نوبت را پایان دهید.');
        return;
      }

      const result = endTurn(state, mapping.playerId);
      if (!result.success && result.message) {
        socket.emit('error_message', result.message);
      }
      broadcastState(cleanRoomId);
    });

    socket.on(
      'resolve_special_draw',
      ({
        roomId,
        choice,
      }: {
        roomId: string;
        choice: {
          type: 'deck' | 'discard' | 'player' | 'kit';
          targetPlayerId?: string;
          kitSelectedIndices?: number[];
        };
      }) => {
        const cleanRoomId = roomId.toUpperCase().trim();
        const state = rooms.get(cleanRoomId);
        const mapping = socketPlayerMap.get(socket.id);
        if (!state || !mapping) return;

        const lockUntil = roomEffectLocks.get(cleanRoomId);
        if (lockUntil && Date.now() < lockUntil) {
          socket.emit('error_message', 'لطفاً تا پایان انیمیشن شلیک منتظر بمانید.');
          return;
        }

        const result = resolveSpecialDraw(state, mapping.playerId, choice);
        if (!result.success && result.message) {
          socket.emit('error_message', result.message);
        }
        broadcastState(cleanRoomId);
      }
    );

    socket.on(
      'use_sid_ketchum',
      ({ roomId, cardIds }: { roomId: string; cardIds: string[] }) => {
        const cleanRoomId = roomId.toUpperCase().trim();
        const state = rooms.get(cleanRoomId);
        const mapping = socketPlayerMap.get(socket.id);
        if (!state || !mapping) return;

        const lockUntil = roomEffectLocks.get(cleanRoomId);
        if (lockUntil && Date.now() < lockUntil) {
          socket.emit('error_message', 'لطفاً تا پایان انیمیشن شلیک منتظر بمانید.');
          return;
        }

        const result = useSidKetchumHeal(state, mapping.playerId, cardIds);
        if (!result.success && result.message) {
          socket.emit('error_message', result.message);
        }
        broadcastState(cleanRoomId);
      }
    );

    // ================= CHAT HANDLERS =================
    socket.on(
      'send_chat_message',
      ({ roomId, text, type }: { roomId: string; text: string; type?: 'text' | 'quick' }) => {
        const cleanRoomId = roomId.toUpperCase().trim();
        const state = rooms.get(cleanRoomId);
        const mapping = socketPlayerMap.get(socket.id);
        if (!state || !mapping) return;

        const trimmed = (text || '').trim();
        if (!trimmed || trimmed.length > 350) return;

        const player = state.players.find((p) => p.id === mapping.playerId);
        if (!player) return;

        const message: ChatMessage = {
          id: `chat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          senderId: player.id,
          senderName: player.name,
          senderCharacterName: player.character?.name,
          senderCharacterTitleFa: player.character?.titleFa,
          senderRole: player.role === 'sheriff' || player.isEliminated ? player.role : 'hidden',
          text: trimmed,
          timestamp: Date.now(),
          type: type || 'text',
        };

        if (!roomChatMap.has(cleanRoomId)) {
          roomChatMap.set(cleanRoomId, []);
        }
        const history = roomChatMap.get(cleanRoomId)!;
        history.push(message);
        if (history.length > 120) {
          history.shift();
        }

        io.to(cleanRoomId).emit('new_chat_message', message);
      }
    );

    socket.on('get_chat_history', ({ roomId }: { roomId: string }) => {
      const cleanRoomId = roomId.toUpperCase().trim();
      const history = roomChatMap.get(cleanRoomId) || [];
      socket.emit('chat_history', history);
    });

    // ================= WEBRTC VOICE CHAT SIGNALING =================
    socket.on(
      'voice_join',
      ({
        roomId,
        playerId: fallbackPlayerId,
        playerName: fallbackPlayerName,
      }: {
        roomId: string;
        playerId?: string;
        playerName?: string;
      }) => {
        const cleanRoomId = roomId.toUpperCase().trim();
        const state = rooms.get(cleanRoomId);
        if (!state) return;

        let mapping = socketPlayerMap.get(socket.id);
        let player = mapping ? state.players.find((p) => p.id === mapping!.playerId) : undefined;

        if (!player && fallbackPlayerId) {
          player = state.players.find((p) => p.id === fallbackPlayerId);
        }
        if (!player && fallbackPlayerName) {
          const norm = fallbackPlayerName.trim().toLowerCase();
          player = state.players.find((p) => p.name.trim().toLowerCase() === norm);
        }

        if (!player) return;

        // Ensure socket mapping and socket room join
        socketPlayerMap.set(socket.id, { roomId: cleanRoomId, playerId: player.id });
        socket.join(cleanRoomId);

        if (!voiceRooms.has(cleanRoomId)) {
          voiceRooms.set(cleanRoomId, new Map());
        }
        const roomVoicePeers = voiceRooms.get(cleanRoomId)!;

        const newPeer: VoicePeerState = {
          playerId: player.id,
          socketId: socket.id,
          name: player.name,
          characterName: player.character?.name,
          isMuted: false,
          isDeafened: false,
          isSpeaking: false,
        };

        // 1. Send currently connected voice peers to the newcomer
        const existingPeers = Array.from(roomVoicePeers.values());
        socket.emit('voice_room_peers', { peers: existingPeers });

        // 2. Save newcomer in voice room
        roomVoicePeers.set(socket.id, newPeer);

        // 3. Notify everyone else in the room
        socket.to(cleanRoomId).emit('voice_peer_joined', { peer: newPeer });
      }
    );

    socket.on('voice_leave', ({ roomId }: { roomId: string }) => {
      const cleanRoomId = roomId.toUpperCase().trim();
      const roomVoicePeers = voiceRooms.get(cleanRoomId);
      if (roomVoicePeers && roomVoicePeers.has(socket.id)) {
        roomVoicePeers.delete(socket.id);
        io.to(cleanRoomId).emit('voice_peer_left', { socketId: socket.id });
      }
    });

    socket.on(
      'voice_signal',
      ({ toSocketId, signal }: { roomId: string; toSocketId: string; signal: any }) => {
        const mapping = socketPlayerMap.get(socket.id);
        io.to(toSocketId).emit('voice_signal', {
          fromSocketId: socket.id,
          fromPlayerId: mapping?.playerId,
          signal,
        });
      }
    );

    socket.on(
      'voice_state_update',
      ({
        roomId,
        isMuted,
        isDeafened,
        isSpeaking,
      }: {
        roomId: string;
        isMuted?: boolean;
        isDeafened?: boolean;
        isSpeaking?: boolean;
      }) => {
        const cleanRoomId = roomId.toUpperCase().trim();
        const roomVoicePeers = voiceRooms.get(cleanRoomId);
        if (roomVoicePeers && roomVoicePeers.has(socket.id)) {
          const peer = roomVoicePeers.get(socket.id)!;
          if (typeof isMuted === 'boolean') peer.isMuted = isMuted;
          if (typeof isDeafened === 'boolean') peer.isDeafened = isDeafened;
          if (typeof isSpeaking === 'boolean') peer.isSpeaking = isSpeaking;

          io.to(cleanRoomId).emit('voice_peer_updated', { peer });
        }
      }
    );

    socket.on('disconnect', () => {
      const mapping = socketPlayerMap.get(socket.id);
      if (mapping) {
        // Clean up from voice chat
        const roomVoicePeers = voiceRooms.get(mapping.roomId);
        if (roomVoicePeers && roomVoicePeers.has(socket.id)) {
          roomVoicePeers.delete(socket.id);
          io.to(mapping.roomId).emit('voice_peer_left', { socketId: socket.id });
        }

        const state = rooms.get(mapping.roomId);
        if (state) {
          if (state.status === 'lobby') {
            const hasOtherSocket = Array.from(socketPlayerMap.entries()).some(
              ([sId, m]) =>
                sId !== socket.id &&
                m.roomId === mapping.roomId &&
                m.playerId === mapping.playerId
            );
            if (!hasOtherSocket) {
              removePlayerFromRoom(state, mapping.playerId);
              broadcastState(mapping.roomId);
            }
          } else {
            // During active game: Keep seated so player can reconnect seamlessly
            broadcastState(mapping.roomId);
          }
        }
        socketPlayerMap.delete(socket.id);
      }
    });
  });
}
