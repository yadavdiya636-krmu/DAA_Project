import { describe, expect, it } from 'vitest';
import { createRandom, generateNetwork, hashSeed } from './dataGenerator.js';
import { primMST } from '../algorithms/prim.js';
import { kruskalMST } from '../algorithms/kruskal.js';

const config = {
  vertexCount: 7, routeCount: 12, minWeight: 10, maxWeight: 80, seed: 'capstone-test',
};

describe('Synthetic network generator', () => {
  it('hashes seeds and produces a deterministic PRNG sequence', () => {
    expect(hashSeed('abc')).toBe(hashSeed('abc'));
    expect(hashSeed('abc')).not.toBe(hashSeed('abd'));
    const a = createRandom(1234);
    const b = createRandom(1234);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('reproduces identical networks from the same seed', () => {
    expect(generateNetwork(config)).toEqual(generateNetwork(config));
    expect(generateNetwork({ ...config, seed: 'different' }).routes).not.toEqual(generateNetwork(config).routes);
  });

  it('generates valid, unique, connected weighted networks', () => {
    const network = generateNetwork(config);
    expect(network.locations).toHaveLength(7);
    expect(network.routes).toHaveLength(12);
    const ids = new Set(network.locations.map((l) => l.id));
    expect(ids.size).toBe(7);
    network.routes.forEach((edge) => {
      expect(ids.has(edge.source)).toBe(true);
      expect(ids.has(edge.target)).toBe(true);
      expect(edge.source).not.toBe(edge.target);
      expect(edge.cost).toBeGreaterThanOrEqual(10);
      expect(edge.cost).toBeLessThanOrEqual(80);
    });
    expect(new Set(network.routes.map((edge) => [edge.source, edge.target].sort().join('|'))).size).toBe(12);
    expect(primMST(network.locations, network.routes).connected).toBe(true);
  });

  it('clamps valid sizes, falls back on invalid values and handles a zero weight range', () => {
    // Invalid values (0 / NaN) fall back to defaults; out-of-range values are clamped.
    const fallback = generateNetwork({ vertexCount: 0, routeCount: 99, minWeight: 5, maxWeight: 5, seed: 'x' });
    expect(fallback.locations).toHaveLength(8);
    expect(fallback.routes).toHaveLength(28); // complete graph for 8 vertices
    expect(fallback.routes.every((edge) => edge.cost === 5)).toBe(true);
    const tiny = generateNetwork({ vertexCount: 2, routeCount: 99, minWeight: 5, maxWeight: 5, seed: 'x' });
    expect(tiny.locations).toHaveLength(2);
    expect(tiny.routes).toHaveLength(1);
    const large = generateNetwork({ vertexCount: 100, routeCount: 1, seed: 'x' });
    expect(large.locations).toHaveLength(14);
    expect(large.routes.length).toBeGreaterThanOrEqual(13);
  });

  it('gives both algorithms the same optimal cost on generated networks', () => {
    const network = generateNetwork({ ...config, seed: 'comparison-seed' });
    const prim = primMST(network.locations, network.routes);
    const kruskal = kruskalMST(network.locations, network.routes);
    expect(prim.connected).toBe(true);
    expect(kruskal.connected).toBe(true);
    expect(kruskal.totalCost).toBe(prim.totalCost);
    expect(kruskal.mstEdgeIds).toHaveLength(network.locations.length - 1);
  });
});
