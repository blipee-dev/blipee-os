import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { parse } from 'date-fns';
import * as fs from 'fs';
import * as path from 'path';

// Initialize clients
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Types for extracted data
interface ExtractedMetrics {
  year: number;
  scope1_emissions?: number;
  scope2_emissions?: number;
  scope3_emissions?: number;
  total_emissions?: number;
  energy_consumption?: number;
  renewable_energy_percentage?: number;
  water_consumption?: number;
  waste_generated?: number;
  waste_recycled?: number;
  waste_diverted_percentage?: number;
  // GRI specific indicators
  gri_indicators?: {
    [key: string]: {
      value: number;
      unit: string;
      description: string;
    };
  };
  // CSRD/ESRS specific data points
  esrs_datapoints?: {
    [key: string]: {
      value: number | string;
      unit?: string;
      qualitative?: boolean;
    };
  };
}

interface SiteMetrics {
  site_name: string;
  site_type: string;
  metrics: ExtractedMetrics;
}

// Prompt for extracting sustainability data
const EXTRACTION_PROMPT = `You are an expert sustainability data analyst. Extract the following metrics from the provided sustainability report text. Focus on finding:

1. GHG Emissions Data:
   - Scope 1 emissions (direct)
   - Scope 2 emissions (indirect energy)
   - Scope 3 emissions (value chain)
   - Total emissions

2. Energy Data:
   - Total energy consumption
   - Renewable energy percentage
   - Energy intensity

3. Water Data:
   - Total water consumption
   - Water intensity
   - Water recycled/reused

4. Waste Data:
   - Total waste generated
   - Waste recycled
   - Waste diverted from landfill percentage

5. GRI Indicators (if mentioned):
   - GRI 305-1, 305-2, 305-3 (Emissions)
   - GRI 302-1, 302-3 (Energy)
   - GRI 303-5 (Water)
   - GRI 306-3, 306-4, 306-5 (Waste)

6. CSRD/ESRS Data Points (if mentioned):
   - E1-6 (Climate change mitigation)
   - E2 (Pollution)
   - E3 (Water and marine resources)
   - E4 (Biodiversity)
   - E5 (Circular economy)

Return the data in this JSON format:
{
  "year": 2023,
  "total_metrics": {
    "scope1_emissions": 1234,
    "scope2_emissions": 2345,
    "scope3_emissions": 12345,
    "total_emissions": 15924,
    "energy_consumption": 500000,
    "renewable_energy_percentage": 45,
    "water_consumption": 1200000,
    "waste_generated": 5000,
    "waste_recycled": 3500,
    "waste_diverted_percentage": 78
  },
  "site_breakdown": [
    {
      "site_name": "Manufacturing Plant",
      "site_type": "manufacturing",
      "metrics": { ... }
    }
  ],
  "gri_indicators": {
    "GRI 305-1": { "value": 1234, "unit": "tCO2e", "description": "Direct GHG emissions" }
  },
  "esrs_datapoints": {
    "E1-6": { "value": "Transition plan in place", "qualitative": true }
  },
  "data_quality_notes": "Data extracted from audited sustainability report",
  "year_over_year_change": {
    "total_emissions": -12.5,
    "energy_consumption": -8.2
  }
}

Extract only data that is explicitly stated. Use null for missing values.`;

// Function to extract data from report text
async function extractDataFromReport(reportText: string, reportYear: number): Promise<ExtractedMetrics> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: EXTRACTION_PROMPT,
        },
        {
          role: "user",
          content: `Extract sustainability metrics from this ${reportYear} report:\n\n${reportText}`,
        },
      ],
      temperature: 0.1, // Low temperature for accurate extraction
      response_format: { type: "json_object" },
    });

    const extracted = JSON.parse(response.choices[0].message.content || '{}');
    return extracted.total_metrics || extracted;
  } catch (error) {
    console.error('Error extracting data:', error);
    throw error;
  }
}

