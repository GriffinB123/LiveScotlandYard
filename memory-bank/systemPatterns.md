# System Patterns & Type Mappings

This document maps the canonical engine (`ZikZhao/Scotland-Yard-2024`) architecture to our TypeScript implementation.

## Source Engine Overview

**Repository**: `ZikZhao/Scotland-Yard-2024`  
**Language**: Java  
**Architecture**: Factory + Visitor + Observer patterns with immutable state

### Key Design Patterns

1. **Factory Pattern**: Encapsulates complex `GameState` and `Model` creation
2. **Visitor Pattern**: `Move.FunctionalVisitor` separates operations from `Move` hierarchy
3. **Observer Pattern**: Event system for UI reactivity without tight coupling
4. **Immutability**: Guava ImmutableCollections prevent side effects

### AI Architecture

- **Algorithm**: Minimax with Alpha-Beta Pruning (depth 3)
- **Heuristic**: `-Σ(1/distance²)` to detectives + center penalty
- **Optimization**: `SimplifiedGameState` for reduced memory during recursion
- **Performance**: Pre-computed BFS graphs for O(1) distance lookups

---

## Architectural Patterns

### Pattern 1: Immutable State Architecture

**Description**: All game state is immutable; state transitions create new objects rather than mutating existing ones.

**Java Implementation** (ZikZhao):
- Uses Guava `ImmutableSet`, `ImmutableMap`, `ImmutableList`
- State transitions return new `GameState` instances

**TypeScript Translation**:
```typescript
// Use readonly modifiers
interface GameState {
  readonly round: number;
  readonly players: readonly PlayerState[];
  // ...
}

// Or use Immer for complex updates
import produce from 'immer';
const newState = produce(state, draft => {
  draft.round += 1;
});
```

### Pattern 2: Visitor → Discriminated Union

**Description**: Java Visitor pattern for polymorphic Move types becomes discriminated unions in TypeScript.

**Java** (Visitor):
```java
interface Move {
  <T> T visit(FunctionalVisitor<T> visitor);
}
```

**TypeScript** (Discriminated Union):
```typescript
type Move =
  | { type: 'single'; from: number; to: number; ticket: TicketType }
  | { type: 'double'; from: number; to: number; ticket1: TicketType; via: number; ticket2: TicketType };
```

### Pattern 3: Factory Functions

**Description**: Encapsulate complex object creation logic.

**Usage**:
```typescript
function createInitialState(
  graph: BoardGraph,
  settings: GameSettings,
  players: PlayerConfig[]
): GameState {
  // Initialize positions, apply handicaps, calculate reveal schedule
}
```

---

## Design Patterns

### Pattern 1: Strategy Pattern (AI)

**Description**: Different AI difficulty levels use different strategies but share the same interface.

**Implementation**:
```typescript
interface AiStrategy {
  chooseMove(context: AiContext): Move;
}

class EasyAi implements AiStrategy { ... }
class MinimaxAi implements AiStrategy { ... }
```

### Pattern 2: Pre-computed Optimization

**Description**: Compute expensive operations once at initialization (BFS distances for AI).

**Implementation**:
```typescript
class BoardGraph {
  private distanceCache: Map<string, number>;
  
  constructor(nodes: Node[]) {
    this.distanceCache = this.precomputeDistances();
  }
  
  getDistance(from: number, to: number): number {
    return this.distanceCache.get(`${from}-${to}`) ?? Infinity;
  }
}
```

### Pattern 3: Event System (React Context or EventEmitter)

**Description**: Decouple game engine from UI using events or context.

**React Option**:
```typescript
const GameStateContext = createContext<GameState | null>(null);
```

**EventEmitter Option**:
```typescript
type GameEvent = 
  | { type: 'moveMade'; move: Move }
  | { type: 'gameOver'; winner: 'MrX' | 'Detectives' };
```

---

## Common Idioms

### Idiom 1: Type-Safe Move Handling

**Description**: Use discriminated unions with type guards.

```typescript
function handleMove(move: Move) {
  if (move.type === 'single') {
    // TypeScript knows this is SingleMove
    console.log(move.to);
  } else {
    // TypeScript knows this is DoubleMove
    console.log(move.via, move.to);
  }
}
```

### Idiom 2: Readonly Arrays

**Description**: Prevent accidental mutations.

```typescript
const moves: readonly Move[] = getLegalMoves(state, role);
// moves.push(...) // Error: push doesn't exist on readonly array
```

### Idiom 3: Distance Lookup

**Description**: O(1) distance queries using pre-computed cache.

```typescript
const distance = graph.getDistance(mrXPosition, detectivePosition);
```

---

## Type Mappings: Java → TypeScript

### Core Game Types

| Java (ZikZhao) | TypeScript | Notes |
|----------------|------------|-------|
| `GameState` | `GameState` | Immutable → readonly fields |
| `Move` (abstract) | `Move` union | Visitor → discriminated union |
| `SingleMove` | `Move & { type: 'single' }` | |
| `DoubleMove` | `Move & { type: 'double' }` | |
| `Player` | `PlayerState` | |
| `Piece` | `Role` | MrX, Detective, Bobby |
| `ScotlandYard.Ticket` | `TicketType` | taxi/bus/underground/black/doubleMove |
| `Board` | `BoardGraph` | |
| `Model` | `GameEngine` | Main facade |

### GameEngine API

```typescript
class GameEngine {
  createInitialState(settings: GameSettings, players: PlayerConfig[]): GameState;
  getLegalMoves(state: GameState, role: Role): Move[];
  applyMove(state: GameState, move: Move): TurnResult;
  isGameOver(state: GameState): boolean;
  runAiTurn(state: GameState, role: Role, difficulty: Difficulty): TurnResult;
}
```

### AI Heuristic Function

**From ZikZhao's Java implementation**:

```typescript
function evaluatePosition(state: GameState, graph: BoardGraph): number {
  const mrX = state.players.find(p => p.role === 'MrX')!;
  const detectives = state.players.filter(p => p.role !== 'MrX');
  
  let score = 0;
  
  // Safety: negative sum of squared reciprocal distances to detectives
  for (const detective of detectives) {
    const distance = graph.getDistance(mrX.position, detective.position);
    score -= 1 / (distance * distance);
  }
  
  // Center penalty: prefer staying near map center
  const centerNode = 100; // Approximate center of 199-node graph
  const distanceFromCenter = graph.getDistance(mrX.position, centerNode);
  score -= distanceFromCenter * 0.1;
  
  return score;
}
```

---

## Implementation Priority

1. **Types** (`src/game/types.ts`) - Core interfaces
2. **Graph** (`src/game/graph.ts`) - Board representation + BFS pre-computation
3. **Engine** (`src/game/GameEngine.ts`) - Rules logic
4. **AI** (`src/ai/`) - Easy first, then Minimax
5. **Runner** (`src/runner/`) - Simulation harness

---

## Key Insights

1. **Visitor → Discriminated Unions**: More idiomatic in TypeScript
2. **Pre-computed distances**: Critical for AI performance (O(1) lookups)
3. **Immutability**: Use readonly or Immer; essential for predictable state
4. **Heuristic exactness**: Port ZikZhao's formula precisely for consistency
5. **SimplifiedGameState**: Skip in TS (lightweight objects), but consider for Swift