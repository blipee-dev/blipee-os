'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, Users, ShoppingCart, Clock, Calendar } from 'lucide-react';

interface AnalyticsData {
  vendas: {
    total_com_iva: number;
    transacoes: number;
    ticket_medio: number;
  };
  conversao: {
    taxa_conversao: number;
    tempo_medio_permanencia: number;
    unidades_por_transacao: number;
  };
}

interface AnalyticsOverviewProps {
  storeId: string;
}

export function AnalyticsOverview({ storeId }: AnalyticsOverviewProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('today');

  useEffect(() => {
    if (storeId) {
      fetchAnalytics();
    }
  }, [storeId, dateRange, fetchAnalytics]);

  const getDateRange = () => {
    const end = new Date();
    let start = new Date();

    switch (dateRange) {
      case 'today':
        start = new Date();
        break;
      case 'week':
        start.setDate(end.getDate() - 7);
        break;
      case 'month':
        start.setDate(end.getDate() - 30);
        break;
      default:
        start = new Date();
    }

    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  };

  const fetchAnalytics = async () => {
    try {
      const { start, end } = getDateRange();
      const response = await fetch(`/api/retail/v1/analytics?loja=${storeId}&start_date=${start}&end_date=${end}`);
      const data = await response.json();
      
      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-purple-400" />
            Analytics Overview
          </h3>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-white/[0.05] rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-white/[0.05] rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <BarChart3 className="h-5 w-5 mr-2 text-purple-400" />
          Analytics Overview
        </h3>
        <div className="text-center py-8 text-gray-400">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No analytics data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Date Range Selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <BarChart3 className="h-5 w-5 mr-2 text-purple-400" />
          Analytics Overview
        </h3>
        
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-white/[0.05] border border-white/[0.1] rounded-lg px-3 py-1 text-white text-sm focus:outline-none focus:border-purple-500/50"
          >
            <option value="today">Today</option>
            <option value="week">Last 7 days</option>
            <option value="month">Last 30 days</option>
          </select>
        </div>
      </div>

      {/* Sales Metrics */}
      <div>
        <h4 className="text-md font-medium text-gray-300 mb-3 flex items-center">
          <DollarSign className="h-4 w-4 mr-2" />
          Sales Performance
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-300">Total Revenue</span>
              <DollarSign className="h-4 w-4 text-green-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(analytics.vendas.total_com_iva)}
            </div>
            <div className="text-xs text-gray-400 mt-1">Including VAT</div>
          </div>

          <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-300">Transactions</span>
              <ShoppingCart className="h-4 w-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {analytics.vendas.transacoes.toLocaleString()}
            </div>
            <div className="text-xs text-gray-400 mt-1">Total sales</div>
          </div>

          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-300">Average Ticket</span>
              <TrendingUp className="h-4 w-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(analytics.vendas.ticket_medio)}
            </div>
            <div className="text-xs text-gray-400 mt-1">Per transaction</div>
          </div>
        </div>
      </div>

      {/* Conversion Metrics */}
      <div>
        <h4 className="text-md font-medium text-gray-300 mb-3 flex items-center">
          <Users className="h-4 w-4 mr-2" />
          Customer Behavior
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-300">Conversion Rate</span>
              <TrendingUp className="h-4 w-4 text-orange-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {formatPercentage(analytics.conversao.taxa_conversao)}
            </div>
            <div className="text-xs text-gray-400 mt-1">Visitors to buyers</div>
          </div>

          <div className="bg-gradient-to-r from-teal-500/20 to-green-500/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-300">Dwell Time</span>
              <Clock className="h-4 w-4 text-teal-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {analytics.conversao.tempo_medio_permanencia}
            </div>
            <div className="text-xs text-gray-400 mt-1">Minutes average</div>
          </div>

          <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-300">Items per Sale</span>
              <ShoppingCart className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {analytics.conversao.unidades_por_transacao.toFixed(1)}
            </div>
            <div className="text-xs text-gray-400 mt-1">Average basket</div>
          </div>
        </div>
      </div>

      {/* Performance Indicators */}
      <div>
        <h4 className="text-md font-medium text-gray-300 mb-3">Performance Indicators</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/[0.05] rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-300">Sales Efficiency</span>
              <div className={`px-2 py-1 rounded-full text-xs ${
                analytics.vendas.ticket_medio > 100 
                  ? 'bg-green-500/20 text-green-400' 
                  : analytics.vendas.ticket_medio > 50
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {analytics.vendas.ticket_medio > 100 ? 'Excellent' : 
                 analytics.vendas.ticket_medio > 50 ? 'Good' : 'Needs Improvement'}
              </div>
            </div>
            <div className="w-full bg-white/[0.1] rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-green-400 to-blue-400 h-2 rounded-full"
                style={{ width: `${Math.min((analytics.vendas.ticket_medio / 150) * 100, 100)}%` }}
              />
            </div>
          </div>

          <div className="bg-white/[0.05] rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-300">Customer Engagement</span>
              <div className={`px-2 py-1 rounded-full text-xs ${
                analytics.conversao.taxa_conversao > 18 
                  ? 'bg-green-500/20 text-green-400' 
                  : analytics.conversao.taxa_conversao > 10
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {analytics.conversao.taxa_conversao > 18 ? 'High' : 
                 analytics.conversao.taxa_conversao > 10 ? 'Medium' : 'Low'}
              </div>
            </div>
            <div className="w-full bg-white/[0.1] rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-purple-400 to-pink-400 h-2 rounded-full"
                style={{ width: `${Math.min((analytics.conversao.taxa_conversao / 25) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-500 italic">
        📊 Data updates every 20 minutes • Last sync: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}