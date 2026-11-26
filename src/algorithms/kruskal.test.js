import { describe, it, expect } from 'vitest';
import { kruskalMST } from './kruskal.js';

const vertices = ['A', 'B', 'C', 'D'];
const edges = [
  { id: 'e1', source: 'A', target: 'B', cost: 1 },
  { id: 'e2', source: 'B', target: 'C', cost: 2 },
  { id: 'e3', source: 'C', target: 'D', cost: 3 },
  { id: 'e4', source: 'A', target: 'D', cost: 10 },
  { id: 'e5', source: 'B', target: 'D', cost: 8 },
];

describe('Kruskal’s algorithm', () => {
  it('finds a minimum spanning tree using Union-Find', () => {
    const result = kruskalMST(vertices, edges);
    expect(result.connected).toBe(true);
    expect(result.totalCost).toBe(6);
    expect(result.mstEdgeIds).toEqual(['e1', 'e2', 'e3']);
    expect(result.iterations).toBe(5);
    expect(result.rejectedEdgeIds).toEqual(['e5', 'e4']);
    expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);
  });

  it('records sorted edges, candidates, accepted and rejected edges', () => {
    const result = kruskalMST(['A', 'B', 'C'], [
      { id: 'a', source: 'A', target: 'B', cost: 1 },
      { id: 'b', source: 'B', target: 'C', cost: 2 },
      { id: 'c', source: 'A', target: 'C', cost: 3 },
    ]);
    expect(result.sortedEdgeIds).toEqual(['a', 'b', 'c']);
    expect(result.rejectedEdgeIds).toEqual(['c']);
    expect(result.steps.some((step) => step.phase === 'reject')).toBe(true);
    expect(result.steps.some((step) => step.phase === 'select')).toBe(true);
    expect(result.steps[0].sortedEdgeIds).toEqual(['a', 'b', 'c']);
  });

  it('handles empty and single-vertex graphs', () => {
    expect(kruskalMST([], []).connected).toBe(true);
    expect(kruskalMST(['A'], []).totalCost).toBe(0);
  });

  it('detects disconnected graphs', () => {
    const result = kruskalMST(['A', 'B', 'C', 'D'], [
      { id: 'e1', source: 'A', target: 'B', cost: 1 },
      { id: 'e2', source: 'C', target: 'D', cost: 2 },
    ]);
    expect(result.connected).toBe(false);
    expect(result.components).toHaveLength(2);
    expect(result.mstEdgeIds).toHaveLength(2);
  });

  it('ignores duplicate, invalid and negative edges', () => {
    const result = kruskalMST(['A', 'B'], [
      { id: 'dup1', source: 'A', target: 'B', cost: 4 },
      { id: 'dup2', source: 'B', target: 'A', cost: 9 },
      { id: 'bad', source: 'A', target: 'Z', cost: 1 },
      { id: 'neg', source: 'A', target: 'B', cost: -2 },
    ]);
    expect(result.totalCost).toBe(4);
    expect(result.mstEdgeIds).toEqual(['dup1']);
  });

  it('matches Prim on equal-weight alternatives', () => {
    const edgesEqual = [
      { id: 'x', source: 'A', target: 'B', cost: 5 },
      { id: 'y', source: 'B', target: 'C', cost: 5 },
      { id: 'z', source: 'A', target: 'C', cost: 5 },
    ];
    expect(kruskalMST(['A', 'B', 'C'], edgesEqual).totalCost).toBe(10);
  });
});
