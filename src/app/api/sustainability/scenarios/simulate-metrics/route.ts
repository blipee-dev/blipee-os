import { NextRequest, NextResponse } from 'next/server';
import { getAPIUser } from '@/lib/auth/server-auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getPeriodEmissions } from '@/lib/sustainability/baseline-calculator';

interface MetricSimulation {
  metricId: string;
  metricName: string;
  currentEmissions: number;
  targetReduction: number;
  finalEmissions: number;
  initiatives: Initiative[];
  investment: number;
  payback: number;
  feasibility: number;
}

interface Initiative {
  name: string;
  impact: number;
  cost: number;
  timeline: string;
  difficulty: string;
}

export async function POST(request: NextRequest) {
  try {

    // Get current user
    const user = await getAPIUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { scenario, currentEmissions, siteId } = body;


    // Simulate each metric individually
    const metricSimulations: MetricSimulation[] = scenario.metricReductions.map((metric: any) => {
      const reduction = metric.currentEmissions * (metric.targetReduction / 100);
      const finalEmissions = metric.currentEmissions - reduction;

      // Generate initiatives based on metric type and reduction target
      const initiatives = generateMetricInitiatives(metric);

      // Calculate investment and payback
      const { investment, payback } = calculateMetricFinancials(metric, reduction);

      // Assess feasibility
      const feasibility = assessMetricFeasibility(metric);

      return {
        metricId: metric.metricId,
        metricName: metric.metricName,
        currentEmissions: metric.currentEmissions,
        targetReduction: metric.targetReduction,
        finalEmissions,
        initiatives,
        investment,
        payback,
        feasibility
      };
    });

    // Aggregate results with rounding (consistent with calculator pattern)
    const totalCurrentEmissions = Math.round(metricSimulations.reduce((sum, m) => sum + m.currentEmissions, 0) * 10) / 10;
    const totalFinalEmissions = Math.round(metricSimulations.reduce((sum, m) => sum + m.finalEmissions, 0) * 10) / 10;
    const totalInvestment = Math.round(metricSimulations.reduce((sum, m) => sum + m.investment, 0));
    const overallReduction = Math.round(((totalCurrentEmissions - totalFinalEmissions) / totalCurrentEmissions) * 1000) / 10;

    // Generate implementation timeline
    const timeline = generateImplementationTimeline(metricSimulations, scenario.targetYear);

    // Validate against SBTi
    const sbtiValidation = validateMetricLevelSBTi(metricSimulations, scenario, currentEmissions);

    // Risk assessment
    const risks = assessMetricLevelRisks(metricSimulations, scenario);

    // Generate recommendations
    const recommendations = generateRecommendations(metricSimulations, sbtiValidation);

    return NextResponse.json({
      metricSimulations,
      summary: {
        totalReduction: overallReduction,
        totalInvestment,
        averagePayback: totalInvestment / metricSimulations.reduce((sum, m) => sum + (m.investment / m.payback), 0),
        emissionsAvoided: totalCurrentEmissions - totalFinalEmissions,
        metricsTargeted: metricSimulations.filter(m => m.targetReduction > 0).length
      },
      timeline,
      sbtiValidation,
      risks,
      recommendations,
      scenario: {
        ...scenario,
        feasibilityScore: metricSimulations.reduce((sum, m) => sum + m.feasibility, 0) / metricSimulations.length
      }
    });

  } catch (error) {
    console.error('Metric simulation error:', error);
    return NextResponse.json(
      { error: 'Failed to simulate metrics' },
      { status: 500 }
    );
  }
}

