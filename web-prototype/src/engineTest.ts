/**
 * Main entry point for engine testing
 * 
 * Run this script to validate the game engine with automated simulations.
 * 
 * Usage:
 *   npm run engine:test
 */

import { GameEngine } from './game/GameEngine';
import { loadBoardGraph } from './game/graph';
import type { GameSettings } from './game/types';
import { runSingleGame, runSelfPlaySeries, printStats } from './runner/engineRunner';
import type { GameSimulationConfig } from './runner/types';

// Import node data
import nodesData from '../public/nodes.json';

async function main() {
  console.log('Scotland Yard Engine Test Runner');
  console.log('='.repeat(60));
  
  // Load board graph
  console.log('Loading board graph...');
  const graph = loadBoardGraph(nodesData as any);
  console.log(`✓ Loaded ${graph.getAllNodeIds().length} nodes`);
  
  // Create engine
  const engine = new GameEngine(graph);
  console.log('✓ Game engine initialized');
  
  // Define test settings
  const settings: GameSettings = {
    timingMode: 'unlimited',
    turnTime: 60,
    aiFallbackOnTimeout: 'forceAi',
    revealFrequency: 5, // Standard reveal schedule
    extraDetectiveTickets: 0,
    mrXTicketPenalty: 0,
    bobbiesMode: 'auto',
  };
  
  // Test Configuration 1: AI vs AI (Easy)
  console.log('\n' + '='.repeat(60));
  console.log('TEST 1: AI vs AI (Easy Difficulty)');
  console.log('='.repeat(60));
  
  const config1: GameSimulationConfig = {
    settings,
    roleControllers: {
      MrX: { type: 'ai', difficulty: 'Easy' },
      Detective: { type: 'ai', difficulty: 'Easy' },
      Bobby: { type: 'ai', difficulty: 'Easy' },
    },
  };
  
  console.log('\nRunning single game...');
  const result1 = await runSingleGame(engine, config1);
  console.log(`✓ Game complete!`);
  console.log(`  Winner: ${result1.winner}`);
  console.log(`  Rounds: ${result1.rounds}`);
  console.log(`  Moves: ${result1.moveCount}`);
  console.log(`  End: ${result1.endReason}`);
  console.log(`  Duration: ${result1.durationMs}ms`);
  
  // Test Configuration 2: Series of games for statistics
  console.log('\n' + '='.repeat(60));
  console.log('TEST 2: Self-Play Series (100 games)');
  console.log('='.repeat(60));
  
  const stats = await runSelfPlaySeries(engine, config1, 100);
  printStats(stats);
  
  // Test Configuration 3: Scripted vs AI
  console.log('='.repeat(60));
  console.log('TEST 3: Scripted Mr. X vs AI Detectives');
  console.log('='.repeat(60));
  
  const config2: GameSimulationConfig = {
    settings,
    roleControllers: {
      MrX: { type: 'scripted', policyName: 'random' },
      Detective: { type: 'ai', difficulty: 'Easy' },
      Bobby: { type: 'ai', difficulty: 'Easy' },
    },
  };
  
  console.log('\nRunning single game...');
  const result2 = await runSingleGame(engine, config2);
  console.log(`✓ Game complete!`);
  console.log(`  Winner: ${result2.winner}`);
  console.log(`  Rounds: ${result2.rounds}`);
  console.log(`  Moves: ${result2.moveCount}`);
  console.log(`  End: ${result2.endReason}`);
  
  // Test Configuration 4: Handicap testing
  console.log('\n' + '='.repeat(60));
  console.log('TEST 4: Handicap System (Easy Mr. X, Extra Detective Tickets)');
  console.log('='.repeat(60));
  
  const handicapSettings: GameSettings = {
    ...settings,
    revealFrequency: 3, // More frequent reveals (easier for detectives)
    extraDetectiveTickets: 4, // Significant bonus
    mrXTicketPenalty: 2, // Penalty for Mr. X
  };
  
  const config3: GameSimulationConfig = {
    settings: handicapSettings,
    roleControllers: {
      MrX: { type: 'ai', difficulty: 'Easy' },
      Detective: { type: 'ai', difficulty: 'Easy' },
      Bobby: { type: 'ai', difficulty: 'Easy' },
    },
  };
  
  console.log('\nRunning 50-game series with handicaps...');
  const handicapStats = await runSelfPlaySeries(engine, config3, 50);
  printStats(handicapStats);
  
  console.log('='.repeat(60));
  console.log('ALL TESTS COMPLETE ✓');
  console.log('='.repeat(60));
  console.log('Engine is ready for UI integration!');
}

// Run main function (always execute when this module is loaded as main)
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

export { main };
