import React from 'react';
import SmallChart from './SmallChart';

function LeftPanel({ data, loading }) {
  if (loading) {
    return (
      <div className="left-panel">
        <div className="left-panel-header">
          <h2>Sensor Readings</h2>
        </div>
        <div className="left-panel-content">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading sensor data…</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="left-panel">
        <div className="left-panel-header">
          <h2>Sensor Readings</h2>
        </div>
        <div className="left-panel-content">
          <div className="loading-container">
            <p>No readings in the selected range.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="left-panel">
      <div className="left-panel-header">
        <h2>Sensor Readings</h2>
      </div>
      <div className="left-panel-content">
        <div className="charts-stack">
          <div className="chart-container">
            <SmallChart data={data} dataKey="pm03 (µg/m³)" title="PM0.3" color="#8884d8" unit="µg/m³" />
          </div>
          <div className="chart-container">
            <SmallChart data={data} dataKey="Relative Humidity (%)" title="Relative Humidity" color="#82ca9d" unit="%" />
          </div>
          <div className="chart-container">
            <SmallChart data={data} dataKey="Temperature (c)" title="Temperature" color="#ff8042" unit="°C" />
          </div>
          <div className="chart-container">
            <SmallChart data={data} dataKey="pm1 (µg/m³)" title="PM1" color="#ffc658" unit="µg/m³" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default LeftPanel;