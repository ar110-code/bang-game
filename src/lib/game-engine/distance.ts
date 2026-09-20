import { GameState, Player } from './types';

/**
 * Calculates the living player index circle and the minimum distance between two players.
 */
export function calculateEffectiveDistance(
  state: GameState,
  fromPlayerId: string,
  toPlayerId: string
): number {
  if (fromPlayerId === toPlayerId) return 0;

  const livingPlayers = state.players.filter((p) => !p.isEliminated);
  const n = livingPlayers.length;
  if (n <= 1) return 1;

  const fromIndex = livingPlayers.findIndex((p) => p.id === fromPlayerId);
  const toIndex = livingPlayers.findIndex((p) => p.id === toPlayerId);

  if (fromIndex === -1 || toIndex === -1) return 999;

  // Base circular distance
  const diff = Math.abs(fromIndex - toIndex);
  const baseDistance = Math.min(diff, n - diff);

  const fromPlayer = livingPlayers[fromIndex];
  const toPlayer = livingPlayers[toIndex];

  // Attacker modifiers (make target closer)
  let attackerBonus = 0;
  if (fromPlayer?.equipment?.appaloosa) attackerBonus += 1;
  if (fromPlayer?.character?.name === 'rose_doolan') attackerBonus += 1;

  // Defender modifiers (make target farther)
  let defenderBonus = 0;
  if (toPlayer?.equipment?.mustang) defenderBonus += 1;
  if (toPlayer?.character?.name === 'paul_regret') defenderBonus += 1;

  const effective = baseDistance + defenderBonus - attackerBonus;
  return Math.max(1, effective);
}

/**
 * Returns the maximum reach for player's current weapon.
 */
export function getPlayerWeaponRange(player: Player): number {
  return player.equipment.weapon?.range || 1;
}

/**
 * Checks if target is within shooting range of player.
 */
export function canShootTarget(
  state: GameState,
  attackerId: string,
  targetId: string
): boolean {
  const attacker = state.players.find((p) => p.id === attackerId);
  if (!attacker) return false;

  const weaponRange = getPlayerWeaponRange(attacker);
  const effectiveDistance = calculateEffectiveDistance(state, attackerId, targetId);

  return weaponRange >= effectiveDistance;
}
