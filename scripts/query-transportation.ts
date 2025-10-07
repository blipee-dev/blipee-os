import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables:');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'present' : 'MISSING');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'present' : 'MISSING');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function queryTransportation() {
  console.log('=== Querying Transportation Metrics ===\n');
  
  // 1. Check metrics_catalog for transportation-related metrics
  const { data: metrics, error: metricsError } = await supabase
    .from('metrics_catalog')
    .select('*')
    .or('code.ilike.%travel%,code.ilike.%fleet%,code.ilike.%vehicle%,code.ilike.%transportation%,category.ilike.%travel%,category.ilike.%transportation%');
  
  if (metricsError) {
    console.error('Error fetching metrics:', metricsError);
  } else {
    console.log(`Found ${metrics?.length || 0} transportation-related metrics in catalog`);
    if (metrics && metrics.length > 0) {
      console.log('\nMetric codes:');
      metrics.forEach(m => console.log(`  - ${m.code}: ${m.name} (${m.category})`));
    }
  }
  
  // 2. Check metrics_data for actual transportation data
  if (metrics && metrics.length > 0) {
    const metricIds = metrics.map(m => m.id);
    
    const { data: metricsData, error: dataError, count } = await supabase
      .from('metrics_data')
      .select('*', { count: 'exact' })
      .in('metric_id', metricIds)
      .limit(5);
    
    if (dataError) {
      console.error('Error fetching metrics data:', dataError);
    } else {
      console.log(`\n=== Transportation Data in metrics_data ===`);
      console.log(`Total rows: ${count || 0}`);
      if (metricsData && metricsData.length > 0) {
        console.log('\nSample rows:');
        metricsData.forEach(row => {
          const metric = metrics.find(m => m.id === row.metric_id);
          console.log(`  ${metric?.code}: ${row.value} ${row.unit} (${row.period_start})`);
        });
      }
    }
  }
  
  // 3. Check fleet_vehicles table
  const { data: fleetVehicles, error: fleetError } = await supabase
    .from('fleet_vehicles')
    .select('*')
    .limit(5);
  
  console.log('\n=== Fleet Vehicles Table ===');
  if (fleetError) {
    console.error('Error:', fleetError.message);
  } else {
    console.log('Row count:', fleetVehicles?.length || 0);
  }
  
  // 4. Check business_travel table
  const { data: businessTravel, error: travelError } = await supabase
    .from('business_travel')
    .select('*')
    .limit(5);
  
  console.log('\n=== Business Travel Table ===');
  if (travelError) {
    console.error('Error:', travelError.message);
  } else {
    console.log('Row count:', businessTravel?.length || 0);
  }
}

queryTransportation().catch(console.error);
