import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { migrationManager } from '@/lib/database/migration';
import { logger } from '@/lib/logger';

/**
 * @swagger
 * /api/migrations:
 *   get:
 *     summary: Get migration status
 *     description: Retrieve current migration status including applied and pending migrations
 *     tags:
 *       - Migrations
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Migration status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 applied:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       version:
 *                         type: number
 *                       applied_at:
 *                         type: string
 *                         format: date-time
 *                       status:
 *                         type: string
 *                 pending:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       version:
 *                         type: number
 *                 validation:
 *                   type: object
 *                   properties:
 *                     valid:
 *                       type: boolean
 *                     issues:
 *                       type: array
 *                       items:
 *                         type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires admin role
 */
export async function GET() {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { _error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if user is admin
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .single();
    
    if (!member || member.role !== 'account_owner') {
      return NextResponse.json(
        { _error: 'Forbidden - admin access required' },
        { status: 403 }
      );
    }
    
    // Get migration status
    const status = await migrationManager.exportStatus();
    
    return NextResponse.json(status);
    
  } catch (error) {
    logger.error('Error getting migration status', error);
    return NextResponse.json(
      { _error: 'Failed to get migration status' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/migrations:
 *   post:
 *     summary: Run migrations
 *     description: Run all pending database migrations
 *     tags:
 *       - Migrations
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [run, validate]
 *                 description: Action to perform
 *     responses:
 *       200:
 *         description: Migration action completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 count:
 *                   type: number
 *                   description: Number of migrations run (for run action)
 *                 valid:
 *                   type: boolean
 *                   description: Validation result (for validate action)
 *                 issues:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: Validation issues (for validate action)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires admin role
 */
export async function POST(_request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { _error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if user is admin
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .single();
    
    if (!member || member.role !== 'account_owner') {
      return NextResponse.json(
        { _error: 'Forbidden - admin access required' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const { action } = body;
    
    switch (action) {
      case 'run': {
        const count = await migrationManager.runPendingMigrations();
        return NextResponse.json({
          message: `Completed ${count} migrations`,
          count
        });
      }
      
      case 'validate': {
        const result = await migrationManager.validateMigrations();
        return NextResponse.json({
          message: result.valid ? 'All migrations are valid' : 'Validation failed',
          valid: result.valid,
          issues: result.issues
        });
      }
      
      default:
        return NextResponse.json(
          { _error: 'Invalid action. Use "run" or "validate"' },
          { status: 400 }
        );
    }
    
  } catch (error) {
    logger.error('Error performing migration action', error);
    return NextResponse.json(
      { _error: 'Failed to perform migration action' },
      { status: 500 }
    );
  }
}