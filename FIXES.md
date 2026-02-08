# Bug Fixes - Role Assignment Issue

## Issue Identified

The controller was stuck at "Waiting for role assignment..." due to two problems:

### 1. Vite Import Error
**Problem**: Importing `nodes.json` from the `public/` directory caused Vite errors.

**Error Message**:
```
Assets in public directory cannot be imported from JavaScript.
```

**Fix**: Changed from static imports to dynamic fetch:
```typescript
// Before (WRONG):
import nodesData from '../../public/nodes.json';

// After (CORRECT):
const response = await fetch('/nodes.json');
const nodes = await response.json();
```

### 2. Closure Issue with Sync Channel
**Problem**: The `handlePlayerJoin` function couldn't access the `sync` state due to closure issues.

**Fix**: Used refs and passed syncChannel as parameter:
```typescript
// Added refs
const syncRef = useRef<BroadcastSync | null>(null);
const engineRef = useRef<GameEngine | null>(null);

// Pass syncChannel directly to avoid closure
syncChannel.onMessage((message) => {
  if (message.type === 'join') {
    handlePlayerJoin(message.requestedRole, syncChannel);
  }
});

// Function uses passed channel or refs as fallback
const handlePlayerJoin = (requestedRole?: Role, syncChannel?: BroadcastSync) => {
  const channelToUse = syncChannel || sync || syncRef.current;
  channelToUse?.send({ type: 'roleAssigned', role: assignedRole, ... });
};
```

## Files Modified

1. **`src/screens/TvScreen.tsx`**
   - Changed from import to fetch for nodes.json
   - Added refs for sync and engine
   - Fixed closure issue in message handlers
   - Updated handlePlayerJoin to accept syncChannel parameter
   - Updated handlePlayerMove to use refs

2. **`src/screens/ControllerScreen.tsx`**
   - Changed from import to fetch for nodes.json
   - Added loading state

## Testing the Fixes

### Step 1: Refresh All Windows
The dev server has applied the updates via HMR, but to be safe:
1. Close all TV and controller windows
2. In the launcher, click "Launch TV Window" again
3. Click "Add Player" to open a new controller

### Step 2: Check Console Logs
Open browser console (F12) in both windows to see:

**TV Window Console**:
```
[TvScreen] Initializing...
[TvScreen] Ready and listening for players
[TvScreen] Received message: join
[TvScreen] Assigned role: MrX
```

**Controller Window Console**:
```
[ControllerScreen] Initializing...
[ControllerScreen] Waiting for role assignment...
[ControllerScreen] Received message: roleAssigned
[ControllerScreen] Assigned role: MrX
```

### Step 3: Verify Role Assignment
The controller should now display:
```
🎩 You are: MrX
Waiting for game to start...
```

## What Should Work Now

✅ TV loads nodes.json successfully
✅ Controller loads nodes.json successfully
✅ Controller sends join message
✅ TV receives join message
✅ TV assigns role (MrX → Detective → Bobby)
✅ TV sends roleAssigned message
✅ Controller receives roleAssigned message
✅ Controller displays assigned role
✅ TV shows player in waiting room list
✅ Start game button enables when 2+ players

## If Still Not Working

### Debug Checklist

1. **Check browser console for errors**
   - F12 to open dev tools
   - Look for red error messages
   - Check if fetch('/nodes.json') succeeded

2. **Verify BroadcastChannel support**
   - In console, type: `typeof BroadcastChannel`
   - Should return "function"
   - If "undefined", your browser doesn't support it

3. **Check sync messages**
   - Messages should log with `[BroadcastSync]` prefix
   - TV: Should see "Received: join"
   - Controller: Should see "Received: roleAssigned"

4. **Try hard refresh**
   - Ctrl+Shift+R (Windows/Linux)
   - Cmd+Shift+R (Mac)
   - This clears cached JavaScript

5. **Restart dev server if needed**
   - Stop the background server
   - `cd web-prototype && PATH="/usr/local/bin:$PATH" npm run dev`

## Expected Flow

```
User opens Launcher
    ↓
Clicks "Launch TV" → TV window opens
    ↓
TV initializes, loads board, starts listening
    ↓
Clicks "Add Player" → Controller 1 opens
    ↓
Controller initializes, loads board, sends join
    ↓
TV receives join → assigns "MrX" → sends roleAssigned
    ↓
Controller receives roleAssigned → shows "You are: MrX"
    ↓
Clicks "Add Player" → Controller 2 opens
    ↓
Controller 2 joins → TV assigns "Detective" → Controller 2 shows role
    ↓
Clicks "Add Player" → Controller 3 opens
    ↓
Controller 3 joins → TV assigns "Detective" → Controller 3 shows role
    ↓
TV shows 3 players, enables "Start Game" button
    ↓
Click "Start Game" → Game begins!
```

## Next Steps After Fix Works

1. Test complete game flow
2. Add multiple players (3-4)
3. Start game
4. Play through some moves
5. Verify tokens move on board
6. Check game over conditions

## Known Remaining Issues

1. **No possible-location halo**: Hidden Mr. X shows as "unknown" but no visual halo yet
2. **No reconnection**: Closed windows can't rejoin
3. **No persistence**: Refresh loses state
4. **Basic UI**: Functional but minimal styling

These are Phase 3 enhancements, not Phase 2 blockers.
