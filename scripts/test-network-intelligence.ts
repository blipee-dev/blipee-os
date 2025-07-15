/**
 * Test Network Intelligence Implementation
 * Verifies Stream D functionality
 */

import { NetworkIntelligenceService } from '../src/lib/ai/network-intelligence';
import { createBrowserClient } from '../src/lib/supabase/client';

// Mock Supabase for testing without database
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-key';
process.env.SUPABASE_SERVICE_KEY = 'mock-service-key';

async function testNetworkIntelligence() {
  console.log('🌐 Testing Network Intelligence Implementation...');
  console.log('='.repeat(50));

  const networkService = new NetworkIntelligenceService();
  const supabase = createBrowserClient();

  // Test organization ID (you'll need to replace with a real one)
  const testOrgId = 'test-org-123';

  try {
    // 1. Test Network Graph Building
    console.log('\n1️⃣ Testing Network Graph Building...');
    const networkGraph = await networkService.buildNetworkGraph(testOrgId);
    console.log('✅ Network Graph:', {
      nodes: networkGraph.nodes.length,
      edges: networkGraph.edges.length,
      metrics: networkGraph.metadata,
    });

    // 2. Test Network Analysis
    console.log('\n2️⃣ Testing Network Analysis...');
    const insights = await networkService.analyzeNetwork(testOrgId);
    console.log('✅ Network Insights:', {
      totalInsights: insights.length,
      riskInsights: insights.filter(i => i.type === 'risk').length,
      opportunities: insights.filter(i => i.type === 'opportunity').length,
    });
    insights.slice(0, 3).forEach(insight => {
      console.log(`  - ${insight.severity} ${insight.type}: ${insight.title}`);
    });

    // 3. Test Peer Benchmarking
    console.log('\n3️⃣ Testing Peer Benchmarking...');
    const benchmarks = await networkService.getPeerBenchmarks(testOrgId);
    if (benchmarks) {
      console.log('✅ Benchmark Report:', {
        peerGroup: benchmarks.peerGroup,
        comparisons: benchmarks.comparisons.length,
        overallScore: benchmarks.overallScore,
        rank: benchmarks.rank,
      });
    } else {
      console.log('⚠️ No benchmark data available');
    }

    // 4. Test Supplier Discovery
    console.log('\n4️⃣ Testing Supplier Discovery...');
    const suppliers = await networkService.discoverSuppliers(testOrgId, {
      products: ['renewable energy'],
      minEsgScore: 70,
    });
    console.log('✅ Discovered Suppliers:', {
      totalFound: suppliers.length,
      topMatch: suppliers[0]?.supplier.name,
      matchScore: suppliers[0]?.matchScore,
    });

    // 5. Test Data Marketplace
    console.log('\n5️⃣ Testing Data Marketplace...');
    const marketplaceStats = await networkService.getMarketplaceStats();
    console.log('✅ Marketplace Stats:', marketplaceStats);

    // 6. Test Collective Intelligence
    console.log('\n6️⃣ Testing Collective Intelligence...');
    const collective = await networkService.getCollectiveInsights('emissions', 'technology');
    console.log('✅ Collective Intelligence:', {
      trends: collective.trends.length,
      bestPractices: collective.bestPractices.length,
      risks: collective.emergingRisks.length,
    });
    collective.trends.slice(0, 2).forEach(trend => {
      console.log(`  - Trend: ${trend.description} (${trend.impact}% impact)`);
    });

    // 7. Test Privacy Layer
    console.log('\n7️⃣ Testing Privacy Layer...');
    const testMetrics = {
      emissions: 12500.5,
      energyConsumption: 45000,
      waterUsage: 15000,
      wasteGenerated: 250,
      supplierCount: 45,
      employeeCount: 523,
    };
    const privacyLayer = new (await import('../src/lib/ai/network-intelligence/privacy/privacy-layer')).PrivacyLayer();
    const anonymized = await privacyLayer.anonymizeESGMetrics(testMetrics);
    console.log('✅ Privacy Applied:', {
      original: testMetrics.emissions,
      anonymized: anonymized.data.emissions,
      guarantees: anonymized.privacyGuarantees,
    });

    // 8. Test Network Health Monitoring
    console.log('\n8️⃣ Testing Network Health Monitoring...');
    const health = await networkService.monitorNetworkHealth(testOrgId);
    console.log('✅ Network Health:', {
      score: health.healthScore,
      alerts: health.alerts.length,
      recommendations: health.recommendations.length,
    });

    console.log('\n' + '='.repeat(50));
    console.log('✅ All Network Intelligence tests completed successfully!');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests if called directly
if (require.main === module) {
  testNetworkIntelligence()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Test error:', error);
      process.exit(1);
    });
}

export { testNetworkIntelligence };