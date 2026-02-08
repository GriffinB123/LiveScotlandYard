/**
 * Game simulation engine runner
 * 
 * Provides functions to run complete games without UI, for testing and statistics.
 */

import { GameEngine } from '../game/GameEngine';
import type { PlayerConfig, TurnResult } from '../game/types';
import type {
  GameSimulationConfig,
  GameResult,
  SimulationStats,
} from './types';
import { getPolicy } from './policies';

// ============================================================================
// SINGLE GAME RUNNER
// ============================================================================

/**
 * Run a single complete game with the given configuration
 * 
 * @param engine Game engine instance
 * @param config Simulation configuration
 * @returns Game result with winner and statistics
 */
export async function runSingleGame(
  engine: GameEngine,
  config: GameSimulationConfig
): Promise<GameResult> {
  const startTime = Date.now();
  
  // Create player configurations from role controllers
  const players: PlayerConfig[] = [
    {
      role: 'MrX',
      name: 'Mr. X',
      controller: config.roleControllers.MrX.type,
      aiDifficulty: config.roleControllers.MrX.type === 'ai' 
        ? config.roleControllers.MrX.difficulty 
        : undefined,
      scriptedPolicy: config.roleControllers.MrX.type === 'scripted'
        ? config.roleControllers.MrX.policyName
        : undefined,
    },
  ];
  
  // Add detectives (we know there are some from config validation)
  for (let i = 0; i < 4; i++) {
    const controller = config.roleControllers.Detective || config.roleControllers.Bobby;
    players.push({
      role: i < 3 ? 'Detective' : 'Bobby',
      name: i < 3 ? `Detective ${i + 1}` : `Bobby`,
      controller: controller.type,
      aiDifficulty: controller.type === 'ai' ? controller.difficulty : undefined,
      scriptedPolicy: controller.type === 'scripted' ? controller.policyName : undefined,
    });
  }
  
  // Initialize game
  let state = engine.createInitialState(config.settings, players);
  let moveCount = 0;
  const maxRounds = config.maxRounds || 24;
  const maxMoves = 1000; // Safety limit to prevent infinite loops
  
  console.log(`Initial state: Round ${state.round}, Players: ${state.players.length}, Current turn: ${state.currentTurn}`);
  
  // Play until game over
  while (!engine.isGameOver(state) && state.round <= maxRounds && moveCount < maxMoves) {
    const currentRole = state.currentTurn;
    const controller = config.roleControllers[currentRole];
    
    // Debug logging every 10 moves
    if (moveCount % 10 === 0) {
      console.log(`  Move ${moveCount}, Round ${state.round}, Turn: ${currentRole}, Game over: ${engine.isGameOver(state)}`);
    }
    
    let result: TurnResult;
    
    try {
      // Check if current player has any legal moves
      const legalMoves = engine.getLegalMoves(state, currentRole);
      
      if (legalMoves.length === 0) {
        // Player has no legal moves - skip their turn
        // This can happen when detectives run out of tickets
        // We need to manually advance to next player
        const players = state.players;
        const currentIndex = players.findIndex(p => p.role === currentRole);
        let nextIndex = (currentIndex + 1) % players.length;
        let nextRole = players[nextIndex].role;
        
        // Find next player who hasn't moved this round
        let attempts = 0;
        while (attempts < players.length) {
          const hasMovedThisRound = state.moveHistory.some(
            m => m.role === nextRole &&
            state.moveHistory.indexOf(m) >= (state.round - 1) * players.length
          );
          if (!hasMovedThisRound) {
            break;
          }
          nextIndex = (nextIndex + 1) % players.length;
          nextRole = players[nextIndex].role;
          attempts++;
        }
        
        // If all players have moved, advance round
        if (attempts >= players.length) {
          state = {
            ...state,
            round: state.round + 1,
            currentTurn: 'MrX',
          };
        } else {
          state = {
            ...state,
            currentTurn: nextRole,
          };
        }
        
        continue; // Skip to next iteration
      }
      
      if (controller.type === 'ai') {
        // AI turn
        result = await engine.runAiTurn(state, currentRole, controller.difficulty);
      } else if (controller.type === 'scripted') {
        // Scripted policy turn
        const legalMoves = engine.getLegalMoves(state, currentRole);
        const policy = getPolicy(controller.policyName);
        const move = policy(legalMoves);
        result = engine.applyMove(state, move);
      } else {
        throw new Error('Human controller not supported in runner');
      }
      
      state = result.newState;
      moveCount++;
    } catch (error) {
      console.error(`Error during turn for ${currentRole}:`, error);
      throw error;
    }
  }
  
  // Determine end reason
  let endReason: GameResult['endReason'];
  if (state.round > maxRounds) {
    endReason = 'maxRounds';
  } else if (state.winner === 'Detectives') {
    // Check if it was capture or stalemate
    const mrX = engine.getMrX(state);
    const detectives = engine.getDetectives(state);
    const captured = detectives.some(d => d.position === mrX.position);
    endReason = captured ? 'capture' : 'stalemate';
  } else {
    endReason = 'survival';
  }
  
  // Calculate ticket usage
  const mrX = state.players.find(p => p.role === 'MrX')!;
  const detectives = state.players.filter(p => p.role === 'Detective' || p.role === 'Bobby');
  
  const mrXTicketUsage: Record<string, number> = {};
  const detectiveTicketUsage: Record<string, number> = {};
  
  // Sum up tickets used (initial - remaining)
  const initialMrXTickets = engine['getDefaultTickets']('MrX');
  for (const [ticket, initial] of Object.entries(initialMrXTickets)) {
    mrXTicketUsage[ticket] = initial - (mrX.tickets[ticket as keyof typeof mrX.tickets] || 0);
  }
  
  const initialDetectiveTickets = engine['getDefaultTickets']('Detective');
  for (const detective of detectives) {
    for (const [ticket, initial] of Object.entries(initialDetectiveTickets)) {
      detectiveTicketUsage[ticket] = (detectiveTicketUsage[ticket] || 0) + 
        (initial - (detective.tickets[ticket as keyof typeof detective.tickets] || 0));
    }
  }
  
  const durationMs = Date.now() - startTime;
  
  return {
    winner: state.winner!,
    rounds: state.round,
    moveCount,
    endReason,
    ticketUsage: {
      mrX: mrXTicketUsage,
      detectives: detectiveTicketUsage,
    },
    durationMs,
  };
}

