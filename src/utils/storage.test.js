import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  STORAGE_KEYS, DEFAULT_SETTINGS, readJSON, writeJSON, removeKey,
  clearApplicationData, sanitizeStoredData,
} from './storage.js';

function createStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key),
    get size() { return data.size; },
  };
}

describe('LocalStorage helpers', () => {
  let storage;

  beforeEach(() => {
    storage = createStorage();
    vi.stubGlobal('window', { localStorage: storage });
  });

  it('reads and writes versioned JSON values', () => {
    expect(writeJSON(STORAGE_KEYS.locations, [{ id: 'L1' }])).toBe(true);
    expect(storage.getItem('routewise.v1.locations')).toBe('[{"id":"L1"}]');
    expect(readJSON(STORAGE_KEYS.locations, [])).toEqual([{ id: 'L1' }]);
  });

  it('falls back on missing or corrupt data', () => {
    expect(readJSON('missing', 'fallback')).toBe('fallback');
    storage.setItem('broken', '{not json');
    expect(readJSON('broken', { safe: true })).toEqual({ safe: true });
    storage.setItem('null-value', 'null');
    expect(readJSON('null-value', 42)).toBe(42);
  });

  it('survives unavailable storage', () => {
    vi.stubGlobal('window', { get localStorage() { throw new Error('blocked'); } });
    expect(writeJSON('x', 1)).toBe(false);
    expect(readJSON('x', 'safe')).toBe('safe');
    expect(() => removeKey('x')).not.toThrow();
  });

  it('removes only application keys on clear', () => {
    storage.setItem('other-app', 'keep');
    Object.values(STORAGE_KEYS).forEach((key) => storage.setItem(key, 'value'));
    clearApplicationData();
    expect(storage.getItem('other-app')).toBe('keep');
    Object.values(STORAGE_KEYS).forEach((key) => expect(storage.getItem(key)).toBeNull());
  });

  it('sanitizes corrupt stored state without throwing', () => {
    const safe = sanitizeStoredData({
      locations: [
        { id: 'L1', name: 'A', code: 'A1', city: 'X', type: 'Hub' },
        { id: 42, name: 'Invalid' },
      ],
      routes: [
        { id: 'R1', source: 'L1', target: 'L1', cost: 5 },
        { id: 'R2', source: 'L1', target: 'MISSING', cost: 5 },
        { id: 'R3', source: 'L1', target: 'MISSING', cost: -5 },
      ],
      positions: { L1: { x: 10, y: 20 }, L2: { x: 'bad', y: 4 } },
      mstResults: { prim: { mstEdgeIds: [] }, broken: null },
      activities: [{ message: 'kept' }, 'bad'],
      settings: { theme: 'dark', simulationDefaults: { vertexCount: 5 } },
    });
    expect(safe.locations).toHaveLength(1);
    expect(safe.routes).toEqual([]);
    expect(safe.positions).toEqual({ L1: { x: 10, y: 20 } });
    expect(Object.keys(safe.mstResults)).toEqual(['prim']);
    expect(safe.activities).toEqual([{ message: 'kept' }]);
    expect(safe.settings.theme).toBe('dark');
    expect(safe.settings.animationSpeed).toBe(DEFAULT_SETTINGS.animationSpeed);
    expect(safe.settings.simulationDefaults.vertexCount).toBe(5);
    expect(safe.settings.simulationDefaults.seed).toBe(DEFAULT_SETTINGS.simulationDefaults.seed);
  });

  it('replaces malformed top-level values with safe defaults', () => {
    const safe = sanitizeStoredData({ locations: null, routes: 'oops', positions: [], mstResults: 7, activities: {}, settings: false });
    expect(safe).toEqual({
      locations: [], routes: [], positions: {}, mstResults: {}, activities: [], settings: DEFAULT_SETTINGS,
    });
  });
});
