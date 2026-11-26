import { describe, it, expect } from 'vitest';
import { edgeKey, getConnectedComponents, validateLocationInput, validateRouteInput, cleanEdges } from './graphUtils.js';

describe('Graph utilities and validation', () => {
  const locations = [
    { id: 'L1', name: 'Warehouse A', code: 'WA-01', city: 'Boston', type: 'Warehouse' },
    { id: 'L2', name: 'Hub B', code: 'HB-02', city: 'Austin', type: 'Delivery Hub' },
    { id: 'L3', name: 'Store C', code: 'SC-03', city: 'Austin', type: 'Retail Store' },
  ];

  it('uses symmetric keys for undirected edges', () => {
    expect(edgeKey('L1', 'L2')).toBe(edgeKey('L2', 'L1'));
  });

  it('detects connected components', () => {
    expect(getConnectedComponents(locations, [{ id: 'r1', source: 'L1', target: 'L2', cost: 1 }])).toHaveLength(2);
    expect(getConnectedComponents(locations, [
      { id: 'r1', source: 'L1', target: 'L2', cost: 1 },
      { id: 'r2', source: 'L2', target: 'L3', cost: 1 },
    ])).toHaveLength(1);
  });

  it('filters invalid edges before algorithms run', () => {
    const cleaned = cleanEdges(locations, [
      { id: 'ok', source: 'L1', target: 'L2', cost: 5 },
      { id: 'self', source: 'L1', target: 'L1', cost: 5 },
      { id: 'missing', source: 'L1', target: 'ZZ', cost: 5 },
      { id: 'negative', source: 'L1', target: 'L3', cost: -1 },
      { id: 'dup', source: 'L2', target: 'L1', cost: 9 },
    ]);
    expect(cleaned.map((edge) => edge.id)).toEqual(['ok']);
  });

  it('validates required location fields and duplicate codes', () => {
    const valid = { name: 'New Hub', code: 'NH-09', city: 'Denver', type: 'Delivery Hub' };
    expect(validateLocationInput(valid, locations)).toEqual({});
    expect(validateLocationInput({ ...valid, code: 'WA-01' }, locations).code).toMatch(/already in use/);
    expect(validateLocationInput({ ...valid, name: '' }, locations).name).toBeTruthy();
    expect(validateLocationInput({ ...valid, code: 'x!' }, locations).code).toBeTruthy();
    expect(validateLocationInput({ ...valid, code: 'WA-01' }, locations, 'L1')).toEqual({});
  });

  it('validates route endpoints, positivity and duplicates', () => {
    const routes = [{ id: 'R1', source: 'L1', target: 'L2', cost: 10, distance: 20, type: 'Highway' }];
    const input = (patch) => ({ source: 'L1', target: 'L3', distance: 30, cost: 12, type: 'Local', routes, ...patch });
    expect(validateRouteInput(input(), locations)).toEqual({});
    expect(validateRouteInput(input({ source: 'L2', target: 'L1' }), locations).target).toMatch(/already exists/);
    expect(validateRouteInput(input({ source: 'L1', target: 'L1' }), locations).target).toMatch(/must differ/);
    expect(validateRouteInput(input({ source: 'ZZ' }), locations).source).toBeTruthy();
    expect(validateRouteInput(input({ cost: 0 }), locations).cost).toBeTruthy();
    expect(validateRouteInput(input({ cost: -3 }), locations).cost).toBeTruthy();
    expect(validateRouteInput(input({ distance: -1 }), locations).distance).toBeTruthy();
    expect(validateRouteInput(input({ cost: 'abc' }), locations).cost).toBeTruthy();
  });
});
