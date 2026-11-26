import React from 'react';
import { cx } from '../../utils/cx.js';

const TONES = {
  blue: 'bg-brand-50 text-brand-700 ring-brand-600/15 dark:bg-brand-900/30 dark:text-brand-300',
  indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-600/15 dark:bg-indigo-900/30 dark:text-indigo-300',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15 dark:bg-emerald-900/30 dark:text-emerald-300',
  amber: 'bg-amber-50 text-amber-700 ring-amber-600/15 dark:bg-amber-900/30 dark:text-amber-300',
  rose: 'bg-rose-50 text-rose-700 ring-rose-600/15 dark:bg-rose-900/30 dark:text-rose-300',
  slate: 'bg-slate-100 text-slate-600 ring-slate-500/15 dark:bg-slate-800 dark:text-slate-300',
  violet: 'bg-violet-50 text-violet-700 ring-violet-600/15 dark:bg-violet-900/30 dark:text-violet-300',
};

export default function Badge({ children, tone = 'slate', className, dot = false }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset whitespace-nowrap', TONES[tone], className)}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
