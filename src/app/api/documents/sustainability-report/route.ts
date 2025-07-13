import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { documentParser } from "@/lib/data/document-parser";
import OpenAI from "openai";

// Lazy initialization to avoid build errors
let supabase: any;
let openai: any;

function initializeClients() {
  if (!supabase && process.env['NEXT_PUBLIC_SUPABASE_URL']) {
    supabase = createClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL']!,
      process.env['SUPABASE_SERVICE_ROLE_KEY']!,
    );
  }
  
  if (!openai && process.env['OPENAI_API_KEY']) {
    openai = new OpenAI({
      apiKey: process.env['OPENAI_API_KEY']!,
    });
  }
}

// Enhanced prompt for sustainability report extraction
const SUSTAINABILITY_EXTRACTION_PROMPT = `You are an expert sustainability data analyst specializing in GRI and CSRD/ESRS standards. Extract comprehensive sustainability metrics from the provided report.

Focus on:
1. **GHG Emissions (GRI 305)**:
   - Scope 1 (305-1): Direct emissions
   - Scope 2 (305-2): Energy indirect emissions  
   - Scope 3 (305-3): Other indirect emissions
   - By source/activity if available

2. **Energy (GRI 302)**:
   - Total consumption (302-1)
   - Energy intensity (302-3)
   - Renewable percentage

3. **Water (GRI 303)**:
   - Water withdrawal (303-3)
   - Water consumption (303-5)

4. **Waste (GRI 306)**:
   - Waste generated (306-3)
   - Waste diverted from disposal (306-4)
   - Waste directed to disposal (306-5)

5. **CSRD/ESRS Data Points**:
   - E1: Climate change metrics
   - E2: Pollution data
   - E3: Water resources
   - E4: Biodiversity impacts
   - E5: Circular economy

6. **Site/Location Breakdown** (if available):
   - Metrics by facility/location
   - Regional performance

Return as structured JSON with units and confidence scores.`;

export async function POST(req: NextRequest) {
  try {
    // Initialize clients if needed
    initializeClients();
    
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const organizationId = formData.get("organizationId") as string;
    const reportYear = formData.get("year") as string;

    if (!file || !organizationId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Step 1: Parse document to extract text
    const parsed = await documentParser.parseDocument(buffer, "report");

    // Step 2: Use AI to extract structured sustainability data
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: SUSTAINABILITY_EXTRACTION_PROMPT,
        },
        {
          role: "user",
          content: `Extract sustainability data from this ${reportYear || "annual"} report:\n\n${parsed.rawText}`,
        },
      ],
      temperature: 0.1,
      response_format: { type: "json_object" },
    });

    const extractedData = JSON.parse(
      completion.choices[0].message.content || "{}",
    );

    // Step 3: Process and store data
    const results = await processExtractedData(
      extractedData,
      organizationId,
      reportYear,
    );

    // Step 4: Generate insights
    const insights = await generateInsights(extractedData, organizationId);

    return NextResponse.json({
      success: true,
      extracted: extractedData,
      stored: results,
      insights,
      confidence: parsed.confidence,
    });
  } catch (error) {
    console.error("Error processing sustainability report:", error);
    return NextResponse.json(
      { error: "Failed to process report" },
      { status: 500 },
    );
  }
}

