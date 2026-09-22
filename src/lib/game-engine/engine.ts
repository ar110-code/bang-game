import {
  GameState,
  Player,
  Card,
  PublicGameState,
  PublicPlayer,
  Role,
  PendingReaction,
  TargetCardChoice,
  ActionEffect,
  ActionEffectType,
} from './types';
import { CHARACTERS, ROLE_DISTRIBUTION } from './constants';
import { createDeck, drawCards, performDrawTest, shuffle } from './deck';
import { canShootTarget, calculateEffectiveDistance } from './distance';
import { addLog, damagePlayer, handleElimination, checkWinConditions, triggerEffect } from './actions';

export { triggerEffect };

export function createInitialState(roomId: string): GameState {
  return {
    roomId,
    status: 'lobby',
    players: [],
    currentTurnPlayerId: null,
    turnPhase: 'draw',
    deck: [],
    discardPile: [],
    pendingReaction: null,
    specialDrawPrompt: null,
    winner: null,
    lastEffect: null,
    logs: [
      {
        id: `init_${Date.now()}`,
        text: 'اتاق بازی ایجاد شد. بازیکنان در حال ملحق شدن...',
        type: 'system',
        timestamp: Date.now(),
      },
    ],
  };
}

export function addPlayerToRoom(
  state: GameState,
  id: string,
  name: string,
  isBot = false
): Player | null {
  if (state.status !== 'lobby' || state.players.length >= 7) {
    return null;
  }

  const isHost = state.players.length === 0;
  const player: Player = {
    id,
    name,
    isHost,
    isBot,
    isReady: isBot, // Bots are auto-ready
    role: 'outlaw', // Placeholder until start
    character: null,
    maxHp: 4,
    currentHp: 4,
    hand: [],
    equipment: {},
    bangCountThisTurn: 0,
    isEliminated: false,
  };

  state.players.push(player);
  addLog(state, `🤠 ${name} به جمع هفت‌تیرکش‌های شهر پیوست.`, 'system');
  return player;
}

export function removePlayerFromRoom(state: GameState, playerId: string) {
  const index = state.players.findIndex((p) => p.id === playerId);
  if (index === -1) return;

  const player = state.players[index];
  state.players.splice(index, 1);
  addLog(state, `🚪 ${player.name} سالون را ترک کرد.`, 'system');

  // Reassign host if host left
  if (player.isHost && state.players.length > 0) {
    state.players[0].isHost = true;
    addLog(state, `👑 ${state.players[0].name} میزبان جدید اتاق شد.`, 'system');
  }

  // If game was playing and player left, handle elimination
  if (state.status === 'playing' && !player.isEliminated) {
    handleElimination(state, playerId);
    if (state.currentTurnPlayerId === playerId) {
      advanceToNextPlayer(state);
    }
  }
}

export function checkAndAutoEquipDynamite(state: GameState, player: Player) {
  const dIdx = player.hand.findIndex((c) => c.name === 'dynamite');
  if (dIdx !== -1) {
    const dynamiteCard = player.hand.splice(dIdx, 1)[0];
    if (player.equipment.dynamite) {
      // If already has dynamite in front of him, pass to next living
      const nextLiving = getNextLivingPlayer(state, player.id);
      if (nextLiving) {
        nextLiving.equipment.dynamite = dynamiteCard;
        addLog(state, `🧨 دینامیت به دست ${player.name} رسید اما چون قبلاً دینامیت داشت، مستقیماً روبروی ${nextLiving.name} قرار گرفت!`, 'system');
      } else {
        state.discardPile.push(dynamiteCard);
      }
    } else {
      player.equipment.dynamite = dynamiteCard;
      addLog(state, `🧨 دینامیت به دست ${player.name} افتاد و بلافاصله با فتیله روشن جلوی او مجهز شد! 💥 (دست خودش نیست که بازی کند)`, 'system');
    }
  }
}

export function startGame(state: GameState): boolean {
  const playerCount = state.players.length;
  if (playerCount < 4 || playerCount > 7) {
    return false;
  }

  // Shuffle roles and characters
  const roles = shuffle([...ROLE_DISTRIBUTION[playerCount]]);
  const characters = shuffle([...CHARACTERS]);
  const deck = createDeck();

  state.deck = deck;
  state.discardPile = [];
  state.status = 'playing';
  state.revealCountdown = 7;

  // Assign roles and characters
  state.players.forEach((player, i) => {
    player.role = roles[i];
    player.character = characters[i];
    const isSheriff = player.role === 'sheriff';
    player.maxHp = player.character.baseHp + (isSheriff ? 1 : 0);
    player.currentHp = player.maxHp;
    player.equipment = {};
    player.bangCountThisTurn = 0;
    player.isEliminated = false;
    // Initial cards equal to maxHp
    player.hand = drawCards(state, player.maxHp);
    checkAndAutoEquipDynamite(state, player);
  });

  const sheriff = state.players.find((p) => p.role === 'sheriff');
  if (!sheriff) return false;

  state.currentTurnPlayerId = sheriff.id;
  addLog(state, `⭐ بازی با ${playerCount} بازیکن آغاز شد!`, 'system');
  addLog(state, `⭐ ${sheriff.name} نشان کلانتری را بر سینه زد! نظم شهر دست اوست.`, 'system');
  addLog(state, `⏳ زمان مطالعه نقش‌ها: بازی پس از اتمام تایمر رسماً آغاز خواهد شد.`, 'system');

  return true;
}

