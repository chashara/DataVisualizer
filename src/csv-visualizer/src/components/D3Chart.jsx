import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export default function D3Chart({ data, xKey, yKey, chartType }) {
  const ref = useRef();

  useEffect(() => {
    if (!data.length || !xKey || !yKey) return;

    const svg = d3.select(ref.current);
    svg.selectAll('*').remove(); // Clear previous render

    const width = 600, height = 400;
    svg.attr('width', width).attr('height', height);

    const x = d3.scaleBand()
      .domain(data.map(d => d[xKey]))
      .range([50, width - 50])
      .padding(0.1);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => +d[yKey])])
      .range([height - 50, 50]);

    svg.append('g')
      .attr('transform', `translate(0, ${height - 50})`)
      .call(d3.axisBottom(x));

    svg.append('g')
      .attr('transform', `translate(50, 0)`)
      .call(d3.axisLeft(y));

    if (chartType === 'bar') {
      svg.selectAll('rect')
        .data(data)
        .enter()
        .append('rect')
        .attr('x', d => x(d[xKey]))
        .attr('y', d => y(d[yKey]))
        .attr('width', x.bandwidth())
        .attr('height', d => height - 50 - y(d[yKey]))
        .attr('fill', 'teal');
    }

    if (chartType === 'line') {
      const line = d3.line()
        .x(d => x(d[xKey]) + x.bandwidth() / 2)
        .y(d => y(d[yKey]));

      svg.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', 'steelblue')
        .attr('stroke-width', 2)
        .attr('d', line);
    }

    if (chartType === 'scatter') {
      svg.selectAll('circle')
        .data(data)
        .enter()
        .append('circle')
        .attr('cx', d => x(d[xKey]) + x.bandwidth() / 2)
        .attr('cy', d => y(d[yKey]))
        .attr('r', 4)
        .attr('fill', 'purple');
    }

  }, [data, xKey, yKey, chartType]);

  return <svg ref={ref}></svg>;
}