function generateMetricInitiatives(metric: any): Initiative[] {
  const initiatives: Initiative[] = [];
  const reductionLevel = metric.targetReduction;

  // Category-specific initiative generation
  switch (metric.category.toLowerCase()) {
    case 'electricity':
    case 'energy':
      if (reductionLevel >= 20) {
        initiatives.push({
          name: 'LED Lighting Retrofit',
          impact: reductionLevel * 0.15,
          cost: 50000,
          timeline: '6 months',
          difficulty: 'Easy'
        });
      }
      if (reductionLevel >= 40) {
        initiatives.push({
          name: 'HVAC System Upgrade',
          impact: reductionLevel * 0.25,
          cost: 150000,
          timeline: '12 months',
          difficulty: 'Medium'
        });
      }
      if (reductionLevel >= 60) {
        initiatives.push({
          name: 'Solar PV Installation',
          impact: reductionLevel * 0.4,
          cost: 500000,
          timeline: '18 months',
          difficulty: 'Hard'
        });
      }
      break;

    case 'transportation':
    case 'travel':
      if (reductionLevel >= 20) {
        initiatives.push({
          name: 'Route Optimization',
          impact: reductionLevel * 0.1,
          cost: 20000,
          timeline: '3 months',
          difficulty: 'Easy'
        });
      }
      if (reductionLevel >= 40) {
        initiatives.push({
          name: 'Hybrid Fleet Transition',
          impact: reductionLevel * 0.3,
          cost: 200000,
          timeline: '12 months',
          difficulty: 'Medium'
        });
      }
      if (reductionLevel >= 60) {
        initiatives.push({
          name: 'Full Fleet Electrification',
          impact: reductionLevel * 0.5,
          cost: 800000,
          timeline: '24 months',
          difficulty: 'Hard'
        });
      }
      break;

    case 'waste':
      if (reductionLevel >= 20) {
        initiatives.push({
          name: 'Recycling Program Enhancement',
          impact: reductionLevel * 0.2,
          cost: 10000,
          timeline: '3 months',
          difficulty: 'Easy'
        });
      }
      if (reductionLevel >= 50) {
        initiatives.push({
          name: 'Composting System',
          impact: reductionLevel * 0.3,
          cost: 30000,
          timeline: '6 months',
          difficulty: 'Medium'
        });
      }
      if (reductionLevel >= 70) {
        initiatives.push({
          name: 'Zero Waste to Landfill',
          impact: reductionLevel * 0.4,
          cost: 100000,
          timeline: '18 months',
          difficulty: 'Hard'
        });
      }
      break;

    case 'supply chain':
    case 'purchased goods':
      if (reductionLevel >= 15) {
        initiatives.push({
          name: 'Supplier Engagement Program',
          impact: reductionLevel * 0.2,
          cost: 25000,
          timeline: '6 months',
          difficulty: 'Medium'
        });
      }
      if (reductionLevel >= 30) {
        initiatives.push({
          name: 'Local Sourcing Strategy',
          impact: reductionLevel * 0.25,
          cost: 50000,
          timeline: '12 months',
          difficulty: 'Medium'
        });
      }
      if (reductionLevel >= 45) {
        initiatives.push({
          name: 'Circular Economy Implementation',
          impact: reductionLevel * 0.35,
          cost: 150000,
          timeline: '24 months',
          difficulty: 'Hard'
        });
      }
      break;

    default:
      // Generic initiatives for other categories
      if (reductionLevel >= 20) {
        initiatives.push({
          name: 'Process Optimization',
          impact: reductionLevel * 0.2,
          cost: 30000,
          timeline: '6 months',
          difficulty: 'Easy'
        });
      }
      if (reductionLevel >= 40) {
        initiatives.push({
          name: 'Technology Upgrade',
          impact: reductionLevel * 0.3,
          cost: 100000,
          timeline: '12 months',
          difficulty: 'Medium'
        });
      }
  }

  return initiatives;
}

function calculateMetricFinancials(metric: any, reductionAmount: number) {
  // Cost per ton varies by category and scope
  const costPerTon: Record<string, number> = {
    'electricity': 75,
    'energy': 75,
    'natural gas': 60,
    'transportation': 150,
    'travel': 100,
    'waste': 40,
    'water': 30,
    'supply chain': 50,
    'purchased goods': 50,
    'default': 80
  };

  const category = metric.category.toLowerCase();
  const unitCost = costPerTon[category] || costPerTon.default;

  // Calculate investment
  const baseInvestment = reductionAmount * unitCost;

  // Adjust for difficulty
  let difficultyMultiplier = 1;
  if (metric.targetReduction > 70) difficultyMultiplier = 1.5;
  else if (metric.targetReduction > 50) difficultyMultiplier = 1.3;
  else if (metric.targetReduction > 30) difficultyMultiplier = 1.1;

  const investment = Math.round(baseInvestment * difficultyMultiplier);

  // Calculate savings (operational cost reduction + carbon pricing)
  const operationalSavings = reductionAmount * 30; // $30/tCO2e operational savings
  const carbonPriceSavings = reductionAmount * 50; // $50/tCO2e carbon price
  const annualSavings = operationalSavings + carbonPriceSavings;

  // Calculate payback period
  const payback = investment / annualSavings;

  return {
    investment,
    payback: Math.round(payback * 10) / 10 // Round to 1 decimal
  };
}

function assessMetricFeasibility(metric: any): number {
  let feasibilityScore = 100;

  // Deduct based on reduction target
  if (metric.targetReduction > 80) feasibilityScore -= 30;
  else if (metric.targetReduction > 60) feasibilityScore -= 20;
  else if (metric.targetReduction > 40) feasibilityScore -= 10;

  // Adjust based on category difficulty
  const difficultCategories = ['process emissions', 'fugitive emissions', 'supply chain'];
  const mediumCategories = ['transportation', 'travel', 'purchased goods'];
  const easyCategories = ['electricity', 'energy', 'waste', 'water'];

  if (difficultCategories.includes(metric.category.toLowerCase())) {
    feasibilityScore -= 20;
  } else if (mediumCategories.includes(metric.category.toLowerCase())) {
    feasibilityScore -= 10;
  } else if (easyCategories.includes(metric.category.toLowerCase())) {
    feasibilityScore += 10;
  }

  // Adjust based on scope
  if (metric.scope === 3) feasibilityScore -= 15; // Scope 3 is harder
  else if (metric.scope === 1) feasibilityScore -= 5; // Scope 1 moderate
  // Scope 2 is baseline (no adjustment)

  return Math.max(0, Math.min(100, feasibilityScore));
}

