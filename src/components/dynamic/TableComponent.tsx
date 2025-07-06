'use client'

interface TableComponentProps {
  title?: string
  data: any[]
  columns?: string[]
  actions?: {
    label: string
    action: (row: any) => void
  }[]
}

export function TableComponent({ title, data, columns, actions }: TableComponentProps) {
  // Auto-detect columns if not provided
  const tableColumns = columns || (data.length > 0 ? Object.keys(data[0]) : [])

  const formatValue = (value: any) => {
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No'
    }
    if (typeof value === 'number') {
      return value.toLocaleString()
    }
    if (value instanceof Date) {
      return value.toLocaleDateString()
    }
    return value?.toString() || '-'
  }

  const getStatusColor = (value: string) => {
    const lowerValue = value.toLowerCase()
    if (lowerValue.includes('online') || lowerValue.includes('active') || lowerValue.includes('normal')) {
      return 'text-green-400'
    }
    if (lowerValue.includes('offline') || lowerValue.includes('error') || lowerValue.includes('critical')) {
      return 'text-red-400'
    }
    if (lowerValue.includes('warning') || lowerValue.includes('alert')) {
      return 'text-yellow-400'
    }
    return 'text-text-primary'
  }

  return (
    <div className="glass-card glass-card-default" style={{
      background: 'rgba(255, 255, 255, 0.02)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.05)',
      borderRadius: '1rem',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
      overflow: 'hidden',
    }}>
      {title && (
        <div className="p-6 border-b border-gray-800">
          <h3 className="text-lg font-medium text-white">{title}</h3>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              {tableColumns.map((col) => (
                <th
                  key={col}
                  className="px-6 py-4 text-left text-sm font-medium text-gray-400 uppercase tracking-wider"
                >
                  {col.replace(/_/g, ' ')}
                </th>
              ))}
              {actions && actions.length > 0 && (
                <th className="px-4 py-3 text-right text-sm font-medium text-text-secondary uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {data.map((row, index) => (
              <tr key={index} className="hover:bg-white/5 transition-colors">
                {tableColumns.map((col) => (
                  <td key={col} className="px-6 py-4 text-sm">
                    <span className={
                      col.toLowerCase().includes('status') || col.toLowerCase().includes('state')
                        ? getStatusColor(row[col])
                        : 'text-text-primary'
                    }>
                      {formatValue(row[col])}
                    </span>
                  </td>
                ))}
                {actions && actions.length > 0 && (
                  <td className="px-4 py-3 text-sm text-right space-x-2">
                    {actions.map((action, actionIndex) => (
                      <button
                        key={actionIndex}
                        onClick={() => action.action(row)}
                        className="text-primary hover:text-primary-light transition-colors"
                      >
                        {action.label}
                      </button>
                    ))}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 && (
          <div className="text-center py-8 text-text-secondary">
            No data available
          </div>
        )}
      </div>
    </div>
  )
}