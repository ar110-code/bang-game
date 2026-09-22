import { GameState, Player, Card, TargetCardChoice } from './types';
import { canShootTarget, calculateEffectiveDistance } from './distance';
import {
  playCard,
  respondToReaction,
  discardExcessCard,
  endTurn,
  resolveSpecialDraw,
  useSidKetchumHeal,
} from './engine';

/**
 * Calculates tactical value of a card for keeping in hand, general store choice,
 * or discard pile retrieval (Higher score = keep / prioritize).
 */
export function getCardTacticalValue(card: Card, bot: Player, state: GameState): number {
  const currentHp = bot.currentHp;
  const maxHp = bot.maxHp;
  const currentWeaponRange = bot.equipment.weapon?.range || 1;
  const bangsInHand = bot.hand.filter((c) => c.name === 'bang').length;

  switch (card.name) {
    case 'beer':
      if (currentHp <= 1) return 100;
      if (currentHp <= 2) return 92;
      if (currentHp < maxHp) return 80;
      return 45;

    case 'saloon':
      if (bot.role === 'deputy' || bot.role === 'sheriff') {
        const sheriff = state.players.find((p) => p.role === 'sheriff' && !p.isEliminated);
        if (sheriff && sheriff.currentHp < sheriff.maxHp) return 95;
      }
      if (currentHp < maxHp) return 78;
      return 40;

    case 'missed':
      if (currentHp <= 1) return 96;
      if (currentHp <= 2) return 90;
      return 82;

    case 'barrel':
      return bot.equipment.barrel ? 20 : 88;

    case 'mustang':
      return bot.equipment.mustang ? 20 : 85;

    case 'appaloosa':
      return bot.equipment.appaloosa ? 20 : 80;

    case 'volcanic':
      return bangsInHand >= 2 ? 95 : 75;

    case 'winchester':
      return currentWeaponRange < 5 ? 88 : 25;
    case 'rev_carabine':
      return currentWeaponRange < 4 ? 82 : 25;
    case 'remington':
      return currentWeaponRange < 3 ? 76 : 25;
    case 'schofield':
      return currentWeaponRange < 2 ? 70 : 25;

    case 'wells_fargo':
      return 92;
    case 'stagecoach':
      return 88;
    case 'general_store':
      return 82;

    case 'cat_balou':
      return 86;
    case 'panic':
      return 87;
    case 'jail':
      return 84;

    case 'bang':
      if (bangsInHand === 0) return 80;
      if (bangsInHand === 1) return 70;
      return 62;

    case 'indians':
      return 76;
    case 'gatling':
      return 75;
    case 'duel':
      return bangsInHand >= 2 ? 80 : 65;

    case 'dynamite':
      return bot.equipment.dynamite ? 10 : 35;

    default:
      return 50;
  }
}

/**
 * Analyzes recent event logs to identify confirmed enemies who attacked or jailed the Sheriff.
 */
function getConfirmedSheriffAttackers(state: GameState): Set<string> {
  const attackers = new Set<string>();
  const sheriff = state.players.find((p) => p.role === 'sheriff');
  if (!sheriff) return attackers;

  const logs = state.logs || [];
  for (const log of logs) {
    const text = log.text;
    if (
      (text.includes('شلیک') || text.includes('تیر') || text.includes('دستبند') || text.includes('زندان')) &&
      text.includes(sheriff.name)
    ) {
      for (const p of state.players) {
        if (p.id !== sheriff.id && (text.startsWith(`🔫 ${p.name}`) || text.includes(`دستبند قانون! ${p.name}`))) {
          attackers.add(p.id);
        }
      }
    }
  }
  return attackers;
}

/**
 * Computes threat/targeting score of a potential target from the bot's perspective.
 * (Higher score = higher priority to attack or eliminate).
 */
