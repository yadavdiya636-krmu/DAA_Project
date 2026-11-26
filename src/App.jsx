import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppProvider } from './context/AppContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import AppLayout from './components/layout/AppLayout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Locations from './pages/Locations.jsx';
import RoutesPage from './pages/Routes.jsx';
import NetworkGraph from './pages/NetworkGraph.jsx';
import MSTOptimizer from './pages/MSTOptimizer.jsx';
import AlgorithmComparison from './pages/AlgorithmComparison.jsx';
import Simulation from './pages/Simulation.jsx';
import Settings from './pages/Settings.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AppProvider>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="locations" element={<Locations />} />
              <Route path="routes" element={<RoutesPage />} />
              <Route path="graph" element={<NetworkGraph />} />
              <Route path="optimizer" element={<MSTOptimizer />} />
              <Route path="comparison" element={<AlgorithmComparison />} />
              <Route path="simulation" element={<Simulation />} />
              <Route path="settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </AppProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
