import { edgeKey } from './graphUtils.js';
import { LOCATION_TYPES, ROUTE_TYPES } from '../data/sampleData.js';

/** Deterministic PRNG (mulberry32) so a seed always reproduces the same network. */
export function createRandom(seed) {
  let state = seed >>> 0;
  return function random() {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CITY_NAMES = [
  'Springfield', 'Riverton', 'Northfield', 'Lakeview', 'Greenville', 'Fairview', 'Brighton',
  'Westport', 'Harbor City', 'Maple Ridge', 'Stonebridge', 'Eastvale', 'Pinecrest', 'Redwood',
];
const NAME_PREFIXES = ['Central', 'North', 'South', 'East', 'West', 'Airport', 'Riverside', 'Harbor', 'Summit', 'Industrial'];
const NAME_SUFFIXES = ['Hub', 'Depot', 'Center', 'Store', 'Zone', 'Terminal', 'Outlet', 'Warehouse'];

export function generateNetwork(config = {}) {
  const vertexCount = Math.max(2, Math.min(14, Math.floor(Number(config.vertexCount) || 8)));
  const maxEdges = (vertexCount * (vertexCount - 1)) / 2;
  const desiredEdges = Math.min(maxEdges, Math.max(vertexCount - 1, Math.floor(Number(config.routeCount) || vertexCount + 2)));
  let minWeight = Math.max(1, Math.floor(Number(config.minWeight) || 10));
  let maxWeight = Math.max(minWeight, Math.floor(Number(config.maxWeight) || 250));
  const rawSeed = String(config.seed ?? '').trim();
  const seed = rawSeed === '' ? Math.floor(Math.random() * 2 ** 31) : hashSeed(rawSeed);
  const random = createRandom(seed);

  const locations = Array.from({ length: vertexCount }, (_, index) => {
    const prefix = NAME_PREFIXES[index % NAME_PREFIXES.length];
    const suffix = NAME_SUFFIXES[Math.floor(index / NAME_PREFIXES.length) % NAME_SUFFIXES.length];
    return {
      id: `S_L${String(index + 1).padStart(2, '0')}`,
      name: `${prefix} ${suffix}`,
      code: `SN-${String(index + 1).padStart(2, '0')}`,
      city: CITY_NAMES[index % CITY_NAMES.length],
      type: LOCATION_TYPES[index % LOCATION_TYPES.length],
      description: `Synthetic location #${index + 1} generated for simulation.`,
    };
  });

  const edges = [];
  const used = new Set();
  const addEdge = (a, b) => {
    if (a === b) return false;
    const key = edgeKey(a, b);
    if (used.has(key)) return false;
    used.add(key);
    const weight = Math.floor(minWeight + random() * (maxWeight - minWeight + 1));
    edges.push({
      id: `S_R${String(edges.length + 1).padStart(2, '0')}`,
      source: a,
      target: b,
      distance: Math.max(1, Math.round(weight * (0.8 + random() * 0.6))),
      cost: weight,
      type: ROUTE_TYPES[Math.floor(random() * ROUTE_TYPES.length)],
      description: 'Synthetic weighted route generated for simulation.',
    });
    return true;
  };

  // Step 1: a random spanning tree guarantees connectivity.
  const order = locations.map((l) => l.id);
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  for (let i = 1; i < order.length; i += 1) {
    addEdge(order[i], order[Math.floor(random() * i)]);
  }

  // Step 2: add extra unique edges until the requested route count is reached.
  let attempts = 0;
  while (edges.length < desiredEdges && attempts < maxEdges * 30) {
    attempts += 1;
    const a = locations[Math.floor(random() * locations.length)].id;
    const b = locations[Math.floor(random() * locations.length)].id;
    addEdge(a, b);
  }

  return { locations, routes: edges, seed, vertexCount, routeCount: edges.length, minWeight, maxWeight };
}

export function hashSeed(text) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
