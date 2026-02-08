/**
 * Scripted "human" policies for testing
 * 
 * These are simple deterministic policies that stand in for human players
 * during engine testing. Not meant to be intelligent, just legal.
 */

import type { Move } from '../game/types';

/**
 * A policy function that chooses a move from available options
 */
export type HumanPolicy = (legalMoves: Move[]) => Move;

/**
 * Always pick the first legal move
 * Simplest possible policy for testing
 */
export const firstLegalMovePolicy: HumanPolicy = (moves) => {
  if (moves.length === 0) {
    throw new Error('No legal moves available');
  }
  return moves[0];
};

/**
 * Pick a random legal move
 * Adds some variety while staying simple
 */
export const randomLegalMovePolicy: HumanPolicy = (moves) => {
  if (moves.length === 0) {
    throw new Error('No legal moves available');
  }
  const index = Math.floor(Math.random() * moves.length);
  return moves[index];
};

/**
 * Prefer single moves over double moves (if available)
 * Useful for testing single-move logic
 */
export const preferSingleMovePolicy: HumanPolicy = (moves) => {
  if (moves.length === 0) {
    throw new Error('No legal moves available');
  }
  
  const singleMoves = moves.filter(m => m.type === 'single');
  if (singleMoves.length > 0) {
    return singleMoves[0];
  }
  
  return moves[0];
};

/**
 * Get a policy by name
 */
export function getPolicy(policyName: string): HumanPolicy {
  switch (policyName) {
    case 'first':
      return firstLegalMovePolicy;
    case 'random':
      return randomLegalMovePolicy;
    case 'preferSingle':
      return preferSingleMovePolicy;
    default:
      throw new Error(`Unknown policy: ${policyName}`);
  }
}
