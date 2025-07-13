import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({
  apiKey: process.env['OPENAI_API_KEY']!,
});

const supabase = createClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['SUPABASE_SERVICE_ROLE_KEY']!,
);

/**
 * Simple report extraction using OpenAI
 * No need to reinvent - just use what works!
 */
export async function extractSustainabilityReport(
  pdfText: string,
  organizationId: string,
  year?: number,
) {
  // 1. Use OpenAI to extract structured data
  const extraction = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      {
        role: "system",
        content: `Extract sustainability metrics from this report. Return JSON with:
        - emissions (scope1, scope2, scope3 in tonnes CO2e)
        - energy (total consumption, renewable %)
        - water (consumption in m³)
        - waste (total, recycled % )
        - Any GRI indicators mentioned
        Include exact values and units.`,
      },
      {
        role: "user",
        content: pdfText,
      },
    ],
    temperature: 0.1,
    response_format: { type: "json_object" },
  });

  const data = JSON.parse(extraction.choices[0].message.content || "{}");

  // 2. Store in our database
  const reportYear = year || data.year || new Date().getFullYear();

  // Store emissions
  if (data.emissions) {
    const emissions = [];

    for (const [scope, value] of Object.entries(data.emissions)) {
      if (typeof value === "number") {
        emissions.push({
          organization_id: organizationId,
          emission_date: `${reportYear}-12-31`,
          source_type: "organization",
          scope: parseInt(scope.replace(/\D/g, "")),
          category: `annual_${scope}`,
          activity_data: value,
          activity_unit: "tCO2e",
          emission_factor: 1,
          emissions_amount: value * 1000, // Convert to kg
          data_source: "sustainability_report",
          confidence_score: 0.95,
        });
      }
    }

    await supabase.from("emissions").insert(emissions);
  }

  // 3. Generate insights using AI
  const insights = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      {
        role: "system",
        content:
          "Provide 3 key insights and 3 recommendations based on this sustainability data.",
      },
      {
        role: "user",
        content: JSON.stringify(data),
      },
    ],
  });

  return {
    extracted: data,
    insights: insights.choices[0].message.content,
    status: "success",
  };
}

/**
 * Compare with industry benchmarks
 */
export async function compareWithIndustry(data: any, industry: string) {
  const comparison = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      {
        role: "system",
        content: `Compare these sustainability metrics with ${industry} industry averages. 
        Indicate if performance is: Leading (top 10%), Above Average, Average, or Below Average.`,
      },
      {
        role: "user",
        content: JSON.stringify(data),
      },
    ],
  });

  return comparison.choices[0].message.content;
}

/**
 * Generate future projections
 */
export async function generateProjections(historicalData: any[]) {
  const projections = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      {
        role: "system",
        content:
          "Based on historical trends, project next year's sustainability metrics. Consider improvement rates and targets.",
      },
      {
        role: "user",
        content: JSON.stringify(historicalData),
      },
    ],
    response_format: { type: "json_object" },
  });

  return JSON.parse(projections.choices[0].message.content || "{}");
}
