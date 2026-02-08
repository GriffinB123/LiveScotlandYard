# Live Scotland Yard - Complete Context Reference

*This document consolidates all critical context for Ralph Loop iterations.*

## Project Overview

**Live Scotland Yard** is a digital couch-co-op adaptation of Ravensburger's Scotland Yard board game for Apple TV (shared board) + iPhones/iPads (private controllers).

**Current Phase**: Phase 1 Complete ✅ → Phase 2 In Progress 🎯

### Two-Phase Strategy

1. **Phase 1 (DONE)**: TypeScript GameEngine MVP with AI and runner (web prototype)
2. **Phase 2 (NOW)**: Multi-window web prototype for validation
3. **Phase 3 (FUTURE)**: UX polish (timing, handicaps, stats)
4. **Phase 4 (FUTURE)**: Swift port to iOS/tvOS with MultipeerConnectivity

## Canonical Game Engine

**Source**: `ZikZhao/Scotland-Yard-2024` (MIT License, Java)
**Repository**: https://github.com/ZikZhao/Scotland-Yard-2024
**Why**: Best AI (minimax + alpha-beta pruning), complete rules, excellent architecture

### AI Implementation Details
- **Algorithm**: Minimax with alpha-beta pruning (depth 3)
- **Heuristic**: `-Σ(1/distance²)` to detectives + center penalty
- **Performance**: Pre-computed BFS graphs for O(1) distance lookups
- **Difficulty**: Tunable via search depth

### Design Patterns (Java → TypeScript)
- **Visitor Pattern** → Discriminated Unions
- **Factory Pattern** → Factory functions
- **Observer Pattern** → React Context / EventEmitter
- **Immutability** → readonly fields

## Game Rules Summary

### Core Mechanics
- **Map**: 199-node London graph with transport edges (taxi, bus, underground)
- **Players**: 1 Mr. X + 1-5 Detectives (auto-fill Bobbies if <4)
- **Rounds**: 24 total
- **Turn Order**: Mr. X first, then detectives (any order)
- **Win Conditions**:
  - Detectives win: Capture Mr. X (same node)
  - Mr. X wins: Survive all 24 rounds

### Ticket Types
1. **Taxi** - Basic movement on taxi edges
2. **Bus** - Movement on bus edges
3. **Underground** - Movement on underground edges
4. **Black** - Can use any transport type, maintains secrecy
5. **Double-Move** - Two moves in one turn (consumes 2 tickets + 1 double-move)

### Visibility Rules
- Mr. X is hidden most turns
- **Reveal Schedule**: Mr. X surfaces on configurable turns (default: 3, 8, 13, 18, 24)
- Black tickets can maintain secrecy even on reveal turns
- Detectives always visible

### Handicap System
- **Reveal Frequency**: Slider 1-24 (how often Mr. X reveals)
- **Extra Detective Tickets**: 0 / +2 / +4 per detective
- **Mr. X Ticket Penalty**: 0 / -2 / -4 total tickets
- **Bobbies Mode**: Auto-fill AI detectives or off

## Current Technical Stack

### Web Prototype (Phase 1 & 2)
- **Frontend**: React 19 + TypeScript + Vite 7
- **Game Engine**: Pure TypeScript modules (no React dependencies)
  - `web-prototype/src/game/` - Core engine
  - `web-prototype/src/ai/` - AI strategies
  - `web-prototype/src/runner/` - Simulation harness
- **Sync**: BroadcastChannel (browser-native, single machine)
- **Testing**: `npm run engine:test` (runs AI self-play simulations)

### File Structure
```
web-prototype/
├── src/
│   ├── game/
│   │   ├── types.ts          # Core type definitions
│   │   ├── graph.ts          # BoardGraph class
│   │   ├── GameEngine.ts     # Main engine implementation
│   │   └── index.ts
│   ├── ai/
│   │   ├── types.ts          # AI interfaces
│   │   ├── easy.ts           # Easy AI implementation
│   │   └── index.ts
│   ├── runner/
│   │   ├── types.ts          # Simulation types
│   │   ├── policies.ts       # Scripted human policies
│   │   ├── engineRunner.ts   # Game simulation
│   │   └── index.ts
│   ├── engineTest.ts         # Test harness entry point
│   ├── App.tsx              # React app (needs Phase 2 updates)
│   └── main.tsx
├── public/
│   ├── board.png            # Game board image
│   └── nodes.json           # 199-node graph data
└── package.json
```

## Phase 1 Implementation (COMPLETE ✅)

### GameEngine API

```typescript
class GameEngine {
  constructor(graph: BoardGraph)

  createInitialState(settings: GameSettings, players: PlayerConfig[]): GameState
  getLegalMoves(state: GameState, role: Role): Move[]
  applyMove(state: GameState, move: Move): TurnResult
  isGameOver(state: GameState): boolean
  runAiTurn(state: GameState, role: Role, difficulty: Difficulty): Promise<TurnResult>
  getMrX(state: GameState): PlayerState
  getDetectives(state: GameState): PlayerState[]
}
```

### Core Types