// Function to interpolate monthly data from annual totals
function interpolateMonthlyData(
  annualData: ExtractedMetrics[],
  startYear: number,
  endYear: number
): MonthlyData[] {
  const monthlyData: MonthlyData[] = [];
  
  // Seasonal patterns
  const energyPattern = [1.15, 1.12, 1.08, 1.02, 0.95, 0.88, 0.85, 0.87, 0.92, 0.98, 1.05, 1.13];
  const waterPattern = [0.95, 0.95, 0.98, 1.02, 1.08, 1.15, 1.18, 1.17, 1.10, 1.02, 0.98, 0.92];
  
  for (let yearIndex = 0; yearIndex < annualData.length; yearIndex++) {
    const yearData = annualData[yearIndex];
    const year = startYear + yearIndex;
    
    // Calculate monthly averages
    const monthlyAvg = {
      scope1: (yearData.scope1_emissions || 0) / 12,
      scope2: (yearData.scope2_emissions || 0) / 12,
      scope3: (yearData.scope3_emissions || 0) / 12,
      energy: (yearData.energy_consumption || 0) / 12,
      water: (yearData.water_consumption || 0) / 12,
      waste: (yearData.waste_generated || 0) / 12,
      recycled: (yearData.waste_recycled || 0) / 12,
    };
    
    // Generate monthly data with seasonal variations
    for (let month = 1; month <= 12; month++) {
      const monthStr = `${year}-${month.toString().padStart(2, '0')}`;
      
      monthlyData.push({
        month: monthStr,
        electricity_kwh: Math.round(monthlyAvg.energy * energyPattern[month - 1] * (0.95 + Math.random() * 0.1)),
        natural_gas_kwh: Math.round(monthlyAvg.energy * 0.3 * energyPattern[month - 1] * (0.95 + Math.random() * 0.1)),
        water_gallons: Math.round(monthlyAvg.water * waterPattern[month - 1] * (0.95 + Math.random() * 0.1)),
        waste_total_kg: Math.round(monthlyAvg.waste * (0.95 + Math.random() * 0.1)),
        waste_recycled_kg: Math.round(monthlyAvg.recycled * (0.95 + Math.random() * 0.1)),
        scope1_emissions: monthlyAvg.scope1 * energyPattern[month - 1],
        scope2_emissions: monthlyAvg.scope2 * energyPattern[month - 1],
        scope3_emissions: monthlyAvg.scope3,
      });
    }
  }
  
  return monthlyData;
}

// Function to predict 2024 data based on historical trends
function predict2024Data(historicalData: ExtractedMetrics[]): ExtractedMetrics {
  // Calculate year-over-year reduction rates
  const reductions = {
    emissions: 0,
    energy: 0,
    water: 0,
    waste: 0,
  };
  
  if (historicalData.length >= 2) {
    const recent = historicalData[historicalData.length - 1];
    const previous = historicalData[historicalData.length - 2];
    
    if (recent.total_emissions && previous.total_emissions) {
      reductions.emissions = (previous.total_emissions - recent.total_emissions) / previous.total_emissions;
    }
    if (recent.energy_consumption && previous.energy_consumption) {
      reductions.energy = (previous.energy_consumption - recent.energy_consumption) / previous.energy_consumption;
    }
  }
  
  // Apply average reduction rates to predict 2024
  const latest = historicalData[historicalData.length - 1];
  const predicted: ExtractedMetrics = {
    year: 2024,
    scope1_emissions: latest.scope1_emissions ? latest.scope1_emissions * (1 - reductions.emissions * 1.1) : undefined,
    scope2_emissions: latest.scope2_emissions ? latest.scope2_emissions * (1 - reductions.emissions * 1.2) : undefined,
    scope3_emissions: latest.scope3_emissions ? latest.scope3_emissions * (1 - reductions.emissions * 0.8) : undefined,
    total_emissions: latest.total_emissions ? latest.total_emissions * (1 - reductions.emissions) : undefined,
    energy_consumption: latest.energy_consumption ? latest.energy_consumption * (1 - reductions.energy) : undefined,
    renewable_energy_percentage: latest.renewable_energy_percentage ? 
      Math.min(100, latest.renewable_energy_percentage * 1.15) : undefined,
    water_consumption: latest.water_consumption ? latest.water_consumption * (1 - reductions.water) : undefined,
    waste_generated: latest.waste_generated ? latest.waste_generated * (1 - reductions.waste) : undefined,
    waste_recycled: latest.waste_recycled ? latest.waste_recycled * 1.05 : undefined,
  };
  
  return predicted;
}

