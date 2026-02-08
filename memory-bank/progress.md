# Progress

## Done

- [x] Initialize project
- [x] Set up Python scripts for board image processing and node coordinate projection
- [x] Create board assets pipeline (combine_board_images.py, render_node_overlay.py)
- [x] Generate nodes JSON with 199-node graph (positions + edges with transport types)
- [x] Set up React + TypeScript + Vite web prototype skeleton
- [x] Create basic board visualization (SVG nodes overlay on board image)
- [x] Define project scope: Phase 1 = web prototype (engine-first), Phase 2 = Swift port
- [x] Clarify architecture decisions: multi-window browser simulation, single machine, no backend
- [x] Document all decisions in memory-bank
- [x] **Phase 0: Select Canonical Rules + AI Engine** ✅
  - Researched 3+ candidate repositories
  - Selected `ZikZhao/Scotland-Yard-2024` (MIT, Java, minimax AI, 82/100 grade)
  - Documented: https://github.com/ZikZhao/Scotland-Yard-2024
  - Key features: Minimax with alpha-beta pruning, Factory/Visitor/Observer patterns, immutable state

## Doing

- [ ] **Phase 3: UX Polish & Refinements** (Next)
  - Implement timing modes
  - Add AI fallback on timeout
  - Handicap system integration
  - Player profiles & stats
  - Visual polish

## Done (Recent)

- [x] **Phase 2: Multi-Window Web Prototype** ✅ **(COMPLETE)**
  - **Sync Layer**: Implemented BroadcastChannel-based sync (`BroadcastSync.ts`)
  - **LauncherScreen**: Entry point for multi-window setup
  - **TvScreen**: Authoritative game board with HUD and token display
  - **ControllerScreen**: Role-specific player views with move selection
  - **App Routing**: URL parameter-based screen routing
  - **Ready for Testing**: Dev server running at http://localhost:5173/
  - See `TESTING.md` for comprehensive testing guide

  **Phase 2.1: BroadcastSync Layer** ✅
  - Created `src/sync/BroadcastSync.ts` with message handling
  - Defined `SyncMessage` types (stateUpdate, playerAction, join, roleAssigned)
  - Error handling and message validation
  - Window ID generation for tracking instances

  **Phase 2.2: LauncherScreen** ✅
  - Multi-window launch buttons (TV + controllers)
  - Player count tracking
  - Setup instructions and validation
  - Styled with gradients and proper UX flow

  **Phase 2.3: TvScreen (Authoritative)** ✅
  - GameEngine integration and state management
  - Player join handling and role assignment
  - Game start logic with configurable settings
  - Board display with SVG token overlay
  - HUD showing round, current turn, next reveal
  - Move application and state broadcasting

  **Phase 2.4: ControllerScreen** ✅
  - Role-specific UI (Mr. X vs Detective)
  - Waiting states (role assignment, game start)
  - Position and ticket display
  - Available moves list with selection
  - Move submission to TV
  - Game over screen with win/loss status

  **Phase 2.5: App Routing** ✅
  - URL parameter-based routing (?mode=tv/controller)
  - Screen switching (launcher/tv/controller)
  - Document title updates per mode

- [x] **Phase 1: TypeScript GameEngine MVP + AI + Runner** ✅ **(COMPLETE)**
  - All core game rules implemented
  - AI system with Easy difficulty (heuristic-based)
  - Engine runner with self-play simulation
  - Tested with 100-game series: working correctly

  **Phase 1.4: Create Engine Runner & Simulation** ✅
  - Defined simulation config types
  - Implemented scripted human policies (random, first legal)
  - Implemented `runSingleGame` function
  - Implemented `runSelfPlaySeries` for statistics
  - Created entry script (`engineTest.ts`) to test engine
  - Added `npm run engine:test` command

  **Phase 1.3: Implement AI (Easy Difficulty)** ✅
  - Created AI type system with Strategy pattern
  - Implemented EasyAi for Mr. X (maximize distance to detectives)
  - Implemented EasyAi for Detectives (minimize distance to Mr. X)
  - Wired AI into GameEngine.runAiTurn (async)
  - Set up fallback for Medium/Hard (use Easy for now)

  **Phase 1.2: Implement GameEngine Rules Logic** ✅
  - Implemented `createInitialState` with handicaps and Bobbies auto-fill
  - Implemented `getLegalMoves` (single moves, black tickets, double-moves)
  - Implemented `applyMove` with visibility, captures, and win conditions
  - Added helper methods for reveal schedule and default tickets
  - Proper turn order and round advancement logic

  **Phase 1.1: Define GameEngine Architecture & Types** ✅
  - Created `web-prototype/src/game/types.ts` with all core types
  - Created `web-prototype/src/game/graph.ts` with BoardGraph class
  - Implemented BFS distance pre-computation for O(1) AI lookups
  - Defined discriminated union for Move types (replaces Java Visitor pattern)
  - Mapped all Java types from ZikZhao to idiomatic TypeScript

## Next

### Phase 1: TypeScript GameEngine MVP + AI + Runner

#### Engine Architecture & Types
- [ ] Define `GameEngine` interface and method signatures in `web-prototype/src/game/GameEngine.ts`
- [ ] Define core types in `web-prototype/src/game/types.ts`:
  - `Role` (MrX, Detective, Bobby)
  - `TicketType` (taxi, bus, underground, black, doubleMove)
  - `Position`, `PlayerState`, `GameSettings`, `GameState`
  - `Move`, `TurnResult`, `TurnPhase`
