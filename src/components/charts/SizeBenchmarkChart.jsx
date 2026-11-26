import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import ChartFrame from './ChartFrame.jsx';

export default function SizeBenchmarkChart({ data = [], xLabel = 'Locations', yLabel = 'Time (ms)', title = 'Graph Size vs Execution Time', subtitle = 'Measured on induced sub-networks', height = 'h-64' }) {
  return (
    <ChartFrame title={title} subtitle={subtitle} isEmpty={data.length === 0} emptyMessage="No benchmark data. Run a comparison to generate measurements." className={height}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="size" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} label={{ value: xLabel, position: 'insideBottomRight', offset: -2, fill: '#94a3b8', fontSize: 10 }} />
          <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} width={62} tickFormatter={(v) => Number(v).toFixed(3)} />
          <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} formatter={(value) => `${Number(value).toFixed(4)} ms`} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line type="monotone" dataKey="prim" name="Prim" stroke="#3366f5" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          <Line type="monotone" dataKey="kruskal" name="Kruskal" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
