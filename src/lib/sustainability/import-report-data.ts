import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

// Dynamic import for pdf-parse to avoid build issues
let pdf: any;
if (typeof window === "undefined") {
  pdf = require("pdf-parse/lib/pdf-parse");
}

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

/**
 * Main function to import sustainability report data into Supabase
 */
export async function importSustainabilityReport(
  file: File,
  organizationId: string,
  userId: string,
) {
  try {
    // Initialize clients if needed
    initializeClients();
    
    // 1. Extract text from PDF
    const buffer = Buffer.from(await file.arrayBuffer());
    const pdfData = await pdf(buffer);

    // 2. Use OpenAI to extract structured data
    const extractedData = await extractDataWithAI(pdfData.text);

    // 3. Insert data into Supabase tables
    const results = await insertIntoSupabase(
      extractedData,
      organizationId,
      userId,
    );

    return {
      success: true,
      data: extractedData,
      inserted: results,
    };
  } catch (error) {
    console.error("Error importing report:", error);
    throw error;
  }
}

/**
 * Extract data using OpenAI
 */
async function extractDataWithAI(reportText: string) {
  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      {
        role: "system",
        content: `Extract the following data from the sustainability report:
        
        1. Report metadata:
           - company_name
           - report_year
           - reporting_period (start and end dates)
        
        2. Emissions data (with dates):
           - scope1_emissions (tonnes CO2e)
           - scope2_emissions (tonnes CO2e) 
           - scope3_emissions (tonnes CO2e)
           - emission_date (use end of reporting period)
        
        3. ESG metrics:
           - energy_consumption (MWh or GJ with unit)
           - renewable_energy_percentage
           - water_consumption (m³ or gallons with unit)
           - waste_generated (tonnes)
           - waste_recycled (tonnes)
           - waste_diverted_percentage
        
        4. Targets (if mentioned):
           - net_zero_target_year
           - emission_reduction_target_percentage
           - renewable_energy_target_percentage
           - target_baseline_year
        
        Return as JSON with exact values from the report.`,
      },
      {
        role: "user",
        content: reportText.substring(0, 50000), // First 50k chars
      },
    ],
    temperature: 0.1,
    response_format: { type: "json_object" },
  });

  return JSON.parse(response.choices[0].message.content || "{}");
}

/**
 * Insert extracted data into Supabase tables
 */
