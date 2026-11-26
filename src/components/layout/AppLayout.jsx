import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';
import ToastViewport from '../common/ToastViewport.jsx';
import { useApp } from '../../context/AppContext.jsx';

function useEffectiveTheme(theme) {
  const [systemDark, setSystemDark] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches,
  );
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (event) => setSystemDark(event.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);
  return theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;
}

export default function AppLayout() {
  const { settings, updateSettings } = useApp();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const effectiveTheme = useEffectiveTheme(settings.theme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', effectiveTheme === 'dark');
    root.style.colorScheme = effectiveTheme;
  }, [effectiveTheme]);

  useEffect(() => {
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((prev) => !prev)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className={`flex min-h-screen flex-col transition-[padding] duration-300 ${collapsed ? 'lg:pl-[76px]' : 'lg:pl-[264px]'}`}>
        <Topbar
          onOpenMobile={() => setMobileOpen(true)}
          effectiveTheme={effectiveTheme}
          onToggleTheme={() => updateSettings({ theme: effectiveTheme === 'dark' ? 'light' : 'dark' })}
        />
        <main className="mx-auto w-full max-w-[1680px] flex-1 px-4 py-6 sm:px-6 sm:py-8">
          <Outlet />
        </main>
        <footer className="no-print border-t border-slate-200 px-6 py-4 text-center text-[11px] text-slate-400 dark:border-slate-800">
          RouteWise · Delivery Network Optimization Using Minimum Spanning Trees · Academic DAA Capstone Project
        </footer>
      </div>
      <ToastViewport />
    </div>
  );
}
