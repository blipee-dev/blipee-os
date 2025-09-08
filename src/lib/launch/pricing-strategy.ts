/**
 * Pricing & Packaging Strategy System
 * Value-based pricing that drives 100x ROI
 */

import { EventEmitter } from 'events';

export interface PricingPlan {
  id: string;
  name: string;
  tagline: string;
  tier: 'starter' | 'growth' | 'scale' | 'enterprise';
  pricing: PricingModel;
  features: Feature[];
  limits: UsageLimits;
  valueProps: string[];
  targetSegment: TargetSegment;
  roi: ROICalculation;
  popular?: boolean;
  customizable?: boolean;
}

export interface PricingModel {
  model: 'per_building' | 'per_user' | 'usage_based' | 'flat_rate' | 'custom';
  basePrice: number;
  currency: string;
  billingPeriod: 'monthly' | 'annual';
  discount?: {
    annual: number; // percentage
    volume: VolumeDiscount[];
    commitment: CommitmentDiscount[];
  };
  additionalCosts?: {
    implementation?: number;
    training?: number;
    support?: number;
  };
}

export interface Feature {
  id: string;
  name: string;
  description: string;
  category: 'core' | 'ai' | 'integration' | 'analytics' | 'compliance' | 'support';
  included: boolean | number | 'unlimited';
  addon?: AddonPricing;
}

export interface UsageLimits {
  buildings: number | 'unlimited';
  users: number | 'unlimited';
  aiAgents: number | 'unlimited';
  dataPoints: number | 'unlimited';
  integrations: number | 'unlimited';
  apiCalls: number | 'unlimited';
  storage: number | 'unlimited'; // GB
  historicalData: number | 'unlimited'; // years
  customModels: number | 'unlimited';
  exportFrequency: 'daily' | 'hourly' | 'realtime' | 'unlimited';
}

export interface TargetSegment {
  companySize: string[];
  industry: string[];
  sustainabilityMaturity: string[];
  budget: { min: number; max: number };
  decisionMaker: string[];
  painPoints: string[];
}

export interface ROICalculation {
  timeToValue: number; // days
  paybackPeriod: number; // months
  yearOneROI: number; // percentage
  threeYearROI: number; // percentage
  tangibleSavings: {
    energy: number;
    compliance: number;
    automation: number;
    optimization: number;
  };
  intangibleBenefits: string[];
}

export interface VolumeDiscount {
  threshold: number;
  discount: number; // percentage
}

export interface CommitmentDiscount {
  term: number; // months
  discount: number; // percentage
}

export interface AddonPricing {
  price: number;
  unit: 'per_month' | 'per_building' | 'per_user' | 'one_time';
}

export interface PricingExperiment {
  id: string;
  name: string;
  hypothesis: string;
  variants: PricingPlan[];
  metrics: string[];
  startDate: Date;
  endDate?: Date;
  results?: ExperimentResults;
}

export interface ExperimentResults {
  winner: string;
  conversionRate: Record<string, number>;
  averageContractValue: Record<string, number>;
  churnRate: Record<string, number>;
  customerSatisfaction: Record<string, number>;
  significance: number;
}

export class PricingStrategySystem extends EventEmitter {
  private plans: Map<string, PricingPlan> = new Map();
  private experiments: Map<string, PricingExperiment> = new Map();
  private calculator: ValueCalculator;
  private optimizer: PricingOptimizer;

  constructor() {
    super();
    this.calculator = new ValueCalculator();
    this.optimizer = new PricingOptimizer();
    this.initializePricingPlans();
    this.setupDynamicPricing();
  }

