import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";

export interface SustainabilityContext {
  organization: {
    id: string;
    name: string;
    enabledModules: string[];
  };
  emissions: {
    current: {
      scope1: number;
      scope2: number;
      scope3: number;
      total: number;
      trend: "increasing" | "decreasing" | "stable";
      percentageChange: number;
    };
    bySource: Array<{
      source: string;
      amount: number;
      percentage: number;
    }>;
    historicalTrend: Array<{
      date: string;
      total: number;
    }>;
  };
  targets: Array<{
    name: string;
    targetYear: number;
    targetValue: number;
    currentProgress: number;
    status: "on-track" | "at-risk" | "off-track";
  }>;
  compliance: {
    frameworks: string[];
    upcomingDeadlines: Array<{
      framework: string;
      deadline: string;
      status: string;
    }>;
    dataCompleteness: number;
  };
  opportunities: Array<{
    action: string;
    potentialReduction: number;
    estimatedCost: number;
    roi: number;
    difficulty: "easy" | "medium" | "hard";
  }>;
  esgMetrics?: {
    environmental: number;
    social: number;
    governance: number;
  };
}

export async function buildSustainabilityContext(
  organizationId: string,
  supabase: ReturnType<typeof createClient<Database>>,
): Promise<SustainabilityContext> {
  // Get organization and enabled modules
  const { data: org } = await supabase
    .from("organizations")
    .select("id, name")
    .eq("id", organizationId)
    .single();

  const { data: modules } = await supabase
    .from("enabled_modules")
    .select("module_id")
    .eq("organization_id", organizationId)
    .eq("enabled", true);

  // Get current emissions (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: emissions } = await supabase
    .from("emissions")
    .select("scope, emissions_amount, source_type")
    .eq("organization_id", organizationId)
    .gte("emission_date", thirtyDaysAgo.toISOString());

  // Calculate emissions by scope
  const emissionsByScope = emissions?.reduce(
    (acc, e) => {
      const scope = `scope${e.scope}` as keyof typeof acc;
      acc[scope] += e.emissions_amount;
      return acc;
    },
    { scope1: 0, scope2: 0, scope3: 0 },
  ) || { scope1: 0, scope2: 0, scope3: 0 };

  const totalEmissions =
    emissionsByScope.scope1 + emissionsByScope.scope2 + emissionsByScope.scope3;

  // Calculate emissions by source
  const emissionsBySource =
    emissions?.reduce(
      (acc, e) => {
        const existing = acc.find((s) => s.source === e.source_type);
        if (existing) {
          existing.amount += e.emissions_amount;
        } else {
          acc.push({
            source: e.source_type,
            amount: e.emissions_amount,
            percentage: 0,
          });
        }
        return acc;
      },
      [] as Array<{ source: string; amount: number; percentage: number }>,
    ) || [];

  // Calculate percentages
  emissionsBySource.forEach((s) => {
    s.percentage = totalEmissions > 0 ? (s.amount / totalEmissions) * 100 : 0;
  });

  // Get targets
  const { data: targets } = await supabase
    .from("sustainability_targets")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("status", "active");

  // Get compliance activities
  const { data: compliance } = await supabase
    .from("compliance_activities")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("status", "pending")
    .order("due_date", { ascending: true })
    .limit(5);

  // Build context
  return {
    organization: {
      id: org?.id || organizationId,
      name: org?.name || "Organization",
      enabledModules: modules?.map((m) => m.module_id) || [],
    },
    emissions: {
      current: {
        scope1: emissionsByScope.scope1,
        scope2: emissionsByScope.scope2,
        scope3: emissionsByScope.scope3,
        total: totalEmissions,
        trend: "stable", // TODO: Calculate actual trend
        percentageChange: 0, // TODO: Calculate actual change
      },
      bySource: emissionsBySource.sort((a, b) => b.amount - a.amount),
      historicalTrend: [], // TODO: Fetch historical data
    },
    targets:
      targets?.map((t) => ({
        name: t.target_name,
        targetYear: t.target_year,
        targetValue: t.target_value,
        currentProgress: calculateProgress(
          t.baseline_value,
          t.current_value || t.baseline_value,
          t.target_value,
        ),
        status: determineTargetStatus(t),
      })) || [],
    compliance: {
      frameworks: Array.from(
        new Set(compliance?.map((c: any) => c.framework) || []),
      ),
      upcomingDeadlines:
        compliance?.map((c) => ({
          framework: c.framework,
          deadline: c.due_date,
          status: c.status,
        })) || [],
      dataCompleteness: 75, // TODO: Calculate actual completeness
    },
    opportunities: generateOpportunities(
      emissionsBySource,
      modules?.map((m) => m.module_id) || [],
    ),
    esgMetrics: {
      environmental: 72,
      social: 68,
      governance: 85,
    },
  };
}

