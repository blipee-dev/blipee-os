/**
 * Test the intensity metrics API response
 */

require('dotenv').config({ path: '.env.local' });

async function testAPI() {
  const baseUrl = 'http://localhost:3000';

  // Wait for server to be ready
  console.log('🔄 Waiting for dev server...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log('🧪 Testing scope-analysis API...\n');

  try {
    const response = await fetch(`${baseUrl}/api/test-intensity?year=2025`);
    const data = await response.json();

    if (data.intensityMetrics) {
      console.log('✅ Intensity Metrics Response:\n');
      console.log('📊 Standard Metrics:');
      console.log(`   Per Employee: ${data.intensityMetrics.perEmployee?.toFixed(2) || 0} tCO2e/FTE`);
      console.log(`   Per Revenue: ${data.intensityMetrics.perRevenue?.toFixed(2) || 0} tCO2e/M€`);
      console.log(`   Per m²: ${data.intensityMetrics.perSqm?.toFixed(2) || 0} kgCO2e/m²`);
      console.log(`   Per Value Added: ${data.intensityMetrics.perValueAdded?.toFixed(2) || 0} tCO2e/M€ VA`);

      if (data.intensityMetrics.sectorSpecific) {
        console.log('\n🎯 Sector-Specific Intensity:');
        const ss = data.intensityMetrics.sectorSpecific;
        console.log(`   Intensity: ${ss.intensity?.toFixed(3)} ${ss.unit}`);
        console.log(`   Sector: ${ss.industrySector}`);
        console.log(`   Production: ${ss.productionVolume} ${ss.productionUnitLabel}`);
        console.log(`   Benchmark: ${ss.benchmark || 'N/A'}`);
        console.log(`   Industry Avg: ${ss.benchmarkValue?.toFixed(3) || 'N/A'}`);
        console.log(`   SBTi Pathway: ${ss.sbtiPathway || 'N/A'}`);
        console.log(`   GRI Standard: ${ss.griStandard || 'N/A'}`);
      } else {
        console.log('\n⚠️  No sector-specific data');
      }

      console.log('\n📈 Additional Metrics:');
      console.log(`   Per Operating Hour: ${data.intensityMetrics.perOperatingHour?.toFixed(2) || 0} kgCO2e/h`);
      console.log(`   Per Customer: ${data.intensityMetrics.perCustomer?.toFixed(2) || 0} kgCO2e`);

    } else {
      console.log('❌ No intensity metrics in response');
      console.log('Response:', JSON.stringify(data, null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAPI();
