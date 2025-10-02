import React, { useMemo } from 'react';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';

function SmallChart({ data, dataKey, title, color, unit }) {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    })}`;
  };

  const chartData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data.map(item => {
      const v = Number(item[dataKey]);
      const val = Number.isFinite(v) ? Number(v.toFixed(2)) : null;
      return {
        time: formatTime(item.timestamp),
        value: val,
        timestamp: item.timestamp
      };
    }).filter(d => d.value !== null);
  }, [data, dataKey]);

  return (
    <div className="small-chart-container">
      <h3 className="chart-title">{title}</h3>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 5, right: 25, left: 10, bottom: 20 }}
        >
          <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 8, angle: -45, textAnchor: 'end' }}
            interval="preserveStartEnd"
            minTickGap={30}
            height={40}
          />
          <YAxis
            width={35}
            tick={{ fontSize: 9 }}
            domain={['auto', 'auto']}
            tickFormatter={(value) => Number(value).toFixed(1)}
          />
          <Tooltip
            formatter={(value) => [`${value} ${unit}`, title]}
            labelFormatter={(_, payload) => {
              const item = payload?.[0]?.payload;
              return item ? new Date(item.timestamp).toLocaleString() : '';
            }}
          />

          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            dot={false}
            strokeWidth={1.5}
            animationDuration={500}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export default SmallChart;