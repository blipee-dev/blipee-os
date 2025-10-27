#!/usr/bin/env tsx

/**
 * AI Prompt Optimization CLI
 *
 * Automated ML-based prompt optimization cycle:
 * 1. Analyze conversation patterns
 * 2. Generate improved prompt variants
 * 3. Create A/B test experiments
 * 4. Monitor and promote winners
 *
 * Usage:
 *   npm run optimize-prompts -- analyze
 *   npm run optimize-prompts -- generate
 *   npm run optimize-prompts -- experiment --duration 7
 *   npm run optimize-prompts -- auto
 */

import { createClient } from '@supabase/supabase-js';
import {
  analyzeConversationPatterns,
  savePatternInsights,
} from '../src/lib/ai/analytics/pattern-analyzer';
import {
  generateABTestVariants,
  savePromptVariant,
  getAllPromptVersions,
} from '../src/lib/ai/analytics/prompt-variant-generator';
import {
  setupQuickExperiment,
  getActiveExperiments,
  getExperimentResults,
  completeExperiment,
} from '../src/lib/ai/analytics/ab-testing';
import { BASE_SYSTEM_PROMPT } from '../src/lib/ai/agents/sustainability-agent';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const ADMIN_USER_ID = process.env.ADMIN_USER_ID || '00000000-0000-0000-0000-000000000000';

async function analyzePatterns(days: number = 7) {
  console.log(`\n🔍 Analyzing conversation patterns from the last ${days} days...\n`);

  const analysis = await analyzeConversationPatterns(days);

  console.log('📊 Overall Metrics:');
  console.log(`  Total Conversations: ${analysis.overallMetrics.totalConversations}`);
  console.log(`  Average Rating: ${analysis.overallMetrics.avgRating.toFixed(2)} / 5`);
  console.log(`  Tool Success Rate: ${analysis.overallMetrics.toolSuccessRate.toFixed(1)}%`);
  console.log(`  Clarification Rate: ${analysis.overallMetrics.clarificationRate.toFixed(1)}%`);
  console.log(`  Avg Response Time: ${Math.round(analysis.overallMetrics.avgResponseTime)}ms`);

  if (analysis.patterns.length === 0) {
    console.log('\n✅ No significant patterns detected. System is performing well!');
    return;
  }

  console.log(`\n🎯 Identified ${analysis.patterns.length} patterns:\n`);

  for (const pattern of analysis.patterns) {
    console.log(`  ${pattern.type.toUpperCase()}`);
    console.log(`  Description: ${pattern.description}`);
    console.log(`  Frequency: ${pattern.frequency} occurrences`);
    console.log(`  Confidence: ${pattern.confidenceScore}%`);
    console.log(`  Suggestions: ${pattern.suggestedImprovements}`);
    console.log(`  Example queries:`);
    pattern.exampleQueries.slice(0, 3).forEach((q) => {
      console.log(`    - "${q}"`);
    });
    console.log('');
  }

  console.log('💡 Recommendations:');
  analysis.recommendations.forEach((rec) => {
    console.log(`  - ${rec}`);
  });

  // Save to database
  console.log('\n💾 Saving pattern insights to database...');
  await savePatternInsights(analysis.patterns);
  console.log('✅ Pattern insights saved!');
}

async function generateVariants(strategy: 'conservative' | 'moderate' | 'aggressive' = 'moderate') {
  console.log(`\n🤖 Generating prompt variants (${strategy} strategy)...\n`);

  // Get current base prompt
  const basePrompt = BASE_SYSTEM_PROMPT;

  // Get top patterns
  const { data: patterns } = await supabase
    .from('ai_pattern_insights')
    .select('*')
    .eq('is_actionable', true)
    .eq('is_resolved', false)
    .order('frequency', { ascending: false })
    .limit(5);

  if (!patterns || patterns.length === 0) {
    console.log('❌ No actionable patterns found. Run analysis first.');
    return;
  }

  console.log(`📋 Using ${patterns.length} patterns for variant generation:`);
  patterns.forEach((p) => {
    console.log(`  - ${p.pattern_type} (${p.frequency} occurrences)`);
  });

  const variants = await generateABTestVariants(
    basePrompt,
    patterns.map((p) => ({
      type: p.pattern_type,
      description: p.pattern_description,
      exampleQueries: p.example_queries,
      frequency: p.frequency,
      suggestedImprovements: p.suggested_prompt_improvements,
      confidenceScore: p.confidence_score,
    }))
  );

  console.log(`\n✨ Generated ${variants.length} variants:\n`);

  const savedIds = [];
  for (const variant of variants) {
    console.log(`  ${variant.versionName}`);
    console.log(`  Description: ${variant.description}`);
    console.log(`  Changes:`);
    variant.changes.forEach((change) => {
      console.log(`    - ${change}`);
    });
    console.log('');

    const id = await savePromptVariant(variant);
    if (id) {
      savedIds.push(id);
      console.log(`  ✅ Saved with ID: ${id}\n`);
    }
  }

  console.log(`🎉 Successfully generated and saved ${savedIds.length} variants!`);
}