function calculateProgress(
  baseline: number,
  current: number,
  target: number,
): number {
  if (baseline === target) return 100;
  const totalReduction = baseline - target;
  const currentReduction = baseline - current;
  return Math.round((currentReduction / totalReduction) * 100);
}

function determineTargetStatus(
  target: any,
): "on-track" | "at-risk" | "off-track" {
  const progress = calculateProgress(
    target.baseline_value,
    target.current_value || target.baseline_value,
    target.target_value,
  );
  const yearsElapsed = new Date().getFullYear() - target.baseline_year;
  const totalYears = target.target_year - target.baseline_year;
  const expectedProgress = (yearsElapsed / totalYears) * 100;

  if (progress >= expectedProgress - 5) return "on-track";
  if (progress >= expectedProgress - 15) return "at-risk";
  return "off-track";
}

function generateOpportunities(
  emissionsBySource: Array<{
    source: string;
    amount: number;
    percentage: number;
  }>,
  enabledModules: string[],
): Array<any> {
  const opportunities = [];

  // Generate opportunities based on emission sources
  if (
    emissionsBySource.find((s) => s.source === "building" && s.percentage > 30)
  ) {
    opportunities.push({
      action: "Switch to renewable energy for buildings",
      potentialReduction: 500,
      estimatedCost: 50000,
      roi: 3.2,
      difficulty: "medium",
    });
  }

  if (
    emissionsBySource.find((s) => s.source === "vehicle" && s.percentage > 20)
  ) {
    opportunities.push({
      action: "Transition fleet to electric vehicles",
      potentialReduction: 300,
      estimatedCost: 150000,
      roi: 4.5,
      difficulty: "hard",
    });
  }

  // Always suggest easy wins
  opportunities.push({
    action: "Implement employee awareness program",
    potentialReduction: 50,
    estimatedCost: 5000,
    roi: 2.0,
    difficulty: "easy",
  });

  return opportunities;
}

// Function to build prompt with sustainability context
export function buildSustainabilityPrompt(
  userMessage: string,
  context: SustainabilityContext,
): string {
  const contextSection = `
CURRENT SUSTAINABILITY CONTEXT:
- Organization: ${context.organization.name}
- Enabled Modules: ${context.organization.enabledModules.join(", ") || "None"}
- Total Emissions: ${context.emissions.current.total.toFixed(1)} kgCO2e (Scope 1: ${context.emissions.current.scope1.toFixed(1)}, Scope 2: ${context.emissions.current.scope2.toFixed(1)}, Scope 3: ${context.emissions.current.scope3.toFixed(1)})
- Emission Trend: ${context.emissions.current.trend} (${context.emissions.current.percentageChange > 0 ? "+" : ""}${context.emissions.current.percentageChange}%)
- Top Emission Sources: ${context.emissions.bySource
    .slice(0, 3)
    .map((s) => `${s.source} (${s.percentage.toFixed(1)}%)`)
    .join(", ")}
- Active Targets: ${context.targets.length} (${context.targets.filter((t) => t.status === "on-track").length} on track)
- Compliance Frameworks: ${context.compliance.frameworks.join(", ") || "None"}
- Upcoming Deadlines: ${context.compliance.upcomingDeadlines.length}
- ESG Scores: E:${context.esgMetrics?.environmental}/100, S:${context.esgMetrics?.social}/100, G:${context.esgMetrics?.governance}/100
`;

  return `${contextSection}

USER MESSAGE: ${userMessage}

Respond as a sustainability expert, focusing on emissions reduction, compliance, and business value. Include specific data and actionable recommendations.`;
}
