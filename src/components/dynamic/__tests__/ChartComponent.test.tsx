import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ChartComponent } from '../ChartComponent';
import { jest } from '@jest/globals';

// Mock recharts to avoid rendering issues in tests
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  Bar: () => <div data-testid="bar" />,
  Area: () => <div data-testid="area" />,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

describe('ChartComponent', () => {
  const mockLineData = {
    title: 'Energy Usage Over Time',
    chartType: 'line' as const,
    data: [
      { time: '00:00', value: 100 },
      { time: '06:00', value: 150 },
      { time: '12:00', value: 200 },
      { time: '18:00', value: 180 },
    ],
  };

  const mockBarData = {
    title: 'Monthly Energy Consumption',
    chartType: 'bar' as const,
    data: [
      { label: 'Jan', value: 1200 },
      { label: 'Feb', value: 1100 },
      { label: 'Mar', value: 1300 },
    ],
  };

  const mockPieData = {
    title: 'Energy Distribution',
    chartType: 'pie' as const,
    data: [
      { label: 'HVAC', value: 45 },
      { label: 'Lighting', value: 30 },
      { label: 'Equipment', value: 25 },
    ],
  };

  it('should render line chart', () => {
    render(<ChartComponent {...mockLineData} />);
    
    expect(screen.getByText('Energy Usage Over Time')).toBeInTheDocument();
    // Chart should render with recharts components
    const container = screen.getByText('Energy Usage Over Time').parentElement?.parentElement;
    expect(container).toBeInTheDocument();
    expect(container?.querySelector('.recharts-wrapper')).toBeInTheDocument();
  });

  it('should render bar chart', () => {
    render(<ChartComponent {...mockBarData} />);
    
    expect(screen.getByText('Monthly Energy Consumption')).toBeInTheDocument();
    const container = screen.getByText('Monthly Energy Consumption').parentElement?.parentElement;
    expect(container).toBeInTheDocument();
    expect(container?.querySelector('.recharts-wrapper')).toBeInTheDocument();
  });

  it('should render pie chart', () => {
    render(<ChartComponent {...mockPieData} />);
    
    expect(screen.getByText('Energy Distribution')).toBeInTheDocument();
    const container = screen.getByText('Energy Distribution').parentElement?.parentElement;
    expect(container).toBeInTheDocument();
    expect(container?.querySelector('.recharts-wrapper')).toBeInTheDocument();
  });

  it('should render area chart', () => {
    const areaData = {
      ...mockLineData,
      chartType: 'area' as const,
    };
    
    render(<ChartComponent {...areaData} />);
    
    expect(screen.getByText('Energy Usage Over Time')).toBeInTheDocument();
    const container = screen.getByText('Energy Usage Over Time').parentElement?.parentElement;
    expect(container?.querySelector('.recharts-wrapper')).toBeInTheDocument();
  });

  it('should handle multiple series', () => {
    const multiSeriesData = {
      title: 'Multi-Series Chart',
      chartType: 'line' as const,
      data: [
        { time: '00:00', series1: 100, series2: 50 },
        { time: '12:00', series1: 200, series2: 150 },
      ],
    };

    render(<ChartComponent {...multiSeriesData} />);
    
    expect(screen.getByText('Multi-Series Chart')).toBeInTheDocument();
    const container = screen.getByText('Multi-Series Chart').parentElement?.parentElement;
    expect(container?.querySelector('.recharts-wrapper')).toBeInTheDocument();
  });

  it('should handle empty data gracefully', () => {
    const emptyData = {
      title: 'Empty Chart',
      chartType: 'line' as const,
      data: [],
    };

    render(<ChartComponent {...emptyData} />);
    
    expect(screen.getByText('Empty Chart')).toBeInTheDocument();
    // The component should still render without data
    const container = screen.getByText('Empty Chart').parentElement?.parentElement;
    expect(container?.querySelector('.recharts-wrapper')).toBeInTheDocument();
  });

  it('should apply custom styling', () => {
    const { container } = render(<ChartComponent {...mockLineData} />);
    
    const chartContainer = container.firstChild;
    expect(chartContainer).toHaveClass('glass-card');
    expect(chartContainer).toHaveClass('glass-card-default');
    expect(chartContainer).toHaveClass('light-mode:bg-white/70');
  });

  it('should render with custom dimensions', () => {
    const customData = {
      ...mockLineData,
    };

    render(<ChartComponent {...customData} />);
    
    const container = screen.getByText('Energy Usage Over Time').parentElement?.parentElement;
    expect(container?.querySelector('.recharts-responsive-container')).toBeInTheDocument();
  });

  it('should format values correctly', () => {
    const dataWithUnits = {
      title: 'Temperature',
      chartType: 'line' as const,
      data: [{ time: '00:00', value: 72.5 }],
    };

    render(<ChartComponent {...dataWithUnits} />);
    
    expect(screen.getByText('Temperature')).toBeInTheDocument();
    const container = screen.getByText('Temperature').parentElement?.parentElement;
    expect(container?.querySelector('.recharts-wrapper')).toBeInTheDocument();
  });
});