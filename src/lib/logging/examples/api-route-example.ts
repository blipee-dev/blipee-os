/**
 * Example: Using Structured Logging in API Routes
 * Phase 4, Task 4.1: Example implementation
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logging';
import { withLogging } from '@/lib/logging/http-logger';
import { performanceLogger } from '@/lib/logging/performance-logger';

/**
 * Example API route with structured logging
 */
export const GET = withLogging(async (request: NextRequest) => {
  // Create a child logger with request context
  const apiLogger = logger.child({
    endpoint: '/api/example',
    method: 'GET'
  });

  try {
    // Log the start of the operation
    apiLogger.info('Processing API request', {
      query: Object.fromEntries(request.nextUrl.searchParams)
    });

    // Measure performance
    const endMeasure = performanceLogger.startMeasure('api_example_get');

    // Simulate some work
    const data = await fetchData();

    // End performance measurement
    const metrics = endMeasure();

    // Log successful completion
    apiLogger.info('API request completed successfully', {
      itemCount: data.length,
      duration: metrics.duration
    });

    return NextResponse.json({
      success: true,
      data,
      meta: {
        count: data.length,
        processingTime: metrics.duration
      }
    });

  } catch (error) {
    // Log the error with full context
    apiLogger.error('API request failed', error as Error, {
      errorType: (error as Error).name,
      errorCode: (error as any).code
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

/**
 * Example POST route with validation logging
 */
export const POST = withLogging(async (request: NextRequest) => {
  const apiLogger = logger.child({
    endpoint: '/api/example',
    method: 'POST'
  });

  try {
    const body = await request.json();

    // Log validation attempts
    apiLogger.debug('Validating request body', {
      fields: Object.keys(body)
    });

    // Validate input
    if (!body.name || !body.email) {
      apiLogger.warn('Validation failed', {
        missingFields: [
          !body.name && 'name',
          !body.email && 'email'
        ].filter(Boolean)
      });

      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Log business logic execution
    apiLogger.info('Creating new resource', {
      resourceType: 'example',
      userName: body.name
    });

    const result = await createResource(body);

    apiLogger.info('Resource created successfully', {
      resourceId: result.id,
      resourceType: 'example'
    });

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    apiLogger.error('Failed to create resource', error as Error);
    
    return NextResponse.json(
      { error: 'Failed to create resource' },
      { status: 500 }
    );
  }
});

// Helper functions
async function fetchData() {
  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 100));
  return [
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' }
  ];
}

async function createResource(data: any) {
  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 200));
  return {
    id: Math.random().toString(36).substr(2, 9),
    ...data,
    createdAt: new Date().toISOString()
  };
}