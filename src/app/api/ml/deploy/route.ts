import { NextRequest, NextResponse } from 'next/server';
import { DeploymentManager } from '@/lib/ai/ml-models/deployment/deployment-manager';
import { getServerSession } from '@/lib/auth/session';

const deploymentManager = new DeploymentManager();

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      modelId,
      version,
      environment = 'dev',
      preset,
      customConfig,
      autoScale = true,
      monitoring = true
    } = body;

    if (!modelId) {
      return NextResponse.json(
        { error: 'Model ID is required' },
        { status: 400 }
      );
    }

    // Deploy model
    const deploymentId = await deploymentManager.deployModel({
      modelId,
      version,
      environment,
      preset,
      customConfig,
      autoScale,
      monitoring
    });

    return NextResponse.json({
      success: true,
      deploymentId,
      message: 'Model deployment initiated'
    });

  } catch (error) {
    console.error('Model deployment error:', error);
    return NextResponse.json(
      { error: 'Failed to deploy model' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const deploymentId = searchParams.get('deploymentId');

    if (!deploymentId) {
      return NextResponse.json(
        { error: 'Deployment ID is required' },
        { status: 400 }
      );
    }

    // Get deployment status
    const status = await deploymentManager.getDeploymentStatus(deploymentId);

    if (!status) {
      return NextResponse.json(
        { error: 'Deployment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      deployment: status
    });

  } catch (error) {
    console.error('Get deployment status error:', error);
    return NextResponse.json(
      { error: 'Failed to get deployment status' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { deploymentId, action, params } = body;

    if (!deploymentId || !action) {
      return NextResponse.json(
        { error: 'Deployment ID and action are required' },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'scale':
        if (!params?.replicas) {
          return NextResponse.json(
            { error: 'Replicas parameter is required for scaling' },
            { status: 400 }
          );
        }
        await deploymentManager.scaleDeployment(deploymentId, params.replicas);
        result = { message: `Scaled to ${params.replicas} replicas` };
        break;

      case 'stop':
        await deploymentManager.stopDeployment(deploymentId);
        result = { message: 'Deployment stopped' };
        break;

      case 'promote':
        if (!params?.targetEnvironment) {
          return NextResponse.json(
            { error: 'Target environment is required for promotion' },
            { status: 400 }
          );
        }
        const newDeploymentId = await deploymentManager.promoteDeployment(
          deploymentId,
          params.targetEnvironment
        );
        result = { 
          message: `Promoted to ${params.targetEnvironment}`,
          newDeploymentId 
        };
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Deployment update error:', error);
    return NextResponse.json(
      { error: 'Failed to update deployment' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const deploymentId = searchParams.get('deploymentId');

    if (!deploymentId) {
      return NextResponse.json(
        { error: 'Deployment ID is required' },
        { status: 400 }
      );
    }

    // Stop deployment
    await deploymentManager.stopDeployment(deploymentId);

    return NextResponse.json({
      success: true,
      message: 'Deployment terminated'
    });

  } catch (error) {
    console.error('Delete deployment error:', error);
    return NextResponse.json(
      { error: 'Failed to delete deployment' },
      { status: 500 }
    );
  }
}