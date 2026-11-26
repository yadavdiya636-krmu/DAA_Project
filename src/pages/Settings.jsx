import React, { useState } from 'react';
import {
  Settings as SettingsIcon, Info, GitBranch, PlayCircle, Palette, Database,
  RotateCcw, Trash2, ShieldCheck, Monitor, Sun, Moon, Gauge, Activity, HardDrive,
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import PageHeader from '../components/common/PageHeader.jsx';
import { Card, CardHeader } from '../components/common/Card.jsx';
import Button from '../components/common/Button.jsx';
import Badge from '../components/common/Badge.jsx';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';
import { formatTime, timestampLabel } from '../utils/calculations.js';

function Toggle({ checked, onChange, label, description }) {
  return (
    <button onClick={() => onChange(!checked)} className="flex w-full items-center justify-between gap-4 rounded-xl border border-slate-200 p-3 text-left transition hover:border-brand-300 dark:border-slate-700">
      <span><span className="block text-sm font-semibold text-slate-800 dark:text-white">{label}</span><span className="mt-0.5 block text-xs text-slate-500">{description}</span></span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-600'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
      </span>
    </button>
  );
}

export default function Settings() {
  const { settings, updateSettings, resetSample, clearAll, activities, locations, routes, mstResults } = useApp();
  const { notify } = useToast();
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const sim = settings.simulationDefaults;

  const updateSim = (patch) => updateSettings({ simulationDefaults: { ...sim, ...patch } });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Settings" description="Configure application behaviour, visualization defaults, simulation parameters and stored data." badge={<Badge tone="blue">Persistent preferences</Badge>} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader icon={Info} title="Application details" subtitle="RouteWise — academic DAA capstone project" />
          <div className="space-y-2 p-5 text-xs">
            {[
              ['Application', 'RouteWise Delivery Network Optimization System'],
              ['Version', '1.0.0'],
              ['Frontend', 'React 18 · Vite · Tailwind CSS · React Router'],
              ['Visualization', 'React Flow · Recharts · Lucide React'],
              ['Algorithms', 'Prim’s MST · Kruskal’s MST with Union-Find'],
              ['Persistence', 'Browser LocalStorage (versioned keys)'],
              ['External APIs', 'None — all computation runs locally'],
            ].map(([label, value]) => (
              <div key={label} className="flex flex-wrap justify-between gap-2 border-b border-slate-100 py-2 last:border-0 dark:border-slate-800">
                <span className="text-slate-500">{label}</span><span className="text-right font-semibold text-slate-800 dark:text-white">{value}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader icon={Palette} title="Appearance & behaviour" subtitle="Preferences are saved after each change" />
          <div className="space-y-4 p-5">
            <div>
              <label className="label">Theme</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'light', label: 'Light', icon: Sun },
                  { value: 'dark', label: 'Dark', icon: Moon },
                  { value: 'system', label: 'System', icon: Monitor },
                ].map((option) => (
                  <button key={option.value} onClick={() => { updateSettings({ theme: option.value }); notify(`Theme set to ${option.label.toLowerCase()}.`, 'success'); }}
                    className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold transition ${settings.theme === option.value ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300' : 'border-slate-200 text-slate-600 hover:border-brand-300 dark:border-slate-700 dark:text-slate-300'}`}>
                    <option.icon className="h-4 w-4" />{option.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Default algorithm</label>
              <select className="input" value={settings.defaultAlgorithm} onChange={(e) => updateSettings({ defaultAlgorithm: e.target.value })}>
                <option value="prim">Prim’s Algorithm</option>
                <option value="kruskal">Kruskal’s Algorithm</option>
              </select>
            </div>
            <div>
              <label className="label">Animation speed: {settings.animationSpeed} ms per step</label>
              <input type="range" min={150} max={1600} step={50} value={settings.animationSpeed} onChange={(e) => updateSettings({ animationSpeed: Number(e.target.value) })} className="w-full accent-brand-600" />
              <p className="mt-1 text-[11px] text-slate-400">Lower values animate faster. Current: {formatTime(settings.animationSpeed)} per step.</p>
            </div>
            <div>
              <label className="label">Currency</label>
              <select className="input" value={settings.currency} onChange={(e) => updateSettings({ currency: e.target.value })}>
                {['USD', 'EUR', 'GBP', 'INR', 'JPY'].map((code) => <option key={code}>{code}</option>)}
              </select>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader icon={SettingsIcon} title="Graph settings" subtitle="Defaults for the Network Graph page" />
          <div className="space-y-3 p-5">
            <Toggle checked={settings.showEdgeLabels} onChange={(value) => updateSettings({ showEdgeLabels: value })} label="Show edge cost labels" description="Display connection cost on every route" />
            <Toggle checked={settings.snapToGrid} onChange={(value) => updateSettings({ snapToGrid: value })} label="Snap nodes to grid" description="Align dragged nodes to React Flow's grid" />
          </div>
        </Card>

        <Card id="data">
          <CardHeader icon={PlayCircle} title="Simulation defaults" subtitle="Pre-filled values on the Simulation page" />
          <div className="grid gap-3 p-5 sm:grid-cols-2">
            <div><label className="label">Locations</label><input type="number" min={3} max={14} className="input" value={sim.vertexCount} onChange={(e) => updateSim({ vertexCount: Number(e.target.value) })} /></div>
            <div><label className="label">Routes</label><input type="number" min={2} className="input" value={sim.routeCount} onChange={(e) => updateSim({ routeCount: Number(e.target.value) })} /></div>
            <div><label className="label">Density (%)</label><input type="number" min={1} max={100} className="input" value={sim.density} onChange={(e) => updateSim({ density: Number(e.target.value) })} /></div>
            <div><label className="label">Seed</label><input className="input" value={sim.seed} onChange={(e) => updateSim({ seed: e.target.value })} placeholder="Optional" /></div>
            <div><label className="label">Min cost</label><input type="number" min={1} className="input" value={sim.minWeight} onChange={(e) => updateSim({ minWeight: Number(e.target.value) })} /></div>
            <div><label className="label">Max cost</label><input type="number" min={1} className="input" value={sim.maxWeight} onChange={(e) => updateSim({ maxWeight: Number(e.target.value) })} /></div>
          </div>
        </Card>
      </div>

      <Card className="border-rose-200 dark:border-rose-900/50">
        <CardHeader icon={Database} title="Data management" subtitle="Workspace data is stored locally in this browser" />
        <div className="grid gap-4 p-5 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
            <div className="flex items-center gap-2"><RotateCcw className="h-4 w-4 text-brand-600" /><p className="text-sm font-bold text-slate-800 dark:text-white">Restore sample data</p></div>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">Replace the current network with the original 9-location, 15-route sample. Saved MST results and activity history will be reset.</p>
            <Button variant="secondary" size="sm" className="mt-4" icon={RotateCcw} onClick={() => setConfirmReset(true)}>Reset to sample data</Button>
          </div>
          <div className="rounded-xl border border-rose-200 p-4 dark:border-rose-900/50">
            <div className="flex items-center gap-2"><Trash2 className="h-4 w-4 text-rose-600" /><p className="text-sm font-bold text-slate-800 dark:text-white">Clear all network data</p></div>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">Permanently remove locations, routes, node positions and MST results. Your settings are preserved.</p>
            <Button variant="danger" size="sm" className="mt-4" icon={Trash2} onClick={() => setConfirmClear(true)}>Clear all data</Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { icon: HardDrive, label: 'Stored locations', value: locations.length, accent: 'text-brand-600' },
          { icon: GitBranch, label: 'Stored routes', value: routes.length, accent: 'text-indigo-600' },
          { icon: Activity, label: 'Activity events', value: activities.length, accent: 'text-emerald-600' },
          { icon: ShieldCheck, label: 'Saved MST results', value: Object.keys(mstResults).length, accent: 'text-violet-600' },
        ].map((item) => (
          <Card key={item.label} className="flex items-center gap-3 p-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800"><item.icon className={`h-5 w-5 ${item.accent}`} /></span>
            <div><p className="text-xl font-extrabold text-slate-900 dark:text-white">{item.value}</p><p className="text-[11px] text-slate-500">{item.label}</p></div>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader icon={Activity} title="Activity history" subtitle={`${activities.length} persisted events · most recent first`} />
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {activities.slice(0, 20).map((item) => (
            <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-2.5">
              <p className="text-xs text-slate-700 dark:text-slate-200">{item.message}</p>
              <p className="text-[10px] text-slate-400">{timestampLabel(item.timestamp)}</p>
            </div>
          ))}
          {activities.length === 0 && <p className="px-5 py-6 text-center text-xs text-slate-500">No activity recorded.</p>}
        </div>
      </Card>

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={() => { resetSample(); notify('Sample data restored.', 'success'); }}
        title="Restore sample data?"
        message="All current locations, routes, graph positions, MST results and activity logs will be replaced with the sample network."
        confirmLabel="Reset to sample"
        tone="indigo"
      />
      <ConfirmDialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={() => { clearAll(); notify('All network data cleared.', 'success'); }}
        title="Clear all network data?"
        message="This permanently deletes all locations, routes, saved node positions and MST results from this browser. Settings are kept. This action cannot be undone."
        confirmLabel="Clear everything"
      />
    </div>
  );
}
