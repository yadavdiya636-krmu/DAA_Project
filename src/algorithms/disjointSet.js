/**
 * Disjoint Set Union (Union-Find) implemented from scratch.
 * Uses path compression in find() and union by rank (with size tie-breaking).
 */

export class DisjointSet {
  constructor(items = []) {
    this.parent = new Map();
    this.rank = new Map();
    this.size = new Map();
    this.count = 0;

    for (const item of items) {
      const key = typeof item === 'string' ? item : item.id;
      if (key === undefined || this.parent.has(key)) continue;
      this.parent.set(key, key);
      this.rank.set(key, 0);
      this.size.set(key, 1);
      this.count += 1;
    }
  }

  has(item) {
    return this.parent.has(typeof item === 'string' ? item : item.id);
  }

  /** Find the representative of a set with full path compression. */
  find(item) {
    const key = typeof item === 'string' ? item : item.id;
    if (!this.parent.has(key)) return undefined;
    if (this.parent.get(key) !== key) {
      this.parent.set(key, this.find(this.parent.get(key)));
    }
    return this.parent.get(key);
  }

  connected(a, b) {
    const rootA = this.find(a);
    const rootB = this.find(b);
    return rootA !== undefined && rootA === rootB;
  }

  /** Union by rank. Returns true when two distinct sets were merged. */
  union(a, b) {
    let rootA = this.find(a);
    let rootB = this.find(b);
    if (rootA === undefined || rootB === undefined || rootA === rootB) return false;

    if (this.rank.get(rootA) < this.rank.get(rootB)) {
      [rootA, rootB] = [rootB, rootA];
    }
    this.parent.set(rootB, rootA);
    this.size.set(rootA, this.size.get(rootA) + this.size.get(rootB));

    if (this.rank.get(rootA) === this.rank.get(rootB)) {
      this.rank.set(rootA, this.rank.get(rootA) + 1);
    }
    this.count -= 1;
    return true;
  }

  getComponents() {
    const groups = new Map();
    for (const key of this.parent.keys()) {
      const root = this.find(key);
      if (!groups.has(root)) groups.set(root, []);
      groups.get(root).push(key);
    }
    return [...groups.values()];
  }
}

export function createDisjointSet(items = []) {
  return new DisjointSet(items);
}

export function find(set, item) {
  return set.find(item);
}

export function union(set, a, b) {
  return set.union(a, b);
}
