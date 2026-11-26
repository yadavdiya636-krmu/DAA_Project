import { describe, it, expect } from 'vitest';
import { primMST } from './prim.js';

const vertices = ['A', 'B', 'C', 'D'];
const edges = [
  { id: 'e1', source: 'A', target: 'B', cost: 1 },
  { id: 'e2', source: 'B', target: 'C', cost: 2 },
  { id: 'e3', source: 'C', target: 'D', cost: 3 },
  { id: 'e4', source: 'A', target: 'D', cost: 10 },
  { id: 'e5', source: 'B', target: 'D', cost: 8 },
];

describe('Prim’s algorithm', () => {
  it('finds a minimum spanning tree for a connected graph', () => {
    const result = primMST(vertices, edges);
    expect(result.connected).toBe(true);
    expect(result.totalCost).toBe(6);
    expect(result.mstEdgeIds).toHaveLength(3);
    expect(result.verticesConnected.sort()).toEqual(['A', 'B', 'C', 'D']);
    expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);
    expect(result.iterations).toBe(3);
  });

  it('produces real step data including candidates and selection', () => {
    const result = primMST(vertices, edges);
    expect(result.steps.length).toBeGreaterThan(6);
    expect(result.steps[0].phase).toBe('init');
    expect(result.steps.at(-1).phase).toBe('done');
    expect(result.steps.some((step) => step.phase === 'candidate' && step.candidateEdgeIds.length > 0)).toBe(true);
    expect(result.steps.some((step) => step.phase === 'select' && step.mstEdgeIds.length === 3)).toBe(true);
  });

  it('respects a chosen start vertex', () => {
    const result = primMST(vertices, edges, { startVertexId: 'D' });
    expect(result.startVertexId).toBe('D');
    expect(result.totalCost).toBe(6);
  });

  it('handles empty and single-vertex graphs', () => {
    expect(primMST([], []).totalCost).toBe(0);
    expect(primMST([], []).connected).toBe(true);
    const single = primMST(['A'], [{ id: 'x', source: 'A', target: 'Z', cost: 5 }]);
    expect(single.connected).toBe(true);
    expect(single.mstEdgeIds).toHaveLength(0);
  });

  it('detects disconnected components without claiming a complete MST', () => {
    const result = primMST(['A', 'B', 'C', 'D'], [
      { id: 'e1', source: 'A', target: 'B', cost: 1 },
      { id: 'e2', source: 'C', target: 'D', cost: 1 },
    ]);
    expect(result.connected).toBe(false);
    expect(result.components).toHaveLength(2);
    expect(result.mstEdgeIds).toHaveLength(1);
    expect(result.steps.some((step) => step.phase === 'stop')).toBe(true);
  });

  it('ignores invalid vertex references, self loops and negative weights', () => {
    const result = primMST(['A', 'B'], [
      { id: 'bad1', source: 'A', target: 'Z', cost: 1 },
      { id: 'bad2', source: 'A', target: 'A', cost: 1 },
      { id: 'bad3', source: 'A', target: 'B', cost: -5 },
      { id: 'ok', source: 'A', target: 'B', cost: 7 },
    ]);
    expect(result.totalCost).toBe(7);
    expect(result.mstEdgeIds).toEqual(['ok']);
  });

  it('handles equal-weight edges', () => {
    const result = primMST(['A', 'B', 'C'], [
      { id: 'x', source: 'A', target: 'B', cost: 5 },
      { id: 'y', source: 'B', target: 'C', cost: 5 },
      { id: 'z', source: 'A', target: 'C', cost: 5 },
    ]);
    expect(result.totalCost).toBe(10);
    expect(result.mstEdgeIds).toHaveLength(2);
  });
});
