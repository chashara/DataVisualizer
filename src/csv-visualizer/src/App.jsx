import React, { useState, useEffect } from 'react';
import FileUploader from './components/FileUploader';
import * as d3 from 'd3';
import { zoom, select } from 'd3';
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
  const [maxItems, setMaxItems] = useState(50);

  useEffect(() => {
    renderChart();
  }, [data, xKey, yKey, chartType, maxItems]);



  const handleDataLoaded = (parsedData, file) => {
    if (!parsedData.length) return;
    setData(parsedData);
    setColumns(Object.keys(parsedData[0]));
    setXKey('');
    setYKey('');
    setRawFile(file);
    setStats(null);
  };

  const handleApiFetch = async () => {
    if (!apiUrl) return alert('Please enter a valid API URL.');

    const startTime = performance.now();

    try {
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error('Failed to fetch data from API.');

      const jsonData = await res.json();

      const endTime = performance.now();
      console.log(`API Fetch + Parse Time: ${(endTime - startTime).toFixed(2)} ms`);

      if (!Array.isArray(jsonData)) {
        alert('Expected an array of objects from the API.');
        return;
      }


      const cleanedData = jsonData.map(row => {
        const flatRow = {};
        for (const key in row) {
          const value = row[key];

          if (typeof value === 'number') {

            flatRow[key] = isFinite(value) ? value : null;
          } else if (
            typeof value === 'string' ||
            typeof value === 'boolean' ||
            value === null
          ) {
            flatRow[key] = value;
          }

        }
        return flatRow;
      });

      setRawFile({ name: 'api.json' });
      setData(cleanedData);
      setColumns(Object.keys(cleanedData[0]));
      setXKey('');
      setYKey('');
      setStats(null);
    } catch (error) {
      console.error(error);
      alert('Error fetching or parsing API data.');
    }
  };


  const fetchStats = async () => {
    if (!data.length) return alert('No data available.');


    const numericKeys = Object.keys(data[0]).filter(key => {
      const value = data[0][key];
      return typeof value === 'number' && isFinite(value);
    });

    if (!numericKeys.length) {
      alert('No numeric columns available for statistical analysis.');
      return;
    }


    const cleanedData = data.map(row => {
      const cleanRow = {};
      numericKeys.forEach(key => {
        const value = row[key];
        cleanRow[key] = typeof value === 'number' && isFinite(value) ? value : null;
      });
      return cleanRow;
    });

    try {
      const res = await fetch('http://127.0.0.1:8000/descriptive-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: cleanedData }),
      });

      const result = await res.json();
      if (result.error) {
        alert(result.error);
        return;
      }

      setStats(result);
    } catch (err) {
      console.error('Error fetching stats:', err);
      alert('Failed to load statistics.');
    }
  };



  const downloadCleanedCSV = () => {
    if (!data.length) {
      alert('No data to download!');
      return;
    }

    const csvContent = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'cleaned_data.csv';
    link.click();
  };


  const downloadStatsPDF = () => {
    if (!stats) return alert('No statistics to download.');

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Descriptive Statistics Report', 14, 20);

    const metricRows = ['Mean', 'Median', 'Standard Deviation'];
    const dataRows = [
      Object.values(stats.mean),
      Object.values(stats.median),
      Object.values(stats.std_dev),
    ];
    const statsTable = [
      ['Metric', ...Object.keys(stats.mean)],
      ...metricRows.map((metric, i) => [metric, ...dataRows[i]]),
    ];

    autoTable(doc, {
      head: [statsTable[0]],
      body: statsTable.slice(1),
      startY: 30,
      styles: { halign: 'center' },
      headStyles: { fillColor: [0, 51, 102] },
    });

    const correlationMatrix = Object.entries(stats.correlation).map(
      ([rowKey, row]) => [rowKey, ...Object.values(row).map((val) => val?.toFixed(2) ?? '-')]
    );

    doc.text('Correlation Matrix', 14, doc.lastAutoTable.finalY + 20);
    autoTable(doc, {
      head: [['', ...Object.keys(stats.correlation)]],
      body: correlationMatrix,
      startY: doc.lastAutoTable.finalY + 30,
      styles: { halign: 'center' },
      headStyles: { fillColor: [0, 51, 102] },
    });

    doc.save('descriptive_statistics.pdf');
  };

  const downloadChartAsPNG = () => {
    const svgElement = document.getElementById('chart');
    if (!svgElement) {
      alert('No chart to download.');
      return;
    }

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      const pngLink = document.createElement('a');
      pngLink.download = 'chart.png';
      pngLink.href = canvas.toDataURL('image/png');
      pngLink.click();
    };
    img.src = url;
  };

  const downloadChartAsJPEG = () => {
    const svgElement = document.getElementById('chart');
    if (!svgElement) {
      alert('No chart to download.');
      return;
    }

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      const jpegLink = document.createElement('a');
      jpegLink.download = 'chart.jpeg';
      jpegLink.href = canvas.toDataURL('image/jpeg', 1.0);
      jpegLink.click();
    };
    img.src = url;
  };

  const downloadChartAsPDF = () => {
    const svgElement = document.getElementById('chart');
    if (!svgElement) {
      alert('No chart to download.');
      return;
    }

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height],
      });
      pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
      pdf.save('chart.pdf');
    };
    img.src = url;
  };

  const renderChart = () => {
    if (!xKey || !yKey || data.length === 0) return;

    const startRender = performance.now();

    const filteredData = data.slice(0, maxItems);
    const svg = select('#chart');
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 30, bottom: 100, left: 70 };
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const g = svg
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
      .domain(filteredData.map((d) => typeof d[xKey] === 'object' ? JSON.stringify(d[xKey]) : d[xKey]))
      .range([0, width])
      .padding(0.2);

    const y = d3.scaleLinear()
      .domain([0, d3.max(filteredData, (d) => Number(d[yKey]) || 0)])
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
.attr('text-anchor', 'middle')
.attr('x', width / 2)
.attr('y', height + 60)
.style('font-size', '14px')
.style('fill', '#003366')
.text(xKey);


