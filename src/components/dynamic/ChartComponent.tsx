'use client'

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend
} from 'recharts'

interface ChartComponentProps {
  title?: string
  chartType?: 'line' | 'bar' | 'pie' | 'area' | 'doughnut'
  data?: any
  options?: any
}

const COLORS = ['#0EA5E9', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899']

export function ChartComponent({ title, chartType = 'line', data = [] }: ChartComponentProps) {
  // Format data for recharts
  const chartData = Array.isArray(data) ? data : data.data || []
  
  const renderChart = () => {
    switch (chartType) {
      case 'line':
        return (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="name" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
              labelStyle={{ color: '#f1f5f9' }}
            />
            <Line type="monotone" dataKey="value" stroke="#0EA5E9" strokeWidth={2} />
          </LineChart>
        )
      
      case 'bar':
        return (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="name" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
              labelStyle={{ color: '#f1f5f9' }}
            />
            <Bar dataKey="value" fill="#0EA5E9" />
          </BarChart>
        )
      
      case 'area':
        return (
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="name" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
              labelStyle={{ color: '#f1f5f9' }}
            />
            <Area type="monotone" dataKey="value" stroke="#0EA5E9" fill="#0EA5E9" fillOpacity={0.3} />
          </AreaChart>
        )
      
      case 'pie':
      case 'doughnut':
        return (
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry) => entry.name}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              innerRadius={chartType === 'doughnut' ? 40 : 0}
            >
              {chartData.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
              labelStyle={{ color: '#f1f5f9' }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              wrapperStyle={{ color: '#94a3b8' }}
            />
          </PieChart>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="glass-card glass-card-default" style={{
      background: 'rgba(255, 255, 255, 0.02)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.05)',
      borderRadius: '1rem',
      padding: '1.5rem',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
    }}>
      {title && (
        <h3 className="text-lg font-medium text-white mb-4">{title}</h3>
      )}
      <div className="w-full h-64">
        {chartType && (
          <ResponsiveContainer width="100%" height="100%">
            {renderChart() || <div />}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}