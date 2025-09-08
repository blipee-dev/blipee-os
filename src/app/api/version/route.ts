/**
 * API Version Discovery Endpoint
 * GET /api/version - Returns information about all available API versions
 */

import { NextRequest } from 'next/server';
import { handleVersionDiscovery } from '@/middleware/api-versioning';

export async function GET(request: NextRequest) {
  return handleVersionDiscovery();
}