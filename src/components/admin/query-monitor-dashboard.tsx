'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, CheckCircle, Database, Download, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface QueryMonitorDashboardProps {
  onExport?: (format: 'json' | 'csv') => void;
}

export function QueryMonitorDashboard({ onExport }: QueryMonitorDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({});
  const [activeTab, setActiveTab] = useState('overview');
  
  const fetchData = async () => {
    setLoading(true);
    try {
      const [stats, slowQueries, insights, patterns, health] = await Promise.all([
        fetch('/api/monitoring/queries?type=stats').then(r => r.json()),
        fetch('/api/monitoring/queries?type=slow_queries').then(r => r.json()),
        fetch('/api/monitoring/queries?type=insights').then(r => r.json()),
        fetch('/api/monitoring/queries?type=patterns').then(r => r.json()),
        fetch('/api/monitoring/queries?type=health').then(r => r.json())
      ]);
      
      setData({
        stats: stats.data,
        slowQueries: slowQueries.data,
        insights: insights.data,
        patterns: patterns.data,
        health: health.data
      });
    } catch (error) {
      console.error('Error fetching monitoring data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchData();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
  
  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const response = await fetch(`/api/monitoring/queries?type=report&format=${format}`);
      
      if (format === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `query-report-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `query-report-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
      
      onExport?.(format);
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading monitoring data...</span>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Query Monitoring Dashboard</h2>
        <div className="space-x-2">
          <Button variant="outline" size="sm" onClick={() => handleExport('json')}>
            <Download className="h-4 w-4 mr-1" />
            Export JSON
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
            <Download className="h-4 w-4 mr-1" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>
      
      {/* Health Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Database Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {data.stats?.health?.critical > 0 ? (
                <AlertTriangle className="h-5 w-5 text-red-500" />
              ) : data.stats?.health?.warning > 0 ? (
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
              <div>
                <p className="text-2xl font-bold">
                  {data.stats?.health?.healthy || 0}/{data.stats?.health?.total || 0}
                </p>
                <p className="text-xs text-muted-foreground">Healthy Metrics</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Slow Queries (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.stats?.slowQueriesLast24h || 0}</p>
            <p className="text-xs text-muted-foreground">Queries above threshold</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Tables</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.stats?.tables?.length || 0}</p>
            <p className="text-xs text-muted-foreground">Monitored tables</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              {data.stats?.timestamp 
                ? formatDistanceToNow(new Date(data.stats.timestamp), { addSuffix: true })
                : 'Never'
              }
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Detailed Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="slow-queries">Slow Queries</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Table Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.stats?.tables?.map((table: any) => (
                  <div key={table.table} className="flex justify-between items-center p-2 rounded-lg bg-muted/50">
                    <span className="font-medium">{table.table}</span>
                    <div className="text-sm text-muted-foreground space-x-4">
                      <span>Rows: {table.row_count}</span>
                      <span>Size: {table.table_size}</span>
                      <span>Indexes: {table.index_size}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="slow-queries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Slow Query Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.slowQueries?.slice(0, 10).map((query: any, index: number) => (
                  <div key={index} className="p-3 rounded-lg border bg-card">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant={query.query_type === 'SELECT' ? 'default' : 'secondary'}>
                        {query.query_type}
                      </Badge>
                      <div className="text-sm text-muted-foreground space-x-2">
                        <span>Calls: {query.calls}</span>
                        <span>Avg: {Math.round(query.mean_time)}ms</span>
                        <span>Max: {Math.round(query.max_time)}ms</span>
                      </div>
                    </div>
                    <pre className="text-xs overflow-x-auto bg-muted p-2 rounded">
                      {query.query_text}
                    </pre>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="insights" className="space-y-4">
          {data.insights?.map((insight: any, index: number) => (
            <Alert key={index}>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{insight.description}</AlertTitle>
              <AlertDescription>
                <p className="mb-2"><strong>Impact:</strong> {insight.impact}</p>
                <p className="mb-2"><strong>Recommendation:</strong> {insight.recommendation}</p>
                {insight.query_example && (
                  <pre className="text-xs overflow-x-auto bg-muted p-2 rounded mt-2">
                    {insight.query_example}
                  </pre>
                )}
              </AlertDescription>
            </Alert>
          ))}
        </TabsContent>
        
        <TabsContent value="patterns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Query Pattern Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.patterns?.map((pattern: any, index: number) => (
                  <div key={index} className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">{pattern.pattern_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {pattern.occurrence_count} queries, avg {Math.round(pattern.avg_execution_time)}ms
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {(pattern.total_time / 1000).toFixed(1)}s total
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="health" className="space-y-4">
          <div className="grid gap-4">
            {data.health?.map((metric: any, index: number) => (
              <Card key={index} className={!metric.is_healthy ? 'border-red-500' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-medium">{metric.metric_name}</CardTitle>
                    {metric.is_healthy ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {metric.metric_value} {metric.unit}
                  </p>
                  <div className="text-xs text-muted-foreground mt-1">
                    Warning: {metric.threshold_warning} | Critical: {metric.threshold_critical}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}