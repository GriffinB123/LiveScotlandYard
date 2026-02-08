/**
 * AI module exports and strategy selection
 */

export * from './types';
export * from './easy';

import type { AiStrategy } from './types';
import type { Difficulty } from '../game/types';
import { EasyAi } from './easy';

/**
 * Get the appropriate AI strategy for a difficulty level
 */
export function getAiStrategy(difficulty: Difficulty): AiStrategy {
  switch (difficulty) {
    case 'Easy':
      return new EasyAi();
    case 'Medium':
      // TODO: Implement MediumAi with better heuristics
      return new EasyAi(); // Fallback to Easy for now
    case 'Hard':
      // TODO: Implement MinimaxAi with alpha-beta pruning
      return new EasyAi(); // Fallback to Easy for now
    default:
      throw new Error(`Unknown difficulty: ${difficulty}`);
  }
}
