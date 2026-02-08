# Product Context

## Overview

**Live Scotland Yard** is a digital couch-co-op adaptation of Ravensburger's Scotland Yard board game, designed for in-person play using Apple TV as the shared board and iPhones/iPads as private controllers.

**Phase 1 (Current Focus)**: Build a **browser-based web prototype with multi-window simulation** to validate game mechanics, AI, timing modes, and handicaps. This prototype runs on a single machine with multiple browser windows: one acts as the TV board, and additional windows act as iOS controllers (Mr. X / detectives) with minimal browser-to-browser sync.

The web prototype prioritizes **rules completeness** first, then visual polish. All Scotland Yard mechanics, AI tiers, timing/commit modes, and handicaps must be working and testable, even with basic visuals.

## Near-Term Goal

Create a solid **rules-complete TypeScript game engine + AI** (no UI initially), followed by a multi-window web GUI. The engine should be structured to easily port to Swift later.

## Game Logic Source

**Canonical Engine**: `ZikZhao/Scotland-Yard-2024` ✅  
**Repository**: https://github.com/ZikZhao/Scotland-Yard-2024  
**Commit**: main branch (November 2024)  
**License**: MIT  
**Language**: Java  
**Score**: 82/100 (University of Bristol coursework)

### Why This Engine

**AI Quality** (Primary Selection Criterion):
- **Minimax with Alpha-Beta Pruning** (depth 3)
- **Custom heuristic scoring**: `-Σ(1/distance²)` to detectives + center penalty
- **Performance optimized**: Pre-computed BFS graphs for O(1) distance lookups
- **Tunable difficulty**: Via search depth adjustment
- Uses `SimplifiedGameState` during recursion to reduce memory overhead

**Rules Completeness**:
- All ticket types (taxi, bus, underground, black, double-move)
- Surfacing schedule implementation
- Win conditions (capture vs survival)
- Proper visibility/hidden position mechanics

**Code Structure**:
- Clean Java architecture with Factory, Visitor, Observer patterns
- Immutable state (Guava ImmutableCollections) → maps to readonly TS interfaces
- Visitor pattern for Move types → discriminated unions in TS
- Clear separation: `cw-model` (game logic) and `cw-ai` (AI agents)

**Portability to TypeScript**:
- Modern OOP with strong typing → clean TS class/interface mapping
- Functional programming concepts → TS functional style
- Pattern-based design → idiomatic TS patterns

## Core Features (Phase 1 Web Prototype)

### Rules & Game Loop
- Full Scotland Yard mechanics on the 199-node London map
- 24 rounds with Mr. X surfacing on configurable turns (reveal frequency slider)
- All ticket types: **taxi, bus, underground, black tickets, double-move tickets**
- Turn order: Mr. X first, then detectives (any order)
- Win conditions: capture (detectives win) or survival through 24 rounds (Mr. X wins)

### AI System
- Three difficulty tiers: **Easy / Medium / Hard**
  - Easy: random or greedy legal moves
  - Medium: basic prediction using ticket clues, block/evade heuristics
  - Hard: minimax-lite depth 3–4 with pruning, <500ms target
- AI logic adapted from chosen upstream engine
- Runs entirely on-device, no network

### Timing & Commit Modes
- **Individual Timed**: per-player countdown
- **Commit Mode**: players commit moves, timer starts for last uncommitted
- **Unlimited**: no time pressure
- AI Fallback on Timeout: Force AI vs Wait Forever

### Handicap System
- **Reveal Frequency**: slider 1–24 (how often Mr. X surfaces), default 5
- **Extra Detective Tickets**: 0 / +2 / +4 per detective
- **Mr. X Ticket Penalty**: 0 / –2 / –4 total tickets
- **Bobbies**: AI detective helpers auto-fill when <4 detectives (Auto/Off)

### Multi-Window Architecture
- **TV window**: shared board, HUD (round counter, next reveal, timer), focus zoom, possible-location halo around hidden Mr. X
- **Controller windows**: role-specific private views (Mr. X vs detectives), move selection UI, commit button
- **Simple browser-based sync** between TV and controllers using BroadcastChannel or similar (single machine, no backend)

