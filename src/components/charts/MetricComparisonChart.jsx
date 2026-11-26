import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import ChartFrame from './ChartFrame.jsx';

const METRICS = {
  executionTimeMs: {
    title: 'Execution Time Comparison',
    subtitle: 'Measured with performance.now() on the same network',
    format: (value) => `${Number(value).toFixed(4)} ms`,
  },
  totalCost: {
    title: 'Total Cost Comparison',
    subtitle: 'Minimum cost found by each algorithm',
    format: (value) => `${value}`,
  },
  iterations: {
    title: 'Iteration Comparison',
    subtitle: 'Prim counts edge selections; Kruskal counts edges examined',
    format: (value) => `${value}`,
  },
};

export default function MetricComparisonChart({ results, metric = 'executionTimeMs', chartTitle, chartSubtitle }) {
  const config = METRICS[metric] || METRICS.executionTimeMs;
  const data = [
    { name: 'Prim', value: results?.prim ? Number(results.prim[metric]) || 0 : 0, color: '#3366f5' },
    { name: 'Kruskal', value: results?.kruskal ? Number(results.kruskal[metric]) || 0 : 0, color: '#10b981' },
  ];
  const hasResults = Boolean(results?.prim || results?.kruskal);

  return (
    <ChartFrame
      title={chartTitle || config.title}
      subtitle={chartSubtitle || config.subtitle}
      isEmpty={!hasResults}
      emptyMessage="Run both algorithms to see measured results."
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 18, right: 12, left: 4, bottom: 0 }} barSize={54}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} width={62} tickFormatter={(v) => (metric === 'executionTimeMs' ? Number(v).toFixed(3) : v)} />
          <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} formatter={(value) => [config.format(value), 'Value']} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
          <Bar dataKey="value" radius={[8, 8, 0, 0]}>
            {data.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
            <LabelList dataKey="value" position="top" formatter={(value) => config.format(value)} style={{ fill: '#475569', fontSize: 10, fontWeight: 700 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
