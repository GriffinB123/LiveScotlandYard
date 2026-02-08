/**
 * Scotland Yard Game Engine
 * 
 * Core game logic mirroring ZikZhao/Scotland-Yard-2024's Model interface.
 * Provides a clean OO facade for game state management, move generation,
 * and state transitions.
 * 
 * All state is immutable; operations return new GameState objects.
 */

import type {
  GameState,
  GameSettings,
  PlayerConfig,
  PlayerState,
  Role,
  Move,
  TurnResult,
  TurnEvent,
  TicketType,
  Difficulty,
} from './types';
import { BoardGraph } from './graph';

// ============================================================================
// GAME ENGINE CLASS
// ============================================================================

export class GameEngine {
  private graph: BoardGraph;
  
  constructor(graph: BoardGraph) {
    this.graph = graph;
  }
  
  // ==========================================================================
  // FACTORY METHOD (mirrors Java GameStateFactory)
  // ==========================================================================
  
  /**
   * Create initial game state from settings and player configuration.
   * 
   * Responsibilities:
   * - Assign starting positions to all players
   * - Initialize ticket inventories (applying handicaps from settings)
   * - Calculate reveal schedule based on settings.revealFrequency
   * - Auto-add Bobbies if settings.bobbiesMode is 'auto' and <4 detectives
   * 
   * @param settings Game configuration
   * @param players Player configurations (roles, names, controllers)
   * @returns Initial GameState ready to play
   */
  createInitialState(
    settings: GameSettings,
    players: PlayerConfig[]
  ): GameState {
    // Validate configuration
    const mrXCount = players.filter(p => p.role === 'MrX').length;
    if (mrXCount !== 1) {
      throw new Error(`Must have exactly 1 Mr. X, found ${mrXCount}`);
    }
    
    const detectiveCount = players.filter(p => p.role === 'Detective' || p.role === 'Bobby').length;
    if (detectiveCount < 1 || detectiveCount > 5) {
      throw new Error(`Must have 1-5 detectives/bobbies, found ${detectiveCount}`);
    }
    
    // Auto-add Bobbies if needed and enabled
    let finalPlayers = [...players];
    if (settings.bobbiesMode === 'auto' && detectiveCount < 4) {
      const bobbiesNeeded = 4 - detectiveCount;
      for (let i = 0; i < bobbiesNeeded; i++) {
        finalPlayers.push({
          role: 'Bobby',
          name: `Bobby ${i + 1}`,
          controller: 'ai',
          aiDifficulty: 'Medium',
        });
      }
    }
    
    // Standard starting positions from the board game
    const mrXStartPositions = [35, 45, 51, 71, 78, 104, 106, 127, 132, 166, 170, 172];
    const detectiveStartPositions = [13, 26, 29, 34, 50, 53, 91, 94, 103, 112, 117, 123, 138, 141, 155, 174];
    
    // Assign positions (for now, use fixed positions; could randomize later)
    const playerStates: PlayerState[] = finalPlayers.map((config, index) => {
      let position: number;
      if (config.role === 'MrX') {
        position = mrXStartPositions[0]; // Use first Mr. X position
      } else {
        // Assign detective positions in order
        position = detectiveStartPositions[index - 1]; // -1 because Mr. X is first
      }
      
      // Initialize tickets with handicaps
      const baseTickets = this.getDefaultTickets(config.role);
      const tickets = { ...baseTickets };
      
      if (config.role === 'MrX') {
        // Apply Mr. X penalty
        const penalty = settings.mrXTicketPenalty;
        tickets.taxi = Math.max(0, tickets.taxi - penalty);
        tickets.bus = Math.max(0, tickets.bus - penalty);
        tickets.underground = Math.max(0, tickets.underground - penalty);
      } else {
        // Apply detective bonus
        const bonus = settings.extraDetectiveTickets;
        tickets.taxi += bonus;
        tickets.bus += bonus;
        tickets.underground += bonus;
      }
      
      return {
        role: config.role,
        name: config.name,
        position: config.role === 'MrX' ? position : position, // Mr. X starts hidden
        tickets,
        isRevealed: config.role !== 'MrX', // Detectives always revealed, Mr. X starts hidden
      };
    });
    
    // Calculate reveal schedule
    const revealSchedule = this.calculateRevealSchedule(settings.revealFrequency);
    
    return {
      round: 1,
      currentTurn: 'MrX', // Mr. X always goes first
      players: playerStates,
      settings,
      revealSchedule,
      moveHistory: [],
      isGameOver: false,
    };
  }
  
  // ==========================================================================
  // MOVE GENERATION (mirrors Java getAvailableMoves)
  // ==========================================================================
  
