import React, { useState, useEffect } from 'react';
import FileUploader from './components/FileUploader';
import * as d3 from 'd3';
import './App.css';

function App() {
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [xKey, setXKey] = useState('');
  const [yKey, setYKey] = useState('');
  const [chartType, setChartType] = useState('bar');
  const [rawFile, setRawFile] = useState(null);

  const handleDataLoaded = (parsedData, file) => {
    if (!parsedData.length) return;
    setData(parsedData);
    setColumns(Object.keys(parsedData[0]));
    setXKey('');
    setYKey('');
    setRawFile(file);
  };

  const handleSettingsChange = (key, value) => {
    if (key === 'x') setXKey(value);
    if (key === 'y') setYKey(value);
    if (key === 'type') setChartType(value);
  };

  const convertToCSV = (arr) => {
    const keys = Object.keys(arr[0]);
    const rows = arr.map(row => keys.map(k => row[k]).join(','));
    return [keys.join(','), ...rows].join('\n');
  };

  const downloadCleanedFile = () => {
    if (!data.length) return;
    const isJSON = rawFile?.name.endsWith('.json');
    const content = isJSON
      ? JSON.stringify(data, null, 2)
      : convertToCSV(data);
    const blob = new Blob([content], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = isJSON ? 'cleaned.json' : 'cleaned.csv';
    link.click();
  };

  const downloadChart = () => {
    const svg = document.getElementById('chart');
    const serializer = new XMLSerializer();
    const svgBlob = new Blob([serializer.serializeToString(svg)], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(svgBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'chart.svg';
    link.click();
  };

  const renderChart = () => {
    if (!xKey || !yKey || data.length === 0) return;

    const svg = d3.select('#chart');
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 30, bottom: 50, left: 60 };
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const x = d3.scaleBand()
      .domain(data.map(d => d[xKey]))
      .range([0, width])
      .padding(0.2);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => Number(d[yKey]) || 0)])
      .range([height, 0]);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('transform', 'rotate(-40)')
      .style('text-anchor', 'end');

    g.append('g').call(d3.axisLeft(y));

    if (chartType === 'bar') {
      g.selectAll('.bar')
        .data(data)
        .enter()
        .append('rect')
        .attr('x', d => x(d[xKey]))
        .attr('y', d => y(d[yKey]))
        .attr('width', x.bandwidth())
        .attr('height', d => height - y(d[yKey]))
        .attr('fill', 'hotpink');
    }

    if (chartType === 'line') {
      const line = d3.line()
        .x(d => x(d[xKey]) + x.bandwidth() / 2)
        .y(d => y(d[yKey]));

      g.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', '#ff69b4')
        .attr('stroke-width', 2)
        .attr('d', line);
    }

    if (chartType === 'scatter') {
      g.selectAll('circle')
        .data(data)
        .enter()
        .append('circle')
        .attr('cx', d => x(d[xKey]) + x.bandwidth() / 2)
        .attr('cy', d => y(d[yKey]))
        .attr('r', 4)
        .attr('fill', 'deeppink');
    }
  };

  // ✅ Automatically render chart when relevant data changes
  useEffect(() => {
    renderChart();
  }, [xKey, yKey, chartType, data]);

  return (
    <div className="container">
      <h1 className="title">📊 CSV & JSON Visualizer</h1>
      <FileUploader onDataLoaded={handleDataLoaded} />

      {columns.length > 0 && (
        <>
          <div className="controls">
            <label>X:</label>
            <select value={xKey} onChange={e => handleSettingsChange('x', e.target.value)}>
              <option value="">-- Select --</option>
              {columns.map(col => (
                <option key={col}>{col}</option>
              ))}
            </select>

            <label>Y:</label>
            <select value={yKey} onChange={e => handleSettingsChange('y', e.target.value)}>
              <option value="">-- Select --</option>
              {columns.map(col => (
                <option key={col}>{col}</option>
              ))}
            </select>

            <label>Type:</label>
            <select value={chartType} onChange={e => handleSettingsChange('type', e.target.value)}>
              <option value="bar">Bar</option>
              <option value="line">Line</option>
              <option value="scatter">Scatter</option>
            </select>
          </div>

          <svg id="chart" width={600} height={400}></svg>

          <div className="download-buttons">
            <button onClick={downloadCleanedFile}>⬇️ Download Cleaned File</button>
            <button onClick={downloadChart}>🖼️ Download Chart</button>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
