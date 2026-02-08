/**
 * Launcher Screen - Entry point for multi-window setup
 *
 * Allows users to:
 * - Launch TV window (shared board)
 * - Launch controller windows (one per player)
 * - Configure game settings
 */

import { useState } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface LauncherScreenProps {
  onLaunchTV: () => void;
  onLaunchController: () => void;
}

// ============================================================================
// LAUNCHER SCREEN COMPONENT
// ============================================================================

export function LauncherScreen({ onLaunchTV, onLaunchController }: LauncherScreenProps) {
  const [tvLaunched, setTvLaunched] = useState(false);
  const [controllerCount, setControllerCount] = useState(0);

  const handleLaunchTV = () => {
    const tvUrl = `${window.location.origin}${window.location.pathname}?mode=tv`;
    window.open(tvUrl, 'ScotlandYardTV', 'width=1200,height=800');
    setTvLaunched(true);
    onLaunchTV();
  };

  const handleLaunchController = () => {
    const controllerUrl = `${window.location.origin}${window.location.pathname}?mode=controller`;
    window.open(controllerUrl, `ScotlandYardController${controllerCount + 1}`, 'width=400,height=600');
    setControllerCount(prev => prev + 1);
    onLaunchController();
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.title}>Live Scotland Yard</h1>
        <p style={styles.subtitle}>Multi-Window Board Game</p>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Setup Instructions</h2>
          <ol style={styles.list}>
            <li>First, launch the TV window (shared game board)</li>
            <li>Then, launch controller windows (one per player)</li>
            <li>Each controller will be assigned a role automatically</li>
            <li>Play the game across multiple browser windows!</li>
          </ol>
        </div>

        <div style={styles.buttonContainer}>
          <button
            onClick={handleLaunchTV}
            style={{
              ...styles.button,
              ...styles.tvButton,
              ...(tvLaunched ? styles.buttonDisabled : {}),
            }}
            disabled={tvLaunched}
          >
            {tvLaunched ? '✓ TV Launched' : '📺 Launch TV Window'}
          </button>

          <button
            onClick={handleLaunchController}
            style={{
              ...styles.button,
              ...styles.controllerButton,
              ...(tvLaunched ? {} : styles.buttonDisabled),
            }}
            disabled={!tvLaunched}
          >
            🎮 Add Player ({controllerCount})
          </button>
        </div>

        {tvLaunched && (
          <div style={styles.status}>
            <p style={styles.statusText}>
              ✓ TV window launched
            </p>
            <p style={styles.statusText}>
              {controllerCount > 0
                ? `${controllerCount} player(s) added`
                : 'Click "Add Player" to add controllers'}
            </p>
            <p style={styles.hint}>
              Note: You need at least 2 players (1 Mr. X + 1 Detective) to start the game
            </p>
          </div>
        )}

        {!tvLaunched && (
          <div style={styles.warning}>
            <p>⚠️ Launch the TV window first to begin setup</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  content: {
    background: 'white',
    borderRadius: '12px',
    padding: '40px',
    maxWidth: '600px',
    width: '100%',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  title: {
    fontSize: '36px',
    fontWeight: 'bold',
    margin: '0 0 8px 0',
    color: '#2d3748',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: '18px',
    color: '#718096',
    margin: '0 0 32px 0',
    textAlign: 'center',
  },
  section: {
    marginBottom: '32px',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: '16px',
  },
  list: {
    margin: '0',
    padding: '0 0 0 20px',
    lineHeight: '1.8',
    color: '#4a5568',
  },
  buttonContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '24px',
  },
  button: {
    padding: '16px 24px',
    fontSize: '18px',
    fontWeight: '600',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    color: 'white',
  },
  tvButton: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  controllerButton: {
    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  status: {
    background: '#f7fafc',
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
  },
  statusText: {
    margin: '4px 0',
    color: '#2d3748',
    fontSize: '14px',
  },
  hint: {
    margin: '12px 0 0 0',
    color: '#718096',
    fontSize: '13px',
    fontStyle: 'italic',
  },
  warning: {
    background: '#fff5f5',
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid #feb2b2',
    textAlign: 'center',
    color: '#c53030',
  },
};