export function getEnemyThreatScore(target: Player, bot: Player, state: GameState): number {
  if (target.id === bot.id || target.isEliminated) return -99999;

  const isTargetSheriff = target.role === 'sheriff';
  const livingPlayers = state.players.filter((p) => !p.isEliminated);
  const confirmedSheriffAttackers = getConfirmedSheriffAttackers(state);

  // 1. OUTLAW STRATEGY
  if (bot.role === 'outlaw') {
    if (isTargetSheriff) {
      // Primary mission: Kill the Sheriff! Lower HP = higher priority to finish off!
      return 1000 + (10 - target.currentHp) * 30;
    }
    // Secondary: Weak Deputies to earn 3-card reward
    let score = 200 + (10 - target.currentHp) * 15;
    if (target.currentHp === 1) score += 120;
    return score;
  }

  // 2. DEPUTY STRATEGY
  if (bot.role === 'deputy') {
    if (isTargetSheriff) {
      // Absolute rule: Never harm the Sheriff!
      return -99999;
    }
    let score = 150 + (10 - target.currentHp) * 15;
    // Confirmed enemy of the Sheriff is top priority!
    if (confirmedSheriffAttackers.has(target.id)) score += 400;
    if (target.currentHp === 1) score += 150;
    return score;
  }

  // 3. SHERIFF STRATEGY
  if (bot.role === 'sheriff') {
    let score = 150 + (10 - target.currentHp) * 15;
    if (confirmedSheriffAttackers.has(target.id)) score += 450;
    if (target.currentHp === 1) score += 160;
    if (target.equipment.weapon?.name === 'volcanic') score += 100;
    return score;
  }

  // 4. RENEGADE STRATEGY (Master Chameleon)
  if (bot.role === 'renegade') {
    if (livingPlayers.length <= 2) {
      // Final 1v1 showdown: Sheriff is the ONLY target to win!
      if (isTargetSheriff) return 1000 + (10 - target.currentHp) * 20;
      return 100;
    }

    // Early/Mid game: Renegade MUST keep the Sheriff alive!
    if (isTargetSheriff) {
      const sheriffHp = target.currentHp;
      if (sheriffHp <= 2) return -99999; // Protect Sheriff at all costs!
      if (sheriffHp <= 3) return -500;
      return 50; // Minor chip damage only if Sheriff is fully healthy
    }

    // Attack Outlaws/Attackers to keep Sheriff safe
    let score = 200 + (10 - target.currentHp) * 15;
    if (confirmedSheriffAttackers.has(target.id)) score += 300;
    if (target.currentHp === 1) score += 120;
    return score;
  }

  return 100;
}

/**
 * Returns all living opponents sorted from highest threat to lowest.
 */
function getSortedOpponents(bot: Player, state: GameState): Player[] {
  return state.players
    .filter((p) => !p.isEliminated && p.id !== bot.id)
    .map((p) => ({ player: p, score: getEnemyThreatScore(p, bot, state) }))
    .filter((entry) => entry.score > -1000)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.player);
}

/**
 * Check if player has a Bang-equivalent card (Bang, or Missed if Calamity Janet).
 */
function findPlayableBangCard(player: Player): Card | undefined {
  const directBang = player.hand.find((c) => c.name === 'bang');
  if (directBang) return directBang;
  if (player.character?.name === 'calamity_janet') {
    return player.hand.find((c) => c.name === 'missed');
  }
  return undefined;
}

/**
 * Handles automated turn execution for professional AI bots.
 */
