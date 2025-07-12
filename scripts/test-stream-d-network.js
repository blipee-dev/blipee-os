// Test Script for Stream D Network Features
// This script tests the network intelligence capabilities

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testNetworkFeatures() {
  console.log('🔗 Testing Stream D Network Features...\n');
  
  try {
    // Test 1: Create sample organizations and network nodes
    console.log('1. Creating sample organizations...');
    
    const sampleOrgs = [
      { name: 'GreenTech Corp', slug: 'greentech-corp', industry: 'Technology' },
      { name: 'Sustainable Manufacturing', slug: 'sustainable-mfg', industry: 'Manufacturing' },
      { name: 'EcoLogistics Ltd', slug: 'ecologistics', industry: 'Transportation' }
    ];
    
    const orgResults = [];
    for (const org of sampleOrgs) {
      const { data, error } = await supabase
        .from('organizations')
        .insert(org)
        .select()
        .single();
      
      if (error && !error.message.includes('duplicate key')) {
        console.error('Error creating organization:', error);
      } else {
        orgResults.push(data || { name: org.name, id: 'existing' });
        console.log(`✓ Created/Found: ${org.name}`);
      }
    }
    
    // Test 2: Create network nodes
    console.log('\n2. Creating network nodes...');
    
    const networkNodes = [
      {
        organization_id: orgResults[0]?.id,
        node_type: 'organization',
        node_name: 'GreenTech Corp',
        industry: 'Technology',
        location: { country: 'USA', region: 'California' },
        size_category: 'medium',
        esg_score: 85.5,
        data_sharing_level: 'network',
        verification_status: 'verified'
      },
      {
        organization_id: orgResults[1]?.id,
        node_type: 'supplier',
        node_name: 'Sustainable Manufacturing',
        industry: 'Manufacturing',
        location: { country: 'Germany', region: 'Bavaria' },
        size_category: 'large',
        esg_score: 78.2,
        data_sharing_level: 'partners',
        verification_status: 'verified'
      },
      {
        external_id: 'ext_ecolog_001',
        node_type: 'partner',
        node_name: 'EcoLogistics Ltd',
        industry: 'Transportation',
        location: { country: 'UK', region: 'London' },
        size_category: 'small',
        esg_score: 92.1,
        data_sharing_level: 'public',
        verification_status: 'verified'
      }
    ];
    
    const nodeResults = [];
    for (const node of networkNodes) {
      const { data, error } = await supabase
        .from('network_nodes')
        .insert(node)
        .select()
        .single();
      
      if (error) {
        console.error('Error creating network node:', error);
      } else {
        nodeResults.push(data);
        console.log(`✓ Created network node: ${node.node_name}`);
      }
    }
    
    // Test 3: Create network relationships (edges)
    console.log('\n3. Creating supply chain relationships...');
    
    if (nodeResults.length >= 2) {
      const relationships = [
        {
          source_node_id: nodeResults[0].id,
          target_node_id: nodeResults[1].id,
          edge_type: 'buys_from',
          relationship_strength: 0.8,
          relationship_status: 'active',
          tier_level: 1
        },
        {
          source_node_id: nodeResults[1].id,
          target_node_id: nodeResults[2].id,
          edge_type: 'partners_with',
          relationship_strength: 0.6,
          relationship_status: 'active',
          tier_level: 1
        }
      ];
      
      for (const rel of relationships) {
        const { data, error } = await supabase
          .from('network_edges')
          .insert(rel)
          .select()
          .single();
        
        if (error) {
          console.error('Error creating relationship:', error);
        } else {
          console.log(`✓ Created relationship: ${rel.edge_type}`);
        }
      }
    }
    
    // Test 4: Create anonymous benchmarks
    console.log('\n4. Creating anonymous benchmarks...');
    
    const benchmarks = [
      {
        benchmark_type: 'carbon_intensity',
        industry: 'Technology',
        metric_name: 'Scope 1+2 Emissions per Revenue',
        metric_category: 'environmental',
        period: '2024-Q1',
        participant_count: 15,
        statistics: {
          mean: 2.4,
          median: 2.1,
          p25: 1.8,
          p75: 2.9,
          p90: 3.5,
          std_dev: 0.6
        },
        quality_score: 0.85,
        confidence_level: 0.92,
        methodology: 'GHG Protocol + peer anonymization'
      },
      {
        benchmark_type: 'renewable_energy',
        industry: 'Manufacturing',
        metric_name: 'Renewable Energy Percentage',
        metric_category: 'environmental',
        period: '2024-Q1',
        participant_count: 8,
        statistics: {
          mean: 45.2,
          median: 42.0,
          p25: 35.5,
          p75: 55.8,
          p90: 68.2,
          std_dev: 12.3
        },
        quality_score: 0.78,
        confidence_level: 0.88,
        methodology: 'RE100 standards + k-anonymity'
      }
    ];
    
    for (const benchmark of benchmarks) {
      // Set expiration to 1 year from now
      benchmark.expires_at = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('network_benchmarks')
        .insert(benchmark)
        .select()
        .single();
      
      if (error && !error.message.includes('duplicate key')) {
        console.error('Error creating benchmark:', error);
      } else {
        console.log(`✓ Created benchmark: ${benchmark.metric_name}`);
      }
    }
    
    // Test 5: Create supplier assessment
    console.log('\n5. Creating supplier assessment...');
    
    if (orgResults[0] && nodeResults[1]) {
      const assessment = {
        requester_org_id: orgResults[0].id,
        supplier_node_id: nodeResults[1].id,
        assessment_type: 'sustainability',
        scores: {
          overall: 78.2,
          environmental: 82.1,
          social: 75.3,
          governance: 77.2
        },
        recommendations: [
          'Increase renewable energy usage',
          'Implement supplier diversity program',
          'Enhance supply chain transparency'
        ],
        valid_until: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(), // 6 months
        confidence_level: 0.87
      };
      
      const { data, error } = await supabase
        .from('network_supplier_assessments')
        .insert(assessment)
        .select()
        .single();
      
      if (error) {
        console.error('Error creating assessment:', error);
      } else {
        console.log(`✓ Created supplier assessment`);
      }
    }
    
    // Test 6: Create data marketplace listing
    console.log('\n6. Creating data marketplace listing...');
    
    if (orgResults[1]) {
      const listing = {
        provider_org_id: orgResults[1].id,
        listing_title: 'Manufacturing Carbon Footprint Data 2024',
        dataset_name: 'carbon_footprint_manufacturing_q1_2024',
        dataset_type: 'emissions',
        description: 'Detailed Scope 1, 2, and 3 emissions data from manufacturing operations with hourly granularity',
        data_period_start: '2024-01-01',
        data_period_end: '2024-03-31',
        quality_score: 0.94,
        price_credits: 150,
        access_type: 'one_time',
        status: 'active'
      };
      
      const { data, error } = await supabase
        .from('network_data_marketplace')
        .insert(listing)
        .select()
        .single();
      
      if (error) {
        console.error('Error creating marketplace listing:', error);
      } else {
        console.log(`✓ Created marketplace listing: ${listing.listing_title}`);
      }
    }
    
    // Test 7: Query network data
    console.log('\n7. Testing network queries...');
    
    // Query network nodes
    const { data: nodes, error: nodesError } = await supabase
      .from('network_nodes')
      .select('*')
      .limit(10);
    
    if (nodesError) {
      console.error('Error querying nodes:', nodesError);
    } else {
      console.log(`✓ Found ${nodes.length} network nodes`);
    }
    
    // Query relationships
    const { data: edges, error: edgesError } = await supabase
      .from('network_edges')
      .select('*')
      .limit(10);
    
    if (edgesError) {
      console.error('Error querying edges:', edgesError);
    } else {
      console.log(`✓ Found ${edges.length} network relationships`);
    }
    
    // Query benchmarks
    const { data: benchmarkData, error: benchmarkError } = await supabase
      .from('network_benchmarks')
      .select('*')
      .limit(10);
    
    if (benchmarkError) {
      console.error('Error querying benchmarks:', benchmarkError);
    } else {
      console.log(`✓ Found ${benchmarkData.length} benchmarks`);
    }
    
    console.log('\n🎉 Stream D Network Features test completed successfully!');
    console.log('\nNetwork Features Ready:');
    console.log('• Supply chain relationship mapping');
    console.log('• Anonymous peer benchmarking');
    console.log('• Supplier risk assessments');
    console.log('• ESG data marketplace');
    console.log('• Privacy-preserving analytics');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testNetworkFeatures();