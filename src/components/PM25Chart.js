import React, { useMemo } from 'react';
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Brush,
  ReferenceArea
} from 'recharts';

const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  return `${date.getMonth() + 1}/${date.getDate()} ${date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  })}`;
};

const formatBrushLabel = (ts) => {
  // Keep brush labels compact so they don't overflow
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

function PM25Chart({ data, loading }) {
  // Hooks must be called before any early return
  const chartData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data
      .filter(item => item['pm25 (µg/m³)'] !== null && item['pm25 (µg/m³)'] !== undefined)
      .map(item => {
        const v = Number(item['pm25 (µg/m³)']);
        return {
          time: formatTime(item.timestamp),
          value: Number.isFinite(v) ? Number(v.toFixed(2)) : null,
          rawValue: v,
          timestamp: item.timestamp
        };
      })
      .filter(a => a.value !== null);
  }, [data]);

  if (loading) {
    return (
      <div className="small-chart-container">
        <h3 className="chart-title">PM2.5</h3>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading PM2.5 data…</p>
        </div>
      </div>
    );
  }

  if (!chartData.length) return <div>No PM2.5 data available</div>;

  // AQI bands for better context
  const bands = [
    { y1: 0, y2: 12, color: 'rgba(5,150,105,0.08)' },         // Good
    { y1: 12.1, y2: 35.4, color: 'rgba(245,158,11,0.08)' },   // Moderate
    { y1: 35.5, y2: 55.4, color: 'rgba(234,88,12,0.08)' },    // USG
  ];

  return (
    <div className="small-chart-container">
      <h3 className="chart-title">PM2.5</h3>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 5, right: 25, left: 10, bottom: 20 }}
        >
          <defs>
            <linearGradient id="pm25Fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
            </linearGradient>
          </defs>

          {bands.map((b, i) => (
            <ReferenceArea key={i} y1={b.y1} y2={b.y2} strokeOpacity={0} fill={b.color} />
          ))}

          <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 9, angle: -45, textAnchor: 'end' }}
            interval="preserveStartEnd"
            minTickGap={30}
            height={60}
          />
          <YAxis
            width={35}
            tick={{ fontSize: 10 }}
            domain={['auto', 'auto']}
            tickFormatter={(value) => Number(value).toFixed(1)}
          />
          <Tooltip
            formatter={(value) => [`${value} µg/m³`, 'PM2.5']}
            labelFormatter={(_, payload) => {
              const item = payload?.[0]?.payload;
              return item ? new Date(item.timestamp).toLocaleString() : '';
            }}
          />

          <Area type="monotone" dataKey="value" stroke="none" fill="url(#pm25Fill)" />
          <Line type="monotone" dataKey="value" stroke="#3b82f6" dot={false} strokeWidth={1.6} animationDuration={500} />
          <Brush
            dataKey="timestamp"
            height={22}
            stroke="#94a3b8"
            travellerWidth={8}
            tickFormatter={formatBrushLabel}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export default PM25Chart;