'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Network, 
  Users, 
  TrendingUp, 
  Shield, 
  Search,
  AlertTriangle,
  CheckCircle,
  Info,
  Globe
} from 'lucide-react';
import { NetworkIntelligenceService } from '@/lib/ai/network-intelligence';

interface NetworkDashboardProps {
  organizationId: string;
}

export function NetworkDashboard({ organizationId }: NetworkDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [networkData, setNetworkData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'suppliers' | 'benchmarks' | 'marketplace'>('overview');
  
  const networkService = new NetworkIntelligenceService();

  useEffect(() => {
    loadNetworkData();
  }, [organizationId]);

  const loadNetworkData = async () => {
    setLoading(true);
    try {
      const [graph, insights, health] = await Promise.all([
        networkService.buildNetworkGraph(organizationId),
        networkService.analyzeNetwork(organizationId),
        networkService.monitorNetworkHealth(organizationId)
      ]);

      setNetworkData({
        graph,
        insights,
        health
      });
    } catch (error) {
      console.error('Error loading network data:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Network className="h-6 w-6 text-purple-400" />
          Network Intelligence
        </h2>
        <div className="flex gap-2">
          <Button 
            variant={activeTab === 'overview' ? 'default' : 'outline'}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </Button>
          <Button 
            variant={activeTab === 'suppliers' ? 'default' : 'outline'}
            onClick={() => setActiveTab('suppliers')}
          >
            Suppliers
          </Button>
          <Button 
            variant={activeTab === 'benchmarks' ? 'default' : 'outline'}
            onClick={() => setActiveTab('benchmarks')}
          >
            Benchmarks
          </Button>
          <Button 
            variant={activeTab === 'marketplace' ? 'default' : 'outline'}
            onClick={() => setActiveTab('marketplace')}
          >
            Marketplace
          </Button>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && networkData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Network Health */}
          <Card className="backdrop-blur-xl bg-white/[0.03] border-white/[0.05]">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-400" />
                Network Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-white/60">Health Score</span>
                    <span className="text-sm font-semibold">{networkData.health.healthScore}%</span>
                  </div>
                  <Progress value={networkData.health.healthScore} className="h-2" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-white/60">
                    {networkData.health.alerts.filter((a: any) => a.type === 'risk').length} active risks
                  </p>
                  <p className="text-sm text-white/60">
                    {networkData.health.alerts.filter((a: any) => a.type === 'opportunity').length} opportunities
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Network Size */}
          <Card className="backdrop-blur-xl bg-white/[0.03] border-white/[0.05]">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-400" />
                Network Size
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-2xl font-bold">{networkData.graph.nodes.length}</p>
                    <p className="text-sm text-white/60">Total Nodes</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{networkData.graph.edges.length}</p>
                    <p className="text-sm text-white/60">Connections</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-white/60">Network Density</p>
                  <p className="text-lg font-semibold">
                    {(networkData.graph.metadata.density * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Insights */}
          <Card className="backdrop-blur-xl bg-white/[0.03] border-white/[0.05]">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="h-5 w-5 text-purple-400" />
                Key Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {networkData.insights.slice(0, 3).map((insight: any, index: number) => (
                  <div key={index} className="flex items-start gap-2">
                    {insight.type === 'risk' ? (
                      <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5" />
                    ) : (
                      <TrendingUp className="h-4 w-4 text-green-400 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{insight.title}</p>
                      <p className="text-xs text-white/60">{insight.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Suppliers Tab */}
      {activeTab === 'suppliers' && (
        <Card className="backdrop-blur-xl bg-white/[0.03] border-white/[0.05]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-purple-400" />
              Supplier Discovery
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-white/60">
              <Globe className="h-12 w-12 mx-auto mb-4 text-white/40" />
              <p>Discover sustainable suppliers matching your requirements</p>
              <Button className="mt-4" variant="outline">
                Start Discovery
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Benchmarks Tab */}
      {activeTab === 'benchmarks' && (
        <Card className="backdrop-blur-xl bg-white/[0.03] border-white/[0.05]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-400" />
              Peer Benchmarking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-white/60">
              <Users className="h-12 w-12 mx-auto mb-4 text-white/40" />
              <p>Compare your performance with industry peers</p>
              <Button className="mt-4" variant="outline">
                View Benchmarks
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Marketplace Tab */}
      {activeTab === 'marketplace' && (
        <Card className="backdrop-blur-xl bg-white/[0.03] border-white/[0.05]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-purple-400" />
              ESG Data Marketplace
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-white/60">
              <Network className="h-12 w-12 mx-auto mb-4 text-white/40" />
              <p>Access and share anonymized ESG data</p>
              <Button className="mt-4" variant="outline">
                Browse Marketplace
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Network Alerts */}
      {networkData?.health.alerts.length > 0 && (
        <Card className="backdrop-blur-xl bg-white/[0.03] border-white/[0.05]">
          <CardHeader>
            <CardTitle className="text-lg">Network Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {networkData.health.alerts.slice(0, 5).map((alert: any, index: number) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02]">
                  {alert.type === 'risk' ? (
                    <AlertTriangle className={`h-5 w-5 ${
                      alert.severity === 'high' ? 'text-red-400' : 
                      alert.severity === 'medium' ? 'text-yellow-400' : 
                      'text-blue-400'
                    }`} />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{alert.message}</p>
                    <p className="text-sm text-white/60 mt-1">{alert.action}</p>
                    <Badge 
                      variant="outline" 
                      className="mt-2 text-xs"
                    >
                      {alert.supplier}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}