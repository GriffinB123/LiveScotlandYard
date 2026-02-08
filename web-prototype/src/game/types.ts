/**
 * Core type definitions for the Scotland Yard game engine.
 * 
 * This module defines the fundamental types mirroring the canonical
 * ZikZhao/Scotland-Yard-2024 Java implementation, translated to idiomatic TypeScript.
 */

// ============================================================================
// ROLES & TICKETS
// ============================================================================

/**
 * Player roles in the game (mirrors Java Piece enum)
 */
export type Role = 'MrX' | 'Detective' | 'Bobby';

/**
 * Transport ticket types (mirrors ScotlandYard.Ticket enum)
 * Note: 'black' and 'doubleMove' are special tickets used only by Mr. X
 */
export type TicketType = 'taxi' | 'bus' | 'underground' | 'black' | 'doubleMove';

// ============================================================================
// MOVES
// ============================================================================

/**
 * Base move properties shared by all move types
 */
interface BaseMove {
  role: Role;
  from: number; // Starting node ID
}

/**
 * A single-hop move using one ticket
 */
export interface SingleMove extends BaseMove {
  type: 'single';
  to: number; // Destination node ID
  ticket: TicketType;
}

/**
 * A double-move using the special doubleMove ticket
 * Allows Mr. X to make two consecutive moves in one turn
 */
export interface DoubleMove extends BaseMove {
  type: 'double';
  ticket1: TicketType; // First move ticket
  via: number; // Intermediate node ID
  ticket2: TicketType; // Second move ticket
  to: number; // Final destination node ID
}

/**
 * Discriminated union for all move types
 * (Replaces Java's Visitor pattern with TypeScript's union types)
 */
export type Move = SingleMove | DoubleMove;

// ============================================================================
// PLAYER STATE
// ============================================================================

/**
 * Represents a player's current state in the game
 * (Mirrors Java Player class)
 */
export interface PlayerState {
  /** Player's role */
  role: Role;
  
  /** Display name */
  name: string;
  
  /** Current position on the board
   * - For Mr. X: node ID when revealed, 'unknown' when hidden
   * - For Detectives/Bobbies: always node ID
   */
  position: number | 'unknown';
  
  /** Ticket inventory */
  tickets: Record<TicketType, number>;
  
  /** Whether Mr. X's position is currently revealed
   * (Only meaningful for Mr. X; always true for Detectives)
   */
  isRevealed: boolean;
}

// ============================================================================
// GAME SETTINGS
// ============================================================================

/**
 * Timing mode for the game
 */
export type TimingMode = 'individualTimed' | 'commitMode' | 'unlimited';

/**
 * AI difficulty levels
 */
export type Difficulty = 'Easy' | 'Medium' | 'Hard';

/**
 * AI fallback behavior when a human player times out
 */
export type AiFallback = 'forceAi' | 'waitForever';

/**
 * Game configuration settings (from PRD)
 * These are set at game start and remain constant throughout
 */
export interface GameSettings {
  // Timing configuration
  timingMode: TimingMode;
  turnTime: number; // seconds per turn
  aiFallbackOnTimeout: AiFallback;
  
  // Handicap settings
  revealFrequency: number; // Mr. X surfaces every N turns (default: 5)
  extraDetectiveTickets: 0 | 2 | 4; // Bonus tickets per detective
  mrXTicketPenalty: 0 | 2 | 4; // Ticket reduction for Mr. X
  
  // AI configuration
  bobbiesMode: 'auto' | 'off'; // Auto-fill AI detectives when <4 human detectives
}

// ============================================================================
// GAME STATE
// ============================================================================

/**
 * Complete game state at any point in time
 * (Mirrors Java GameState class with Guava ImmutableCollections)
 * 
 * All fields are readonly to enforce immutability.
 * State transitions create new GameState objects rather than mutating.
 */
export interface GameState {
  /** Current round number (1-24) */
  readonly round: number;
  
  /** Role whose turn it is to move */
  readonly currentTurn: Role;
  
  /** All players in the game (Mr. X + detectives + bobbies) */
  readonly players: readonly PlayerState[];
  
  /** Game configuration */
  readonly settings: GameSettings;
  
  /** Rounds on which Mr. X must surface (e.g., [3, 8, 13, 18, 24]) */
  readonly revealSchedule: readonly number[];
  
  /** History of all moves made so far */
  readonly moveHistory: readonly Move[];
  
  /** Whether the game has ended */
  readonly isGameOver: boolean;
  
  /** Winner if game is over */
  readonly winner?: 'MrX' | 'Detectives';
}

// ============================================================================
// TURN RESULT
// ============================================================================

/**
 * Events that can occur during a turn
 */
export type TurnEvent =
  | { type: 'move'; role: Role; move: Move }
  | { type: 'reveal'; role: 'MrX'; position: number }
  | { type: 'capture'; detective: Role; position: number }
  | { type: 'roundAdvance'; newRound: number }
  | { type: 'gameOver'; winner: 'MrX' | 'Detectives' };

/**
 * Result of applying a move to the game state
 */
export interface TurnResult {
  /** New game state after the move */
  newState: GameState;
  
  /** Events that occurred during this turn */
  events: TurnEvent[];
}

// ============================================================================
// PLAYER CONFIGURATION (for initialization)
// ============================================================================

/**
 * Configuration for a player at game start
 */
export interface PlayerConfig {
  role: Role;
  name: string;
  controller: 'human' | 'ai' | 'scripted';
  aiDifficulty?: Difficulty; // Required if controller is 'ai'
  scriptedPolicy?: string; // Required if controller is 'scripted'
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Type guard to check if a move is a single move
 */
export function isSingleMove(move: Move): move is SingleMove {
  return move.type === 'single';
}

/**
 * Type guard to check if a move is a double move
 */
export function isDoubleMove(move: Move): move is DoubleMove {
  return move.type === 'double';
}

/**
 * Get the final destination of a move (works for both single and double moves)
 */
export function getMoveDestination(move: Move): number {
  return move.to;
}

/**
 * Get all tickets consumed by a move
 */
export function getMoveTickets(move: Move): TicketType[] {
  if (move.type === 'single') {
    return [move.ticket];
  } else {
    return ['doubleMove', move.ticket1, move.ticket2];
  }
}