/**
 * TV Screen - Shared game board (authoritative)
 *
 * Displays:
 * - Board image with player tokens
 * - Game HUD (round, next reveal, active player)
 * - Possible-location halo for hidden Mr. X
 * - Runs the game engine and manages state
 */

import { useState, useEffect, useRef } from 'react';
import { GameEngine } from '../game/GameEngine';
import { loadBoardGraph } from '../game/graph';
import type { GameState, GameSettings, PlayerConfig, Role } from '../game/types';
import { BroadcastSync, type SyncMessage } from '../sync/BroadcastSync';

// ============================================================================
// TV SCREEN COMPONENT
// ============================================================================

export function TvScreen() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [engine, setEngine] = useState<GameEngine | null>(null);
  const [sync, setSync] = useState<BroadcastSync | null>(null);
  const [players, setPlayers] = useState<PlayerConfig[]>([]);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nodesData, setNodesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const boardRef = useRef<HTMLDivElement>(null);
  const syncRef = useRef<BroadcastSync | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Initialize engine and sync
  useEffect(() => {
    async function init() {
      try {
        console.log('[TvScreen] Initializing...');

        // Fetch node data
        const response = await fetch('/nodes.json');
        if (!response.ok) {
          throw new Error(`Failed to load nodes: ${response.status}`);
        }
        const nodes = await response.json();
        setNodesData(nodes);

        // Load board graph
        const graph = loadBoardGraph(nodes);
        const gameEngine = new GameEngine(graph);
        setEngine(gameEngine);
        engineRef.current = gameEngine;

        // Create sync channel
        const syncChannel = new BroadcastSync('scotland-yard-sync');
        setSync(syncChannel);
        syncRef.current = syncChannel;

        // Handle incoming messages - use refs to avoid closure issues
        const cleanup = syncChannel.onMessage((message: SyncMessage) => {
          console.log('[TvScreen] Received message:', message.type);

          switch (message.type) {
            case 'join':
              if (message.windowType === 'controller') {
                handlePlayerJoin(message.requestedRole, syncChannel, message.controllerId);
              }
              break;

            case 'playerAction':
              handlePlayerMove(message.role, message.move);
              break;

            case 'ping':
              syncChannel.send({ type: 'pong', windowType: 'tv' });
              break;
          }
        });

        console.log('[TvScreen] Ready and listening for players');
        setLoading(false);

        return () => {
          cleanup();
          syncChannel.close();
        };
      } catch (err) {
        console.error('[TvScreen] Initialization error:', err);
        setError(`Failed to initialize: ${err}`);
        setLoading(false);
      }
    }

    init();
  }, []);

  // Handle player joining
  const handlePlayerJoin = (requestedRole?: Role, syncChannel?: BroadcastSync, controllerId?: string) => {
    // Use functional state update to avoid race conditions
    setPlayers(prev => {
      // Get next available role based on CURRENT state
      const assignedRoles = prev.map(p => p.role);
      let assignedRole = requestedRole;

      if (!assignedRole) {
        // Auto-assign next available role
        if (!assignedRoles.includes('MrX')) {
          assignedRole = 'MrX';
        } else {
          const detectiveCount = assignedRoles.filter(r => r === 'Detective').length;
          if (detectiveCount < 3) {
            assignedRole = 'Detective';
          } else {
            const bobbyCount = assignedRoles.filter(r => r === 'Bobby').length;
            if (bobbyCount < 2) {
              assignedRole = 'Bobby';
            }
          }
        }
      }

      if (assignedRole) {
        const newPlayer: PlayerConfig = {
          role: assignedRole,
          name: assignedRole === 'MrX' ? 'Mr. X' : `${assignedRole}`,
          controller: 'human',
        };

        console.log(`[TvScreen] Assigned role: ${assignedRole} to controller: ${controllerId} (total players: ${prev.length + 1})`);

        // Notify specific controller of role assignment
        const channelToUse = syncChannel || sync || syncRef.current;
        channelToUse?.send({
          type: 'roleAssigned',
          role: assignedRole,
          controllerId: controllerId || 'unknown',
          windowId: 'temp',
        });

        return [...prev, newPlayer];
      } else {
        console.log('[TvScreen] No available roles');
        return prev;
      }
    });
  };

  // Start game
  const startGame = () => {
    if (!engine || players.length < 2) {
      setError('Need at least 2 players to start');
      return;
    }

    try {
      // Create initial game state
      const settings: GameSettings = {
        timingMode: 'unlimited',
        turnTime: 60,
        aiFallbackOnTimeout: 'forceAi',
        revealFrequency: 5,
        extraDetectiveTickets: 0,
        mrXTicketPenalty: 0,
        bobbiesMode: 'auto',
      };

      const initialState = engine.createInitialState(settings, players);
      setGameState(initialState);
      setIsGameStarted(true);

      // Broadcast game start to all controllers
      sync?.send({ type: 'gameStart', state: initialState });

      console.log('[TvScreen] Game started!', initialState);
    } catch (err) {
      console.error('[TvScreen] Error starting game:', err);
      setError(`Failed to start game: ${err}`);
    }
  };

  // Handle player move
  const handlePlayerMove = (role: Role, move: any) => {
    const gameEngine = engine || engineRef.current;
    const syncChannel = sync || syncRef.current;

    if (!gameState || !gameEngine) return;

    try {
      console.log(`[TvScreen] Applying move from ${role}:`, move);

      // Apply move to game state
      const result = gameEngine.applyMove(gameState, move);
      const newState = result.newState;

      setGameState(newState);

      // Broadcast updated state to all controllers
      syncChannel?.send({ type: 'stateUpdate', state: newState });

      console.log('[TvScreen] State updated, round:', newState.round);
    } catch (err) {
      console.error('[TvScreen] Error applying move:', err);
      setError(`Move failed: ${err}`);
    }
  };

  // Render loading screen
  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.waitingScreen}>
          <h1 style={styles.title}>Scotland Yard TV</h1>
          <p style={styles.subtitle}>Loading game engine...</p>
        </div>
      </div>
    );
  }

  // Render waiting screen
  if (!isGameStarted) {
    return (
      <div style={styles.container}>
        <div style={styles.waitingScreen}>
          <h1 style={styles.title}>Scotland Yard TV</h1>
          <p style={styles.subtitle}>Waiting for players...</p>

          <div style={styles.playerList}>
            <h2 style={styles.playerListTitle}>Players ({players.length})</h2>
            {players.map((player, index) => (
              <div key={index} style={styles.playerItem}>
                {player.role === 'MrX' ? '🎩' : '👮'} {player.name} ({player.role})
              </div>
            ))}
          </div>

          <button
            onClick={startGame}
            style={{
              ...styles.startButton,
              ...(players.length < 2 ? styles.buttonDisabled : {}),
            }}
            disabled={players.length < 2}
          >
            {players.length < 2
              ? 'Waiting for players...'
              : `Start Game (${players.length} players)`}
          </button>

          {error && <div style={styles.error}>{error}</div>}
        </div>
      </div>
    );
  }

  // Restart game
  const restartGame = () => {
    // Reset all state
    setGameState(null);
    setPlayers([]);
    setIsGameStarted(false);
    setError(null);

    // Broadcast restart to all controllers
    const syncChannel = sync || syncRef.current;
    syncChannel?.send({ type: 'gameStart', state: null as any });

    console.log('[TvScreen] Game restarted - waiting for players');
  };

  // Render game board
  return (
    <div style={styles.container}>
      <div style={styles.hud}>
        <div style={styles.hudItem}>
          <strong>Round:</strong> {gameState?.round || 0} / 24
        </div>
        <div style={styles.hudItem}>
          <strong>Current Turn:</strong> {gameState?.currentTurn || 'N/A'}
        </div>
        <div style={styles.hudItem}>
          <strong>Next Reveal:</strong>{' '}
          {gameState?.revealSchedule.find(r => r > (gameState?.round || 0)) || 'N/A'}
        </div>
        {gameState?.isGameOver && (
          <div style={styles.hudItem}>
            <strong>Winner:</strong> {gameState.winner}
          </div>
        )}
        <button
          onClick={restartGame}
          style={styles.restartButton}
          title="Restart game and return to waiting room"
        >
          🔄 Restart
        </button>
      </div>

      <div ref={boardRef} style={styles.boardContainer}>
        <img
          src="/board.png"
          alt="Scotland Yard Board"
          style={styles.boardImage}
        />

        <svg style={styles.boardOverlay}>
          {gameState?.players.map((player, index) => {
            // Only show position if revealed or for detectives
            const node = nodesData.find((n: any) => n.id === player.position);
            if (!node || player.position === 'unknown') return null;

            const color =
              player.role === 'MrX'
                ? '#ff0000'
                : player.role === 'Detective'
                  ? '#0000ff'
                  : '#00ff00';

            return (
              <circle
                key={index}
                cx={node.position.x}
                cy={node.position.y}
                r={15}
                fill={color}
                stroke="white"
                strokeWidth={3}
                opacity={player.role === gameState.currentTurn ? 1 : 0.7}
                style={{
                  animation:
                    player.role === gameState.currentTurn
                      ? 'pulse 1s infinite'
                      : 'none',
                }}
              />
            );
          })}
        </svg>
      </div>

      {error && <div style={styles.error}>{error}</div>}
    </div>
  );
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
    overflow: 'hidden',
  },
  waitingScreen: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    padding: '40px',
  },
  title: {
    fontSize: '48px',
    fontWeight: 'bold',
    margin: '0 0 16px 0',
  },
  subtitle: {
    fontSize: '24px',
    color: '#a0aec0',
    margin: '0 0 40px 0',
  },
  playerList: {
    background: '#2d3748',
    padding: '24px',
    borderRadius: '8px',
    minWidth: '300px',
    marginBottom: '24px',
  },
  playerListTitle: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '16px',
  },
  playerItem: {
    padding: '8px',
    margin: '4px 0',
    background: '#4a5568',
    borderRadius: '4px',
  },
  startButton: {
    padding: '16px 32px',
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
  hud: {
    display: 'flex',
    justifyContent: 'space-around',
    padding: '16px',
    background: '#2d3748',
    borderBottom: '2px solid #4a5568',
  },
  hudItem: {
    fontSize: '16px',
  },
  restartButton: {
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: '600',
    background: '#fc8181',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  boardContainer: {
    position: 'relative',
    flex: 1,
    overflow: 'auto',
  },
  boardImage: {
    width: '100%',
    height: 'auto',
    display: 'block',
  },
  boardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  },
  error: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    padding: '16px',
    background: '#fc8181',
    color: '#742a2a',
    borderRadius: '8px',
    maxWidth: '400px',
  },
};
