# Active Context

## Current Goals

**Primary near-term goal**: Design and implement a **rules-complete, AI-capable TypeScript `GameEngine` MVP** for Scotland Yard, using the existing board graph and mirroring a chosen open-source rules+AI engine, independent of React/UI.

The engine must:
- Expose a `GameEngine` object (OO-style API) with methods like `createInitialState`, `getLegalMoves`, `applyMove`, `runAiTurn`, `isGameOver`
- Support full ticket mechanics: taxi, bus, underground, **black tickets**, **double-move tickets**
- Handle roles (Mr. X, detectives, Bobbies), round progression, surfacing schedule (configurable reveal frequency), and capture/survival win conditions
- Include at least one working AI difficulty (Easy) with logic adapted from chosen upstream engine
- Provide an engine runner that:
  - Can run **AI-only games** (self-play) for automated testing and statistics
  - Can run **scripted "human" + AI games** via simple policies (no interactive input)

Once the engine MVP works, proceed to multi-window web prototype (TV + controllers with BroadcastChannel sync).

## Current Blockers

1. ~~**BLOCKER**: Select canonical open-source Scotland Yard rules + AI engine~~ ✅ **RESOLVED**
   - **Selected**: `ZikZhao/Scotland-Yard-2024` (MIT, Java, minimax with alpha-beta pruning)
   - Repo: https://github.com/ZikZhao/Scotland-Yard-2024
   - Key patterns: Factory, Visitor, Observer, Immutable state
   - AI: Minimax depth 3, heuristic scoring, O(1) distance lookups

2. **CURRENT BLOCKER**: Draft the `GameEngine` interface spec (method names, parameters, return types) aligned with ZikZhao's architecture and our PRD requirements

## Next Immediate Steps

1. Research and select canonical engine (see `progress.md` for evaluation tasks)
2. Define `GameEngine` interface and supporting types (`GameState`, `Move`, `Role`, `TicketType`, `TurnPhase`, `TurnResult`)
3. Implement engine core in `web-prototype/src/game/`
4. Port/mirror AI logic into `web-prototype/src/ai/`
5. Build engine runner in `web-prototype/src/runner/engineRunner.ts`