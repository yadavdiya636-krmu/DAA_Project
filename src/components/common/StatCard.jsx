import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Card } from './Card.jsx';
import { cx } from '../../utils/cx.js';

const ACCENTS = {
  blue: 'bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300',
  indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300',
  emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300',
  rose: 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300',
  violet: 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-300',
};

export default function StatCard({ icon: Icon, label, value, supporting, accent = 'blue', trend }) {
  return (
    <Card className="group p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-float dark:hover:border-brand-800">
      <div className="flex items-start justify-between gap-3">
        <div className={cx('flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105', ACCENTS[accent])}>
          <Icon className="h-5 w-5" />
        </div>
        {trend && (
          <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-600 dark:bg-emerald-900/25 dark:text-emerald-300">
            <ArrowUpRight className="h-3 w-3" />{trend}
          </span>
        )}
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">{value}</p>
      {supporting && <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{supporting}</p>}
    </Card>
  );
}
