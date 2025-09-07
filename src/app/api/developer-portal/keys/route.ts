/**
 * Developer Portal API Keys Management
 * GET /api/developer-portal/keys - Get developer's API keys
 * POST /api/developer-portal/keys - Create new API key
 */

import { NextRequest, NextResponse } from 'next/server';
import { developerPortalManager } from '@/lib/developer-portal/portal-manager';
import { withAPIVersioning } from '@/middleware/api-versioning';

export const GET = withAPIVersioning(async (req: NextRequest, context) => {
  try {
    // In real implementation, get developer ID from JWT token
    const developerId = req.headers.get('x-developer-id') || 'dev-example';
    
    const apiKeys = developerPortalManager.getDeveloperAPIKeys(developerId);
    const usageAnalytics = developerPortalManager.getUsageAnalytics(developerId);

    // Don't return full keys, only prefixes
    const safeKeys = apiKeys.map(key => ({
      ...key,
      key: undefined, // Remove full key
      prefix: key.prefix + '...'
    }));

    return NextResponse.json({
      apiKeys: safeKeys,
      analytics: usageAnalytics,
      limits: {
        maxKeys: 10,
        current: apiKeys.length
      }
    });
  } catch (error) {
    console.error('API Keys Error:', error);
    return NextResponse.json(
      {
        error: 'API_KEYS_ERROR',
        message: 'Failed to fetch API keys',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
});

export const POST = withAPIVersioning(async (req: NextRequest, context) => {
  try {
    const developerId = req.headers.get('x-developer-id') || 'dev-example';
    const body = await req.json();

    const { name, description, environment, permissions } = body;

    if (!name || !environment) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'Name and environment are required',
          fields: {
            name: !name ? 'Name is required' : null,
            environment: !environment ? 'Environment is required' : null
          }
        },
        { status: 400 }
      );
    }

    // Check if developer exists
    const developer = developerPortalManager.getDeveloper(developerId);
    if (!developer) {
      return NextResponse.json(
        {
          error: 'DEVELOPER_NOT_FOUND',
          message: 'Developer account not found'
        },
        { status: 404 }
      );
    }

    // Check key limits
    const existingKeys = developerPortalManager.getDeveloperAPIKeys(developerId);
    if (existingKeys.length >= 10) {
      return NextResponse.json(
        {
          error: 'KEY_LIMIT_EXCEEDED',
          message: 'Maximum number of API keys reached (10)',
          current: existingKeys.length,
          limit: 10
        },
        { status: 429 }
      );
    }

    const apiKey = await developerPortalManager.generateAPIKey(developerId, {
      name,
      description,
      environment,
      permissions
    });

    return NextResponse.json({
      apiKey: {
        ...apiKey,
        key: apiKey.key // Return full key only once during creation
      },
      warning: 'Store this key securely. It will not be shown again.',
      nextSteps: [
        'Add the key to your application configuration',
        'Test the key with a simple API call',
        'Review the rate limits for your tier',
        'Set up monitoring for usage tracking'
      ]
    }, { status: 201 });
  } catch (error) {
    console.error('Create API Key Error:', error);
    return NextResponse.json(
      {
        error: 'CREATE_KEY_ERROR',
        message: 'Failed to create API key',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
});