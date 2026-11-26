import React, { useEffect, useMemo, useState } from 'react';
import { Play, Pause, SkipForward, SkipBack, RotateCcw, Gauge, CheckCircle2, CircleDot, XCircle } from 'lucide-react';
import Button from '../common/Button.jsx';
import Badge from '../common/Badge.jsx';
import GraphCanvas from '../graph/GraphCanvas.jsx';
import { formatCurrency } from '../../utils/calculations.js';

const PHASE_TONES = { init: 'slate', candidate: 'amber', select: 'emerald', reject: 'rose', stop: 'rose', done: 'blue' };

export default function StepPlayer({ steps = [], vertices = [], edges = [], positions, defaultSpeed = 700, currency = 'USD', height = 360 }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(defaultSpeed);

  useEffect(() => { setIndex(0); setPlaying(false); }, [steps]);
  useEffect(() => { setSpeed(defaultSpeed); }, [defaultSpeed]);

  useEffect(() => {
    if (!playing || !steps.length) return undefined;
    if (index >= steps.length - 1) {
      setPlaying(false);
      return undefined;
    }
    const timer = window.setTimeout(() => setIndex((prev) => Math.min(prev + 1, steps.length - 1)), speed);
    return () => window.clearTimeout(timer);
  }, [playing, index, speed, steps.length]);

  const step = steps[index] || null;
  const allEdgeIds = useMemo(() => edges.map((e) => e.id), [edges]);
  const mutedEdgeIds = useMemo(() => {
    if (!step) return [];
    const visible = new Set([...step.mstEdgeIds, ...step.candidateEdgeIds, ...(step.rejectedEdgeIds || []), step.currentEdgeId].filter(Boolean));
    return allEdgeIds.filter((id) => !visible.has(id));
  }, [step, allEdgeIds]);

  if (!steps.length) {
    return <p className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500 dark:bg-slate-800/50">Run an algorithm to generate its step-by-step trace.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/70 p-2 dark:border-slate-700 dark:bg-slate-800/40">
        <Button size="sm" variant="primary" icon={Play} onClick={() => { setIndex(0); setPlaying(true); }}>Start</Button>
        <Button size="sm" variant="secondary" icon={playing ? Pause : Play} onClick={() => {
          if (index === steps.length - 1) setIndex(0);
          setPlaying((prev) => !prev);
        }}>{playing ? 'Pause' : 'Resume'}</Button>
        <Button size="sm" variant="ghost" icon={SkipBack} disabled={index === 0} onClick={() => { setPlaying(false); setIndex((prev) => prev - 1); }}>Previous</Button>
        <Button size="sm" variant="ghost" icon={SkipForward} disabled={index === steps.length - 1} onClick={() => { setPlaying(false); setIndex((prev) => prev + 1); }}>Next</Button>
        <Button size="sm" variant="ghost" icon={RotateCcw} onClick={() => { setPlaying(false); setIndex(0); }}>Reset</Button>
        <div className="ml-auto flex min-w-[180px] flex-1 items-center gap-2 px-2 sm:max-w-[240px]">
          <Gauge className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            type="range" min={150} max={1600} step={50} value={speed}
            onChange={(event) => setSpeed(Number(event.target.value))}
            className="h-1 w-full accent-brand-600"
            aria-label="Animation speed"
          />
          <span className="w-12 shrink-0 text-right text-[10px] font-semibold text-slate-500">{speed}ms</span>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-3">
          <GraphCanvas
            vertices={vertices}
            edges={edges}
            positions={positions}
            height={height}
            highlightedEdgeIds={step.mstEdgeIds}
            mutedEdgeIds={mutedEdgeIds}
            candidateEdgeIds={step.candidateEdgeIds}
            rejectedEdgeIds={step.rejectedEdgeIds || []}
            currentEdgeId={step.currentEdgeId}
            visitedNodeIds={step.visited}
          />
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />Selected / MST</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" />Candidate</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-brand-600" />Current edge</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-rose-500" />Rejected (cycle)</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-slate-300" />Unselected</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-2">
              <Badge tone={PHASE_TONES[step.phase] || 'slate'}>{step.phase.toUpperCase()}</Badge>
              <span className="text-[11px] font-semibold text-slate-400">Step {index + 1} / {steps.length}</span>
            </div>
            <h4 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">{step.title}</h4>
            <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">{step.description}</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-emerald-50 p-2.5 dark:bg-emerald-900/20">
                <p className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-300">Current cost</p>
                <p className="text-sm font-extrabold text-emerald-800 dark:text-emerald-200">{formatCurrency(step.totalCost, currency)}</p>
              </div>
              <div className="rounded-lg bg-brand-50 p-2.5 dark:bg-brand-900/20">
                <p className="text-[10px] font-bold uppercase text-brand-700 dark:text-brand-300">Edges in MST</p>
                <p className="text-sm font-extrabold text-brand-800 dark:text-brand-200">{step.mstEdgeIds.length}</p>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />{step.visited.length} visited</span>
              <span className="inline-flex items-center gap-1"><CircleDot className="h-3.5 w-3.5 text-amber-500" />{step.candidateEdgeIds.length} candidates</span>
              {(step.rejectedEdgeIds?.length || 0) > 0 && <span className="inline-flex items-center gap-1"><XCircle className="h-3.5 w-3.5 text-rose-500" />{step.rejectedEdgeIds.length} rejected</span>}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
            <p className="border-b border-slate-100 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:border-slate-800">Algorithm trace</p>
            <div className="max-h-64 overflow-y-auto p-2">
              {steps.map((item, position) => (
                <button
                  key={item.index}
                  onClick={() => { setPlaying(false); setIndex(position); }}
                  className={`flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left text-[11px] transition ${position === index ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                >
                  <span className="w-5 shrink-0 font-bold opacity-60">{String(position + 1).padStart(2, '0')}</span>
                  <span className="line-clamp-2">{item.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
