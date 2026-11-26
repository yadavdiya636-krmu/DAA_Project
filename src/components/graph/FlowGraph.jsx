import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ReactFlow, ReactFlowProvider, Background, BackgroundVariant, MiniMap,
  Handle, Position, useNodesState, useEdgesState, useReactFlow, MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { getPositionMap, circularLayout, getId } from '../../utils/graphUtils.js';

function RouteNode({ data }) {
  return (
    <div className={`rw-node min-w-[120px] rounded-xl border-2 bg-white px-3 py-2 text-center shadow-md transition dark:bg-slate-800 ${data.highlighted ? 'border-emerald-500' : 'border-slate-300 dark:border-slate-600'}`}>
      <Handle type="target" position={Position.Left} id="left" className="!h-2 !w-2 !border-slate-400 !bg-white" />
      <Handle type="target" position={Position.Top} id="top" className="!h-2 !w-2 !border-slate-400 !bg-white" />
      <div className="text-[10px] font-bold uppercase tracking-wide text-brand-600 dark:text-brand-300">{data.code}</div>
      <div className="max-w-[140px] truncate text-xs font-bold text-slate-800 dark:text-slate-100">{data.label}</div>
      <div className="text-[10px] text-slate-400">{data.type}</div>
      <Handle type="source" position={Position.Right} id="right" className="!h-2 !w-2 !border-slate-400 !bg-white" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!h-2 !w-2 !border-slate-400 !bg-white" />
    </div>
  );
}

const nodeTypes = { routeNode: RouteNode };

