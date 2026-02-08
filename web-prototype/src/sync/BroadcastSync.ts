/**
 * BroadcastChannel-based sync layer for multi-window communication
 *
 * Enables real-time communication between TV window (authoritative) and
 * controller windows (thin clients) within a single browser instance.
 */

import type { GameState, Move, Role } from '../game/types';

// ============================================================================
// MESSAGE TYPES
// ============================================================================

export type SyncMessage =
  | { type: 'stateUpdate'; state: GameState }
  | { type: 'playerAction'; role: Role; move: Move }
  | { type: 'join'; windowType: 'tv' | 'controller'; requestedRole?: Role; controllerId?: string }
  | { type: 'roleAssigned'; role: Role; windowId: string; controllerId?: string }
  | { type: 'availableRoles'; roles: Role[] }
  | { type: 'gameStart'; state: GameState }
  | { type: 'ping' }
  | { type: 'pong'; windowType: 'tv' | 'controller' };

export type MessageHandler = (message: SyncMessage) => void;

// ============================================================================
// BROADCASTSYNC CLASS
// ============================================================================

/**
 * Manages BroadcastChannel communication for multi-window sync
 */
export class BroadcastSync {
  private channel: BroadcastChannel;
  private handlers: Set<MessageHandler> = new Set();
  private windowId: string;

  constructor(channelName: string = 'scotland-yard-sync') {
    this.channel = new BroadcastChannel(channelName);
    this.windowId = this.generateWindowId();

    // Set up message receiver
    this.channel.onmessage = (event) => {
      this.handleMessage(event.data);
    };

    // Handle channel errors
    this.channel.onmessageerror = (error) => {
      console.error('BroadcastChannel message error:', error);
    };

    console.log(`[BroadcastSync] Initialized with windowId: ${this.windowId}`);
  }

  /**
   * Generate unique window ID for this instance
   */
  private generateWindowId(): string {
    return `window-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Send a message to all other windows
   */
  send(message: SyncMessage): void {
    try {
      console.log(`[BroadcastSync] Sending:`, message.type, message);
      this.channel.postMessage(message);
    } catch (error) {
      console.error('[BroadcastSync] Error sending message:', error);
      throw new Error(`Failed to send message: ${error}`);
    }
  }

  /**
   * Handle incoming message
   */
  private handleMessage(data: unknown): void {
    try {
      // Validate message structure
      if (!data || typeof data !== 'object' || !('type' in data)) {
        console.warn('[BroadcastSync] Invalid message format:', data);
        return;
      }

      const message = data as SyncMessage;
      console.log(`[BroadcastSync] Received:`, message.type);

      // Notify all registered handlers
      this.handlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error('[BroadcastSync] Error in message handler:', error);
        }
      });
    } catch (error) {
      console.error('[BroadcastSync] Error handling message:', error);
    }
  }

  /**
   * Register a message handler
   * @returns Cleanup function to remove handler
   */
  onMessage(handler: MessageHandler): () => void {
    this.handlers.add(handler);
    console.log(`[BroadcastSync] Handler registered (total: ${this.handlers.size})`);

    // Return cleanup function
    return () => {
      this.handlers.delete(handler);
      console.log(`[BroadcastSync] Handler removed (remaining: ${this.handlers.size})`);
    };
  }

  /**
   * Close the channel and cleanup
   */
  close(): void {
    console.log(`[BroadcastSync] Closing channel for window ${this.windowId}`);
    this.handlers.clear();
    this.channel.close();
  }

  /**
   * Get this window's unique ID
   */
  getWindowId(): string {
    return this.windowId;
  }

  /**
   * Check if BroadcastChannel is supported
   */
  static isSupported(): boolean {
    return typeof BroadcastChannel !== 'undefined';
  }
}

// ============================================================================
// HELPER: CREATE SYNC INSTANCE
// ============================================================================

/**
 * Create a new BroadcastSync instance with error handling
 */
export function createSync(channelName?: string): BroadcastSync {
  if (!BroadcastSync.isSupported()) {
    throw new Error('BroadcastChannel is not supported in this browser');
  }

  return new BroadcastSync(channelName);
}