// Generate a sample GRI/CSRD compliant report structure
function generateStandardReport(companyName: string, year: number, data: ExtractedMetrics): string {
  return `
# ${companyName} Sustainability Report ${year}
## Executive Summary

In ${year}, ${companyName} continued its journey toward sustainability leadership, achieving significant reductions across all environmental impact areas.

## Environmental Performance

### Climate Change (ESRS E1)

#### GHG Emissions Performance
- **Total GHG Emissions**: ${data.total_emissions?.toLocaleString() || 'N/A'} tCO2e
  - Scope 1 (Direct): ${data.scope1_emissions?.toLocaleString() || 'N/A'} tCO2e (GRI 305-1)
  - Scope 2 (Energy Indirect): ${data.scope2_emissions?.toLocaleString() || 'N/A'} tCO2e (GRI 305-2)
  - Scope 3 (Value Chain): ${data.scope3_emissions?.toLocaleString() || 'N/A'} tCO2e (GRI 305-3)

### Energy Management (GRI 302)
- **Total Energy Consumption**: ${data.energy_consumption?.toLocaleString() || 'N/A'} MWh (GRI 302-1)
- **Renewable Energy**: ${data.renewable_energy_percentage || 'N/A'}% of total consumption

### Water and Marine Resources (ESRS E3)
- **Water Consumption**: ${data.water_consumption?.toLocaleString() || 'N/A'} gallons (GRI 303-5)

### Circular Economy (ESRS E5)
- **Total Waste Generated**: ${data.waste_generated?.toLocaleString() || 'N/A'} tons (GRI 306-3)
- **Waste Recycled**: ${data.waste_recycled?.toLocaleString() || 'N/A'} tons (GRI 306-4)
- **Diversion Rate**: ${data.waste_diverted_percentage || 'N/A'}%

## Governance and Strategy
Our sustainability governance structure ensures accountability at all levels, with board-level oversight of climate-related risks and opportunities (TCFD aligned).

## Forward-Looking Statements
Based on current trajectories and planned initiatives, we project continued improvements in all key environmental metrics for ${year + 1}.
`;
}

// Example usage
async function processReports() {
  // Example: Process sample report text
  const sampleReportText = `
    2023 Sustainability Report - Global Sustainable Corp
    
    Environmental Performance:
    This year, we achieved a total reduction of 15% in our greenhouse gas emissions.
    - Scope 1 emissions: 2,400 metric tons CO2e (down 18% from 2022)
    - Scope 2 emissions: 4,850 metric tons CO2e (down 22% from 2022)
    - Scope 3 emissions: 18,500 metric tons CO2e (down 12% from 2022)
    - Total emissions: 25,750 metric tons CO2e
    
    Energy consumption totaled 15,250 MWh, with 45% from renewable sources.
    Water consumption was 3.2 million gallons, a 10% reduction.
    We generated 850 tons of waste, with 680 tons recycled (80% diversion rate).
  `;
  
  try {
    console.log('📊 Extracting data from sustainability report...');
    
    // Extract 2023 data
    const extracted2023 = await extractDataFromReport(sampleReportText, 2023);
    console.log('✅ Extracted 2023 data:', extracted2023);
    
    // Predict 2024 data
    const predicted2024 = predict2024Data([extracted2023]);
    console.log('🔮 Predicted 2024 data:', predicted2024);
    
    // Generate standard report
    const standardReport = generateStandardReport('Global Sustainable Corp', 2024, predicted2024);
    console.log('\n📄 Generated 2024 Report Preview:\n', standardReport);
    
  } catch (error) {
    console.error('❌ Error processing reports:', error);
  }
}

// For actual PDF processing, you would use a library like pdf-parse
// import pdfParse from 'pdf-parse';
// async function extractFromPDF(pdfPath: string) {
//   const dataBuffer = fs.readFileSync(pdfPath);
//   const data = await pdfParse(dataBuffer);
//   return data.text;
// }

export {
  extractDataFromReport,
  interpolateMonthlyData,
  predict2024Data,
  generateStandardReport,
  processReports,
};

// Run if called directly
if (require.main === module) {
  processReports();
}

interface MonthlyData {
  month: string;
  electricity_kwh: number;
  natural_gas_kwh: number;
  water_gallons: number;
  waste_total_kg: number;
  waste_recycled_kg: number;
  scope1_emissions: number;
  scope2_emissions: number;
  scope3_emissions: number;
}