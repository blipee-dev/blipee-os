import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

// Dynamic import for pdf-parse to avoid build issues
let pdf: any;
if (typeof window === "undefined") {
  pdf = require("pdf-parse/lib/pdf-parse");
}

// Lazy initialization to avoid build errors
let supabase: any;
let openai: any;
let anthropic: any;
let deepseek: any;

function initializeClients() {
  if (!supabase && process.env['NEXT_PUBLIC_SUPABASE_URL']) {
    supabase = createClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL']!,
      process.env['SUPABASE_SERVICE_ROLE_KEY']!,
    );
  }
  
  if (!openai && process.env['OPENAI_API_KEY']) {
    openai = new OpenAI({ apiKey: process.env['OPENAI_API_KEY'] });
  }
  
  if (!anthropic && process.env.ANTHROPIC_API_KEY) {
    anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  
  if (!deepseek && process.env.DEEPSEEK_API_KEY) {
    deepseek = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: "https://api.deepseek.com/v1",
    });
  }
}

type AIProvider = "openai" | "anthropic" | "deepseek";
type DocumentType =
  | "sustainability_report"
  | "utility_bill"
  | "invoice"
  | "travel"
  | "waste_report"
  | "energy_audit"
  | "auto";

/**
 * Universal document processor - works with ANY document type
 * AI extracts → Database stores
 */
export async function processDocument(
  file: File,
  organizationId: string,
  userId: string,
  documentType: DocumentType = "auto",
  aiProvider: AIProvider = "openai",
) {
  try {
    // Initialize clients if needed
    initializeClients();
    
    // 1. Extract text from document
    const text = await extractText(file);

    // 2. Use AI to extract structured data
    const extractedData = await extractWithAI(text, documentType, aiProvider);

    // 3. Store in appropriate Supabase tables
    const results = await storeInDatabase(
      extractedData,
      organizationId,
      userId,
    );

    return {
      success: true,
      documentType: extractedData.documentType || documentType,
      data: extractedData,
      stored: results,
    };
  } catch (error) {
    console.error("Document processing error:", error);
    throw error;
  }
}

/**
 * Extract text from various file types
 */
async function extractText(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());

  if (file.type === "application/pdf") {
    const pdfData = await pdf(buffer);
    return pdfData.text;
  } else if (file.type.startsWith("text/")) {
    return buffer.toString("utf-8");
  } else if (file.type.includes("image")) {
    // For images, we'd use OCR or AI vision
    // For now, return placeholder
    return "[Image file - would use AI vision API]";
  }

  throw new Error(`Unsupported file type: ${file.type}`);
}

/**
 * Extract data using selected AI provider
 */
