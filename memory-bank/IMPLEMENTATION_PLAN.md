# Live Scotland Yard – Implementation Plan

This document outlines the complete implementation path from the current state to a production-ready iOS/tvOS app, following an **engine-first, rules-complete** approach.

## Current State

✅ **Assets & Tooling Ready**
- Python/OpenCV scripts for board processing (`combine_board_images.py`, `render_node_overlay.py`)
- High-quality board images in `assets/board/`
- 199-node graph JSON with positions and transport edges
- React + TypeScript + Vite web prototype skeleton
- Basic board visualization (SVG overlay)

## Implementation Philosophy

1. **Rules-complete engine first**, then UI
2. **Full ticket mechanics** (including black + double-move) in MVP
3. **Mirror existing AI logic** from chosen upstream engine
4. **Engine-UI separation** for clean Swift port
5. **Multi-window web prototype** before native apps

---

## Phase 0: Select Canonical Rules + AI Engine

**Goal**: Choose and document the open-source Scotland Yard engine to mirror.

**Priority**: Engines with **existing AI logic** (heuristics, search, difficulty tiers).

### Tasks

1. **Research candidates** (2–3 repos)
   - Search GitHub for Scotland Yard implementations (Java/Python preferred)
   - Filter by:
     - License: MIT, BSD, or Apache
     - AI presence: must include decision logic, not just rules
     - Activity: maintained or at least stable
   - Document each candidate:
     - Repo URL, language, license
     - What's included (rules only vs rules + AI)
     - Code structure quality

2. **Evaluate with AI-first criteria**
   - **Primary**: AI logic quality
     - Does it support difficulty levels?
     - What algorithms? (minimax, heuristics, Monte Carlo, etc.)
     - How clean/portable is the AI code?
   - **Secondary**: Rules completeness
     - Handles all ticket types (including black, double-move)?
     - Correct surfacing/visibility rules?
     - Win conditions implemented?
   - **Tertiary**: Code clarity
     - Well-structured types/classes?
     - Easy to map to TS/Swift?

3. **Select one engine and document**
   - Record in `memory-bank/productContext.md`:
     - Repo URL and specific commit/tag
     - License verification
     - Key types: `GameState`, `Player`, `Move`, `TicketType`, etc.
     - Key functions: move generation, move application, AI decision, etc.

4. **Sketch TS/Swift type mappings**
   - Create a small spec (in `memory-bank/systemPatterns.md` or new doc):
     - Map upstream types → TS interfaces
     - Map upstream AI structure → TS strategy pattern
   - This becomes the contract for Phase 1

**Output**: Documented choice of canonical engine with type/function mapping guide.

---

## Phase 1: TypeScript GameEngine MVP + AI + Runner

**Goal**: Implement a **working, rules-complete TS engine** that can play full games without any UI.

### Milestone Criteria
- ✅ All ticket types work (taxi, bus, underground, black, double-move)
- ✅ Round progression, surfacing schedule, win conditions correct
- ✅ At least one AI difficulty (Easy) functional
- ✅ Engine runner can simulate AI-only games and log results
- ✅ No React/UI dependencies in engine code

---

### 1.1 Engine Architecture & Types

**File**: `web-prototype/src/game/types.ts`

Define core types mirroring upstream engine:

```typescript
// Roles
export type Role = 'MrX' | 'Detective' | 'Bobby';

// Ticket types
export type TicketType = 'taxi' | 'bus' | 'underground' | 'black' | 'doubleMove';

// Position (node ID or unknown for hidden Mr. X)
export type Position = number | 'unknown';

// Player state
export interface PlayerState {
  role: Role;
  name: string;
  position: Position;
  tickets: Record<TicketType, number>;
  isRevealed: boolean; // for Mr. X visibility
}

// Game settings (from setup screen)
export interface GameSettings {
  timingMode: 'individualTimed' | 'commitMode' | 'unlimited';
  turnTime: number; // seconds
  aiFallbackOnTimeout: 'forceAi' | 'waitForever';
  revealFrequency: number; // Mr. X surfaces every N turns
  extraDetectiveTickets: 0 | 2 | 4;
  mrXTicketPenalty: 0 | 2 | 4;
  bobbiesMode: 'auto' | 'off';
}

// Main game state
export interface GameState {
  round: number; // 1-24
  currentTurn: Role;
  players: PlayerState[];
  settings: GameSettings;
  revealSchedule: number[]; // turns when Mr. X must surface
  moveHistory: Move[];
  isGameOver: boolean;
  winner?: 'MrX' | 'Detectives';
}

// Move representation
export interface Move {
  role: Role;
  from: number;
  to: number;
  ticket: TicketType;
  isPartOfDoubleMove?: boolean;
  secondMove?: Omit<Move, 'isPartOfDoubleMove' | 'secondMove'>; // for double-moves
}

// Turn result after applying a move
export interface TurnResult {
  newState: GameState;
  events: TurnEvent[];
}

export type TurnEvent =
  | { type: 'move'; role: Role; move: Move }
  | { type: 'reveal'; role: 'MrX'; position: number }
  | { type: 'capture'; detective: Role; position: number }
  | { type: 'roundAdvance'; newRound: number }
  | { type: 'gameOver'; winner: 'MrX' | 'Detectives' };
```