export function startTurn(state: GameState, playerId: string) {
  const player = state.players.find((p) => p.id === playerId);
  if (!player || player.isEliminated) {
    advanceToNextPlayer(state);
    return;
  }

  state.currentTurnPlayerId = playerId;
  player.bangCountThisTurn = 0;

  addLog(state, `🎯 نوبت ${player.name} فرا رسید.`, 'turn', player.id);

  const isLuckyDuke = player.character?.name === 'lucky_duke';

  // 1. Dynamite check
  if (player.equipment.dynamite) {
    addLog(state, `🧨 بررسی فتیله دینامیت جلوی ${player.name}...`, 'system');
    const test = performDrawTest(
      state,
      (c) => {
        const isSpade = c.suit === 'spades';
        const rankNum = parseInt(c.rank, 10);
        return isSpade && rankNum >= 2 && rankNum <= 9;
      },
      isLuckyDuke
    );

    const dynamiteCard = player.equipment.dynamite;
    player.equipment.dynamite = undefined;

    if (test.success) {
      // BOOM!
      addLog(state, `💥 بومممم! دینامیت منفجر شد! ۳ جان از ${player.name} کم شد. (کارت رو شده: ${test.card.suit} ${test.card.rank})`, 'death');
      triggerEffect(state, 'dynamite_explode', undefined, player.id, 'dynamite');
      state.discardPile.push(dynamiteCard);
      damagePlayer(state, player.id, 3);
      if (player.isEliminated) {
        advanceToNextPlayer(state);
        return;
      }
    } else {
      // Pass dynamite to next living player
      addLog(state, `✨ فتیله دینامیت جرقه زد اما منفجر نشد! دینامیت به نفر بعدی منتقل شد. (کارت رو شده: ${test.card.suit} ${test.card.rank})`, 'system');
      const nextLiving = getNextLivingPlayer(state, playerId);
      if (nextLiving) {
        nextLiving.equipment.dynamite = dynamiteCard;
      }
    }
  }

  // 2. Jail check
  if (player.equipment.jail) {
    addLog(state, `🔒 ${player.name} در زندان است و برای فرار تلاش می‌کند...`, 'system');
    const test = performDrawTest(state, (c) => c.suit === 'hearts', isLuckyDuke);
    state.discardPile.push(player.equipment.jail);
    player.equipment.jail = undefined;

    if (test.success) {
      addLog(state, `🔓 موفقیت! کارت دل رو شد (${test.card.rank} دل) و ${player.name} از زندان گریخت!`, 'system');
    } else {
      addLog(state, `⛔ ناکام ماند! کارت دل نیامد (${test.card.suit} ${test.card.rank}). نوبت ${player.name} سوخت!`, 'system');
      advanceToNextPlayer(state);
      return;
    }
  }

  // 3. Draw cards phase
  // Check Pedro Ramirez active choice
  if (player.character?.name === 'pedro_ramirez' && state.discardPile.length > 0) {
    state.turnPhase = 'draw';
    state.specialDrawPrompt = {
      playerId: player.id,
      characterName: 'pedro_ramirez',
    };
    addLog(state, `🤠 نوبت پدرو رامیرز است: او می‌تواند کارت اول را از کارت‌های سوخته وسط میز بردارد یا از مخزن بکشد.`, 'system');
    return;
  }

  // Check Jesse Jones active choice
  if (player.character?.name === 'jesse_jones') {
    const opponentsWithCards = state.players.filter(
      (p) => !p.isEliminated && p.id !== player.id && p.hand.length > 0
    );
    if (opponentsWithCards.length > 0) {
      state.turnPhase = 'draw';
      state.specialDrawPrompt = {
        playerId: player.id,
        characterName: 'jesse_jones',
      };
      addLog(state, `🤠 نوبت جسی جونز است: او می‌تواند کارت اول را از دست یکی از حریفان بردارد یا از مخزن بکشد.`, 'system');
      return;
    }
  }

  // Check Kit Carlson active choice
  if (player.character?.name === 'kit_carlson') {
    const kitCards = drawCards(state, 3);
    state.turnPhase = 'draw';
    state.specialDrawPrompt = {
      playerId: player.id,
      characterName: 'kit_carlson',
      kitCards,
    };
    addLog(state, `🤠 نوبت کیت کارلسون است: او ۳ کارت را می‌بیند تا ۲ کارت را انتخاب کرده و یکی را به بالای مخزن بازگرداند.`, 'system');
    return;
  }

  let drawCount = 2;
  if (player.character?.name === 'black_jack') {
    const cards = drawCards(state, 2);
    player.hand.push(...cards);
    // Black jack bonus check
    const secondCard = cards[1];
    if (secondCard) {
      const isRed = secondCard.suit === 'hearts' || secondCard.suit === 'diamonds';
      const suitFa =
        secondCard.suit === 'hearts'
          ? 'دل ♥ (قرمز)'
          : secondCard.suit === 'diamonds'
          ? 'خشت ♦ (قرمز)'
          : secondCard.suit === 'spades'
          ? 'پیک ♠ (مشکی)'
          : 'گشنیز ♣ (مشکی)';
      if (isRed) {
        const bonus = drawCards(state, 1);
        player.hand.push(...bonus);
        addLog(
          state,
          `🃏 قابلیت بلک جک: کارت دوم رو شده «${secondCard.titleFa}» (${suitFa}) بود! ۱ کارت جایزه دریافت شد.`,
          'system'
        );
        triggerEffect(state, 'stagecoach', player.id, undefined, 'stagecoach');
      } else {
        addLog(
          state,
          `🃏 قابلیت بلک جک: کارت دوم رو شده «${secondCard.titleFa}» (${suitFa}) بود (کارت مشکی بود، بدون کارت اضافه).`,
          'system'
        );
      }
    }
  } else {
    const drawn = drawCards(state, drawCount);
    player.hand.push(...drawn);
  }

  checkAndAutoEquipDynamite(state, player);
  state.turnPhase = 'action';
}

export function playCard(
  state: GameState,
  playerId: string,
  cardId: string,
  targetPlayerId?: string,
  targetCardChoice?: TargetCardChoice
): { success: boolean; message?: string } {
  const result = executePlayCard(state, playerId, cardId, targetPlayerId, targetCardChoice);
  if (result.success) {
    const player = state.players.find((p) => p.id === playerId);
    if (player) {
      checkSuzyLafayette(state, player);
    }
  }
  return result;
}

