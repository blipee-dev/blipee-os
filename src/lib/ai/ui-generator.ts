/**
 * Dynamic UI Generation System
 * 
 * Transforms AI responses into rich, interactive UI components
 * Enables the AI to create visualizations, forms, and controls on demand
 */

import { ComponentType } from 'react';

export type UIComponentType = 
  | 'chart'
  | 'table'
  | 'metric_card'
  | 'alert'
  | 'form'
  | 'timeline'
  | 'map'
  | 'progress'
  | 'comparison'
  | 'action_buttons'
  | 'file_viewer'
  | 'interactive_control';

export interface UIComponent {
  id: string;
  type: UIComponentType;
  title?: string;
  description?: string;
  props: Record<string, any>;
  layout?: UILayout;
  interactions?: UIInteraction[];
  priority?: number;
  metadata?: Record<string, any>;
}

export interface UILayout {
  width?: 'full' | 'half' | 'third' | 'quarter' | 'auto';
  height?: 'auto' | 'small' | 'medium' | 'large' | number;
  position?: 'inline' | 'sidebar' | 'modal' | 'floating';
  order?: number;
  responsive?: boolean;
}

export interface UIInteraction {
  trigger: 'click' | 'hover' | 'change' | 'submit';
  action: string;
  payload?: any;
  confirmation?: string;
}

export interface AIResponseWithUI {
  message: string;
  components: UIComponent[];
  suggestions?: string[];
  followUpQuestions?: string[];
  metadata?: {
    confidence: number;
    dataSource?: string;
    timestamp: string;
  };
}

export interface ChartComponent {
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'radar' | 'heatmap';
  data: {
    labels?: string[];
    datasets: Array<{
      label: string;
      data: number[];
      color?: string;
      borderColor?: string;
      backgroundColor?: string;
    }>;
  };
  options?: {
    title?: string;
    xAxis?: { label: string };
    yAxis?: { label: string };
    legend?: boolean;
    stacked?: boolean;
    animate?: boolean;
  };
}

export interface TableComponent {
  columns: Array<{
    key: string;
    label: string;
    type?: 'text' | 'number' | 'date' | 'currency' | 'percentage' | 'badge';
    align?: 'left' | 'center' | 'right';
    sortable?: boolean;
    width?: string | number;
  }>;
  data: Record<string, any>[];
  features?: {
    sortable?: boolean;
    filterable?: boolean;
    paginated?: boolean;
    exportable?: boolean;
    selectable?: boolean;
  };
}

export interface MetricCardComponent {
  value: string | number;
  label: string;
  unit?: string;
  trend?: {
    direction: 'up' | 'down' | 'stable';
    value: number;
    period: string;
  };
  comparison?: {
    value: number;
    label: string;
  };
  icon?: string;
  color?: 'green' | 'red' | 'yellow' | 'blue' | 'gray';
  sparkline?: number[];
}

export interface AlertComponent {
  severity: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  actions?: Array<{
    label: string;
    action: string;
    variant?: 'primary' | 'secondary' | 'text';
  }>;
  dismissible?: boolean;
}

export interface FormComponent {
  fields: Array<{
    name: string;
    label: string;
    type: 'text' | 'number' | 'select' | 'date' | 'checkbox' | 'radio' | 'textarea';
    placeholder?: string;
    required?: boolean;
    validation?: any;
    options?: Array<{ value: string; label: string }>;
    defaultValue?: any;
  }>;
  submitLabel?: string;
  cancelLabel?: string;
  layout?: 'vertical' | 'horizontal' | 'inline';
}

export class DynamicUIGenerator {
  
