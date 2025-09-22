/**
 * Widget Library
 * Collection of reusable dashboard widgets
 */

export interface Widget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'alert';
  title: string;
  config: any;
  size: 'small' | 'medium' | 'large';
}

export interface MetricWidget extends Widget {
  type: 'metric';
  config: {
    value: number | string;
    unit?: string;
    trend?: number;
    target?: number;
    color?: string;
  };
}

export interface ChartWidget extends Widget {
  type: 'chart';
  config: {
    chartType: 'line' | 'bar' | 'pie' | 'area';
    data: any[];
    xKey: string;
    yKey: string;
  };
}

export const widgetLibrary = {
  createMetricWidget: (id: string, title: string, value: number | string, unit?: string): MetricWidget => ({
    id,
    type: 'metric',
    title,
    size: 'small',
    config: {
      value,
      unit
    }
  }),

  createChartWidget: (id: string, title: string, chartType: 'line' | 'bar' | 'pie' | 'area', data: any[]): ChartWidget => ({
    id,
    type: 'chart',
    title,
    size: 'medium',
    config: {
      chartType,
      data,
      xKey: 'x',
      yKey: 'y'
    }
  })
};

export default widgetLibrary;
