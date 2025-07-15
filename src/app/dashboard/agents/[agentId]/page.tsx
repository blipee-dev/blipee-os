import { Metadata } from 'next'
import AgentDetails from '@/components/agents/AgentDetails'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Agent Details - blipee OS',
  description: 'Detailed view of autonomous AI agent performance and configuration',
}

interface AgentDetailPageProps {
  params: {
    agentId: string
  }
}

export default function AgentDetailPage({ params }: AgentDetailPageProps) {
  const { agentId } = params

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/agents">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Agents
            </Button>
          </Link>
          
          <div className="space-y-1">
            <h1 className="text-3xl font-bold">Agent Details</h1>
            <p className="text-muted-foreground">
              Detailed monitoring and control for autonomous AI agent
            </p>
          </div>
        </div>
        
        <AgentDetails agentId={agentId} />
      </div>
    </div>
  )
}