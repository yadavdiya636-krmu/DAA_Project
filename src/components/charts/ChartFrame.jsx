import React from 'react';
import { Card } from '../common/Card.jsx';

export default function ChartFrame({ title, subtitle, action, children, isEmpty, emptyMessage, className = '' }) {
  return (
    <Card className={`p-5 ${className}`}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
        {action}
      </div>
      {isEmpty ? (
        <div className="flex h-56 items-center justify-center rounded-xl bg-slate-50 px-6 text-center dark:bg-slate-800/40">
          <p className="text-xs text-slate-500">{emptyMessage || 'No data available yet.'}</p>
        </div>
      ) : (
        <div className="h-56 w-full">{children}</div>
      )}
    </Card>
  );
}