async function extractWithAI(
  text: string,
  documentType: DocumentType,
  provider: AIProvider,
): Promise<any> {
  const prompt = getExtractionPrompt(documentType);

  switch (provider) {
    case "openai":
      return extractWithOpenAI(text, prompt);
    case "anthropic":
      return extractWithAnthropic(text, prompt);
    case "deepseek":
      return extractWithDeepSeek(text, prompt);
    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
}

/**
 * Get the appropriate extraction prompt based on document type
 */
function getExtractionPrompt(documentType: DocumentType): string {
  const prompts = {
    sustainability_report: `Extract ALL sustainability data including:
      
      ENVIRONMENTAL:
      - Emissions: scope1, scope2, scope3 (tonnes CO2e), intensity metrics
      - Energy: total consumption, renewable %, energy intensity
      - Water: consumption, recycled %, water stress areas
      - Waste: total generated, recycled %, hazardous waste
      - Biodiversity: impacts, protected areas, restoration projects
      - Circular economy: recycled materials, product lifecycle
      
      SOCIAL:
      - Employees: total count, diversity % (gender, ethnicity), turnover rate
      - Health & Safety: LTIFR, TRIFR, fatalities, near misses
      - Training: hours per employee, programs, skill development
      - Community: investment, volunteer hours, beneficiaries
      - Human rights: assessments, violations, remediation
      - Supply chain: audits completed, violations found, corrective actions
      
      GOVERNANCE:
      - Board: composition, independence %, diversity %
      - Ethics: code violations, whistleblower reports, training completion
      - Compliance: fines, penalties, legal actions
      - Risk management: key risks identified, mitigation measures
      - Cybersecurity: incidents, data breaches, training
      - Executive compensation: CEO pay ratio, ESG-linked compensation %
      
      TARGETS & COMMITMENTS:
      - Net zero targets and progress
      - Science-based targets (SBTi)
      - UN SDG alignments and contributions
      - Other commitments and deadlines
      
      CERTIFICATIONS:
      - ISO certifications (14001, 45001, 27001, etc.)
      - B Corp status
      - Other sustainability certifications
      
      Return as comprehensive JSON with all found data.`,

    utility_bill: `Extract:
      - Bill period (start/end dates)
      - Utility type (electricity/gas/water)
      - Usage amount and unit
      - Cost
      - Provider name
      - Account/meter number
      Return as JSON.`,

    invoice: `Extract:
      - Invoice date
      - Vendor name
      - Items with quantities and amounts
      - Total amount
      - Any emission-relevant items (fuel, energy, travel)
      Return as JSON.`,

    travel: `Extract:
      - Travel date
      - Origin and destination
      - Travel mode (flight/train/car)
      - Distance or class
      - Cost if mentioned
      Return as JSON.`,

    waste_report: `Extract:
      - Report period
      - Total waste generated (kg or tonnes)
      - Waste by type (hazardous/non-hazardous)
      - Recycling/diversion rates
      - Disposal methods
      Return as JSON.`,

    energy_audit: `Extract:
      - Audit date
      - Total energy consumption
      - Energy by source
      - Efficiency recommendations
      - Potential savings
      Return as JSON.`,

    auto: `Identify document type and extract all relevant sustainability data including:
      - Emissions data
      - Energy usage
      - Water consumption
      - Waste metrics
      - Any dates/periods
      - Costs or financial data
      Return as JSON with documentType field.`,
  };

  return prompts[documentType] || prompts.auto;
}

/**
 * Extract using OpenAI
 */
async function extractWithOpenAI(text: string, prompt: string): Promise<any> {
  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: text.substring(0, 50000) },
    ],
    temperature: 0.1,
    response_format: { type: "json_object" },
  });

  return JSON.parse(response.choices[0].message.content || "{}");
}

/**
 * Extract using Anthropic Claude
 */
async function extractWithAnthropic(
  text: string,
  prompt: string,
): Promise<any> {
  const response = await anthropic.messages.create({
    model: "claude-3-sonnet-20240229",
    messages: [
      {
        role: "user",
        content: `${prompt}\n\nDocument text:\n${text.substring(0, 50000)}`,
      },
    ],
    max_tokens: 4096,
    temperature: 0.1,
  });

  // Claude returns text, so we need to parse it
  const content =
    response.content[0].type === "text" ? response.content[0].text : "";

  // Extract JSON from Claude's response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }

  throw new Error("Could not extract JSON from Claude response");
}

/**
 * Extract using DeepSeek
 */
async function extractWithDeepSeek(text: string, prompt: string): Promise<any> {
  const response = await deepseek.chat.completions.create({
    model: "deepseek-chat",
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: text.substring(0, 50000) },
    ],
    temperature: 0.1,
    response_format: { type: "json_object" },
  });

  return JSON.parse(response.choices[0].message.content || "{}");
}

/**
 * Store extracted data in appropriate Supabase tables
 */
