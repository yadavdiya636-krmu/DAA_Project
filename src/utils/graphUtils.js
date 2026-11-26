/** Shared, dependency-free graph helpers used by algorithms, UI and tests. */

export const getId = (item) => (typeof item === 'string' ? item : item?.id);

/** Canonical key for an undirected edge, so A-B and B-A are the same route. */
export function edgeKey(a, b) {
  const first = getId(a);
  const second = getId(b);
  return [first, second].sort().join('::');
}

export function buildAdjacencyList(vertices, edges) {
  const ids = vertices.map(getId);
  const adjacency = new Map(ids.map((id) => [id, []]));
  for (const edge of edges || []) {
    const source = getId(edge.source);
    const target = getId(edge.target);
    if (!adjacency.has(source) || !adjacency.has(target)) continue;
    adjacency.get(source).push({ id: getId(edge), to: target, cost: Number(edge.cost) });
    adjacency.get(target).push({ id: getId(edge), to: source, cost: Number(edge.cost) });
  }
  return adjacency;
}

/** Connected components computed independently of the MST algorithms. */
export function getConnectedComponents(vertices, edges = []) {
  const ids = vertices.map(getId);
  const adjacency = buildAdjacencyList(vertices, edges);
  const seen = new Set();
  const components = [];

  for (const id of ids) {
    if (seen.has(id)) continue;
    const component = [];
    const queue = [id];
    seen.add(id);
    while (queue.length) {
      const current = queue.shift();
      component.push(current);
      for (const neighbor of adjacency.get(current) || []) {
        if (!seen.has(neighbor.to)) {
          seen.add(neighbor.to);
          queue.push(neighbor.to);
        }
      }
    }
    components.push(component);
  }
  return components;
}

export function isConnected(vertices, edges) {
  if (vertices.length <= 1) return true;
  return getConnectedComponents(vertices, edges).length === 1;
}

/** Rejects invalid vertices/weights/duplicates before an algorithm runs. */
export function cleanEdges(vertices, edges = []) {
  const ids = new Set(vertices.map(getId));
  const seen = new Set();
  const result = [];
  for (const edge of edges || []) {
    const source = getId(edge.source);
    const target = getId(edge.target);
    const cost = Number(edge.cost);
    if (!ids.has(source) || !ids.has(target) || source === target) continue;
    if (!Number.isFinite(cost) || cost < 0) continue;
    const key = edgeKey(source, target);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({ ...edge, source, target, cost });
  }
  return result;
}

export function getDegreeMap(vertices, edges = []) {
  const degrees = Object.fromEntries(vertices.map((v) => [getId(v), 0]));
  for (const edge of edges) {
    const source = getId(edge.source);
    const target = getId(edge.target);
    if (source in degrees) degrees[source] += 1;
    if (target in degrees) degrees[target] += 1;
  }
  return degrees;
}

/** Deterministic circular layout used when no dragged positions are stored. */
export function circularLayout(vertices, width = 900, height = 560) {
  const count = vertices.length;
  const cx = width / 2;
  const cy = height / 2;
  const radiusX = Math.max(120, width * 0.36);
  const radiusY = Math.max(100, height * 0.36);
  const positions = {};
  vertices.forEach((vertex, index) => {
    const angle = (2 * Math.PI * index) / Math.max(count, 1) - Math.PI / 2;
    positions[getId(vertex)] = {
      x: Math.round(cx + radiusX * Math.cos(angle)),
      y: Math.round(cy + radiusY * Math.sin(angle)),
    };
  });
  return positions;
}

export function getPositionMap(vertices, storedPositions = {}) {
  const fallback = circularLayout(vertices);
  const positions = {};
  for (const vertex of vertices) {
    const id = getId(vertex);
    const stored = storedPositions[id];
    positions[id] =
      stored && Number.isFinite(Number(stored.x)) && Number.isFinite(Number(stored.y))
        ? { x: Number(stored.x), y: Number(stored.y) }
        : fallback[id];
  }
  return positions;
}

export function validateLocationInput(input, existing = [], editingId = null) {
  const errors = {};
  const name = (input.name || '').trim();
  const code = (input.code || '').trim().toUpperCase();
  const city = (input.city || '').trim();

  if (!name) errors.name = 'Location name is required.';
  else if (name.length < 2) errors.name = 'Location name must be at least 2 characters.';

  if (!code) errors.code = 'Location code is required.';
  else if (!/^[A-Z0-9_-]{2,12}$/.test(code)) errors.code = 'Use 2–12 letters, numbers, - or _.';
  else if (existing.some((l) => l.code?.toUpperCase() === code && l.id !== editingId)) {
    errors.code = 'This location code is already in use.';
  }

  if (!city) errors.city = 'City is required.';
  if (!input.type) errors.type = 'Select a location type.';

  return errors;
}

export function validateRouteInput(input, locations = [], editingId = null) {
  const errors = {};
  const source = input.source;
  const target = input.target;
  const distance = Number(input.distance);
  const cost = Number(input.cost);
  const ids = new Set(locations.map(getId));

  if (!source || !ids.has(source)) errors.source = 'Select a valid source location.';
  if (!target || !ids.has(target)) errors.target = 'Select a valid destination location.';
  if (source && target && source === target) errors.target = 'Source and destination must differ.';

  if (input.distance === '' || input.distance === null || !Number.isFinite(distance) || distance <= 0) {
    errors.distance = 'Distance must be a positive number.';
  }
  if (input.cost === '' || input.cost === null || !Number.isFinite(cost) || cost <= 0) {
    errors.cost = 'Connection cost must be a positive number.';
  }
  if (!input.type) errors.type = 'Select a route type.';

  if (!errors.source && !errors.target) {
    const duplicate = (input.routes || []).some(
      (route) => edgeKey(route.source, route.target) === edgeKey(source, target) && route.id !== editingId,
    );
    if (duplicate) errors.target = 'A route between these two locations already exists.';
  }

  return errors;
}
