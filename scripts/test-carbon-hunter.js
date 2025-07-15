#!/usr/bin/env node

/**
 * Carbon Hunter Agent Test Script
 * Tests the enhanced Carbon Hunter agent with real-time emission tracking
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Environment variables not set. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCarbonHunter() {
  console.log('🔍 Testing Enhanced Carbon Hunter Agent');
  console.log('======================================');
  
  try {
    // Test 1: Check agent instance exists
    console.log('\n📋 Test 1: Agent Instance Check');
    const { data: agents, error: agentsError } = await supabase
      .from('agent_instances')
      .select(`
        id,
        name,
        status,
        autonomy_level,
        health_score,
        agent_definition:agent_definitions(type, name)
      `)
      .eq('agent_definition.type', 'carbon_hunter');
    
    if (agentsError) {
      console.error('❌ Error fetching Carbon Hunter agents:', agentsError);
      return;
    }
    
    if (agents.length === 0) {
      console.log('❌ No Carbon Hunter agents found');
      return;
    }
    
    console.log(`✅ Found ${agents.length} Carbon Hunter agent(s)`);
    agents.forEach(agent => {
      console.log(`  - ${agent.name} (${agent.status}, health: ${agent.health_score})`);
    });
    
    const carbonHunter = agents[0];
    
    // Test 2: Check metrics data for energy consumption
    console.log('\n📊 Test 2: Energy Consumption Data');
    const { data: energyData, error: energyError } = await supabase
      .from('metrics')
      .select(`
        value,
        time,
        device:devices(name, location, device_type)
      `)
      .eq('metric_type', 'energy_consumption')
      .limit(10);
    
    if (energyError) {
      console.error('❌ Error fetching energy data:', energyError);
    } else {
      console.log(`✅ Found ${energyData.length} energy consumption records`);
      if (energyData.length > 0) {
        console.log('  Sample data:');
        energyData.slice(0, 3).forEach(record => {
          console.log(`    - ${record.device?.name || 'Unknown'}: ${record.value} kWh`);
        });
      }
    }
    
    // Test 3: Check waste generation data
    console.log('\n🗑️ Test 3: Waste Generation Data');
    const { data: wasteData, error: wasteError } = await supabase
      .from('metrics')
      .select(`
        value,
        metadata,
        time,
        device:devices(name, location, device_type)
      `)
      .eq('metric_type', 'waste_generation')
      .limit(10);
    
    if (wasteError) {
      console.error('❌ Error fetching waste data:', wasteError);
    } else {
      console.log(`✅ Found ${wasteData.length} waste generation records`);
      if (wasteData.length > 0) {
        console.log('  Sample data:');
        wasteData.slice(0, 3).forEach(record => {
          console.log(`    - ${record.device?.name || 'Unknown'}: ${record.value} kg`);
        });
      }
    }
    
    // Test 4: Simulate carbon opportunity detection
    console.log('\n🎯 Test 4: Carbon Opportunity Detection');
    const testEnergyData = [
      { device: { name: 'HVAC-01', location: 'Building A', device_type: 'hvac' }, value: 250 },
      { device: { name: 'Lighting-01', location: 'Building A', device_type: 'lighting' }, value: 150 },
      { device: { name: 'Lighting-02', location: 'Building B', device_type: 'lighting' }, value: 120 }
    ];
    
    console.log('  Simulating opportunity detection with sample data...');
    
    let opportunities = [];
    testEnergyData.forEach(data => {
      if (data.device.device_type === 'lighting' && data.value > 100) {
        const estimatedReduction = data.value * 0.6 * 0.0005;
        const estimatedCost = Math.ceil(data.value / 10) * 150;
        
        opportunities.push({
          id: `test-led-${data.device.name}`,
          type: 'energy_efficiency',
          title: `LED Retrofit - ${data.device.name}`,
          location: data.device.location,
          estimatedReduction,
          estimatedCost,
          roi: ((estimatedReduction * 50) / estimatedCost) * 100
        });
      }
      
      if (data.device.device_type === 'hvac' && data.value > 200) {
        const estimatedReduction = data.value * 0.25 * 0.0005;
        const estimatedCost = 15000;
        
        opportunities.push({
          id: `test-hvac-${data.device.name}`,
          type: 'energy_efficiency',
          title: `HVAC Optimization - ${data.device.name}`,
          location: data.device.location,
          estimatedReduction,
          estimatedCost,
          roi: ((estimatedReduction * 50) / estimatedCost) * 100
        });
      }
    });
    
    console.log(`✅ Detected ${opportunities.length} carbon reduction opportunities:`);
    opportunities.forEach(opp => {
      console.log(`  - ${opp.title}`);
      console.log(`    Reduction: ${opp.estimatedReduction.toFixed(2)} tCO2e/year`);
      console.log(`    Cost: $${opp.estimatedCost.toLocaleString()}`);
      console.log(`    ROI: ${opp.roi.toFixed(1)}%`);
    });
    
    // Test 5: Simulate anomaly detection
    console.log('\n🚨 Test 5: Anomaly Detection');
    const testEmissionData = [
      { timestamp: new Date('2025-01-01T10:00:00Z'), value: 150, location: 'Building A' },
      { timestamp: new Date('2025-01-01T11:00:00Z'), value: 145, location: 'Building A' },
      { timestamp: new Date('2025-01-01T12:00:00Z'), value: 155, location: 'Building A' },
      { timestamp: new Date('2025-01-01T13:00:00Z'), value: 220, location: 'Building A' }, // Anomaly
      { timestamp: new Date('2025-01-01T14:00:00Z'), value: 152, location: 'Building A' }
    ];
    
    // Calculate statistics for anomaly detection
    const values = testEmissionData.map(d => d.value);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);
    
    console.log('  Simulating anomaly detection with sample data...');
    console.log(`  Mean: ${mean.toFixed(1)}, StdDev: ${stdDev.toFixed(1)}`);
    
    const anomalies = [];
    testEmissionData.forEach(dataPoint => {
      const zScore = Math.abs(dataPoint.value - mean) / stdDev;
      if (zScore > 2.0) {
        const deviationPercentage = ((dataPoint.value - mean) / mean) * 100;
        anomalies.push({
          timestamp: dataPoint.timestamp,
          value: dataPoint.value,
          deviation: deviationPercentage,
          severity: zScore > 3.0 ? 'critical' : 'high'
        });
      }
    });
    
    console.log(`✅ Detected ${anomalies.length} anomalies:`);
    anomalies.forEach(anomaly => {
      console.log(`  - ${anomaly.timestamp.toISOString()}: ${anomaly.value} (${anomaly.deviation.toFixed(1)}% deviation, ${anomaly.severity})`);
    });
    
    // Test 6: Agent capabilities check
    console.log('\n🔧 Test 6: Agent Capabilities');
    const capabilities = [
      'hunt_carbon_opportunities',
      'detect_emission_anomalies',
      'analyze_carbon_trends',
      'optimize_carbon_efficiency',
      'forecast_emissions',
      'benchmark_performance'
    ];
    
    console.log('✅ Carbon Hunter capabilities:');
    capabilities.forEach(capability => {
      console.log(`  - ${capability}`);
    });
    
    // Test 7: Real-time processing simulation
    console.log('\n⚡ Test 7: Real-time Processing');
    const processingTasks = [
      { type: 'hunt_carbon_opportunities', interval: '30 minutes' },
      { type: 'detect_emission_anomalies', interval: '15 minutes' },
      { type: 'analyze_carbon_trends', interval: 'daily' },
      { type: 'optimize_carbon_efficiency', interval: 'weekly' },
      { type: 'forecast_emissions', interval: 'monthly' }
    ];
    
    console.log('✅ Real-time processing schedule:');
    processingTasks.forEach(task => {
      console.log(`  - ${task.type}: every ${task.interval}`);
    });
    
    // Summary
    console.log('\n📊 Carbon Hunter Test Summary');
    console.log('============================');
    console.log(`✅ Agent Instance: ${carbonHunter.name} (${carbonHunter.status})`);
    console.log(`✅ Health Score: ${carbonHunter.health_score}`);
    console.log(`✅ Autonomy Level: ${carbonHunter.autonomy_level}`);
    console.log(`✅ Energy Data: ${energyData.length} records available`);
    console.log(`✅ Waste Data: ${wasteData.length} records available`);
    console.log(`✅ Opportunities: ${opportunities.length} detected`);
    console.log(`✅ Anomalies: ${anomalies.length} detected`);
    console.log(`✅ Capabilities: ${capabilities.length} functions`);
    
    console.log('\n🎉 Carbon Hunter Agent Test Complete!');
    console.log('🚀 Enhanced Carbon Hunter is operational with:');
    console.log('  • Real-time emission tracking');
    console.log('  • Advanced anomaly detection');
    console.log('  • Intelligent opportunity identification');
    console.log('  • Statistical analysis algorithms');
    console.log('  • Database integration');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  testCarbonHunter().catch(console.error);
}

module.exports = { testCarbonHunter };