function executePlayCard(
  state: GameState,
  playerId: string,
  cardId: string,
  targetPlayerId?: string,
  targetCardChoice?: TargetCardChoice
): { success: boolean; message?: string } {
  if (state.revealCountdown && state.revealCountdown > 0) {
    return { success: false, message: 'بازی هنوز در مرحله رونمایی از نقش‌ها است.' };
  }

  if (state.currentTurnPlayerId !== playerId || state.turnPhase !== 'action') {
    return { success: false, message: 'نوبت شما نیست یا در فاز عملیات نیستید.' };
  }

  if (state.pendingReaction) {
    return { success: false, message: 'ابتدا باید به کنش فعلی پاسخ داده شود.' };
  }

  const player = state.players.find((p) => p.id === playerId);
  if (!player) return { success: false, message: 'بازیکن یافت نشد.' };

  const cardIndex = player.hand.findIndex((c) => c.id === cardId);
  if (cardIndex === -1) return { success: false, message: 'این کارت در دست شما نیست.' };

  const card = player.hand[cardIndex];

  // BROWN CARDS (Action Cards)
  if (card.border === 'brown') {
    const isBangAction =
      card.name === 'bang' ||
      (player.character?.name === 'calamity_janet' && card.name === 'missed');

    if (isBangAction) {
      if (!targetPlayerId) return { success: false, message: 'باید یک هدف برای شلیک انتخاب کنید.' };
      const target = state.players.find((p) => p.id === targetPlayerId);
      if (!target || target.isEliminated) return { success: false, message: 'هدف نامعتبر است.' };
      if (target.id === playerId) return { success: false, message: 'نمی‌توانید به خودتان شلیک کنید.' };

      // Check range
      if (!canShootTarget(state, playerId, targetPlayerId)) {
        return { success: false, message: 'هدف خارج از برد اسلحه شماست.' };
      }

      // Check Bang limit
      const hasUnlimitedBangs =
        player.character?.name === 'willy_the_kid' ||
        player.equipment.weapon?.name === 'volcanic';

      if (!hasUnlimitedBangs && player.bangCountThisTurn >= 1) {
        return { success: false, message: 'در هر نوبت فقط یک بار می‌توانید کارت بنگ شلیک کنید!' };
      }

      // Remove card from hand
      player.hand.splice(cardIndex, 1);
      state.discardPile.push(card);
      player.bangCountThisTurn += 1;

      addLog(state, `🔫 ${player.name} به سمت ${target.name} شلیک کرد! (بنگ!)`, 'attack');
      triggerEffect(state, 'bang', playerId, targetPlayerId, card.name);

      // Check Barrel on target (Jourdonnais innate ability + equipped barrel)
      let barrelSuccesses = 0;
      const missedNeeded = player.character?.name === 'slab_the_killer' ? 2 : 1;
      const isLucky = target.character?.name === 'lucky_duke';

      if (target.character?.name === 'jourdonnais') {
        const test1 = performDrawTest(state, (c) => c.suit === 'hearts', isLucky);
        if (test1.success) {
          barrelSuccesses += 1;
          triggerEffect(state, 'barrel_success', playerId, target.id, 'barrel');
          addLog(
            state,
            `🛡️ بشکه ژوقدونه! (${target.name}) کارت دل رو شد (${test1.card.rank} ${test1.card.suit}) - ۱ دفاع موفق!`,
            'defense'
          );
        } else {
          addLog(
            state,
            `🛡️ تست بشکه ذاتی ژوقدونه (${target.name}) ناموفق بود (${test1.card.rank} ${test1.card.suit}).`,
            'defense'
          );
        }

        // If Jourdonnais ALSO has an equipped barrel:
        if (target.equipment.barrel && barrelSuccesses < missedNeeded) {
          const test2 = performDrawTest(state, (c) => c.suit === 'hearts', isLucky);
          if (test2.success) {
            barrelSuccesses += 1;
            triggerEffect(state, 'barrel_success', playerId, target.id, 'barrel');
            addLog(
              state,
              `🛡️ تست بشکه مجهز ژوقدونه (${target.name}) نیز موفق شد! (${test2.card.rank} ${test2.card.suit}) - ۱ دفاع دیگر!`,
              'defense'
            );
          } else {
            addLog(
              state,
              `🛡️ تست بشکه مجهز ژوقدونه (${target.name}) ناموفق بود (${test2.card.rank} ${test2.card.suit}).`,
              'defense'
            );
          }
        }
      } else if (target.equipment.barrel) {
        const test = performDrawTest(state, (c) => c.suit === 'hearts', isLucky);
        if (test.success) {
          barrelSuccesses += 1;
          triggerEffect(state, 'barrel_success', playerId, target.id, 'barrel');
          addLog(
            state,
            `🛡️ ${target.name} پشت بشکه سنگر گرفت! (کارت دل رو شد: ${test.card.rank} ${test.card.suit}) - ۱ دفاع موفق!`,
            'defense'
          );
        } else {
          addLog(
            state,
            `🛡️ تست بشکه ${target.name} ناموفق بود (${test.card.rank} ${test.card.suit}).`,
            'defense'
          );
        }
      }

      if (barrelSuccesses >= missedNeeded) {
        addLog(state, `💨 شلیک به ${target.name} با موفقیت دفع شد!`, 'defense');
      } else {
        if (barrelSuccesses > 0) {
          addLog(
            state,
            `⚠️ شلیک اسلبِ قاتل نیازمند ۲ دفاع بود؛ ${target.name} ۱ دفاع از بشکه داشت و هنوز به ۱ کارت زپلشک! دیگر نیاز دارد!`,
            'attack'
          );
        }
        state.pendingReaction = {
          id: `react_${Date.now()}`,
          type: 'bang',
          sourcePlayerId: playerId,
          targetPlayerId,
          requiredCard: 'missed',
          missedNeeded,
          missedPlayed: barrelSuccesses,
        };
      }

      return { success: true };
    }

    if (card.name === 'beer') {
      if (player.currentHp >= player.maxHp) {
        return { success: false, message: 'جان شما پر است و نیازی به نوشیدنی ندارید.' };
      }
      player.hand.splice(cardIndex, 1);
      state.discardPile.push(card);
      player.currentHp += 1;
      addLog(state, `🍺 ${player.name} یک نوشیدنی خنک نوشید و ۱ جان گرفت.`, 'heal');
      triggerEffect(state, 'beer', playerId, undefined, 'beer');
      return { success: true };
    }

    if (card.name === 'saloon') {
      player.hand.splice(cardIndex, 1);
      state.discardPile.push(card);
      state.players.forEach((p) => {
        if (!p.isEliminated && p.currentHp < p.maxHp) {
          p.currentHp += 1;
        }
      });
      addLog(state, `🍻 ${player.name} همه را در سالون به یک دور نوشیدنی مهمان کرد! (+۱ جان به همه)`, 'heal');
      triggerEffect(state, 'saloon', playerId, undefined, 'saloon');
      return { success: true };
    }

    if (card.name === 'stagecoach') {
      player.hand.splice(cardIndex, 1);
      state.discardPile.push(card);
      const drawn = drawCards(state, 2);
      player.hand.push(...drawn);
      checkAndAutoEquipDynamite(state, player);
      triggerEffect(state, 'stagecoach', playerId, undefined, 'stagecoach');
      addLog(state, `🐴 دلیجان به شهر رسید و ۲ کارت جدید به ${player.name} تحویل داد.`, 'system');
      return { success: true };
    }

    if (card.name === 'wells_fargo') {
      player.hand.splice(cardIndex, 1);
      state.discardPile.push(card);
      const drawn = drawCards(state, 3);
      player.hand.push(...drawn);
      checkAndAutoEquipDynamite(state, player);
      triggerEffect(state, 'stagecoach', playerId, undefined, 'wells_fargo');
      addLog(state, `🚂 محموله ولز فارگو رسید! ۳ کارت به دست ${player.name} اضافه شد.`, 'system');
      return { success: true };
    }

    if (card.name === 'general_store') {
      player.hand.splice(cardIndex, 1);
      state.discardPile.push(card);

      // Find living players in clockwise order starting from current player
      const livingPlayers: Player[] = [];
      const pIdx = state.players.findIndex((p) => p.id === playerId);
      for (let i = 0; i < state.players.length; i++) {
        const candidate = state.players[(pIdx + i) % state.players.length];
        if (!candidate.isEliminated) {
          livingPlayers.push(candidate);
        }
      }

      const drawnStoreCards = drawCards(state, livingPlayers.length);
      triggerEffect(state, 'general_store', playerId, undefined, 'general_store');
      addLog(
        state,
        `🏪 ${player.name} کارت فروشگاه را باز کرد! ${drawnStoreCards.length} کارت روی میز قرار گرفت تا بازیکنان به نوبت یکی را انتخاب کنند.`,
        'system'
      );

      state.pendingReaction = {
        id: `react_${Date.now()}`,
        type: 'general_store',
        sourcePlayerId: playerId,
        targetPlayerId: livingPlayers[0].id,
        requiredCard: 'general_store',
        missedNeeded: 0,
        missedPlayed: 0,
        generalStoreCards: drawnStoreCards,
        remainingTargets: livingPlayers.slice(1).map((p) => p.id),
      };

      return { success: true };
    }

    if (card.name === 'gatling') {
      player.hand.splice(cardIndex, 1);
      state.discardPile.push(card);
      addLog(state, `💥 ${player.name} مسلسل گاتلینگ را به کار انداخت و همه را به رگبار بست!`, 'attack');
      triggerEffect(state, 'gatling', playerId, undefined, 'gatling');

      // Find other living players in clockwise order, strictly EXCLUDING the shooter himself!
      const otherLiving: string[] = [];
      const pIdx = state.players.findIndex((p) => p.id === playerId);
      for (let i = 1; i < state.players.length; i++) {
        const candidate = state.players[(pIdx + i) % state.players.length];
        if (!candidate.isEliminated && candidate.id !== playerId) {
          otherLiving.push(candidate.id);
        }
      }

      if (otherLiving.length > 0) {
        state.pendingReaction = {
          id: `react_${Date.now()}`,
          type: 'gatling',
          sourcePlayerId: playerId,
          targetPlayerId: otherLiving[0],
          requiredCard: 'missed',
          missedNeeded: 1,
          missedPlayed: 0,
          remainingTargets: otherLiving.slice(1),
        };
      }
      return { success: true };
    }

    if (card.name === 'indians') {
      player.hand.splice(cardIndex, 1);
      state.discardPile.push(card);
      addLog(state, `🏹 حمله سرخ‌پوست‌ها به شهر! همه حریفان باید با شلیک متقابل (بنگ!) دفاع کنند!`, 'attack');
      triggerEffect(state, 'indians', playerId, undefined, 'indians');

      // Find other living players in clockwise order, strictly EXCLUDING the player who played it!
      const otherLiving: string[] = [];
      const pIdx = state.players.findIndex((p) => p.id === playerId);
      for (let i = 1; i < state.players.length; i++) {
        const candidate = state.players[(pIdx + i) % state.players.length];
        if (!candidate.isEliminated && candidate.id !== playerId) {
          otherLiving.push(candidate.id);
        }
      }

      if (otherLiving.length > 0) {
        state.pendingReaction = {
          id: `react_${Date.now()}`,
          type: 'indians',
          sourcePlayerId: playerId,
          targetPlayerId: otherLiving[0],
          requiredCard: 'bang',
          missedNeeded: 1,
          missedPlayed: 0,
          remainingTargets: otherLiving.slice(1),
        };
      }
      return { success: true };
    }

    if (card.name === 'duel') {
      if (!targetPlayerId) return { success: false, message: 'یک حریف برای دوئل انتخاب کنید.' };
      const target = state.players.find((p) => p.id === targetPlayerId);
      if (!target || target.isEliminated || target.id === playerId) {
        return { success: false, message: 'حریف نامعتبر است.' };
      }

      player.hand.splice(cardIndex, 1);
      state.discardPile.push(card);
      addLog(state, `⚔️ ${player.name}، ${target.name} را به دوئل مرگبار فراخواند!`, 'attack');
      triggerEffect(state, 'duel', playerId, targetPlayerId, 'duel');

      state.pendingReaction = {
        id: `react_${Date.now()}`,
        type: 'duel',
        sourcePlayerId: playerId,
        targetPlayerId,
        duelTurnPlayerId: targetPlayerId,
        requiredCard: 'bang',
        missedNeeded: 1,
        missedPlayed: 0,
      };
      return { success: true };
    }

    if (card.name === 'cat_balou') {
      if (!targetPlayerId) return { success: false, message: 'هدفی برای سوزاندن کارت انتخاب کنید.' };
      const target = state.players.find((p) => p.id === targetPlayerId);
      if (!target || target.isEliminated || target.id === playerId) {
        return { success: false, message: 'هدف نامعتبر است.' };
      }

      // Check if target has any cards
      const availableEqKeys = (Object.keys(target.equipment) as (keyof typeof target.equipment)[]).filter(
        (k) => !!target.equipment[k]
      );
      if (target.hand.length === 0 && availableEqKeys.length === 0) {
        return { success: false, message: 'این بازیکن هیچ کارتی برای سوزاندن ندارد!' };
      }

      player.hand.splice(cardIndex, 1);
      state.discardPile.push(card);
      triggerEffect(state, 'cat_balou', playerId, targetPlayerId, 'cat_balou');

      if (targetCardChoice?.type === 'equipment' && targetCardChoice.equipmentKey) {
        const discarded = target.equipment[targetCardChoice.equipmentKey];
        if (discarded) {
          target.equipment[targetCardChoice.equipmentKey] = undefined;
          state.discardPile.push(discarded);
          addLog(state, `🔥 کت بالو! کارت «${discarded.titleFa}» از تجهیزات روبروی ${target.name} سوزانده و منهدم شد!`, 'attack');
        } else if (target.hand.length > 0) {
          const randIdx = Math.floor(Math.random() * target.hand.length);
          const disc = target.hand.splice(randIdx, 1)[0];
          state.discardPile.push(disc);
          addLog(state, `🔥 کت بالو! ۱ کارت تصادفی از دست ${target.name} سوزانده شد.`, 'attack');
          checkSuzyLafayette(state, target);
        }
      } else {
        // Target hand card
        if (target.hand.length > 0) {
          const chosenIdx =
            typeof targetCardChoice?.handIndex === 'number' &&
            targetCardChoice.handIndex >= 0 &&
            targetCardChoice.handIndex < target.hand.length
              ? targetCardChoice.handIndex
              : Math.floor(Math.random() * target.hand.length);

          const discarded = target.hand.splice(chosenIdx, 1)[0];
          state.discardPile.push(discarded);
          addLog(state, `🔥 کت بالو! ۱ کارت از دست ${target.name} انتخاب و سوزانده شد!`, 'attack');
          checkSuzyLafayette(state, target);
        } else if (availableEqKeys.length > 0) {
          const key = availableEqKeys[0];
          const discarded = target.equipment[key]!;
          target.equipment[key] = undefined;
          state.discardPile.push(discarded);
          addLog(state, `🔥 کت بالو! کارت «${discarded.titleFa}» از تجهیزات ${target.name} منهدم شد.`, 'attack');
        }
      }
      return { success: true };
    }

    if (card.name === 'panic') {
      if (!targetPlayerId) return { success: false, message: 'هدفی برای سرقت و تهدید انتخاب کنید.' };
      const target = state.players.find((p) => p.id === targetPlayerId);
      if (!target || target.isEliminated || target.id === playerId) {
        return { success: false, message: 'هدف نامعتبر است.' };
      }

      const dist = calculateEffectiveDistance(state, playerId, targetPlayerId);
      if (dist > 1) {
        return { success: false, message: 'برای کارت تهدید!، فاصله هدف باید ۱ فرسخ باشد!' };
      }

      // Panic can ONLY steal from hand (never from table/equipment)!
      if (target.hand.length === 0) {
        return { success: false, message: 'این بازیکن هیچ کارتی در دست ندارد (کارت تهدید فقط از دست حریف قابل سرقت است).' };
      }

      player.hand.splice(cardIndex, 1);
      state.discardPile.push(card);

      const chosenIdx =
        typeof targetCardChoice?.handIndex === 'number' &&
        targetCardChoice.handIndex >= 0 &&
        targetCardChoice.handIndex < target.hand.length
          ? targetCardChoice.handIndex
          : Math.floor(Math.random() * target.hand.length);

      const stolen = target.hand.splice(chosenIdx, 1)[0];
      player.hand.push(stolen);
      addLog(state, `💰 تهدید! ${player.name} ۱ کارت از دست ${target.name} ربود و به دست خود اضافه کرد!`, 'attack');
      triggerEffect(state, 'panic', playerId, targetPlayerId, 'panic');
      checkSuzyLafayette(state, target);
      checkAndAutoEquipDynamite(state, player);

      return { success: true };
    }
  }

  // BLUE CARDS (Equipment)
  if (card.border === 'blue') {
    player.hand.splice(cardIndex, 1);

    if (
      card.name === 'volcanic' ||
      card.name === 'schofield' ||
      card.name === 'remington' ||
      card.name === 'rev_carabine' ||
      card.name === 'winchester'
    ) {
      if (player.equipment.weapon) {
        state.discardPile.push(player.equipment.weapon);
      }
      player.equipment.weapon = card;
      addLog(state, `🔫 ${player.name} اسلحه ${card.titleFa} (برد ${card.range}) را مجهز کرد.`, 'equip');
      return { success: true };
    }

    if (card.name === 'mustang') {
      if (player.equipment.mustang) state.discardPile.push(player.equipment.mustang);
      player.equipment.mustang = card;
      addLog(state, `🐎 ${player.name} بر اسب موستانگ سوار شد (+۱ فاصله از بقیه).`, 'equip');
      return { success: true };
    }

    if (card.name === 'appaloosa') {
      if (player.equipment.appaloosa) state.discardPile.push(player.equipment.appaloosa);
      player.equipment.appaloosa = card;
      addLog(state, `🔍 ${player.name} اسب تیزپای آپالوزا را به خدمت گرفت (-۱ فاصله به بقیه).`, 'equip');
      return { success: true };
    }

    if (card.name === 'barrel') {
      if (player.equipment.barrel) state.discardPile.push(player.equipment.barrel);
      player.equipment.barrel = card;
      addLog(state, `🛡️ ${player.name} بشکه محافظ را روبروی خود قرار داد.`, 'equip');
      return { success: true };
    }

    if (card.name === 'dynamite') {
      player.equipment.dynamite = card;
      addLog(state, `🧨 ${player.name} دینامیت فعال را جلوی خود گذاشت!`, 'equip');
      return { success: true };
    }

    if (card.name === 'jail') {
      if (!targetPlayerId) {
        player.hand.push(card); // rollback
        return { success: false, message: 'باید یک بازیکن را برای فرستادن به زندان انتخاب کنید.' };
      }
      const target = state.players.find((p) => p.id === targetPlayerId);
      if (!target || target.isEliminated || target.id === playerId) {
        player.hand.push(card);
        return { success: false, message: 'نمی‌توانید خودتان را به زندان بیندازید.' };
      }
      if (target.equipment.jail) {
        player.hand.push(card);
        return { success: false, message: 'این بازیکن در حال حاضر در زندان است!' };
      }
      target.equipment.jail = card;
      triggerEffect(state, 'jail', playerId, targetPlayerId, 'jail');
      addLog(state, `🔒 دستبند قانون! ${player.name}، ${target.name} را پشت میله‌های زندان انداخت!`, 'equip');
      return { success: true };
    }
  }

  return { success: false, message: 'این کارت در شرایط فعلی قابل بازی نیست.' };
}