**File**: `web-prototype/src/game/graph.ts`

Board graph types and loader:

```typescript
export interface Node {
  id: number;
  position: { x: number; y: number };
  edges: Edge[];
}

export interface Edge {
  to: number;
  type: TicketType; // taxi, bus, underground (no black/doubleMove edges)
}

export interface BoardGraph {
  nodes: Map<number, Node>;
  getNeighbors(nodeId: number, ticketType: TicketType): number[];
}

export function loadBoardGraph(nodesJson: Node[]): BoardGraph {
  // Implementation: build Map, create neighbor lookup
}
```

---

### 1.2 GameEngine Interface

**File**: `web-prototype/src/game/GameEngine.ts`

Expose OO-style API:

```typescript
export class GameEngine {
  private graph: BoardGraph;

  constructor(graph: BoardGraph) {
    this.graph = graph;
  }

  /**
   * Create initial game state from settings and player list
   */
  createInitialState(settings: GameSettings, players: PlayerConfig[]): GameState {
    // Initialize positions (random or fixed starting nodes)
    // Apply handicaps: extra tickets, penalties
    // Calculate reveal schedule based on settings.revealFrequency
    // Auto-add Bobbies if needed
  }

  /**
   * Get all legal moves for a given role in current state
   */
  getLegalMoves(state: GameState, role: Role): Move[] {
    // Standard moves: traverse graph edges with ticket availability check
    // Black ticket moves: any edge type if black tickets available
    // Double-move: generate two-hop sequences if doubleMove tickets exist
  }

  /**
   * Apply a move and return new state + events
   */
  applyMove(state: GameState, move: Move): TurnResult {
    // Update position, consume tickets
    // Handle Mr. X visibility (surface or hide based on rules)
    // Check for captures
    // Advance turn/round
    // Check win conditions
  }

  /**
   * Check if game is over
   */
  isGameOver(state: GameState): boolean {
    return state.isGameOver;
  }

  /**
   * Get current player whose turn it is
   */
  getCurrentPlayer(state: GameState): PlayerState {
    return state.players.find(p => p.role === state.currentTurn)!;
  }

  /**
   * Run AI turn for a role and return result
   */
  runAiTurn(state: GameState, role: Role, difficulty: Difficulty): TurnResult {
    const strategy = getAiStrategy(difficulty);
    const move = strategy.chooseMove({ state, role, graph: this.graph });
    return this.applyMove(state, move);
  }
}
```

---

### 1.3 Rules Implementation

**Key behaviors to implement**:

#### Standard Moves
- Traverse graph edges matching available ticket types
- Verify ticket availability for player
- Return array of legal `Move` objects

#### Black Tickets
- When player has black tickets, can use any transport edge
- Mr. X using black ticket → remains hidden even on reveal turn (unless forced by schedule)

#### Double-Move Tickets
- If player has doubleMove tickets and ≥2 rounds remain:
  - Generate all legal first moves
  - For each first move, generate all legal second moves from destination
  - Both moves must respect ticket constraints
  - Combine into single `Move` with `secondMove` field

#### Mr. X Visibility
- **Reveal turns**: based on `revealSchedule` (e.g., rounds 3, 8, 13, 18, 24)
- **Black/double-move**: can hide position outside reveal turns
- On reveal: set `isRevealed = true`, emit `reveal` event

#### Capture Detection
- After each move, check if any detective is on same node as Mr. X
- If yes: emit `capture` event, set `isGameOver = true`, `winner = 'Detectives'`

#### Win Conditions
- **Detectives win**: capture Mr. X
- **Mr. X wins**: survive all 24 rounds without capture

---

### 1.4 AI Implementation

**File**: `web-prototype/src/ai/types.ts`

```typescript
export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface AiContext {
  state: GameState;
  role: Role;
  graph: BoardGraph;
}

export interface AiStrategy {
  chooseMove(context: AiContext): Move;
}
```

**File**: `web-prototype/src/ai/easy.ts`

Implement Easy AI (adapt from upstream):