  /**
   * Parse AI response and extract UI components
   */
  parseAIResponse(response: string): AIResponseWithUI {
    // Look for special markers in the AI response
    const componentMatches = response.matchAll(/\[UI:(\w+)\](.*?)\[\/UI\]/gs);
    const components: UIComponent[] = [];
    let cleanMessage = response;

    for (const match of componentMatches) {
      const componentType = match[1];
      const componentData = match[2];
      
      try {
        const component = this.parseComponentData(componentType as UIComponentType, componentData);
        if (component) {
          components.push(component);
          cleanMessage = cleanMessage.replace(match[0], '');
        }
      } catch (error) {
        console.error('Error parsing UI component:', error);
      }
    }

    // Extract suggestions and follow-up questions
    const suggestions = this.extractSuggestions(cleanMessage);
    const followUpQuestions = this.extractFollowUpQuestions(cleanMessage);

    return {
      message: cleanMessage.trim(),
      components,
      suggestions,
      followUpQuestions,
      metadata: {
        confidence: 0.9,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Generate UI components based on data type and context
   */
  generateComponents(data: any, context: string): UIComponent[] {
    const components: UIComponent[] = [];

    // Analyze data structure and context
    if (this.isTimeSeriesData(data)) {
      components.push(this.createTimeSeriesChart(data, context));
    }

    if (this.isComparisonData(data)) {
      components.push(this.createComparisonChart(data, context));
    }

    if (this.isTableData(data)) {
      components.push(this.createTable(data, context));
    }

    if (this.isMetricData(data)) {
      components.push(...this.createMetricCards(data, context));
    }

    if (this.isAlertData(data)) {
      components.push(this.createAlert(data, context));
    }

    return components;
  }

  /**
   * Create a time series chart component
   */
  createTimeSeriesChart(data: any, context: string): UIComponent {
    const chartData: ChartComponent = {
      type: 'line',
      data: {
        labels: data.labels || [],
        datasets: data.series?.map((series: any) => ({
          label: series.name,
          data: series.values,
          borderColor: this.getColorForDataset(series.name),
          backgroundColor: this.getColorForDataset(series.name, 0.1)
        })) || []
      },
      options: {
        title: data.title || 'Time Series Analysis',
        xAxis: { label: data.xLabel || 'Time' },
        yAxis: { label: data.yLabel || 'Value' },
        animate: true
      }
    };

    return {
      id: `chart-${Date.now()}`,
      type: 'chart',
      title: chartData.options?.title,
      props: chartData,
      layout: {
        width: 'full',
        height: 'medium',
        position: 'inline'
      }
    };
  }

  /**
   * Create comparison chart (bar/pie)
   */
  createComparisonChart(data: any, context: string): UIComponent {
    const isLargeDataset = data.items?.length > 10;
    const chartType = isLargeDataset ? 'bar' : 'pie';

    const chartData: ChartComponent = {
      type: chartType,
      data: {
        labels: data.items?.map((item: any) => item.label) || [],
        datasets: [{
          label: data.metric || 'Comparison',
          data: data.items?.map((item: any) => item.value) || [],
          backgroundColor: data.items?.map((_: any, i: number) => 
            this.getColorForDataset(`item-${i}`)
          ) || []
        }]
      },
      options: {
        title: data.title || 'Comparison Analysis',
        legend: chartType === 'pie'
      }
    };

    return {
      id: `comparison-${Date.now()}`,
      type: 'chart',
      title: chartData.options?.title,
      props: chartData,
      layout: {
        width: chartType === 'pie' ? 'half' : 'full',
        height: 'medium',
        position: 'inline'
      }
    };
  }

  /**
   * Create data table component
   */
  createTable(data: any, context: string): UIComponent {
    const firstRow = data.rows?.[0] || {};
    const columns = Object.keys(firstRow).map(key => ({
      key,
      label: this.formatColumnLabel(key),
      type: this.inferColumnType(firstRow[key]),
      sortable: true
    }));

    const tableData: TableComponent = {
      columns,
      data: data.rows || [],
      features: {
        sortable: true,
        filterable: true,
        paginated: data.rows?.length > 10,
        exportable: true
      }
    };

    return {
      id: `table-${Date.now()}`,
      type: 'table',
      title: data.title || 'Data Table',
      props: tableData,
      layout: {
        width: 'full',
        height: 'auto',
        position: 'inline'
      }
    };
  }

  /**
   * Create metric cards
   */
  createMetricCards(data: any, context: string): UIComponent[] {
    const metrics = Array.isArray(data) ? data : [data];
    
    return metrics.map((metric: any, index: number) => {
      const metricCard: MetricCardComponent = {
        value: metric.value,
        label: metric.label || metric.name,
        unit: metric.unit,
        trend: metric.trend ? {
          direction: metric.trend > 0 ? 'up' : metric.trend < 0 ? 'down' : 'stable',
          value: Math.abs(metric.trend),
          period: metric.period || 'vs last period'
        } : undefined,
        comparison: metric.comparison,
        color: this.getMetricColor(metric),
        sparkline: metric.history
      };

      return {
        id: `metric-${Date.now()}-${index}`,
        type: 'metric_card',
        props: metricCard,
        layout: {
          width: 'quarter',
          height: 'small',
          position: 'inline',
          order: index
        }
      };
    });
  }

  /**
   * Create alert component
   */
  createAlert(data: any, context: string): UIComponent {
    const alertData: AlertComponent = {
      severity: data.severity || 'info',
      title: data.title || 'Alert',
      message: dataerror.message || '',
      actions: data.actions,
      dismissible: data.dismissible !== false
    };

    return {
      id: `alert-${Date.now()}`,
      type: 'alert',
      props: alertData,
      layout: {
        width: 'full',
        position: data.severity === 'error' ? 'floating' : 'inline'
      },
      priority: data.severity === 'error' ? 10 : 5
    };
  }

  /**
   * Generate interactive form from AI intent
   */
  generateForm(intent: string, fields: any[]): UIComponent {
    const formData: FormComponent = {
      fields: fields.map(field => ({
        name: field.name,
        label: field.label || this.formatColumnLabel(field.name),
        type: field.type || 'text',
        placeholder: field.placeholder,
        required: field.required,
        options: field.options,
        defaultValue: field.defaultValue
      })),
      submitLabel: 'Submit',
      cancelLabel: 'Cancel',
      layout: 'vertical'
    };

    return {
      id: `form-${Date.now()}`,
      type: 'form',
      title: `${intent} Form`,
      props: formData,
      layout: {
        width: 'full',
        position: 'inline'
      },
      interactions: [{
        trigger: 'submit',
        action: `handle_${intent}_submission`,
        confirmation: 'Are you sure you want to submit this form?'
      }]
    };
  }

  /**
   * Create action buttons based on AI suggestions
   */
  createActionButtons(actions: Array<{label: string; action: string}>): UIComponent {
    return {
      id: `actions-${Date.now()}`,
      type: 'action_buttons',
      props: {
        buttons: actions.map(action => ({
          label: action.label,
          action: action.action,
          variant: 'primary'
        }))
      },
      layout: {
        width: 'full',
        position: 'inline'
      }
    };
  }

  /**
   * Helper methods
   */
  private parseComponentData(type: UIComponentType, data: string): UIComponent | null {
    try {
      const parsed = JSON.parse(data);
      return {
        id: `${type}-${Date.now()}`,
        type,
        props: parsed,
        layout: {
          width: 'full',
          position: 'inline'
        }
      };
    } catch {
      return null;
    }
  }

  private isTimeSeriesData(data: any): boolean {
    return !!(data.labels && data.series && Array.isArray(data.series));
  }

  private isComparisonData(data: any): boolean {
    return !!(data.items && Array.isArray(data.items) && data.items[0]?.label && data.items[0]?.value);
  }

  private isTableData(data: any): boolean {
    return !!(data.rows && Array.isArray(data.rows) && data.rows.length > 0);
  }

  private isMetricData(data: any): boolean {
    return !!(data.value !== undefined && (data.label || data.name));
  }

  private isAlertData(data: any): boolean {
    return !!(data.message && (data.severity || data.type === 'alert'));
  }

  private formatColumnLabel(key: string): string {
    return key
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private inferColumnType(value: any): 'text' | 'number' | 'date' | 'currency' | 'percentage' {
    if (typeof value === 'number') return 'number';
    if (typeof value === 'string') {
      if (value.match(/^\d{4}-\d{2}-\d{2}/)) return 'date';
      if (value.match(/^\$[\d,]+\.?\d*$/)) return 'currency';
      if (value.match(/^\d+\.?\d*%$/)) return 'percentage';
    }
    return 'text';
  }

  private getColorForDataset(name: string, opacity: number = 1): string {
    const colors = [
      `rgba(59, 130, 246, ${opacity})`, // blue
      `rgba(16, 185, 129, ${opacity})`, // green
      `rgba(251, 146, 60, ${opacity})`, // orange
      `rgba(239, 68, 68, ${opacity})`, // red
      `rgba(147, 51, 234, ${opacity})`, // purple
      `rgba(245, 158, 11, ${opacity})`, // amber
      `rgba(236, 72, 153, ${opacity})`, // pink
      `rgba(20, 184, 166, ${opacity})` // teal
    ];
    
    const index = Math.abs(name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % colors.length;
    return colors[index];
  }

  private getMetricColor(metric: any): 'green' | 'red' | 'yellow' | 'blue' | 'gray' {
    if (metric.status === 'good' || metric.trend > 0) return 'green';
    if (metric.status === 'bad' || metric.trend < -10) return 'red';
    if (metric.status === 'warning' || metric.trend < 0) return 'yellow';
    if (metric.type === 'info') return 'blue';
    return 'gray';
  }

  private extractSuggestions(text: string): string[] {
    const suggestionPattern = /Suggestion[s]?:(.*?)(?=\n\n|$)/s;
    const match = text.match(suggestionPattern);
    if (match) {
      return match[1]
        .split(/\n|•|·|-/)
        .map(s => s.trim())
        .filter(s => s.length > 0);
    }
    return [];
  }

  private extractFollowUpQuestions(text: string): string[] {
    const questionPattern = /Follow[- ]up|Next step[s]?:(.*?)(?=\n\n|$)/s;
    const match = text.match(questionPattern);
    if (match) {
      return match[1]
        .split(/\n|•|·|-|\?/)
        .map(s => s.trim() + (s.endsWith('?') ? '' : '?'))
        .filter(s => s.length > 1);
    }
    return [];
  }

  /**
   * Validate component before rendering
   */
  validateComponent(component: UIComponent): boolean {
    switch (component.type) {
      case 'chart':
        return !!(component.props.data?.datasets?.length > 0);
      case 'table':
        return !!(component.props.columns?.length > 0 && component.props.data?.length > 0);
      case 'metric_card':
        return !!(component.props.value !== undefined && component.props.label);
      case 'alert':
        return !!(component.props.message);
      case 'form':
        return !!(component.props.fields?.length > 0);
      default:
        return true;
    }
  }
}

// Export singleton instance
export const uiGenerator = new DynamicUIGenerator();