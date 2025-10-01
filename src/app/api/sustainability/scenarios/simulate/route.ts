import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { scenario, currentEmissions, siteId } = body;

    // Calculate detailed projections
    const projections = calculateProjections(scenario, currentEmissions);

    // Calculate required initiatives and investments
    const initiatives = calculateInitiatives(scenario);

    // Validate against SBTi criteria
    const sbtiValidation = validateSBTi(scenario);

    // Calculate financial impacts
    const financialImpact = calculateFinancialImpact(scenario, currentEmissions);

    // Generate implementation roadmap
    const roadmap = generateRoadmap(scenario);

    // Return comprehensive simulation results
    return NextResponse.json({
      projections,
      initiatives,
      sbtiValidation,
      financialImpact,
      roadmap,
      scenario: {
        ...scenario,
        feasibility: calculateFeasibility(scenario),
        riskAssessment: assessRisks(scenario)
      }
    });

  } catch (error) {
    console.error('Scenario simulation error:', error);
    return NextResponse.json(
      { error: 'Failed to simulate scenario' },
      { status: 500 }
    );
  }
}

function calculateProjections(scenario: any, currentEmissions: any) {
  const years = [];
  const currentYear = new Date().getFullYear();
  const targetYear = scenario.targetYear;
  const yearsToTarget = targetYear - currentYear;

  for (let i = 0; i <= yearsToTarget; i++) {
    const year = currentYear + i;
    let reductionFactor = 0;

    // Calculate reduction based on pathway
    if (scenario.pathway === 'linear') {
      reductionFactor = i / yearsToTarget;
    } else if (scenario.pathway === 'exponential') {
      reductionFactor = Math.pow(i / yearsToTarget, 2);
    } else if (scenario.pathway === 'stepped') {
      reductionFactor = Math.floor(i / (yearsToTarget / 4)) * 0.25;
    }

    const totalReduction = scenario.reductionPercent * reductionFactor;

    // Apply scope-specific reductions
    const scope1 = currentEmissions.scope1 * (1 - (scenario.scope1Reduction * reductionFactor) / 100);
    const scope2Base = currentEmissions.scope2 * (1 - (scenario.scope2Reduction * reductionFactor) / 100);
    const scope3 = currentEmissions.scope3 * (1 - (scenario.scope3Reduction * reductionFactor) / 100);

    // Apply renewable energy impact
    const renewableImpact = scope2Base * (scenario.renewable / 100) * 0.8;
    const scope2 = Math.max(scope2Base - renewableImpact, scope2Base * 0.2);

    const grossEmissions = scope1 + scope2 + scope3;
    const offsets = grossEmissions * (scenario.carbonOffsets / 100);
    const netEmissions = grossEmissions - offsets;

    years.push({
      year,
      scope1,
      scope2,
      scope3,
      gross: grossEmissions,
      offsets,
      net: netEmissions,
      reductionPercent: totalReduction,
      intensity: netEmissions / 1000 // Simplified intensity calculation
    });
  }

  return years;
}

function calculateInitiatives(scenario: any) {
  const initiatives = [];

  // Energy efficiency initiatives
  if (scenario.scope2Reduction > 20) {
    initiatives.push({
      category: 'Energy Efficiency',
      name: 'LED Lighting Retrofit',
      impact: 'High',
      cost: 'Medium',
      timeline: '6-12 months',
      reduction: scenario.scope2Reduction * 0.15
    });

    initiatives.push({
      category: 'Energy Efficiency',
      name: 'HVAC Optimization',
      impact: 'High',
      cost: 'High',
      timeline: '12-18 months',
      reduction: scenario.scope2Reduction * 0.25
    });
  }

  // Renewable energy initiatives
  if (scenario.renewable > 30) {
    initiatives.push({
      category: 'Renewable Energy',
      name: 'Solar PV Installation',
      impact: 'Very High',
      cost: 'Very High',
      timeline: '18-24 months',
      reduction: scenario.renewable * 0.6
    });
  }

  if (scenario.renewable > 50) {
    initiatives.push({
      category: 'Renewable Energy',
      name: 'Green Energy PPA',
      impact: 'High',
      cost: 'Low',
      timeline: '3-6 months',
      reduction: scenario.renewable * 0.3
    });
  }

  // Supply chain initiatives
  if (scenario.scope3Reduction > 15) {
    initiatives.push({
      category: 'Supply Chain',
      name: 'Supplier Engagement Program',
      impact: 'Medium',
      cost: 'Low',
      timeline: '6-12 months',
      reduction: scenario.scope3Reduction * 0.2
    });

    initiatives.push({
      category: 'Supply Chain',
      name: 'Sustainable Procurement Policy',
      impact: 'Medium',
      cost: 'Low',
      timeline: '3-6 months',
      reduction: scenario.scope3Reduction * 0.15
    });
  }

  // Transportation initiatives
  if (scenario.scope1Reduction > 25) {
    initiatives.push({
      category: 'Transportation',
      name: 'Fleet Electrification',
      impact: 'High',
      cost: 'Very High',
      timeline: '24-36 months',
      reduction: scenario.scope1Reduction * 0.4
    });
  }

  return initiatives;
}

