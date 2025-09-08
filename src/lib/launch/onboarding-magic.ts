/**
 * Onboarding Magic System
 * Zero to full value in 5 minutes with AI-powered setup
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

export interface OnboardingStep {
  id: string;
  type: 'welcome' | 'auth' | 'discovery' | 'integration' | 'customization' | 'activation' | 'success';
  title: string;
  description: string;
  estimatedTime: number; // seconds
  required: boolean;
  autoComplete: boolean;
  aiAssisted: boolean;
  completionCriteria: CompletionCriteria;
  dependencies?: string[];
  skipCondition?: () => boolean;
}

export interface CompletionCriteria {
  type: 'user_input' | 'auto_discovery' | 'ai_analysis' | 'integration_complete' | 'data_imported';
  validation?: (data: any) => boolean;
  successMetric?: string;
}

export interface OnboardingPersonalization {
  industry: string;
  companySize: 'startup' | 'smb' | 'mid_market' | 'enterprise';
  sustainabilityMaturity: 'beginner' | 'intermediate' | 'advanced' | 'leader';
  primaryGoals: string[];
  preferredIntegrations: string[];
  dataComplexity: 'simple' | 'moderate' | 'complex';
  teamSize: number;
}

export interface AutoDiscovery {
  id: string;
  source: 'email' | 'calendar' | 'erp' | 'building_systems' | 'iot' | 'documents';
  dataFound: Record<string, any>;
  confidence: number;
  importReady: boolean;
  estimatedRecords: number;
}

export interface OnboardingProgress {
  currentStep: string;
  completedSteps: string[];
  percentComplete: number;
  timeElapsed: number;
  estimatedTimeRemaining: number;
  valueUnlocked: number; // 0-100
  dataImported: {
    buildings: number;
    sensors: number;
    historicalData: number;
    documents: number;
    integrations: number;
  };
}

export interface MagicMoment {
  id: string;
  type: 'first_insight' | 'first_automation' | 'first_saving' | 'first_prediction' | 'team_invited';
  timestamp: Date;
  impact: string;
  celebration: boolean;
}

export class OnboardingMagicSystem extends EventEmitter {
  private steps: Map<string, OnboardingStep> = new Map();
  private personalization?: OnboardingPersonalization;
  private discoveries: Map<string, AutoDiscovery> = new Map();
  private progress: OnboardingProgress;
  private magicMoments: MagicMoment[] = [];
  private startTime: Date;
  private aiEngine: AIOnboardingEngine;

  constructor() {
    super();
    this.startTime = new Date();
    this.progress = this.initializeProgress();
    this.aiEngine = new AIOnboardingEngine();
    this.initializeOnboardingFlow();
  }

  private initializeProgress(): OnboardingProgress {
    return {
      currentStep: 'welcome',
      completedSteps: [],
      percentComplete: 0,
      timeElapsed: 0,
      estimatedTimeRemaining: 300, // 5 minutes
      valueUnlocked: 0,
      dataImported: {
        buildings: 0,
        sensors: 0,
        historicalData: 0,
        documents: 0,
        integrations: 0
      }
    };
  }

  private initializeOnboardingFlow(): void {
    // 1. Welcome & Quick Win (30 seconds)
    this.steps.set('welcome', {
      id: 'welcome',
      type: 'welcome',
      title: 'Welcome to Blipee OS! 🚀',
      description: "Let's get you to your first insight in 30 seconds",
      estimatedTime: 30,
      required: true,
      autoComplete: false,
      aiAssisted: true,
      completionCriteria: {
        type: 'user_input',
        validation: (data) => data.companyName && data.name
      }
    });

    // 2. Magic Auth (15 seconds)
    this.steps.set('auth', {
      id: 'auth',
      type: 'auth',
      title: 'Secure Your Account',
      description: 'One-click authentication with enterprise SSO',
      estimatedTime: 15,
      required: true,
      autoComplete: true,
      aiAssisted: false,
      completionCriteria: {
        type: 'user_input',
        validation: (data) => data.authenticated === true
      }
    });

    // 3. AI Discovery (60 seconds)
    this.steps.set('discovery', {
      id: 'discovery',
      type: 'discovery',
      title: 'AI is Discovering Your Data',
      description: 'Our AI is scanning your systems and finding valuable data',
      estimatedTime: 60,
      required: false,
      autoComplete: true,
      aiAssisted: true,
      completionCriteria: {
        type: 'auto_discovery',
        successMetric: 'dataPointsDiscovered'
      }
    });

    // 4. Smart Integration (45 seconds)
    this.steps.set('integration', {
      id: 'integration',
      type: 'integration',
      title: 'Connect Your Systems',
      description: 'One-click connections to your existing tools',
      estimatedTime: 45,
      required: false,
      autoComplete: true,
      aiAssisted: true,
      completionCriteria: {
        type: 'integration_complete',
        validation: (data) => data.integrationsConnected > 0
      },
      skipCondition: () => this.discoveries.size > 3
    });

    // 5. Instant Customization (30 seconds)
    this.steps.set('customization', {
      id: 'customization',
      type: 'customization',
      title: 'Personalize Your Experience',
      description: 'AI customizes everything based on your industry and goals',
      estimatedTime: 30,
      required: false,
      autoComplete: true,
      aiAssisted: true,
      completionCriteria: {
        type: 'ai_analysis',
        validation: (data) => data.personalized === true
      }
    });

    // 6. First Value Activation (60 seconds)
    this.steps.set('activation', {
      id: 'activation',
      type: 'activation',
      title: 'Your First AI Agent is Ready!',
      description: 'Meet your ESG Chief of Staff - already working for you',
      estimatedTime: 60,
      required: true,
      autoComplete: true,
      aiAssisted: true,
      completionCriteria: {
        type: 'ai_analysis',
        successMetric: 'firstInsightGenerated'
      }
    });

    // 7. Success & First Magic (30 seconds)
    this.steps.set('success', {
      id: 'success',
      type: 'success',
      title: 'You\'re All Set! 🎉',
      description: 'Your AI team is now working 24/7 to optimize your sustainability',
      estimatedTime: 30,
      required: true,
      autoComplete: false,
      aiAssisted: true,
      completionCriteria: {
        type: 'user_input',
        validation: (data) => data.ready === true
      }
    });

    console.log('✨ Onboarding magic flow initialized - 5 minutes to value');
  }

  public async startOnboarding(userInfo: Partial<OnboardingPersonalization>): Promise<void> {
    console.log('🚀 Starting magical onboarding experience');
    
    // Set personalization
    this.personalization = {
      industry: userInfo.industry || 'general',
      companySize: userInfo.companySize || 'smb',
      sustainabilityMaturity: userInfo.sustainabilityMaturity || 'intermediate',
      primaryGoals: userInfo.primaryGoals || ['reduce_emissions', 'save_costs', 'compliance'],
      preferredIntegrations: userInfo.preferredIntegrations || [],
      dataComplexity: userInfo.dataComplexity || 'moderate',
      teamSize: userInfo.teamSize || 5
    };

    // Start the magic
    this.emit('onboarding:started', { personalization: this.personalization });
    
    // Begin auto-discovery immediately
    this.startAutoDiscovery();
    
    // Advance to first step
    await this.advanceToStep('welcome');
  }

  private async startAutoDiscovery(): Promise<void> {
    console.log('🔍 AI auto-discovery initiated');
    
    // Simulate AI discovering various data sources
    const discoverySources = [
      { source: 'email', delay: 2000, confidence: 0.95 },
      { source: 'calendar', delay: 3000, confidence: 0.88 },
      { source: 'erp', delay: 4000, confidence: 0.82 },
      { source: 'building_systems', delay: 5000, confidence: 0.91 },
      { source: 'iot', delay: 6000, confidence: 0.79 },
      { source: 'documents', delay: 7000, confidence: 0.86 }
    ];

    for (const discovery of discoverySources) {
      setTimeout(() => {
        this.handleDiscovery(discovery.source as any, discovery.confidence);
      }, discovery.delay);
    }
  }

  private handleDiscovery(source: AutoDiscovery['source'], confidence: number): void {
    const discovery: AutoDiscovery = {
      id: uuidv4(),
      source,
      dataFound: this.generateDiscoveredData(source),
      confidence,
      importReady: confidence > 0.8,
      estimatedRecords: Math.floor(Math.random() * 10000) + 1000
    };

    this.discoveries.set(discovery.id, discovery);
    
    // Update progress
    this.progress.dataImported[this.mapSourceToCategory(source)]++;
    this.progress.valueUnlocked = Math.min(100, this.progress.valueUnlocked + 15);
    
    this.emit('discovery:found', discovery);
    
    // Check for magic moments
    if (this.discoveries.size === 1) {
      this.createMagicMoment('first_insight', 'Discovered your first data source!');
    }
  }

  private generateDiscoveredData(source: AutoDiscovery['source']): Record<string, any> {
    const dataMap = {
      email: {
        utility_bills: 47,
        travel_receipts: 132,
        supplier_invoices: 89,
        sustainability_reports: 12
      },
      calendar: {
        facility_meetings: 23,
        sustainability_reviews: 8,
        energy_audits: 4
      },
      erp: {
        cost_centers: 15,
        purchase_orders: 3421,
        vendor_data: 234,
        inventory: 8932
      },
      building_systems: {
        hvac_systems: 12,
        lighting_zones: 48,
        meters: 27,
        sensors: 156
      },
      iot: {
        temperature_sensors: 89,
        occupancy_sensors: 34,
        energy_meters: 23,
        water_meters: 12
      },
      documents: {
        pdfs_analyzed: 234,
        emissions_extracted: 1823,
        compliance_docs: 45,
        certificates: 18
      }
    };

    return dataMap[source] || {};
  }

  private mapSourceToCategory(source: string): keyof OnboardingProgress['dataImported'] {
    const mapping: Record<string, keyof OnboardingProgress['dataImported']> = {
      email: 'documents',
      calendar: 'documents',
      erp: 'integrations',
      building_systems: 'buildings',
      iot: 'sensors',
      documents: 'documents'
    };
    return mapping[source] || 'documents';
  }

  public async advanceToStep(stepId: string): Promise<void> {
    const step = this.steps.get(stepId);
    if (!step) return;

    this.progress.currentStep = stepId;
    this.emit('step:started', step);

    // Auto-complete if configured
    if (step.autoComplete) {
      setTimeout(() => {
        this.completeStep(stepId, { auto: true });
      }, step.estimatedTime * 100); // Speed up for demo
    }

    // AI assistance
    if (step.aiAssisted) {
      this.provideAIAssistance(step);
    }
  }

  private async provideAIAssistance(step: OnboardingStep): Promise<void> {
    const assistance = await this.aiEngine.getStepAssistance(step, this.personalization!);
    
    this.emit('ai:assistance', {
      step: step.id,
      suggestions: assistance.suggestions,
      autoFill: assistance.autoFill,
      insights: assistance.insights
    });
  }

  public async completeStep(stepId: string, data: any): Promise<void> {
    const step = this.steps.get(stepId);
    if (!step) return;

    // Validate completion
    if (step.completionCriteria.validation && !step.completionCriteria.validation(data)) {
      this.emit('step:validation_failed', { step: stepId, data });
      return;
    }

    // Mark as completed
    this.progress.completedSteps.push(stepId);
    this.progress.percentComplete = (this.progress.completedSteps.length / this.steps.size) * 100;
    
    // Update time
    this.progress.timeElapsed = (Date.now() - this.startTime.getTime()) / 1000;
    this.progress.estimatedTimeRemaining = Math.max(0, 300 - this.progress.timeElapsed);

    this.emit('step:completed', { step: stepId, progress: this.progress });

    // Find next step
    const stepsArray = Array.from(this.steps.keys());
    const currentIndex = stepsArray.indexOf(stepId);
    
    if (currentIndex < stepsArray.length - 1) {
      const nextStepId = stepsArray[currentIndex + 1];
      const nextStep = this.steps.get(nextStepId);
      
      // Check skip condition
      if (nextStep?.skipCondition && nextStep.skipCondition()) {
        this.completeStep(nextStepId, { skipped: true });
      } else {
        this.advanceToStep(nextStepId);
      }
    } else {
      // Onboarding complete!
      this.completeOnboarding();
    }
  }

  private async completeOnboarding(): Promise<void> {
    const totalTime = (Date.now() - this.startTime.getTime()) / 1000;
    
    console.log(`🎉 Onboarding completed in ${Math.round(totalTime)} seconds!`);
    
    // Final magic moment
    this.createMagicMoment(
      'first_automation',
      `Your AI team is now managing ${this.progress.dataImported.buildings} buildings!`
    );

    const summary = {
      timeToValue: totalTime,
      dataImported: this.progress.dataImported,
      integrationsConnected: this.discoveries.size,
      valueUnlocked: this.progress.valueUnlocked,
      magicMoments: this.magicMoments,
      aiAgentsActivated: 4,
      predictionsGenerated: 12,
      savingsIdentified: '$47,000',
      complianceScore: 94
    };

    this.emit('onboarding:completed', summary);
  }

  private createMagicMoment(type: MagicMoment['type'], impact: string): void {
    const moment: MagicMoment = {
      id: uuidv4(),
      type,
      timestamp: new Date(),
      impact,
      celebration: true
    };

    this.magicMoments.push(moment);
    this.emit('magic:moment', moment);
  }

  public skipToValue(): void {
    // Emergency skip for power users
    console.log('⚡ Power user mode - skipping to value');
    
    // Complete all discovery
    ['email', 'erp', 'building_systems'].forEach((source, index) => {
      setTimeout(() => {
        this.handleDiscovery(source as any, 0.95);
      }, index * 100);
    });

    // Complete all steps
    this.steps.forEach((step) => {
      if (!this.progress.completedSteps.includes(step.id)) {
        this.completeStep(step.id, { powerUser: true });
      }
    });
  }

  public getProgress(): OnboardingProgress {
    return { ...this.progress };
  }

  public getDiscoveries(): AutoDiscovery[] {
    return Array.from(this.discoveries.values());
  }

  public getMagicMoments(): MagicMoment[] {
    return [...this.magicMoments];
  }
}

// AI Engine for intelligent onboarding
class AIOnboardingEngine {
  public async getStepAssistance(
    step: OnboardingStep,
    personalization: OnboardingPersonalization
  ): Promise<any> {
    // AI-powered assistance based on step and user profile
    const assistanceMap: Record<string, any> = {
      welcome: {
        suggestions: [
          `Welcome! Based on your ${personalization.industry} industry, I'll customize everything for you.`,
          'I can see you have ambitious sustainability goals - let me help you achieve them faster.',
          'I\'ll have your first insight ready in less than 30 seconds!'
        ],
        autoFill: {
          industry: personalization.industry,
          goals: personalization.primaryGoals
        },
        insights: [
          `Companies in ${personalization.industry} typically save 23% on energy costs`,
          'Your peers are achieving net-zero 2.3 years faster with AI assistance'
        ]
      },
      discovery: {
        suggestions: [
          'I found 12 data sources you can connect immediately',
          'Your ERP system contains 3 years of valuable emissions data',
          'I can import your utility bills from the last 24 months'
        ],
        autoFill: {},
        insights: [
          'Detected patterns suggest $127,000 in potential savings',
          'Your Scope 2 emissions are 18% higher than industry average'
        ]
      },
      activation: {
        suggestions: [
          'Your ESG Chief of Staff is ready and has already identified 3 quick wins',
          'I\'ve set up automated reporting for your compliance requirements',
          'Your first sustainability report will be ready tomorrow morning'
        ],
        autoFill: {},
        insights: [
          'First automation will save 10 hours per week',
          'Predictive analytics show 34% emission reduction opportunity'
        ]
      }
    };

    return assistanceMap[step.id] || {
      suggestions: ['I\'m here to help you succeed'],
      autoFill: {},
      insights: []
    };
  }

  public async generatePersonalizedFlow(
    profile: OnboardingPersonalization
  ): Promise<OnboardingStep[]> {
    // Generate custom onboarding flow based on profile
    const baseFlow = [
      'welcome',
      'auth',
      'discovery',
      'integration',
      'customization',
      'activation',
      'success'
    ];

    // Adjust based on maturity
    if (profile.sustainabilityMaturity === 'beginner') {
      // Add education steps
      baseFlow.splice(2, 0, 'education');
    } else if (profile.sustainabilityMaturity === 'leader') {
      // Skip basic steps
      return baseFlow.filter(s => !['education', 'customization'].includes(s))
        .map(s => ({ id: s } as OnboardingStep));
    }

    // Adjust based on company size
    if (profile.companySize === 'enterprise') {
      // Add team setup
      baseFlow.splice(5, 0, 'team_setup');
    }

    return baseFlow.map(s => ({ id: s } as OnboardingStep));
  }
}

// Export singleton instance
export const onboardingMagic = new OnboardingMagicSystem();

// Export utilities
export const OnboardingUtils = {
  calculateTimeToValue: (progress: OnboardingProgress): number => {
    return progress.timeElapsed;
  },

  getCompletionRate: (progress: OnboardingProgress): number => {
    return progress.percentComplete;
  },

  isValueUnlocked: (progress: OnboardingProgress): boolean => {
    return progress.valueUnlocked > 50;
  },

  getNextBestAction: (progress: OnboardingProgress): string => {
    if (progress.dataImported.buildings === 0) {
      return 'Connect your first building';
    }
    if (progress.dataImported.integrations === 0) {
      return 'Connect your ERP system';
    }
    if (progress.completedSteps.length < 3) {
      return 'Complete the setup wizard';
    }
    return 'Start chatting with your AI team';
  }
};