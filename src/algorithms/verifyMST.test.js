import { describe, it, expect } from 'vitest';
import { primMST } from './prim.js';
import { kruskalMST } from './kruskal.js';
import { bruteForceMSTCost, verifyMSTResult } from './verifyMST.js';
import { sampleLocations, sampleRoutes } from '../data/sampleData.js';

const vertices = ['A', 'B', 'C', 'D'];
const edges = [
  { id: 'e1', source: 'A', target: 'B', cost: 1 },
  { id: 'e2', source: 'B', target: 'C', cost: 2 },
  { id: 'e3', source: 'C', target: 'D', cost: 3 },
  { id: 'e4', source: 'A', target: 'D', cost: 10 },
  { id: 'e5', source: 'B', target: 'D', cost: 8 },
];

describe('MST verification', () => {
  it('brute force finds the same optimum as Prim and Kruskal', () => {
    expect(bruteForceMSTCost(vertices, edges)).toBe(6);
    expect(primMST(vertices, edges).totalCost).toBe(6);
    expect(kruskalMST(vertices, edges).totalCost).toBe(6);
  });

  it('validates both algorithm outputs on the sample network', () => {
    const prim = verifyMSTResult(sampleLocations, sampleRoutes, primMST(sampleLocations, sampleRoutes));
    const kruskal = verifyMSTResult(sampleLocations, sampleRoutes, kruskalMST(sampleLocations, sampleRoutes));
    expect(prim.valid).toBe(true);
    expect(kruskal.valid).toBe(true);
    expect(prim.checks.find((c) => c.label.startsWith('Minimum'))?.ok).toBe(true);
  });

  it('does not falsely validate a disconnected forest as a complete MST', () => {
    const vs = ['A', 'B', 'C', 'D'];
    const es = [
      { id: 'x', source: 'A', target: 'B', cost: 2 },
      { id: 'y', source: 'C', target: 'D', cost: 3 },
    ];
    const result = primMST(vs, es);
    const verification = verifyMSTResult(vs, es, result);
    expect(result.connected).toBe(false);
    expect(verification.valid).toBe(true);
    expect(verification.checks.find((c) => c.label === 'Connectivity is correct').ok).toBe(true);
  });

  it('rejects a result whose reported cost does not match its edges', () => {
    const result = { ...primMST(vertices, edges), totalCost: 999 };
    expect(verifyMSTResult(vertices, edges, result).valid).toBe(false);
  });
});
