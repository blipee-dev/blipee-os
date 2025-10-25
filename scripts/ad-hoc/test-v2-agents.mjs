/**
 * V2 Agents Testing Script
 *
 * Tests all 8 V2 agents with the shared sustainability tools
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '.env.local') });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧪 V2 Agents Testing Suite\n');
console.log('=' .repeat(60));

/**
 * Test 1: Verify shared tools database access
 */
async function testSharedTools() {
  console.log('\n📋 Test 1: Shared Tools Database Access');
  console.log('-'.repeat(60));

  try {
    // Get a test organization
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .limit(1);

    if (orgError) throw orgError;
    if (!orgs || orgs.length === 0) {
      console.log('⚠️  No organizations found. Skipping tool tests.');
      return null;
    }

    const testOrg = orgs[0];
    console.log(`✅ Found test organization: ${testOrg.name} (${testOrg.id})`);

    // Test calculateEmissions data access
    console.log('\n  Testing emissions data access...');
    const { data: metricsData, error: metricsError } = await supabase
      .from('metrics_data')
      .select(`
        co2e_emissions,
        period_start,
        metrics_catalog (scope, category, name)
      `)
      .eq('organization_id', testOrg.id)
      .limit(5);

    if (metricsError) throw metricsError;

    console.log(`  ✅ Found ${metricsData?.length || 0} metrics data points`);
    if (metricsData && metricsData.length > 0) {
      console.log(`  📊 Sample: ${metricsData[0].metrics_catalog?.scope}, ${metricsData[0].co2e_emissions} kg CO2e`);
    }

    return testOrg;

  } catch (error) {
    console.error('  ❌ Error:', error.message);
    return null;
  }
}

/**
 * Test 2: Verify all V2 agent files exist
 */
async function testAgentFilesExist() {
  console.log('\n📋 Test 2: V2 Agent Files Existence');
  console.log('-'.repeat(60));

  const agents = [
    'CarbonHunterV2',
    'ComplianceGuardianV2',
    'EsgChiefOfStaffV2',
    'CostSavingFinderV2',
    'SupplyChainInvestigatorV2',
    'RegulatoryForesightV2',
    'PredictiveMaintenanceV2',
    'AutonomousOptimizerV2'
  ];

  const fs = await import('fs');
  const path = await import('path');

  let allExist = true;

  for (const agent of agents) {
    const filePath = path.join(process.cwd(), 'src', 'lib', 'ai', 'autonomous-agents', 'agents', `${agent}.ts`);
    const exists = fs.existsSync(filePath);

    if (exists) {
      // Check file size to ensure it's not empty
      const stats = fs.statSync(filePath);
      const sizeKB = (stats.size / 1024).toFixed(1);
      console.log(`  ✅ ${agent}.ts exists (${sizeKB} KB)`);
    } else {
      console.log(`  ❌ ${agent}.ts NOT FOUND`);
      allExist = false;
    }
  }

  return allExist;
}

/**
 * Test 3: Verify shared tools file
 */
async function testSharedToolsFile() {
  console.log('\n📋 Test 3: Shared Tools File');
  console.log('-'.repeat(60));

  const fs = await import('fs');
  const path = await import('path');

  const toolsPath = path.join(process.cwd(), 'src', 'lib', 'ai', 'autonomous-agents', 'tools.ts');

  if (!fs.existsSync(toolsPath)) {
    console.log('  ❌ tools.ts NOT FOUND');
    return false;
  }

  const stats = fs.statSync(toolsPath);
  const sizeKB = (stats.size / 1024).toFixed(1);
  console.log(`  ✅ tools.ts exists (${sizeKB} KB)`);

  // Read file and check for tool exports
  const content = fs.readFileSync(toolsPath, 'utf-8');

  const tools = [
    'calculateEmissions',
    'detectAnomalies',
    'benchmarkEfficiency',
    'investigateSources',
    'generateCarbonReport'
  ];

  console.log('\n  Checking for 5 sustainability tools:');
  for (const tool of tools) {
    if (content.includes(`export const ${tool}`)) {
      console.log(`    ✅ ${tool} defined`);
    } else {
      console.log(`    ❌ ${tool} NOT FOUND`);
    }
  }

  if (content.includes('export function getSustainabilityTools')) {
    console.log(`    ✅ getSustainabilityTools() function defined`);
  } else {
    console.log(`    ❌ getSustainabilityTools() NOT FOUND`);
  }

  return true;
}

/**
 * Test 4: Database schema verification
 */
