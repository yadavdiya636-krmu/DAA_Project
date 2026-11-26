import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import ChartFrame from './ChartFrame.jsx';

const COLORS = ['#3366f5', '#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6'];

export default function RouteDistributionChart({ routes }) {
  const data = useMemo(() => {
    const counts = {};
    routes.forEach((route) => { const key = route.type || 'Unspecified'; counts[key] = (counts[key] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [routes]);

  return (
    <ChartFrame title="Route Distribution" subtitle="Routes grouped by transport type" isEmpty={!data.length} emptyMessage="Add routes to see their distribution.">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={48} outerRadius={78} paddingAngle={3} stroke="none">
            {data.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
          </Pie>
          <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} formatter={(value) => [value, 'Routes']} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
        </PieChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
