/**
 * Controller Screen - Private player view
 *
 * Role-specific UI for Mr. X or Detective players
 * - Shows available moves
 * - Displays ticket counts
 * - Sends moves to TV window
 */

import { useState, useEffect } from 'react';
import { GameEngine } from '../game/GameEngine';
import { loadBoardGraph } from '../game/graph';
import type { GameState, Role, Move } from '../game/types';
import { BroadcastSync, type SyncMessage } from '../sync/BroadcastSync';

// ============================================================================
// CONTROLLER SCREEN COMPONENT
// ============================================================================

export function ControllerScreen() {
  const [role, setRole] = useState<Role | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [engine, setEngine] = useState<GameEngine | null>(null);
  const [sync, setSync] = useState<BroadcastSync | null>(null);
  const [availableMoves, setAvailableMoves] = useState<Move[]>([]);
  const [selectedMove, setSelectedMove] = useState<Move | null>(null);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [controllerId] = useState(() => `controller-${Date.now()}-${Math.random()}`);

  // Initialize engine and sync
  useEffect(() => {
    async function init() {
      try {
        console.log('[ControllerScreen] Initializing...', controllerId);

        // Fetch node data
        const response = await fetch('/nodes.json');
        if (!response.ok) {
          throw new Error(`Failed to load nodes: ${response.status}`);
        }
        const nodes = await response.json();

        // Load board graph
        const graph = loadBoardGraph(nodes);
        const gameEngine = new GameEngine(graph);
        setEngine(gameEngine);

        // Create sync channel
        const syncChannel = new BroadcastSync('scotland-yard-sync');
        setSync(syncChannel);

        // Handle incoming messages
        const cleanup = syncChannel.onMessage((message: SyncMessage) => {
          handleSyncMessage(message, gameEngine);
        });

        // Announce join to TV with unique ID
        syncChannel.send({ type: 'join', windowType: 'controller', controllerId });

        // Send ping to check if TV is alive
        syncChannel.send({ type: 'ping' });

        console.log('[ControllerScreen] Waiting for role assignment...');
        setLoading(false);

        return () => {
          cleanup();
          syncChannel.close();
        };
      } catch (err) {
        console.error('[ControllerScreen] Initialization error:', err);
        setError(`Failed to initialize: ${err}`);
        setLoading(false);
      }
    }

    init();
  }, [controllerId]);

  // Update available moves when it's our turn
  useEffect(() => {
    if (engine && gameState && role && gameState.currentTurn === role) {
      const moves = engine.getLegalMoves(gameState, role);
      setAvailableMoves(moves);
      setIsMyTurn(true);
      console.log(`[ControllerScreen] ${role}'s turn, ${moves.length} legal moves`);
    } else {
      setIsMyTurn(false);
      setAvailableMoves([]);
      setSelectedMove(null);
    }
  }, [gameState, role, engine]);

  // Handle sync messages
  const handleSyncMessage = (message: SyncMessage, gameEngine: GameEngine) => {
    console.log('[ControllerScreen] Received message:', message.type);

    switch (message.type) {
      case 'roleAssigned':
        // Only process role assignments meant for this controller
        if (message.controllerId === controllerId) {
          setRole(message.role);
          console.log(`[ControllerScreen] Assigned role: ${message.role}`);
        } else {
          console.log(`[ControllerScreen] Ignoring role assignment for different controller`);
        }
        break;

      case 'gameStart':
        setGameState(message.state);
        console.log('[ControllerScreen] Game started!');
        break;

      case 'stateUpdate':
        setGameState(message.state);
        console.log('[ControllerScreen] State updated');
        break;

      case 'pong':
        console.log('[ControllerScreen] TV is alive');
        break;
    }
  };

  // Submit selected move
  const handleSubmitMove = () => {
    if (!selectedMove || !role || !sync) {
      setError('Cannot submit move: missing data');
      return;
    }

    try {
      console.log(`[ControllerScreen] Submitting move from ${role}:`, selectedMove);

      // Send move to TV
      sync.send({
        type: 'playerAction',
        role,
        move: selectedMove,
      });

      // Clear selection
      setSelectedMove(null);
      setError(null);
    } catch (err) {
      console.error('[ControllerScreen] Error submitting move:', err);
      setError(`Failed to submit move: ${err}`);
    }
  };

  // Render loading screen
  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.waitingScreen}>
          <h2 style={styles.title}>Scotland Yard</h2>
          <p style={styles.subtitle}>Loading...</p>
          <div style={styles.spinner}>⏳</div>
        </div>
      </div>
    );
  }

  // Render waiting for role assignment
  if (!role) {
    return (
      <div style={styles.container}>
        <div style={styles.waitingScreen}>
          <h2 style={styles.title}>Scotland Yard</h2>
          <p style={styles.subtitle}>Waiting for role assignment...</p>
          <div style={styles.spinner}>⏳</div>
        </div>
      </div>
    );
  }

  // Render waiting for game start
  if (!gameState) {
    return (
      <div style={styles.container}>
        <div style={styles.waitingScreen}>
          <h2 style={styles.title}>Scotland Yard</h2>
          <p style={styles.roleLabel}>
            {role === 'MrX' ? '🎩' : '👮'} You are: {role}
          </p>
          <p style={styles.subtitle}>Waiting for game to start...</p>
        </div>
      </div>
    );
  }

  // Get player info
  const player = gameState.players.find(p => p.role === role);
  if (!player) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>Error: Player not found in game state</div>
      </div>
    );
  }

  // Render game over screen
  if (gameState.isGameOver) {
    const didWin =
      (role === 'MrX' && gameState.winner === 'MrX') ||
      (role !== 'MrX' && gameState.winner === 'Detectives');

    return (
      <div style={styles.container}>
        <div style={styles.waitingScreen}>
          <h2 style={styles.title}>Game Over!</h2>
          <p style={{ ...styles.subtitle, fontSize: '32px' }}>
            {didWin ? '🎉 You Won!' : '😞 You Lost'}
          </p>
          <p style={styles.subtitle}>
            Winner: {gameState.winner}
          </p>
          <p style={styles.subtitle}>
            Rounds: {gameState.round} / 24
          </p>
        </div>
      </div>
    );
  }

  // Render controller UI
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.roleDisplay}>
          {role === 'MrX' ? '🎩' : '👮'} {role}
        </div>
        <div style={styles.roundDisplay}>Round {gameState.round}/24</div>
      </div>

      <div style={styles.statusBar}>
        {isMyTurn ? (
          <div style={styles.yourTurn}>⚡ Your Turn</div>
        ) : (
          <div style={styles.waitingTurn}>
            Waiting for {gameState.currentTurn}...
          </div>
        )}
      </div>

      <div style={styles.infoSection}>
        <h3 style={styles.sectionTitle}>Your Position</h3>
        <div style={styles.infoValue}>
          Node: {player.position !== 'unknown' ? player.position : '???'}
        </div>
      </div>

      <div style={styles.infoSection}>
        <h3 style={styles.sectionTitle}>Your Tickets</h3>
        <div style={styles.ticketGrid}>
          <div style={styles.ticketItem}>
            🚕 Taxi: {player.tickets.taxi}
          </div>
          <div style={styles.ticketItem}>
            🚌 Bus: {player.tickets.bus}
          </div>
          <div style={styles.ticketItem}>
            🚇 Underground: {player.tickets.underground}
          </div>
          {role === 'MrX' && (
            <>
              <div style={styles.ticketItem}>
                ⚫ Black: {player.tickets.black}
              </div>
              <div style={styles.ticketItem}>
                ⚡ Double: {player.tickets.doubleMove}
              </div>
            </>
          )}
        </div>
      </div>

      {isMyTurn && (
        <div style={styles.movesSection}>
          <h3 style={styles.sectionTitle}>
            Available Moves ({availableMoves.length})
          </h3>
          <div style={styles.movesList}>
            {availableMoves.map((move, index) => (
              <div
                key={index}
                style={{
                  ...styles.moveItem,
                  ...(selectedMove === move ? styles.moveItemSelected : {}),
                }}
                onClick={() => setSelectedMove(move)}
              >
                {move.type === 'single' ? (
                  <>
                    <div style={styles.moveLabel}>
                      {getTicketEmoji(move.ticket)} {move.from} → {move.to}
                    </div>
                    <div style={styles.moveType}>Single Move</div>
                  </>
                ) : (
                  <>
                    <div style={styles.moveLabel}>
                      {getTicketEmoji(move.ticket1)} {move.from} → {move.via} →{' '}
                      {move.to}
                    </div>
                    <div style={styles.moveType}>Double Move</div>
                  </>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={handleSubmitMove}
            style={{
              ...styles.submitButton,
              ...(selectedMove ? {} : styles.buttonDisabled),
            }}
            disabled={!selectedMove}
          >
            {selectedMove ? 'Submit Move' : 'Select a move'}
          </button>
        </div>
      )}

      {error && <div style={styles.errorBox}>{error}</div>}
    </div>
  );
}

// ============================================================================
// HELPERS
// ============================================================================

function getTicketEmoji(ticket: string): string {
  switch (ticket) {
    case 'taxi':
      return '🚕';
    case 'bus':
      return '🚌';
    case 'underground':
      return '🚇';
    case 'black':
      return '⚫';
    case 'doubleMove':
      return '⚡';
    default:
      return '❓';
  }
}

// ============================================================================
// STYLES
// ============================================================================

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    background: '#1a202c',
    color: 'white',
    overflow: 'auto',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  waitingScreen: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    padding: '20px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    margin: '0 0 16px 0',
  },
  subtitle: {
    fontSize: '18px',
    color: '#a0aec0',
    margin: '8px 0',
  },
  roleLabel: {
    fontSize: '24px',
    fontWeight: '600',
    margin: '8px 0',
  },
  spinner: {
    fontSize: '48px',
    marginTop: '20px',
    animation: 'spin 2s linear infinite',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    background: '#2d3748',
    borderBottom: '2px solid #4a5568',
  },
  roleDisplay: {
    fontSize: '20px',
    fontWeight: 'bold',
  },
  roundDisplay: {
    fontSize: '16px',
    color: '#a0aec0',
  },
  statusBar: {
    padding: '12px 16px',
    textAlign: 'center',
    fontWeight: '600',
  },
  yourTurn: {
    color: '#48bb78',
    fontSize: '18px',
  },
  waitingTurn: {
    color: '#a0aec0',
    fontSize: '16px',
  },
  infoSection: {
    padding: '16px',
    borderBottom: '1px solid #4a5568',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#a0aec0',
    textTransform: 'uppercase',
    marginBottom: '12px',
  },
  infoValue: {
    fontSize: '18px',
    fontWeight: '600',
  },
  ticketGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '8px',
  },
  ticketItem: {
    padding: '8px',
    background: '#2d3748',
    borderRadius: '4px',
    fontSize: '14px',
  },
  movesSection: {
    flex: 1,
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
  },
  movesList: {
    flex: 1,
    overflow: 'auto',
    marginBottom: '16px',
  },
  moveItem: {
    padding: '12px',
    margin: '8px 0',
    background: '#2d3748',
    borderRadius: '8px',
    cursor: 'pointer',
    border: '2px solid transparent',
    transition: 'all 0.2s',
  },
  moveItemSelected: {
    background: '#4a5568',
    border: '2px solid #667eea',
  },
  moveLabel: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '4px',
  },
  moveType: {
    fontSize: '12px',
    color: '#a0aec0',
  },
  submitButton: {
    padding: '16px',
    fontSize: '18px',
    fontWeight: '600',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  errorBox: {
    position: 'fixed',
    bottom: '20px',
    left: '20px',
    right: '20px',
    padding: '12px',
    background: '#fc8181',
    color: '#742a2a',
    borderRadius: '8px',
    fontSize: '14px',
  },
  error: {
    padding: '20px',
    textAlign: 'center',
    color: '#fc8181',
  },
};
