/**
 * AI types and interfaces for Scotland Yard.
 * 
 * Mirrors the AI architecture from ZikZhao/Scotland-Yard-2024.
 */

import type { GameState, Role, Move, Difficulty } from '../game/types';
import type { BoardGraph } from '../game/graph';

// ============================================================================
// AI STRATEGY INTERFACE
// ============================================================================

/**
 * Context provided to AI strategies for decision-making
 */
export interface AiContext {
  state: GameState;
  role: Role;
  graph: BoardGraph;
  difficulty: Difficulty;
}

/**
 * Strategy interface for AI move selection
 * (Strategy pattern - different implementations for different difficulties)
 */
export interface AiStrategy {
  /**
   * Choose the best move for the given context
   * @returns The chosen move, or throws if no legal moves exist
   */
  chooseMove(context: AiContext): Move;
}
