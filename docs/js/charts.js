/**
 * Blipee Chart Utilities
 * Helper functions for creating charts
 */

class ChartBuilder {
  /**
   * Create a line chart with area fill
   * @param {Object} config - Chart configuration
   * @param {Array} config.data - Array of {x, y, label} objects
   * @param {string} config.title - Chart title
   * @param {string} config.description - Chart description
   * @returns {string} HTML string for the chart
   */
  static lineChart(config) {
    const { data, title, description } = config;

    // Calculate dimensions and scales
    const width = 400;
    const height = 250;
    const padding = 40;
    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));
    const xStep = (width - 2 * padding) / (data.length - 1);

    // Generate path for line
    const points = data.map((d, i) => {
      const x = padding + i * xStep;
      const y = height - padding - ((d.value - minValue) / (maxValue - minValue)) * (height - 2 * padding);
      return { x, y, label: d.label, value: d.value };
    });

    const pathData = points.map((p, i) =>
      `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`
    ).join(' ');

    // Generate labels
    const labelsHTML = points.map(p =>
      `<text x="${p.x}" y="${height - 10}" class="chart-label" text-anchor="middle">${p.label}</text>`
    ).join('');

    // Generate data points
    const dotsHTML = points.map(p =>
      `<circle cx="${p.x}" cy="${p.y}" r="4" fill="#3b82f6" stroke="white" stroke-width="2"/>`
    ).join('');

    const html = `
      <div class="chart-card">
        <div class="chart-header">
          <h2 class="chart-title">${title}</h2>
          <p class="chart-description">${description}</p>
        </div>
        <div class="line-chart">
          <svg viewBox="0 0 ${width} ${height}">
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style="stop-color:#10b981;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:1" />
              </linearGradient>
            </defs>
            <path d="${pathData}" class="chart-line"/>
            ${dotsHTML}
            ${labelsHTML}
          </svg>
        </div>
      </div>
    `;

    return html;
  }

  /**
   * Create an area chart
   * @param {Object} config - Chart configuration
   * @param {Array} config.data - Array of {label, value} objects
   * @param {string} config.title - Chart title
   * @param {string} config.description - Chart description
   * @returns {string} HTML string for the chart
   */
  static areaChart(config) {
    const { data, title, description } = config;

    // Calculate dimensions and scales
    const width = 400;
    const height = 250;
    const padding = 40;
    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));
    const xStep = (width - 2 * padding) / (data.length - 1);

    // Generate path for line and area
    const points = data.map((d, i) => {
      const x = padding + i * xStep;
      const y = height - padding - ((d.value - minValue) / (maxValue - minValue)) * (height - 2 * padding);
      return { x, y, label: d.label, value: d.value };
    });

    const linePathData = points.map((p, i) =>
      `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`
    ).join(' ');

    // Area path: line + close to bottom
    const areaPathData = linePathData +
      ` L ${points[points.length - 1].x},${height - padding}` +
      ` L ${points[0].x},${height - padding} Z`;

    // Generate labels
    const labelsHTML = points.map(p =>
      `<text x="${p.x}" y="${height - 10}" class="chart-label" text-anchor="middle">${p.label}</text>`
    ).join('');

    const html = `
      <div class="chart-card">
        <div class="chart-header">
          <h2 class="chart-title">${title}</h2>
          <p class="chart-description">${description}</p>
        </div>
        <div class="area-chart">
          <svg viewBox="0 0 ${width} ${height}">
            <defs>
              <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:0.8" />
                <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:0.1" />
              </linearGradient>
              <linearGradient id="areaLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style="stop-color:#10b981;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:1" />
              </linearGradient>
            </defs>
            <path d="${areaPathData}" class="chart-area"/>
            <path d="${linePathData}" class="chart-line" stroke="url(#areaLineGradient)"/>
            ${labelsHTML}
          </svg>
        </div>
      </div>
    `;

    return html;
  }

  /**
   * Create a donut/pie chart
   * @param {Object} config - Chart configuration
   * @param {Array} config.segments - Array of {label, value, color} objects
   * @param {string} config.title - Chart title
   * @param {string} config.description - Chart description
   * @returns {string} HTML string for the chart
   */
  static donutChart(config) {
    const { segments, title, description } = config;
    const total = segments.reduce((sum, seg) => sum + seg.value, 0);
    const circumference = 2 * Math.PI * 80;

    let offset = 0;
    const segmentsSVG = segments.map(seg => {
      const percentage = (seg.value / total) * 100;
      const dashArray = `${(percentage / 100) * circumference} ${circumference}`;
      const dashOffset = -offset;
      offset += (percentage / 100) * circumference;

      return `<circle cx="100" cy="100" r="80" fill="none" stroke="${seg.color}" stroke-width="40" stroke-dasharray="${dashArray}" stroke-dashoffset="${dashOffset}" transform="rotate(-90 100 100)" class="donut-segment"/>`;
    }).join('');

    const legendHTML = segments.map(seg => `
      <div class="legend-item">
        <div class="legend-color" style="background: ${seg.color};"></div>
        <span style="color: var(--text-secondary);">${seg.label} ${((seg.value / total) * 100).toFixed(0)}%</span>
      </div>
    `).join('');

    return `
      <div class="chart-card">
        <div class="chart-header">
          <h2 class="chart-title">${title}</h2>
          <p class="chart-description">${description}</p>
        </div>
        <div class="donut-chart">
          <svg viewBox="0 0 200 200">
            ${segmentsSVG}
            <circle cx="100" cy="100" r="50" fill="var(--glass-bg)"/>
          </svg>
          <div class="donut-legend">
            ${legendHTML}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Create a bar chart
   * @param {Object} config - Chart configuration
   * @param {Array} config.bars - Array of {label, value, gradient} objects
   * @param {string} config.title - Chart title
   * @param {string} config.description - Chart description
   * @returns {string} HTML string for the chart
   */
  static barChart(config) {
    const { bars, title, description } = config;
    const maxValue = Math.max(...bars.map(b => b.value));

    const barsHTML = bars.map(bar => {
      const height = (bar.value / maxValue) * 100;
      const gradient = bar.gradient || 'var(--gradient-primary)';

      return `
        <div class="bar" style="height: ${height}%; background: ${gradient};">
          <div class="bar-value">${bar.value}</div>
          <div class="bar-label">${bar.label}</div>
        </div>
      `;
    }).join('');

    return `
      <div class="chart-card">
        <div class="chart-header">
          <h2 class="chart-title">${title}</h2>
          <p class="chart-description">${description}</p>
        </div>
        <div class="bar-chart">
          ${barsHTML}
        </div>
      </div>
    `;
  }

  /**
   * Create a stacked bar chart
   * @param {Object} config - Chart configuration
   * @param {Array} config.bars - Array of {label, segments: [{value, color}]} objects
   * @param {string} config.title - Chart title
   * @param {string} config.description - Chart description
   * @returns {string} HTML string for the chart
   */
  static stackedBarChart(config) {
    const { bars, title, description } = config;

    // Calculate max total value across all bars
    const maxValue = Math.max(...bars.map(bar =>
      bar.segments.reduce((sum, seg) => sum + seg.value, 0)
    ));

    const barsHTML = bars.map(bar => {
      const total = bar.segments.reduce((sum, seg) => sum + seg.value, 0);
      const height = (total / maxValue) * 100;

      // Create stacked segments within each bar
      const segmentsHTML = bar.segments.map(seg => {
        const segmentHeight = (seg.value / total) * 100;
        return `<div class="bar-segment" style="height: ${segmentHeight}%; background: ${seg.color};"></div>`;
      }).join('');

      return `
        <div class="stacked-bar" style="height: ${height}%;">
          ${segmentsHTML}
          <div class="bar-value">${total}</div>
          <div class="bar-label">${bar.label}</div>
        </div>
      `;
    }).join('');

    return `
      <div class="chart-card">
        <div class="chart-header">
          <h2 class="chart-title">${title}</h2>
          <p class="chart-description">${description}</p>
        </div>
        <div class="bar-chart">
          ${barsHTML}
        </div>
      </div>
    `;
  }

  /**
   * Create a gauge chart
   * @param {Object} config - Chart configuration
   * @param {number} config.value - Current value (0-100)
   * @param {string} config.title - Chart title
   * @param {string} config.description - Chart description
   * @param {string} config.label - Value label
   * @returns {string} HTML string for the chart
   */
  static gaugeChart(config) {
    const { value, title, description, label } = config;
    const angle = (value / 100) * 180;
    const radius = 80;
    const circumference = Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;

    return `
      <div class="chart-card">
        <div class="chart-header">
          <h2 class="chart-title">${title}</h2>
          <p class="chart-description">${description}</p>
        </div>
        <div class="gauge-chart">
          <svg viewBox="0 0 200 120">
            <defs>
              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style="stop-color:#10b981;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:1" />
              </linearGradient>
            </defs>
            <path d="M 20,100 A 80,80 0 0,1 180,100" fill="none" stroke="var(--glass-border)" stroke-width="20" stroke-linecap="round"/>
            <path d="M 20,100 A 80,80 0 0,1 180,100" fill="none" stroke="url(#gaugeGradient)" stroke-width="20" stroke-linecap="round" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"/>
          </svg>
          <div class="gauge-value">
            <div class="gauge-number">${value}%</div>
            <div class="gauge-label">${label}</div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Create progress rings
   * @param {Object} config - Chart configuration
   * @param {Array} config.rings - Array of {label, value, color} objects
   * @param {string} config.title - Chart title
   * @param {string} config.description - Chart description
   * @returns {string} HTML string for the chart
   */
  static progressRings(config) {
    const { rings, title, description } = config;
    const radius = 50;
    const circumference = 2 * Math.PI * radius;

    const ringsHTML = rings.map(ring => {
      const offset = circumference - (ring.value / 100) * circumference;

      return `
        <div class="progress-ring">
          <svg>
            <circle cx="60" cy="60" r="${radius}" class="progress-ring-circle progress-ring-bg"/>
            <circle cx="60" cy="60" r="${radius}" class="progress-ring-circle" stroke="${ring.color}" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"/>
          </svg>
          <div class="progress-ring-value">
            <div class="progress-percentage">${ring.value}%</div>
            <div class="progress-label">${ring.label}</div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="chart-card">
        <div class="chart-header">
          <h2 class="chart-title">${title}</h2>
          <p class="chart-description">${description}</p>
        </div>
        <div class="progress-rings">
          ${ringsHTML}
        </div>
      </div>
    `;
  }

  /**
   * Create a treemap
   * @param {Object} config - Chart configuration
   * @param {Array} config.cells - Array of {label, value, color, size} objects
   * @param {string} config.title - Chart title
   * @param {string} config.description - Chart description
   * @returns {string} HTML string for the chart
   */
  static treemap(config) {
    const { cells, title, description } = config;

    const cellsHTML = cells.map(cell => {
      const gridSize = cell.size || '1 / 1'; // e.g., "1 / 2" means span 2 columns

      return `
        <div class="treemap-cell" style="background: ${cell.color}; grid-column: ${gridSize};">
          <div class="treemap-label">${cell.label}</div>
          <div class="treemap-value">${cell.value}</div>
        </div>
      `;
    }).join('');

    return `
      <div class="chart-card">
        <div class="chart-header">
          <h2 class="chart-title">${title}</h2>
          <p class="chart-description">${description}</p>
        </div>
        <div class="treemap">
          ${cellsHTML}
        </div>
      </div>
    `;
  }

  /**
   * Create a heatmap
   * @param {Object} config - Chart configuration
   * @param {Array} config.cells - Array of {value, color} objects
   * @param {string} config.title - Chart title
   * @param {string} config.description - Chart description
   * @returns {string} HTML string for the chart
   */
  static heatmap(config) {
    const { cells, title, description } = config;

    const cellsHTML = cells.map(cell =>
      `<div class="heatmap-cell" style="background: ${cell.color};">${cell.value}</div>`
    ).join('');

    return `
      <div class="chart-card">
        <div class="chart-header">
          <h2 class="chart-title">${title}</h2>
          <p class="chart-description">${description}</p>
        </div>
        <div class="heatmap">
          ${cellsHTML}
        </div>
      </div>
    `;
  }
}

// Make ChartBuilder available globally
window.ChartBuilder = ChartBuilder;

/**
 * Helper function to insert charts into the DOM
 * @param {string} targetSelector - CSS selector for the container
 * @param {string} chartHTML - HTML string from ChartBuilder
 */
function insertChart(targetSelector, chartHTML) {
  const target = document.querySelector(targetSelector);
  if (!target) {
    console.error(`Target element not found: ${targetSelector}`);
    return;
  }

  target.insertAdjacentHTML('beforeend', chartHTML);
}

// Color palette for charts
const ChartColors = {
  green: '#10b981',
  blue: '#3b82f6',
  purple: '#8b5cf6',
  amber: '#f59e0b',
  cyan: '#06b6d4',
  red: '#ef4444',

  gradients: {
    primary: 'linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)',
    green: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    blue: 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)',
    purple: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
    red: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    amber: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)'
  },

  opacity: (color, opacity) => {
    return `rgba(${parseInt(color.slice(1, 3), 16)}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(color.slice(5, 7), 16)}, ${opacity})`;
  }
};

window.ChartColors = ChartColors;