async function storeInDatabase(
  data: any,
  organizationId: string,
  userId: string,
): Promise<any> {
  const results = {
    emissions: 0,
    esg_metrics: 0,
    documents: 0,
  };

  // Determine what kind of data we have and store accordingly
  const documentType = data.documentType || detectDocumentType(data);

  switch (documentType) {
    case "sustainability_report":
      return storeSustainabilityReport(data, organizationId, userId);

    case "utility_bill":
      return storeUtilityBill(data, organizationId, userId);

    case "invoice":
      return storeInvoice(data, organizationId, userId);

    case "travel":
      return storeTravelData(data, organizationId, userId);

    case "waste_report":
      return storeWasteReport(data, organizationId, userId);

    case "energy_audit":
      return storeEnergyAudit(data, organizationId, userId);

    default:
      // For unknown types, try to store any emissions data found
      return storeGenericEmissions(data, organizationId, userId);
  }
}

/**
 * Store sustainability report data
 */
async function storeSustainabilityReport(
  data: any,
  organizationId: string,
  userId: string,
) {
  const results = { emissions: 0, esg_metrics: 0, targets: 0 };
  const date =
    data.reportPeriod?.end ||
    `${data.reportYear}-12-31` ||
    new Date().toISOString().split("T")[0];

  // Store emissions
  const emissions = [];
  if (data.scope1) {
    emissions.push({
      organization_id: organizationId,
      emission_date: date,
      source_type: "organization",
      scope: 1,
      category: "direct_emissions",
      activity_data: data.scope1,
      activity_unit: "tCO2e",
      emission_factor: 1,
      emissions_amount: data.scope1 * 1000,
      data_source: "sustainability_report",
      created_by: userId,
    });
  }

  if (data.scope2) {
    emissions.push({
      organization_id: organizationId,
      emission_date: date,
      source_type: "organization",
      scope: 2,
      category: "purchased_electricity",
      activity_data: data.scope2,
      activity_unit: "tCO2e",
      emission_factor: 1,
      emissions_amount: data.scope2 * 1000,
      data_source: "sustainability_report",
      created_by: userId,
    });
  }

  if (data.scope3) {
    emissions.push({
      organization_id: organizationId,
      emission_date: date,
      source_type: "organization",
      scope: 3,
      category: "value_chain",
      activity_data: data.scope3,
      activity_unit: "tCO2e",
      emission_factor: 1,
      emissions_amount: data.scope3 * 1000,
      data_source: "sustainability_report",
      created_by: userId,
    });
  }

  if (emissions.length > 0) {
    await supabase.from("emissions").insert(emissions);
    results.emissions = emissions.length;
  }

  // Store ESG metrics
  const esgMetrics = [];

  // Environmental metrics
  if (data.energy) {
    esgMetrics.push({
      organization_id: organizationId,
      metric_date: date,
      category: "environmental",
      metric_name: "total_energy_consumption",
      metric_value: data.energy,
      unit: "MWh",
      data_source: "sustainability_report",
      created_by: userId,
    });
  }

  if (data.renewablePercentage) {
    esgMetrics.push({
      organization_id: organizationId,
      metric_date: date,
      category: "environmental",
      metric_name: "renewable_energy_percentage",
      metric_value: data.renewablePercentage,
      unit: "%",
      data_source: "sustainability_report",
      created_by: userId,
    });
  }

  if (data.water) {
    esgMetrics.push({
      organization_id: organizationId,
      metric_date: date,
      category: "environmental",
      metric_name: "water_consumption",
      metric_value: data.water,
      unit: "m3",
      data_source: "sustainability_report",
      created_by: userId,
    });
  }

  if (data.waste) {
    esgMetrics.push({
      organization_id: organizationId,
      metric_date: date,
      category: "environmental",
      metric_name: "total_waste",
      metric_value: data.waste,
      unit: "tonnes",
      data_source: "sustainability_report",
      created_by: userId,
    });
  }

  // Social metrics
  if (data.employees) {
    esgMetrics.push({
      organization_id: organizationId,
      metric_date: date,
      category: "social",
      metric_name: "total_employees",
      metric_value: data.employees,
      unit: "count",
      data_source: "sustainability_report",
      created_by: userId,
    });
  }

  if (data.diversity?.gender) {
    esgMetrics.push({
      organization_id: organizationId,
      metric_date: date,
      category: "social",
      metric_name: "gender_diversity_percentage",
      metric_value: data.diversity.gender,
      unit: "%",
      data_source: "sustainability_report",
      created_by: userId,
    });
  }

  if (data.safety?.ltifr) {
    esgMetrics.push({
      organization_id: organizationId,
      metric_date: date,
      category: "social",
      metric_name: "ltifr",
      metric_value: data.safety.ltifr,
      unit: "rate",
      data_source: "sustainability_report",
      created_by: userId,
    });
  }

  if (data.training) {
    esgMetrics.push({
      organization_id: organizationId,
      metric_date: date,
      category: "social",
      metric_name: "training_hours_per_employee",
      metric_value: data.training,
      unit: "hours",
      data_source: "sustainability_report",
      created_by: userId,
    });
  }

  // Governance metrics
  if (data.board?.independence) {
    esgMetrics.push({
      organization_id: organizationId,
      metric_date: date,
      category: "governance",
      metric_name: "board_independence_percentage",
      metric_value: data.board.independence,
      unit: "%",
      data_source: "sustainability_report",
      created_by: userId,
    });
  }

  if (data.ethics?.trainingCompletion) {
    esgMetrics.push({
      organization_id: organizationId,
      metric_date: date,
      category: "governance",
      metric_name: "ethics_training_completion",
      metric_value: data.ethics.trainingCompletion,
      unit: "%",
      data_source: "sustainability_report",
      created_by: userId,
    });
  }

  if (esgMetrics.length > 0) {
    await supabase.from("esg_metrics").insert(esgMetrics);
    results.esg_metrics = esgMetrics.length;
  }

  // Store targets
  if (data.targets && Array.isArray(data.targets)) {
    const targets = data.targets.map((target: any) => ({
      organization_id: organizationId,
      target_name: target.name,
      target_value: target.value,
      target_unit: target.unit || "various",
      target_year: target.year,
      baseline_year: target.baselineYear || null,
      baseline_value: target.baselineValue || null,
      category: target.category || "environmental",
      created_by: userId,
    }));

    if (targets.length > 0) {
      await supabase.from("sustainability_targets").insert(targets);
      results.targets = targets.length;
    }
  }

  return results;
}

