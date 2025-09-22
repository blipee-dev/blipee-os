/**
 * Scenario Modeling Engine
 * Advanced what-if analysis for sustainability scenarios
 */

export interface Scenario {
  id: string;
  name: string;
  description: string;
  parameters: Record<string, number>;
  baselineYear: number;
  targetYear: number;
}

export interface ScenarioResult {
  scenario: Scenario;
  projections: {
    emissions: number[];
    costs: number[];
    savings: number[];
    timeline: string[];
  };
  kpis: {
    totalEmissionReduction: number;
    totalCostSavings: number;
    roi: number;
    paybackPeriod: number;
  };
  feasibility: 'low' | 'medium' | 'high';
  confidence: number;
}

export class ScenarioModeling {
  async runScenario(scenario: Scenario): Promise<ScenarioResult> {
    const years = scenario.targetYear - scenario.baselineYear;
    const timeline = Array.from({ length: years + 1 }, (_, i) => 
      (scenario.baselineYear + i).toString()
    );
    
    // Simplified scenario modeling
    const emissions = this.projectEmissions(scenario, years);
    const costs = this.projectCosts(scenario, years);
    const savings = this.calculateSavings(scenario, years);
    
    return {
      scenario,
      projections: {
        emissions,
        costs,
        savings,
        timeline
      },
      kpis: {
        totalEmissionReduction: emissions[0] - emissions[emissions.length - 1],
        totalCostSavings: savings.reduce((sum, val) => sum + val, 0),
        roi: this.calculateROI(costs, savings),
        paybackPeriod: this.calculatePaybackPeriod(costs, savings)
      },
      feasibility: this.assessFeasibility(scenario),
      confidence: 0.85
    };
  }

  private projectEmissions(scenario: Scenario, years: number): number[] {
    const baseEmissions = 10000; // baseline
    const reductionRate = (scenario.parameters.emissionReduction || 0) / 100;
    
    return Array.from({ length: years + 1 }, (_, i) => 
      baseEmissions * Math.pow(1 - reductionRate, i)
    );
  }

  private projectCosts(scenario: Scenario, years: number): number[] {
    const initialCost = scenario.parameters.initialInvestment || 0;
    const annualCost = scenario.parameters.annualOperatingCost || 0;
    
    return Array.from({ length: years + 1 }, (_, i) => 
      i === 0 ? initialCost : annualCost
    );
  }

  private calculateSavings(scenario: Scenario, years: number): number[] {
    const annualSavings = scenario.parameters.annualSavings || 0;
    
    return Array.from({ length: years + 1 }, (_, i) => 
      i === 0 ? 0 : annualSavings
    );
  }

  private calculateROI(costs: number[], savings: number[]): number {
    const totalCosts = costs.reduce((sum, cost) => sum + cost, 0);
    const totalSavings = savings.reduce((sum, saving) => sum + saving, 0);
    
    return totalCosts > 0 ? (totalSavings - totalCosts) / totalCosts : 0;
  }

  private calculatePaybackPeriod(costs: number[], savings: number[]): number {
    const initialCost = costs[0];
    const annualSavings = savings[1] || 0;
    
    return annualSavings > 0 ? initialCost / annualSavings : 0;
  }

  private assessFeasibility(scenario: Scenario): 'low' | 'medium' | 'high' {
    const complexity = Object.keys(scenario.parameters).length;
    if (complexity < 3) return 'high';
    if (complexity < 6) return 'medium';
    return 'low';
  }
}

export const scenarioModeling = new ScenarioModeling();
export default scenarioModeling;