async function insertIntoSupabase(
  data: any,
  organizationId: string,
  userId: string,
) {
  const results = {
    emissions: 0,
    esg_metrics: 0,
    targets: 0,
    compliance: 0,
  };

  // Determine emission date (end of reporting period or year-end)
  const emissionDate =
    data.reporting_period?.end || `${data.report_year}-12-31`;

  // 1. Insert emissions data
  const emissionsToInsert = [];

  // Scope 1
  if (data.scope1_emissions) {
    emissionsToInsert.push({
      organization_id: organizationId,
      emission_date: emissionDate,
      source_type: "organization",
      source_details: {
        report_year: data.report_year,
        company: data.company_name,
      },
      module_id: "reporting",
      scope: 1,
      category: "direct_emissions",
      activity_data: data.scope1_emissions,
      activity_unit: "tCO2e",
      emission_factor: 1,
      emissions_amount: data.scope1_emissions * 1000, // Convert to kg
      emissions_unit: "kgCO2e",
      data_quality: "measured",
      data_source: "sustainability_report",
      confidence_score: 0.95,
      created_by: userId,
    });
  }

  // Scope 2
  if (data.scope2_emissions) {
    emissionsToInsert.push({
      organization_id: organizationId,
      emission_date: emissionDate,
      source_type: "organization",
      source_details: {
        report_year: data.report_year,
        company: data.company_name,
      },
      module_id: "reporting",
      scope: 2,
      category: "purchased_electricity",
      activity_data: data.scope2_emissions,
      activity_unit: "tCO2e",
      emission_factor: 1,
      emissions_amount: data.scope2_emissions * 1000,
      emissions_unit: "kgCO2e",
      data_quality: "measured",
      data_source: "sustainability_report",
      confidence_score: 0.95,
      created_by: userId,
    });
  }

  // Scope 3
  if (data.scope3_emissions) {
    emissionsToInsert.push({
      organization_id: organizationId,
      emission_date: emissionDate,
      source_type: "organization",
      source_details: {
        report_year: data.report_year,
        company: data.company_name,
      },
      module_id: "reporting",
      scope: 3,
      category: "value_chain",
      activity_data: data.scope3_emissions,
      activity_unit: "tCO2e",
      emission_factor: 1,
      emissions_amount: data.scope3_emissions * 1000,
      emissions_unit: "kgCO2e",
      data_quality: "measured",
      data_source: "sustainability_report",
      confidence_score: 0.9, // Usually less certain for Scope 3
      created_by: userId,
    });
  }

  if (emissionsToInsert.length > 0) {
    const { error } = await supabase
      .from("emissions")
      .insert(emissionsToInsert);

    if (!error) {
      results.emissions = emissionsToInsert.length;
    } else {
      console.error("Error inserting emissions:", error);
    }
  }

  // 2. Insert ESG metrics
  const metricsToInsert = [];
  const metricDate = emissionDate;

  // Energy consumption
  if (data.energy_consumption) {
    metricsToInsert.push({
      organization_id: organizationId,
      metric_date: metricDate,
      pillar: "E",
      category: "energy",
      metric_name: "Total Energy Consumption",
      metric_value: data.energy_consumption.value || data.energy_consumption,
      metric_unit: data.energy_consumption.unit || "MWh",
      framework: "GRI",
      framework_indicator: "GRI 302-1",
    });
  }

  // Renewable energy
  if (data.renewable_energy_percentage) {
    metricsToInsert.push({
      organization_id: organizationId,
      metric_date: metricDate,
      pillar: "E",
      category: "energy",
      metric_name: "Renewable Energy Percentage",
      metric_value: data.renewable_energy_percentage,
      metric_unit: "%",
      framework: "GRI",
      framework_indicator: "GRI 302-1",
    });
  }

  // Water consumption
  if (data.water_consumption) {
    metricsToInsert.push({
      organization_id: organizationId,
      metric_date: metricDate,
      pillar: "E",
      category: "water",
      metric_name: "Water Consumption",
      metric_value: data.water_consumption.value || data.water_consumption,
      metric_unit: data.water_consumption.unit || "m³",
      framework: "GRI",
      framework_indicator: "GRI 303-5",
    });
  }

  // Waste metrics
  if (data.waste_generated) {
    metricsToInsert.push({
      organization_id: organizationId,
      metric_date: metricDate,
      pillar: "E",
      category: "waste",
      metric_name: "Total Waste Generated",
      metric_value: data.waste_generated,
      metric_unit: "tonnes",
      framework: "GRI",
      framework_indicator: "GRI 306-3",
    });
  }

  if (data.waste_diverted_percentage) {
    metricsToInsert.push({
      organization_id: organizationId,
      metric_date: metricDate,
      pillar: "E",
      category: "waste",
      metric_name: "Waste Diversion Rate",
      metric_value: data.waste_diverted_percentage,
      metric_unit: "%",
      framework: "GRI",
      framework_indicator: "GRI 306-4",
    });
  }

  if (metricsToInsert.length > 0) {
    const { error } = await supabase
      .from("esg_metrics")
      .insert(metricsToInsert);

    if (!error) {
      results.esg_metrics = metricsToInsert.length;
    } else {
      console.error("Error inserting ESG metrics:", error);
    }
  }

  // 3. Insert or update targets
  if (data.net_zero_target_year || data.emission_reduction_target_percentage) {
    const targetsToInsert = [];

    if (data.net_zero_target_year) {
      targetsToInsert.push({
        organization_id: organizationId,
        target_name: "Net Zero Emissions",
        target_type: "net_zero",
        target_category: "emissions",
        scope_coverage: [1, 2, 3],
        baseline_year: data.target_baseline_year || data.report_year,
        baseline_value:
          (data.scope1_emissions || 0) +
          (data.scope2_emissions || 0) +
          (data.scope3_emissions || 0),
        baseline_unit: "tCO2e",
        target_year: data.net_zero_target_year,
        target_value: 0,
        target_unit: "tCO2e",
        framework: "SBTi",
        public_commitment: true,
        commitment_date: emissionDate,
        status: "active",
      });
    }

    if (data.renewable_energy_target_percentage) {
      targetsToInsert.push({
        organization_id: organizationId,
        target_name: "Renewable Energy Target",
        target_type: "renewable",
        target_category: "energy",
        scope_coverage: [2],
        baseline_year: data.report_year,
        baseline_value: data.renewable_energy_percentage || 0,
        baseline_unit: "%",
        target_year: 2030, // Default if not specified
        target_value: data.renewable_energy_target_percentage,
        target_unit: "%",
        framework: "RE100",
        status: "active",
      });
    }

    if (targetsToInsert.length > 0) {
      const { error } = await supabase
        .from("sustainability_targets")
        .insert(targetsToInsert);

      if (!error) {
        results.targets = targetsToInsert.length;
      } else {
        console.error("Error inserting targets:", error);
      }
    }
  }

  // 4. Create compliance activity record
  const { error: complianceError } = await supabase
    .from("compliance_activities")
    .insert({
      organization_id: organizationId,
      activity_name: `${data.report_year} Sustainability Report`,
      activity_type: "report",
      framework: "GRI",
      reporting_period_start:
        data.reporting_period?.start || `${data.report_year}-01-01`,
      reporting_period_end:
        data.reporting_period?.end || `${data.report_year}-12-31`,
      submission_date: new Date().toISOString().split("T")[0],
      status: "submitted",
      completion_percentage: 100,
      documents: [
        {
          type: "sustainability_report",
          year: data.report_year,
          uploaded_at: new Date().toISOString(),
        },
      ],
    });

  if (!complianceError) {
    results.compliance = 1;
  }

  return results;
}