```typescript
export class EasyAi implements AiStrategy {
  chooseMove(context: AiContext): Move {
    const legalMoves = /* get from GameEngine */;
    
    if (context.role === 'MrX') {
      // Prefer moves increasing distance from nearest detective
      return maxBy(legalMoves, move => distanceToNearestDetective(move.to));
    } else {
      // Detectives: prefer moves reducing distance to probable Mr. X location
      return minBy(legalMoves, move => distanceToMrX(move.to));
    }
  }
}
```

**File**: `web-prototype/src/ai/index.ts`

```typescript
export function getAiStrategy(difficulty: Difficulty): AiStrategy {
  switch (difficulty) {
    case 'Easy': return new EasyAi();
    case 'Medium': return new MediumAi(); // TODO
    case 'Hard': return new HardAi(); // TODO
  }
}
```

---

### 1.5 Engine Runner & Simulation

**File**: `web-prototype/src/runner/types.ts`

```typescript
export type RoleController =
  | { type: 'ai'; difficulty: Difficulty }
  | { type: 'scripted'; policyName: string };

export interface GameSimulationConfig {
  settings: GameSettings;
  roleControllers: Record<Role, RoleController>;
  maxRounds?: number;
  numGames?: number; // for self-play series
}

export interface GameResult {
  winner: 'MrX' | 'Detectives';
  rounds: number;
  moveCount: number;
  ticketUsage: Record<Role, Record<TicketType, number>>;
  finalState: GameState;
}

export interface SimulationStats {
  totalGames: number;
  mrXWins: number;
  detectiveWins: number;
  avgRounds: number;
  avgMrXSurvival: number;
}
```

**File**: `web-prototype/src/runner/policies.ts`

Simple scripted "human" stand-ins:

```typescript
export type HumanPolicy = (legalMoves: Move[]) => Move;

export const firstLegalMovePolicy: HumanPolicy = (moves) => moves[0];

export const randomLegalMovePolicy: HumanPolicy = (moves) =>
  moves[Math.floor(Math.random() * moves.length)];
```

**File**: `web-prototype/src/runner/engineRunner.ts`

```typescript
export function runSingleGame(
  engine: GameEngine,
  config: GameSimulationConfig
): GameResult {
  let state = engine.createInitialState(config.settings, /* players */);
  
  while (!engine.isGameOver(state)) {
    const currentRole = state.currentTurn;
    const controller = config.roleControllers[currentRole];
    
    let result: TurnResult;
    if (controller.type === 'ai') {
      result = engine.runAiTurn(state, currentRole, controller.difficulty);
    } else {
      const legalMoves = engine.getLegalMoves(state, currentRole);
      const policy = getPolicy(controller.policyName);
      const move = policy(legalMoves);
      result = engine.applyMove(state, move);
    }
    
    state = result.newState;
  }
  
  return {
    winner: state.winner!,
    rounds: state.round,
    // ... extract other stats
  };
}

export function runSelfPlaySeries(
  engine: GameEngine,
  config: GameSimulationConfig,
  numGames: number
): SimulationStats {
  const results = Array.from({ length: numGames }, () =>
    runSingleGame(engine, config)
  );
  
  return {
    totalGames: numGames,
    mrXWins: results.filter(r => r.winner === 'MrX').length,
    detectiveWins: results.filter(r => r.winner === 'Detectives').length,
    avgRounds: mean(results.map(r => r.rounds)),
    // ... more stats
  };
}

// Entry point for testing
export function main() {
  const graph = loadBoardGraph(/* load from JSON */);
  const engine = new GameEngine(graph);
  
  // Run one sample game
  console.log('Running sample game...');
  const result = runSingleGame(engine, {
    settings: defaultSettings,
    roleControllers: {
      MrX: { type: 'ai', difficulty: 'Easy' },
      Detective: { type: 'ai', difficulty: 'Easy' },
      // ...
    },
  });
  console.log('Result:', result);
  
  // Run self-play series
  console.log('\nRunning 100-game self-play series...');
  const stats = runSelfPlaySeries(engine, config, 100);
  console.log('Stats:', stats);
}
```

---

### 1.6 Testing

**Optional but recommended**: Add minimal test harness

**File**: `web-prototype/src/game/__tests__/GameEngine.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { GameEngine } from '../GameEngine';

describe('GameEngine', () => {
  it('creates valid initial state', () => {
    const state = engine.createInitialState(/* ... */);
    expect(state.round).toBe(1);
    expect(state.players).toHaveLength(6);
  });
  
  it('generates legal moves correctly', () => {
    const moves = engine.getLegalMoves(state, 'MrX');
    expect(moves.every(m => isLegalMove(m))).toBe(true);
  });
  
  it('detects capture', () => {
    // Set up state where detective can capture
    const result = engine.applyMove(state, captureMove);
    expect(result.newState.isGameOver).toBe(true);
    expect(result.newState.winner).toBe('Detectives');
  });
});
```

