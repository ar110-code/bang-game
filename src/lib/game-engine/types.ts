export type Role = 'sheriff' | 'deputy' | 'outlaw' | 'renegade';

export type CardSuit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type CardRank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';
export type CardBorder = 'brown' | 'blue';

export type CardName =
  | 'bang'
  | 'missed'
  | 'beer'
  | 'saloon'
  | 'stagecoach'
  | 'wells_fargo'
  | 'general_store'
  | 'panic'
  | 'cat_balou'
  | 'gatling'
  | 'indians'
  | 'duel'
  | 'volcanic'
  | 'schofield'
  | 'remington'
  | 'rev_carabine'
  | 'winchester'
  | 'mustang'
  | 'appaloosa'
  | 'barrel'
  | 'jail'
  | 'dynamite';

export interface Card {
  id: string;
  name: CardName;
  titleFa: string;
  descFa: string;
  border: CardBorder;
  suit: CardSuit;
  rank: CardRank;
  range?: number; // For weapons
}

export type CharacterName =
  | 'bart_cassidy'
  | 'black_jack'
  | 'calamity_janet'
  | 'el_gringo'
  | 'jesse_jones'
  | 'jourdonnais'
  | 'kit_carlson'
  | 'lucky_duke'
  | 'paul_regret'
  | 'pedro_ramirez'
  | 'rose_doolan'
  | 'sid_ketchum'
  | 'slab_the_killer'
  | 'suzy_lafayette'
  | 'vulture_sam'
  | 'willy_the_kid';

export interface Character {
  name: CharacterName;
  nameFa: string;
  titleFa: string;
  descFa: string;
  baseHp: number;
}

export interface PlayerEquipment {
  weapon?: Card;
  mustang?: Card;
  appaloosa?: Card;
  barrel?: Card;
  jail?: Card;
  dynamite?: Card;
}

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isBot: boolean;
  isReady: boolean;
  role: Role;
  character: Character | null;
  maxHp: number;
  currentHp: number;
  hand: Card[];
  equipment: PlayerEquipment;
  bangCountThisTurn: number;
  isEliminated: boolean;
}

export type ReactionType = 'bang' | 'gatling' | 'indians' | 'duel' | 'general_store';

export interface PendingReaction {
  id: string;
  type: ReactionType;
  sourcePlayerId: string;
  targetPlayerId: string;
  requiredCard: CardName;
  missedNeeded: number; // for Slab the killer
  missedPlayed: number;
  duelTurnPlayerId?: string;
  generalStoreCards?: Card[];
  remainingTargets?: string[]; // For gatling / indians
}

export interface GameLog {
  id: string;
  text: string;
  type: 'system' | 'attack' | 'heal' | 'defense' | 'equip' | 'death' | 'win' | 'turn';
  timestamp: number;
  playerId?: string;
  targetPlayerId?: string;
}

export type TurnPhase = 'draw' | 'action' | 'discard';

export interface SpecialDrawPrompt {
  playerId: string;
  characterName: 'pedro_ramirez' | 'jesse_jones' | 'kit_carlson';
  kitCards?: Card[]; // 3 cards for Kit Carlson to choose from
}

export interface TargetCardChoice {
  type: 'hand' | 'equipment';
  equipmentKey?: 'weapon' | 'mustang' | 'appaloosa' | 'barrel' | 'jail' | 'dynamite';
  handIndex?: number;
}

export interface GameState {
  roomId: string;
  status: 'lobby' | 'playing' | 'game_over';
  players: Player[];
  currentTurnPlayerId: string | null;
  turnPhase: TurnPhase;
  deck: Card[];
  discardPile: Card[];
  pendingReaction: PendingReaction | null;
  specialDrawPrompt: SpecialDrawPrompt | null;
  winner: Role | null;
  logs: GameLog[];
  revealCountdown?: number | null;
}

// Client-safe version (hides other players' hands and secret roles)
export interface PublicPlayer {
  id: string;
  name: string;
  isHost: boolean;
  isBot: boolean;
  isReady: boolean;
  role: Role | 'hidden';
  character: Character | null;
  maxHp: number;
  currentHp: number;
  handCount: number;
  equipment: PlayerEquipment;
  isEliminated: boolean;
}

export interface PublicGameState {
  roomId: string;
  status: 'lobby' | 'playing' | 'game_over';
  players: PublicPlayer[];
  myPlayer: Player | null; // Full data of the viewer
  currentTurnPlayerId: string | null;
  turnPhase: TurnPhase;
  deckCount: number;
  topDiscard: Card | null;
  pendingReaction: PendingReaction | null;
  specialDrawPrompt: SpecialDrawPrompt | null;
  winner: Role | null;
  logs: GameLog[];
  revealCountdown?: number | null;
}