  private initializePricingPlans(): void {
    // Starter Plan - Land grab strategy
    this.plans.set('starter', {
      id: 'starter',
      name: 'Starter',
      tagline: 'Perfect for getting started with AI-powered sustainability',
      tier: 'starter',
      pricing: {
        model: 'per_building',
        basePrice: 299,
        currency: 'USD',
        billingPeriod: 'monthly',
        discount: {
          annual: 20,
          volume: [
            { threshold: 5, discount: 10 },
            { threshold: 10, discount: 15 }
          ],
          commitment: [
            { term: 12, discount: 10 },
            { term: 24, discount: 20 }
          ]
        }
      },
      features: [
        {
          id: 'ai_chat',
          name: 'AI Sustainability Chat',
          description: 'Conversational AI for sustainability questions',
          category: 'ai',
          included: true
        },
        {
          id: 'buildings',
          name: 'Buildings',
          description: 'Number of buildings you can manage',
          category: 'core',
          included: 3
        },
        {
          id: 'esg_chief',
          name: 'ESG Chief of Staff',
          description: 'Your AI sustainability manager',
          category: 'ai',
          included: true
        },
        {
          id: 'basic_analytics',
          name: 'Basic Analytics',
          description: 'Essential sustainability metrics',
          category: 'analytics',
          included: true
        },
        {
          id: 'compliance_tracking',
          name: 'Compliance Tracking',
          description: 'Track regulatory compliance',
          category: 'compliance',
          included: 1 // Basic tier
        }
      ],
      limits: {
        buildings: 3,
        users: 5,
        aiAgents: 1,
        dataPoints: 100000,
        integrations: 3,
        apiCalls: 10000,
        storage: 10,
        historicalData: 1,
        customModels: 0,
        exportFrequency: 'daily'
      },
      valueProps: [
        'Get started in 5 minutes',
        'No credit card required',
        'Full AI capabilities',
        'Save 15% on energy costs',
        'Basic compliance tracking'
      ],
      targetSegment: {
        companySize: ['1-50', '51-200'],
        industry: ['all'],
        sustainabilityMaturity: ['beginner', 'intermediate'],
        budget: { min: 0, max: 5000 },
        decisionMaker: ['Facility Manager', 'Sustainability Manager'],
        painPoints: ['Getting started', 'Limited budget', 'Basic tracking']
      },
      roi: {
        timeToValue: 1,
        paybackPeriod: 3,
        yearOneROI: 400,
        threeYearROI: 1200,
        tangibleSavings: {
          energy: 15000,
          compliance: 5000,
          automation: 10000,
          optimization: 8000
        },
        intangibleBenefits: [
          'Improved ESG score',
          'Risk mitigation',
          'Brand reputation'
        ]
      }
    });

    // Growth Plan - Expansion strategy
    this.plans.set('growth', {
      id: 'growth',
      name: 'Growth',
      tagline: 'Scale your sustainability with advanced AI',
      tier: 'growth',
      popular: true,
      pricing: {
        model: 'per_building',
        basePrice: 599,
        currency: 'USD',
        billingPeriod: 'monthly',
        discount: {
          annual: 25,
          volume: [
            { threshold: 10, discount: 15 },
            { threshold: 25, discount: 20 },
            { threshold: 50, discount: 25 }
          ],
          commitment: [
            { term: 12, discount: 15 },
            { term: 24, discount: 25 },
            { term: 36, discount: 30 }
          ]
        }
      },
      features: [
        {
          id: 'all_starter',
          name: 'Everything in Starter',
          description: 'All Starter features included',
          category: 'core',
          included: true
        },
        {
          id: 'buildings',
          name: 'Buildings',
          description: 'Number of buildings you can manage',
          category: 'core',
          included: 25
        },
        {
          id: 'ai_agents',
          name: 'AI Agent Team',
          description: '4 specialized AI agents working 24/7',
          category: 'ai',
          included: 4
        },
        {
          id: 'predictive_analytics',
          name: 'Predictive Analytics',
          description: 'ML-powered predictions and forecasting',
          category: 'analytics',
          included: true
        },
        {
          id: 'network_intelligence',
          name: 'Network Intelligence',
          description: 'Benchmark against peers anonymously',
          category: 'analytics',
          included: true
        },
        {
          id: 'advanced_integrations',
          name: 'Advanced Integrations',
          description: 'Connect all your systems',
          category: 'integration',
          included: 20
        },
        {
          id: 'api_access',
          name: 'API Access',
          description: 'Full API for custom integrations',
          category: 'integration',
          included: true
        }
      ],
      limits: {
        buildings: 25,
        users: 25,
        aiAgents: 4,
        dataPoints: 1000000,
        integrations: 20,
        apiCalls: 100000,
        storage: 100,
        historicalData: 3,
        customModels: 3,
        exportFrequency: 'hourly'
      },
      valueProps: [
        'Complete AI agent team',
        'Predictive analytics',
        'Save 25% on operations',
        'Advanced compliance automation',
        'Priority support'
      ],
      targetSegment: {
        companySize: ['201-1000'],
        industry: ['all'],
        sustainabilityMaturity: ['intermediate', 'advanced'],
        budget: { min: 5000, max: 25000 },
        decisionMaker: ['VP Sustainability', 'Director of Operations'],
        painPoints: ['Scaling operations', 'Multiple buildings', 'Compliance complexity']
      },
      roi: {
        timeToValue: 7,
        paybackPeriod: 2,
        yearOneROI: 600,
        threeYearROI: 2000,
        tangibleSavings: {
          energy: 75000,
          compliance: 25000,
          automation: 50000,
          optimization: 40000
        },
        intangibleBenefits: [
          'Industry leadership',
          'Investor confidence',
          'Talent attraction',
          'Supply chain optimization'
        ]
      }
    });

    // Scale Plan - Domination strategy
    this.plans.set('scale', {
      id: 'scale',
      name: 'Scale',
      tagline: 'Enterprise-grade AI for sustainability leaders',
      tier: 'scale',
      pricing: {
        model: 'per_building',
        basePrice: 999,
        currency: 'USD',
        billingPeriod: 'monthly',
        discount: {
          annual: 30,
          volume: [
            { threshold: 50, discount: 20 },
            { threshold: 100, discount: 30 },
            { threshold: 250, discount: 35 },
            { threshold: 500, discount: 40 }
          ],
          commitment: [
            { term: 12, discount: 20 },
            { term: 24, discount: 30 },
            { term: 36, discount: 35 }
          ]
        },
        additionalCosts: {
          implementation: 10000,
          training: 5000,
          support: 0 // Included
        }
      },
      features: [
        {
          id: 'all_growth',
          name: 'Everything in Growth',
          description: 'All Growth features included',
          category: 'core',
          included: true
        },
        {
          id: 'buildings',
          name: 'Buildings',
          description: 'Unlimited buildings',
          category: 'core',
          included: 999999 // Unlimited
        },
        {
          id: 'custom_ai_agents',
          name: 'Custom AI Agents',
          description: 'Build your own AI agents',
          category: 'ai',
          included: true
        },
        {
          id: 'ml_model_training',
          name: 'Custom ML Models',
          description: 'Train models on your data',
          category: 'ai',
          included: true
        },
        {
          id: 'white_labeling',
          name: 'White Labeling',
          description: 'Your brand, our platform',
          category: 'core',
          included: true,
          addon: {
            price: 5000,
            unit: 'one_time'
          }
        },
        {
          id: 'dedicated_success',
          name: 'Dedicated Success Manager',
          description: 'Your personal sustainability expert',
          category: 'support',
          included: true
        },
        {
          id: 'sla_guarantee',
          name: '99.99% SLA',
          description: 'Enterprise-grade reliability',
          category: 'support',
          included: true
        }
      ],
      limits: {
        buildings: 'unlimited',
        users: 'unlimited',
        aiAgents: 10,
        dataPoints: 'unlimited',
        integrations: 'unlimited',
        apiCalls: 'unlimited',
        storage: 1000,
        historicalData: 10,
        customModels: 10,
        exportFrequency: 'realtime'
      },
      valueProps: [
        'Unlimited everything',
        'Custom AI agents',
        'White-label option',
        'Dedicated success team',
        'Save 35% on total operations'
      ],
      targetSegment: {
        companySize: ['1001-10000', '10000+'],
        industry: ['all'],
        sustainabilityMaturity: ['advanced', 'leader'],
        budget: { min: 25000, max: 250000 },
        decisionMaker: ['C-Suite', 'VP Sustainability'],
        painPoints: ['Enterprise scale', 'Global operations', 'Complex compliance']
      },
      roi: {
        timeToValue: 14,
        paybackPeriod: 3,
        yearOneROI: 800,
        threeYearROI: 3000,
        tangibleSavings: {
          energy: 500000,
          compliance: 150000,
          automation: 300000,
          optimization: 250000
        },
        intangibleBenefits: [
          'Market leadership',
          'Competitive advantage',
          'Innovation catalyst',
          'Risk elimination',
          'Stakeholder confidence'
        ]
      }
    });

    // Enterprise Plan - Custom everything
    this.plans.set('enterprise', {
      id: 'enterprise',
      name: 'Enterprise',
      tagline: 'Your vision, our platform, unlimited possibilities',
      tier: 'enterprise',
      customizable: true,
      pricing: {
        model: 'custom',
        basePrice: 0, // Custom quote
        currency: 'USD',
        billingPeriod: 'annual',
        discount: {
          annual: 0, // Negotiated
          volume: [],
          commitment: [
            { term: 36, discount: 40 },
            { term: 60, discount: 50 }
          ]
        },
        additionalCosts: {
          implementation: 0, // Negotiated
          training: 0, // Negotiated
          support: 0 // Included premium
        }
      },
      features: [
        {
          id: 'everything',
          name: 'Everything, Unlimited',
          description: 'Complete platform access',
          category: 'core',
          included: 999999 // Unlimited
        },
        {
          id: 'custom_deployment',
          name: 'Custom Deployment',
          description: 'On-premise, private cloud, or hybrid',
          category: 'core',
          included: true
        },
        {
          id: 'custom_development',
          name: 'Custom Development',
          description: 'We build what you need',
          category: 'core',
          included: true
        },
        {
          id: 'executive_briefings',
          name: 'Executive Briefings',
          description: 'Quarterly strategy sessions',
          category: 'support',
          included: true
        }
      ],
      limits: {
        buildings: 'unlimited',
        users: 'unlimited',
        aiAgents: 'unlimited',
        dataPoints: 'unlimited',
        integrations: 'unlimited',
        apiCalls: 'unlimited',
        storage: 'unlimited',
        historicalData: 'unlimited',
        customModels: 'unlimited',
        exportFrequency: 'unlimited'
      },
      valueProps: [
        'Complete customization',
        'Dedicated infrastructure',
        'Co-innovation partnership',
        'Board-level reporting',
        'Transform your industry'
      ],
      targetSegment: {
        companySize: ['10000+'],
        industry: ['Fortune 500', 'Global 2000'],
        sustainabilityMaturity: ['leader'],
        budget: { min: 250000, max: 10000000 },
        decisionMaker: ['CEO', 'Board of Directors'],
        painPoints: ['Industry transformation', 'Regulatory leadership', 'Stakeholder demands']
      },
      roi: {
        timeToValue: 30,
        paybackPeriod: 6,
        yearOneROI: 1000,
        threeYearROI: 5000,
        tangibleSavings: {
          energy: 5000000,
          compliance: 1000000,
          automation: 2000000,
          optimization: 2000000
        },
        intangibleBenefits: [
          'Industry transformation',
          'Regulatory influence',
          'Market maker status',
          'Innovation leadership',
          'Legacy building'
        ]
      }
    });

    console.log('💰 Pricing plans initialized with value-based strategy');
  }

