import { NextRequest, NextResponse } from 'next/server';
import { withRetailPermission } from '@/lib/auth/retail-middleware';
import { RETAIL_PERMISSIONS } from '@/lib/auth/retail-permissions';
import { retailDataCollector } from '@/lib/retail/data-collector';

// Protected GET handler - Get collection status
async function handleGetCollectionStatus(request: NextRequest, context: any) {
  try {
    const status = retailDataCollector.getCollectionStatus();
    
    // Test connections to external services
    const connections = await retailDataCollector.testConnections();

    return NextResponse.json({
      success: true,
      status,
      connections,
      user: context.user.email
    });
  } catch (error) {
    console.error('Error getting collection status:', error);
    return NextResponse.json(
      { error: 'Failed to get collection status', details: error.message },
      { status: 500 }
    );
  }
}

// Protected POST handler - Control data collection
async function handleCollectionControl(request: NextRequest, context: any) {
  try {
    const body = await request.json();
    const { action, storeId, startDate, endDate, intervalMinutes } = body;

    console.log(`Collection action ${action} requested by ${context.user.email}`);

    switch (action) {
      case 'start':
        retailDataCollector.startAutomaticCollection(intervalMinutes || 20);
        return NextResponse.json({
          success: true,
          message: 'Automatic data collection started',
          intervalMinutes: intervalMinutes || 20
        });

      case 'stop':
        retailDataCollector.stopAutomaticCollection();
        return NextResponse.json({
          success: true,
          message: 'Automatic data collection stopped'
        });

      case 'collect_now':
        const results = await retailDataCollector.collectAllStoresData();
        return NextResponse.json({
          success: true,
          message: 'Manual collection completed',
          results
        });

      case 'collect_historical':
        if (!storeId || !startDate || !endDate) {
          return NextResponse.json(
            { error: 'Missing required parameters: storeId, startDate, endDate' },
            { status: 400 }
          );
        }

        const historicalResult = await retailDataCollector.collectHistoricalData(
          storeId,
          new Date(startDate),
          new Date(endDate)
        );

        return NextResponse.json({
          success: true,
          message: 'Historical data collection completed',
          result: historicalResult
        });

      case 'collect_store':
        if (!storeId) {
          return NextResponse.json(
            { error: 'Missing required parameter: storeId' },
            { status: 400 }
          );
        }

        // Get store config and collect data
        const storeConfigs = retailDataCollector.getCollectionStatus().stores;
        const storeConfig = storeConfigs.find(s => s.storeId === storeId);
        
        if (!storeConfig) {
          return NextResponse.json(
            { error: `Store configuration not found: ${storeId}` },
            { status: 404 }
          );
        }

        // Collect for the last hour
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        
        const storeResult = await retailDataCollector.collectHistoricalData(
          storeId,
          oneHourAgo,
          now
        );

        return NextResponse.json({
          success: true,
          message: `Data collection completed for ${storeId}`,
          result: storeResult
        });

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error controlling data collection:', error);
    return NextResponse.json(
      { error: 'Failed to control data collection', details: error.message },
      { status: 500 }
    );
  }
}

export const GET = withRetailPermission(RETAIL_PERMISSIONS.READ, handleGetCollectionStatus);
export const POST = withRetailPermission(RETAIL_PERMISSIONS.ADMIN, handleCollectionControl);