import { cleanEdges, getId, getConnectedComponents } from '../utils/graphUtils.js';

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

/**
 * Prim's algorithm from scratch.
 *
 * At each iteration we compute, for every unvisited vertex, the cheapest edge
 * crossing from the visited set to that vertex (the "cut"). The cheapest of
 * those candidate edges is added to the MST. Every decision is recorded as a
 * real step, so the visualizer never replays fabricated data.
 */
export function primMST(vertices = [], edges = [], options = {}) {
  const started = now();
  const ids = vertices.map(getId);
  const idSet = new Set(ids);
  const usableEdges = cleanEdges(vertices, edges);

  const startId = options.startVertexId && idSet.has(options.startVertexId)
    ? options.startVertexId
    : ids[0] ?? null;

  const visited = new Set(startId ? [startId] : []);
  const mstEdgeIds = [];
  const steps = [];
  let totalCost = 0;
  let iterations = 0;

  const snapshot = (phase, title, description, extra = {}) => {
    steps.push({
      index: steps.length,
      phase,
      title,
      description,
      visited: [...visited],
      mstEdgeIds: [...mstEdgeIds],
      candidateEdgeIds: [],
      currentEdgeId: null,
      totalCost,
      iterations,
      ...extra,
    });
  };

  snapshot(
    'init',
    'Initialize Prim’s algorithm',
    startId
      ? `Start at ${vertices.find((v) => getId(v) === startId)?.name || startId}. Mark it visited; all other locations are unvisited.`
      : 'The network has no locations. There is nothing to connect.',
  );

  while (visited.size < ids.length) {
    // Cheapest crossing edge per unvisited endpoint (one candidate per vertex).
    const bestPerVertex = new Map();
    for (const edge of usableEdges) {
      const sourceInside = visited.has(edge.source);
      const targetInside = visited.has(edge.target);
      if (sourceInside === targetInside) continue;

      const frontierVertex = sourceInside ? edge.target : edge.source;
      const current = bestPerVertex.get(frontierVertex);
      if (!current || edge.cost < current.cost || (edge.cost === current.cost && String(edge.id) < String(current.id))) {
        bestPerVertex.set(frontierVertex, edge);
      }
    }

    const candidates = [...bestPerVertex.values()].sort(
      (a, b) => a.cost - b.cost || String(a.id).localeCompare(String(b.id)),
    );

    if (!candidates.length) {
      snapshot(
        'stop',
        'No crossing edge available',
        'The visited set cannot reach any unvisited location. The remaining locations are in a disconnected component, so a spanning tree for the entire graph cannot exist.',
        { candidateEdgeIds: [] },
      );
      break;
    }

    const chosen = candidates[0];
    const newVertex = visited.has(chosen.source) ? chosen.target : chosen.source;
    snapshot(
      'candidate',
      `Evaluate ${candidates.length} candidate edge${candidates.length === 1 ? '' : 's'}`,
      `Compare the cheapest edge reaching each unvisited location. Cheapest: ${chosen.source} → ${newVertex} with cost ${chosen.cost}.`,
      { candidateEdgeIds: candidates.map((e) => getId(e)), currentEdgeId: getId(chosen) },
    );

    mstEdgeIds.push(getId(chosen));
    visited.add(newVertex);
    totalCost += chosen.cost;
    iterations += 1;

    snapshot(
      'select',
      `Select edge ${chosen.source} → ${newVertex}`,
      `Add the minimum crossing edge (cost ${chosen.cost}) to the MST and mark ${newVertex} as visited. Running MST cost: ${totalCost}.`,
      { currentEdgeId: getId(chosen) },
    );
  }

  const components = getConnectedComponents(vertices, usableEdges);
  const connected = ids.length === 0 ? true : visited.size === ids.length;
  snapshot(
    'done',
    connected ? 'Spanning tree complete' : 'Spanning forest produced',
    connected
      ? `All ${ids.length} locations are connected using ${mstEdgeIds.length} edges at a total cost of ${totalCost}.`
      : `Only ${visited.size} of ${ids.length} locations could be connected. ${components.length} disconnected component(s) were detected; a complete spanning tree is impossible.`,
  );

  return {
    algorithm: 'prim',
    mstEdgeIds,
    mstEdges: usableEdges.filter((edge) => mstEdgeIds.includes(getId(edge))),
    totalCost,
    iterations,
    executionTimeMs: now() - started,
    connected,
    verticesConnected: [...visited],
    components,
    steps,
    startVertexId: startId,
    examinedEdges: usableEdges.length,
  };
}
