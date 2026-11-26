import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin, Route as RouteIcon, Wallet, GitBranch, CircleCheck, CircleAlert, Activity,
  ArrowRight, Plus, RotateCcw, Sparkles, Clock3, Network as NetworkIcon, Info,
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import PageHeader from '../components/common/PageHeader.jsx';
import StatCard from '../components/common/StatCard.jsx';
import { Card, CardHeader } from '../components/common/Card.jsx';
import Button from '../components/common/Button.jsx';
import Badge from '../components/common/Badge.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';
import CostOverviewChart from '../components/charts/CostOverviewChart.jsx';
import ConnectivityChart from '../components/charts/ConnectivityChart.jsx';
import MetricComparisonChart from '../components/charts/MetricComparisonChart.jsx';
import RouteDistributionChart from '../components/charts/RouteDistributionChart.jsx';
import GraphCanvas from '../components/graph/GraphCanvas.jsx';
import { sumCost, computeSavings, formatCurrency, formatTime, timestampLabel } from '../utils/calculations.js';
import { getConnectedComponents } from '../utils/graphUtils.js';

const ACTIVITY_ICONS = { location: MapPin, route: RouteIcon, algorithm: GitBranch, optimize: Sparkles, simulation: Activity, system: Info };

export default function Dashboard() {
  const { locations, routes, positions, mstResults, activities, settings, resetSample } = useApp();
  const { notify } = useToast();
  const [confirmReset, setConfirmReset] = useState(false);

  const originalCost = useMemo(() => sumCost(routes), [routes]);
  const mstResult = mstResults.kruskal || mstResults.prim || null;
  const mstCost = mstResult?.totalCost ?? null;
  const savings = computeSavings(originalCost, mstCost ?? originalCost);
  const components = useMemo(() => getConnectedComponents(locations, routes), [locations, routes]);
  const connected = components.length <= 1;
  const currency = settings.currency || 'USD';

  const optimizationInfo = useMemo(() => {
    if (!mstResult) return null;
    const algorithm = mstResults.kruskal && !mstResults.prim
      ? 'Kruskal’s algorithm'
      : mstResults.prim && !mstResults.kruskal
        ? 'Prim’s algorithm'
        : 'Both algorithms';
    return { algorithm, timestamp: mstResult.timestamp, cost: mstResult.totalCost, edges: mstResult.mstEdgeIds.length };
  }, [mstResult, mstResults]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Network Dashboard"
        description="Monitor your delivery network, track optimization savings, and review algorithm activity."
        badge={connected ? <Badge tone="emerald" dot>Network healthy</Badge> : <Badge tone="amber" dot>Attention required</Badge>}
        actions={<>
          <Button variant="secondary" icon={RotateCcw} onClick={() => setConfirmReset(true)}>Reset sample</Button>
          <Link to="/optimizer"><Button icon={GitBranch}>Run optimization</Button></Link>
        </>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={MapPin} label="Total Locations" value={locations.length} supporting={`${new Set(locations.map((l) => l.city)).size} cities covered`} accent="blue" />
        <StatCard icon={RouteIcon} label="Total Routes" value={routes.length} supporting={`${connected ? 'Fully connected network' : `${components.length} disconnected components`}`} accent="indigo" />
        <StatCard icon={Wallet} label="Total Network Cost" value={formatCurrency(originalCost, currency)} supporting="Sum of all route weights" accent="amber" />
        <StatCard icon={GitBranch} label="MST Total Cost" value={mstCost === null ? '—' : formatCurrency(mstCost, currency)} supporting={mstCost === null ? 'Run the optimizer to calculate' : `${savings.percentage.toFixed(1)}% below original cost`} accent="emerald" trend={mstCost === null ? undefined : `${savings.percentage.toFixed(1)}%`} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <CostOverviewChart originalCost={originalCost} mstCost={mstCost} savings={mstCost === null ? 0 : savings.amount} currency={currency} />
        <ConnectivityChart locations={locations} routes={routes} />
        <MetricComparisonChart results={mstResults} metric="executionTimeMs" />
        <RouteDistributionChart routes={routes} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)]">
        <div className="space-y-4">
          <Card>
            <CardHeader
              icon={NetworkIcon}
              title="Latest network optimization"
              subtitle="Current minimum spanning tree solution"
              action={<Link to="/optimizer" className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700">Open optimizer <ArrowRight className="h-3.5 w-3.5" /></Link>}
            />
            <div className="p-5">
              {!mstResult ? (
                <EmptyState
                  icon={GitBranch}
                  title="No optimization run yet"
                  description="Run Prim’s or Kruskal’s algorithm to compute the minimum spanning tree for this network."
                  action={<Link to="/optimizer"><Button icon={GitBranch} size="sm">Optimize network</Button></Link>}
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <GraphCanvas vertices={locations} edges={routes} positions={positions} highlightedEdgeIds={mstResult.mstEdgeIds} mutedEdgeIds={routes.filter((r) => !mstResult.mstEdgeIds.includes(r.id)).map((r) => r.id)} height={240} />
                    <p className="mt-2 text-center text-[11px] text-slate-400">Green edges form the computed MST</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
                      <span className="text-xs text-slate-500">Algorithm</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-white">{optimizationInfo?.algorithm}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
                      <span className="text-xs text-slate-500">MST cost</span>
                      <span className="text-sm font-extrabold text-emerald-600">{formatCurrency(mstCost, currency)}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
                      <span className="text-xs text-slate-500">Edges selected</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-white">{mstResult.mstEdgeIds.length} of {Math.max(0, locations.length - 1)}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
                      <span className="text-xs text-slate-500">Execution time</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-white">{formatTime(mstResult.executionTimeMs)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400"><Clock3 className="h-3.5 w-3.5" />Last run {timestampLabel(mstResult.timestamp)}</div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader icon={Activity} title="Recent activity" subtitle="Network changes and algorithm executions" action={<Badge tone="slate">{activities.length} events</Badge>} />
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {activities.slice(0, 5).map((item) => {
                const Icon = ACTIVITY_ICONS[item.type] || Info;
                return (
                  <div key={item.id} className="flex items-start gap-3 px-5 py-3.5">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300"><Icon className="h-3.5 w-3.5" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs leading-snug text-slate-700 dark:text-slate-200">{item.message}</p>
                      <p className="mt-1 text-[10px] text-slate-400">{timestampLabel(item.timestamp)}</p>
                    </div>
                  </div>
                );
              })}
              {activities.length === 0 && <EmptyState title="No activity yet" description="Changes to locations, routes and algorithms will appear here." />}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-br from-brand-600 to-indigo-700 p-5 text-white">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-white/70">MST Savings Analysis</p>
                <Sparkles className="h-5 w-5 text-white/80" />
              </div>
              <p className="mt-3 text-3xl font-extrabold">{mstCost === null ? '—' : formatCurrency(savings.amount, currency)}</p>
              <p className="mt-1 text-xs text-white/75">{mstCost === null ? 'Run an algorithm to calculate savings' : `${savings.percentage.toFixed(1)}% savings versus original network`}</p>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/20">
                <div className="h-full rounded-full bg-emerald-300 transition-all duration-700" style={{ width: `${Math.min(100, savings.percentage)}%` }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 p-5 text-xs">
              <div><p className="text-slate-500">Original network</p><p className="mt-1 font-bold text-slate-800 dark:text-white">{formatCurrency(originalCost, currency)}</p></div>
              <div><p className="text-slate-500">Optimized cost</p><p className="mt-1 font-bold text-emerald-600">{mstCost === null ? '—' : formatCurrency(mstCost, currency)}</p></div>
            </div>
            <p className="border-t border-slate-100 px-5 py-3 text-[11px] leading-relaxed text-slate-500 dark:border-slate-800">MST minimizes the cost of connecting every location. It does not minimize individual travel times or guarantee shortest paths between all pairs.</p>
          </Card>

          <Card>
            <CardHeader icon={connected ? CircleCheck : CircleAlert} title="Current MST status" subtitle="Connectivity and optimization readiness" />
            <div className="space-y-3 p-5">
              <div className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2.5 dark:border-slate-800">
                <span className="text-xs text-slate-500">Connected network</span>
                {connected ? <Badge tone="emerald" dot>Yes</Badge> : <Badge tone="amber" dot>No</Badge>}
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2.5 dark:border-slate-800">
                <span className="text-xs text-slate-500">Locations connected</span>
                <span className="text-xs font-bold text-slate-800 dark:text-white">{mstResult?.verticesConnected?.length ?? '-'} / {locations.length}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2.5 dark:border-slate-800">
                <span className="text-xs text-slate-500">Components detected</span>
                <span className="text-xs font-bold text-slate-800 dark:text-white">{components.length}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2.5 dark:border-slate-800">
                <span className="text-xs text-slate-500">Optimization status</span>
                {mstResult ? (
                  <Badge tone={mstResult.connected ? 'emerald' : 'amber'}>{mstResult.connected ? 'MST verified ready' : 'Forest only'}</Badge>
                ) : <Badge tone="slate">Not run</Badge>}
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <Link to="/locations?add=1"><Button size="sm" variant="secondary" icon={Plus}>Add location</Button></Link>
                <Link to="/routes"><Button size="sm" variant="secondary" icon={RouteIcon}>Manage routes</Button></Link>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={() => { resetSample(); notify('Sample network restored.', 'success'); }}
        title="Reset to sample data?"
        message="This replaces your current locations, routes, node positions and saved MST results with the original sample network."
        confirmLabel="Reset sample"
        tone="indigo"
      />
    </div>
  );
}