```typescript
type Role = 'MrX' | 'Detective' | 'Bobby';
type TicketType = 'taxi' | 'bus' | 'underground' | 'black' | 'doubleMove';

interface GameState {
  readonly round: number;
  readonly currentTurn: Role;
  readonly players: readonly PlayerState[];
  readonly settings: GameSettings;
  readonly revealSchedule: readonly number[];
  readonly moveHistory: readonly Move[];
  readonly isGameOver: boolean;
  readonly winner?: 'MrX' | 'Detectives';
}

type Move =
  | { type: 'single'; role: Role; from: number; to: number; ticket: TicketType }
  | { type: 'double'; role: Role; from: number; via: number; to: number; ticket1: TicketType; ticket2: TicketType };
```

### Testing Phase 1

```bash
cd web-prototype
npm install
npm run engine:test
```

Expected output: 100-game self-play series with win rates, avg rounds, etc.

## Phase 2 Requirements (IN PROGRESS 🎯)

### Multi-Window Architecture

**Three Window Types:**
1. **Launcher** - Entry point, opens TV and controllers
2. **TV** - Shared board, authoritative game state
3. **Controller** - Private player view (Mr. X or Detective)

### Sync Protocol (BroadcastChannel)

```typescript
type SyncMessage =
  | { type: 'stateUpdate'; state: GameState }
  | { type: 'playerAction'; role: Role; move: Move }
  | { type: 'join'; windowType: 'tv' | 'controller' }
  | { type: 'roleAssigned'; role: Role };
```

**Flow:**
1. TV window is authoritative (runs GameEngine)
2. Controllers send `playerAction` messages
3. TV applies moves and broadcasts `stateUpdate`
4. Controllers display state relevant to their role

### TV Screen Requirements

Must display:
- Board image with tokens at current positions
- Active player indicator (pulsing token)
- Round counter
- Next reveal turn
- Possible-location halo for hidden Mr. X (all nodes he could be)
- Basic zoom/pan controls

### Controller Screen Requirements

**Mr. X View:**
- Current position (always known to Mr. X)
- Available moves from `getLegalMoves(state, 'MrX')`
- Ticket counts
- Move selection UI
- Submit/commit button

**Detective View:**
- Current position
- Available moves from `getLegalMoves(state, role)`
- Ticket counts
- Mr. X last known position (from reveal turns)
- Move selection UI

## Code Style & Patterns

### TypeScript Style
- **2-space indentation** (not tabs)
- Use `readonly` for immutability
- Discriminated unions for polymorphism
- Explicit types, avoid `any`
- Prefer functional patterns over mutation

### React Patterns
- Functional components with hooks
- React Context for global state
- Error boundaries for graceful failures
- Loading states for async operations

### Error Handling
- HTTP: Check `res.ok`, handle network errors
- BroadcastChannel: Handle message parse errors
- GameEngine: Validate moves before applying
- UI: Show error states to user

### Performance
- Pre-compute expensive operations (BFS distances)
- Debounce frequent operations (pan/zoom)
- Memoize derived state
- Target <100ms UI response, <500ms AI decisions

## Development Commands

```bash
# Install dependencies
cd web-prototype && npm install

# Start dev server (for Phase 2 GUI work)
PATH="/usr/local/bin:$PATH" npm run dev

# Test engine (Phase 1 validation)
npm run engine:test

# Build for production
npm run build

# Lint code
npm run lint
```

**IMPORTANT**: This project requires Node.js 20.19+ or 22.12+ for Vite 7. System has v24.11.1 at `/usr/local/bin/node`, but an older version in `~/.local/node/bin`. Always prefix with correct PATH as shown above.

## Key Design Decisions

1. **Engine-first approach**: Rules-complete engine before UI
2. **Full ticket mechanics in MVP**: Black + double-move not optional
3. **AI-only runner**: No human prompts until GUI complete
4. **Portability**: Keep game logic independent of React for Swift port
5. **Browser-only Phase 2**: No backend, BroadcastChannel for sync
6. **TV as authority**: Controllers are thin clients

## Assets & Data

### Board Graph
- **File**: `public/nodes.json`
- **Format**: Array of 199 nodes with positions and edges
- **Structure**:
  ```json
  {
    "id": 1,
    "position": { "x": 318.0, "y": 78.0 },
    "edges": [
      { "to": 9, "type": "taxi" },
      { "to": 46, "type": "bus" }
    ]
  }
  ```

### Board Image
- **File**: `public/board.png`
- Generated by Python scripts in `scripts/`
- Preprocessed, no runtime image processing needed

## Common Pitfalls

1. **Node.js version**: Always use correct PATH for Vite 7
2. **Immutability**: Don't mutate state, use readonly or Immer
3. **Move validation**: Always call `getLegalMoves` before applying
4. **Sync state**: TV is source of truth, controllers are views
5. **Type safety**: Don't use `any`, leverage discriminated unions

## Next Steps After Phase 2

Once multi-window prototype works:

**Phase 3: UX Polish**
- Timing modes (individual timed, commit mode)
- AI fallback on timeout
- Handicap system integration
- Player profiles & stats (localStorage)
- Visual polish (animations, audio)

**Phase 4: Swift Port**
- Port GameEngine to Swift
- Build tvOS app (TV)
- Build iOS app (Controllers)
- MultipeerConnectivity sync
- SwiftUI views
- TestFlight → App Store

## References

- **Project Brief**: `memory-bank/projectBrief.md`
- **Progress Tracker**: `memory-bank/progress.md`
- **System Patterns**: `memory-bank/systemPatterns.md`
- **Code Guidelines**: `CLAUDE.md`
- **Canonical Engine**: https://github.com/ZikZhao/Scotland-Yard-2024