export function respondToReaction(
  state: GameState,
  playerId: string,
  action: 'play' | 'pass',
  cardId?: string
): { success: boolean; message?: string } {
  const pending = state.pendingReaction;
  if (!pending) return { success: false, message: 'هیچ واکنشی فعال نیست.' };

  const isCurrentTarget =
    pending.type === 'duel'
      ? pending.duelTurnPlayerId === playerId
      : pending.targetPlayerId === playerId;

  if (!isCurrentTarget) {
    return { success: false, message: 'نوبت شما برای واکنش نیست.' };
  }

  const player = state.players.find((p) => p.id === playerId);
  if (!player) return { success: false, message: 'بازیکن یافت نشد.' };

  if (action === 'play') {
    if (pending.type === 'general_store') {
      const storeCards = pending.generalStoreCards || [];
      const chosenIdx = cardId ? storeCards.findIndex((c) => c.id === cardId) : 0;
      if (chosenIdx === -1 || storeCards.length === 0) {
        return { success: false, message: 'کارت مورد نظر در فروشگاه یافت نشد.' };
      }
      const chosen = storeCards.splice(chosenIdx, 1)[0];
      player.hand.push(chosen);
      addLog(state, `🏪 ${player.name} کارت «${chosen.titleFa}» را از فروشگاه انتخاب کرد.`, 'system');
      checkSuzyLafayette(state, player);
      checkAndAutoEquipDynamite(state, player);

      if (pending.remainingTargets && pending.remainingTargets.length > 0) {
        const nextId = pending.remainingTargets.shift()!;
        pending.targetPlayerId = nextId;
      } else {
        if (storeCards.length > 0) {
          state.discardPile.push(...storeCards);
        }
        state.pendingReaction = null;
      }
      return { success: true };
    }

    if (!cardId) return { success: false, message: 'کارت واکنش انتخاب نشده است.' };
    const cardIndex = player.hand.findIndex((c) => c.id === cardId);
    if (cardIndex === -1) return { success: false, message: 'کارت در دست شما نیست.' };
    const card = player.hand[cardIndex];

    // Check validity
    let isMatch = card.name === pending.requiredCard;
    // Calamity Janet ability
    if (player.character?.name === 'calamity_janet') {
      if (pending.requiredCard === 'missed' && card.name === 'bang') isMatch = true;
      if (pending.requiredCard === 'bang' && card.name === 'missed') isMatch = true;
    }

    if (!isMatch) {
      return { success: false, message: `باید کارت ${pending.requiredCard === 'missed' ? 'زپلشک!' : 'بنگ'} بازی کنید!` };
    }

    // Discard the card
    player.hand.splice(cardIndex, 1);
    state.discardPile.push(card);
    checkSuzyLafayette(state, player);

    if (pending.type === 'bang') {
      pending.missedPlayed += 1;
      addLog(state, `💨 ${player.name} کارت زپلشک! انداخت!`, 'defense');
      triggerEffect(state, 'missed', pending.sourcePlayerId, player.id, 'missed');

      if (pending.missedPlayed >= pending.missedNeeded) {
        // Attack completely avoided
        state.pendingReaction = null;
      }
      return { success: true };
    }

    if (pending.type === 'gatling') {
      addLog(state, `💨 ${player.name} با کارت زپلشک! از گلوله‌های مسلسل جاخالی داد!`, 'defense');
      triggerEffect(state, 'missed', player.id, undefined, 'missed');
      advanceReactionQueue(state);
      return { success: true };
    }

    if (pending.type === 'indians') {
      addLog(state, `🏹 ${player.name} با شلیک متقابل سرخ‌پوست‌ها را عقب راند!`, 'defense');
      triggerEffect(state, 'bang', player.id, undefined, 'bang');
      advanceReactionQueue(state);
      return { success: true };
    }

    if (pending.type === 'duel') {
      // Swap turn in duel
      const nextDuelPlayer =
        pending.duelTurnPlayerId === pending.sourcePlayerId
          ? pending.targetPlayerId
          : pending.sourcePlayerId;

      pending.duelTurnPlayerId = nextDuelPlayer;
      const nextP = state.players.find((p) => p.id === nextDuelPlayer);
      addLog(state, `⚔️ ${player.name} شلیک کرد! نوبت ${nextP?.name} است که در دوئل پاسخ دهد!`, 'attack');
      triggerEffect(state, 'bang', player.id, nextDuelPlayer, 'bang');
      return { success: true };
    }
  }

  // Action is 'pass'
  if (action === 'pass') {
    if (pending.type === 'general_store') {
      const storeCards = pending.generalStoreCards || [];
      if (storeCards.length > 0) {
        const chosen = storeCards.shift()!;
        player.hand.push(chosen);
        addLog(state, `🏪 ${player.name} کارت «${chosen.titleFa}» را از فروشگاه دریافت کرد.`, 'system');
        checkSuzyLafayette(state, player);
        checkAndAutoEquipDynamite(state, player);
      }

      if (pending.remainingTargets && pending.remainingTargets.length > 0) {
        const nextId = pending.remainingTargets.shift()!;
        pending.targetPlayerId = nextId;
      } else {
        if (storeCards.length > 0) {
          state.discardPile.push(...storeCards);
        }
        state.pendingReaction = null;
      }
      return { success: true };
    }

    if (pending.type === 'duel') {
      const loserId = pending.duelTurnPlayerId!;
      const winnerId =
        loserId === pending.sourcePlayerId ? pending.targetPlayerId : pending.sourcePlayerId;
      const loser = state.players.find((p) => p.id === loserId);
      addLog(state, `⚔️ ${loser?.name} در دوئل کم آورد و تیر خورد!`, 'attack');
      damagePlayer(state, loserId, 1, winnerId);
      state.pendingReaction = null;
      return { success: true };
    }

    // Bang, Gatling, Indians: target takes 1 damage
    damagePlayer(state, pending.targetPlayerId, 1, pending.sourcePlayerId);

    if (pending.type === 'gatling' || pending.type === 'indians') {
      advanceReactionQueue(state);
    } else {
      state.pendingReaction = null;
    }
    return { success: true };
  }

  return { success: false, message: 'دستور نامعتبر است.' };
}

