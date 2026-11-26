import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapPin, Plus, Search, Pencil, Trash2, Download, Printer, ArrowUpDown, Building2, Filter } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import PageHeader from '../components/common/PageHeader.jsx';
import { Card } from '../components/common/Card.jsx';
import Button from '../components/common/Button.jsx';
import Modal from '../components/common/Modal.jsx';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';
import Badge from '../components/common/Badge.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import { LOCATION_TYPES } from '../data/sampleData.js';
import { validateLocationInput } from '../utils/graphUtils.js';
import { downloadCSV, printPage } from '../utils/export.js';

const TYPE_TONES = { Warehouse: 'blue', 'Delivery Hub': 'indigo', 'Distribution Center': 'emerald', 'Retail Store': 'amber', 'Customer Zone': 'violet' };
const EMPTY_FORM = { name: '', code: '', city: '', type: '', description: '' };

export default function Locations() {
  const { locations, routes, addLocation, updateLocation, deleteLocation } = useApp();
  const { notify } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [typeFilter, setTypeFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null) setSearch(q);
    if (searchParams.get('add') === '1') {
      setEditing(null);
      setForm(EMPTY_FORM);
      setErrors({});
      setModalOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete('add');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const cities = useMemo(() => [...new Set(locations.map((l) => l.city).filter(Boolean))].sort(), [locations]);
  const routeCounts = useMemo(() => {
    const counts = {};
    routes.forEach((route) => { counts[route.source] = (counts[route.source] || 0) + 1; counts[route.target] = (counts[route.target] || 0) + 1; });
    return counts;
  }, [routes]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const result = locations.filter((item) => {
      const matchesTerm = !term || [item.id, item.name, item.code, item.city, item.type, item.description].some((field) => field?.toLowerCase().includes(term));
      return matchesTerm && (typeFilter === 'all' || item.type === typeFilter) && (cityFilter === 'all' || item.city === cityFilter);
    });
    return result.sort((a, b) => {
      const first = String(a[sortKey] || '');
      const second = String(b[sortKey] || '');
      return sortDir === 'asc' ? first.localeCompare(second) : second.localeCompare(first);
    });
  }, [locations, search, typeFilter, cityFilter, sortKey, sortDir]);
 
  const openAdd = () => { setEditing(null); setForm({ ...EMPTY_FORM }); setErrors({}); setModalOpen(true); };
  const openEdit = (item) => {
    setEditing(item.id);
    setForm({ name: item.name, code: item.code, city: item.city, type: item.type, description: item.description || '' });
    setErrors({});
    setModalOpen(true);
  };

  const submit = (event) => {
    event.preventDefault();
    const validation = validateLocationInput(form, locations, editing);
    setErrors(validation);
    if (Object.keys(validation).length) {
      notify('Please correct the highlighted fields.', 'error');
      return;
    }
    const payload = { ...form, name: form.name.trim(), code: form.code.trim().toUpperCase(), city: form.city.trim(), description: form.description.trim() };
    if (editing) {
      updateLocation(editing, payload);
      notify(`Location “${payload.name}” updated.`, 'success');
    } else {
      addLocation(payload);
      notify(`Location “${payload.name}” added.`, 'success');
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    deleteLocation(deleting.id);
    notify(`Location “${deleting.name}” deleted.`, 'success');
  };

  const exportRows = filtered.map((item) => ({
    ID: item.id, Name: item.name, Code: item.code, City: item.city,
    Type: item.type, Routes: routeCounts[item.id] || 0, Description: item.description || '',
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Locations"
        description="Manage every warehouse, hub, store and customer zone in your delivery network."
        badge={<Badge tone="blue">{locations.length} total</Badge>}
        actions={<>
          <Button variant="secondary" icon={Printer} onClick={printPage}>Print</Button>
          <Button variant="secondary" icon={Download} onClick={() => downloadCSV('routewise-locations.csv', exportRows)} disabled={!exportRows.length}>Export CSV</Button>
          <Button icon={Plus} onClick={openAdd}>Add location</Button>
        </>}
      />

      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-[minmax(200px,1fr)_180px_180px_180px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, code, city…" className="input pl-9" aria-label="Search locations" />
          </div>
          <div className="relative">
            <Filter className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input appearance-none pl-8" aria-label="Filter by type">
              <option value="all">All types</option>
              {LOCATION_TYPES.map((type) => <option key={type}>{type}</option>)}
            </select>
          </div>
          <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className="input" aria-label="Filter by city">
            <option value="all">All cities</option>
            {cities.map((city) => <option key={city}>{city}</option>)}
          </select>
          <select value={sortKey} onChange={(e) => setSortKey(e.target.value)} className="input" aria-label="Sort field">
            <option value="name">Sort: Name</option>
            <option value="code">Sort: Code</option>
            <option value="city">Sort: City</option>
            <option value="type">Sort: Type</option>
            <option value="id">Sort: ID</option>
          </select>
          <Button variant="secondary" icon={ArrowUpDown} onClick={() => setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))}>
            {sortDir === 'asc' ? 'Asc' : 'Desc'}
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3 dark:border-slate-800">
          <p className="text-xs font-semibold text-slate-500">Showing {filtered.length} of {locations.length} locations</p>
          {(search || typeFilter !== 'all' || cityFilter !== 'all') && (
            <button onClick={() => { setSearch(''); setTypeFilter('all'); setCityFilter('all'); }} className="text-xs font-bold text-brand-600 hover:underline">Clear filters</button>
          )}
        </div>
        {filtered.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title={locations.length === 0 ? 'No locations yet' : 'No matching locations'}
            description={locations.length === 0 ? 'Add your first location to start building the delivery network.' : 'Try changing your search or filters.'}
            action={locations.length === 0 ? <Button icon={Plus} onClick={openAdd}>Add location</Button> : undefined}
          />
        ) : (
          <div className="table-wrap rounded-none border-0">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th><th>Location</th><th>Code</th><th>City</th><th>Type</th><th>Routes</th><th>Description</th><th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id}>
                    <td className="font-mono text-xs text-slate-400">{item.id}</td>
                    <td><div className="flex items-center gap-2.5"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/30"><Building2 className="h-4 w-4" /></span><span className="font-semibold text-slate-900 dark:text-white">{item.name}</span></div></td>
                    <td className="font-mono text-xs font-semibold text-slate-600 dark:text-slate-300">{item.code}</td>
                    <td>{item.city}</td>
                    <td><Badge tone={TYPE_TONES[item.type] || 'slate'}>{item.type}</Badge></td>
                    <td><span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{routeCounts[item.id] || 0}</span></td>
                    <td className="max-w-[260px] truncate text-xs text-slate-500" title={item.description}>{item.description || '—'}</td>
                    <td className="text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEdit(item)} className="rounded-lg p-2 text-slate-500 transition hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-900/30" title="Edit location" aria-label={`Edit ${item.name}`}><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => setDeleting(item)} className="rounded-lg p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/30" title="Delete location" aria-label={`Delete ${item.name}`}><Trash2 className="h-4 w-4" /></button>
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
        title={editing ? 'Edit location' : 'Add new location'}
        subtitle="Location codes must be unique. IDs are assigned automatically."
        footer={<>
          <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={submit}>{editing ? 'Save changes' : 'Add location'}</Button>
        </>}
      >
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Location name *</label>
            <input className={`input ${errors.name ? '!border-rose-400' : ''}`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Central Warehouse" />
            {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name}</p>}
          </div>
          <div>
            <label className="label">Location code *</label>
            <input className={`input uppercase ${errors.code ? '!border-rose-400' : ''}`} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="CW-01" />
            {errors.code && <p className="mt-1 text-xs text-rose-500">{errors.code}</p>}
          </div>
          <div>
            <label className="label">City *</label>
            <input className={`input ${errors.city ? '!border-rose-400' : ''}`} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="e.g. New York" />
            {errors.city && <p className="mt-1 text-xs text-rose-500">{errors.city}</p>}
          </div>
          <div className="sm:col-span-2">
            <label className="label">Location type *</label>
            <select className={`input ${errors.type ? '!border-rose-400' : ''}`} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="">Select a type…</option>
              {LOCATION_TYPES.map((type) => <option key={type}>{type}</option>)}
            </select>
            {errors.type && <p className="mt-1 text-xs text-rose-500">{errors.type}</p>}
          </div>
          <div className="sm:col-span-2">
            <label className="label">Description</label>
            <textarea rows={3} className="input resize-none" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What happens at this location?" />
          </div>
          <button type="submit" className="hidden" aria-hidden="true" />
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete this location?"
        message={`Deleting “${deleting?.name || ''}” will also remove every route connected to it. This action cannot be undone.`}
        confirmLabel="Delete location"
      />
    </div>
  );
}
