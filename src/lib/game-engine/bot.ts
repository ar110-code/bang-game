import { GameState, Player, Card } from './types';
import { canShootTarget } from './distance';
import {
  playCard,
  respondToReaction,
  discardExcessCard,
  endTurn,
  resolveSpecialDraw,
  useSidKetchumHeal,
} from './engine';

/**
 * Handles automated single-step action for a Bot player.
 * Delays and timers are managed centrally by the server socket handler.
 */
export function executeBotTurn(
  state: GameState,
  botPlayerId: string,
  onStateUpdated: () => void
) {
  const bot = state.players.find((p) => p.id === botPlayerId);
  if (!bot || !bot.isBot || bot.isEliminated || state.status !== 'playing') return;

  // 1. Check pending reaction
  if (state.pendingReaction) {
    const isTarget =
      state.pendingReaction.type === 'duel'
        ? state.pendingReaction.duelTurnPlayerId === botPlayerId
        : state.pendingReaction.targetPlayerId === botPlayerId;

    if (isTarget) {
      if (state.pendingReaction.type === 'general_store') {
        const cards = state.pendingReaction.generalStoreCards || [];
        const chosen = cards[0];
        if (chosen) {
          respondToReaction(state, botPlayerId, 'play', chosen.id);
        } else {
          respondToReaction(state, botPlayerId, 'pass');
        }
        onStateUpdated();
        return;
      }

      const required = state.pendingReaction.requiredCard;
      const matchingCard = bot.hand.find((c) => {
        if (c.name === required) return true;
        if (bot.character?.name === 'calamity_janet') {
          if (required === 'missed' && c.name === 'bang') return true;
          if (required === 'bang' && c.name === 'missed') return true;
        }
        return false;
      });

      if (matchingCard) {
        respondToReaction(state, botPlayerId, 'play', matchingCard.id);
      } else {
        respondToReaction(state, botPlayerId, 'pass');
      }
      onStateUpdated();
      return;
    }
  }

  // 2. If it's not bot's turn, do nothing
  if (state.currentTurnPlayerId !== botPlayerId) return;

  // Check special draw phase for Pedro / Jesse / Kit
  if (state.turnPhase === 'draw' && state.specialDrawPrompt?.playerId === botPlayerId) {
    const prompt = state.specialDrawPrompt;
    if (prompt.characterName === 'pedro_ramirez') {
      const choice = state.discardPile.length > 0 ? 'discard' : 'deck';
      resolveSpecialDraw(state, botPlayerId, { type: choice as any });
    } else if (prompt.characterName === 'jesse_jones') {
      const opponentsWithCards = state.players.filter(
        (p) => !p.isEliminated && p.id !== botPlayerId && p.hand.length > 0
      );
      if (opponentsWithCards.length > 0) {
        const randTarget = opponentsWithCards[Math.floor(Math.random() * opponentsWithCards.length)];
        resolveSpecialDraw(state, botPlayerId, { type: 'player', targetPlayerId: randTarget.id });
      } else {
        resolveSpecialDraw(state, botPlayerId, { type: 'deck' });
      }
    } else if (prompt.characterName === 'kit_carlson') {
      resolveSpecialDraw(state, botPlayerId, { type: 'kit', kitSelectedIndices: [0, 1] });
    }

    onStateUpdated();
    return;
  }

  // 3. If in discard phase
  if (state.turnPhase === 'discard') {
    if (bot.hand.length > bot.currentHp) {
      discardExcessCard(state, botPlayerId, bot.hand[0].id);
    }
    onStateUpdated();
    return;
  }

  // 4. Action phase
  if (state.turnPhase === 'action') {
    let performedAction = false;

    // Try equipping blue cards
    for (const card of [...bot.hand]) {
      if (card.border === 'blue' && card.name !== 'jail') {
        const res = playCard(state, botPlayerId, card.id);
        if (res.success) {
          performedAction = true;
          break;
        }
      }
    }

    // Try playing healing / draw cards
    if (!performedAction) {
      const utilityCard = bot.hand.find(
        (c) =>
          c.name === 'stagecoach' ||
          c.name === 'wells_fargo' ||
          c.name === 'saloon' ||
          (c.name === 'beer' && bot.currentHp < bot.maxHp)
      );
      if (utilityCard) {
        const res = playCard(state, botPlayerId, utilityCard.id);
        if (res.success) performedAction = true;
      }
    }

    // Try Sid Ketchum ability heal
    if (
      !performedAction &&
      bot.character?.name === 'sid_ketchum' &&
      bot.currentHp < bot.maxHp &&
      bot.hand.length >= 3
    ) {
      const res = useSidKetchumHeal(state, botPlayerId, [bot.hand[0].id, bot.hand[1].id]);
      if (res.success) performedAction = true;
    }

    // Try shooting BANG!
    if (!performedAction) {
      const bangCard = bot.hand.find((c) => c.name === 'bang');
      if (
        bangCard &&
        (bot.bangCountThisTurn === 0 ||
          bot.character?.name === 'willy_the_kid' ||
          bot.equipment.weapon?.name === 'volcanic')
      ) {
        // Select target based on role
        const possibleTargets = state.players.filter(
          (p) => !p.isEliminated && p.id !== botPlayerId && canShootTarget(state, botPlayerId, p.id)
        );

        let chosenTarget: Player | undefined;

        if (bot.role === 'outlaw') {
          // Priority: Sheriff
          chosenTarget = possibleTargets.find((p) => p.role === 'sheriff') || possibleTargets[0];
        } else if (bot.role === 'sheriff' || bot.role === 'deputy') {
          // Avoid Sheriff, shoot any non-sheriff
          chosenTarget = possibleTargets.find((p) => p.role !== 'sheriff');
        } else {
          // Renegade shoots anyone
          chosenTarget = possibleTargets[0];
        }

        if (chosenTarget) {
          const res = playCard(state, botPlayerId, bangCard.id, chosenTarget.id);
          if (res.success) performedAction = true;
        }
      }
    }

    if (performedAction) {
      onStateUpdated();
    } else {
      endTurn(state, botPlayerId);
      onStateUpdated();
    }
  }
}