function advanceReactionQueue(state: GameState) {
  const pending = state.pendingReaction;
  if (!pending || !pending.remainingTargets || pending.remainingTargets.length === 0) {
    state.pendingReaction = null;
    return;
  }

  while (pending.remainingTargets.length > 0) {
    const nextTargetId = pending.remainingTargets.shift()!;
    if (nextTargetId === pending.sourcePlayerId) {
      continue;
    }
    const nextPlayer = state.players.find((p) => p.id === nextTargetId);
    if (nextPlayer && !nextPlayer.isEliminated) {
      pending.targetPlayerId = nextTargetId;
      pending.missedPlayed = 0;
      return;
    }
  }

  state.pendingReaction = null;
}

export function discardExcessCard(
  state: GameState,
  playerId: string,
  cardId: string
): { success: boolean; message?: string } {
  if (state.currentTurnPlayerId !== playerId || (state.turnPhase !== 'discard' && state.turnPhase !== 'action')) {
    return { success: false, message: 'اکنون زمان دور ریختن یا سوزاندن کارت نیست.' };
  }

  const player = state.players.find((p) => p.id === playerId);
  if (!player) return { success: false, message: 'بازیکن یافت نشد.' };

  const idx = player.hand.findIndex((c) => c.id === cardId);
  if (idx === -1) return { success: false, message: 'کارت در دست نیست.' };

  const discarded = player.hand.splice(idx, 1)[0];
  state.discardPile.push(discarded);
  if (state.turnPhase === 'action') {
    addLog(state, `🔥 ${player.name} کارت ${discarded.titleFa} را در نوبت خود سوزاند.`, 'system');
  } else {
    addLog(state, `🗑️ ${player.name} کارت ${discarded.titleFa} را دور انداخت.`, 'system');
  }
  checkSuzyLafayette(state, player);

  if (state.turnPhase === 'discard') {
    if (player.hand.length <= player.currentHp) {
      // Reached allowed limit! Automatically advance to next player
      advanceToNextPlayer(state);
    }
  }

  return { success: true };
}

