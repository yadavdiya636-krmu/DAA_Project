import React from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronsLeft, ChevronsRight, GitBranch, X, CircleCheck, CircleAlert } from 'lucide-react';
import { NAV_GROUPS } from '../../data/navigation.js';
import { useApp } from '../../context/AppContext.jsx';
import { isConnected } from '../../utils/graphUtils.js';
import { cx } from '../../utils/cx.js';

export default function Sidebar({ collapsed, onToggle, mobileOpen, onCloseMobile }) {
  const { locations, routes } = useApp();
  const connected = isConnected(locations, routes);

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden" onClick={onCloseMobile} />}
      <aside
        className={cx(
          'no-print fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200 bg-white transition-[width,transform] duration-300 dark:border-slate-800 dark:bg-slate-900',
          collapsed ? 'w-[76px]' : 'w-[264px]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0',
        )}
      >
        <div className={cx('flex h-[72px] shrink-0 items-center border-b border-slate-100 px-4 dark:border-slate-800', collapsed && 'justify-center px-2')}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 via-brand-600 to-indigo-600 text-white shadow-lg shadow-brand-500/25">
            <GitBranch className="h-5 w-5" strokeWidth={2.4} />
          </div>
          {!collapsed && (
            <div className="ml-3 min-w-0 flex-1">
              <p className="truncate text-[17px] font-extrabold tracking-tight text-slate-900 dark:text-white">RouteWise</p>
              <p className="truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Network Optimizer</p>
            </div>
          )}
          <button onClick={onCloseMobile} className="ml-auto rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden" aria-label="Close navigation">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-5">
              {!collapsed && <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{group.label}</p>}
              {collapsed && <div className="mx-auto mb-3 h-px w-8 bg-slate-200 dark:bg-slate-700" />}
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/'}
                    onClick={onCloseMobile}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) => cx(
                      'group relative flex items-center rounded-xl text-sm font-semibold transition-all duration-200',
                      collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5',
                      isActive
                        ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white',
                    )}
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-brand-600" />}
                        <item.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={isActive ? 2.3 : 1.9} />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-slate-100 p-3 dark:border-slate-800">
          {!collapsed && (
            <div className="mb-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
              <div className="flex items-center gap-2">
                {connected ? <CircleCheck className="h-4 w-4 text-emerald-500" /> : <CircleAlert className="h-4 w-4 text-amber-500" />}
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{connected ? 'Network connected' : 'Network disconnected'}</p>
              </div>
              <p className="mt-1 pl-6 text-[11px] text-slate-500 dark:text-slate-400">
                {locations.length} locations · {routes.length} routes
              </p>
            </div>
          )}
          <button
            onClick={onToggle}
            className={cx(
              'hidden w-full items-center rounded-xl px-3 py-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 lg:flex',
              collapsed ? 'justify-center' : 'justify-between',
            )}
          >
            {!collapsed && <span>Collapse sidebar</span>}
            {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          </button>
        </div>
      </aside>
    </>
  );
}
