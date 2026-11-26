import React, { useMemo, useState } from 'react';
import { GitBranch, Play, RotateCcw, Download, CheckCircle2, CircleAlert, Clock3, Zap, MapPin, Route as RouteIcon, Info, Layers3, Network as NetworkIcon } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import PageHeader from '../components/common/PageHeader.jsx';
import { Card, CardHeader } from '../components/common/Card.jsx';
import Button from '../components/common/Button.jsx';
import Badge from '../components/common/Badge.jsx';
import StatCard from '../components/common/StatCard.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import GraphCanvas from '../components/graph/GraphCanvas.jsx';
import StepPlayer from '../components/optimizer/StepPlayer.jsx';
import { primMST } from '../algorithms/prim.js';
import { kruskalMST } from '../algorithms/kruskal.js';
import { verifyMSTResult } from '../algorithms/verifyMST.js';
import { sumCost, computeSavings, formatCurrency, formatTime } from '../utils/calculations.js';
import { downloadCSV } from '../utils/export.js';

const ALGORITHMS = [
  { key: 'prim', label: 'Prim’s Algorithm', short: 'Prim', description: 'Grows the tree one vertex at a time from a starting node.' },
  { key: 'kruskal', label: 'Kruskal’s Algorithm', short: 'Kruskal', description: 'Sorts all edges and accepts the cheapest non-cycling edge.' },
];

