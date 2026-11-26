import { createDisjointSet } from './disjointSet.js';
import { cleanEdges, getId } from '../utils/graphUtils.js';

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

/**
 * Kruskal's algorithm from scratch.
 * Edges are sorted by ascending weight, then accepted only when the two
 * endpoints belong to different Disjoint Set components (no cycle).
 */
export function kruskalMST(vertices = [], edges = []) {
  const started = now();
  const ids = vertices.map(getId);
  const usableEdges = cleanEdges(vertices, edges);
  const sortedEdges = [...usableEdges].sort(
    (a, b) => a.cost - b.cost || String(a.id).localeCompare(String(b.id)),
  );
  const sets = createDisjointSet(ids);

  const mstEdgeIds = [];
  const rejectedEdgeIds = [];
  const steps = [];
  let totalCost = 0;
  let iterations = 0;

  const snapshot = (phase, title, description, extra = {}) => {
    steps.push({
      index: steps.length,
      phase,
      title,
      description,
      visited: sets.getComponents().flat(),
      mstEdgeIds: [...mstEdgeIds],
      candidateEdgeIds: [],
      currentEdgeId: null,
      rejectedEdgeIds: [...rejectedEdgeIds],
      totalCost,
      iterations,
      ...extra,
    });
  };

  snapshot(
    'init',
    'Initialize Kruskal’s algorithm',
    `Sort all ${sortedEdges.length} routes by ascending cost and start with ${ids.length} single-location components.`,
    { sortedEdgeIds: sortedEdges.map(getId) },
  );

  for (const edge of sortedEdges) {
    // Once V-1 edges are accepted no more edges can join the tree, but we keep
    // examining the rest so the visualization shows every cycle rejection.
    iterations += 1;
    const rootSource = sets.find(edge.source);
    const rootTarget = sets.find(edge.target);
    const sameComponent = rootSource === rootTarget;

    snapshot(
      'candidate',
      `Examine edge ${edge.source} → ${edge.target}`,
      sameComponent
        ? `Cost ${edge.cost}. Both endpoints are already in the same component — accepting it would create a cycle.`
        : `Cost ${edge.cost}. Endpoints are in different components, so this edge is safe to add.`,
      { currentEdgeId: getId(edge), candidateEdgeIds: [getId(edge)], sortedEdgeIds: sortedEdges.map(getId) },
    );

    if (sameComponent) {
      rejectedEdgeIds.push(getId(edge));
      snapshot(
        'reject',
        `Reject edge ${edge.source} → ${edge.target}`,
        `Cycle detected: ${edge.source} and ${edge.target} are already connected through the current MST.`,
        { currentEdgeId: getId(edge), sortedEdgeIds: sortedEdges.map(getId) },
      );
      continue;
    }

    sets.union(edge.source, edge.target);
    mstEdgeIds.push(getId(edge));
    totalCost += edge.cost;

    snapshot(
      'select',
      `Accept edge ${edge.source} → ${edge.target}`,
      `Merge the two components and add cost ${edge.cost} to the MST. Running MST cost: ${totalCost}.`,
      { currentEdgeId: getId(edge), sortedEdgeIds: sortedEdges.map(getId) },
    );
  }

  const components = sets.getComponents();
  const connected = ids.length <= 1 ? true : components.length === 1;
  snapshot(
    'done',
    connected ? 'Spanning tree complete' : 'Spanning forest produced',
    connected
      ? `All ${ids.length} locations are connected with ${mstEdgeIds.length} edges at a total cost of ${totalCost}.`
      : `Only ${mstEdgeIds.length} edges could be accepted across ${components.length} components; a complete spanning tree is impossible for this disconnected graph.`,
  );

  return {
    algorithm: 'kruskal',
    mstEdgeIds,
    mstEdges: usableEdges.filter((edge) => mstEdgeIds.includes(getId(edge))),
    totalCost,
    iterations,
    executionTimeMs: now() - started,
    connected,
    verticesConnected: connected ? ids : components.find((c) => c.length === Math.max(...components.map((x) => x.length))) || [],
    components,
    steps,
    sortedEdgeIds: sortedEdges.map(getId),
    rejectedEdgeIds,
    examinedEdges: iterations,
  };
}