**Run**: `npm run test` (add script to package.json)

---

## Phase 2: Multi-Window Web Prototype

**Goal**: Build browser-based multi-window simulation (TV + controllers) with sync.

### 2.1 Sync Layer

**File**: `web-prototype/src/sync/BroadcastSync.ts`

```typescript
type Message =
  | { type: 'stateUpdate'; state: GameState }
  | { type: 'playerAction'; role: Role; move: Move }
  | { type: 'join'; windowType: 'tv' | 'controller' }
  | { type: 'roleAssigned'; role: Role };

export class BroadcastSync {
  private channel: BroadcastChannel;
  
  constructor(channelName: string) {
    this.channel = new BroadcastChannel(channelName);
  }
  
  send(message: Message) {
    this.channel.postMessage(message);
  }
  
  onMessage(handler: (message: Message) => void) {
    this.channel.onmessage = (event) => handler(event.data);
  }
}
```

### 2.2 Window Roles & Launch Flow

**File**: `web-prototype/src/App.tsx`

```typescript
type Screen = 'launcher' | 'tv' | 'controller';

function App() {
  const [screen, setScreen] = useState<Screen>('launcher');
  
  return (
    <>
      {screen === 'launcher' && <LauncherScreen onLaunch={setScreen} />}
      {screen === 'tv' && <TvScreen />}
      {screen === 'controller' && <ControllerScreen />}
    </>
  );
}
```

**LauncherScreen**: Buttons to open TV window and spawn controller windows

### 2.3 TV Screen

**File**: `web-prototype/src/screens/TvScreen.tsx`

- Render board image + SVG overlay with tokens
- Subscribe to sync for state updates
- Display HUD: round, next reveal, timer, commit status
- Implement zoom/pan controls
- Show possible-location halo for hidden Mr. X

### 2.4 Controller Screen

**File**: `web-prototype/src/screens/ControllerScreen.tsx`

- Role-specific UI (Mr. X vs Detective)
- Show available moves from `GameEngine.getLegalMoves`
- Send chosen move via sync to TV
- Display private info (tickets, position)

---

## Phase 3: Web UX Polish

**After multi-window MVP works**, add:

### 3.1 Timing & Commit Modes
- Implement timer countdown on TV
- Commit button + commit state tracking
- AI fallback on timeout

### 3.2 Handicap Integration
- Wire reveal frequency slider
- Apply ticket bonuses/penalties at setup

### 3.3 Profiles & Stats
- localStorage-based profiles
- Track per-name stats
- Post-game leaderboard

### 3.4 Visual Polish
- Token animations
- Dynamic focus zoom
- Audio cues
- Accessibility (color-blind mode, ARIA labels)

---

## Phase 4: Swift Port (iOS + tvOS)

**Goal**: Port TS engine to Swift, build native apps with SwiftUI.

### 4.1 Mirror Engine in Swift

**File**: `GameCore/Sources/GameCore/GameEngine.swift`

Map TS types → Swift structs:
- `GameState`, `Move`, `Role`, `TicketType`, etc.
- Implement same logic as TS engine

### 4.2 Build Apps

- **Scotland Yard TV** (tvOS): Shared board, authoritative state
- **Scotland Yard** (iOS): Controllers with private views

### 4.3 Sync with MultipeerConnectivity

Replace BroadcastChannel with MultipeerConnectivity:
- tvOS = server
- iOS = clients

### 4.4 SwiftUI Views

Port React components to SwiftUI:
- TV board view with focus zoom
- Controller views with gestures

---

## Summary: Where to Start

**Immediate next steps for an AI agent**:

1. ✅ Documentation is complete (`productContext.md`, `activeContext.md`, `progress.md`)
2. 🔄 **Phase 0**: Research and select canonical rules+AI engine (2-3 candidates, evaluate, document choice)
3. 🔄 **Phase 1.1**: Define `GameEngine` interface and types in `web-prototype/src/game/`
4. ⏳ **Phase 1.2-1.6**: Implement engine, AI, runner (this is the bulk of initial work)

**Success criteria for "agent can churn"**:
- ✅ Clear task list with concrete outputs
- ✅ Type definitions and API contracts specified
- ✅ Upstream engine to mirror (after Phase 0 complete)
- ✅ No ambiguous requirements

You can now point an AI agent at **Phase 0 tasks** in `progress.md` and let it research/document the canonical engine choice, then proceed to **Phase 1** implementation.
