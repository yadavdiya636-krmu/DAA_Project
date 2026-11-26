import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Route as RouteIcon, Plus, Search, Pencil, Trash2, Download, Printer, ArrowUpDown, Filter, Info } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import PageHeader from '../components/common/PageHeader.jsx';
import { Card } from '../components/common/Card.jsx';
import Button from '../components/common/Button.jsx';
import Modal from '../components/common/Modal.jsx';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';
import Badge from '../components/common/Badge.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import { ROUTE_TYPES } from '../data/sampleData.js';
import { validateRouteInput } from '../utils/graphUtils.js';
import { formatCurrency } from '../utils/calculations.js';
import { downloadCSV, printPage } from '../utils/export.js';

const TYPE_TONES = { Highway: 'blue', Express: 'indigo', Local: 'emerald', Air: 'violet', Rail: 'amber' };
const EMPTY_FORM = { source: '', target: '', distance: '', cost: '', type: '', description: '' };

export default function Routes() {
  const { locations, routes, addRoute, updateRoute, deleteRoute, settings } = useApp();
  const { notify } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [typeFilter, setTypeFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [sortKey, setSortKey] = useState('cost');
  const [sortDir, setSortDir] = useState('asc');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [deleting, setDeleting] = useState(null);
  const currency = settings.currency || 'USD';
  const nameOf = (id) => locations.find((l) => l.id === id)?.name || id;

  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null) setSearch(q);
    if (searchParams.get('add') === '1') {
      setEditing(null);
      setForm({ ...EMPTY_FORM });
      setErrors({});
      setModalOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete('add');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const result = routes.filter((route) => {
      const haystack = [route.id, route.source, route.target, nameOf(route.source), nameOf(route.target), route.type, route.description];
      const matchesTerm = !term || haystack.some((field) => field?.toLowerCase().includes(term));
      return matchesTerm
        && (typeFilter === 'all' || route.type === typeFilter)
        && (locationFilter === 'all' || route.source === locationFilter || route.target === locationFilter);
    });
    return result.sort((a, b) => {
      if (sortKey === 'cost' || sortKey === 'distance') {
        return sortDir === 'asc' ? Number(a[sortKey]) - Number(b[sortKey]) : Number(b[sortKey]) - Number(a[sortKey]);
      }
      const first = String(a[sortKey] || '');
      const second = String(b[sortKey] || '');
      return sortDir === 'asc' ? first.localeCompare(second) : second.localeCompare(first);
    });
  }, [routes, locations, search, typeFilter, locationFilter, sortKey, sortDir]);

  const openAdd = () => { setEditing(null); setForm({ ...EMPTY_FORM }); setErrors({}); setModalOpen(true); };
  const openEdit = (item) => {
    setEditing(item.id);
    setForm({ source: item.source, target: item.target, distance: String(item.distance), cost: String(item.cost), type: item.type, description: item.description || '' });
    setErrors({});
    setModalOpen(true);
  };

  const submit = (event) => {
    event.preventDefault();
    const validation = validateRouteInput({ ...form, routes }, locations, editing);
    setErrors(validation);
    if (Object.keys(validation).length) {
      notify('Please correct the highlighted fields.', 'error');
      return;
    }
    const payload = {
      ...form,
      distance: Number(form.distance),
      cost: Number(form.cost),
      description: form.description.trim(),
    };
    if (editing) {
      updateRoute(editing, payload);
      notify(`Route ${editing} updated.`, 'success');
    } else {
      addRoute(payload);
      notify(`Route ${payload.source} → ${payload.target} added.`, 'success');
    }
    setModalOpen(false);
  };

  const exportRows = filtered.map((route) => ({
    ID: route.id, Source: nameOf(route.source), Destination: nameOf(route.target),
    'Source ID': route.source, 'Destination ID': route.target,
    Distance: route.distance, Cost: route.cost, Type: route.type, Description: route.description || '',
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Routes"
        description="Define weighted, undirected connections between locations. Costs drive the minimum spanning tree."
        badge={<Badge tone="indigo">{routes.length} routes</Badge>}
        actions={<>
          <Button variant="secondary" icon={Printer} onClick={printPage}>Print</Button>
          <Button variant="secondary" icon={Download} onClick={() => downloadCSV('routewise-routes.csv', exportRows)} disabled={!exportRows.length}>Export CSV</Button>
          <Button icon={Plus} onClick={openAdd} disabled={locations.length < 2}>Add route</Button>
        </>}
      />

      {locations.length < 2 && (
        <Card className="flex items-start gap-3 border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-200">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>At least two locations are required before routes can be created. <button onClick={openAdd} className="font-bold underline">Add a location</button> or restore the sample network in Settings.</p>
        </Card>
      )}

      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-[minmax(200px,1fr)_160px_180px_170px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search routes…" className="input pl-9" aria-label="Search routes" />
          </div>
          <div className="relative">
            <Filter className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input appearance-none pl-8" aria-label="Filter by route type">
              <option value="all">All types</option>
              {ROUTE_TYPES.map((type) => <option key={type}>{type}</option>)}
            </select>
          </div>
          <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} className="input" aria-label="Filter by location">
            <option value="all">All locations</option>
            {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
          </select>
          <select value={sortKey} onChange={(e) => setSortKey(e.target.value)} className="input" aria-label="Sort field">
            <option value="cost">Sort: Cost</option>
            <option value="distance">Sort: Distance</option>
            <option value="id">Sort: ID</option>
            <option value="source">Sort: Source</option>
          </select>
          <Button variant="secondary" icon={ArrowUpDown} onClick={() => setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))}>
            {sortDir === 'asc' ? 'Asc' : 'Desc'}
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3 dark:border-slate-800">
          <p className="text-xs font-semibold text-slate-500">Showing {filtered.length} of {routes.length} routes</p>
          {(search || typeFilter !== 'all' || locationFilter !== 'all') && (
            <button onClick={() => { setSearch(''); setTypeFilter('all'); setLocationFilter('all'); }} className="text-xs font-bold text-brand-600 hover:underline">Clear filters</button>
          )}
        </div>
        {filtered.length === 0 ? (
          <EmptyState
            icon={RouteIcon}
            title={routes.length === 0 ? 'No routes yet' : 'No matching routes'}
            description={routes.length === 0 ? 'Add your first weighted route to connect your locations.' : 'Try changing your search or filters.'}
            action={routes.length === 0 && locations.length >= 2 ? <Button icon={Plus} onClick={openAdd}>Add route</Button> : undefined}
          />
        ) : (
          <div className="table-wrap rounded-none border-0">
            <table className="data-table">
              <thead>
                <tr><th>ID</th><th>Source → Destination</th><th>Distance</th><th>Cost</th><th>Type</th><th>Description</th><th className="text-right">Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map((route) => (
                  <tr key={route.id}>
                    <td className="font-mono text-xs text-slate-400">{route.id}</td>
                    <td>
                      <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-100">
                        <span className="font-mono text-[11px] text-slate-400">{route.source}</span>
                        <RouteIcon className="h-3.5 w-3.5 text-brand-500" />
                        <span className="font-mono text-[11px] text-slate-400">{route.target}</span>
                      </div>
                      <p className="mt-0.5 max-w-[270px] truncate text-[11px] text-slate-500">{nameOf(route.source)} → {nameOf(route.target)}</p>
                    </td>
                    <td>{route.distance} km</td>
                    <td className="font-bold text-emerald-600">{formatCurrency(route.cost, currency)}</td>
                    <td><Badge tone={TYPE_TONES[route.type] || 'slate'}>{route.type}</Badge></td>
                    <td className="max-w-[220px] truncate text-xs text-slate-500" title={route.description}>{route.description || '—'}</td>
                    <td className="text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEdit(route)} className="rounded-lg p-2 text-slate-500 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-900/30" aria-label={`Edit route ${route.id}`}><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => setDeleting(route)} className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/30" aria-label={`Delete route ${route.id}`}><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit route' : 'Add new route'}
        subtitle="Routes are undirected. Each pair of locations may have only one route."
        footer={<>
          <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={locations.length < 2}>{editing ? 'Save changes' : 'Add route'}</Button>
        </>}
      >
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Source location *</label>
            <select className={`input ${errors.source ? '!border-rose-400' : ''}`} value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
              <option value="">Select source…</option>
              {locations.map((location) => <option key={location.id} value={location.id}>{location.name} ({location.code})</option>)}
            </select>
            {errors.source && <p className="mt-1 text-xs text-rose-500">{errors.source}</p>}
          </div>
          <div>
            <label className="label">Destination location *</label>
            <select className={`input ${errors.target ? '!border-rose-400' : ''}`} value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })}>
              <option value="">Select destination…</option>
              {locations.map((location) => <option key={location.id} value={location.id}>{location.name} ({location.code})</option>)}
            </select>
            {errors.target && <p className="mt-1 text-xs text-rose-500">{errors.target}</p>}
          </div>
          <div>
            <label className="label">Distance (km) *</label>
            <input type="number" min="0" step="0.1" className={`input ${errors.distance ? '!border-rose-400' : ''}`} value={form.distance} onChange={(e) => setForm({ ...form, distance: e.target.value })} placeholder="e.g. 120" />
            {errors.distance && <p className="mt-1 text-xs text-rose-500">{errors.distance}</p>}
          </div>
          <div>
            <label className="label">Connection cost *</label>
            <input type="number" min="0" step="0.01" className={`input ${errors.cost ? '!border-rose-400' : ''}`} value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} placeholder="e.g. 85" />
            {errors.cost && <p className="mt-1 text-xs text-rose-500">{errors.cost}</p>}
          </div>
          <div className="sm:col-span-2">
            <label className="label">Route type *</label>
            <select className={`input ${errors.type ? '!border-rose-400' : ''}`} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="">Select a type…</option>
              {ROUTE_TYPES.map((type) => <option key={type}>{type}</option>)}
            </select>
            {errors.type && <p className="mt-1 text-xs text-rose-500">{errors.type}</p>}
          </div>
          <div className="sm:col-span-2">
            <label className="label">Description</label>
            <textarea rows={3} className="input resize-none" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe this corridor…" />
          </div>
          <button type="submit" className="hidden" aria-hidden="true" />
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={() => { deleteRoute(deleting.id); notify(`Route ${deleting.id} deleted.`, 'success'); }}
        title="Delete this route?"
        message={`Route ${deleting?.id || ''} (${deleting?.source} → ${deleting?.target}) will be permanently removed from the network.`}
        confirmLabel="Delete route"
      />
    </div>
  );
}
