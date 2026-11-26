import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_SETTINGS,
  STORAGE_KEYS,
  clearApplicationData,
  readJSON,
  sanitizeStoredData,
  writeJSON,
} from '../utils/storage.js';
import { getSampleData } from '../data/sampleData.js';

const AppContext = createContext(null);

function loadInitialState() {
  const stored = sanitizeStoredData({
    locations: readJSON(STORAGE_KEYS.locations, null),
    routes: readJSON(STORAGE_KEYS.routes, null),
    positions: readJSON(STORAGE_KEYS.positions, null),
    mstResults: readJSON(STORAGE_KEYS.mstResults, null),
    activities: readJSON(STORAGE_KEYS.activities, null),
    settings: readJSON(STORAGE_KEYS.settings, null),
  });

  const initialized = readJSON(STORAGE_KEYS.initialized, false);
  if (!initialized) {
    const sample = getSampleData();
    return { ...stored, ...sample, mstResults: {}, settings: stored.settings, initialized: true };
  }
  return { ...stored, initialized: true };
}

function nextId(prefix, items) {
  const numbers = items
    .map((item) => /(\d+)$/.exec(item.id || '')?.[1])
    .filter(Boolean)
    .map(Number);
  return `${prefix}${String(Math.max(0, ...numbers) + 1).padStart(2, '0')}`;
}

