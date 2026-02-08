/**
 * Main App Component - Handles screen routing
 *
 * Routes between:
 * - Launcher: Entry point for multi-window setup
 * - TV: Shared board (authoritative)
 * - Controller: Private player view
 */

import { useState, useEffect } from 'react';
import { LauncherScreen } from './screens/LauncherScreen';
import { TvScreen } from './screens/TvScreen';
import { ControllerScreen } from './screens/ControllerScreen';
import './App.css';

// ============================================================================
// TYPES
// ============================================================================

type ScreenMode = 'launcher' | 'tv' | 'controller';

// ============================================================================
// APP COMPONENT
// ============================================================================

function App() {
  const [screenMode, setScreenMode] = useState<ScreenMode>('launcher');

  // Check URL parameters for mode
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');

    if (mode === 'tv') {
      setScreenMode('tv');
      document.title = 'Scotland Yard TV';
    } else if (mode === 'controller') {
      setScreenMode('controller');
      document.title = 'Scotland Yard Controller';
    } else {
      setScreenMode('launcher');
      document.title = 'Scotland Yard Launcher';
    }
  }, []);

  // Render appropriate screen
  switch (screenMode) {
    case 'launcher':
      return (
        <LauncherScreen
          onLaunchTV={() => {
            console.log('[App] TV window launched');
          }}
          onLaunchController={() => {
            console.log('[App] Controller window launched');
          }}
        />
      );

    case 'tv':
      return <TvScreen />;

    case 'controller':
      return <ControllerScreen />;

    default:
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h1>Error: Unknown screen mode</h1>
          <button onClick={() => window.location.reload()}>Reload</button>
        </div>
      );
  }
}

export default App;
