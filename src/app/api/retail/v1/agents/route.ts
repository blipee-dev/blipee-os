import { NextRequest, NextResponse } from 'next/server';
import { withRetailPermission } from '@/lib/auth/retail-middleware';
import { RETAIL_PERMISSIONS } from '@/lib/auth/retail-permissions';
import { retailAgentRegistry } from '@/lib/ai/autonomous-agents/retail/retail-agent-registry';

// GET handler - Get agent status and metrics
async function handleGetAgentStatus(request: NextRequest, context: any) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const action = searchParams.get('action');

    if (!storeId) {
      return NextResponse.json(
        { error: 'Missing required parameter: storeId' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'metrics':
        const metrics = await retailAgentRegistry.getRetailAgentMetrics(storeId);
        return NextResponse.json({
          success: true,
          storeId,
          metrics,
          requestedBy: context.user.email
        });

      case 'status':
      default:
        const registryStatus = retailAgentRegistry.getRegistryStatus();
        const storeMetrics = await retailAgentRegistry.getRetailAgentMetrics(storeId);
        
        return NextResponse.json({
          success: true,
          storeId,
          agentCount: storeMetrics.length,
          agents: storeMetrics.map(m => ({
            agentId: m.agentId,
            agentName: m.agentName,
            autonomyLevel: m.autonomyLevel,
            successRate: m.successRate,
            lastExecution: m.lastExecution,
            tasksCompleted: m.tasksCompleted
          })),
          registryStatus,
          requestedBy: context.user.email
        });
    }
  } catch (error) {
    console.error('Error getting agent status:', error);
    return NextResponse.json(
      { error: 'Failed to get agent status', details: error.message },
      { status: 500 }
    );
  }
}

// POST handler - Control agents and execute tasks
async function handleAgentControl(request: NextRequest, context: any) {
  try {
    const body = await request.json();
    const { action, storeId, taskType, parameters, config } = body;

    if (!storeId) {
      return NextResponse.json(
        { error: 'Missing required parameter: storeId' },
        { status: 400 }
      );
    }

    console.log(`Agent action ${action} requested by ${context.user.email} for store ${storeId}`);

    switch (action) {
      case 'initialize':
        const agentIds = await retailAgentRegistry.initializeRetailAgents(storeId, config);
        return NextResponse.json({
          success: true,
          message: 'Retail agents initialized successfully',
          storeId,
          agentIds,
          agentCount: agentIds.length
        });

      case 'execute_task':
        if (!taskType) {
          return NextResponse.json(
            { error: 'Missing required parameter: taskType' },
            { status: 400 }
          );
        }

        const taskResult = await retailAgentRegistry.executeRetailTask(
          storeId,
          taskType,
          parameters || {}
        );

        return NextResponse.json({
          success: true,
          message: `Task ${taskType} executed successfully`,
          storeId,
          taskType,
          result: taskResult
        });

      case 'update_config':
        if (!config) {
          return NextResponse.json(
            { error: 'Missing required parameter: config' },
            { status: 400 }
          );
        }

        await retailAgentRegistry.updateAgentConfiguration(storeId, config);
        return NextResponse.json({
          success: true,
          message: 'Agent configuration updated successfully',
          storeId
        });

      case 'stop':
        await retailAgentRegistry.stopRetailAgents(storeId);
        return NextResponse.json({
          success: true,
          message: 'All retail agents stopped',
          storeId
        });

      case 'retrain_models':
        await retailAgentRegistry.retrainMLModels(storeId);
        return NextResponse.json({
          success: true,
          message: 'ML models retrained successfully',
          storeId
        });

      case 'predict':
        const { modelType, input } = parameters || {};
        if (!modelType || !input) {
          return NextResponse.json(
            { error: 'Missing required parameters: modelType, input' },
            { status: 400 }
          );
        }

        const prediction = await retailAgentRegistry.getMLModelPrediction(
          storeId,
          modelType,
          input
        );

        return NextResponse.json({
          success: true,
          message: 'Prediction generated successfully',
          storeId,
          modelType,
          prediction
        });

      // Specific agent tasks for direct invocation
      case 'analyze_inventory':
        const inventoryResult = await retailAgentRegistry.executeRetailTask(
          storeId,
          'analyze_inventory',
          parameters || {}
        );
        return NextResponse.json({
          success: true,
          message: 'Inventory analysis completed',
          storeId,
          result: inventoryResult
        });

      case 'analyze_customers':
        const customerResult = await retailAgentRegistry.executeRetailTask(
          storeId,
          'analyze_customer_segments',
          parameters || {}
        );
        return NextResponse.json({
          success: true,
          message: 'Customer analysis completed',
          storeId,
          result: customerResult
        });

      case 'predict_demand':
        const demandResult = await retailAgentRegistry.executeRetailTask(
          storeId,
          'predict_demand',
          parameters || {}
        );
        return NextResponse.json({
          success: true,
          message: 'Demand prediction completed',
          storeId,
          result: demandResult
        });

      case 'optimize_pricing':
        const pricingPrediction = await retailAgentRegistry.getMLModelPrediction(
          storeId,
          'price',
          {
            storeId,
            productId: parameters?.productId || 'default',
            optimizationGoal: parameters?.goal || 'profit'
          }
        );
        return NextResponse.json({
          success: true,
          message: 'Price optimization completed',
          storeId,
          result: pricingPrediction
        });

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error controlling agents:', error);
    return NextResponse.json(
      { error: 'Failed to control agents', details: error.message },
      { status: 500 }
    );
  }
}

export const GET = withRetailPermission(RETAIL_PERMISSIONS.read, handleGetAgentStatus);
export const POST = withRetailPermission(RETAIL_PERMISSIONS.ADMIN, handleAgentControl);