export function executeBotTurn(
  state: GameState,
  botPlayerId: string,
  onStateUpdated: () => void
) {
  const bot = state.players.find((p) => p.id === botPlayerId);
  if (!bot || !bot.isBot || bot.isEliminated || state.status !== 'playing') return;

  // ==========================================
  // 1. REACTION PHASE (Defense & Counter-Play)
  // ==========================================
  if (state.pendingReaction) {
    const isTarget =
      state.pendingReaction.type === 'duel'
        ? state.pendingReaction.duelTurnPlayerId === botPlayerId
        : state.pendingReaction.targetPlayerId === botPlayerId;

    if (isTarget) {
      // General Store: Pick the best card tactically
      if (state.pendingReaction.type === 'general_store') {
        const storeCards = state.pendingReaction.generalStoreCards || [];
        if (storeCards.length > 0) {
          const sortedStore = [...storeCards].sort(
            (a, b) => getCardTacticalValue(b, bot, state) - getCardTacticalValue(a, bot, state)
          );
          respondToReaction(state, botPlayerId, 'play', sortedStore[0].id);
        } else {
          respondToReaction(state, botPlayerId, 'pass');
        }
        onStateUpdated();
        return;
      }

      // Duel: Counter-shoot if bot has Bang
      if (state.pendingReaction.type === 'duel') {
        const bangCard = findPlayableBangCard(bot);
        if (bangCard) {
          respondToReaction(state, botPlayerId, 'play', bangCard.id);
        } else {
          respondToReaction(state, botPlayerId, 'pass');
        }
        onStateUpdated();
        return;
      }

      // Standard defense (Bang, Indians, Gatling)
      const required = state.pendingReaction.requiredCard;
      let matchingCard = bot.hand.find((c) => c.name === required);

      // Calamity Janet ability
      if (!matchingCard && bot.character?.name === 'calamity_janet') {
        if (required === 'missed') matchingCard = bot.hand.find((c) => c.name === 'bang');
        if (required === 'bang') matchingCard = bot.hand.find((c) => c.name === 'missed');
      }

      if (matchingCard) {
        respondToReaction(state, botPlayerId, 'play', matchingCard.id);
      } else {
        respondToReaction(state, botPlayerId, 'pass');
      }
      onStateUpdated();
      return;
    }
  }

  // Not bot's turn? Return immediately
  if (state.currentTurnPlayerId !== botPlayerId) return;

  // ==========================================
  // 2. SPECIAL DRAW PHASE (Pedro, Jesse, Kit)
  // ==========================================
  if (state.turnPhase === 'draw' && state.specialDrawPrompt?.playerId === botPlayerId) {
    const prompt = state.specialDrawPrompt;

    if (prompt.characterName === 'pedro_ramirez') {
      const topDiscard = state.discardPile[state.discardPile.length - 1];
      if (topDiscard && getCardTacticalValue(topDiscard, bot, state) >= 65) {
        resolveSpecialDraw(state, botPlayerId, { type: 'discard' });
      } else {
        resolveSpecialDraw(state, botPlayerId, { type: 'deck' });
      }
    } else if (prompt.characterName === 'jesse_jones') {
      const opponents = getSortedOpponents(bot, state).filter((p) => p.hand.length > 0);
      if (opponents.length > 0) {
        // Rob from top priority enemy!
        resolveSpecialDraw(state, botPlayerId, { type: 'player', targetPlayerId: opponents[0].id });
      } else {
        resolveSpecialDraw(state, botPlayerId, { type: 'deck' });
      }
    } else if (prompt.characterName === 'kit_carlson' && prompt.kitCards) {
      // Evaluate 3 drawn cards and keep top 2
      const scored = prompt.kitCards.map((c, idx) => ({
        idx,
        val: getCardTacticalValue(c, bot, state),
      }));
      scored.sort((a, b) => b.val - a.val);
      resolveSpecialDraw(state, botPlayerId, {
        type: 'kit',
        kitSelectedIndices: [scored[0].idx, scored[1].idx],
      });
    }

    onStateUpdated();
    return;
  }

  // ==========================================
  // 3. DISCARD PHASE (Discard Lowest Value)
  // ==========================================
  if (state.turnPhase === 'discard') {
    if (bot.hand.length > bot.currentHp) {
      // Sort cards by tactical value ascending; discard the least useful card!
      const sortedHand = [...bot.hand].sort(
        (a, b) => getCardTacticalValue(a, bot, state) - getCardTacticalValue(b, bot, state)
      );
      discardExcessCard(state, botPlayerId, sortedHand[0].id);
    }
    onStateUpdated();
    return;
  }

  // ==========================================
  // 4. ACTION PHASE (Smart Strategic Execution)
  // ==========================================
  if (state.turnPhase === 'action') {
    let performedAction = false;
    const sortedEnemies = getSortedOpponents(bot, state);
    const primaryEnemy = sortedEnemies[0];

    // --- A. SID KETCHUM HEAL ABILITY ---
    if (
      !performedAction &&
      bot.character?.name === 'sid_ketchum' &&
      bot.currentHp < bot.maxHp &&
      bot.hand.length >= 3
    ) {
      const sortedByLowest = [...bot.hand].sort(
        (a, b) => getCardTacticalValue(a, bot, state) - getCardTacticalValue(b, bot, state)
      );
      const res = useSidKetchumHeal(state, botPlayerId, [sortedByLowest[0].id, sortedByLowest[1].id]);
      if (res.success) performedAction = true;
    }

    // --- B. EMERGENCY HEALING (Beer & Saloon) ---
    if (!performedAction && bot.currentHp < bot.maxHp) {
      const beer = bot.hand.find((c) => c.name === 'beer');
      if (beer) {
        const res = playCard(state, botPlayerId, beer.id);
        if (res.success) performedAction = true;
      }
    }

    // Saloon play decision
    if (!performedAction) {
      const saloon = bot.hand.find((c) => c.name === 'saloon');
      if (saloon) {
        const sheriff = state.players.find((p) => p.role === 'sheriff' && !p.isEliminated);
        let shouldPlaySaloon = false;

        if (bot.role === 'deputy' && sheriff && sheriff.currentHp < sheriff.maxHp) {
          shouldPlaySaloon = true;
        } else if (bot.role === 'sheriff' && bot.currentHp < bot.maxHp) {
          shouldPlaySaloon = true;
        } else if (bot.role === 'renegade' && (bot.currentHp <= 2 || (sheriff && sheriff.currentHp <= 2))) {
          shouldPlaySaloon = true;
        } else if (bot.role === 'outlaw' && bot.currentHp <= 1) {
          shouldPlaySaloon = true;
        }

        if (shouldPlaySaloon) {
          const res = playCard(state, botPlayerId, saloon.id);
          if (res.success) performedAction = true;
        }
      }
    }

    // --- C. CARD ADVANTAGE (Wells Fargo, Stagecoach, General Store) ---
    if (!performedAction) {
      const drawCard = bot.hand.find(
        (c) => c.name === 'wells_fargo' || c.name === 'stagecoach' || c.name === 'general_store'
      );
      if (drawCard) {
        const res = playCard(state, botPlayerId, drawCard.id);
        if (res.success) performedAction = true;
      }
    }

    // --- D. BLUE EQUIPMENT (Barrels, Horses, Weapons) ---
    if (!performedAction) {
      // 1. Barrel (Free defense)
      if (!bot.equipment.barrel) {
        const barrel = bot.hand.find((c) => c.name === 'barrel');
        if (barrel) {
          const res = playCard(state, botPlayerId, barrel.id);
          if (res.success) performedAction = true;
        }
      }
      // 2. Mustang (Defensive distance)
      if (!performedAction && !bot.equipment.mustang) {
        const mustang = bot.hand.find((c) => c.name === 'mustang');
        if (mustang) {
          const res = playCard(state, botPlayerId, mustang.id);
          if (res.success) performedAction = true;
        }
      }
      // 3. Appaloosa (Offensive reach)
      if (!performedAction && !bot.equipment.appaloosa) {
        const appaloosa = bot.hand.find((c) => c.name === 'appaloosa');
        if (appaloosa) {
          const res = playCard(state, botPlayerId, appaloosa.id);
          if (res.success) performedAction = true;
        }
      }
      // 4. Weapons (Volcanic or range upgrade)
      if (!performedAction) {
        const currentRange = bot.equipment.weapon?.range || 1;
        const bangsInHand = bot.hand.filter((c) => c.name === 'bang').length;

        // Volcanic priority if bot has bullets to shoot
        const volcanic = bot.hand.find((c) => c.name === 'volcanic');
        if (volcanic && (bangsInHand >= 2 || !bot.equipment.weapon)) {
          const res = playCard(state, botPlayerId, volcanic.id);
          if (res.success) performedAction = true;
        } else {
          // Check other weapons with higher range
          const weaponUpgrade = bot.hand.find(
            (c) => c.border === 'blue' && c.range && c.range > currentRange
          );
          if (weaponUpgrade) {
            const res = playCard(state, botPlayerId, weaponUpgrade.id);
            if (res.success) performedAction = true;
          }
        }
      }
      // 5. Dynamite (Outlaw / Renegade chaos tactic)
      if (!performedAction && !bot.equipment.dynamite && (bot.role === 'outlaw' || bot.role === 'renegade')) {
        const dynamite = bot.hand.find((c) => c.name === 'dynamite');
        if (dynamite) {
          const res = playCard(state, botPlayerId, dynamite.id);
          if (res.success) performedAction = true;
        }
      }
    }

    // --- E. TACTICAL SABOTAGE: CAT BALOU ---
    if (!performedAction) {
      const catBalou = bot.hand.find((c) => c.name === 'cat_balou');
      if (catBalou) {
        // Deputy check: Save Sheriff from Jail or Dynamite!
        if (bot.role === 'deputy') {
          const sheriff = state.players.find((p) => p.role === 'sheriff' && !p.isEliminated);
          if (sheriff?.equipment?.jail) {
            const res = playCard(state, botPlayerId, catBalou.id, sheriff.id, {
              type: 'equipment',
              equipmentKey: 'jail',
            });
            if (res.success) performedAction = true;
          } else if (sheriff?.equipment?.dynamite) {
            const res = playCard(state, botPlayerId, catBalou.id, sheriff.id, {
              type: 'equipment',
              equipmentKey: 'dynamite',
            });
            if (res.success) performedAction = true;
          }
        }

        // Enemy Sabotage: Destroy enemy Barrel, Mustang, or Weapon
        if (!performedAction && primaryEnemy) {
          let choice: TargetCardChoice = { type: 'hand' };
          if (primaryEnemy.equipment.barrel) {
            choice = { type: 'equipment', equipmentKey: 'barrel' };
          } else if (primaryEnemy.equipment.mustang) {
            choice = { type: 'equipment', equipmentKey: 'mustang' };
          } else if (primaryEnemy.equipment.weapon?.name === 'volcanic') {
            choice = { type: 'equipment', equipmentKey: 'weapon' };
          }

          const res = playCard(state, botPlayerId, catBalou.id, primaryEnemy.id, choice);
          if (res.success) performedAction = true;
        }
      }
    }

    // --- F. TACTICAL THEFT: PANIC ---
    if (!performedAction) {
      const panic = bot.hand.find((c) => c.name === 'panic');
      if (panic) {
        // Find valid enemy in distance <= 1 with cards in hand
        const closeEnemies = sortedEnemies.filter(
          (p) => calculateEffectiveDistance(state, botPlayerId, p.id) <= 1 && p.hand.length > 0
        );
        if (closeEnemies.length > 0) {
          const target = closeEnemies[0];
          const res = playCard(state, botPlayerId, panic.id, target.id, { type: 'hand' });
          if (res.success) performedAction = true;
        }
      }
    }

    // --- G. IMPRISONMENT: JAIL (هلفدونی) ---
    if (!performedAction) {
      const jail = bot.hand.find((c) => c.name === 'jail');
      if (jail) {
        // Find highest threat unjailed enemy
        const jailTargets = sortedEnemies.filter((p) => !p.equipment.jail);
        if (jailTargets.length > 0) {
          const target = jailTargets[0];
          const res = playCard(state, botPlayerId, jail.id, target.id);
          if (res.success) performedAction = true;
        }
      }
    }

    // --- H. AREA ATTACKS (Gatling & Indians) ---
    if (!performedAction) {
      const gatling = bot.hand.find((c) => c.name === 'gatling');
      if (gatling) {
        // Outlaw always plays Gatling. Loyalists play only if Sheriff has >= 3 HP
        const sheriff = state.players.find((p) => p.role === 'sheriff' && !p.isEliminated);
        const safeForSheriff = !sheriff || sheriff.currentHp >= 3 || bot.role === 'outlaw';
        if (safeForSheriff) {
          const res = playCard(state, botPlayerId, gatling.id);
          if (res.success) performedAction = true;
        }
      }
    }

    if (!performedAction) {
      const indians = bot.hand.find((c) => c.name === 'indians');
      if (indians) {
        const sheriff = state.players.find((p) => p.role === 'sheriff' && !p.isEliminated);
        const safeForSheriff = !sheriff || sheriff.currentHp >= 3 || bot.role === 'outlaw';
        if (safeForSheriff) {
          const res = playCard(state, botPlayerId, indians.id);
          if (res.success) performedAction = true;
        }
      }
    }

    // --- I. DUEL CHALLENGE ---
    if (!performedAction) {
      const duel = bot.hand.find((c) => c.name === 'duel');
      const bangsCount = bot.hand.filter((c) => c.name === 'bang').length;
      if (duel && primaryEnemy) {
        // Challenge when bot has >= 2 Bangs, or when target has 1 HP or 0 cards in hand
        if (bangsCount >= 2 || primaryEnemy.currentHp === 1 || primaryEnemy.hand.length <= 1) {
          const res = playCard(state, botPlayerId, duel.id, primaryEnemy.id);
          if (res.success) performedAction = true;
        }
      }
    }

    // --- J. DIRECT SHOOTING (BANG!) ---
    if (!performedAction) {
      const canShoot =
        bot.bangCountThisTurn === 0 ||
        bot.character?.name === 'willy_the_kid' ||
        bot.equipment.weapon?.name === 'volcanic';

      if (canShoot) {
        const bangCard = findPlayableBangCard(bot);
        if (bangCard) {
          // Find enemies within shooting range
          const shootableEnemies = sortedEnemies.filter((p) =>
            canShootTarget(state, botPlayerId, p.id)
          );

          if (shootableEnemies.length > 0) {
            // Slab the Killer priority: Targets with fewer cards
            if (bot.character?.name === 'slab_the_killer') {
              shootableEnemies.sort((a, b) => a.hand.length - b.hand.length);
            }

            const chosenTarget = shootableEnemies[0];
            const res = playCard(state, botPlayerId, bangCard.id, chosenTarget.id);
            if (res.success) performedAction = true;
          }
        }
      }
    }

    // --- K. SUZY LAFAYETTE SYNERGY ---
    // If Suzy has 1 remaining card that can be played, play it to draw immediately!
    if (!performedAction && bot.character?.name === 'suzy_lafayette' && bot.hand.length === 1) {
      const lastCard = bot.hand[0];
      if (lastCard.border === 'blue' && !bot.equipment[lastCard.name as keyof typeof bot.equipment]) {
        const res = playCard(state, botPlayerId, lastCard.id);
        if (res.success) performedAction = true;
      }
    }

    // Complete action or end turn
    if (performedAction) {
      onStateUpdated();
    } else {
      endTurn(state, botPlayerId);
      onStateUpdated();
    }
  }
}
