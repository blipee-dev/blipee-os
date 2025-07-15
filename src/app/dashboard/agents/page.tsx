import { Metadata } from 'next'
import AgentDashboard from '@/components/agents/AgentDashboard'
import AgentPerformanceDashboard from '@/components/agents/AgentPerformanceDashboard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export const metadata: Metadata = {
  title: 'Autonomous AI Agents - blipee OS',
  description: 'Manage and monitor your autonomous ESG AI agents',
}

export default function AgentsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Autonomous AI Agents</h1>
          <p className="text-muted-foreground">
            Monitor and manage your 24/7 autonomous ESG workforce
          </p>
        </div>
        
        <Tabs defaultValue="agents" className="space-y-4">
          <TabsList>
            <TabsTrigger value="agents">Agent Management</TabsTrigger>
            <TabsTrigger value="performance">Performance Monitoring</TabsTrigger>
          </TabsList>
          
          <TabsContent value="agents">
            <AgentDashboard />
          </TabsContent>
          
          <TabsContent value="performance">
            <AgentPerformanceDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}