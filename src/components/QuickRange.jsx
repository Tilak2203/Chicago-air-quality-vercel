import React from 'react';

const presets = [
  { key: '24h', label: 'Last 24h' },
  { key: '7d', label: '7d' },
  { key: '30d', label: '30d' },
  { key: 'all', label: 'All' },
];

const QuickRange = ({ minDate, maxDate, onSelect, disabled }) => {
  const handleClick = (key) => {
    const end = new Date(maxDate);
    let start;
    switch (key) {
      case '24h':
        start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
      default:
        start = new Date(minDate);
        break;
    }
    // Clamp start to minDate
    if (start < minDate) start = new Date(minDate);
    onSelect(start, end);
  };

  return (
    <div className="quick-range">
      {presets.map(p => (
        <button
          key={p.key}
          className="btn"
          onClick={() => handleClick(p.key)}
          disabled={disabled}
          title={`Select ${p.label} range`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
};

export default QuickRange;