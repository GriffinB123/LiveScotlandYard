/**
 * Board graph representation for Scotland Yard.
 * 
 * Mirrors the Java Board interface from ZikZhao/Scotland-Yard-2024
 * with pre-computed BFS distances for O(1) AI heuristic lookups.
 */

import type { TicketType } from './types';

// ============================================================================
// GRAPH TYPES
// ============================================================================

/**
 * An edge connecting two nodes with a specific transport type
 */
export interface Edge {
  to: number;
  type: 'taxi' | 'bus' | 'underground'; // Black/doubleMove are not edge types
}

/**
 * A node on the Scotland Yard board
 */
export interface Node {
  id: number;
  position: { x: number; y: number }; // For rendering
  edges: Edge[];
}

// ============================================================================
// BOARD GRAPH CLASS
// ============================================================================

/**
 * Board graph with neighbor lookup and pre-computed distances.
 * 
 * Key optimization (from ZikZhao): Pre-compute BFS distances between all nodes
 * at construction time, enabling O(1) distance queries for AI heuristics.
 */
export class BoardGraph {
  private nodes: Map<number, Node>;
  private distanceCache: Map<string, number>;
  
  constructor(nodesData: Node[]) {
    // Build node map
    this.nodes = new Map(nodesData.map(node => [node.id, node]));
    
    // Pre-compute all shortest paths using BFS
    this.distanceCache = this.precomputeDistances();
  }
  
  /**
   * Get a node by ID
   */
  getNode(nodeId: number): Node | undefined {
    return this.nodes.get(nodeId);
  }
  
  /**
   * Get all node IDs in the graph
   */
  getAllNodeIds(): number[] {
    return Array.from(this.nodes.keys());
  }
  
  /**
   * Get neighbors reachable from a node using a specific ticket type.
   * For black tickets, returns neighbors for ALL transport types.
   */
  getNeighbors(nodeId: number, ticketType: TicketType): number[] {
    const node = this.nodes.get(nodeId);
    if (!node) return [];
    
    if (ticketType === 'black') {
      // Black tickets can use any transport edge
      return node.edges.map(e => e.to);
    } else if (ticketType === 'doubleMove') {
      // DoubleMove is not a transport type; this shouldn't be called directly
      return [];
    } else {
      // Standard ticket: filter edges by type
      return node.edges
        .filter(e => e.type === ticketType)
        .map(e => e.to);
    }
  }
  
  /**
   * Get all neighbors reachable from a node (any transport type)
   */
  getAllNeighbors(nodeId: number): number[] {
    const node = this.nodes.get(nodeId);
    if (!node) return [];
    return node.edges.map(e => e.to);
  }
  
  /**
   * Get shortest path distance between two nodes.
   * Returns Infinity if no path exists.
   * 
   * O(1) lookup using pre-computed cache (critical for AI performance)
   */
  getDistance(from: number, to: number): number {
    if (from === to) return 0;
    return this.distanceCache.get(this.distanceKey(from, to)) ?? Infinity;
  }
  
  /**
   * Check if two nodes are adjacent (have a direct edge)
   */
  areAdjacent(from: number, to: number): boolean {
    const node = this.nodes.get(from);
    if (!node) return false;
    return node.edges.some(e => e.to === to);
  }
  
  /**
   * Get the transport type of an edge between two nodes.
   * Returns undefined if no direct edge exists.
   * If multiple edges exist (e.g., taxi and bus), returns the first found.
   */
  getEdgeType(from: number, to: number): 'taxi' | 'bus' | 'underground' | undefined {
    const node = this.nodes.get(from);
    if (!node) return undefined;
    const edge = node.edges.find(e => e.to === to);
    return edge?.type;
  }
  
  // ========================================================================
  // PRIVATE METHODS
  // ========================================================================
  
  /**
   * Create a cache key for distance lookup
   */
  private distanceKey(from: number, to: number): string {
    return `${from}-${to}`;
  }
  
  /**
   * Pre-compute shortest distances between all pairs of nodes using BFS.
   * This is expensive (O(V * (V + E))) but only done once at initialization.
   * 
   * Critical optimization from ZikZhao's implementation: allows O(1) distance
   * lookups during AI minimax search, which queries distances thousands of times.
   */
  private precomputeDistances(): Map<string, number> {
    const cache = new Map<string, number>();
    const allNodes = Array.from(this.nodes.keys());
    
    // Run BFS from each node
    for (const startNode of allNodes) {
      const distances = this.bfsDistances(startNode);
      
      // Store results in cache
      for (const [targetNode, distance] of distances) {
        cache.set(this.distanceKey(startNode, targetNode), distance);
      }
    }
    
    return cache;
  }
  
  /**
   * Run BFS from a single source node to find shortest distances to all reachable nodes
   */
  private bfsDistances(source: number): Map<number, number> {
    const distances = new Map<number, number>();
    const queue: number[] = [source];
    distances.set(source, 0);
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      const currentDistance = distances.get(current)!;
      
      // Explore all neighbors
      const neighbors = this.getAllNeighbors(current);
      for (const neighbor of neighbors) {
        if (!distances.has(neighbor)) {
          distances.set(neighbor, currentDistance + 1);
          queue.push(neighbor);
        }
      }
    }
    
    return distances;
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Load board graph from JSON data (typically from assets/board/nodes_board_highres.json)
 */
export function loadBoardGraph(nodesJson: Node[]): BoardGraph {
  return new BoardGraph(nodesJson);
}
