import { GameState, Player, Card, PendingReaction, Role } from './types';
import { drawCards, performDrawTest } from './deck';
import { canShootTarget, calculateEffectiveDistance } from './distance';

export function addLog(
  state: GameState,
  text: string,
  type: 'system' | 'attack' | 'heal' | 'defense' | 'equip' | 'death' | 'win' | 'turn' = 'system',
  playerId?: string,
  targetPlayerId?: string
) {
  state.logs.push({
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    text,
    type,
    timestamp: Date.now(),
    playerId,
    targetPlayerId,
  });
  // Keep last 120 logs so players can easily filter through game history
  if (state.logs.length > 120) {
    state.logs.shift();
  }
}

/**
 * Checks win conditions:
 * 1. Sheriff wins if all Outlaws and Renegade are dead.
 * 2. Outlaws win if Sheriff is dead AND (there are outlaws alive OR more than 1 player alive when renegade is alive).
 * 3. Renegade wins if Sheriff is dead AND Renegade is the ONLY survivor.
 */
export function checkWinConditions(state: GameState): Role | null {
  const livingPlayers = state.players.filter((p) => !p.isEliminated);
  const sheriff = state.players.find((p) => p.role === 'sheriff');

  if (!sheriff || sheriff.isEliminated) {
    // Sheriff is dead!
    if (livingPlayers.length === 1 && livingPlayers[0].role === 'renegade') {
      return 'renegade';
    }
    return 'outlaw';
  }

  // Sheriff is alive
  const livingOutlawsOrRenegade = livingPlayers.filter(
    (p) => p.role === 'outlaw' || p.role === 'renegade'
  );

  if (livingOutlawsOrRenegade.length === 0) {
    return 'sheriff';
  }

  return null;
}

export function handleElimination(
  state: GameState,
  victimId: string,
  killerId?: string
) {
  const victim = state.players.find((p) => p.id === victimId);
  if (!victim || victim.isEliminated) return;

  victim.isEliminated = true;
  victim.currentHp = 0;

  addLog(state, `💀 ${victim.name} کشته شد! (نقش او فاش شد: ${getRoleFa(victim.role)})`, 'death');

  // Check Vulture Sam character
  const vultureSam = state.players.find(
    (p) => !p.isEliminated && p.character?.name === 'vulture_sam' && p.id !== victimId
  );

  const victimCards = [
    ...victim.hand,
    ...(victim.equipment.weapon ? [victim.equipment.weapon] : []),
    ...(victim.equipment.mustang ? [victim.equipment.mustang] : []),
    ...(victim.equipment.appaloosa ? [victim.equipment.appaloosa] : []),
    ...(victim.equipment.barrel ? [victim.equipment.barrel] : []),
    ...(victim.equipment.jail ? [victim.equipment.jail] : []),
    ...(victim.equipment.dynamite ? [victim.equipment.dynamite] : []),
  ];

  if (vultureSam) {
    vultureSam.hand.push(...victimCards);
    addLog(state, `🦅 ${vultureSam.name} (کرکس سم) تمام کارت‌های ${victim.name} را تصاحب کرد!`, 'system');
  } else {
    // Discard all cards
    state.discardPile.push(...victimCards);
  }

  victim.hand = [];
  victim.equipment = {};

  // Rewards and Penalties
  if (killerId && killerId !== victimId) {
    const killer = state.players.find((p) => p.id === killerId);
    if (killer) {
      if (victim.role === 'outlaw') {
        // Outlaw killed: killer gets 3 cards
        const bountyCards = drawCards(state, 3);
        killer.hand.push(...bountyCards);
        addLog(state, `💰 ${killer.name} به خاطر کشتن یاغی ۳ کارت پاداش دریافت کرد!`, 'system');
      } else if (victim.role === 'deputy' && killer.role === 'sheriff') {
        // Sheriff killed Deputy: Sheriff loses all cards
        addLog(state, `⚠️ کلانتر به اشتباه معاون خود را کشت! تمام کارت‌هایش مصادره و سوزانده شد.`, 'death');
        const sheriffCards = [
          ...killer.hand,
          ...(killer.equipment.weapon ? [killer.equipment.weapon] : []),
          ...(killer.equipment.mustang ? [killer.equipment.mustang] : []),
          ...(killer.equipment.appaloosa ? [killer.equipment.appaloosa] : []),
          ...(killer.equipment.barrel ? [killer.equipment.barrel] : []),
          ...(killer.equipment.jail ? [killer.equipment.jail] : []),
          ...(killer.equipment.dynamite ? [killer.equipment.dynamite] : []),
        ];
        state.discardPile.push(...sheriffCards);
        killer.hand = [];
        killer.equipment = {};
      }
    }
  }

  // Check game over
  const winner = checkWinConditions(state);
  if (winner) {
    state.status = 'game_over';
    state.winner = winner;
    addLog(state, `🏆 بازی تمام شد! برنده نهایی: ${getRoleFa(winner)}`, 'win');
  }
}

export function damagePlayer(
  state: GameState,
  targetId: string,
  amount: number,
  attackerId?: string
) {
  const target = state.players.find((p) => p.id === targetId);
  if (!target || target.isEliminated) return;

  target.currentHp -= amount;
  addLog(state, `💥 ${target.name} ${amount} جان از دست داد! (جان باقیمانده: ${target.currentHp})`, 'attack');

  // Bart Cassidy ability: draw card on damage
  if (target.character?.name === 'bart_cassidy' && target.currentHp > 0) {
    const drawn = drawCards(state, amount);
    target.hand.push(...drawn);
    addLog(state, `🃏 ${target.name} (بارت کسیدی) با زخمی شدن ${amount} کارت کشید!`, 'system');
  }

  // El Gringo ability: take card from attacker
  if (target.character?.name === 'el_gringo' && attackerId && attackerId !== targetId && target.currentHp > 0) {
    const attacker = state.players.find((p) => p.id === attackerId);
    if (attacker && attacker.hand.length > 0) {
      const randomIndex = Math.floor(Math.random() * attacker.hand.length);
      const stolen = attacker.hand.splice(randomIndex, 1)[0];
      target.hand.push(stolen);
      addLog(state, `🌵 ${target.name} (ال گرینگو) ۱ کارت از دست ${attacker.name} کشید!`, 'system');
    }
  }

  // Check death
  if (target.currentHp <= 0) {
    // Check if player has beer to save life immediately
    const beerIndex = target.hand.findIndex((c) => c.name === 'beer');
    const livingCount = state.players.filter((p) => !p.isEliminated).length;
    if (beerIndex !== -1 && livingCount > 2) {
      const beer = target.hand.splice(beerIndex, 1)[0];
      state.discardPile.push(beer);
      target.currentHp += 1;
      addLog(state, `🍺 ${target.name} در آستانه مرگ یک نوشیدنی نوشید و ۱ جان بازیافت!`, 'heal');
    } else {
      handleElimination(state, targetId, attackerId);
    }
  }
}

export function getRoleFa(role: Role): string {
  switch (role) {
    case 'sheriff':
      return 'کلانتر و قانون';
    case 'deputy':
      return 'معاون کلانتر';
    case 'outlaw':
      return 'یاغی‌ها';
    case 'renegade':
      return 'خائن (رنگید)';
  }
}
