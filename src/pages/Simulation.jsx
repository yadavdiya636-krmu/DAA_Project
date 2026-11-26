import React, { useMemo, useState } from 'react';
import { PlayCircle, RotateCcw, Sparkles, Play, GitCompareArrows, Download, CheckCircle2, Info, MapPin, Route as RouteIcon, GitBranch } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import PageHeader from '../components/common/PageHeader.jsx';
import { Card, CardHeader } from '../components/common/Card.jsx';
import Button from '../components/common/Button.jsx';
import Badge from '../components/common/Badge.jsx';
import StatCard from '../components/common/StatCard.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import GraphCanvas from '../components/graph/GraphCanvas.jsx';
import MetricComparisonChart from '../components/charts/MetricComparisonChart.jsx';
import { generateNetwork } from '../utils/dataGenerator.js';
import { primMST } from '../algorithms/prim.js';
import { kruskalMST } from '../algorithms/kruskal.js';
import { measure, formatCurrency, formatTime } from '../utils/calculations.js';
import { downloadCSV } from '../utils/export.js';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function SimulationChart({ title, subtitle, data, xKey, series, xLabel }) {
  return (
    <Card className="p-5">
      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
      {data.length === 0 ? (
        <div className="mt-4 flex h-48 items-center justify-center rounded-xl bg-slate-50 text-xs text-slate-500 dark:bg-slate-800/40">Generate a network to produce measured data.</div>
      ) : (
        <div className="mt-4 h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey={xKey} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} label={{ value: xLabel, position: 'insideBottomRight', offset: -2, fill: '#94a3b8', fontSize: 10 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} width={62} tickFormatter={(v) => Number(v).toFixed(2)} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} formatter={(value) => Number(value).toFixed(4)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {series.map((item) => <Line key={item.key} type="monotone" dataKey={item.key} name={item.name} stroke={item.color} strokeWidth={2.4} dot={{ r: 2.5 }} />)}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

/** Measure both algorithms on independently generated networks of increasing size. */
function benchmarkSeries(config) {
  const points = [];
  const baseSeed = String(config.seed || '').trim() || 'default';
  for (let size = 2; size <= Math.max(2, Number(config.vertexCount) || 8); size += 1) {
    const maxEdges = (size * (size - 1)) / 2;
    const density = Math.max(0, Math.min(100, Number(config.density) || 50));
    const routeCount = Math.min(maxEdges, Math.max(size - 1, Math.round((maxEdges * density) / 100)));
    const sample = generateNetwork({
      vertexCount: size,
      routeCount,
      minWeight: config.minWeight,
      maxWeight: config.maxWeight,
      seed: `${baseSeed}-${size}`,
    });
    const prim = measure(() => primMST(sample.locations, sample.routes), 3);
    const kruskal = measure(() => kruskalMST(sample.locations, sample.routes), 3);
    points.push({
      size,
      edges: sample.routes.length,
      primTime: prim.executionTimeMs,
      kruskalTime: kruskal.executionTimeMs,
      primCost: prim.totalCost,
      kruskalCost: kruskal.totalCost,
    });
  }
  return points;
}

export default function Simulation() {
  const { settings, applySyntheticNetwork } = useApp();
  const { notify } = useToast();
  const [config, setConfig] = useState({ ...settings.simulationDefaults });
  const [network, setNetwork] = useState(null);
  const [results, setResults] = useState({});
  const [series, setSeries] = useState([]);
  const currency = settings.currency || 'USD';
  const maxEdges = useMemo(() => (config.vertexCount * (config.vertexCount - 1)) / 2, [config.vertexCount]);

  const updateConfig = (patch) => setConfig((prev) => ({ ...prev, ...patch }));

  const generate = () => {
    const generated = generateNetwork(config);
    setNetwork(generated);
    setResults({});
    setSeries(benchmarkSeries(config));
    notify(`Synthetic network generated: ${generated.locations.length} locations, ${generated.routes.length} routes (seed ${generated.seed}).`, 'success');
  };

  const run = (which) => {
    if (!network) { notify('Generate a network first.', 'error'); return; }
    const output = which === 'prim' ? primMST(network.locations, network.routes) : kruskalMST(network.locations, network.routes);
    setResults((prev) => ({ ...prev, [which]: output }));
    notify(`${which === 'prim' ? 'Prim’s' : 'Kruskal’s'} algorithm finished on the synthetic network.`, 'success');
  };

  const compare = () => {
    if (!network) { notify('Generate a network first.', 'error'); return; }
    const prim = primMST(network.locations, network.routes);
    const kruskal = kruskalMST(network.locations, network.routes);
    setResults({ prim, kruskal });
    notify('Both algorithms measured on the same synthetic network.', 'success');
  };

  const reset = () => {
    setConfig({ ...settings.simulationDefaults });
    setNetwork(null);
    setResults({});
    setSeries([]);
    notify('Simulation reset.', 'info');
  };

  const exportSeries = () => {
    if (!series.length) return;
    downloadCSV('routewise-simulation-series.csv', series.map((row) => ({
      Locations: row.size, Routes: row.edges,
      'Prim time (ms)': row.primTime.toFixed(6), 'Kruskal time (ms)': row.kruskalTime.toFixed(6),
      'Prim MST cost': row.primCost, 'Kruskal MST cost': row.kruskalCost,
    })));
    notify('Synthetic benchmark series exported.', 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Simulation"
        description="Generate seeded synthetic delivery networks and benchmark both algorithms on real, freshly generated data."
        badge={<Badge tone="violet">Synthetic results</Badge>}
        actions={<>
          <Button variant="secondary" icon={Download} onClick={exportSeries} disabled={!series.length}>Export results</Button>
          <Button variant="secondary" icon={RotateCcw} onClick={reset}>Reset simulation</Button>
          <Button icon={Sparkles} onClick={generate}>Generate network</Button>
        </>}
      />

      <div className="grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
        <Card className="p-5">
          <CardHeader className="-mx-5 -mt-5 mb-5" icon={PlayCircle} title="Network configuration" subtitle="All values are applied locally to the simulation" />
          <div className="space-y-4">
            <div>
              <label className="label">Number of locations: {config.vertexCount}</label>
              <input type="range" min={3} max={14} value={config.vertexCount} className="w-full accent-brand-600"
                onChange={(e) => {
                  const vertexCount = Number(e.target.value);
                  const edgesMax = (vertexCount * (vertexCount - 1)) / 2;
                  const density = Math.round(((Math.min(config.routeCount, edgesMax) / edgesMax) * 100));
                  updateConfig({ vertexCount, routeCount: Math.max(vertexCount - 1, Math.min(config.routeCount, edgesMax)), density });
                }} />
            </div>
            <div>
              <label className="label">Number of routes: {config.routeCount} / {maxEdges}</label>
              <input type="range" min={config.vertexCount - 1} max={maxEdges} value={Math.min(config.routeCount, maxEdges)} className="w-full accent-indigo-600"
                onChange={(e) => {
                  const routeCount = Number(e.target.value);
                  updateConfig({ routeCount, density: Math.round((routeCount / maxEdges) * 100) });
                }} />
            </div>
            <div>
              <label className="label">Network density: {Math.round((config.routeCount / maxEdges) * 100)}%</label>
              <input type="range" min={Math.ceil(((config.vertexCount - 1) / maxEdges) * 100)} max={100} value={Math.round((config.routeCount / maxEdges) * 100)} className="w-full accent-emerald-600"
                onChange={(e) => {
                  const density = Number(e.target.value);
                  updateConfig({ density, routeCount: Math.max(config.vertexCount - 1, Math.round((maxEdges * density) / 100)) });
                }} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Min cost</label><input type="number" min={1} max={9999} className="input" value={config.minWeight} onChange={(e) => updateConfig({ minWeight: Number(e.target.value) })} /></div>
              <div><label className="label">Max cost</label><input type="number" min={1} max={9999} className="input" value={config.maxWeight} onChange={(e) => updateConfig({ maxWeight: Number(e.target.value) })} /></div>
            </div>
            <div>
              <label className="label">Random seed (optional)</label>
              <input className="input" value={config.seed} onChange={(e) => updateConfig({ seed: e.target.value })} placeholder="e.g. capstone-2026" />
              <p className="mt-1 text-[11px] text-slate-400">Identical seeds reproduce identical networks.</p>
            </div>
            {config.maxWeight < config.minWeight && <p className="rounded-lg bg-rose-50 p-2 text-xs text-rose-600 dark:bg-rose-900/20">Maximum cost must be at least the minimum cost.</p>}
            <Button className="w-full" icon={Sparkles} onClick={generate} disabled={config.maxWeight < config.minWeight}>Generate network</Button>
          </div>
        </Card>

        <div className="space-y-4">
          {!network ? (
            <Card><EmptyState icon={PlayCircle} title="No synthetic network generated" description="Configure the network size, density and weight range, then generate a seeded network to start benchmarking." action={<Button icon={Sparkles} onClick={generate}>Generate network</Button>} /></Card>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard icon={MapPin} label="Synthetic locations" value={network.locations.length} supporting="Generated vertices" accent="blue" />
                <StatCard icon={RouteIcon} label="Synthetic routes" value={network.routes.length} supporting={`Density ${Math.round((network.routes.length / ((network.locations.length * (network.locations.length - 1)) / 2)) * 100)}%`} accent="indigo" />
                <StatCard icon={GitBranch} label="Seed used" value={network.seed} supporting="Deterministic PRNG" accent="violet" />
                <StatCard icon={PlayCircle} label="Benchmark points" value={series.length} supporting="Measured network sizes" accent="emerald" />
              </div>

              <Card>
                <CardHeader
                  icon={PlayCircle}
                  title="Generated network"
                  subtitle={`${network.locations.length} nodes · ${network.routes.length} weighted edges · seed ${network.seed}`}
                  action={<div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary" icon={Play} onClick={() => run('prim')}>Run Prim</Button>
                    <Button size="sm" variant="secondary" icon={Play} onClick={() => run('kruskal')}>Run Kruskal</Button>
                    <Button size="sm" variant="indigo" icon={GitCompareArrows} onClick={compare}>Compare</Button>
                    <Button size="sm" variant="success" onClick={() => { applySyntheticNetwork(network); notify('Synthetic network applied to your workspace.', 'success'); }}>Apply to workspace</Button>
                  </div>}
                />
                <div className="p-4">
                  <GraphCanvas vertices={network.locations} edges={network.routes} height={320}
                    highlightedEdgeIds={results.prim?.mstEdgeIds || results.kruskal?.mstEdgeIds || []}
                    mutedEdgeIds={network.routes.filter((edge) => !(results.prim?.mstEdgeIds || results.kruskal?.mstEdgeIds || []).includes(edge.id)).map((edge) => edge.id)} />
                </div>
              </Card>

              {Object.keys(results).length > 0 && (
                <Card className="overflow-hidden">
                  <CardHeader icon={CheckCircle2} title="Simulation algorithm results" subtitle="Measured on the generated network, not the workspace" />
                  <div className="table-wrap rounded-none border-0">
                    <table className="data-table">
                      <thead><tr><th>Algorithm</th><th>MST cost</th><th>Edges</th><th>Execution time</th><th>Iterations</th><th>Connected</th></tr></thead>
                      <tbody>
                        {Object.entries(results).map(([key, result]) => (
                          <tr key={key}>
                            <td className="font-bold">{key === 'prim' ? 'Prim’s' : 'Kruskal’s'}</td>
                            <td className="font-bold text-emerald-600">{formatCurrency(result.totalCost, currency)}</td>
                            <td>{result.mstEdgeIds.length}</td>
                            <td className="font-mono text-xs">{formatTime(result.executionTimeMs)}</td>
                            <td>{result.iterations}</td>
                            <td>{result.connected ? <Badge tone="emerald" dot>Yes</Badge> : <Badge tone="amber" dot>No</Badge>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

              <div className="grid gap-4 lg:grid-cols-2">
                <MetricComparisonChart results={results} metric="executionTimeMs" chartTitle="Prim vs Kruskal Execution Time" chartSubtitle="Measured on the current synthetic network" />
                <SimulationChart title="MST Cost Across Network Sizes" subtitle="Measured synthetic results, average of 3 runs per size" data={series} xKey="size" xLabel="Locations" series={[{ key: 'primCost', name: 'Prim cost', color: '#3366f5' }, { key: 'kruskalCost', name: 'Kruskal cost', color: '#10b981' }]} />
                <SimulationChart title="Locations vs Execution Time" subtitle="Measured synthetic results across network sizes" data={series} xKey="size" xLabel="Locations" series={[{ key: 'primTime', name: 'Prim', color: '#3366f5' }, { key: 'kruskalTime', name: 'Kruskal', color: '#10b981' }]} />
                <SimulationChart title="Edges vs Execution Time" subtitle="Measured synthetic results against generated edge counts" data={series} xKey="edges" xLabel="Routes" series={[{ key: 'primTime', name: 'Prim', color: '#3366f5' }, { key: 'kruskalTime', name: 'Kruskal', color: '#10b981' }]} />
              </div>

              <Card className="flex items-start gap-3 border-violet-200 bg-violet-50/60 p-4 dark:border-violet-900/40 dark:bg-violet-900/10">
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" />
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300"><strong className="text-slate-800 dark:text-white">Synthetic data notice:</strong> every value shown in this section comes from seeded randomly generated networks and real algorithm executions. These results are not measurements of your live workspace data, and timings on very small graphs are inherently noisy.</p>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
