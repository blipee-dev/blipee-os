import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { UnifiedOrchestrator } from '@/lib/orchestration/unified-orchestrator';
import { AgentActivationService } from '@/lib/agents/agent-activation-service';

// Initialize orchestrator as singleton
let orchestrator: UnifiedOrchestrator | null = null;
let activationService: AgentActivationService | null = null;

function getOrchestrator(): UnifiedOrchestrator {
  if (!orchestrator) {
    orchestrator = new UnifiedOrchestrator();
  }
  return orchestrator;
}

function getActivationService(): AgentActivationService {
  if (!activationService) {
    activationService = AgentActivationService.getInstance();
  }
  return activationService;
}

/**
 * POST /api/v1/orchestrator
 * Main endpoint for processing user messages through the unified orchestrator
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authentication
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Please sign in to continue' },
        { status: 401 }
      );
    }

    // 2. Get user's organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json(
        { error: 'No organization', message: 'User is not associated with an organization' },
        { status: 400 }
      );
    }

    // 3. Parse request body
    const { message, context = {} } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request', message: 'Message is required' },
        { status: 400 }
      );
    }

    // 4. Process through orchestrator
    console.log(`📨 Processing message from user ${user.id}: "${message}"`);
    
    const orchestratorInstance = getOrchestrator();
    const response = await orchestratorInstance.processUserMessage({
      message,
      userId: user.id,
      organizationId: profile.organization_id,
      context
    });

    // 5. Log analytics
    await logUserInteraction(supabase, {
      userId: user.id,
      organizationId: profile.organization_id,
      message,
      response,
      timestamp: new Date().toISOString()
    });

    // 6. Return response
    return NextResponse.json({
      success: true,
      response,
      user: {
        id: user.id,
        email: user.email
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Orchestrator API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'An unexpected error occurred. Please try again.',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/orchestrator
 * Get orchestrator status and available capabilities
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get agent statuses
    const activationServiceInstance = getActivationService();
    const agentStatuses = activationServiceInstance.getAgentStatuses();

    // Get capabilities
    const capabilities = {
      agents: [
        {
          id: 'esg-chief-of-staff',
          name: 'ESG Chief of Staff',
          description: 'Comprehensive ESG analysis and reporting',
          status: agentStatuses.find(a => a.agentId === 'esg-chief-of-staff')?.status || 'inactive'
        },
        {
          id: 'compliance-guardian',
          name: 'Compliance Guardian',
          description: 'Regulatory compliance monitoring and alerts',
          status: agentStatuses.find(a => a.agentId === 'compliance-guardian')?.status || 'inactive'
        },
        {
          id: 'carbon-hunter',
          name: 'Carbon Hunter',
          description: 'Emission reduction opportunity identification',
          status: agentStatuses.find(a => a.agentId === 'carbon-hunter')?.status || 'inactive'
        },
        {
          id: 'supply-chain-investigator',
          name: 'Supply Chain Investigator',
          description: 'Supplier sustainability assessment',
          status: agentStatuses.find(a => a.agentId === 'supply-chain-investigator')?.status || 'inactive'
        }
      ],
      intents: [
        'esg_analysis',
        'compliance_check',
        'emission_query',
        'supply_chain_analysis',
        'prediction_request',
        'target_management'
      ],
      dataConnections: {
        database: true,
        externalAPIs: {
          weather: !!process.env.OPENWEATHERMAP_API_KEY,
          carbon: !!process.env.ELECTRICITY_MAPS_API_KEY,
          regulatory: false // Not yet implemented
        }
      }
    };

    return NextResponse.json({
      status: 'active',
      capabilities,
      agentStatuses,
      version: '1.0.0'
    });

  } catch (error) {
    console.error('❌ GET orchestrator error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/v1/orchestrator
 * Activate or control orchestrator agents
 */
export async function PUT(request: NextRequest) {
  try {
    // Authentication
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'account_owner' && profile?.role !== 'sustainability_manager') {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Only administrators can control agents' },
        { status: 403 }
      );
    }

    // Parse action
    const { action } = await request.json();

    const activationServiceInstance = getActivationService();

    switch (action) {
      case 'activate':
        await activationServiceInstance.activateAllAgents(profile.organization_id);
        return NextResponse.json({
          success: true,
          message: 'All agents activated successfully',
          agentStatuses: activationServiceInstance.getAgentStatuses()
        });

      case 'pause':
        await activationServiceInstance.pauseAllAgents();
        return NextResponse.json({
          success: true,
          message: 'All agents paused',
          agentStatuses: activationServiceInstance.getAgentStatuses()
        });

      case 'resume':
        await activationServiceInstance.resumeAllAgents();
        return NextResponse.json({
          success: true,
          message: 'All agents resumed',
          agentStatuses: activationServiceInstance.getAgentStatuses()
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action', message: 'Action must be: activate, pause, or resume' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('❌ PUT orchestrator error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to log user interactions
 */
async function logUserInteraction(
  supabase: any,
  data: {
    userId: string;
    organizationId: string;
    message: string;
    response: any;
    timestamp: string;
  }
): Promise<void> {
  try {
    // Log to analytics table
    await supabase.from('conversation_analytics').insert({
      user_id: data.userId,
      organization_id: data.organizationId,
      message: data.message,
      response_type: data.response.metadata?.agent || 'general',
      has_components: (data.response.components?.length || 0) > 0,
      execution_time_ms: data.response.metadata?.executionTime || 0,
      created_at: data.timestamp
    });

    // Update user activity
    await supabase
      .from('profiles')
      .update({ last_active: data.timestamp })
      .eq('id', data.userId);

  } catch (error) {
    console.error('Error logging interaction:', error);
    // Don't throw - logging errors shouldn't break the main flow
  }
}