export default function MSTOptimizer() {
  const { locations, routes, positions, mstResults, settings, saveMSTResult, saveComparison, clearMSTResults } = useApp();
  const { notify } = useToast();
  const [algorithm, setAlgorithm] = useState(settings.defaultAlgorithm === 'kruskal' ? 'kruskal' : 'prim');
  const [activeTab, setActiveTab] = useState(null);
  const currency = settings.currency || 'USD';

  const originalCost = useMemo(() => sumCost(routes), [routes]);
  const activeKey = activeTab && mstResults[activeTab] ? activeTab : null;
  const result = activeKey ? mstResults[activeKey] : null;
  const verification = useMemo(() => (result ? verifyMSTResult(locations, routes, result) : null), [locations, routes, result]);
  const savings = computeSavings(originalCost, result?.totalCost ?? originalCost);
  const nameOf = (id) => locations.find((l) => l.id === id)?.name || id;

  const execute = (which) => {
    if (locations.length === 0) {
      notify('Add locations before running an optimization.', 'error');
      return;
    }
    if (which === 'both') {
      const prim = primMST(locations, routes);
      const kruskal = kruskalMST(locations, routes);
      saveComparison(prim, kruskal);
      setActiveTab('prim');
      notify(`Both algorithms finished. MST costs: ${formatCurrency(prim.totalCost, currency)} / ${formatCurrency(kruskal.totalCost, currency)}.`, prim.connected && kruskal.connected ? 'success' : 'warning');
      return;
    }
    const output = which === 'prim' ? primMST(locations, routes) : kruskalMST(locations, routes);
    saveMSTResult(which, output);
    setActiveTab(which);
    notify(
      output.connected
        ? `${which === 'prim' ? 'Prim’s' : 'Kruskal’s'} algorithm built an MST costing ${formatCurrency(output.totalCost, currency)}.`
        : 'Graph is disconnected — only a spanning forest could be produced.',
      output.connected ? 'success' : 'warning',
    );
  };

  const reset = () => {
    clearMSTResults();
    setActiveTab(null);
    notify('Algorithm visualization reset.', 'info');
  };

  const exportEdges = () => {
    if (!result) return;
    const rows = result.mstEdges.map((edge) => ({
      'Edge ID': edge.id, Source: nameOf(edge.source), Destination: nameOf(edge.target),
      Cost: edge.cost, Type: edge.type || '', Selected: 'Yes',
    }));
    downloadCSV(`routewise-mst-${activeKey}.csv`, rows);
    notify('MST edge list exported as CSV.', 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="MST Optimizer"
        description="Construct the cheapest connected network with a genuine Prim or Kruskal implementation — including a replayable step trace."
        badge={result ? (result.connected ? <Badge tone="emerald" dot>MST ready</Badge> : <Badge tone="amber" dot>Forest only</Badge>) : <Badge tone="slate">Not run</Badge>}
        actions={<>
          <Button variant="secondary" icon={RotateCcw} onClick={reset}>Reset visualization</Button>
          <Button variant="secondary" icon={Download} onClick={exportEdges} disabled={!result}>Export MST CSV</Button>
          <Button icon={Play} onClick={() => execute(algorithm)}>Run {ALGORITHMS.find((a) => a.key === algorithm)?.short}</Button>
        </>}
      />

      <Card className="p-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div>
            <p className="label mb-2">Select algorithm</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {ALGORITHMS.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setAlgorithm(item.key)}
                  className={`rounded-xl border p-3 text-left transition ${algorithm === item.key ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/15 dark:bg-brand-900/20' : 'border-slate-200 hover:border-brand-300 dark:border-slate-700'}`}
                >
                  <div className="flex items-center gap-2"><span className={`flex h-7 w-7 items-center justify-center rounded-lg ${algorithm === item.key ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}><GitBranch className="h-3.5 w-3.5" /></span><span className="text-sm font-bold text-slate-800 dark:text-white">{item.label}</span></div>
                  <p className="mt-2 text-[11px] text-slate-500">{item.description}</p>
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="indigo" icon={Play} onClick={() => execute(algorithm)}>Run selected</Button>
            <Button variant="success" icon={Layers3} onClick={() => execute('both')}>Run both & compare</Button>
          </div>
        </div>
      </Card>

      {result && !result.connected && (
        <Card className="border-amber-300 bg-amber-50/80 p-5 dark:border-amber-800 dark:bg-amber-900/20">
          <div className="flex items-start gap-3">
            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">Disconnected network — no complete spanning tree exists</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-amber-800 dark:text-amber-300">
                The algorithm connected what it could and produced a spanning forest. A spanning tree that connects every location is impossible unless all locations belong to one connected component.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(result.components || []).map((component, index) => (
                  <Badge key={index} tone="amber">Component {index + 1}: {component.map(nameOf).join(', ')}</Badge>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={RouteIcon} label="MST Total Cost" value={result ? formatCurrency(result.totalCost, currency) : '—'} supporting={result ? 'Minimum connecting cost' : 'Run an algorithm'} accent="emerald" />
        <StatCard icon={GitBranch} label="Edges Selected" value={result ? result.mstEdgeIds.length : '—'} supporting={result ? `Expected ${Math.max(0, locations.length - 1)} for a connected graph` : '—'} accent="blue" />
        <StatCard icon={MapPin} label="Locations Connected" value={result ? `${result.verticesConnected.length}/${locations.length}` : '—'} supporting={result?.connected ? 'All locations reached' : 'Partial coverage only'} accent="indigo" />
        <StatCard icon={Clock3} label="Execution Time" value={result ? formatTime(result.executionTimeMs) : '—'} supporting={result ? `${result.iterations} iterations measured` : 'Actual performance.now() reading'} accent="violet" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader icon={NetworkIcon} title="Original network" subtitle={`${routes.length} weighted routes · ${formatCurrency(originalCost, currency)} total cost`} />
          <div className="p-4"><GraphCanvas vertices={locations} edges={routes} positions={positions} height={340} selectedNodeId={null} /></div>
        </Card>
        <Card>
          <CardHeader
            icon={GitBranch}
            title="Optimized spanning tree"
            subtitle={result ? `${result.mstEdgeIds.length} selected edges · ${formatCurrency(result.totalCost, currency)}` : 'Run an algorithm to see the result'}
            action={result && verification && <Badge tone={verification.valid ? 'emerald' : 'rose'} dot>{verification.valid ? 'Validated MST' : 'Validation issue'}</Badge>}
          />
          <div className="p-4">
            {result ? (
              <>
                <GraphCanvas
                  vertices={locations}
                  edges={routes}
                  positions={positions}
                  height={340}
                  highlightedEdgeIds={result.mstEdgeIds}
                  mutedEdgeIds={routes.filter((edge) => !result.mstEdgeIds.includes(edge.id)).map((edge) => edge.id)}
                />
                <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-500"><span className="flex items-center gap-1.5"><span className="h-2.5 w-5 rounded-full bg-emerald-500" />MST edge</span><span className="flex items-center gap-1.5"><span className="h-2.5 w-5 rounded-full bg-slate-300" />Muted non-MST edge</span></div>
              </>
            ) : (
              <EmptyState icon={GitBranch} title="No optimized graph yet" description="Choose an algorithm and run it to generate the minimum spanning tree." />
            )}
          </div>
        </Card>
      </div>

      {result && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={Zap} label="Network Savings" value={formatCurrency(savings.amount, currency)} supporting="Original cost minus MST cost" accent="amber" />
            <StatCard icon={CheckCircle2} label="Savings Percentage" value={`${savings.percentage.toFixed(1)}%`} supporting="Relative to original network cost" accent="emerald" />
            <StatCard icon={Info} label="Algorithm" value={activeKey === 'prim' ? 'Prim’s' : 'Kruskal’s'} supporting={activeKey === 'prim' ? `Started at ${result.startVertexId || 'first vertex'}` : `${result.rejectedEdgeIds?.length || 0} cycle rejections`} accent="blue" />
            <StatCard icon={Layers3} label="Optimization Status" value={result.connected ? 'Complete' : 'Partial'} supporting={result.connected ? 'Spanning tree validated' : 'Disconnected graph'} accent={result.connected ? 'emerald' : 'amber'} />
          </div>

          <Card>
            <CardHeader icon={RouteIcon} title="Selected MST edges" subtitle="Actual edges chosen by the algorithm and their real weights" action={<Badge tone="emerald">{result.mstEdgeIds.length} edges</Badge>} />
            {result.mstEdges.length === 0 ? (
              <EmptyState title="No edges selected" description="This network has no routes that could be included in a spanning forest." />
            ) : (
              <div className="table-wrap rounded-none border-0">
                <table className="data-table">
                  <thead><tr><th>Edge ID</th><th>Source</th><th>Destination</th><th>Type</th><th>Cost</th><th>Status</th></tr></thead>
                  <tbody>
                    {result.mstEdges.map((edge) => (
                      <tr key={edge.id}>
                        <td className="font-mono text-xs text-slate-400">{edge.id}</td>
                        <td className="font-semibold">{nameOf(edge.source)}</td>
                        <td className="font-semibold">{nameOf(edge.target)}</td>
                        <td>{edge.type || '—'}</td>
                        <td className="font-bold text-emerald-600">{formatCurrency(edge.cost, currency)}</td>
                        <td><Badge tone="emerald" dot>In MST</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}

      <Card>
        <CardHeader icon={Play} title="Step-by-step algorithm visualization" subtitle="Every frame is generated from the real algorithm execution" action={
          Object.keys(mstResults).filter((key) => mstResults[key]?.steps?.length).length > 1 ? (
            <div className="flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
              {Object.keys(mstResults).filter((key) => mstResults[key]?.steps?.length).map((key) => (
                <button key={key} onClick={() => setActiveTab(key)} className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition ${activeKey === key ? 'bg-white text-brand-600 shadow-sm dark:bg-slate-700' : 'text-slate-500'}`}>{key === 'prim' ? 'Prim' : 'Kruskal'}</button>
              ))}
            </div>
          ) : null
        } />
        <div className="p-5">
          <StepPlayer
            steps={result?.steps || []}
            vertices={locations}
            edges={routes}
            positions={positions}
            defaultSpeed={settings.animationSpeed}
            currency={currency}
          />
        </div>
      </Card>

      <Card className="border-brand-100 bg-brand-50/40 p-5 dark:border-brand-900/40 dark:bg-brand-900/10">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
          <div className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            <p className="font-bold text-slate-800 dark:text-white">What does the MST guarantee?</p>
            <p className="mt-1">A minimum spanning tree connects all locations with the smallest possible total connection cost and exactly V−1 edges, without cycles. It does not necessarily minimize travel time between individual pairs, nor does it produce shortest paths. When equal-weight alternatives exist, Prim and Kruskal may choose different edge sets with the same minimum total cost.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