function validateSBTi(scenario: any) {
  const currentYear = new Date().getFullYear();
  const yearsToTarget = scenario.targetYear - currentYear;
  const annualReduction = scenario.reductionPercent / yearsToTarget;

  // SBTi criteria
  const criteria = {
    '1.5C': {
      nearTerm: scenario.targetYear === 2030 && scenario.reductionPercent >= 42,
      annualRate: annualReduction >= 4.2,
      scope3Coverage: scenario.scope3Reduction > 0,
      netZeroCommitment: scenario.targetYear <= 2050 && scenario.reductionPercent >= 90
    },
    'wellBelow2C': {
      nearTerm: scenario.targetYear === 2030 && scenario.reductionPercent >= 25,
      annualRate: annualReduction >= 2.5,
      scope3Coverage: scenario.scope3Reduction > 0
    },
    '2C': {
      nearTerm: scenario.targetYear === 2030 && scenario.reductionPercent >= 18,
      annualRate: annualReduction >= 1.8
    }
  };

  // Determine alignment
  let alignment = 'Not aligned';
  let recommendations = [];

  if (criteria['1.5C'].nearTerm && criteria['1.5C'].annualRate) {
    alignment = '1.5°C aligned';
  } else if (criteria.wellBelow2C.nearTerm && criteria.wellBelow2C.annualRate) {
    alignment = 'Well below 2°C aligned';
  } else if (criteria['2C'].nearTerm && criteria['2C'].annualRate) {
    alignment = '2°C aligned';
  }

  // Generate recommendations
  if (!criteria['1.5C'].nearTerm) {
    const gap = 42 - scenario.reductionPercent;
    if (gap > 0) {
      recommendations.push(`Increase reduction target by ${gap.toFixed(0)}% to align with 1.5°C`);
    }
  }

  if (!criteria['1.5C'].annualRate) {
    recommendations.push(`Increase annual reduction rate to at least 4.2%`);
  }

  if (scenario.carbonOffsets > 10) {
    recommendations.push('Limit carbon offsets to maximum 5-10% of total reductions');
  }

  if (!criteria['1.5C'].scope3Coverage && scenario.scope3Reduction === 0) {
    recommendations.push('Include Scope 3 emissions in reduction targets');
  }

  return {
    alignment,
    criteria,
    recommendations,
    score: calculateSBTiScore(criteria),
    certifiable: alignment !== 'Not aligned'
  };
}

function calculateSBTiScore(criteria: any) {
  let score = 0;
  const weights = {
    nearTerm: 40,
    annualRate: 30,
    scope3Coverage: 20,
    netZeroCommitment: 10
  };

  if (criteria['1.5C'].nearTerm) score += weights.nearTerm;
  if (criteria['1.5C'].annualRate) score += weights.annualRate;
  if (criteria['1.5C'].scope3Coverage) score += weights.scope3Coverage;
  if (criteria['1.5C'].netZeroCommitment) score += weights.netZeroCommitment;

  return score;
}

function calculateFinancialImpact(scenario: any, currentEmissions: any) {
  const totalEmissions = currentEmissions.total;
  const reductionAmount = totalEmissions * (scenario.reductionPercent / 100);

  // Estimate costs based on reduction strategies
  const costPerTon = {
    energyEfficiency: 50,
    renewable: 100,
    fleetElectrification: 200,
    supplyChain: 30,
    offsets: 25
  };

  // Calculate investment needed
  let totalInvestment = 0;

  // Energy efficiency investments
  if (scenario.scope2Reduction > 0) {
    const scope2Reduction = currentEmissions.scope2 * (scenario.scope2Reduction / 100);
    totalInvestment += scope2Reduction * costPerTon.energyEfficiency;
  }

  // Renewable energy investments
  if (scenario.renewable > 0) {
    const renewableImpact = currentEmissions.scope2 * (scenario.renewable / 100) * 0.8;
    totalInvestment += renewableImpact * costPerTon.renewable;
  }

  // Fleet electrification
  if (scenario.scope1Reduction > 30) {
    const scope1Reduction = currentEmissions.scope1 * (scenario.scope1Reduction / 100);
    totalInvestment += scope1Reduction * costPerTon.fleetElectrification * 0.5;
  }

  // Carbon offsets
  if (scenario.carbonOffsets > 0) {
    const offsetAmount = totalEmissions * (scenario.carbonOffsets / 100);
    totalInvestment += offsetAmount * costPerTon.offsets;
  }

  // Calculate savings
  const annualEnergySavings = scenario.scope2Reduction * currentEmissions.scope2 * 0.001 * 100; // $100/tCO2e saved
  const carbonTaxSavings = reductionAmount * 50; // $50/tCO2e carbon tax
  const reputationalValue = scenario.sbtiAligned ? 1000000 : 0; // $1M brand value for SBTi

  // ROI calculation
  const yearsToTarget = scenario.targetYear - new Date().getFullYear();
  const totalSavings = (annualEnergySavings + carbonTaxSavings) * yearsToTarget + reputationalValue;
  const roi = ((totalSavings - totalInvestment) / totalInvestment) * 100;
  const paybackPeriod = totalInvestment / (annualEnergySavings + carbonTaxSavings);

  return {
    totalInvestment: Math.round(totalInvestment),
    annualSavings: Math.round(annualEnergySavings + carbonTaxSavings),
    totalSavings: Math.round(totalSavings),
    roi: roi.toFixed(1),
    paybackPeriod: paybackPeriod.toFixed(1),
    carbonTaxAvoided: Math.round(carbonTaxSavings),
    breakdown: {
      energyEfficiency: Math.round(currentEmissions.scope2 * (scenario.scope2Reduction / 100) * costPerTon.energyEfficiency),
      renewable: Math.round(currentEmissions.scope2 * (scenario.renewable / 100) * 0.8 * costPerTon.renewable),
      offsets: Math.round(totalEmissions * (scenario.carbonOffsets / 100) * costPerTon.offsets)
    }
  };
}

