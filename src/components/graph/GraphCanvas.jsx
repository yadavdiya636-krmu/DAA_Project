import React, { useMemo } from 'react';
import EmptyState from '../common/EmptyState.jsx';
import { getPositionMap, getId } from '../../utils/graphUtils.js';

const NODE_RADIUS = 21;

/**
 * Lightweight responsive SVG graph used in dashboards, optimizer, comparison
 * and algorithm step visualization. React Flow is reserved for the dedicated
 * interactive Network Graph page.
 */
export default function GraphCanvas({
  vertices = [],
  edges = [],
  positions,
  highlightedEdgeIds = [],
  mutedEdgeIds = [],
  candidateEdgeIds = [],
  rejectedEdgeIds = [],
  currentEdgeId = null,
  visitedNodeIds = [],
  selectedNodeId = null,
  onNodeClick,
  onEdgeClick,
  showLabels = true,
  height = 380,
  className = '',
}) {
  const pointMap = useMemo(() => getPositionMap(vertices, positions), [vertices, positions]);

  const bounds = useMemo(() => {
    const points = Object.values(pointMap);
    if (!points.length) return { minX: 0, minY: 0, maxX: 900, maxY: 560 };
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    return {
      minX: Math.min(...xs) - 70,
      maxX: Math.max(...xs) + 70,
      minY: Math.min(...ys) - 65,
      maxY: Math.max(...ys) + 75,
    };
  }, [pointMap]);

  if (!vertices.length) {
    return <EmptyState title="No network to display" description="Add locations and routes to visualize the delivery network." height={height} />;
  }

  const highlighted = new Set(highlightedEdgeIds);
  const muted = new Set(mutedEdgeIds);
  const candidates = new Set(candidateEdgeIds);
  const rejected = new Set(rejectedEdgeIds);
  const visited = new Set(visitedNodeIds);

  return (
    <div className={`w-full overflow-hidden rounded-xl bg-slate-50/60 dark:bg-slate-900/40 ${className}`} style={{ height }}>
      <svg viewBox={`${bounds.minX} ${bounds.minY} ${Math.max(bounds.maxX - bounds.minX, 200)} ${Math.max(bounds.maxY - bounds.minY, 160)}`} className="h-full w-full" role="img" aria-label="Delivery network graph">
        {edges.map((edge) => {
          const from = pointMap[getId(edge.source)];
          const to = pointMap[getId(edge.target)];
          if (!from || !to) return null;
          const id = getId(edge);
          const midX = (from.x + to.x) / 2;
          const midY = (from.y + to.y) / 2;
          let stroke = '#94a3b8';
          let width = 2;
          let dash = undefined;
          let opacity = 1;
          if (muted.has(id)) { stroke = '#cbd5e1'; width = 1.5; opacity = 0.4; }
          if (candidates.has(id)) { stroke = '#f59e0b'; width = 3; dash = '6 4'; opacity = 1; }
          if (rejected.has(id)) { stroke = '#f43f5e'; width = 2.5; dash = '5 5'; opacity = 0.8; }
          if (highlighted.has(id)) { stroke = '#10b981'; width = 4; dash = undefined; opacity = 1; }
          if (id === currentEdgeId) { stroke = '#3366f5'; width = 4.5; dash = undefined; opacity = 1; }
          const label = `${edge.cost}`;
          return (
            <g key={id} className={onEdgeClick ? 'cursor-pointer' : ''} onClick={() => onEdgeClick?.(edge)}>
              <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={stroke} strokeWidth={width} strokeDasharray={dash} strokeOpacity={opacity} strokeLinecap="round" />
              <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="transparent" strokeWidth={16} />
              {showLabels && (
                <g transform={`translate(${midX}, ${midY})`}>
                  <rect x={-label.length * 4 - 6} y={-11} width={label.length * 8 + 12} height={20} rx={7} fill="white" stroke={currentEdgeId === id ? '#3366f5' : '#e2e8f0'} className="dark:fill-slate-900 dark:stroke-slate-700" />
                  <text textAnchor="middle" y={4} className="fill-slate-600 text-[11px] font-bold dark:fill-slate-300">{label}</text>
                </g>
              )}
              <title>{`${edge.source} → ${edge.target} · cost ${edge.cost} · ${edge.type || 'route'}`}</title>
            </g>
          );
        })}
        {vertices.map((vertex) => {
          const point = pointMap[getId(vertex)];
          if (!point) return null;
          const id = getId(vertex);
          const isVisited = visited.has(id);
          const isSelected = selectedNodeId === id;
          return (
            <g key={id} className={onNodeClick ? 'cursor-pointer' : ''} onClick={() => onNodeClick?.(vertex)}>
              {isSelected && <circle cx={point.x} cy={point.y} r={NODE_RADIUS + 7} fill="#6366f1" fillOpacity={0.16} />}
              {isVisited && <circle cx={point.x} cy={point.y} r={NODE_RADIUS + 4} fill="#10b981" fillOpacity={0.14} />}
              <circle
                cx={point.x} cy={point.y} r={NODE_RADIUS}
                fill={isVisited ? '#ecfdf5' : '#ffffff'}
                stroke={isSelected ? '#4f46e5' : isVisited ? '#10b981' : '#94a3b8'}
                strokeWidth={isSelected || isVisited ? 3 : 2}
                className="dark:!fill-slate-800"
              />
              <text x={point.x} y={point.y + 4} textAnchor="middle" className="fill-slate-700 text-[11px] font-extrabold dark:fill-slate-100">
                {String(vertex.code || id).slice(0, 4)}
              </text>
              {showLabels && (
                <text x={point.x} y={point.y + NODE_RADIUS + 17} textAnchor="middle" className="fill-slate-600 text-[11px] font-semibold dark:fill-slate-300">
                  {String(vertex.name || id).length > 18 ? `${String(vertex.name).slice(0, 17)}…` : vertex.name || id}
                </text>
              )}
              <title>{`${vertex.name} (${vertex.code}) · ${vertex.city} · ${vertex.type}`}</title>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
