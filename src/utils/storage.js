/** Safe, versioned LocalStorage helpers. Bad or corrupt data falls back cleanly. */

const PREFIX = 'routewise.v1.';
export const STORAGE_KEYS = {
  locations: `${PREFIX}locations`,
  routes: `${PREFIX}routes`,
  positions: `${PREFIX}positions`,
  mstResults: `${PREFIX}mstResults`,
  activities: `${PREFIX}activities`,
  settings: `${PREFIX}settings`,
  initialized: `${PREFIX}initialized`,
};

export const DEFAULT_SETTINGS = {
  theme: 'light',
  defaultAlgorithm: 'prim',
  animationSpeed: 700,
  currency: 'USD',
  showEdgeLabels: true,
  snapToGrid: false,
  simulationDefaults: {
    vertexCount: 8,
    routeCount: 14,
    density: 50,
    minWeight: 10,
    maxWeight: 250,
    seed: '',
  },
};

export function readJSON(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeJSON(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeKey(key) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Storage may be unavailable (private mode / quota); the app still runs in memory.
  }
}

export function clearApplicationData() {
  Object.values(STORAGE_KEYS).forEach(removeKey);
}

export function isArrayOf(value, predicate) {
  return Array.isArray(value) && value.every(predicate);
}

export function isValidLocation(value) {
  return Boolean(
    value && typeof value === 'object' &&
    typeof value.id === 'string' && value.id &&
    typeof value.name === 'string' && value.name &&
    typeof value.code === 'string' && typeof value.city === 'string',
  );
}

export function isValidRoute(value) {
  return Boolean(
    value && typeof value === 'object' &&
    typeof value.id === 'string' && value.id &&
    typeof value.source === 'string' && typeof value.target === 'string' &&
    Number.isFinite(Number(value.cost)) && Number(value.cost) > 0,
  );
}

export function sanitizeStoredData({ locations, routes, positions, mstResults, activities, settings }) {
  // Filter record-by-record so one corrupt entry does not discard a whole collection.
  const safeLocations = Array.isArray(locations) ? locations.filter(isValidLocation) : [];
  const safeRoutes = Array.isArray(routes) ? routes.filter(isValidRoute) : [];
  const locationIds = new Set(safeLocations.map((l) => l.id));
  const safeEdges = safeRoutes.filter((r) => locationIds.has(r.source) && locationIds.has(r.target) && r.source !== r.target);
  const safePositions =
    positions && typeof positions === 'object' && !Array.isArray(positions)
      ? Object.fromEntries(
          Object.entries(positions).filter(
            ([id, pos]) => pos && Number.isFinite(Number(pos.x)) && Number.isFinite(Number(pos.y)),
          ),
        )
      : {};
  const safeResults =
    mstResults && typeof mstResults === 'object' && !Array.isArray(mstResults)
      ? Object.fromEntries(
          Object.entries(mstResults).filter(([, result]) => result && Array.isArray(result.mstEdgeIds)),
        )
      : {};
  const safeActivities = Array.isArray(activities)
    ? activities.filter((a) => a && typeof a.message === 'string')
    : [];
  const safeSettings = settings && typeof settings === 'object' ? { ...DEFAULT_SETTINGS, ...settings } : DEFAULT_SETTINGS;

  return {
    locations: safeLocations,
    routes: safeEdges,
    positions: safePositions,
    mstResults: safeResults,
    activities: safeActivities.slice(0, 200),
    settings: {
      ...safeSettings,
      simulationDefaults: { ...DEFAULT_SETTINGS.simulationDefaults, ...(safeSettings.simulationDefaults || {}) },
    },
  };
}