function FlowGraphInner({
  vertices, routes, positions, mstEdgeIds = [], showMST = false,
  showEdgeLabels = true, snapToGrid = false, onSavePositions, onInspect, selectedNodeId, selectedEdgeId,
  onResetSignal,
}) {
  const pointMap = useMemo(() => getPositionMap(vertices, positions), [vertices, positions]);
  const initialNodes = useMemo(() => vertices.map((vertex) => ({
    id: getId(vertex),
    type: 'routeNode',
    position: pointMap[getId(vertex)],
    data: {
      label: vertex.name,
      code: vertex.code,
      type: vertex.type,
      highlighted: showMST && vertices.some((v) => getId(v) !== getId(vertex) && mstEdgeIds.some((id) => {
        const edge = routes.find((e) => getId(e) === id);
        return edge && (getId(edge.source) === getId(vertex) || getId(edge.target) === getId(vertex));
      })),
    },
    selected: selectedNodeId === getId(vertex),
  })), [vertices, pointMap, showMST, mstEdgeIds, routes, selectedNodeId]);

  const initialEdges = useMemo(() => routes.map((edge) => {
    const inMST = mstEdgeIds.includes(getId(edge));
    const active = showMST && inMST;
    const muted = showMST && !inMST;
    return {
      id: getId(edge),
      source: getId(edge.source),
      target: getId(edge.target),
      sourceHandle: 'right',
      targetHandle: 'left',
      type: 'smoothstep',
      animated: active,
      label: showEdgeLabels ? `${edge.cost}` : undefined,
      labelStyle: { fill: active ? '#047857' : '#475569', fontWeight: 700, fontSize: 11 },
      labelBgStyle: { fill: '#ffffff', fillOpacity: 0.95 },
      labelBgPadding: [6, 3],
      labelBgBorderRadius: 6,
      style: {
        stroke: active ? '#10b981' : muted ? '#cbd5e1' : '#94a3b8',
        strokeWidth: active ? 4 : muted ? 1.5 : 2,
        opacity: muted ? 0.45 : 1,
      },
      markerEnd: { type: MarkerType.ArrowClosed, color: active ? '#10b981' : '#94a3b8', width: 14, height: 14 },
      selected: selectedEdgeId === getId(edge),
      data: { edge },
    };
  }), [routes, mstEdgeIds, showMST, showEdgeLabels, selectedEdgeId]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { fitView, zoomIn, zoomOut, setCenter } = useReactFlow();
  const [tool, setTool] = useState(null);

  useEffect(() => setNodes(initialNodes), [initialNodes, setNodes]);
  useEffect(() => setEdges(initialEdges), [initialEdges, setEdges]);

  useEffect(() => {
    const timer = window.setTimeout(() => fitView({ padding: 0.18, duration: 400 }), 120);
    return () => window.clearTimeout(timer);
  }, [fitView, vertices.length, routes.length]);

  useEffect(() => {
    if (onResetSignal === 0) return;
    const layout = circularLayout(vertices);
    onSavePositions?.(layout);
    setNodes((prev) => prev.map((node) => ({ ...node, position: layout[node.id] || node.position })));
    window.setTimeout(() => fitView({ padding: 0.18, duration: 500 }), 60);
  }, [onResetSignal]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleNodeDragStop = useCallback((_, node) => {
    onSavePositions?.({ [node.id]: { x: Math.round(node.position.x), y: Math.round(node.position.y) } });
  }, [onSavePositions]);

  return (
    <div className="relative h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={handleNodeDragStop}
        onNodeClick={(_, node) => onInspect?.({ kind: 'node', id: node.id })}
        onEdgeClick={(_, edge) => onInspect?.({ kind: 'edge', id: edge.id })}
        onNodeMouseEnter={(_, node) => setTool({ label: `${node.data.code} · ${node.data.label}`, detail: node.data.type })}
        onNodeMouseLeave={() => setTool(null)}
        onEdgeMouseEnter={(_, edge) => setTool({ label: `${edge.source} → ${edge.target}`, detail: `Cost ${edge.data?.edge?.cost ?? ''}` })}
        onEdgeMouseLeave={() => setTool(null)}
        fitView
        fitViewOptions={{ padding: 0.18 }}
        minZoom={0.25}
        maxZoom={2.2}
        snapToGrid={snapToGrid}
        proOptions={{ hideAttribution: true }}
        className="bg-slate-50/50 dark:bg-slate-900/30"
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1.2} color="#cbd5e1" />
        <MiniMap pannable zoomable nodeColor="#6366f1" maskColor="rgba(241,245,249,0.7)" className="!bottom-3 !right-3 !hidden !h-24 !w-36 rounded-lg border !border-slate-200 sm:!block" />
      </ReactFlow>

      <div className="absolute left-3 top-3 z-10 flex flex-col gap-1 rounded-xl border border-slate-200 bg-white/95 p-1 shadow-sm dark:border-slate-700 dark:bg-slate-900/95">
        {[
          { icon: '＋', title: 'Zoom in', action: () => zoomIn({ duration: 220 }) },
          { icon: '−', title: 'Zoom out', action: () => zoomOut({ duration: 220 }) },
          { icon: '⤢', title: 'Fit to screen', action: () => fitView({ padding: 0.18, duration: 400 }) },
          { icon: '⌖', title: 'Center network', action: () => {
            const points = Object.values(pointMap);
            if (points.length) setCenter(points.reduce((s, p) => s + p.x, 0) / points.length, points.reduce((s, p) => s + p.y, 0) / points.length, { duration: 400 });
          } },
        ].map((button) => (
          <button key={button.title} onClick={button.action} title={button.title} aria-label={button.title} className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
            {button.icon}
          </button>
        ))}
      </div>

      {tool && (
        <div className="pointer-events-none absolute bottom-3 left-3 z-10 rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-xs shadow-sm dark:border-slate-700 dark:bg-slate-900/95">
          <p className="font-bold text-slate-800 dark:text-white">{tool.label}</p>
          <p className="text-slate-500">{tool.detail}</p>
        </div>
      )}
    </div>
  );
}

export default function FlowGraph(props) {
  return (
    <ReactFlowProvider>
      <FlowGraphInner {...props} />
    </ReactFlowProvider>
  );
}
