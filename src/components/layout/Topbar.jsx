import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Menu, Search, Bell, Sun, Moon, ChevronRight, ChevronDown, MapPin, Route as RouteIcon,
  UserCircle2, Settings as SettingsIcon, Printer,
} from 'lucide-react';
import { ALL_NAV_ITEMS } from '../../data/navigation.js';
import { useApp } from '../../context/AppContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useClickOutside } from '../../hooks/useClickOutside.js';
import { printPage } from '../../utils/export.js';
import { timestampLabel } from '../../utils/calculations.js';

export default function Topbar({ onOpenMobile, effectiveTheme, onToggleTheme }) {
  const { locations, routes, activities } = useApp();
  const { notify } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [openMenu, setOpenMenu] = useState(null);
  const [mobileSearch, setMobileSearch] = useState(false);
  const searchRef = useRef(null);
  const bellRef = useRef(null);
  const profileRef = useRef(null);

  const closeAll = useCallback(() => setOpenMenu(null), []);
  useClickOutside(searchRef, closeAll, openMenu === 'search');
  useClickOutside(bellRef, closeAll, openMenu === 'notifications');
  useClickOutside(profileRef, closeAll, openMenu === 'profile');

  const page = ALL_NAV_ITEMS.find((item) => item.path === location.pathname) || ALL_NAV_ITEMS[0];

  const results = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return { locations: [], routes: [] };
    return {
      locations: locations
        .filter((l) => [l.name, l.code, l.city, l.type].some((field) => field?.toLowerCase().includes(term)))
        .slice(0, 5),
      routes: routes
        .filter((r) => [r.id, r.source, r.target, r.type].some((field) => field?.toLowerCase().includes(term)))
        .slice(0, 4),
    };
  }, [search, locations, routes]);

  const goToSearch = (path, value) => {
    navigate(`${path}?q=${encodeURIComponent(value)}`);
    setSearch('');
    closeAll();
  };

  return (
    <header className="no-print sticky top-0 z-30 flex h-[72px] shrink-0 items-center gap-3 border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90 sm:px-6">
      <button onClick={onOpenMobile} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 lg:hidden" aria-label="Open navigation">
        <Menu className="h-5 w-5" />
      </button>

      <div className="min-w-0 flex-1 sm:flex-none">
        <div className="hidden items-center gap-1.5 text-[11px] font-medium text-slate-400 sm:flex">
          <span>Workspace</span><ChevronRight className="h-3 w-3" /><span className="truncate text-slate-500 dark:text-slate-400">{page.label}</span>
        </div>
        <h1 className="truncate text-base font-bold text-slate-900 dark:text-white sm:text-lg">{page.label}</h1>
      </div>

      <div className="relative ml-auto hidden w-full max-w-sm md:block" ref={searchRef}>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(event) => { setSearch(event.target.value); setOpenMenu('search'); }}
          onFocus={() => setOpenMenu('search')}
          onKeyDown={(event) => { if (event.key === 'Escape') closeAll(); }}
          placeholder="Search locations or routes…"
          className="input h-10 pl-9 pr-3"
          aria-label="Global search"
        />
        {openMenu === 'search' && search.trim() && (
          <div className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-xl border border-slate-200 bg-white p-2 shadow-float dark:border-slate-700 dark:bg-slate-900">
            {results.locations.length === 0 && results.routes.length === 0 && (
              <p className="px-3 py-4 text-center text-xs text-slate-500">No matches for “{search}”</p>
            )}
            {results.locations.length > 0 && (
              <>
                <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Locations</p>
                {results.locations.map((item) => (
                  <button key={item.id} onClick={() => goToSearch('/locations', item.name)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
                    <MapPin className="h-4 w-4 text-brand-500" />
                    <span className="min-w-0 flex-1 truncate font-medium text-slate-700 dark:text-slate-200">{item.name}</span>
                    <span className="text-[11px] text-slate-400">{item.code}</span>
                  </button>
                ))}
              </>
            )}
            {results.routes.length > 0 && (
              <>
                <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Routes</p>
                {results.routes.map((item) => (
                  <button key={item.id} onClick={() => goToSearch('/routes', item.id)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
                    <RouteIcon className="h-4 w-4 text-indigo-500" />
                    <span className="min-w-0 flex-1 truncate font-medium text-slate-700 dark:text-slate-200">{item.source} → {item.target}</span>
                    <span className="text-[11px] text-slate-400">{item.id}</span>
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1.5 md:ml-2">
        <button
          onClick={() => setMobileSearch((prev) => !prev)}
          className="rounded-xl p-2.5 text-slate-500 hover:bg-slate-100 md:hidden"
          aria-label="Search"
        >
          <Search className="h-[18px] w-[18px]" />
        </button>
        <button
          onClick={onToggleTheme}
          className="rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          title={`Switch to ${effectiveTheme === 'dark' ? 'light' : 'dark'} theme`}
          aria-label="Toggle theme"
        >
          {effectiveTheme === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
        </button>

        <div className="relative" ref={bellRef}>
          <button
            onClick={() => setOpenMenu(openMenu === 'notifications' ? null : 'notifications')}
            className="relative rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Notifications"
          >
            <Bell className="h-[18px] w-[18px]" />
            {activities.length > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />}
          </button>
          {openMenu === 'notifications' && (
            <div className="absolute right-0 top-12 z-50 w-[min(340px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-float dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                <p className="text-sm font-bold text-slate-800 dark:text-white">Recent activity</p>
                <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-600 dark:bg-brand-900/30">{activities.length}</span>
              </div>
              <div className="max-h-80 overflow-y-auto p-2">
                {activities.slice(0, 6).map((item) => (
                  <div key={item.id} className="rounded-lg px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800">
                    <p className="text-xs leading-snug text-slate-700 dark:text-slate-200">{item.message}</p>
                    <p className="mt-1 text-[10px] text-slate-400">{timestampLabel(item.timestamp)}</p>
                  </div>
                ))}
                {activities.length === 0 && <p className="px-3 py-6 text-center text-xs text-slate-500">No activity recorded yet.</p>}
              </div>
              <button onClick={() => { navigate('/'); closeAll(); }} className="w-full border-t border-slate-100 py-2.5 text-xs font-bold text-brand-600 hover:bg-brand-50 dark:border-slate-800 dark:hover:bg-slate-800">
                View dashboard
              </button>
            </div>
          )}
        </div>

        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setOpenMenu(openMenu === 'profile' ? null : 'profile')}
            className="flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Profile menu"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-brand-600 text-xs font-bold text-white">RW</span>
            <ChevronDown className="hidden h-3.5 w-3.5 text-slate-400 sm:block" />
          </button>
          {openMenu === 'profile' && (
            <div className="absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white p-2 shadow-float dark:border-slate-700 dark:bg-slate-900">
              <div className="border-b border-slate-100 px-3 py-2.5 dark:border-slate-800">
                <p className="text-sm font-bold text-slate-800 dark:text-white">Network Admin</p>
                <p className="text-[11px] text-slate-400">admin@routewise.local</p>
              </div>
              {[
                { icon: UserCircle2, label: 'Profile & settings', action: () => navigate('/settings') },
                { icon: SettingsIcon, label: 'Data management', action: () => navigate('/settings#data') },
                { icon: Printer, label: 'Print current page', action: () => { printPage(); notify('Print dialog opened.', 'info'); } },
              ].map((item) => (
                <button key={item.label} onClick={() => { item.action(); closeAll(); }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800">
                  <item.icon className="h-4 w-4 text-slate-400" />{item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {mobileSearch && (
        <div className="absolute left-0 right-0 top-[72px] z-40 border-b border-slate-200 bg-white p-3 shadow-lg dark:border-slate-800 dark:bg-slate-900 md:hidden">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              autoFocus
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search locations or routes…"
              className="input pl-9"
            />
          </div>
          {search.trim() && (
            <div className="mt-2 max-h-64 space-y-1 overflow-y-auto">
              {results.locations.map((item) => (
                <button key={item.id} onClick={() => goToSearch('/locations', item.name)} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
                  <MapPin className="h-4 w-4 text-brand-500" />{item.name}<span className="ml-auto text-[11px] text-slate-400">{item.code}</span>
                </button>
              ))}
              {results.routes.map((item) => (
                <button key={item.id} onClick={() => goToSearch('/routes', item.id)} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
                  <RouteIcon className="h-4 w-4 text-indigo-500" />{item.source} → {item.target}<span className="ml-auto text-[11px] text-slate-400">{item.id}</span>
                </button>
              ))}
              {!results.locations.length && !results.routes.length && <p className="py-3 text-center text-xs text-slate-500">No matches found.</p>}
            </div>
          )}
        </div>
      )}
    </header>
  );
}
