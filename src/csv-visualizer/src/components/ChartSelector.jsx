import React from 'react';

export default function ChartSelector({ columns, onSettingsChange }) {
  return (
    <div>
      <label>X-axis:</label>
      <select onChange={(e) => onSettingsChange('x', e.target.value)}>
        {columns.map(col => <option key={col}>{col}</option>)}
      </select>

      <label>Y-axis:</label>
      <select onChange={(e) => onSettingsChange('y', e.target.value)}>
        {columns.map(col => <option key={col}>{col}</option>)}
      </select>

      <label>Chart Type:</label>
      <select onChange={(e) => onSettingsChange('type', e.target.value)}>
        <option value="bar">Bar</option>
        <option value="line">Line</option>
        <option value="scatter">Scatter</option>
      </select>
    </div>
  );
}
