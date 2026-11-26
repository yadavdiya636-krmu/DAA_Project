import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import ChartFrame from './ChartFrame.jsx';
import { formatCurrency } from '../../utils/calculations.js';

export default function CostOverviewChart({ originalCost = 0, mstCost, savings = 0, currency = 'USD' }) {
  const data = [
    { name: 'Original network', value: originalCost, color: '#6366f1' },
    { name: 'MST cost', value: mstCost ?? 0, color: '#10b981' },
    { name: 'Savings', value: savings, color: '#f59e0b' },
  ];
  const tooltipStyle = { borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12, boxShadow: '0 12px 30px -12px rgba(15,23,42,.3)' };
  return (
    <ChartFrame title="Network Cost Overview" subtitle="Total route weight vs optimized spanning tree cost">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} width={50} tickFormatter={(v) => `${Math.round(v)}`} />
          <Tooltip contentStyle={tooltipStyle} formatter={(value) => [formatCurrency(value, currency), 'Cost']} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
          <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={70}>
            {data.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