async function processExtractedData(
  data: any,
  organizationId: string,
  reportYear: string,
) {
  const results = {
    emissions: 0,
    metrics: 0,
    targets: 0,
  };

  // Get the report year or use current year
  const year = parseInt(reportYear) || new Date().getFullYear();

  // Store emissions data
  if (data.emissions) {
    const emissionsToInsert = [];

    // Process total emissions by scope
    for (const [scope, value] of Object.entries(data.emissions.byScope || {})) {
      if (value && typeof value === "number") {
        const scopeNum = parseInt(scope.replace("scope", ""));

        emissionsToInsert.push({
          organization_id: organizationId,
          emission_date: `${year}-12-31`, // End of year
          source_type: "organization",
          source_details: { report_year: year },
          module_id: "reporting",
          scope: scopeNum,
          category: `scope_${scopeNum}_total`,
          activity_data: value,
          activity_unit: "tCO2e",
          emission_factor: 1,
          emissions_amount: value * 1000, // Convert to kg
          emissions_unit: "kgCO2e",
          data_quality: "measured",
          data_source: "sustainability_report",
          confidence_score: 0.95,
          notes: `Extracted from ${year} sustainability report`,
        });
      }
    }

    // Process emissions by source if available
    if (data.emissions.bySite) {
      for (const [site, siteData] of Object.entries(data.emissions.bySite)) {
        // Store site-specific emissions
        // Would need to match site names to building IDs
      }
    }

    if (emissionsToInsert.length > 0) {
      const { error: _error } = await supabase
        .from("emissions")
        .insert(emissionsToInsert);

      if (!error) {
        results.emissions = emissionsToInsert.length;
      }
    }
  }

  // Store ESG metrics
  if (data.metrics) {
    const metricsToInsert = [];

    // Energy metrics
    if (data.metrics.energy) {
      metricsToInsert.push({
        organization_id: organizationId,
        metric_date: `${year}-12-31`,
        pillar: "E",
        category: "energy",
        metric_name: "Total Energy Consumption",
        metric_value: data.metrics.energy.total,
        metric_unit: data.metrics.energy.unit || "MWh",
        framework: "GRI",
        framework_indicator: "GRI 302-1",
      });

      if (data.metrics.energy.renewable_percentage) {
        metricsToInsert.push({
          organization_id: organizationId,
          metric_date: `${year}-12-31`,
          pillar: "E",
          category: "energy",
          metric_name: "Renewable Energy Percentage",
          metric_value: data.metrics.energy.renewable_percentage,
          metric_unit: "%",
          framework: "GRI",
          framework_indicator: "GRI 302-1",
        });
      }
    }

    // Water metrics
    if (data.metrics.water) {
      metricsToInsert.push({
        organization_id: organizationId,
        metric_date: `${year}-12-31`,
        pillar: "E",
        category: "water",
        metric_name: "Water Consumption",
        metric_value: data.metrics.water.consumption,
        metric_unit: data.metrics.water.unit || "m³",
        framework: "GRI",
        framework_indicator: "GRI 303-5",
      });
    }

    // Waste metrics
    if (data.metrics.waste) {
      metricsToInsert.push({
        organization_id: organizationId,
        metric_date: `${year}-12-31`,
        pillar: "E",
        category: "waste",
        metric_name: "Total Waste Generated",
        metric_value: data.metrics.waste.total,
        metric_unit: data.metrics.waste.unit || "tons",
        framework: "GRI",
        framework_indicator: "GRI 306-3",
      });

      if (data.metrics.waste.recycling_rate) {
        metricsToInsert.push({
          organization_id: organizationId,
          metric_date: `${year}-12-31`,
          pillar: "E",
          category: "waste",
          metric_name: "Waste Diversion Rate",
          metric_value: data.metrics.waste.recycling_rate,
          metric_unit: "%",
          framework: "GRI",
          framework_indicator: "GRI 306-4",
        });
      }
    }

    if (metricsToInsert.length > 0) {
      const { error: _error } = await supabase
        .from("esg_metrics")
        .insert(metricsToInsert);

      if (!error) {
        results.metrics = metricsToInsert.length;
      }
    }
  }

  // Extract and store targets if mentioned
  if (data.targets) {
    // Process sustainability targets
    // This would extract net-zero commitments, SBTi targets, etc.
  }

  return results;
}

async function generateInsights(data: any, organizationId: string) {
  const insights = {
    trends: [] as Array<{
      metric: string;
      change: number;
      assessment: string;
      significance: string;
    }>,
    opportunities: [] as Array<{
      area: string;
      current: any;
      potential: string;
      impact: string;
    }>,
    risks: [] as Array<any>,
    benchmarks: [] as Array<any>,
  };

  // Analyze year-over-year changes
  if (data.changes) {
    for (const [metric, change] of Object.entries(data.changes)) {
      if (typeof change === "number") {
        insights.trends.push({
          metric,
          change,
          assessment: change < 0 ? "improving" : "worsening",
          significance: Math.abs(change) > 10 ? "high" : "moderate",
        });
      }
    }
  }

  // Identify improvement opportunities
  if (data.metrics?.energy?.renewable_percentage < 50) {
    insights.opportunities.push({
      area: "Renewable Energy",
      current: data.metrics.energy.renewable_percentage,
      potential:
        "Increase renewable energy adoption to reduce Scope 2 emissions",
      impact: "high",
    });
  }

  // Compare with industry benchmarks
  // This would query industry averages and compare

  return insights;
}

// Helper function to interpolate monthly data from annual totals
async function generateMonthlyBreakdown(
  annualData: any,
  organizationId: string,
  year: number,
) {
  // Seasonal patterns for different metrics
  const patterns = {
    energy: [
      1.15, 1.12, 1.08, 1.02, 0.95, 0.88, 0.85, 0.87, 0.92, 0.98, 1.05, 1.13,
    ],
    water: [
      0.95, 0.95, 0.98, 1.02, 1.08, 1.15, 1.18, 1.17, 1.1, 1.02, 0.98, 0.92,
    ],
  };

  const monthlyData = [];

  for (let month = 1; month <= 12; month++) {
    const monthStr = `${year}-${month.toString().padStart(2, "0")}-15`;

    // Energy breakdown
    if (annualData.energy) {
      const monthlyEnergy =
        (annualData.energy.total / 12) * (patterns.energy[month - 1] || 1);

      monthlyData.push({
        organization_id: organizationId,
        emission_date: monthStr,
        source_type: "organization",
        scope: 2,
        category: "electricity",
        activity_data: monthlyEnergy,
        activity_unit: "MWh",
        emission_factor: 0.433,
        emissions_amount: monthlyEnergy * 433, // kg CO2e
        data_quality: "estimated",
        data_source: "interpolated_from_annual",
      });
    }
  }

  return monthlyData;
}
