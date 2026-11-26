import { describe, it, expect } from 'vitest';
import { DisjointSet, createDisjointSet, find, union } from './disjointSet.js';

describe('Disjoint Set Union', () => {
  it('starts with each item in its own set', () => {
    const set = createDisjointSet(['A', 'B', 'C']);
    expect(set.count).toBe(3);
    expect(set.find('A')).toBe('A');
    expect(set.connected('A', 'B')).toBe(false);
  });

  it('merges sets and ignores duplicate unions', () => {
    const set = new DisjointSet(['A', 'B', 'C']);
    expect(union(set, 'A', 'B')).toBe(true);
    expect(union(set, 'A', 'B')).toBe(false);
    expect(set.connected('A', 'B')).toBe(true);
    expect(set.count).toBe(2);
    expect(find(set, 'A')).toBe(find(set, 'B'));
  });

  it('compresses paths', () => {
    const set = new DisjointSet(['A', 'B', 'C', 'D']);
    set.union('A', 'B');
    set.union('B', 'C');
    set.union('C', 'D');
    const root = set.find('D');
    expect(set.find('A')).toBe(root);
    expect(set.parent.get('A')).toBe(root);
  });

  it('reports components correctly', () => {
    const set = new DisjointSet(['A', 'B', 'C', 'D']);
    set.union('A', 'B');
    set.union('C', 'D');
    expect(set.getComponents().map((c) => [...c].sort())).toEqual([['A', 'B'], ['C', 'D']]);
    expect(set.has('Z')).toBe(false);
    expect(set.union('A', 'Z')).toBe(false);
  });
});
