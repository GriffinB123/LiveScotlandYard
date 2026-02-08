# Phase 2 Testing Guide

## Multi-Window Game Flow Testing

### Prerequisites

1. Start the dev server:
   ```bash
   cd web-prototype
   PATH="/usr/local/bin:$PATH" npm run dev
   ```

2. Open your browser to http://localhost:5173/

### Test Scenario 1: Basic Multi-Window Setup

**Steps:**

1. **Launch Launcher Window**
   - Navigate to http://localhost:5173/
   - Should see "Live Scotland Yard" title
   - Should see setup instructions
   - "Launch TV Window" button should be enabled
   - "Add Player" button should be disabled

2. **Launch TV Window**
   - Click "Launch TV Window"
   - New window should open with URL: `http://localhost:5173/?mode=tv`
   - TV window should show "Scotland Yard TV" title
   - Should display "Waiting for players..."
   - "Start Game" button should be disabled
   - Player list should be empty (0 players)

3. **Launch Controller Windows**
   - Return to launcher window
   - "Launch TV" button should now show "✓ TV Launched" and be disabled
   - "Add Player" button should now be enabled
   - Click "Add Player" 3 times
   - Three controller windows should open with URL: `http://localhost:5173/?mode=controller`
   - Each controller should show "Waiting for role assignment..."

4. **Verify Role Assignment**
   - TV window should now show 3 players in the player list:
     - Player 1: 🎩 Mr. X (MrX)
     - Player 2: 👮 Detective (Detective)
     - Player 3: 👮 Detective (Detective)
   - Each controller window should display its assigned role
   - Controller windows should show "Waiting for game to start..."

5. **Start Game**
   - In TV window, "Start Game" button should now be enabled
   - Click "Start Game"
   - TV window should display:
     - Game board with player tokens
     - HUD showing: Round, Current Turn, Next Reveal
     - Tokens at player positions
   - Controller windows should update to show game state:
     - Role and position
     - Ticket counts
     - Available moves (if it's their turn)

### Test Scenario 2: Gameplay Flow

**Steps:**

1. **Mr. X's Turn**
   - Mr. X controller should show "⚡ Your Turn"
   - Should display list of available moves
   - Select a move by clicking on it
   - Selected move should highlight
   - Click "Submit Move" button
   - TV window should update to show Mr. X moved
   - Turn should advance to next detective

2. **Detective Turn**
   - Detective controller should now show "⚡ Your Turn"
   - Should display available moves from current position
   - Select and submit a move
   - TV should update detective position

3. **Continue Gameplay**
   - Play through several rounds
   - Verify:
     - Round counter increments
     - Each player takes turns
     - Tokens move on the board
     - Ticket counts decrease
     - Mr. X visibility follows reveal schedule

4. **Game Over Conditions**
   - Test capture scenario:
     - Detective lands on Mr. X's position
     - Game should end
     - TV shows "Winner: Detectives"
     - All controllers show game over screen

### Test Scenario 3: Sync Verification

**Checklist:**

- [ ] TV window receives join messages from controllers
- [ ] Controllers receive role assignments
- [ ] Game state updates broadcast from TV to all controllers
- [ ] Player actions from controllers reach TV
- [ ] All windows update in real-time
- [ ] No console errors in any window
- [ ] BroadcastChannel communication logs visible in console

### Test Scenario 4: Error Handling

**Test Cases:**

1. **Controller joins before TV**
   - Launch controller first
   - Should show waiting state
   - Launch TV afterward
   - Controller should receive role assignment

2. **Maximum players**
   - Launch TV
   - Add 6 players (1 Mr. X + 5 Detectives/Bobbies)
   - 7th controller should not receive role (all filled)

3. **Controller window closed**
   - Start game with 3 players
   - Close one controller window
   - Game should continue (TV handles the state)
   - Other controllers should continue working

### Expected Behaviors

**Launcher Window:**
- Tracks TV launch status
- Counts controller windows opened
- Prevents adding controllers before TV launch
- Shows helpful instructions

**TV Window (Authoritative):**
- Manages game engine and state
- Receives and processes player moves
- Broadcasts state updates
- Assigns roles to joining controllers
- Displays full board with all visible tokens
- Shows HUD with game information
- Handles game start and end conditions

**Controller Windows:**
- Display role-specific information
- Show current position and tickets
- List available moves when it's player's turn
- Send selected moves to TV
- Update based on state broadcasts from TV
- Show game over screen with win/loss status

### Known Limitations

1. **No reconnection logic**: If a controller disconnects, it cannot rejoin
2. **No player names**: Players identified by role only
3. **Basic UI**: Functional but minimal styling
4. **No undo**: Submitted moves cannot be reversed
5. **No AI fallback**: Human players only (no timeout AI)

### Debug Tips

**Console Logging:**
- All sync messages are logged with `[BroadcastSync]` prefix
- TV logs with `[TvScreen]` prefix
- Controllers log with `[ControllerScreen]` prefix

**Checking Sync:**
```javascript
// In browser console of any window
window.channel = new BroadcastChannel('scotland-yard-sync')
window.channel.postMessage({ type: 'ping' })
```

**Verifying Game State:**
- TV window holds authoritative state
- Check TV console for full game state on each update
- Controllers receive filtered views of state

### Success Criteria

Phase 2 is complete when:
- ✅ All four window types work (launcher, TV, controller)
- ✅ BroadcastChannel sync is functional
- ✅ Can play a complete game across windows
- ✅ TV displays board and game state correctly
- ✅ Controllers can select and send moves
- ✅ No critical bugs preventing gameplay

### Next Steps (Phase 3)

After Phase 2 is verified:
- Add timing modes (individual timed, commit mode)
- Implement AI fallback on timeout
- Add handicap system controls
- Implement player profiles & stats
- Visual polish (animations, better styling)
- Accessibility improvements