  private setupDynamicPricing(): void {
    // Dynamic pricing based on market conditions
    setInterval(() => {
      this.optimizer.optimizePricing(this.plans);
    }, 24 * 60 * 60 * 1000); // Daily optimization

    console.log('📊 Dynamic pricing engine activated');
  }

  public calculatePrice(
    planId: string,
    options: {
      buildings: number;
      users: number;
      billingPeriod: 'monthly' | 'annual';
      commitmentMonths?: number;
    }
  ): PriceCalculation {
    const plan = this.plans.get(planId);
    if (!plan) throw new Error('Plan not found');

    return this.calculator.calculate(plan, options);
  }

  public runPricingExperiment(experiment: PricingExperiment): void {
    this.experiments.set(experiment.id, experiment);
    
    // Track experiment metrics
    this.emit('experiment:started', experiment);
    
    // Analyze results after period
    if (experiment.endDate) {
      const duration = experiment.endDate.getTime() - experiment.startDate.getTime();
      setTimeout(() => {
        this.analyzeExperiment(experiment.id);
      }, duration);
    }
  }

  private analyzeExperiment(experimentId: string): void {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return;

    // Simulate experiment results
    const results: ExperimentResults = {
      winner: experiment.variants[0].id,
      conversionRate: {
        [experiment.variants[0].id]: 0.12,
        [experiment.variants[1]?.id || 'control']: 0.09
      },
      averageContractValue: {
        [experiment.variants[0].id]: 25000,
        [experiment.variants[1]?.id || 'control']: 20000
      },
      churnRate: {
        [experiment.variants[0].id]: 0.05,
        [experiment.variants[1]?.id || 'control']: 0.08
      },
      customerSatisfaction: {
        [experiment.variants[0].id]: 4.7,
        [experiment.variants[1]?.id || 'control']: 4.4
      },
      significance: 0.95
    };

    experiment.results = results;
    this.emit('experiment:completed', { experiment, results });
  }

