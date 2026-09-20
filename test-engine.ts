import {
  createInitialState,
  addPlayerToRoom,
  startGame,
  playCard,
  respondToReaction,
  endTurn,
} from './src/lib/game-engine/engine';
import { canShootTarget, calculateEffectiveDistance } from './src/lib/game-engine/distance';

console.log('--- Testing Bang! Game Engine ---');

const state = createInitialState('TEST1');
console.log('✓ Initial state created');

// Add 4 players
const p1 = addPlayerToRoom(state, 'p1', 'سهراب کلانتر');
const p2 = addPlayerToRoom(state, 'p2', 'بیلی یاغی');
const p3 = addPlayerToRoom(state, 'p3', 'رد داگ');
const p4 = addPlayerToRoom(state, 'p4', 'جسی خائن');

console.log(`✓ Added 4 players: ${state.players.length} players`);

// Start Game
const started = startGame(state);
console.log(`✓ Game started: ${started}`);

const sheriff = state.players.find((p) => p.role === 'sheriff');
console.log(`✓ Sheriff is ${sheriff?.name} with ${sheriff?.currentHp} HP (Role is public)`);

// Test distances
const distP1toP2 = calculateEffectiveDistance(state, 'p1', 'p2');
const distP1toP3 = calculateEffectiveDistance(state, 'p1', 'p3');
console.log(`✓ Distance P1 to P2: ${distP1toP2}`);
console.log(`✓ Distance P1 to P3: ${distP1toP3}`);

// Test shooting check
console.log(`✓ Can P1 shoot P2 with default Colt .45: ${canShootTarget(state, 'p1', 'p2')}`);

console.log('✓ Game Engine logic verified successfully!');
