import React, { useMemo, useState } from 'react';
import { BarChart3, Play, Layers3, Download, Printer, CheckCircle2, CircleAlert, Info, Clock3, GitCompareArrows } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import PageHeader from '../components/common/PageHeader.jsx';
import { Card, CardHeader } from '../components/common/Card.jsx';
import Button from '../components/common/Button.jsx';
import Badge from '../components/common/Badge.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import MetricComparisonChart from '../components/charts/MetricComparisonChart.jsx';
import SizeBenchmarkChart from '../components/charts/SizeBenchmarkChart.jsx';
import { primMST } from '../algorithms/prim.js';
import { kruskalMST } from '../algorithms/kruskal.js';
import { measure, formatCurrency, formatTime, timestampLabel } from '../utils/calculations.js';
import { downloadCSV, printPage } from '../utils/export.js';

export default function AlgorithmComparison() {
  const { locations, routes, mstResults, settings, saveMSTResult, saveComparison } = useApp();
  const { notify } = useToast();
  const [sizeData, setSizeData] = useState([]);
  const currency = settings.currency || 'USD';
  const prim = mstResults.prim || null;
  const kruskal = mstResults.kruskal || null;

  const runSingle = (which) => {
    if (!locations.length) { notify('Add locations before running algorithms.', 'error'); return; }
    const result = which === 'prim' ? primMST(locations, routes) : kruskalMST(locations, routes);
    saveMSTResult(which, result);
    notify(`${which === 'prim' ? 'Prim’s' : 'Kruskal’s'} algorithm executed on the current network.`, 'success');
  };

  const runBoth = () => {
    if (!locations.length) { notify('Add locations before running algorithms.', 'error'); return; }
    const primResult = primMST(locations, routes);
    const kruskalResult = kruskalMST(locations, routes);
    saveComparison(primResult, kruskalResult);
    setSizeData(benchmarkSizes(locations, routes));
    notify('Both algorithms executed on the same network; benchmarks generated.', 'success');
  };

  const equalCost = prim && kruskal && prim.totalCost === kruskal.totalCost;
  const bothConnected = prim?.connected && kruskal?.connected;

  const tableRows = [
    { metric: 'MST Cost', prim: prim ? formatCurrency(prim.totalCost, currency) : '—', kruskal: kruskal ? formatCurrency(kruskal.totalCost, currency) : '—' },
    { metric: 'Edges Selected', prim: prim ? prim.mstEdgeIds.length : '—', kruskal: kruskal ? kruskal.mstEdgeIds.length : '—' },
    { metric: 'Execution Time', prim: prim ? formatTime(prim.executionTimeMs) : '—', kruskal: kruskal ? formatTime(kruskal.executionTimeMs) : '—' },
    { metric: 'Iterations', prim: prim ? prim.iterations : '—', kruskal: kruskal ? kruskal.iterations : '—' },
    { metric: 'Connected', prim: prim ? (prim.connected ? 'Yes' : 'No') : '—', kruskal: kruskal ? (kruskal.connected ? 'Yes' : 'No') : '—' },
    { metric: 'Locations Reached', prim: prim ? `${prim.verticesConnected.length}/${locations.length}` : '—', kruskal: kruskal ? `${kruskal.verticesConnected.length}/${locations.length}` : '—' },
    { metric: 'Cycle Rejections', prim: 'Not applicable', kruskal: kruskal ? kruskal.rejectedEdgeIds.length : '—' },
    { metric: 'Executed At', prim: prim ? timestampLabel(prim.timestamp) : '—', kruskal: kruskal ? timestampLabel(kruskal.timestamp) : '—' },
  ];

  const exportComparison = () => {
    downloadCSV('routewise-algorithm-comparison.csv', tableRows.map((row) => ({ Metric: row.metric, Prim: row.prim, Kruskal: row.kruskal })));
    notify('Comparison table exported as CSV.', 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Algorithm Comparison"
        description="Execute both MST algorithms on the identical network and compare measured results — never simulated timings."
        badge={equalCost && bothConnected ? <Badge tone="emerald" dot>Same optimal cost</Badge> : <Badge tone="slate">Awaiting results</Badge>}
        actions={<>
          <Button variant="secondary" icon={Printer} onClick={printPage}>Print</Button>
          <Button variant="secondary" icon={Download} onClick={exportComparison} disabled={!prim && !kruskal}>Export CSV</Button>
          <Button variant="secondary" icon={Play} onClick={() => runSingle('prim')}>Run Prim</Button>
          <Button variant="secondary" icon={Play} onClick={() => runSingle('kruskal')}>Run Kruskal</Button>
          <Button icon={Layers3} onClick={runBoth}>Run both</Button>
        </>}
      />

      {!prim && !kruskal ? (
        <Card><EmptyState icon={GitCompareArrows} title="No comparison results yet" description="Run one or both algorithms on the current network to populate the comparison table and charts." action={<Button icon={Layers3} onClick={runBoth}>Run both algorithms</Button>} /></Card>
      ) : (
        <>
          {(bothConnected && equalCost) && (
            <Card className="flex items-start gap-3 border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900/50 dark:bg-emerald-900/15">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              <div><p className="text-sm font-bold text-emerald-900 dark:text-emerald-200">Both algorithms found the minimum spanning tree.</p><p className="mt-1 text-xs text-emerald-800 dark:text-emerald-300">The total costs are identical ({formatCurrency(prim.totalCost, currency)}). They may differ in which equal-weight edges they choose and in execution time — that is expected.</p></div>
            </Card>
          )}
          {(prim && kruskal && prim.totalCost !== kruskal.totalCost) && (
            <Card className="flex items-start gap-3 border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900/50 dark:bg-amber-900/15">
              <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div><p className="text-sm font-bold text-amber-900 dark:text-amber-200">Costs differ between the two runs.</p><p className="mt-1 text-xs text-amber-800 dark:text-amber-300">This happens when the network changed between runs or a graph is disconnected. Re-run both on the same network using “Run both”.</p></div>
            </Card>
          )}
          {prim && !prim.connected && (
            <Card className="flex items-start gap-3 border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900/50 dark:bg-amber-900/15">
              <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <p className="text-xs text-amber-800 dark:text-amber-300">The current graph is disconnected. Both algorithms return spanning forests, not a complete MST.</p>
            </Card>
          )}

          <Card className="overflow-hidden">
            <CardHeader icon={BarChart3} title="Measured comparison" subtitle="Same network · same input data · results computed by the implementations in src/algorithms" />
            <div className="table-wrap rounded-none border-0">
              <table className="data-table">
                <thead><tr><th>Metric</th><th>Prim’s Algorithm</th><th>Kruskal’s Algorithm</th></tr></thead>
                <tbody>
                  {tableRows.map((row) => (
                    <tr key={row.metric}>
                      <td className="font-semibold text-slate-800 dark:text-white">{row.metric}</td>
                      <td className="font-mono text-xs">{row.prim}</td>
                      <td className="font-mono text-xs">{row.kruskal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="grid gap-4 lg:grid-cols-3">
            <MetricComparisonChart results={mstResults} metric="executionTimeMs" />
            <MetricComparisonChart results={mstResults} metric="totalCost" />
            <MetricComparisonChart results={mstResults} metric="iterations" />
          </div>

          <SizeBenchmarkChart
            data={sizeData}
            title="Graph Size vs Execution Time"
            subtitle="Measured on induced sub-networks of increasing size · average of 3 real runs per size"
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader icon={Info} title="How to interpret the results" />
              <div className="space-y-3 p-5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                <p><strong className="text-slate-800 dark:text-white">Which algorithm selected the MST?</strong> Both did, when the graph is connected. For the same connected weighted graph every MST has the same total weight, even when the chosen edges differ.</p>
                <p><strong className="text-slate-800 dark:text-white">How do they differ?</strong> Prim grows one connected tree from a start vertex using a cut-minimum edge. Kruskal sorts all edges globally and merges components with Union-Find, rejecting edges that close a cycle.</p>
                <p><strong className="text-slate-800 dark:text-white">When is Prim useful?</strong> Dense graphs and when you want a connected partial tree early (e.g. incremental network expansion).</p>
                <p><strong className="text-slate-800 dark:text-white">When is Kruskal useful?</strong> Sparse graphs, edge-list data, and when edges are naturally sorted or distributed.</p>
              </div>
            </Card>
            <Card>
              <CardHeader icon={Clock3} title="Timing caveat" />
              <div className="space-y-3 p-5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                <p>Execution times are real readings from <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">performance.now()</code> — no values are fabricated or adjusted to favour an algorithm.</p>
                <p>For small graphs the algorithms finish in microseconds to a few milliseconds, so timer resolution, JIT compilation and CPU scheduling make comparisons unreliable. Treat these numbers as an illustration, not a definitive benchmark.</p>
                <p>Iteration counts are not defined identically: Prim counts edge selections; Kruskal counts edges examined. They describe work done, not a direct like-for-like score.</p>
                {sizeData.length > 0 && <p className="rounded-lg bg-brand-50 p-3 dark:bg-brand-900/20">Size benchmark: {sizeData.length} network sizes, {sizeData.reduce((sum, point) => sum + (point.samples || 0), 0)} measured runs in total.</p>}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

/** Build induced sub-networks of increasing size and time both algorithms. */
function benchmarkSizes(vertices, edges) {
  const points = [];
  for (let size = 2; size <= vertices.length; size += 1) {
    const subset = vertices.slice(0, size);
    const ids = new Set(subset.map((v) => v.id));
    const induced = edges.filter((edge) => ids.has(edge.source) && ids.has(edge.target));
    const prim = measure(() => primMST(subset, induced), 3);
    const kruskal = measure(() => kruskalMST(subset, induced), 3);
    points.push({ size, prim: prim.executionTimeMs, kruskal: kruskal.executionTimeMs, samples: 6 });
  }
  return points;
}