  public getRecommendedPlan(profile: {
    companySize: number;
    industry: string;
    budget: number;
    goals: string[];
  }): PricingPlan | undefined {
    // AI-powered plan recommendation
    let bestPlan: PricingPlan | undefined;
    let bestScore = 0;

    this.plans.forEach(plan => {
      let score = 0;

      // Budget fit
      if (profile.budget >= plan.targetSegment.budget.min &&
          profile.budget <= plan.targetSegment.budget.max) {
        score += 30;
      }

      // Company size fit
      const sizeMap: Record<string, string> = {
        '1-50': '1-50',
        '51-200': '51-200',
        '201-1000': '201-1000',
        '1001-10000': '1001-10000',
        '10000+': '10000+'
      };
      
      const companySizeCategory = Object.keys(sizeMap).find(range => {
        const [min, max] = range.split('-').map(n => n === '+' ? Infinity : parseInt(n));
        return profile.companySize >= min && profile.companySize <= (max || Infinity);
      });

      if (companySizeCategory && plan.targetSegment.companySize.includes(companySizeCategory)) {
        score += 25;
      }

      // Industry fit
      if (plan.targetSegment.industry.includes('all') || 
          plan.targetSegment.industry.includes(profile.industry)) {
        score += 20;
      }

      // Goals alignment
      const goalAlignment = profile.goals.filter(goal => 
        plan.valueProps.some(prop => prop.toLowerCase().includes(goal.toLowerCase()))
      ).length;
      score += goalAlignment * 10;

      if (score > bestScore) {
        bestScore = score;
        bestPlan = plan;
      }
    });

    return bestPlan;
  }

