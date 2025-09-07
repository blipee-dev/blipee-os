/**
 * Developer Portal Tutorials API
 * GET /api/developer-portal/tutorials - Get tutorials and guides
 */

import { NextRequest, NextResponse } from 'next/server';
import { developerPortalManager } from '@/lib/developer-portal/portal-manager';
import { withAPIVersioning } from '@/middleware/api-versioning';

export const GET = withAPIVersioning(async (req: NextRequest, context) => {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || undefined;
    const difficulty = searchParams.get('difficulty') || undefined;

    const tutorials = developerPortalManager.getTutorials(category, difficulty);
    
    // Get categories and difficulties for filtering
    const allTutorials = developerPortalManager.getTutorials();
    const categories = [...new Set(allTutorials.map(t => t.category))];
    const difficulties = [...new Set(allTutorials.map(t => t.difficulty))];

    return NextResponse.json({
      tutorials,
      categories,
      difficulties,
      featured: tutorials.filter(t => t.rating >= 4.5).slice(0, 3),
      meta: {
        total: tutorials.length,
        avgCompletionRate: Math.round(
          tutorials.reduce((sum, t) => sum + t.completionRate, 0) / tutorials.length
        )
      }
    });
  } catch (error) {
    console.error('Developer Portal Tutorials Error:', error);
    return NextResponse.json(
      {
        error: 'TUTORIALS_ERROR',
        message: 'Failed to fetch tutorials',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
});