import React, { useMemo, useState } from 'react';
import { Network, MousePointer2, Move, ZoomIn, Maximize2, GitBranch, MapPin, Route as RouteIcon, Info } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import PageHeader from '../components/common/PageHeader.jsx';
import { Card, CardHeader } from '../components/common/Card.jsx';
import Button from '../components/common/Button.jsx';
import Badge from '../components/common/Badge.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import FlowGraph from '../components/graph/FlowGraph.jsx';
import StatCard from '../components/common/StatCard.jsx';
import { getConnectedComponents, isConnected } from '../utils/graphUtils.js';
import { sumCost, formatCurrency } from '../utils/calculations.js';

export default function NetworkGraph() {
  const { locations, routes, positions, mstResults, savePositions, settings } = useApp();
  const [inspect, setInspect] = useState(null);
  const [showMST, setShowMST] = useState(false);
  const [resetSignal, setResetSignal] = useState(0);

  const mstResult = mstResults.kruskal || mstResults.prim || null;
  const components = useMemo(() => getConnectedComponents(locations, routes), [locations, routes]);
  const connected = isConnected(locations, routes);
  const selectedNode = inspect?.kind === 'node' ? locations.find((l) => l.id === inspect.id) : null;
  const selectedEdge = inspect?.kind === 'edge' ? routes.find((r) => r.id === inspect.id) : null;
  const nameOf = (id) => locations.find((l) => l.id === id)?.name || id;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Network Graph"
        description="Explore your delivery network interactively. Drag nodes, zoom, and inspect locations or weighted routes."
        badge={connected ? <Badge tone="emerald" dot>Connected</Badge> : <Badge tone="amber" dot>{components.length} components</Badge>}
        actions={<>
          <Button variant={showMST ? 'success' : 'secondary'} icon={GitBranch} onClick={() => setShowMST((prev) => !prev)} disabled={!mstResult}>
            {showMST ? 'Hide saved MST' : 'Highlight saved MST'}
          </Button>
          <Button variant="secondary" icon={Maximize2} onClick={() => setResetSignal((prev) => prev + 1)}>Reset layout</Button>
        </>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={MapPin} label="Nodes" value={locations.length} supporting="Delivery locations" accent="blue" />
        <StatCard icon={RouteIcon} label="Edges" value={routes.length} supporting="Weighted connections" accent="indigo" />
        <StatCard icon={Network} label="Components" value={components.length} supporting={connected ? 'Single connected network' : 'Network is disconnected'} accent={connected ? 'emerald' : 'amber'} />
        <StatCard icon={GitBranch} label="Network cost" value={formatCurrency(sumCost(routes), settings.currency)} supporting="Sum of all edge weights" accent="violet" />
      </div>

      {locations.length === 0 ? (
        <Card><EmptyState icon={Network} title="Your network is empty" description="Add locations and routes from the management pages to build a visualization." /></Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
          <Card className="overflow-hidden">
            <CardHeader
              icon={Network}
              title="Interactive delivery network"
              subtitle="Node positions are saved automatically after dragging"
              action={<div className="hidden flex-wrap items-center gap-3 text-[11px] text-slate-500 sm:flex"><span className="inline-flex items-center gap-1"><Move className="h-3.5 w-3.5" />Drag nodes</span><span className="inline-flex items-center gap-1"><ZoomIn className="h-3.5 w-3.5" />Scroll to zoom</span><span className="inline-flex items-center gap-1"><MousePointer2 className="h-3.5 w-3.5" />Click to inspect</span></div>}
            />
            <div className="h-[440px] w-full sm:h-[560px]">
              <FlowGraph
                vertices={locations}
                routes={routes}
                positions={positions}
                mstEdgeIds={mstResult?.mstEdgeIds || []}
                showMST={showMST}
                showEdgeLabels={settings.showEdgeLabels}
                snapToGrid={settings.snapToGrid}
                onSavePositions={savePositions}
                onInspect={setInspect}
                selectedNodeId={selectedNode?.id}
                selectedEdgeId={selectedEdge?.id}
                onResetSignal={resetSignal}
              />
            </div>
            {showMST && mstResult && (
              <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 px-5 py-3 text-[11px] text-slate-500 dark:border-slate-800">
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-5 rounded-full bg-emerald-500" />In saved MST</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-5 rounded-full bg-slate-300" />Not selected</span>
                <span className="ml-auto">Saved result: {mstResult.mstEdgeIds.length} edges · cost {formatCurrency(mstResult.totalCost, settings.currency)}</span>
              </div>
            )}
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader icon={MousePointer2} title="Inspector" subtitle="Click or hover an item to see details" />
              <div className="p-5">
                {!selectedNode && !selectedEdge && (
                  <EmptyState icon={MousePointer2} title="Nothing selected" description="Click a node or route in the graph to inspect its details here." />
                )}
                {selectedNode && (
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 font-bold text-brand-600 dark:bg-brand-900/30"><MapPin className="h-5 w-5" /></span>
                      <div><p className="text-sm font-bold text-slate-900 dark:text-white">{selectedNode.name}</p><p className="font-mono text-[11px] text-slate-400">{selectedNode.id} · {selectedNode.code}</p></div>
                    </div>
                    {[
                      ['City', selectedNode.city], ['Type', selectedNode.type],
                      ['Connected routes', routes.filter((r) => r.source === selectedNode.id || r.target === selectedNode.id).length],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/50"><span className="text-slate-500">{label}</span><span className="font-bold text-slate-800 dark:text-white">{value}</span></div>
                    ))}
                    {selectedNode.description && <p className="leading-relaxed text-slate-500">{selectedNode.description}</p>}
                  </div>
                )}
                {selectedEdge && (
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30"><RouteIcon className="h-5 w-5" /></span>
                      <div><p className="text-sm font-bold text-slate-900 dark:text-white">{nameOf(selectedEdge.source)} → {nameOf(selectedEdge.target)}</p><p className="font-mono text-[11px] text-slate-400">{selectedEdge.id}</p></div>
                    </div>
                    {[
                      ['Connection cost', formatCurrency(selectedEdge.cost, settings.currency)],
                      ['Distance', `${selectedEdge.distance} km`],
                      ['Type', selectedEdge.type],
                      ['In saved MST', mstResult?.mstEdgeIds?.includes(selectedEdge.id) ? 'Yes' : 'No'],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/50"><span className="text-slate-500">{label}</span><span className="font-bold text-slate-800 dark:text-white">{value}</span></div>
                    ))}
                    {selectedEdge.description && <p className="leading-relaxed text-slate-500">{selectedEdge.description}</p>}
                  </div>
                )}
              </div>
            </Card>

            <Card>
              <CardHeader icon={Info} title="Graph guide" />
              <div className="space-y-2.5 p-5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                <p><strong className="text-slate-800 dark:text-white">Nodes</strong> are delivery locations. <strong className="text-slate-800 dark:text-white">Edges</strong> are weighted, undirected routes.</p>
                <p>Edge labels show connection cost. Hover over any item for a quick tooltip.</p>
                <p>Use the controls at the top to zoom, fit to screen, center the network, or reset the layout.</p>
                <p>Add or remove items from the Locations and Routes pages; the graph updates automatically.</p>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