/**
 * Generate monthly breakdown from annual data
 */
export async function generateMonthlyBreakdown(
  organizationId: string,
  annualData: any,
  year: number,
) {
  // Seasonal patterns
  const patterns = {
    energy: [
      1.15, 1.12, 1.08, 1.02, 0.95, 0.88, 0.85, 0.87, 0.92, 0.98, 1.05, 1.13,
    ],
    water: [
      0.95, 0.95, 0.98, 1.02, 1.08, 1.15, 1.18, 1.17, 1.1, 1.02, 0.98, 0.92,
    ],
  };

  const monthlyEmissions = [];
  const monthlyMetrics = [];

  for (let month = 1; month <= 12; month++) {
    const monthDate = `${year}-${month.toString().padStart(2, "0")}-15`;
    const energyFactor = patterns.energy[month - 1];
    const waterFactor = patterns.water[month - 1];

    // Monthly emissions
    if (annualData.scope2_emissions) {
      const monthlyScope2 = (annualData.scope2_emissions / 12) * energyFactor;

      monthlyEmissions.push({
        organization_id: organizationId,
        emission_date: monthDate,
        source_type: "organization",
        scope: 2,
        category: "purchased_electricity",
        activity_data: monthlyScope2,
        activity_unit: "tCO2e",
        emission_factor: 1,
        emissions_amount: monthlyScope2 * 1000,
        data_quality: "estimated",
        data_source: "interpolated_from_annual",
        confidence_score: 0.8,
      });
    }

    // Monthly energy metrics
    if (annualData.energy_consumption) {
      const monthlyEnergy = (annualData.energy_consumption / 12) * energyFactor;

      monthlyMetrics.push({
        organization_id: organizationId,
        metric_date: monthDate,
        pillar: "E",
        category: "energy",
        metric_name: "Monthly Energy Consumption",
        metric_value: monthlyEnergy,
        metric_unit: "MWh",
        framework: "GRI",
        framework_indicator: "GRI 302-1",
      });
    }
  }

  // Insert monthly data
  if (monthlyEmissions.length > 0) {
    await supabase.from("emissions").insert(monthlyEmissions);
  }

  if (monthlyMetrics.length > 0) {
    await supabase.from("esg_metrics").insert(monthlyMetrics);
  }

  return {
    emissions: monthlyEmissions.length,
    metrics: monthlyMetrics.length,
  };
}