async function createExperiment(durationDays: number = 7) {
  console.log(`\n🧪 Creating A/B test experiment (${durationDays} days)...\n`);

  // Get latest variants
  const { data: versions } = await supabase
    .from('ai_prompt_versions')
    .select('*')
    .eq('is_active', false)
    .order('created_at', { ascending: false })
    .limit(3);

  if (!versions || versions.length < 2) {
    console.log('❌ Need at least 2 prompt versions. Generate variants first.');
    return;
  }

  console.log(`📝 Using ${versions.length} prompt versions:`);
  versions.forEach((v) => {
    console.log(`  - ${v.version_name}: ${v.description}`);
  });

  const experimentId = await setupQuickExperiment(
    `Auto-generated experiment ${new Date().toISOString().split('T')[0]}`,
    versions.map((v) => v.id),
    durationDays,
    ADMIN_USER_ID
  );

  if (!experimentId) {
    console.log('\n❌ Failed to create experiment');
    return;
  }

  // Start the experiment
  await supabase
    .from('ai_ab_experiments')
    .update({ status: 'running' })
    .eq('id', experimentId);

  console.log(`\n✅ Experiment created and started!`);
  console.log(`   Experiment ID: ${experimentId}`);
  console.log(`   Duration: ${durationDays} days`);
  console.log(`   Traffic split: Equal distribution across ${versions.length} variants`);
}

async function monitorExperiments() {
  console.log('\n📈 Monitoring active experiments...\n');

  const experiments = await getActiveExperiments();

  if (experiments.length === 0) {
    console.log('ℹ️  No active experiments running.');
    return;
  }

  for (const exp of experiments) {
    console.log(`\n${exp.name}`);
    console.log(`  Status: ${exp.status}`);
    console.log(`  Started: ${new Date(exp.start_date).toLocaleDateString()}`);

    const results = await getExperimentResults(exp.id);

    if (!results) continue;

    console.log(`  Total Conversations: ${results.totalConversations}`);
    console.log('\n  Variant Performance:');

    results.variants.forEach((variant) => {
      console.log(`\n    Variant ${variant.variantId}:`);
      console.log(`      Conversations: ${variant.conversationCount}`);
      console.log(`      Avg Rating: ${variant.avgRating.toFixed(2)} / 5`);
      console.log(`      Helpful: ${variant.helpfulPercentage.toFixed(1)}%`);
      console.log(`      Tool Success: ${variant.toolSuccessRate.toFixed(1)}%`);
      console.log(`      Error Rate: ${variant.errorRate.toFixed(1)}%`);
    });

    if (results.winnerVariantId) {
      console.log(`\n  🏆 Winner: ${results.winnerVariantId}`);
      console.log(`  Confidence: ${results.confidenceLevel}%`);

      // Auto-complete if confidence > 90%
      if ((results.confidenceLevel || 0) > 90 && results.totalConversations > 100) {
        console.log('\n  🎯 High confidence winner detected! Completing experiment...');
        await completeExperiment(exp.id, true);
        console.log('  ✅ Experiment completed and winner promoted!');
      }
    }
  }
}

async function runFullCycle() {
  console.log('\n🚀 Running full optimization cycle...\n');
  console.log('================================================');

  // Step 1: Analyze patterns
  await analyzePatterns(7);

  console.log('\n================================================');

  // Step 2: Generate variants
  await generateVariants('moderate');

  console.log('\n================================================');

  // Step 3: Create experiment
  await createExperiment(7);

  console.log('\n================================================');

  // Step 4: Monitor experiments
  await monitorExperiments();

  console.log('\n================================================');
  console.log('\n✅ Full optimization cycle complete!');
  console.log('\n📅 Next steps:');
  console.log('  1. Wait for experiment to gather data (7 days)');
  console.log('  2. Run `npm run optimize-prompts -- monitor` to check progress');
  console.log('  3. Winning variant will be automatically promoted when confidence > 90%');
}

// CLI argument parsing
const args = process.argv.slice(2);
const command = args[0];

async function main() {
  switch (command) {
    case 'analyze': {
      const days = parseInt(args[1]) || 7;
      await analyzePatterns(days);
      break;
    }

    case 'generate': {
      const strategy = (args[1] as any) || 'moderate';
      await generateVariants(strategy);
      break;
    }

    case 'experiment': {
      const duration = parseInt(args[1]) || 7;
      await createExperiment(duration);
      break;
    }

    case 'monitor': {
      await monitorExperiments();
      break;
    }

    case 'auto':
    case 'full': {
      await runFullCycle();
      break;
    }

    default: {
      console.log(`
AI Prompt Optimization CLI

Usage:
  npm run optimize-prompts -- <command> [options]

Commands:
  analyze [days]           Analyze conversation patterns (default: 7 days)
  generate [strategy]      Generate prompt variants (conservative|moderate|aggressive)
  experiment [days]        Create A/B test experiment (default: 7 days)
  monitor                  Monitor active experiments
  auto                     Run full optimization cycle

Examples:
  npm run optimize-prompts -- analyze 14
  npm run optimize-prompts -- generate aggressive
  npm run optimize-prompts -- experiment 7
  npm run optimize-prompts -- monitor
  npm run optimize-prompts -- auto
      `);
      break;
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
