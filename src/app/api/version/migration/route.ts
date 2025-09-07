/**
 * API Version Migration Endpoint
 * GET /api/version/migration?from=2024-06-01&to=2024-09-01
 * Returns migration guide between API versions
 */

import { NextRequest } from 'next/server';
import { handleVersionMigration } from '@/middleware/api-versioning';

export async function GET(request: NextRequest) {
  return handleVersionMigration(request);
}