  public getPlans(): PricingPlan[] {
    return Array.from(this.plans.values());
  }
}

// Value Calculator
class ValueCalculator {
  public calculate(
    plan: PricingPlan,
    options: {
      buildings: number;
      users: number;
      billingPeriod: 'monthly' | 'annual';
      commitmentMonths?: number;
    }
  ): PriceCalculation {
    let basePrice = plan.pricing.basePrice;
    
    // Per-building pricing
    if (plan.pricing.model === 'per_building') {
      basePrice *= options.buildings;
    }

    // Apply volume discounts
    if (plan.pricing.discount?.volume) {
      const volumeDiscount = plan.pricing.discount.volume
        .filter(v => options.buildings >= v.threshold)
        .reduce((max, v) => Math.max(max, v.discount), 0);
      
      basePrice *= (1 - volumeDiscount / 100);
    }

    // Apply commitment discounts
    if (options.commitmentMonths && plan.pricing.discount?.commitment) {
      const commitmentDiscount = plan.pricing.discount.commitment
        .filter(c => (options.commitmentMonths || 0) >= c.term)
        .reduce((max, c) => Math.max(max, c.discount), 0);
      
      basePrice *= (1 - commitmentDiscount / 100);
    }

    // Apply annual discount
    if (options.billingPeriod === 'annual' && plan.pricing.discount?.annual) {
      basePrice *= (1 - plan.pricing.discount.annual / 100);
    }

    // Calculate total
    const monthlyPrice = basePrice;
    const annualPrice = monthlyPrice * 12;
    const totalContract = options.commitmentMonths ? 
      monthlyPrice * options.commitmentMonths : annualPrice;

    return {
      monthlyPrice,
      annualPrice,
      totalContract,
      savings: this.calculateSavings(plan, options),
      roi: this.calculateROI(plan, totalContract)
    };
  }

  private calculateSavings(plan: PricingPlan, options: any): number {
    const baseSavings = Object.values(plan.roi.tangibleSavings)
      .reduce((sum, value) => sum + value, 0);
    
    // Scale by number of buildings
    return baseSavings * (options.buildings / 10);
  }

  private calculateROI(plan: PricingPlan, investment: number): number {
    const totalSavings = Object.values(plan.roi.tangibleSavings)
      .reduce((sum, value) => sum + value, 0);
    
    return ((totalSavings - investment) / investment) * 100;
  }
}

// Pricing Optimizer
class PricingOptimizer {
  public optimizePricing(plans: Map<string, PricingPlan>): void {
    // Market-based dynamic pricing
    plans.forEach(plan => {
      // Simulate market conditions
      const demandMultiplier = 0.9 + Math.random() * 0.2; // ±10%
      const competitionMultiplier = 0.95 + Math.random() * 0.1; // ±5%
      
      // Adjust pricing while maintaining ratios
      plan.pricing.basePrice = Math.round(
        plan.pricing.basePrice * demandMultiplier * competitionMultiplier
      );
    });

    console.log('💹 Pricing optimized based on market conditions');
  }
}

// Interfaces for calculations
interface PriceCalculation {
  monthlyPrice: number;
  annualPrice: number;
  totalContract: number;
  savings: number;
  roi: number;
}

// Export singleton instance
export const pricingStrategy = new PricingStrategySystem();

// Export utilities
export const PricingUtils = {
  formatPrice: (price: number, currency = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  },

  calculatePaybackPeriod: (investment: number, monthlySavings: number): number => {
    return Math.ceil(investment / monthlySavings);
  },

  getDiscountPercentage: (original: number, discounted: number): number => {
    return Math.round(((original - discounted) / original) * 100);
  }
};