function generateImplementationTimeline(simulations: MetricSimulation[], targetYear: number) {
  const currentYear = new Date().getFullYear();
  const yearsAvailable = targetYear - currentYear;

  // Sort metrics by feasibility and impact
  const prioritizedMetrics = simulations
    .filter(m => m.targetReduction > 0)
    .sort((a, b) => {
      const aScore = a.feasibility * (a.currentEmissions - a.finalEmissions);
      const bScore = b.feasibility * (b.currentEmissions - b.finalEmissions);
      return bScore - aScore;
    });

  const phases = [];

  // Phase 1: Quick Wins (Year 1)
  phases.push({
    phase: 1,
    name: 'Quick Wins',
    year: currentYear,
    metrics: prioritizedMetrics
      .filter(m => m.feasibility > 70)
      .slice(0, 5)
      .map(m => m.metricName),
    expectedReduction: Math.round(prioritizedMetrics
      .filter(m => m.feasibility > 70)
      .slice(0, 5)
      .reduce((sum, m) => sum + (m.currentEmissions - m.finalEmissions), 0) * 10) / 10
  });

  // Phase 2: Major Initiatives (Year 2-3)
  if (yearsAvailable >= 2) {
    phases.push({
      phase: 2,
      name: 'Major Initiatives',
      year: currentYear + 1,
      metrics: prioritizedMetrics
        .filter(m => m.feasibility >= 40 && m.feasibility <= 70)
        .slice(0, 5)
        .map(m => m.metricName),
      expectedReduction: Math.round(prioritizedMetrics
        .filter(m => m.feasibility >= 40 && m.feasibility <= 70)
        .slice(0, 5)
        .reduce((sum, m) => sum + (m.currentEmissions - m.finalEmissions), 0) * 10) / 10
    });
  }

  // Phase 3: Transformational Changes (Year 3+)
  if (yearsAvailable >= 3) {
    phases.push({
      phase: 3,
      name: 'Transformational Changes',
      year: currentYear + 2,
      metrics: prioritizedMetrics
        .filter(m => m.feasibility < 40)
        .map(m => m.metricName),
      expectedReduction: Math.round(prioritizedMetrics
        .filter(m => m.feasibility < 40)
        .reduce((sum, m) => sum + (m.currentEmissions - m.finalEmissions), 0) * 10) / 10
    });
  }

  return phases;
}

function validateMetricLevelSBTi(simulations: MetricSimulation[], scenario: any, currentEmissions: any) {
  // Calculate scope-level reductions
  const scope1Metrics = simulations.filter(m => m.metricName.includes('Scope 1') || m.metricName.includes('Natural Gas') || m.metricName.includes('Fleet'));
  const scope2Metrics = simulations.filter(m => m.metricName.includes('Scope 2') || m.metricName.includes('Electricity'));
  const scope3Metrics = simulations.filter(m => !scope1Metrics.includes(m) && !scope2Metrics.includes(m));

  // Use consistent rounding for all reduction calculations
  const scope1Reduction = scope1Metrics.length > 0 ?
    Math.round((scope1Metrics.reduce((sum, m) => sum + (m.currentEmissions - m.finalEmissions), 0) /
     scope1Metrics.reduce((sum, m) => sum + m.currentEmissions, 0)) * 1000) / 10 : 0;

  const scope2Reduction = scope2Metrics.length > 0 ?
    Math.round((scope2Metrics.reduce((sum, m) => sum + (m.currentEmissions - m.finalEmissions), 0) /
     scope2Metrics.reduce((sum, m) => sum + m.currentEmissions, 0)) * 1000) / 10 : 0;

  const scope3Reduction = scope3Metrics.length > 0 ?
    Math.round((scope3Metrics.reduce((sum, m) => sum + (m.currentEmissions - m.finalEmissions), 0) /
     scope3Metrics.reduce((sum, m) => sum + m.currentEmissions, 0)) * 1000) / 10 : 0;

  const overallReduction = Math.round(((simulations.reduce((sum, m) => sum + m.currentEmissions, 0) -
                            simulations.reduce((sum, m) => sum + m.finalEmissions, 0)) /
                           simulations.reduce((sum, m) => sum + m.currentEmissions, 0)) * 1000) / 10;

  // Check SBTi alignment
  const currentYear = new Date().getFullYear();
  const annualRate = Math.round((overallReduction / (scenario.targetYear - currentYear)) * 10) / 10;

  return {
    scope1Reduction,
    scope2Reduction,
    scope3Reduction,
    overallReduction,
    annualRate,
    is15CAligned: scenario.targetYear === 2030 && overallReduction >= 42 && annualRate >= 4.2,
    isWB2CAligned: scenario.targetYear === 2030 && overallReduction >= 25 && annualRate >= 2.5,
    scope3Coverage: scope3Metrics.length > 0 && scope3Reduction > 0,
    recommendations: generateSBTiRecommendations(overallReduction, annualRate, scope3Reduction)
  };
}

