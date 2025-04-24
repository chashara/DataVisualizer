import React, { useState, useEffect } from 'react';
import FileUploader from './components/FileUploader';
import * as d3 from 'd3';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import './App.css';





function App() {
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [xKey, setXKey] = useState('');
  const [yKey, setYKey] = useState('');
  const [chartType, setChartType] = useState('bar');
  const [rawFile, setRawFile] = useState(null);
  const [apiUrl, setApiUrl] = useState('');
  const [stats, setStats] = useState(null);


  useEffect(() => {
    renderChart();
  }, [data, xKey, yKey, chartType]);

  const handleDataLoaded = (parsedData, file) => {
    if (!parsedData.length) return;
    setData(parsedData);
    setColumns(Object.keys(parsedData[0]));
    setXKey('');
    setYKey('');
    setRawFile(file);
  };

  const handleApiFetch = async () => {
    if (!apiUrl) return alert('Please enter a valid API URL.');
    try {
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error('Failed to fetch data from API.');
      const jsonData = await res.json();

      if (!Array.isArray(jsonData)) {
        alert("Expected an array of objects from the API.");
        return;
      }

      setRawFile({ name: 'api.json' });
      setData(jsonData);
      setColumns(Object.keys(jsonData[0]));
      setXKey('');
      setYKey('');
    } catch (error) {
      console.error(error);
      alert('Error fetching or parsing API data.');
    }
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
    const content = isJSON ? JSON.stringify(data, null, 2) : convertToCSV(data);
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

  const fetchStats = async () => {
    if (!data.length) return alert("No data available.");

    try {
      const res = await fetch("http://127.0.0.1:8000/descriptive-stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data })
      });

      const result = await res.json();
      if (result.error) {
        alert(result.error);
        return;
      }

      setStats(result);
    } catch (err) {
      console.error("Error fetching stats:", err);
      alert("Failed to load statistics.");
    }
  };
  const downloadStatsPDF = () => {
    if (!stats) return alert("No statistics to download.");

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Descriptive Statistics Report", 14, 20);


    const metricRows = ['Mean', 'Median', 'Standard Deviation'];
    const dataRows = [
      Object.values(stats.mean),
      Object.values(stats.median),
      Object.values(stats.std_dev)
    ];
    const statsTable = [
      ['Metric', ...Object.keys(stats.mean)],
      ...metricRows.map((metric, i) => [metric, ...dataRows[i]])
    ];


    autoTable(doc, {
      head: [statsTable[0]],
      body: statsTable.slice(1),
      startY: 30,
      styles: { halign: 'center' },
      headStyles: { fillColor: [0, 51, 102] },
    });

    const correlationMatrix = Object.entries(stats.correlation).map(
      ([rowKey, row]) => [rowKey, ...Object.values(row).map(val => val?.toFixed(2) ?? '-')]
    );


    autoTable(doc, {
      head: [['', ...Object.keys(stats.correlation)]],
      body: correlationMatrix,
      startY: doc.lastAutoTable.finalY + 20,
      styles: { halign: 'center' },
      headStyles: { fillColor: [0, 51, 102] },
    });

    doc.save("descriptive_statistics.pdf");
  };


  const renderChart = () => {
    if (!xKey || !yKey || data.length === 0) return;

    const svg = d3.select('#chart');
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 30, bottom: 70, left: 70 };
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const g = svg
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
      .domain(data.map(d => d[xKey]))
      .range([0, width])
      .padding(0.2);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => Number(d[yKey]) || 0)])
      .nice()
      .range([height, 0]);

    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('transform', 'rotate(-40)')
      .style('text-anchor', 'end');

    g.append('g').call(d3.axisLeft(y));

    g.append('text')
      .attr('x', width / 2)
      .attr('y', height + 60)
      .attr('text-anchor', 'middle')
      .attr('fill', '#003366')
      .attr('font-weight', 'bold')
      .text(xKey);

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -50)
      .attr('text-anchor', 'middle')
      .attr('fill', '#003366')
      .attr('font-weight', 'bold')
      .text(yKey);

    if (chartType === 'bar') {
      g.selectAll('.bar')
        .data(data)
        .enter()
        .append('rect')
        .attr('x', d => x(d[xKey]))
        .attr('y', d => y(d[yKey]))
        .attr('width', x.bandwidth())
        .attr('height', d => height - y(d[yKey]))
        .attr('fill', '#003366');
    }

    if (chartType === 'line') {
      const line = d3.line()
        .x(d => x(d[xKey]) + x.bandwidth() / 2)
        .y(d => y(d[yKey]));

      g.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', '#003366')
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
        .attr('fill', '#003366');
    }
  };

  return (
    <div className="container">
      <h1 className="title">Big Data Visualizer</h1>
      <FileUploader onDataLoaded={handleDataLoaded} />


      <div className="api-fetch">
        <input
          type="text"
          placeholder="Paste API URL..."
          value={apiUrl}
          onChange={(e) => setApiUrl(e.target.value)}
          className="api-input"
        />
        <button onClick={handleApiFetch}>Fetch from API</button>
      </div>

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

          <svg id="chart"></svg>

          <div className="download-buttons">
            <button onClick={downloadCleanedFile}>Download Cleaned File</button>
            <button onClick={downloadChart}>Download Chart</button>
            <button onClick={fetchStats}>View Stats</button>
            {stats && (
    <button onClick={downloadStatsPDF}>📥 Download Stats (PDF)</button>
  )}

          </div>
          {stats && (
  <div className="stats-box">
    <h2>📈 Descriptive Statistics</h2>
    <table className="stats-table">
      <thead>
        <tr>
          <th>Metric</th>
          {Object.keys(stats.mean).map((key) => (
            <th key={key}>{key}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Mean</td>
          {Object.values(stats.mean).map((val, i) => (
            <td key={i}>{val}</td>
          ))}
        </tr>
        <tr>
          <td>Median</td>
          {Object.values(stats.median).map((val, i) => (
            <td key={i}>{val}</td>
          ))}
        </tr>
        <tr>
          <td>Standard Deviation</td>
          {Object.values(stats.std_dev).map((val, i) => (
            <td key={i}>{val}</td>
          ))}
        </tr>
      </tbody>
    </table>

    <h3 style={{ marginTop: '20px' }}>📊 Correlation Matrix</h3>
    <table className="stats-table">
      <thead>
        <tr>
          <th></th>
          {Object.keys(stats.correlation).map((key) => (
            <th key={key}>{key}</th>
          ))}
          </tr>
        </thead>
        <tbody>
          {Object.entries(stats.correlation).map(([rowKey, rowVals]) => (
            <tr key={rowKey}>
              <td>{rowKey}</td>
              {Object.keys(stats.correlation).map((colKey) => (
                <td key={colKey}>{rowVals[colKey]?.toFixed(2) ?? '-'}</td>
              ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </>
)}
</div>
);
}

export default App;