  /**
   * Get all legal moves for a given role in the current state.
   * 
   * Move generation rules:
   * - Standard moves: traverse graph edges matching available ticket types
   * - Black tickets: can use any transport edge (Mr. X only)
   * - Double-moves: two consecutive hops using doubleMove ticket (Mr. X only)
   * 
   * @param state Current game state
   * @param role Role to generate moves for
   * @returns Array of legal moves
   */
  getLegalMoves(state: GameState, role: Role): Move[] {
    const player = state.players.find(p => p.role === role);
    if (!player) {
      throw new Error(`Player with role ${role} not found`);
    }
    
    const position = typeof player.position === 'number' ? player.position : -1;
    if (position === -1) {
      throw new Error(`Player ${role} has invalid position`);
    }
    
    const moves: Move[] = [];
    
    // Get occupied positions (detectives can't move to occupied spots)
    const occupiedPositions = new Set<number>();
    if (role !== 'MrX') {
      for (const p of state.players) {
        if (typeof p.position === 'number') {
          occupiedPositions.add(p.position);
        }
      }
    }
    
    // Generate single moves for each ticket type
    const ticketTypes: TicketType[] = ['taxi', 'bus', 'underground', 'black'];
    for (const ticketType of ticketTypes) {
      if (player.tickets[ticketType] > 0) {
        const neighbors = this.graph.getNeighbors(position, ticketType);
        for (const neighbor of neighbors) {
          // Detectives can't move to occupied positions
          if (role !== 'MrX' && occupiedPositions.has(neighbor)) {
            continue;
          }
          
          moves.push({
            type: 'single',
            role,
            from: position,
            to: neighbor,
            ticket: ticketType,
          });
        }
      }
    }
    
    // Generate double moves (Mr. X only)
    if (role === 'MrX' && player.tickets.doubleMove > 0 && state.round <= 22) {
      // For each possible first move
      for (const ticketType1 of ticketTypes) {
        if (player.tickets[ticketType1] === 0) continue;
        
        const firstMoveNeighbors = this.graph.getNeighbors(position, ticketType1);
        for (const via of firstMoveNeighbors) {
          // For each possible second move from intermediate position
          for (const ticketType2 of ticketTypes) {
            // Check if we have enough tickets (need 2 of same type if using same ticket)
            if (ticketType1 === ticketType2 && player.tickets[ticketType2] < 2) {
              continue;
            }
            if (ticketType1 !== ticketType2 && player.tickets[ticketType2] === 0) {
              continue;
            }
            
            const secondMoveNeighbors = this.graph.getNeighbors(via, ticketType2);
            for (const to of secondMoveNeighbors) {
              moves.push({
                type: 'double',
                role,
                from: position,
                ticket1: ticketType1,
                via,
                ticket2: ticketType2,
                to,
              });
            }
          }
        }
      }
    }
    
    return moves;
  }
  
  // ==========================================================================
  // STATE TRANSITION (mirrors Java chooseMove)
  // ==========================================================================
  
  /**
   * Apply a move to the game state, producing a new state and events.
   * 
   * Handles:
   * - Position updates
   * - Ticket consumption
   * - Mr. X visibility (surfacing vs hiding based on reveal schedule and tickets)
   * - Capture detection
   * - Round advancement
   * - Turn order progression
   * - Win condition checking
   * 
   * @param state Current game state
   * @param move Move to apply
   * @returns TurnResult with new state and events
   */
  applyMove(state: GameState, move: Move): TurnResult {
    const events: TurnEvent[] = [];
    
    // Create new state (immutable update)
    let newState = { ...state };
    
    // Find and update the moving player
    const playerIndex = newState.players.findIndex(p => p.role === move.role);
    if (playerIndex === -1) {
      throw new Error(`Player with role ${move.role} not found`);
    }
    
    // Clone players array for immutable update
    const players = [...newState.players];
    const player = { ...players[playerIndex] };
    
    // Update position and consume tickets
    if (move.type === 'single') {
      player.position = move.to;
      player.tickets = { ...player.tickets };
      player.tickets[move.ticket] -= 1;
      
      events.push({ type: 'move', role: move.role, move });
    } else {
      // Double move
      player.position = move.to;
      player.tickets = { ...player.tickets };
      player.tickets.doubleMove -= 1;
      player.tickets[move.ticket1] -= 1;
      player.tickets[move.ticket2] -= 1;
      
      events.push({ type: 'move', role: move.role, move });
    }
    
    // Handle Mr. X visibility
    if (move.role === 'MrX') {
      const shouldReveal = newState.revealSchedule.includes(newState.round);
      
      if (shouldReveal) {
        player.isRevealed = true;
        player.position = move.to; // Ensure position is revealed
        events.push({ type: 'reveal', role: 'MrX', position: move.to });
      } else {
        // Mr. X stays hidden (position set to 'unknown' for detectives' view)
        player.isRevealed = false;
        // Keep actual position internally for game logic
      }
    }
    
    players[playerIndex] = player;
    newState.players = players;
    
    // Check for capture (any detective on same position as Mr. X)
    const mrX = players.find(p => p.role === 'MrX')!;
    const mrXPosition = typeof mrX.position === 'number' ? mrX.position : -1;
    
    for (const p of players) {
      if ((p.role === 'Detective' || p.role === 'Bobby') && p.position === mrXPosition) {
        events.push({ type: 'capture', detective: p.role, position: mrXPosition });
        newState.isGameOver = true;
        newState.winner = 'Detectives';
        return { newState, events };
      }
    }
    
    // Advance turn order
    const roleOrder: Role[] = ['MrX', 'Detective', 'Bobby'];
    const currentRoleIndex = roleOrder.indexOf(newState.currentTurn);
    
    // Find next player who hasn't moved this round
    let nextRole: Role | null = null;
    for (let i = currentRoleIndex + 1; i < players.length; i++) {
      const candidatePlayer = players[i];
      // Check if this player hasn't moved yet this round
      const hasMovedThisRound = newState.moveHistory.some(
        m => m.role === candidatePlayer.role &&
        newState.moveHistory.indexOf(m) >= (newState.round - 1) * players.length
      );
      if (!hasMovedThisRound) {
        nextRole = candidatePlayer.role;
        break;
      }
    }
    
    if (nextRole === null) {
      // All players have moved, advance to next round
      newState.round += 1;
      newState.currentTurn = 'MrX'; // Mr. X always starts the round
      events.push({ type: 'roundAdvance', newRound: newState.round });
      
      // Check if Mr. X survived all 24 rounds
      if (newState.round > 24) {
        newState.isGameOver = true;
        newState.winner = 'MrX';
        events.push({ type: 'gameOver', winner: 'MrX' });
        return { newState, events };
      }
    } else {
      newState.currentTurn = nextRole;
    }
    
    // Add move to history
    newState.moveHistory = [...newState.moveHistory, move];
    
    // Check if Mr. X has no legal moves (stalemate = detectives win)
    if (newState.currentTurn === 'MrX' && !newState.isGameOver) {
      const mrXMoves = this.getLegalMoves(newState, 'MrX');
      if (mrXMoves.length === 0) {
        newState.isGameOver = true;
        newState.winner = 'Detectives';
        events.push({ type: 'gameOver', winner: 'Detectives' });
      }
    }
    
    return { newState, events };
  }
  