function generateSBTiRecommendations(overallReduction: number, annualRate: number, scope3Reduction: number): string[] {
  const recommendations = [];

  if (overallReduction < 42) {
    recommendations.push(`Increase overall reduction by ${(42 - overallReduction).toFixed(0)}% to align with 1.5°C pathway`);
  }

  if (annualRate < 4.2) {
    recommendations.push(`Accelerate annual reduction rate to at least 4.2% per year`);
  }

  if (scope3Reduction === 0) {
    recommendations.push('Include Scope 3 emissions in reduction targets for SBTi compliance');
  } else if (scope3Reduction < 15) {
    recommendations.push('Increase Scope 3 reduction targets to demonstrate supply chain engagement');
  }

  if (recommendations.length === 0) {
    recommendations.push('Targets are well-aligned with SBTi criteria');
  }

  return recommendations;
}

function assessMetricLevelRisks(simulations: MetricSimulation[], scenario: any) {
  const risks = [];

  // High reduction targets risk
  const aggressiveMetrics = simulations.filter(m => m.targetReduction > 70);
  if (aggressiveMetrics.length > 0) {
    risks.push({
      type: 'Execution Risk',
      level: 'High',
      description: `${aggressiveMetrics.length} metrics have reduction targets >70%`,
      mitigation: 'Phase implementation and consider interim milestones',
      metrics: aggressiveMetrics.map(m => m.metricName)
    });
  }

  // Low feasibility risk
  const lowFeasibilityMetrics = simulations.filter(m => m.feasibility < 40);
  if (lowFeasibilityMetrics.length > 0) {
    risks.push({
      type: 'Feasibility Risk',
      level: 'Medium',
      description: `${lowFeasibilityMetrics.length} metrics have low feasibility scores`,
      mitigation: 'Focus on high-feasibility metrics first',
      metrics: lowFeasibilityMetrics.map(m => m.metricName)
    });
  }

  // Investment concentration risk
  const totalInvestment = simulations.reduce((sum, m) => sum + m.investment, 0);
  const topMetricInvestment = Math.max(...simulations.map(m => m.investment));
  if (topMetricInvestment / totalInvestment > 0.4) {
    risks.push({
      type: 'Investment Risk',
      level: 'Medium',
      description: 'Over 40% of investment concentrated in single metric',
      mitigation: 'Diversify reduction strategies across multiple metrics'
    });
  }

  // Timeline risk
  const currentYear = new Date().getFullYear();
  if (scenario.targetYear - currentYear < 3) {
    risks.push({
      type: 'Timeline Risk',
      level: 'High',
      description: 'Short timeline may not allow for all initiatives',
      mitigation: 'Prioritize quick wins and proven technologies'
    });
  }

  return risks;
}

function generateRecommendations(simulations: MetricSimulation[], sbtiValidation: any): string[] {
  const recommendations = [];

  // Focus on high-impact, high-feasibility metrics
  const highImpactMetrics = simulations
    .filter(m => m.currentEmissions > 1000 && m.feasibility > 60 && m.targetReduction < 30)
    .slice(0, 3);

  if (highImpactMetrics.length > 0) {
    recommendations.push(
      `Consider increasing reduction targets for: ${highImpactMetrics.map(m => m.metricName).join(', ')}`
    );
  }

  // Suggest renewable energy if electricity is significant
  const electricityMetrics = simulations.filter(m =>
    m.metricName.toLowerCase().includes('electricity') && m.targetReduction < 80
  );
  if (electricityMetrics.length > 0) {
    recommendations.push('Maximize renewable energy adoption for Scope 2 emissions');
  }

  // Supply chain engagement
  const scope3Metrics = simulations.filter(m =>
    m.metricName.toLowerCase().includes('purchased') ||
    m.metricName.toLowerCase().includes('supply') ||
    m.metricName.toLowerCase().includes('travel')
  );
  if (scope3Metrics.length > 0 && scope3Metrics.some(m => m.targetReduction < 20)) {
    recommendations.push('Strengthen supplier engagement and Scope 3 reduction targets');
  }

  // Add SBTi recommendations
  recommendations.push(...sbtiValidation.recommendations);

  return recommendations;
}