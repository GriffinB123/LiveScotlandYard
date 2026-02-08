/**
 * Easy AI implementation for Scotland Yard.
 * 
 * Strategy: Simple heuristic-based decisions
 * - Mr. X: Maximize distance to nearest detective
 * - Detectives: Minimize distance to Mr. X's known/probable position
 */

import type { AiStrategy, AiContext } from './types';
import type { Move, GameState } from '../game/types';
import { GameEngine } from '../game/GameEngine';

export class EasyAi implements AiStrategy {
  chooseMove(context: AiContext): Move {
    const engine = new GameEngine(context.graph);
    const legalMoves = engine.getLegalMoves(context.state, context.role);
    
    if (legalMoves.length === 0) {
      throw new Error(`No legal moves for ${context.role}`);
    }
    
    if (legalMoves.length === 1) {
      return legalMoves[0];
    }
    
    // Evaluate each move and pick the best
    if (context.role === 'MrX') {
      return this.chooseMrXMove(legalMoves, context);
    } else {
      return this.chooseDetectiveMove(legalMoves, context);
    }
  }
  
  /**
   * Mr. X strategy: Maximize distance to nearest detective
   */
  private chooseMrXMove(moves: Move[], context: AiContext): Move {
    const detectives = context.state.players.filter(
      p => p.role === 'Detective' || p.role === 'Bobby'
    );
    
    let bestMove = moves[0];
    let bestScore = -Infinity;
    
    for (const move of moves) {
      const destination = move.to;
      
      // Find distance to nearest detective
      let minDistance = Infinity;
      for (const detective of detectives) {
        if (typeof detective.position === 'number') {
          const distance = context.graph.getDistance(destination, detective.position);
          minDistance = Math.min(minDistance, distance);
        }
      }
      
      // Higher distance is better for Mr. X
      if (minDistance > bestScore) {
        bestScore = minDistance;
        bestMove = move;
      }
    }
    
    return bestMove;
  }
  
  /**
   * Detective strategy: Minimize distance to Mr. X's last known position
   */
  private chooseDetectiveMove(moves: Move[], context: AiContext): Move {
    const mrX = context.state.players.find(p => p.role === 'MrX')!;
    
    // Use last known position if Mr. X is hidden
    let mrXPosition: number;
    if (typeof mrX.position === 'number') {
      mrXPosition = mrX.position;
    } else {
      // Mr. X is hidden; use last revealed position from history
      mrXPosition = this.getLastKnownMrXPosition(context.state);
    }
    
    let bestMove = moves[0];
    let bestDistance = Infinity;
    
    for (const move of moves) {
      const destination = move.to;
      const distance = context.graph.getDistance(destination, mrXPosition);
      
      // Lower distance is better for detectives
      if (distance < bestDistance) {
        bestDistance = distance;
        bestMove = move;
      }
    }
    
    return bestMove;
  }
  
  /**
   * Get Mr. X's last known position from move history
   */
  private getLastKnownMrXPosition(state: GameState): number {
    // Find last reveal in move history
    for (let i = state.moveHistory.length - 1; i >= 0; i--) {
      const move = state.moveHistory[i];
      if (move.role === 'MrX') {
        // Check if this was a reveal round
        const moveRound = Math.floor(i / state.players.length) + 1;
        if (state.revealSchedule.includes(moveRound)) {
          return move.to;
        }
      }
    }
    
    // Default to center of map if no reveals yet
    return 100;
  }
}
