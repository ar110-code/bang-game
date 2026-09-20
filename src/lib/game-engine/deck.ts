import { Card, GameState } from './types';
import { BASE_CARDS_BLUEPRINT } from './constants';

export function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function createDeck(): Card[] {
  const deck: Card[] = BASE_CARDS_BLUEPRINT.map((blueprint, index) => ({
    ...blueprint,
    id: `card_${blueprint.name}_${index}_${Math.random().toString(36).substring(2, 7)}`,
  }));
  return shuffle(deck);
}

export function drawCards(state: GameState, count: number): Card[] {
  const drawn: Card[] = [];

  for (let i = 0; i < count; i++) {
    if (state.deck.length === 0) {
      if (state.discardPile.length === 0) {
        // No cards left anywhere
        break;
      }
      // Reshuffle discard pile into deck, preserving top discard if wanted or reshuffle all
      const reshuffled = shuffle([...state.discardPile]);
      state.deck = reshuffled;
      state.discardPile = [];
    }

    const card = state.deck.pop();
    if (card) {
      drawn.push(card);
    }
  }

  return drawn;
}

export interface DrawTestResult {
  card: Card;
  success: boolean;
}

/**
 * Perform a Bang "Draw!" check:
 * Reveals the top card of the deck, tests it against a condition,
 * and puts it in the discard pile.
 */
export function performDrawTest(
  state: GameState,
  predicate: (card: Card) => boolean,
  isLuckyDuke: boolean = false
): DrawTestResult {
  const drawOne = () => {
    if (state.deck.length === 0) {
      state.deck = shuffle([...state.discardPile]);
      state.discardPile = [];
    }
    return state.deck.pop() || {
      id: `fallback_draw_${Date.now()}`,
      name: 'bang' as const,
      titleFa: 'بنگ!',
      descFa: '',
      border: 'brown' as const,
      suit: 'spades' as const,
      rank: '2' as const,
    };
  };

  const card1 = drawOne();
  const success1 = predicate(card1);

  if (isLuckyDuke) {
    const card2 = drawOne();
    const success2 = predicate(card2);
    // If either succeeded, pick the winning card
    if (success2 && !success1) {
      state.discardPile.push(card1, card2);
      return { card: card2, success: true };
    }
    state.discardPile.push(card1, card2);
    return { card: card1, success: success1 || success2 };
  }

  state.discardPile.push(card1);
  return { card: card1, success: success1 };
}