export function endTurn(
  state: GameState,
  playerId: string
): { success: boolean; message?: string } {
  if (state.currentTurnPlayerId !== playerId) {
    return { success: false, message: 'نوبت شما نیست.' };
  }

  if (state.pendingReaction) {
    return { success: false, message: 'ابتدا پاسخ به رویداد در جریان را کامل کنید.' };
  }

  const player = state.players.find((p) => p.id === playerId);
  if (!player) return { success: false, message: 'بازیکن یافت نشد.' };

  // Check if player has excess cards
  if (player.hand.length > player.currentHp) {
    state.turnPhase = 'discard';
    const excess = player.hand.length - player.currentHp;
    return {
      success: true,
      message: `تعداد کارت‌های دست شما (${player.hand.length}) بیشتر از جان شما (${player.currentHp}) است. لطفاً ${excess} کارت دور بیندازید.`,
    };
  }

  advanceToNextPlayer(state);
  return { success: true };
}

export function advanceToNextPlayer(state: GameState) {
  if (state.status !== 'playing') return;

  const currentId = state.currentTurnPlayerId;
  const nextPlayer = getNextLivingPlayer(state, currentId || '');
  if (!nextPlayer) return;

  startTurn(state, nextPlayer.id);
}

export function getNextLivingPlayer(state: GameState, currentId: string): Player | null {
  const living = state.players.filter((p) => !p.isEliminated);
  if (living.length === 0) return null;

  const currentIndex = living.findIndex((p) => p.id === currentId);
  if (currentIndex === -1) return living[0];

  return living[(currentIndex + 1) % living.length];
}

