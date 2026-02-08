# Scotland Yard: Phase 2 - Multi-Window Web Prototype

## Context

You are working on **Live Scotland Yard**, a digital couch-co-op adaptation of the board game.

**IMPORTANT:** Read `memory-bank/CONTEXT.md` for full project context before starting work.

**Current Status:**
- ✅ **Phase 1 Complete**: TypeScript GameEngine MVP with AI and runner
- 🎯 **Now**: Build Phase 2 - Multi-window web prototype (TV + controllers)

## Your Task

Implement **Phase 2: Multi-Window Web Prototype** as specified in `memory-bank/progress.md`.

### Success Criteria

Build a browser-based multi-window simulation where:

1. **TV Window** (shared board):
   - Displays Scotland Yard board with player tokens
   - Shows game HUD: round counter, next reveal turn, active player
   - Updates in real-time based on controller inputs
   - Shows possible-location halo for hidden Mr. X

2. **Controller Windows** (private player views):
   - Role-specific UI (Mr. X vs Detective)
   - Move selection from legal moves (via `GameEngine.getLegalMoves`)
   - Ticket display and counts
   - Sends moves to TV window via sync

3. **Sync Layer**:
   - Uses BroadcastChannel for browser-to-browser communication
   - TV window is authoritative (runs the game engine)
   - Controllers send moves, TV broadcasts state updates
   - Handles join/role assignment protocol

4. **Launcher Flow**:
   - Initial screen with buttons to launch TV or controller windows
   - Can open multiple controller windows (one per player)
   - Simple role assignment (manual or auto)

### Implementation Requirements

Follow the technical specifications in:
- `memory-bank/CONTEXT.md` - Architecture and design patterns
- `memory-bank/progress.md` - Detailed Phase 2 task breakdown
- `CLAUDE.md` - Code style and development practices

**Key Files to Create:**
- `web-prototype/src/sync/BroadcastSync.ts` - Sync layer
- `web-prototype/src/screens/LauncherScreen.tsx` - Launcher UI
- `web-prototype/src/screens/TvScreen.tsx` - TV board view
- `web-prototype/src/screens/ControllerScreen.tsx` - Controller UI
- Update `web-prototype/src/App.tsx` - Add routing between screens

**Integration Points:**
- Use existing `GameEngine` from `web-prototype/src/game/GameEngine.ts`
- Use existing `BoardGraph` from `web-prototype/src/game/graph.ts`
- Load board image from `public/board.png`
- Load nodes from `public/nodes.json`

### Development Approach

1. **Start with sync layer** - Get BroadcastChannel working first
2. **Build launcher** - Simple screen switching
3. **Implement TV screen** - Basic board + state display
4. **Implement controllers** - Move selection UI
5. **Wire it together** - Full game loop across windows
6. **Test and refine** - Fix sync issues, improve UX

### Testing

After implementation, you should be able to:
1. Open launcher in browser
2. Click "Launch TV" → opens TV window
3. Click "Add Player" → opens controller windows
4. Play a complete game across multiple browser windows
5. See real-time updates as moves are made

### Completion Promise

When Phase 2 is complete and tested, output:

```
<promise>PHASE_2_COMPLETE</promise>
```

Only output this promise when:
- ✅ All four window types work (launcher, TV, controller)
- ✅ BroadcastChannel sync is functional
- ✅ Can play a complete game across windows
- ✅ TV displays board and game state correctly
- ✅ Controllers can select and send moves
- ✅ No critical bugs preventing gameplay

## Notes

- Focus on **functionality over polish** - visual refinement comes in Phase 3
- Keep UI simple and clean - basic styling is fine
- Don't skip error handling - sync failures should be graceful
- Log to console liberally for debugging sync issues
- Test with 1 Mr. X + 2-3 Detective windows minimum

## Questions?

If you need clarification on requirements, check:
1. `memory-bank/CONTEXT.md` for architecture decisions
2. `memory-bank/progress.md` for detailed task breakdown
3. `CLAUDE.md` for code style guidelines

If still unclear, ask before proceeding with ambiguous implementations.
