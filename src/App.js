import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import './App.css';
import './styles/Dashboard.css';
import LeftPanel from './components/LeftPanel';
import PM25Chart from './components/PM25Chart';
import RealtimeClock from './components/RealtimeClock';
import AnimatedNumber from './components/AnimatedNumber';
import QuickRange from './components/QuickRange';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

function App() {
  const [readings, setReadings] = useState([]);
  const [filteredReadings, setFilteredReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [prediction, setPrediction] = useState(null);
  const [predictionLoading, setPredictionLoading] = useState(false);

  // Date range states
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showGraphs, setShowGraphs] = useState(false);

  // Date limits: July 1st 2025 to current latest reading
  const minDate = new Date('2025-07-01');
  const [maxDate, setMaxDate] = useState(new Date());

  const [modelMetrics, setModelMetrics] = useState(null);
  const [predictionHistory, setPredictionHistory] = useState([]);

  const getLatestReadingDate = (rows) => {
    if (!rows.length) return new Date();
    const dates = rows.map(r => new Date(r.timestamp));
    return new Date(Math.max(...dates));
  };

  // Auto-update maxDate when we get new readings
  useEffect(() => {
    if (readings.length > 0) {
      setMaxDate(getLatestReadingDate(readings));
    }
  }, [readings]);

  // Auto-select last 7 days when data first loads (this fixes the main issue)
  useEffect(() => {
    if (readings.length > 0 && !startDate && !endDate && !loading) {
      const now = new Date(maxDate);
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      setStartDate(sevenDaysAgo);
      setEndDate(now);
      setShowGraphs(true);
      console.log("Auto-selected last 7 days on initial data load");
    }
  }, [readings, maxDate, loading, startDate, endDate]);

  useEffect(() => {
    // Check connection status
    axios.get(`${API_BASE}/api/status`)
      .then(response => {
        setConnectionStatus(response.data.mongodb_connected ? 'connected' : 'error');
      })
      .catch(() => {
        setConnectionStatus('error');
      });

    // Load initial data
    fetchAllReadings();
    fetchPredictionHistory();
    fetchModelMetrics(); // optional: load metrics on mount
  }, []);

  // Filter readings when date range changes
  useEffect(() => {
    if (startDate && endDate && readings.length > 0) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      const filtered = readings.filter(r => {
        const readingDate = new Date(r.timestamp);
        return readingDate >= start && readingDate <= end;
      });

      setFilteredReadings(filtered);
      setShowGraphs(true);
    } else {
      setFilteredReadings([]);
      setShowGraphs(false);
    }
  }, [startDate, endDate, readings]);

  const fetchAllReadings = () => {
    setLoading(true);
    axios.get(`${API_BASE}/api/all-readings`)
      .then(response => {
        setReadings(response.data.readings || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching readings:", err);
        setError("Failed to load air quality readings");
        setLoading(false);
      });
  };

  const fetchPredictionHistory = () => {
    axios.get(`${API_BASE}/api/prediction-history`)
      .then(response => {
        if (response.data.success) {
          setPredictionHistory(response.data.data || []);
        }
      })
      .catch(err => {
        console.error("Error fetching prediction history:", err);
      });
  };

  const fetchModelMetrics = () => {
    axios.get(`${API_BASE}/api/model-metrics`)
      .then(response => {
        if (response.data.success) {
          setModelMetrics(response.data.metrics);
        }
      })
      .catch(err => console.error("Error fetching model metrics:", err));
  };

  const fetchPrediction = () => {
    setPredictionLoading(true);
    axios.post(`${API_BASE}/api/predict`)
      .then(response => {
        if (response.data.success) {
          setPrediction(response.data);
        }
        setPredictionLoading(false);
      })
      .catch(err => {
        console.error("Error fetching prediction:", err);
        setError("Failed to get PM2.5 prediction");
        setPredictionLoading(false);
      });
  };

  const airQualityTheme = useMemo(() => ({
    good: { name: "Good", color: "#00e400", bg: "linear-gradient(135deg, #10b981 0%, #059669 100%)" },
    moderate: { name: "Moderate", color: "#d97706", bg: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" },
    usg: { name: "Unhealthy for Sensitive Groups", color: "#ef4444", bg: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)" },
    unhealthy: { name: "Unhealthy", color: "#ef4444", bg: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)" },
    very_unhealthy: { name: "Very Unhealthy", color: "#8f3f97", bg: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)" },
    hazardous: { name: "Hazardous", color: "#7e0023", bg: "linear-gradient(135deg, #7e0023 0%, #581c87 100%)" }
  }), []);

  const getAirQualityCategory = (pm25Value) => {
    const v = Number(pm25Value);
    if (isNaN(v) || v === null) return { ...airQualityTheme.moderate, key: 'moderate' };
    if (v <= 12) return { ...airQualityTheme.good, key: 'good' };
    if (v <= 35.4) return { ...airQualityTheme.moderate, key: 'moderate' };
    if (v <= 55.4) return { ...airQualityTheme.usg, key: 'usg' };
    if (v <= 150.4) return { ...airQualityTheme.unhealthy, key: 'unhealthy' };
    if (v <= 250.4) return { ...airQualityTheme.very_unhealthy, key: 'very_unhealthy' };
    return { ...airQualityTheme.hazardous, key: 'hazardous' };
  };

  const clearDateRange = () => {
    setStartDate(null);
    setEndDate(null);
    setShowGraphs(false);
  };

  const onPresetRange = (rangeStart, rangeEnd) => {
    setStartDate(rangeStart);
    setEndDate(rangeEnd);
  };

  const predictedValueRaw = prediction?.predicted_pm25 ?? null;
  const predictedValue = typeof predictedValueRaw === 'number' ? predictedValueRaw : Number(predictedValueRaw) || null;
  const airQuality = getAirQualityCategory(predictedValue);

  const readingsRangeLabel = useMemo(() => {
    if (!filteredReadings.length) return '';
    const dates = filteredReadings.map(d => new Date(d.timestamp));
    const oldest = new Date(Math.min(...dates)).toLocaleDateString();
    const newest = new Date(Math.max(...dates)).toLocaleDateString();
    return `${oldest} – ${newest}`;
  }, [filteredReadings]);

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-left">
          <div className="muted">
            {readings.length 
              ? `Available Data: July 1, 2025 to ${maxDate.toLocaleDateString()}`
              : 'Loading available range...'}
          </div>
          <div className="connection-row">
            <span className={`badge ${connectionStatus === 'connected' ? 'badge-success' : 
                                   connectionStatus === 'checking' ? 'badge-warn' : 'badge-error'}`}>
              {connectionStatus === 'connected' ? 'MongoDB Connected' : 
               connectionStatus === 'checking' ? 'Checking MongoDB...' : 'MongoDB Error'}
            </span>
          </div>
        </div>

        <div className="header-center">
          <h1>Air Quality Dashboard</h1>

          <div className="header-date-picker">
            <div className="date-inputs-compact">
              <div className="date-input-group">
                <label>Start Date</label>
                <DatePicker
                  selected={startDate}
                  onChange={setStartDate}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  minDate={minDate}
                  maxDate={maxDate}
                  placeholderText="Select start date"
                  dateFormat="yyyy-MM-dd"
                  className="date-picker-input-compact"
                />
              </div>
              <div className="date-input-group">
                <label>End Date</label>
                <DatePicker
                  selected={endDate}
                  onChange={setEndDate}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate || minDate}
                  maxDate={maxDate}
                  placeholderText="Select end date"
                  dateFormat="yyyy-MM-dd"
                  className="date-picker-input-compact"
                  disabled={!startDate}
                />
              </div>

              <QuickRange
                minDate={minDate}
                maxDate={maxDate}
                onSelect={onPresetRange}
                disabled={loading || !readings.length}
              />

              <button
                onClick={clearDateRange}
                className="btn btn-danger"
                disabled={!startDate && !endDate}
                title="Clear selected date range"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        <div className="header-right">
          <RealtimeClock />
        </div>
      </header>

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button className="btn btn-ghost" onClick={() => setError(null)}>×</button>
        </div>
      )}

      {showGraphs ? (
        <div className="dashboard-content">
          <div className="dashboard-grid-three-column">
            <div className="panel left-panel-container card">
              <LeftPanel data={filteredReadings} loading={loading} />
            </div>

            <div 
              className={`panel prediction-panel card aqi-${airQuality.key}`}
              style={{ background: airQuality.bg }}
            >
              <h3>Next Hour Prediction</h3>
              <div className="air-quality-category" style={{ color: 'white' }}>
                {airQuality.name}
              </div>
              <div className="prediction-content">
                <div className="prediction-value">
                  {predictedValue !== null ? (
                    <AnimatedNumber value={predictedValue} decimals={2} className="predicted-number" />
                  ) : (
                    <span className="predicted-number">--</span>
                  )}
                  <span className="prediction-unit">µg/m³</span>
                </div>
                <div className="prediction-label">PM2.5 Forecast</div>
                <button
                  onClick={fetchPrediction}
                  className="btn btn-glass prediction-button"
                  disabled={predictionLoading}
                >
                  {predictionLoading ? 'Getting Prediction…' : 'Get Latest Prediction'}
                </button>
                <div className="prediction-time">
                  Next hour: {new Date(Date.now() + 60 * 60 * 1000).toLocaleTimeString('en-US', {
                    timeZone: 'UTC',
                    hour: 'numeric',
                    hour12: true
                  }).replace(' ', ':00 ')} GMT
                </div>
              </div>
            </div>

            <div className="panel right-panel-container card">
              <div className="chart-container">
                <PM25Chart data={filteredReadings} loading={loading} />
              </div>

              <div className="table-section">
                <h3 className="font-semibold text-sm mb-2">
                  Prediction vs Actual (Last 5 Hours)
                </h3>
                <div className="table-wrapper">
                  <table className="w-full text-xs">
                    <thead>
                      <tr>
                        <th className="p-2">Time</th>
                        <th className="p-2">Actual (µg/m³)</th>
                        <th className="p-2">Predicted (µg/m³)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {predictionHistory.map((row, idx) => (
                        <tr key={idx}>
                          <td className="p-2">
                            {new Date(row.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </td>
                          <td className="p-2">{Number(row.actual ?? 0).toFixed(2)}</td>
                          <td className="p-2">{Number(row.predicted ?? 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {modelMetrics && (
                  <div className="model-metrics">
                    <strong>Model Evaluation (last 100 readings):</strong>
                    <div className="metrics-row">
                      <span>MAE: <span className="metric metric-mae">{modelMetrics.mae}</span></span>
                      <span>RMSE: <span className="metric metric-rmse">{modelMetrics.rmse}</span></span>
                      <span>R²: <span className="metric metric-r2">{modelMetrics.r2}</span></span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="dashboard-footer">
            <p>
              Showing <strong>{filteredReadings.length}</strong> readings
              {readingsRangeLabel && <> from <strong>{readingsRangeLabel}</strong></>}
            </p>
          </div>
        </div>
      ) : (
        <div className="no-selection-message">
          <div className="message-card">
            <h2>📅 Select a Date Range</h2>
            <p>Choose dates manually or use the quick presets below</p>
            <div className="empty-cta">
              <QuickRange 
                minDate={minDate} 
                maxDate={maxDate} 
                onSelect={onPresetRange} 
                disabled={loading || !readings.length}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