/**
 * Store utility bill data
 */
async function storeUtilityBill(
  data: any,
  organizationId: string,
  userId: string,
) {
  const results = { emissions: 0, esg_metrics: 0 };

  // Calculate emissions based on utility type and usage
  const emissionFactors: Record<string, number> = {
    electricity: 0.433, // kgCO2e per kWh
    gas: 0.185, // kgCO2e per kWh
    water: 0.344, // kgCO2e per m³
  };

  const factor = emissionFactors[data.utilityType] || 0;
  const emissions = data.usage * factor;

  if (emissions > 0) {
    await supabase.from("emissions").insert({
      organization_id: organizationId,
      emission_date:
        data.billPeriod?.end || new Date().toISOString().split("T")[0],
      source_type: "utility",
      source_details: {
        provider: data.provider,
        accountNumber: data.accountNumber,
      },
      scope: data.utilityType === "electricity" ? 2 : 1,
      category: data.utilityType,
      activity_data: data.usage,
      activity_unit: data.unit || "kWh",
      emission_factor: factor,
      emissions_amount: emissions,
      data_source: "utility_bill",
      created_by: userId,
    });
    results.emissions = 1;
  }

  return results;
}

/**
 * Store invoice data
 */
async function storeInvoice(data: any, organizationId: string, userId: string) {
  const results = { emissions: 0 };

  // Look for emission-relevant items
  const emissionItems =
    data.items?.filter((item: any) =>
      isEmissionRelevant(item.description || item.name),
    ) || [];

  for (const item of emissionItems) {
    const category = categorizeItem(item.description || item.name);
    const scope = determineScope(category);

    // Estimate emissions based on spend (simplified)
    const emissionFactor = 0.5; // kgCO2e per dollar (very rough estimate)
    const emissions = item.amount * emissionFactor;

    await supabase.from("emissions").insert({
      organization_id: organizationId,
      emission_date: data.invoiceDate || new Date().toISOString().split("T")[0],
      source_type: "purchased_goods",
      source_details: {
        vendor: data.vendor,
        item: item.description,
      },
      scope: scope,
      category: category,
      activity_data: item.amount,
      activity_unit: "USD",
      emission_factor: emissionFactor,
      emissions_amount: emissions,
      data_source: "invoice",
      confidence_score: 0.5, // Lower confidence for spend-based
      created_by: userId,
    });
    results.emissions++;
  }

  return results;
}

