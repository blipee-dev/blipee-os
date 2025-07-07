"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Sparkles, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

interface TableComponentProps {
  title?: string;
  subtitle?: string;
  headers?: string[];
  rows?: any[][];
  data?: any[];
  columns?: string[];
  actions?: {
    label: string;
    action: (row: any) => void;
  }[];
  showTrends?: boolean;
  highlightColumn?: number;
  sortable?: boolean;
}

export function TableComponent({
  title,
  subtitle,
  headers,
  rows,
  data = [],
  columns,
  actions,
  showTrends = false,
  highlightColumn,
  sortable = true,
}: TableComponentProps) {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  
  // Support both old data/columns format and new headers/rows format
  const tableHeaders = headers || columns || (data.length > 0 ? Object.keys(data[0]) : []);
  const tableData = rows || (data.length > 0 ? data.map(row => 
    columns ? columns.map(col => row[col]) : Object.values(row)
  ) : []);

  const formatValue = (value: any, colIndex?: number) => {
    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }
    if (typeof value === "number") {
      return value.toLocaleString();
    }
    if (value instanceof Date) {
      return value.toLocaleDateString();
    }
    return value?.toString() || "-";
  };

  const getStatusIcon = (value: string) => {
    const lowerValue = value.toLowerCase();
    if (lowerValue.includes("optimal") || lowerValue.includes("🟢")) {
      return <CheckCircle className="w-4 h-4 text-green-400" />;
    }
    if (lowerValue.includes("attention") || lowerValue.includes("🔴")) {
      return <XCircle className="w-4 h-4 text-red-400" />;
    }
    if (lowerValue.includes("good") || lowerValue.includes("🟡")) {
      return <AlertCircle className="w-4 h-4 text-yellow-400" />;
    }
    return null;
  };

  const getTrendIcon = (value: string | number) => {
    if (typeof value === 'string') {
      const numValue = parseFloat(value.replace(/[^0-9.-]/g, ''));
      if (!isNaN(numValue)) {
        if (numValue > 0) return <TrendingUp className="w-3 h-3 text-green-400" />;
        if (numValue < 0) return <TrendingDown className="w-3 h-3 text-red-400" />;
      }
    }
    return <Minus className="w-3 h-3 text-gray-400" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative overflow-hidden"
    >
      {/* Ambient glow effect */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl opacity-20 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-500 rounded-full filter blur-3xl opacity-20 animate-pulse animation-delay-2000" />
      </div>
      
      <div
        className="relative backdrop-blur-xl bg-white/[0.02] border border-white/[0.05] rounded-2xl overflow-hidden"
        style={{
          boxShadow: "0 0 40px rgba(168, 85, 247, 0.1), 0 0 80px rgba(236, 72, 153, 0.05)",
        }}
      >
        {/* Gradient accent line */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
        
        {title && (
          <div className="p-6 border-b border-white/[0.05]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                  {title}
                </h3>
                {subtitle && (
                  <p className="text-sm text-white/50 mt-1">{subtitle}</p>
                )}
              </div>
              <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
            </div>
          </div>
        )}
        
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.05]">
                {tableHeaders.map((header, index) => (
                  <th
                    key={index}
                    onClick={() => sortable && setSortConfig({ 
                      key: header, 
                      direction: sortConfig?.key === header && sortConfig.direction === 'asc' ? 'desc' : 'asc' 
                    })}
                    className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider transition-all duration-200 ${
                      sortable ? 'cursor-pointer hover:text-purple-400' : ''
                    } ${
                      highlightColumn === index ? 'text-purple-400' : 'text-white/40'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {header.replace(/_/g, " ")}
                      {sortConfig?.key === header && (
                        <motion.div
                          initial={{ rotate: 0 }}
                          animate={{ rotate: sortConfig.direction === 'desc' ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <TrendingUp className="w-3 h-3" />
                        </motion.div>
                      )}
                    </div>
                  </th>
                ))}
                {actions && actions.length > 0 && (
                  <th className="px-6 py-4 text-right text-xs font-medium text-white/40 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {tableData.map((row, rowIndex) => (
                <motion.tr
                  key={rowIndex}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: rowIndex * 0.05 }}
                  onMouseEnter={() => setHoveredRow(rowIndex)}
                  onMouseLeave={() => setHoveredRow(null)}
                  className={`transition-all duration-200 ${
                    hoveredRow === rowIndex ? 'bg-white/[0.03]' : ''
                  }`}
                >
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {cellIndex === row.length - 1 && getStatusIcon(cell)}
                        <span className={`text-sm ${
                          highlightColumn === cellIndex 
                            ? 'text-purple-400 font-semibold' 
                            : 'text-white/70'
                        }`}>
                          {formatValue(cell, cellIndex)}
                        </span>
                        {showTrends && cellIndex < row.length - 1 && typeof cell === 'string' && cell.includes('%') && 
                          getTrendIcon(cell)
                        }
                      </div>
                    </td>
                  ))}
                  {actions && actions.length > 0 && (
                    <td className="px-6 py-4 text-right">
                      {actions.map((action, actionIndex) => (
                        <motion.button
                          key={actionIndex}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => action.action(data[rowIndex])}
                          className="text-purple-400 hover:text-purple-300 transition-colors text-sm font-medium"
                        >
                          {action.label}
                        </motion.button>
                      ))}
                    </td>
                  )}
                </motion.tr>
              ))}
            </tbody>
          </table>
          {tableData.length === 0 && (
            <div className="text-center py-12">
              <Sparkles className="w-8 h-8 text-white/20 mx-auto mb-3" />
              <p className="text-white/40">No data available yet</p>
              <p className="text-white/20 text-sm mt-1">Data will appear here when available</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
