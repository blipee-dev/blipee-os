#!/usr/bin/env tsx

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(__dirname, '../.env.local') });

async function testQueryMonitoring() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  // For testing, we'll use a test token - in production this would be from auth
  const testToken = process.env.TEST_AUTH_TOKEN || '';
  
  console.log('🔍 Testing Query Monitoring System...\n');
  
  // Test 1: Get database statistics
  console.log('1. Getting database statistics...');
  try {
    const statsResponse = await fetch(`${baseUrl}/api/monitoring/queries?type=stats`, {
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (statsResponse.ok) {
      const { data } = await statsResponse.json();
      console.log('✅ Database Statistics:');
      console.log('   Tables:', data.tables?.length || 0);
      console.log('   Slow queries (24h):', data.slowQueriesLast24h);
      console.log('   Health status:', data.health);
    } else {
      console.log('❌ Failed to get stats:', await statsResponse.text());
    }
  } catch (error) {
    console.log('❌ Error getting stats:', error);
  }
  
  // Test 2: Get slow queries
  console.log('\n2. Getting slow queries...');
  try {
    const slowResponse = await fetch(`${baseUrl}/api/monitoring/queries?type=slow_queries&threshold_ms=50`, {
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (slowResponse.ok) {
      const { data } = await slowResponse.json();
      console.log('✅ Slow Queries Found:', data.length);
      if (data.length > 0) {
        console.log('   Sample query:', {
          type: data[0].query_type,
          mean_time: data[0].mean_time,
          calls: data[0].calls
        });
      }
    } else {
      console.log('❌ Failed to get slow queries:', await slowResponse.text());
    }
  } catch (error) {
    console.log('❌ Error getting slow queries:', error);
  }
  
  // Test 3: Get query insights
  console.log('\n3. Getting query insights...');
  try {
    const insightsResponse = await fetch(`${baseUrl}/api/monitoring/queries?type=insights&hours=24`, {
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (insightsResponse.ok) {
      const { data } = await insightsResponse.json();
      console.log('✅ Query Insights:', data.length);
      data.forEach((insight: any, index: number) => {
        console.log(`   ${index + 1}. ${insight.insight_type}: ${insight.description}`);
        console.log(`      Impact: ${insight.impact}`);
        console.log(`      Recommendation: ${insight.recommendation}`);
      });
    } else {
      console.log('❌ Failed to get insights:', await insightsResponse.text());
    }
  } catch (error) {
    console.log('❌ Error getting insights:', error);
  }
  
  // Test 4: Get query patterns
  console.log('\n4. Analyzing query patterns...');
  try {
    const patternsResponse = await fetch(`${baseUrl}/api/monitoring/queries?type=patterns&days=7`, {
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (patternsResponse.ok) {
      const { data } = await patternsResponse.json();
      console.log('✅ Query Patterns:', data.length);
      data.forEach((pattern: any) => {
        console.log(`   ${pattern.pattern_name}: ${pattern.occurrence_count} occurrences, avg ${pattern.avg_execution_time}ms`);
      });
    } else {
      console.log('❌ Failed to get patterns:', await patternsResponse.text());
    }
  } catch (error) {
    console.log('❌ Error getting patterns:', error);
  }
  
  // Test 5: Check database health
  console.log('\n5. Checking database health...');
  try {
    const healthResponse = await fetch(`${baseUrl}/api/monitoring/queries?type=health`, {
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (healthResponse.ok) {
      const { data } = await healthResponse.json();
      console.log('✅ Health Metrics:', data.length);
      data.forEach((metric: any) => {
        const status = metric.is_healthy ? '✅' : '❌';
        console.log(`   ${status} ${metric.metric_name}: ${metric.metric_value} ${metric.unit}`);
      });
    } else {
      console.log('❌ Failed to get health metrics:', await healthResponse.text());
    }
  } catch (error) {
    console.log('❌ Error getting health metrics:', error);
  }
  
  // Test 6: Export report
  console.log('\n6. Exporting monitoring report...');
  try {
    const reportResponse = await fetch(`${baseUrl}/api/monitoring/queries?type=report&format=json`, {
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (reportResponse.ok) {
      const report = await reportResponse.json();
      console.log('✅ Report Summary:');
      console.log('   Generated at:', report.generated_at);
      console.log('   Total slow queries:', report.summary.total_slow_queries);
      console.log('   Total insights:', report.summary.total_insights);
      console.log('   Total patterns:', report.summary.total_patterns);
      console.log('   Unhealthy metrics:', report.summary.unhealthy_metrics);
    } else {
      console.log('❌ Failed to export report:', await reportResponse.text());
    }
  } catch (error) {
    console.log('❌ Error exporting report:', error);
  }
  
  console.log('\n✨ Query monitoring tests completed!');
  
  // Note about authentication
  console.log('\n📝 Note: These tests require admin authentication.');
  console.log('   In production, use the actual auth endpoints.');
}

// Run the tests
testQueryMonitoring().catch(console.error);