export function checkSuzyLafayette(state: GameState, player: Player) {
  if (
    player.character?.name === 'suzy_lafayette' &&
    !player.isEliminated &&
    player.hand.length === 0
  ) {
    const drawn = drawCards(state, 1);
    if (drawn.length > 0) {
      player.hand.push(...drawn);
      addLog(
        state,
        `⚡ دست سوزی لافایت خالی شد و طبق توانایی ویژه‌اش فوراً ۱ کارت جدید از مخزن کشید!`,
        'system'
      );
    }
  }
}

export function resolveSpecialDraw(
  state: GameState,
  playerId: string,
  choice: {
    type: 'deck' | 'discard' | 'player' | 'kit';
    targetPlayerId?: string;
    kitSelectedIndices?: number[];
  }
): { success: boolean; message?: string } {
  if (state.turnPhase !== 'draw') {
    return { success: false, message: 'اکنون زمان کشیدن کارت نیست.' };
  }

  if (state.currentTurnPlayerId !== playerId) {
    return { success: false, message: 'نوبت شما نیست.' };
  }

  const player = state.players.find((p) => p.id === playerId);
  if (!player || player.isEliminated) {
    return { success: false, message: 'بازیکن یافت نشد یا حذف شده است.' };
  }

  const prompt = state.specialDrawPrompt;
  if (!prompt || prompt.playerId !== playerId) {
    return { success: false, message: 'هیچ انتخابی برای کارت‌کشی فعال نیست.' };
  }

  // 1. Pedro Ramirez
  if (prompt.characterName === 'pedro_ramirez') {
    if (choice.type === 'discard') {
      if (state.discardPile.length === 0) {
        return { success: false, message: 'دسته کارت‌های سوخته خالی است!' };
      }
      // Draw 1st card from discard pile
      const discardCard = state.discardPile.pop()!;
      player.hand.push(discardCard);

      // Draw 2nd card from deck
      const secondCard = drawCards(state, 1);
      player.hand.push(...secondCard);

      addLog(
        state,
        `🤠 پدرو رامیرز کارت اول را از بالای کارت‌های سوخته برداشت (${discardCard.titleFa}) و کارت دوم را از مخزن کشید!`,
        'system'
      );
    } else {
      // Draw 2 from deck
      const cards = drawCards(state, 2);
      player.hand.push(...cards);
      addLog(state, `🤠 پدرو رامیرز هر دو کارت خود را از مخزن کارت‌ها کشید.`, 'system');
    }

    checkAndAutoEquipDynamite(state, player);
    state.specialDrawPrompt = null;
    state.turnPhase = 'action';
    return { success: true };
  }

  // 2. Jesse Jones
  if (prompt.characterName === 'jesse_jones') {
    if (choice.type === 'player') {
      if (!choice.targetPlayerId) {
        return { success: false, message: 'لطفاً یک بازیکن برای کشیدن کارت انتخاب کنید.' };
      }
      const target = state.players.find((p) => p.id === choice.targetPlayerId);
      if (!target || target.isEliminated || target.hand.length === 0 || target.id === playerId) {
        return { success: false, message: 'بازیکن انتخابی نامعتبر است یا کارتی در دست ندارد.' };
      }

      // Draw 1st card randomly from target's hand
      const randIdx = Math.floor(Math.random() * target.hand.length);
      const stolen = target.hand.splice(randIdx, 1)[0];
      player.hand.push(stolen);

      // Draw 2nd card from deck
      const secondCard = drawCards(state, 1);
      player.hand.push(...secondCard);

      addLog(
        state,
        `🤠 جسی جونز کارت اول خود را به صورت پنهانی از دست ${target.name} ربود و کارت دوم را از مخزن کشید!`,
        'system'
      );

      // Check Suzy Lafayette on target
      checkSuzyLafayette(state, target);
    } else {
      // Draw 2 from deck
      const cards = drawCards(state, 2);
      player.hand.push(...cards);
      addLog(state, `🤠 جسی جونز هر دو کارت خود را از مخزن کارت‌ها کشید.`, 'system');
    }

    checkAndAutoEquipDynamite(state, player);
    state.specialDrawPrompt = null;
    state.turnPhase = 'action';
    return { success: true };
  }

  // 3. Kit Carlson
  if (prompt.characterName === 'kit_carlson') {
    const kitCards = prompt.kitCards || [];
    if (kitCards.length < 3) {
      return { success: false, message: 'کارت‌های کیت کارلسون موجود نیست.' };
    }

    const indices = choice.kitSelectedIndices;
    if (
      !indices ||
      indices.length !== 2 ||
      indices[0] === indices[1] ||
      !indices.every((i) => i >= 0 && i < kitCards.length)
    ) {
      return { success: false, message: 'باید دقیقاً ۲ کارت از ۳ کارت را انتخاب کنید.' };
    }

    // Pick chosen 2 cards
    const chosenCards = [kitCards[indices[0]], kitCards[indices[1]]];
    const unchosenIndex = [0, 1, 2].find((i) => !indices.includes(i))!;
    const returnedCard = kitCards[unchosenIndex];

    // Add 2 chosen to hand
    player.hand.push(...chosenCards);

    // Put remaining card back on top of deck (push to deck array)
    state.deck.push(returnedCard);

    addLog(
      state,
      `🤠 کیت کارلسون پس از بررسی ۳ کارت بالای مخزن، ۲ کارت را در دست گرفت و ۱ کارت را به بالای مخزن بازگرداند.`,
      'system'
    );

    checkAndAutoEquipDynamite(state, player);
    state.specialDrawPrompt = null;
    state.turnPhase = 'action';
    return { success: true };
  }

  return { success: false, message: 'دستور نامعتبر است.' };
}