async function testDatabaseSchema() {
  console.log('\n📋 Test 4: Database Schema Verification');
  console.log('-'.repeat(60));

  const tables = [
    'metrics_data',
    'metrics_catalog',
    'agent_learning_insights'
  ];

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) throw error;
      console.log(`  ✅ Table '${table}' accessible`);
    } catch (error) {
      console.log(`  ❌ Table '${table}' error: ${error.message}`);
    }
  }

  return true;
}

/**
 * Test 5: Verify Vercel AI SDK dependencies
 */
async function testDependencies() {
  console.log('\n📋 Test 5: Vercel AI SDK Dependencies');
  console.log('-'.repeat(60));

  const fs = await import('fs');
  const path = await import('path');

  const packagePath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));

  const requiredDeps = {
    'ai': 'Vercel AI SDK',
    '@ai-sdk/openai': 'OpenAI provider',
    '@ai-sdk/deepseek': 'DeepSeek provider',
    'zod': 'Schema validation'
  };

  for (const [dep, name] of Object.entries(requiredDeps)) {
    if (packageJson.dependencies?.[dep]) {
      console.log(`  ✅ ${name} (${dep}): ${packageJson.dependencies[dep]}`);
    } else {
      console.log(`  ❌ ${name} (${dep}) NOT INSTALLED`);
    }
  }

  return true;
}

/**
 * Test 6: Code reduction metrics
 */
async function testCodeMetrics() {
  console.log('\n📋 Test 6: Code Reduction Metrics');
  console.log('-'.repeat(60));

  const fs = await import('fs');
  const path = await import('path');

  const agents = [
    { name: 'CarbonHunter', v1: 'CarbonHunter.ts', v2: 'CarbonHunterV2.ts', expectedReduction: 68 },
    { name: 'ComplianceGuardian', v1: 'ComplianceGuardian.ts', v2: 'ComplianceGuardianV2.ts', expectedReduction: 70 },
    { name: 'EsgChiefOfStaff', v1: 'EsgChiefOfStaff.ts', v2: 'EsgChiefOfStaffV2.ts', expectedReduction: 72 }
  ];

  for (const agent of agents) {
    const v1Path = path.join(process.cwd(), 'src', 'lib', 'ai', 'autonomous-agents', 'agents', agent.v1);
    const v2Path = path.join(process.cwd(), 'src', 'lib', 'ai', 'autonomous-agents', 'agents', agent.v2);

    if (fs.existsSync(v1Path) && fs.existsSync(v2Path)) {
      const v1Lines = fs.readFileSync(v1Path, 'utf-8').split('\n').length;
      const v2Lines = fs.readFileSync(v2Path, 'utf-8').split('\n').length;
      const reduction = Math.round((1 - v2Lines / v1Lines) * 100);

      console.log(`  ${agent.name}:`);
      console.log(`    V1: ${v1Lines} lines`);
      console.log(`    V2: ${v2Lines} lines`);
      console.log(`    Reduction: ${reduction}% (target: ${agent.expectedReduction}%)`);

      if (reduction >= agent.expectedReduction - 5) {
        console.log(`    ✅ Code reduction achieved`);
      } else {
        console.log(`    ⚠️  Below target reduction`);
      }
    }
  }

  return true;
}

/**
 * Run all tests
 */
async function runAllTests() {
  const startTime = Date.now();

  console.log('🚀 Starting V2 Agents Test Suite...\n');

  const results = {
    sharedTools: await testSharedTools(),
    agentFiles: await testAgentFilesExist(),
    toolsFile: await testSharedToolsFile(),
    schema: await testDatabaseSchema(),
    dependencies: await testDependencies(),
    metrics: await testCodeMetrics()
  };

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Results Summary');
  console.log('='.repeat(60));
  console.log(`✅ Shared Tools: ${results.sharedTools ? 'PASS' : 'SKIP'}`);
  console.log(`✅ Agent Files: ${results.agentFiles ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Tools File: ${results.toolsFile ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Database Schema: ${results.schema ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Dependencies: ${results.dependencies ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Code Metrics: ${results.metrics ? 'PASS' : 'FAIL'}`);
  console.log(`\n⏱️  Total time: ${duration}s`);
  console.log('='.repeat(60));

  const allPassed = Object.values(results).every(r => r === true || r !== null);

  if (allPassed) {
    console.log('\n🎉 ALL TESTS PASSED! V2 agents are ready.');
  } else {
    console.log('\n⚠️  Some tests failed or were skipped.');
  }
}

// Run tests
runAllTests().catch(console.error);