export function AppProvider({ children }) {
  const [initial] = useState(loadInitialState);
  const [locations, setLocations] = useState(initial.locations);
  const [routes, setRoutes] = useState(initial.routes);
  const [positions, setPositions] = useState(initial.positions);
  const [mstResults, setMstResults] = useState(initial.mstResults);
  const [activities, setActivities] = useState(initial.activities);
  const [settings, setSettings] = useState(initial.settings || DEFAULT_SETTINGS);

  useEffect(() => { writeJSON(STORAGE_KEYS.locations, locations); }, [locations]);
  useEffect(() => { writeJSON(STORAGE_KEYS.routes, routes); }, [routes]);
  useEffect(() => { writeJSON(STORAGE_KEYS.positions, positions); }, [positions]);
  useEffect(() => { writeJSON(STORAGE_KEYS.mstResults, mstResults); }, [mstResults]);
  useEffect(() => { writeJSON(STORAGE_KEYS.activities, activities); }, [activities]);
  useEffect(() => { writeJSON(STORAGE_KEYS.settings, settings); }, [settings]);
  useEffect(() => { writeJSON(STORAGE_KEYS.initialized, true); }, []);

  const logActivity = useCallback((type, message) => {
    const entry = {
      id: `A-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type,
      message,
      timestamp: Date.now(),
    };
    setActivities((prev) => [entry, ...prev].slice(0, 200));
  }, []);

  const invalidateResults = useCallback(() => setMstResults({}), []);

  const addLocation = useCallback((data) => {
    const id = nextId('L', locations);
    setLocations((prev) => [...prev, { ...data, id }]);
    logActivity('location', `Location “${data.name}” added (${id}).`);
    return id;
  }, [locations, logActivity]);

  const updateLocation = useCallback((id, patch) => {
    setLocations((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch, id } : item)));
    logActivity('location', `Location “${patch.name || id}” updated.`);
    invalidateResults();
  }, [logActivity, invalidateResults]);

  const deleteLocation = useCallback((id) => {
    const name = locations.find((item) => item.id === id)?.name || id;
    setLocations((prev) => prev.filter((item) => item.id !== id));
    setRoutes((prev) => prev.filter((route) => route.source !== id && route.target !== id));
    setPositions((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    logActivity('location', `Location “${name}” deleted; connected routes removed.`);
    invalidateResults();
  }, [locations, logActivity, invalidateResults]);

  const addRoute = useCallback((data) => {
    const id = nextId('R', routes);
    setRoutes((prev) => [...prev, { ...data, id }]);
    logActivity('route', `Route ${data.source} → ${data.target} added (cost ${data.cost}).`);
    invalidateResults();
    return id;
  }, [routes, logActivity, invalidateResults]);

  const updateRoute = useCallback((id, patch) => {
    setRoutes((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch, id } : item)));
    logActivity('route', `Route ${id} updated to ${patch.source} → ${patch.target} (cost ${patch.cost}).`);
    invalidateResults();
  }, [logActivity, invalidateResults]);

  const deleteRoute = useCallback((id) => {
    setRoutes((prev) => prev.filter((item) => item.id !== id));
    logActivity('route', `Route ${id} deleted.`);
    invalidateResults();
  }, [logActivity, invalidateResults]);

  const savePositions = useCallback((nextPositions) => {
    setPositions((prev) => ({ ...prev, ...nextPositions }));
  }, []);

  const saveMSTResult = useCallback((key, result) => {
    const label = key === 'prim' ? "Prim’s algorithm" : "Kruskal’s algorithm";
    setMstResults((prev) => ({
      ...prev,
      [key]: { ...result, timestamp: Date.now() },
    }));
    logActivity(
      'algorithm',
      `${label} executed: ${result.connected ? `MST cost ${result.totalCost} with ${result.mstEdgeIds.length} edges` : 'disconnected network — spanning forest only'}.`,
    );
  }, [logActivity]);

  const saveComparison = useCallback((primResult, kruskalResult) => {
    setMstResults((prev) => ({
      ...prev,
      prim: { ...primResult, timestamp: Date.now() },
      kruskal: { ...kruskalResult, timestamp: Date.now() },
      comparison: { timestamp: Date.now() },
    }));
    logActivity('optimize', 'Both algorithms executed and compared on the same network.');
  }, [logActivity]);

  const clearMSTResults = useCallback(() => {
    setMstResults({});
    logActivity('system', 'MST visualization and saved results reset.');
  }, [logActivity]);

  const resetSample = useCallback(() => {
    const sample = getSampleData();
    setLocations(sample.locations);
    setRoutes(sample.routes);
    setPositions(sample.positions);
    setMstResults({});
    setActivities(sample.activities);
    logActivity('system', 'Workspace restored to the sample delivery network.');
  }, [logActivity]);

  const clearAll = useCallback(() => {
    clearApplicationData();
    setLocations([]);
    setRoutes([]);
    setPositions({});
    setMstResults({});
    writeJSON(STORAGE_KEYS.initialized, true);
    logActivity('system', 'All network data was cleared.');
  }, [logActivity]);

  const applySyntheticNetwork = useCallback((network) => {
    setLocations(network.locations);
    setRoutes(network.routes);
    setPositions({});
    setMstResults({});
    logActivity('simulation', `Synthetic network applied to workspace (${network.locations.length} locations, ${network.routes.length} routes).`);
  }, [logActivity]);

  const updateSettings = useCallback((patch) => {
    setSettings((prev) => ({
      ...prev,
      ...patch,
      simulationDefaults: patch.simulationDefaults
        ? { ...prev.simulationDefaults, ...patch.simulationDefaults }
        : prev.simulationDefaults,
    }));
  }, []);

  const value = useMemo(() => ({
    locations, routes, positions, mstResults, activities, settings,
    addLocation, updateLocation, deleteLocation,
    addRoute, updateRoute, deleteRoute,
    savePositions, saveMSTResult, saveComparison, clearMSTResults,
    resetSample, clearAll, applySyntheticNetwork, updateSettings, logActivity,
  }), [
    locations, routes, positions, mstResults, activities, settings,
    addLocation, updateLocation, deleteLocation,
    addRoute, updateRoute, deleteRoute,
    savePositions, saveMSTResult, saveComparison, clearMSTResults,
    resetSample, clearAll, applySyntheticNetwork, updateSettings, logActivity,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside AppProvider');
  return context;
}
