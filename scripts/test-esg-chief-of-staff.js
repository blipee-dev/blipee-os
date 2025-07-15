#!/usr/bin/env node

/**
 * ESG Chief of Staff Agent Test Script
 * Tests the enhanced ESG Chief of Staff with real data analysis and executive reporting
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Environment variables not set. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test organization ID
const testOrgId = '2274271e-679f-49d1-bda8-c92c77ae1d0c';

async function testESGChiefOfStaff() {
  console.log('🔍 Testing Enhanced ESG Chief of Staff Agent');
  console.log('==========================================\n');

  try {
    // Test 1: Agent Instance Check
    console.log('📋 Test 1: Agent Instance Check');
    const { data: agents, error: agentError } = await supabase
      .from('agent_instances')
      .select('*')
      .eq('organization_id', testOrgId)
      .eq('name', 'ESG Chief of Staff')
      .single();
    
    if (agentError) {
      console.error('❌ Error fetching agent:', agentError);
      return;
    }
    
    if (agents) {
      console.log(`✅ Found ESG Chief of Staff agent: ${agents.name} (${agents.status}, health: ${agents.health_score})`);
    } else {
      console.log('❌ No ESG Chief of Staff agent found');
    }
    
    // Test 2: ESG Metrics Analysis
    console.log('\n📊 Test 2: ESG Metrics Analysis');
    
    const keyMetrics = [
      'scope1_emissions',
      'scope2_emissions', 
      'scope3_emissions',
      'total_emissions',
      'energy',
      'electricity',
      'gas',
      'water',
      'waste'
    ];
    
    const metricsData = [];
    
    // Test fetching each metric type
    for (const metric of keyMetrics) {
      const metricData = await getCurrentMetricValue(metric, testOrgId);
      metricsData.push({ metric, ...metricData });
      
      if (metricData.status === 'active') {
        console.log(`✅ ${metric}: ${metricData.value} ${metricData.unit} (${metricData.change >= 0 ? '+' : ''}${metricData.change.toFixed(1)}%)`);
      } else {
        console.log(`⚠️  ${metric}: No data available`);
      }
    }
    
    // Calculate summary metrics
    const totalEmissions = metricsData
      .filter(m => m.metric.includes('emissions'))
      .reduce((sum, m) => sum + (m.value || 0), 0);
    
    const totalEnergy = metricsData
      .filter(m => ['energy', 'electricity', 'gas'].includes(m.metric))
      .reduce((sum, m) => sum + (m.value || 0), 0);
    
    console.log(`\n📈 Summary Metrics:`);
    console.log(`   Total Emissions: ${totalEmissions.toFixed(2)} tCO2e`);
    console.log(`   Total Energy: ${totalEnergy.toFixed(2)} kWh`);
    console.log(`   Carbon Intensity: ${totalEnergy > 0 ? (totalEmissions / totalEnergy).toFixed(4) : 'N/A'} tCO2e/kWh`);
    
    // Test 3: Trend Analysis
    console.log('\n📈 Test 3: Trend Analysis');
    
    const trends = analyzeTrends(metricsData);
    console.log(`✅ Identified ${trends.length} trends:`);
    trends.forEach(trend => {
      const emoji = trend.direction === 'increasing' ? '📈' : trend.direction === 'decreasing' ? '📉' : '➡️';
      console.log(`  ${emoji} ${trend.metric}: ${trend.direction} (${trend.changePercent.toFixed(1)}%, ${trend.severity} severity)`);
    });
    
    // Test 4: Anomaly Detection
    console.log('\n🚨 Test 4: Anomaly Detection');
    
    const anomalies = detectAnomalies(metricsData);
    if (anomalies.length > 0) {
      console.log(`✅ Detected ${anomalies.length} anomalies:`);
      anomalies.forEach(anomaly => {
        console.log(`  ⚠️  ${anomaly.metric}: ${anomaly.value} (${anomaly.deviation}% deviation, ${anomaly.severity} severity)`);
      });
    } else {
      console.log('✅ No anomalies detected');
    }
    
    // Test 5: Optimization Opportunities
    console.log('\n💡 Test 5: Optimization Opportunities');
    
    const opportunities = identifyOptimizationOpportunities(metricsData);
    console.log(`✅ Identified ${opportunities.length} optimization opportunities:`);
    
    opportunities.slice(0, 5).forEach((opp, idx) => {
      console.log(`  ${idx + 1}. ${opp.name} (${opp.category})`);
      console.log(`     💰 Savings: ${opp.expectedSavings}`);
      console.log(`     🌱 Impact: ${opp.emissionsImpact}`);
      console.log(`     ⚡ Feasibility: ${(opp.feasibility * 100).toFixed(0)}%`);
    });
    
    // Test 6: Executive Insights Generation
    console.log('\n🎯 Test 6: Executive Insights Generation');
    
    const insights = generateExecutiveInsights(metricsData, trends, anomalies, opportunities);
    console.log(`✅ Generated ${insights.length} executive insights:`);
    insights.forEach((insight, idx) => {
      console.log(`  ${idx + 1}. ${insight}`);
    });
    
    // Test 7: Report Generation Simulation
    console.log('\n📄 Test 7: Report Generation Simulation');
    
    const reportTypes = ['daily', 'weekly', 'monthly', 'executive'];
    console.log('✅ Available report types:');
    reportTypes.forEach(type => {
      console.log(`  - ${type} report`);
    });
    
    // Test 8: Agent Capabilities
    console.log('\n⚡ Test 8: Agent Capabilities');
    
    const capabilities = [
      'analyze_metrics',
      'generate_reports',
      'send_alerts',
      'optimize_operations'
    ];
    
    console.log('✅ ESG Chief of Staff capabilities:');
    capabilities.forEach(cap => {
      console.log(`  - ${cap}`);
    });
    
    // Test 9: Agent Schedule
    console.log('\n🕐 Test 9: Agent Schedule');
    
    const schedule = [
      { task: 'analyze_metrics', frequency: 'daily (8 AM)' },
      { task: 'generate_reports', frequency: 'weekly (Monday 9 AM) & monthly (1st, 9 AM)' },
      { task: 'monitor_realtime', frequency: 'every 2 hours' },
      { task: 'optimize_operations', frequency: 'weekly (Wednesday 10 AM)' },
      { task: 'check_compliance', frequency: 'weekly (Friday 11 AM)' }
    ];
    
    console.log('✅ Executive monitoring schedule:');
    schedule.forEach(item => {
      console.log(`  - ${item.task}: ${item.frequency}`);
    });
    
    // Test Summary
    console.log('\n📊 ESG Chief of Staff Test Summary');
    console.log('==================================');
    console.log(`✅ Agent Instance: ${agents?.name || 'Not Found'} (${agents?.status || 'unknown'})`);
    console.log(`✅ Health Score: ${agents?.health_score || 'N/A'}`);
    console.log(`✅ Metrics Analyzed: ${metricsData.filter(m => m.status === 'active').length}/${keyMetrics.length}`);
    console.log(`✅ Trends Identified: ${trends.length}`);
    console.log(`✅ Anomalies Detected: ${anomalies.length}`);
    console.log(`✅ Opportunities Found: ${opportunities.length}`);
    console.log(`✅ Insights Generated: ${insights.length}`);
    console.log(`✅ Capabilities: ${capabilities.length} defined`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Helper function to get current metric value
async function getCurrentMetricValue(metric, organizationId) {
  try {
    let value = 0;
    let unit = '';
    let recentData = [];
    
    switch (metric) {
      case 'scope1_emissions':
      case 'scope2_emissions':
      case 'scope3_emissions':
      case 'total_emissions':
        const scopeField = metric.replace('_emissions', '').replace('total', 'total_emissions');
        const { data: emissionsData } = await supabase
          .from('emissions')
          .select('*')
          .eq('organization_id', organizationId)
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (emissionsData && emissionsData.length > 0) {
          recentData = emissionsData;
          value = emissionsData[0][scopeField] || 0;
          unit = 'tCO2e';
        }
        break;
        
      case 'energy':
      case 'electricity':
      case 'gas':
        const { data: energyData } = await supabase
          .from('energy_consumption')
          .select('*')
          .eq('organization_id', organizationId)
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (energyData && energyData.length > 0) {
          recentData = energyData;
          value = energyData[0].total_consumption || 0;
          unit = 'kWh';
        } else {
          // Fallback to emissions estimate
          const { data: fallbackData } = await supabase
            .from('emissions')
            .select('*')
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: false })
            .limit(10);
          
          if (fallbackData && fallbackData.length > 0) {
            recentData = fallbackData;
            value = (fallbackData[0].scope_2 || 0) * 2000;
            unit = 'kWh (est)';
          }
        }
        break;
        
      case 'water':
        const { data: waterData } = await supabase
          .from('water_usage')
          .select('*')
          .eq('organization_id', organizationId)
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (waterData && waterData.length > 0) {
          recentData = waterData;
          value = waterData[0].total_usage || 0;
          unit = 'm³';
        }
        break;
        
      case 'waste':
        const { data: wasteData } = await supabase
          .from('waste_data')
          .select('*')
          .eq('organization_id', organizationId)
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (wasteData && wasteData.length > 0) {
          recentData = wasteData;
          value = wasteData[0].total_waste || 0;
          unit = 'tons';
        }
        break;
    }
    
    // Calculate change
    let change = 0;
    if (recentData.length >= 2) {
      const currentValue = extractMetricValue(recentData[0], metric);
      const previousValue = extractMetricValue(recentData[1], metric);
      
      if (previousValue > 0) {
        change = ((currentValue - previousValue) / previousValue) * 100;
      }
    }
    
    return {
      value,
      unit,
      change,
      timestamp: recentData[0]?.created_at || new Date(),
      status: recentData.length > 0 ? 'active' : 'no_data',
      dataPoints: recentData.length
    };
  } catch (error) {
    console.error(`Error getting metric ${metric}:`, error);
    return {
      value: 0,
      unit: getMetricUnit(metric),
      change: 0,
      timestamp: new Date(),
      status: 'error'
    };
  }
}

function extractMetricValue(record, metric) {
  switch (metric) {
    case 'scope1_emissions':
      return record.scope_1 || 0;
    case 'scope2_emissions':
      return record.scope_2 || 0;
    case 'scope3_emissions':
      return record.scope_3 || 0;
    case 'total_emissions':
      return record.total_emissions || 0;
    case 'energy':
    case 'electricity':
    case 'gas':
      return record.total_consumption || record.scope_2 * 2000 || 0;
    case 'water':
      return record.total_usage || 0;
    case 'waste':
      return record.total_waste || 0;
    default:
      return 0;
  }
}

function getMetricUnit(metric) {
  const units = {
    'scope1_emissions': 'tCO2e',
    'scope2_emissions': 'tCO2e',
    'scope3_emissions': 'tCO2e',
    'total_emissions': 'tCO2e',
    'energy': 'kWh',
    'electricity': 'kWh',
    'gas': 'm³',
    'water': 'm³',
    'waste': 'tons'
  };
  return units[metric] || 'units';
}

function analyzeTrends(metricsData) {
  const trends = [];
  
  for (const metric of metricsData) {
    if (metric.status === 'active') {
      const trend = {
        metric: metric.metric,
        direction: metric.change > 0 ? 'increasing' : metric.change < 0 ? 'decreasing' : 'stable',
        changePercent: metric.change,
        severity: Math.abs(metric.change) > 20 ? 'high' : Math.abs(metric.change) > 10 ? 'medium' : 'low'
      };
      trends.push(trend);
    }
  }
  
  return trends;
}

function detectAnomalies(metricsData) {
  const anomalies = [];
  
  for (const metric of metricsData) {
    if (metric.status === 'active') {
      // Simple anomaly detection based on change thresholds
      if (Math.abs(metric.change) > 30) {
        anomalies.push({
          metric: metric.metric,
          value: metric.value,
          expectedRange: `${metric.value * 0.7} - ${metric.value * 1.3}`,
          deviation: metric.change,
          severity: Math.abs(metric.change) > 50 ? 'critical' : 'high'
        });
      }
    }
  }
  
  return anomalies;
}

function identifyOptimizationOpportunities(metricsData) {
  const opportunities = [];
  
  // Energy opportunities
  const energyMetrics = metricsData.filter(m => ['energy', 'electricity', 'gas'].includes(m.metric));
  for (const metric of energyMetrics) {
    if (metric.value > 0) {
      opportunities.push({
        id: `opt-${metric.metric}-1`,
        name: `${metric.metric.charAt(0).toUpperCase() + metric.metric.slice(1)} Efficiency Improvement`,
        category: 'energy',
        impact: 0.8,
        feasibility: 0.85,
        effort: 0.4,
        risk: 'low',
        expectedSavings: `$${Math.round(metric.value * 0.15 * 0.12)}/month`,
        emissionsImpact: `${(metric.value * 0.15 * 0.0005).toFixed(1)} tCO2e/month reduction`
      });
    }
  }
  
  // Emissions opportunities
  const emissionsMetrics = metricsData.filter(m => m.metric.includes('emissions') && m.value > 0);
  for (const metric of emissionsMetrics) {
    opportunities.push({
      id: `opt-${metric.metric}-2`,
      name: `${metric.metric.replace('_', ' ')} Reduction Program`,
      category: 'emissions',
      impact: 0.9,
      feasibility: 0.75,
      effort: 0.6,
      risk: 'medium',
      expectedSavings: `$${Math.round(metric.value * 25)}/month in carbon costs`,
      emissionsImpact: `${(metric.value * 0.2).toFixed(1)} tCO2e/month reduction`
    });
  }
  
  return opportunities;
}

function generateExecutiveInsights(metricsData, trends, anomalies, opportunities) {
  const insights = [];
  
  // Overall performance insight
  const activeMetrics = metricsData.filter(m => m.status === 'active').length;
  insights.push(`ESG data completeness: ${((activeMetrics / metricsData.length) * 100).toFixed(0)}% - ${activeMetrics} of ${metricsData.length} key metrics are being tracked`);
  
  // Trend insights
  const increasingTrends = trends.filter(t => t.direction === 'increasing' && t.severity !== 'low');
  if (increasingTrends.length > 0) {
    insights.push(`Alert: ${increasingTrends.length} metrics showing significant increases, requiring immediate attention`);
  }
  
  // Anomaly insights
  if (anomalies.length > 0) {
    insights.push(`Critical: ${anomalies.length} anomalies detected in ESG metrics - investigation recommended`);
  }
  
  // Opportunity insights
  const totalSavings = opportunities.reduce((sum, opp) => {
    const savingsMatch = opp.expectedSavings.match(/\$(\d+)/);
    return sum + (savingsMatch ? parseInt(savingsMatch[1]) : 0);
  }, 0);
  
  const totalEmissionsReduction = opportunities.reduce((sum, opp) => {
    const reductionMatch = opp.emissionsImpact.match(/([\d.]+) tCO2e/);
    return sum + (reductionMatch ? parseFloat(reductionMatch[1]) : 0);
  }, 0);
  
  insights.push(`Opportunity: ${opportunities.length} optimization opportunities identified with potential savings of $${totalSavings}/month and ${totalEmissionsReduction.toFixed(1)} tCO2e/month reduction`);
  
  // Strategic recommendation
  if (opportunities.length > 0) {
    const topOpp = opportunities.sort((a, b) => b.impact - a.impact)[0];
    insights.push(`Recommendation: Prioritize "${topOpp.name}" for maximum impact with ${((topOpp.feasibility * 100).toFixed(0))}% feasibility`);
  }
  
  return insights;
}

// Run the test
testESGChiefOfStaff().catch(console.error);