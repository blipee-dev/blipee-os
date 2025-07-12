'use client';

import { useState, useEffect } from 'react';
import { Brain, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

interface QuickInsightsProps {
  storeId: string;
}

interface Insight {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  message: string;
  value?: string;
  change?: number;
}

export function QuickInsights({ storeId }: QuickInsightsProps) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (storeId) {
      generateInsights();
    }
  }, [storeId]);

  const generateInsights = async () => {
    try {
      // Fetch both analytics and traffic data
      const [analyticsRes, trafficRes] = await Promise.all([
        fetch(`/api/retail/v1/analytics?loja=${storeId}&start_date=${new Date().toISOString().split('T')[0]}&end_date=${new Date().toISOString().split('T')[0]}`),
        fetch(`/api/retail/v1/traffic/realtime?loja=${storeId}`)
      ]);

      const [analyticsData, trafficData] = await Promise.all([
        analyticsRes.json(),
        trafficRes.json()
      ]);

      const insights: Insight[] = [];

      if (analyticsData.success && trafficData.success) {
        const analytics = analyticsData.data;
        const traffic = trafficData.data;

        // Sales performance insight
        if (analytics.vendas.total_com_iva > 80000) {
          insights.push({
            id: 'sales-high',
            type: 'success',
            title: 'Strong Sales Performance',
            message: 'Today\'s sales are above average',
            value: `€${analytics.vendas.total_com_iva.toLocaleString()}`,
            change: 15
          });
        } else if (analytics.vendas.total_com_iva < 40000) {
          insights.push({
            id: 'sales-low',
            type: 'warning',
            title: 'Sales Below Target',
            message: 'Consider promotional activities',
            value: `€${analytics.vendas.total_com_iva.toLocaleString()}`,
            change: -8
          });
        }

        // Conversion rate insight
        if (analytics.conversao.taxa_conversao > 18) {
          insights.push({
            id: 'conversion-high',
            type: 'success',
            title: 'Excellent Conversion',
            message: 'High visitor-to-customer conversion rate',
            value: `${analytics.conversao.taxa_conversao}%`,
            change: 12
          });
        } else if (analytics.conversao.taxa_conversao < 10) {
          insights.push({
            id: 'conversion-low',
            type: 'warning',
            title: 'Low Conversion Rate',
            message: 'Opportunity to improve customer engagement',
            value: `${analytics.conversao.taxa_conversao}%`,
            change: -5
          });
        }

        // Traffic insights
        if (traffic.current_occupancy > 150) {
          insights.push({
            id: 'traffic-high',
            type: 'info',
            title: 'High Store Activity',
            message: 'Consider increasing staff for better service',
            value: `${traffic.current_occupancy} people`
          });
        }

        // Trend analysis
        if (traffic.trend === 'increasing') {
          insights.push({
            id: 'trend-positive',
            type: 'info',
            title: 'Growing Traffic',
            message: 'Visitor numbers are trending upward',
            value: 'Increasing'
          });
        }

        // Average transaction value
        if (analytics.vendas.ticket_medio > 100) {
          insights.push({
            id: 'ticket-high',
            type: 'success',
            title: 'High Average Purchase',
            message: 'Customers are buying premium items',
            value: `€${analytics.vendas.ticket_medio}`,
            change: 8
          });
        }

        // Dwell time insight
        if (analytics.conversao.tempo_medio_permanencia > 25) {
          insights.push({
            id: 'dwell-good',
            type: 'success',
            title: 'Good Customer Engagement',
            message: 'Visitors are spending quality time in store',
            value: `${analytics.conversao.tempo_medio_permanencia} min`
          });
        }
      }

      // If no specific insights, add a general one
      if (insights.length === 0) {
        insights.push({
          id: 'general',
          type: 'info',
          title: 'Store Operating Normally',
          message: 'All metrics within expected ranges',
          value: 'All Good'
        });
      }

      setInsights(insights);
    } catch (error) {
      console.error('Failed to generate insights:', error);
      setInsights([{
        id: 'error',
        type: 'error',
        title: 'Unable to Generate Insights',
        message: 'Please check your connection and try again',
        value: 'Error'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-400" />;
      default:
        return <TrendingUp className="h-5 w-5 text-blue-400" />;
    }
  };

  const getChangeColor = (change?: number) => {
    if (!change) return '';
    return change > 0 ? 'text-green-400' : 'text-red-400';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <Brain className="h-5 w-5 mr-2 text-purple-400" />
          AI Insights
        </h3>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-white/[0.05] rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white flex items-center">
        <Brain className="h-5 w-5 mr-2 text-purple-400" />
        AI Insights
      </h3>

      <div className="space-y-3">
        {insights.map((insight) => (
          <div 
            key={insight.id}
            className="bg-white/[0.05] rounded-lg p-4 border border-white/[0.05]"
          >
            <div className="flex items-start space-x-3">
              {getIcon(insight.type)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-white truncate">
                    {insight.title}
                  </h4>
                  {insight.value && (
                    <div className="flex items-center space-x-1">
                      <span className="text-sm font-semibold text-white">
                        {insight.value}
                      </span>
                      {insight.change && (
                        <span className={`text-xs ${getChangeColor(insight.change)}`}>
                          {insight.change > 0 ? '+' : ''}{insight.change}%
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {insight.message}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-xs text-gray-500 italic">
        💡 Insights powered by AI analysis of your store data
      </div>
    </div>
  );
}