  // ==========================================================================
  // GAME STATUS
  // ==========================================================================
  
  /**
   * Check if the game is over
   */
  isGameOver(state: GameState): boolean {
    return state.isGameOver;
  }
  
  /**
   * Get the current player whose turn it is
   */
  getCurrentPlayer(state: GameState): PlayerState {
    const player = state.players.find(p => p.role === state.currentTurn);
    if (!player) {
      throw new Error(`No player found for role ${state.currentTurn}`);
    }
    return player;
  }
  
  /**
   * Get Mr. X's player state
   */
  getMrX(state: GameState): PlayerState {
    const mrX = state.players.find(p => p.role === 'MrX');
    if (!mrX) {
      throw new Error('Mr. X not found in game state');
    }
    return mrX;
  }
  
  /**
   * Get all detectives (including Bobbies)
   */
  getDetectives(state: GameState): PlayerState[] {
    return state.players.filter(p => p.role === 'Detective' || p.role === 'Bobby');
  }
  
  // ==========================================================================
  // AI INTEGRATION
  // ==========================================================================
  
  /**
   * Run an AI turn for a role at a specific difficulty.
   * 
   * Delegates to AI strategy implementation, then applies the chosen move.
   * 
   * @param state Current game state
   * @param role Role for AI to control
   * @param difficulty AI difficulty level
   * @returns TurnResult after AI move
   */
  async runAiTurn(
    state: GameState,
    role: Role,
    difficulty: Difficulty
  ): Promise<TurnResult> {
    // Lazy load AI to avoid potential circular dependencies
    const { getAiStrategy } = await import('../ai/index.js');
    
    const strategy = getAiStrategy(difficulty);
    const move = strategy.chooseMove({
      state,
      role,
      graph: this.graph,
      difficulty,
    });
    
    return this.applyMove(state, move);
  }
  
  // ==========================================================================
  // HELPER METHODS (PRIVATE)
  // ==========================================================================
  
  /**
   * Calculate reveal schedule based on frequency setting.
   * 
   * Examples:
   * - freq=5 (bold): [3, 8, 13, 18, 24]
   * - freq=3 (easier): [3, 6, 9, 12, 15, 18, 21, 24]
   * - freq=1 (trivial): [1, 2, 3, ..., 24] (every turn)
   * 
   * @param frequency Reveal every N turns
   * @returns Array of round numbers where Mr. X must surface
   */
  private calculateRevealSchedule(frequency: number): number[] {
    const schedule: number[] = [];
    for (let round = frequency; round <= 24; round += frequency) {
      schedule.push(round);
    }
    // Always include final round 24
    if (!schedule.includes(24)) {
      schedule.push(24);
    }
    return schedule;
  }
  
  /**
   * Get default ticket counts for a role (before handicaps)
   */
  private getDefaultTickets(role: Role): Record<TicketType, number> {
    if (role === 'MrX') {
      return {
        taxi: 4,
        bus: 3,
        underground: 3,
        black: 5,
        doubleMove: 2,
      };
    } else {
      // Detectives and Bobbies
      return {
        taxi: 10,
        bus: 8,
        underground: 4,
        black: 0,
        doubleMove: 0,
      };
    }
  }
}