### Player Profiles & Stats (Web Approximation)
- Use localStorage (web analogue of Keychain)
- Prompt for player names on first use, auto-fill next time
- Track per-name stats: games played/won by role, average survival rounds (Mr. X), capture efficiency
- Post-game leaderboard on TV window

## Phase 1 Engine MVP

Goal for first AI-agent implementation pass:
- Implement a **working `GameEngine` MVP in TypeScript** that supports:
  - Core Scotland Yard loop (roles, movement on 199-node graph, all ticket types including black + double-move)
  - Round progression and win conditions (capture vs survival)
  - At least one AI difficulty level (Easy) for Mr. X or detectives
  - A minimal, UI-free runner (TS script) to simulate games and log moves
- Visual UI, multi-window sync, timing modes, and full handicap/AI tiers come **after** the engine works

## Engine API Design

Core logic is exposed as a **`GameEngine` object** (or class) with methods like:
- `createInitialState(settings, players): GameState`
- `getLegalMoves(state, role): Move[]`
- `applyMove(state, move): TurnResult`
- `runAiTurn(state, role, difficulty): TurnResult`
- `isGameOver(state): boolean`

Internally uses immutable-ish data structures where practical to ease testing and Swift porting.

## Engine Runner

The Engine MVP includes a **TypeScript engine runner** (`web-prototype/src/engineRunner.ts`) that can run games without UI:

- **Mode 1 – Scripted "human" role + AI**: one role controlled by a simple scripted policy (e.g., random legal move) standing in for a human until GUI exists. No interactive prompts.
- **Mode 2 – AI Self-Play**: AI controls all roles (Mr. X and all detectives/Bobbies), playing full games end-to-end to gather statistics (win rates, average game length, etc.)

This is a TS module (not a CLI) that imports `GameEngine`, runs games, and logs results to console.

## Technical Stack

### Phase 1 – Web Prototype
- **Frontend**: React 19 + TypeScript + Vite 7
- **Game logic**: Pure TS modules (`game/`, `ai/`, `graph/`) structured for later Swift port
- **Cross-window sync**: BroadcastChannel (browser-native, single machine)
- **Assets**: Preprocessed board images and node graph JSON from Python/OpenCV scripts
- **State management**: React Context or minimal state library (TBD)
- **Testing**: Vitest or simple TS runner for engine validation

### Phase 2 – Swift Port (Future)
- **Platforms**: iOS/iPadOS + tvOS
- **Framework**: SwiftUI, MultipeerConnectivity
- **Game engine**: Swift structs/classes mirroring TS `GameEngine` API
- **Distribution**: TestFlight → App Store

## Board Assets & Data Pipeline

### Preprocessing (Python/OpenCV)
- `scripts/combine_board_images.py`: Align and blend multiple board photos into a single high-quality reference image
- `scripts/render_node_overlay.py`: Project canonical node coordinates onto board images, emit scaled JSON

### Runtime Assets
- Board images: `assets/board/*.png` or `.webp` (preprocessed, static)
- Node graph: `assets/board/nodes_board_highres.json` (199 nodes with positions and edges)
- Graph structure:
  ```json
  {
    "id": 1,
    "position": { "x": 318.0, "y": 78.0 },
    "edges": [
      { "to": 9, "type": "taxi" },
      { "to": 46, "type": "bus" },
      { "to": 46, "type": "underground" }
    ]
  }
  ```

No runtime image processing; all graph data is precomputed and loaded as JSON.

## Phase 1 Priorities

1. **Engine-first**: Implement rules-complete TypeScript `GameEngine` + AI before multi-window UI
2. **Full ticket mechanics**: Include black + double-move in MVP, not as add-on
3. **AI-only runner**: No interactive human play until full GUI exists; use scripted policies as stand-ins
4. **Portability**: Keep game/AI logic independent of React/browser APIs for clean Swift port later