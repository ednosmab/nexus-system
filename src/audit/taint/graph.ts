/**
 * graph.ts — Data Flow Graph
 *
 * Represents the flow of data through the application as a directed graph.
 * Nodes represent variables, assignments, and function calls.
 * Edges represent data flow between them.
 */

import type { TaintNode, TaintEdge } from "./types.js";

export class DataFlowGraph {
  private nodes: Map<string, TaintNode> = new Map();
  private edges: TaintEdge[] = [];
  private adjacency: Map<string, string[]> = new Map();
  private reverseAdjacency: Map<string, string[]> = new Map();

  addNode(node: TaintNode): void {
    this.nodes.set(node.id, node);
    if (!this.adjacency.has(node.id)) this.adjacency.set(node.id, []);
    if (!this.reverseAdjacency.has(node.id)) this.reverseAdjacency.set(node.id, []);
  }

  addEdge(edge: TaintEdge): void {
    this.edges.push(edge);

    const adj = this.adjacency.get(edge.from);
    if (adj) adj.push(edge.to);

    const revAdj = this.reverseAdjacency.get(edge.to);
    if (revAdj) revAdj.push(edge.from);

    // Ensure both nodes exist in adjacency maps
    if (!this.adjacency.has(edge.to)) this.adjacency.set(edge.to, []);
    if (!this.reverseAdjacency.has(edge.from)) this.reverseAdjacency.set(edge.from, []);
  }

  getNode(id: string): TaintNode | undefined {
    return this.nodes.get(id);
  }

  getEdges(): TaintEdge[] {
    return this.edges;
  }

  getNodes(): TaintNode[] {
    return Array.from(this.nodes.values());
  }

  /** Get all nodes reachable from a given node (forward traversal) */
  getReachable(nodeId: string, maxDepth: number = 20): string[] {
    const visited = new Set<string>();
    const result: string[] = [];
    const queue: { id: string; depth: number }[] = [{ id: nodeId, depth: 0 }];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current.id) || current.depth > maxDepth) continue;
      visited.add(current.id);
      if (current.id !== nodeId) result.push(current.id);

      const neighbors = this.adjacency.get(current.id);
      if (neighbors) {
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            queue.push({ id: neighbor, depth: current.depth + 1 });
          }
        }
      }
    }

    return result;
  }

  /** Get all nodes that can reach a given node (backward traversal) */
  getReachers(nodeId: string, maxDepth: number = 20): string[] {
    const visited = new Set<string>();
    const result: string[] = [];
    const queue: { id: string; depth: number }[] = [{ id: nodeId, depth: 0 }];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current.id) || current.depth > maxDepth) continue;
      visited.add(current.id);
      if (current.id !== nodeId) result.push(current.id);

      const predecessors = this.reverseAdjacency.get(current.id);
      if (predecessors) {
        for (const pred of predecessors) {
          if (!visited.has(pred)) {
            queue.push({ id: pred, depth: current.depth + 1 });
          }
        }
      }
    }

    return result;
  }

  /** Find path from source to sink using BFS */
  findPath(sourceId: string, sinkId: string): string[] | null {
    const visited = new Set<string>();
    const parent: Map<string, string> = new Map();
    const queue = [sourceId];
    visited.add(sourceId);

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === sinkId) {
        // Reconstruct path
        const path: string[] = [];
        let node: string | undefined = sinkId;
        while (node && node !== sourceId) {
          path.unshift(node);
          node = parent.get(node);
        }
        path.unshift(sourceId);
        return path;
      }

      const neighbors = this.adjacency.get(current);
      if (neighbors) {
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            parent.set(neighbor, current);
            queue.push(neighbor);
          }
        }
      }
    }

    return null;
  }

  /** Get statistics about the graph */
  getStats(): { nodeCount: number; edgeCount: number; sources: number; sinks: number } {
    const nodes = Array.from(this.nodes.values());
    return {
      nodeCount: nodes.length,
      edgeCount: this.edges.length,
      sources: nodes.filter((n) => n.kind === "source").length,
      sinks: nodes.filter((n) => n.kind === "sink").length,
    };
  }
}
