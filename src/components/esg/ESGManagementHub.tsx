import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Target, 
  Upload, 
  BarChart3, 
  CheckCircle, 
  TrendingUp,
  FileSpreadsheet,
  MessageSquare,
  Users,
  Calendar,
  AlertTriangle
} from 'lucide-react';

import { EmissionsDataEntry } from './EmissionsDataEntry';
import { BulkDataImport } from './BulkDataImport';
import { ConversationalTargetSetting } from './ConversationalTargetSetting';

interface Props {
  organizationId: string;
}

export function ESGManagementHub({ organizationId }: Props) {
  const [activeTab, setActiveTab] = useState('overview');

  const quickStats = [
    { label: 'Total Emissions', value: '1,234 tCO2e', change: '-5.2%', trend: 'down' },
    { label: 'Active Targets', value: '8', change: '+2', trend: 'up' },
    { label: 'Compliance Score', value: '87%', change: '+3%', trend: 'up' },
    { label: 'Data Quality', value: '92%', change: '+1%', trend: 'up' }
  ];

  const recentActivity = [
    { type: 'emission', message: 'New emission record added for Main Office', time: '2 hours ago' },
    { type: 'target', message: 'Net Zero target progress updated', time: '4 hours ago' },
    { type: 'report', message: 'Monthly sustainability report generated', time: '1 day ago' },
    { type: 'compliance', message: 'GRI compliance check completed', time: '2 days ago' }
  ];

  const upcomingDeadlines = [
    { framework: 'GRI', requirement: 'Annual Report', deadline: '2024-03-31', status: 'in_progress' },
    { framework: 'TCFD', requirement: 'Climate Risk Assessment', deadline: '2024-04-15', status: 'pending' },
    { framework: 'SASB', requirement: 'Industry Metrics Update', deadline: '2024-05-01', status: 'pending' }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">ESG Management Hub</h1>
          <p className="text-muted-foreground">
            Comprehensive ESG data management and target setting
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-green-50 text-green-700">
            Platform Complete
          </Badge>
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            AI-Powered
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <div className={`flex items-center gap-1 text-sm ${
                  stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  <TrendingUp className={`h-4 w-4 ${stat.trend === 'down' ? 'rotate-180' : ''}`} />
                  {stat.change}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="data-entry">Data Entry</TabsTrigger>
          <TabsTrigger value="bulk-import">Bulk Import</TabsTrigger>
          <TabsTrigger value="targets">Target Setting</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Upcoming Deadlines */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming Deadlines
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {upcomingDeadlines.map((deadline, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{deadline.framework}</p>
                      <p className="text-sm text-muted-foreground">{deadline.requirement}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{deadline.deadline}</p>
                      <Badge variant={deadline.status === 'in_progress' ? 'default' : 'outline'}>
                        {deadline.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center gap-2"
                  onClick={() => setActiveTab('data-entry')}
                >
                  <Target className="h-6 w-6" />
                  Add Emission Data
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center gap-2"
                  onClick={() => setActiveTab('bulk-import')}
                >
                  <Upload className="h-6 w-6" />
                  Bulk Import
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center gap-2"
                  onClick={() => setActiveTab('targets')}
                >
                  <MessageSquare className="h-6 w-6" />
                  Set Targets
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center gap-2"
                  onClick={() => setActiveTab('reports')}
                >
                  <FileSpreadsheet className="h-6 w-6" />
                  Generate Reports
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data-entry">
          <EmissionsDataEntry 
            organizationId={organizationId}
            onSuccess={() => {
              // Could trigger a refresh of the dashboard
              console.log('Emission record added successfully');
            }}
          />
        </TabsContent>

        <TabsContent value="bulk-import">
          <BulkDataImport 
            organizationId={organizationId}
            onSuccess={(result) => {
              console.log('Bulk import completed:', result);
            }}
          />
        </TabsContent>

        <TabsContent value="targets">
          <ConversationalTargetSetting 
            organizationId={organizationId}
            onTargetCreated={(target) => {
              console.log('Target created:', target);
            }}
          />
        </TabsContent>

        <TabsContent value="compliance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Compliance Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  Compliance Dashboard Available
                </h3>
                <p className="text-muted-foreground mb-4">
                  Your platform already includes comprehensive compliance tracking for multiple frameworks including GRI, TCFD, SASB, and ESRS.
                </p>
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  Already Implemented
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Report Generation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileSpreadsheet className="h-12 w-12 mx-auto text-blue-500 mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  Advanced Report Generation Available
                </h3>
                <p className="text-muted-foreground mb-4">
                  Your platform includes AI-powered report generation with support for multiple standards and frameworks.
                </p>
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  Already Implemented
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}