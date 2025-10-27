/**
 * AI Analytics - Prompt Variants API
 *
 * GET: Retrieve prompt versions
 * POST: Generate new prompt variants
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireServerAuth } from '@/lib/auth/server-auth';
import {
  generatePromptVariants,
  generateABTestVariants,
  savePromptVariant,
  getAllPromptVersions,
  getActivePromptVersion,
  setActivePromptVersion,
  type VariantGenerationConfig,
} from '@/lib/ai/analytics/prompt-variant-generator';
import { getTopActionablePatterns } from '@/lib/ai/analytics/pattern-analyzer';

export async function GET(request: NextRequest) {
  try {
    const user = await requireServerAuth();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const getActive = searchParams.get('active') === 'true';

    if (getActive) {
      const activePrompt = await getActivePromptVersion();
      return NextResponse.json({ promptText: activePrompt });
    } else {
      const versions = await getAllPromptVersions();
      return NextResponse.json({
        versions,
        count: versions.length,
      });
    }
  } catch (error) {
    console.error('[AI Analytics API] Error fetching variants:', error);
    return NextResponse.json(
      { error: 'Failed to fetch variants' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireServerAuth();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'generate': {
        // Generate variants based on patterns
        const patterns = await getTopActionablePatterns(5);

        if (patterns.length === 0) {
          return NextResponse.json(
            { error: 'No actionable patterns found. Need more conversation data.' },
            { status: 400 }
          );
        }

        const config: VariantGenerationConfig = {
          basePrompt: data.basePrompt,
          patterns: patterns.map((p) => ({
            type: p.pattern_type as any,
            description: p.pattern_description,
            exampleQueries: p.example_queries,
            frequency: p.frequency,
            suggestedImprovements: p.suggested_prompt_improvements,
            confidenceScore: p.confidence_score,
          })),
          improvementStrategy: data.strategy || 'moderate',
          variantCount: data.count || 1,
        };

        const variants = await generatePromptVariants(config);

        // Save variants to database
        const savedIds = [];
        for (const variant of variants) {
          const id = await savePromptVariant(variant);
          if (id) {
            savedIds.push(id);
          }
        }

        return NextResponse.json({
          success: true,
          variants: variants.map((v, i) => ({
            ...v,
            id: savedIds[i],
          })),
        });
      }

      case 'generate_ab_variants': {
        // Generate variants for A/B testing
        const patterns = await getTopActionablePatterns(5);

        if (patterns.length === 0) {
          return NextResponse.json(
            { error: 'No actionable patterns found. Need more conversation data.' },
            { status: 400 }
          );
        }

        const variants = await generateABTestVariants(
          data.basePrompt,
          patterns.map((p) => ({
            type: p.pattern_type as any,
            description: p.pattern_description,
            exampleQueries: p.example_queries,
            frequency: p.frequency,
            suggestedImprovements: p.suggested_prompt_improvements,
            confidenceScore: p.confidence_score,
          }))
        );

        // Save all variants
        const savedIds = [];
        for (const variant of variants) {
          const id = await savePromptVariant(variant);
          if (id) {
            savedIds.push(id);
          }
        }

        return NextResponse.json({
          success: true,
          variants: variants.map((v, i) => ({
            ...v,
            id: savedIds[i],
          })),
        });
      }

      case 'set_active': {
        const success = await setActivePromptVersion(data.versionId);
        return NextResponse.json({ success });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[AI Analytics API] Error managing variants:', error);
    return NextResponse.json(
      { error: 'Failed to manage variants' },
      { status: 500 }
    );
  }
}