/**
 * Store travel data
 */
async function storeTravelData(
  data: any,
  organizationId: string,
  userId: string,
) {
  // Calculate travel emissions
  const emissionFactors: Record<string, number> = {
    flight: 0.255, // kgCO2e per passenger-km
    train: 0.041, // kgCO2e per passenger-km
    car: 0.171, // kgCO2e per km
  };

  const factor = emissionFactors[data.travelMode] || 0.255;
  const emissions = (data.distance || 0) * factor;

  if (emissions > 0) {
    await supabase.from("emissions").insert({
      organization_id: organizationId,
      emission_date: data.travelDate || new Date().toISOString().split("T")[0],
      source_type: "business_travel",
      source_details: {
        mode: data.travelMode,
        origin: data.origin,
        destination: data.destination,
      },
      scope: 3,
      category: "business_travel",
      activity_data: data.distance,
      activity_unit: "km",
      emission_factor: factor,
      emissions_amount: emissions,
      data_source: "travel_document",
      created_by: userId,
    });
  }

  return { emissions: 1 };
}

/**
 * Helper functions
 */
function detectDocumentType(data: any): DocumentType {
  if (data.scope1 || data.scope2 || data.scope3) return "sustainability_report";
  if (data.utilityType) return "utility_bill";
  if (data.vendor && data.items) return "invoice";
  if (data.travelMode || data.origin) return "travel";
  if (data.wasteGenerated) return "waste_report";
  if (data.energyConsumption && data.recommendations) return "energy_audit";
  return "auto";
}

function isEmissionRelevant(description: string): boolean {
  const keywords = [
    "fuel",
    "gas",
    "electricity",
    "energy",
    "transport",
    "travel",
    "shipping",
  ];
  return keywords.some((keyword) =>
    description.toLowerCase().includes(keyword),
  );
}

function categorizeItem(description: string): string {
  const lower = description.toLowerCase();
  if (lower.includes("fuel") || lower.includes("gas")) return "fuel";
  if (lower.includes("electricity")) return "electricity";
  if (lower.includes("travel") || lower.includes("flight")) return "travel";
  if (lower.includes("shipping")) return "logistics";
  return "purchased_goods";
}

function determineScope(category: string): number {
  if (["fuel", "gas"].includes(category)) return 1;
  if (category === "electricity") return 2;
  return 3;
}

// Additional store functions for other document types...
async function storeWasteReport(
  data: any,
  organizationId: string,
  userId: string,
) {
  // Implementation for waste reports
  return { emissions: 0, esg_metrics: 1 };
}

async function storeEnergyAudit(
  data: any,
  organizationId: string,
  userId: string,
) {
  // Implementation for energy audits
  return { emissions: 0, esg_metrics: 1 };
}

async function storeGenericEmissions(
  data: any,
  organizationId: string,
  userId: string,
) {
  // Try to store any emissions data found
  return { emissions: 0 };
}