g.append('text')
.attr('text-anchor', 'middle')
.attr('transform', 'rotate(-90)')
.attr('x', -height / 2)
.attr('y', -50)
.style('font-size', '14px')
.style('fill', '#003366')
.text(yKey);


    if (chartType === 'bar') {
      g.selectAll('.bar')
        .data(filteredData)
        .enter()
        .append('rect')
        .attr('x', (d) => x(d[xKey]))
        .attr('y', (d) => y(d[yKey]))
        .attr('width', x.bandwidth())
        .attr('height', (d) => height - y(d[yKey]))
        .attr('fill', '#003366')
        .append('title')
        .text((d) => `${xKey}: ${typeof d[xKey] === 'object' ? JSON.stringify(d[xKey]) : d[xKey]}\n${yKey}: ${d[yKey]}`);
    }

    if (chartType === 'line') {
      const line = d3.line()
        .x((d) => x(d[xKey]) + x.bandwidth() / 2)
        .y((d) => y(d[yKey]));

      g.append('path')
        .datum(filteredData)
        .attr('fill', 'none')
        .attr('stroke', '#003366')
        .attr('stroke-width', 2)
        .attr('d', line);
    }

    if (chartType === 'scatter') {
      g.selectAll('circle')
        .data(filteredData)
        .enter()
        .append('circle')
        .attr('cx', (d) => x(d[xKey]) + x.bandwidth() / 2)
        .attr('cy', (d) => y(d[yKey]))
        .attr('r', 4)
        .attr('fill', '#003366')
        .append('title')
        .text((d) => `${xKey}: ${d[xKey]} \n${yKey}: ${d[yKey]}`);
    }

    svg.call(
      zoom()
        .scaleExtent([1, 5])
        .translateExtent([[0, 0], [width, height]])
        .on('zoom', (event) => {
          g.attr('transform', event.transform);
        })
    );

    const endRender = performance.now();
  console.log(`Chart Render Time: ${(endRender - startRender).toFixed(2)} ms`);
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
            <select value={xKey} onChange={(e) => setXKey(e.target.value)}>
              <option value="">-- Select --</option>
              {columns.map((col) => (
                <option key={col}>{col}</option>
              ))}
            </select>

            <label>Y:</label>
            <select value={yKey} onChange={(e) => setYKey(e.target.value)}>
              <option value="">-- Select --</option>
              {columns.map((col) => (
                <option key={col}>{col}</option>
              ))}
            </select>

            <label>Chart Type:</label>
            <select value={chartType} onChange={(e) => setChartType(e.target.value)}>
              <option value="bar">Bar</option>
              <option value="line">Line</option>
              <option value="scatter">Scatter</option>
            </select>
          </div>

          <div className="filter-slider">
            <label>Show Top {maxItems} Items</label>
            <input
              type="range"
              min="1"
              max={data.length}
              value={maxItems}
              onChange={(e) => setMaxItems(Number(e.target.value))}
            />
          </div>

          <svg id="chart" style={{ border: '2px dashed #3399ff', background: 'white' }}></svg>



          <div className="download-buttons">
            <button onClick={fetchStats}>View Stats</button>
            <button onClick={downloadStatsPDF}>Download Stats PDF</button>
            <button onClick={downloadChartAsPNG}>Download Chart as PNG</button>
            <button onClick={downloadChartAsJPEG}>Download Chart as JPEG</button>
            <button onClick={downloadChartAsPDF}>Download Chart as PDF</button>
            <button onClick={downloadCleanedCSV}>Download Cleaned Data</button>



          </div>

          {stats && (
            <div className="stats-box">
              <h2>Descriptive Statistics</h2>
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

              <h3>Correlation Matrix</h3>
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
                        <td key={colKey}>
                          {rowVals[colKey] !== undefined ? rowVals[colKey].toFixed(2) : '-'}
                        </td>
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