// ============================================================================
// SELF-PLAY SERIES
// ============================================================================

/**
 * Run multiple games and aggregate statistics
 * 
 * @param engine Game engine instance
 * @param config Simulation configuration
 * @param numGames Number of games to run
 * @returns Aggregated statistics
 */
export async function runSelfPlaySeries(
  engine: GameEngine,
  config: GameSimulationConfig,
  numGames: number
): Promise<SimulationStats> {
  console.log(`Running ${numGames} game simulation series...`);
  
  const results: GameResult[] = [];
  
  for (let i = 0; i < numGames; i++) {
    if (i % 10 === 0 && i > 0) {
      console.log(`  Completed ${i}/${numGames} games...`);
    }
    
    const result = await runSingleGame(engine, config);
    results.push(result);
  }
  
  // Aggregate statistics
  const mrXWins = results.filter(r => r.winner === 'MrX').length;
  const detectiveWins = results.filter(r => r.winner === 'Detectives').length;
  
  const totalRounds = results.reduce((sum, r) => sum + r.rounds, 0);
  const avgRounds = totalRounds / numGames;
  
  const avgMrXSurvival = totalRounds / numGames; // All games count toward survival
  
  const endReasons = {
    capture: results.filter(r => r.endReason === 'capture').length,
    survival: results.filter(r => r.endReason === 'survival').length,
    stalemate: results.filter(r => r.endReason === 'stalemate').length,
    maxRounds: results.filter(r => r.endReason === 'maxRounds').length,
  };
  
  const totalDuration = results.reduce((sum, r) => sum + r.durationMs, 0);
  const avgDurationMs = totalDuration / numGames;
  
  return {
    totalGames: numGames,
    mrXWins,
    detectiveWins,
    mrXWinRate: mrXWins / numGames,
    avgRounds,
    avgMrXSurvival,
    endReasons,
    avgDurationMs,
  };
}

// ============================================================================
// HELPER: PRINT STATISTICS
// ============================================================================

/**
 * Print formatted statistics to console
 */
export function printStats(stats: SimulationStats): void {
  console.log('\n' + '='.repeat(60));
  console.log('SIMULATION STATISTICS');
  console.log('='.repeat(60));
  console.log(`Total Games: ${stats.totalGames}`);
  console.log(`\nWin Rates:`);
  console.log(`  Mr. X:      ${stats.mrXWins} wins (${(stats.mrXWinRate * 100).toFixed(1)}%)`);
  console.log(`  Detectives: ${stats.detectiveWins} wins (${((1 - stats.mrXWinRate) * 100).toFixed(1)}%)`);
  console.log(`\nGame Length:`);
  console.log(`  Average Rounds: ${stats.avgRounds.toFixed(1)}`);
  console.log(`  Average Mr. X Survival: ${stats.avgMrXSurvival.toFixed(1)} rounds`);
  console.log(`\nEnd Reasons:`);
  console.log(`  Capture:   ${stats.endReasons.capture} (${(stats.endReasons.capture / stats.totalGames * 100).toFixed(1)}%)`);
  console.log(`  Survival:  ${stats.endReasons.survival} (${(stats.endReasons.survival / stats.totalGames * 100).toFixed(1)}%)`);
  console.log(`  Stalemate: ${stats.endReasons.stalemate} (${(stats.endReasons.stalemate / stats.totalGames * 100).toFixed(1)}%)`);
  console.log(`  Max Rounds: ${stats.endReasons.maxRounds} (${(stats.endReasons.maxRounds / stats.totalGames * 100).toFixed(1)}%)`);
  console.log(`\nPerformance:`);
  console.log(`  Average Duration: ${stats.avgDurationMs.toFixed(0)}ms per game`);
  console.log('='.repeat(60) + '\n');
}
