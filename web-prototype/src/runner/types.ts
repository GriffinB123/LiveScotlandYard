/**
 * Runner types for game simulation
 */

import type { GameSettings, Role, Difficulty } from '../game/types';

// ============================================================================
// ROLE CONTROLLER CONFIGURATION
// ============================================================================

/**
 * Controller type for a role
 */
export type ControllerType = 'ai' | 'scripted' | 'human';

/**
 * Configuration for how a role is controlled
 */
export type RoleController =
  | { type: 'ai'; difficulty: Difficulty }
  | { type: 'scripted'; policyName: string }
  | { type: 'human' }; // Not used in runner, but included for completeness

// ============================================================================
// SIMULATION CONFIGURATION
// ============================================================================

/**
 * Configuration for running a game simulation
 */
export interface GameSimulationConfig {
  /** Game settings */
  settings: GameSettings;
  
  /** Controller configuration for each role */
  roleControllers: Record<Role, RoleController>;
  
  /** Maximum rounds before forcing game end (default: 24) */
  maxRounds?: number;
  
  /** Number of games to run in a series (for statistics) */
  numGames?: number;
}

// ============================================================================
// GAME RESULTS
// ============================================================================

/**
 * Result of a single game
 */
export interface GameResult {
  /** Winner of the game */
  winner: 'MrX' | 'Detectives';
  
  /** Number of rounds played */
  rounds: number;
  
  /** Total number of moves made */
  moveCount: number;
  
  /** How the game ended */
  endReason: 'capture' | 'survival' | 'stalemate' | 'maxRounds';
  
  /** Ticket usage statistics per role */
  ticketUsage: {
    mrX: Record<string, number>;
    detectives: Record<string, number>;
  };
  
  /** Game duration in milliseconds */
  durationMs: number;
}

/**
 * Aggregated statistics from multiple games
 */
export interface SimulationStats {
  /** Total games played */
  totalGames: number;
  
  /** Number of Mr. X wins */
  mrXWins: number;
  
  /** Number of Detective wins */
  detectiveWins: number;
  
  /** Win rate for Mr. X (0-1) */
  mrXWinRate: number;
  
  /** Average game length in rounds */
  avgRounds: number;
  
  /** Average Mr. X survival rounds (even when captured) */
  avgMrXSurvival: number;
  
  /** Breakdown of end reasons */
  endReasons: {
    capture: number;
    survival: number;
    stalemate: number;
    maxRounds: number;
  };
  
  /** Average game duration */
  avgDurationMs: number;
}