function generateRoadmap(scenario: any) {
  const currentYear = new Date().getFullYear();
  const phases = [];

  // Phase 1: Foundation (0-6 months)
  phases.push({
    phase: 1,
    name: 'Foundation',
    timeline: '0-6 months',
    milestones: [
      'Establish sustainability team',
      'Complete baseline emissions audit',
      'Set governance structure',
      'Develop data collection systems',
      'Engage key stakeholders'
    ],
    targetReduction: 5
  });

  // Phase 2: Quick Wins (6-12 months)
  phases.push({
    phase: 2,
    name: 'Quick Wins',
    timeline: '6-12 months',
    milestones: [
      'Implement energy efficiency measures',
      'Launch employee engagement program',
      'Optimize building operations',
      'Switch to green energy tariffs',
      'Reduce business travel'
    ],
    targetReduction: 15
  });

  // Phase 3: Transformation (12-24 months)
  if (scenario.targetYear - currentYear >= 2) {
    phases.push({
      phase: 3,
      name: 'Transformation',
      timeline: '12-24 months',
      milestones: [
        'Deploy renewable energy systems',
        'Implement supply chain program',
        'Electrify vehicle fleet',
        'Upgrade to efficient equipment',
        'Launch circular economy initiatives'
      ],
      targetReduction: 35
    });
  }

  // Phase 4: Scale & Optimize (24+ months)
  if (scenario.targetYear - currentYear >= 3) {
    phases.push({
      phase: 4,
      name: 'Scale & Optimize',
      timeline: '24+ months',
      milestones: [
        'Scale successful initiatives',
        'Implement advanced technologies',
        'Achieve supply chain engagement',
        'Optimize all operations',
        'Consider quality offsets'
      ],
      targetReduction: scenario.reductionPercent
    });
  }

  return phases;
}

function calculateFeasibility(scenario: any) {
  let score = 100;

  // Deduct points for aggressive targets
  if (scenario.reductionPercent > 70) score -= 20;
  if (scenario.reductionPercent > 50) score -= 10;

  // Deduct points for short timelines
  const yearsToTarget = scenario.targetYear - new Date().getFullYear();
  if (yearsToTarget < 3) score -= 20;
  if (yearsToTarget < 5) score -= 10;

  // Deduct points for high dependency on offsets
  if (scenario.carbonOffsets > 15) score -= 15;
  if (scenario.carbonOffsets > 10) score -= 10;

  // Add points for renewable energy
  if (scenario.renewable > 50) score += 10;
  if (scenario.renewable > 75) score += 10;

  return Math.max(0, Math.min(100, score));
}

function assessRisks(scenario: any) {
  const risks = [];

  if (scenario.reductionPercent > 60) {
    risks.push({
      type: 'Execution Risk',
      level: 'High',
      description: 'Aggressive reduction target may be difficult to achieve',
      mitigation: 'Phase implementation and set interim milestones'
    });
  }

  if (scenario.carbonOffsets > 10) {
    risks.push({
      type: 'Regulatory Risk',
      level: 'Medium',
      description: 'Over-reliance on offsets may not meet future regulations',
      mitigation: 'Focus on absolute emissions reductions'
    });
  }

  if (scenario.renewable < 30) {
    risks.push({
      type: 'Market Risk',
      level: 'Medium',
      description: 'Low renewable energy adoption may impact competitiveness',
      mitigation: 'Explore renewable energy PPAs and on-site generation'
    });
  }

  const yearsToTarget = scenario.targetYear - new Date().getFullYear();
  if (yearsToTarget < 5) {
    risks.push({
      type: 'Timeline Risk',
      level: 'High',
      description: 'Short timeline may not allow for technology maturation',
      mitigation: 'Prioritize proven technologies and quick wins'
    });
  }

  return risks;
}