export function useSidKetchumHeal(
  state: GameState,
  playerId: string,
  cardIds: string[]
): { success: boolean; message?: string } {
  if (state.turnPhase !== 'action' || state.currentTurnPlayerId !== playerId) {
    return { success: false, message: 'فقط در فاز عملیات نوبت خود می‌توانید از این قابلیت استفاده کنید.' };
  }

  const player = state.players.find((p) => p.id === playerId);
  if (!player || player.isEliminated) {
    return { success: false, message: 'بازیکن یافت نشد.' };
  }

  if (player.character?.name !== 'sid_ketchum') {
    return { success: false, message: 'فقط سید کچام دارای این قابلیت است.' };
  }

  if (player.currentHp >= player.maxHp) {
    return { success: false, message: 'جان شما پر است.' };
  }

  if (!cardIds || cardIds.length !== 2 || cardIds[0] === cardIds[1]) {
    return { success: false, message: 'باید دقیقاً ۲ کارت متمایز را برای سوزاندن انتخاب کنید.' };
  }

  const idx1 = player.hand.findIndex((c) => c.id === cardIds[0]);
  const idx2 = player.hand.findIndex((c) => c.id === cardIds[1]);

  if (idx1 === -1 || idx2 === -1) {
    return { success: false, message: 'کارت‌های انتخاب شده در دست شما نیستند.' };
  }

  // Remove both cards (remove higher index first so lower index doesn't shift)
  const [higherIdx, lowerIdx] = idx1 > idx2 ? [idx1, idx2] : [idx2, idx1];
  const cardA = player.hand.splice(higherIdx, 1)[0];
  const cardB = player.hand.splice(lowerIdx, 1)[0];

  state.discardPile.push(cardA, cardB);
  player.currentHp = Math.min(player.maxHp, player.currentHp + 1);

  addLog(
    state,
    `🩸 سید کچام با سوزاندن ۲ کارت (${cardA.titleFa}، ${cardB.titleFa}) ۱ جان بازیابی کرد! (جان فعلی: ${player.currentHp})`,
    'heal'
  );

  checkSuzyLafayette(state, player);

  return { success: true };
}

/**
 * Sanitizes game state for a specific player (Client Security / Anti-Cheat):
 * - Hides other players' hands (only passes handCount).
 * - Hides other players' roles unless:
 *   a) The role is Sheriff (always public)
 *   b) The player is eliminated (dead players' roles are revealed)
 *   c) Game is over (all roles revealed)
 */
export function sanitizeGameStateForPlayer(
  state: GameState,
  viewerPlayerId: string
): PublicGameState {
  const isGameOver = state.status === 'game_over';

  const publicPlayers: PublicPlayer[] = state.players.map((p) => {
    const isViewer = p.id === viewerPlayerId;
    const isSheriff = p.role === 'sheriff';
    const isDead = p.isEliminated;

    const visibleRole: Role | 'hidden' =
      isViewer || isSheriff || isDead || isGameOver ? p.role : 'hidden';

    return {
      id: p.id,
      name: p.name,
      isHost: p.isHost,
      isBot: p.isBot,
      isReady: p.isReady,
      role: visibleRole,
      character: p.character,
      maxHp: p.maxHp,
      currentHp: p.currentHp,
      handCount: p.hand.length,
      equipment: p.equipment,
      isEliminated: p.isEliminated,
    };
  });

  const myPlayer = state.players.find((p) => p.id === viewerPlayerId) || null;
  const topDiscard = state.discardPile.length > 0 ? state.discardPile[state.discardPile.length - 1] : null;

  return {
    roomId: state.roomId,
    status: state.status,
    players: publicPlayers,
    myPlayer,
    currentTurnPlayerId: state.currentTurnPlayerId,
    turnPhase: state.turnPhase,
    deckCount: state.deck.length,
    topDiscard,
    pendingReaction: state.pendingReaction,
    specialDrawPrompt: state.specialDrawPrompt
      ? {
          ...state.specialDrawPrompt,
          kitCards:
            viewerPlayerId === state.specialDrawPrompt.playerId
              ? state.specialDrawPrompt.kitCards
              : undefined,
        }
      : null,
    winner: state.winner,
    revealCountdown: state.revealCountdown ?? null,
    logs: state.logs,
    lastEffect: state.lastEffect ?? null,
  };
}