- [ ] Define board graph types (`Node`, `Edge`) and load existing `nodes_board_highres.json`
- [ ] Create graph helper functions: `loadBoardGraph()`, `getNeighbors(nodeId, ticketType)`

#### Rules Implementation
- [ ] Implement `GameEngine.createInitialState(settings, players)`:
  - Initialize player positions using board graph
  - Apply handicap settings (extra tickets, Mr. X penalty, reveal frequency)
  - Auto-add Bobbies if needed
- [ ] Implement `GameEngine.getLegalMoves(state, role)`:
  - Standard moves: taxi/bus/underground edges with ticket checks
  - Black tickets: allow any transport edge when black tickets available
  - Double-move: generate legal two-hop sequences obeying ticket constraints
- [ ] Implement `GameEngine.applyMove(state, move)`:
  - Update position and consume tickets
  - Handle Mr. X visibility (surfacing schedule, black/double-move hiding)
  - Detect captures (detective lands on Mr. X)
  - Advance round/turn, check win conditions
  - Return `TurnResult` with new state and events
- [ ] Implement `GameEngine.isGameOver(state)` and win condition logic
- [ ] Add move validation and edge case handling (no illegal moves, ticket underflow prevention)

#### AI Implementation
- [ ] Define AI strategy interfaces in `web-prototype/src/ai/types.ts`:
  - `Difficulty`, `AiContext`, `AiStrategy` interface
- [ ] Implement Easy AI in `web-prototype/src/ai/easy.ts`:
  - Mr. X: prefer moves increasing distance from nearest detective
  - Detectives: prefer moves reducing distance to probable Mr. X location
  - Use upstream engine AI as conceptual template
- [ ] Wire AI into `GameEngine.runAiTurn(state, role, difficulty)`

#### Engine Runner & Simulation
- [ ] Define simulation config types in `web-prototype/src/runner/types.ts`:
  - `RoleController` (ai vs scripted, difficulty, policy name)
  - `GameSimulationConfig` (settings, roleControllers, maxRounds, numGames)
- [ ] Implement scripted "human" policies in `web-prototype/src/runner/policies.ts`:
  - `firstLegalMovePolicy`, `randomLegalMovePolicy`
- [ ] Implement `runSingleGame(config)` in `web-prototype/src/runner/engineRunner.ts`:
  - Loop turns until game over
  - For each role: call AI or scripted policy
  - Return `GameResult` (winner, rounds, moves, ticket usage)
- [ ] Implement `runSelfPlaySeries(config, numGames)`:
  - Run multiple games, aggregate stats (win rates, avg length)
- [ ] Add entry script/main() that runs sample games and logs to console
- [ ] Optional: Add minimal test harness (Vitest) for engine validation

### Phase 2: Multi-Window Web Prototype (After Engine MVP)

#### Sync & Window Architecture
- [ ] Implement sync layer using BroadcastChannel in `web-prototype/src/sync/`
- [ ] Define message protocol: `stateUpdate`, `playerAction`, `join`, `roleAssigned`
- [ ] Create launcher flow: start TV window, spawn controller windows
- [ ] Implement role assignment and state distribution (TV = authoritative)

#### UI Structure
- [ ] Add routing/screen switching to App.tsx: `LauncherScreen`, `TvScreen`, `ControllerScreen`
- [ ] Implement `TvScreen`:
  - Render board + tokens (pulsing active role)
  - HUD: round, next reveal, timer placeholder, commit state
  - Possible-location halos for hidden Mr. X
  - Focus zoom (manual pan/zoom controls)
- [ ] Implement `ControllerScreen`:
  - Mr. X: private view, move selection, tickets, commit button
  - Detective: current node, reachable nodes, tickets
  - Send chosen moves via sync to TV

#### Board Interactions
- [ ] Use `GameEngine.getLegalMoves` to derive move options for controllers
- [ ] Implement move selection UI on controllers
- [ ] Wire controller actions to TV state updates via sync

### Phase 3: Web UX Polish (After Multi-Window Works)

#### Timing & Commit Modes
- [ ] Implement timing logic: Individual Timed, Commit Mode, Unlimited
- [ ] Add timers on TV (per-role countdown, commit-mode logic)
- [ ] Implement AI fallback on timeout

#### Handicap System Integration
- [ ] Wire reveal frequency slider to engine
- [ ] Apply ticket bonuses/penalties at game setup
- [ ] Implement Bobbies auto-fill logic

#### Profiles & Stats
- [ ] Implement localStorage-based player profiles
- [ ] Track per-name stats (games played/won, survival rounds, capture efficiency)
- [ ] Add post-game leaderboard screen on TV

#### Visual Polish
- [ ] Add token differentiation (colors, shapes, pulsing)
- [ ] Implement dynamic focus zoom on TV
- [ ] Add accessibility features (color-blind patterns, ARIA labels)
- [ ] Add subtle audio cues

### Phase 4: Swift Port (Future)
- [ ] Map TS types to Swift structs/enums
- [ ] Port GameEngine and AI to Swift
- [ ] Create shared Swift package (GameCore)
- [ ] Build tvOS app (Scotland Yard TV)
- [ ] Build iOS app (Scotland Yard)
- [ ] Implement MultipeerConnectivity sync
- [ ] Port UI to SwiftUI
- [ ] TestFlight → App Store