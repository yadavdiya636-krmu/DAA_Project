import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import ChartFrame from './ChartFrame.jsx';
import { getDegreeMap } from '../../utils/graphUtils.js';

export default function ConnectivityChart({ locations, routes }) {
  const data = useMemo(() => {
    const degrees = getDegreeMap(locations, routes);
    return locations
      .map((location) => ({ name: location.code || location.id, connections: degrees[location.id] || 0, city: location.city }))
      .sort((a, b) => b.connections - a.connections)
      .slice(0, 10);
  }, [locations, routes]);

  return (
    <ChartFrame title="Location Connectivity" subtitle="Number of routes touching each location" isEmpty={!data.length} emptyMessage="Add locations to see connectivity.">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} interval={0} />
          <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} formatter={(value) => [value, 'Routes']} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
          <Bar dataKey="connections" radius={[7, 7, 0, 0]} maxBarSize={44}>
            {data.map((entry, index) => <Cell key={entry.name} fill={index === 0 ? '#3366f5' : '#818cf8'} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
