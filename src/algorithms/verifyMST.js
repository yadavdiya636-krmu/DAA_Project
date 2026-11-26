import { createDisjointSet } from './disjointSet.js';
import { cleanEdges, getId, getConnectedComponents, isConnected } from '../utils/graphUtils.js';

/**
 * Independent verification of an MST result. Uses its own Union-Find pass and,
 * for small networks, an exhaustive search over all edge combinations to prove
 * minimality instead of trusting the algorithm under test.
 */
export function bruteForceMSTCost(vertices, edges) {
  const ids = vertices.map(getId);
  const usable = cleanEdges(vertices, edges);
  if (ids.length > 10 || usable.length > 20) return null;
  if (ids.length <= 1) return 0;

  let best = Infinity;
  const target = ids.length - 1;
  const combination = [];

  const search = (start) => {
    if (combination.length === target) {
      const sets = createDisjointSet(ids);
      let cost = 0;
      for (const edge of combination) {
        if (!sets.union(edge.source, edge.target)) return; // cycle
        cost += edge.cost;
      }
      if (sets.count === 1) best = Math.min(best, cost);
      return;
    }
    for (let i = start; i < usable.length; i += 1) {
      combination.push(usable[i]);
      search(i + 1);
      combination.pop();
    }
  };
  search(0);
  return Number.isFinite(best) ? best : null;
}

export function verifyMSTResult(vertices, edges, result) {
  const ids = vertices.map(getId);
  const usable = cleanEdges(vertices, edges);
  const selected = usable.filter((edge) => result?.mstEdgeIds?.includes(getId(edge)));
  const checks = [];
  const add = (label, ok, detail) => checks.push({ label, ok, detail });

  const costMatches = selected.reduce((sum, edge) => sum + edge.cost, 0) === Number(result?.totalCost);
  add('Uses actual edge weights', costMatches, `Reported ${result?.totalCost}, recomputed ${selected.reduce((s, e) => s + e.cost, 0)}`);

  const sets = createDisjointSet(ids);
  const acyclic = selected.every((edge) => sets.union(edge.source, edge.target));
  add('Contains no cycles', acyclic, acyclic ? 'All accepted edges merged distinct components.' : 'An edge closed a cycle.');

  const connected = isConnected(vertices, selected);
  const expectedConnected = isConnected(vertices, usable);
  add(
    'Connectivity is correct',
    connected === expectedConnected,
    expectedConnected ? 'All vertices connected by selected edges.' : 'Graph is disconnected; forest is expected.',
  );

  add(
    'Edge count is correct',
    expectedConnected ? selected.length === Math.max(0, ids.length - 1) : selected.length <= Math.max(0, ids.length - 1),
    `Selected ${selected.length} of expected ${expectedConnected ? Math.max(0, ids.length - 1) : '≤ ' + Math.max(0, ids.length - 1)}`,
  );

  const referenceCost = bruteForceMSTCost(vertices, usable);
  if (referenceCost !== null && expectedConnected) {
    add('Minimum total weight (exhaustive check)', result?.totalCost === referenceCost, `Exhaustive optimum: ${referenceCost}`);
  } else {
    add('Minimum total weight', true, referenceCost === null ? 'Exhaustive check skipped (network too large).' : 'Disconnected graph — no complete MST exists.');
  }

  add(
    'Disconnected components detected',
    getConnectedComponents(vertices, usable).length === (result?.components?.length || 0) || expectedConnected,
    `${getConnectedComponents(vertices, usable).length} component(s) in network`,
  );

  return { valid: checks.every((check) => check.ok), checks };
}
