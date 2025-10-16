/**
 * Regulatory Intelligence Engine
 *
 * Automated detection and analysis of regulatory changes across
 * all compliance frameworks with impact assessment and action planning.
 */

import {
  RegulatoryUpdate,
  UpdateType,
  RegulatoryImpact,
  UpdateAnalysis,
  ActionItem,
  ComplianceFramework
} from '../types';
import { FrameworkFactory } from '../frameworks';

export interface RegulatorySource {
  id: string;
  name: string;
  url: string;
  type: 'rss' | 'api' | 'scraper' | 'manual';
  frameworkCodes: string[];
  checkFrequency: 'hourly' | 'daily' | 'weekly';
  credentials?: Record<string, string>;
  selectors?: Record<string, string>; // For web scraping
  enabled: boolean;
  lastChecked?: Date;
  priority: 'low' | 'medium' | 'high';
}

export interface IntelligenceConfiguration {
  organizationId: string;
  sources: RegulatorySource[];
  keywords: KeywordMapping[];
  analysisRules: AnalysisRule[];
  notificationSettings: IntelligenceNotificationSettings;
  updateRetention: number; // days
  autoAnalysis: boolean;
  machineLearning: MLConfiguration;
}

export interface KeywordMapping {
  frameworkCode: string;
  keywords: string[];
  exclusions: string[];
  weight: number; // 0-1
  categories: string[];
}

export interface AnalysisRule {
  id: string;
  name: string;
  condition: AnalysisCondition;
  impact: ImpactAssessmentRule;
  actionTemplate: ActionTemplate;
  autoExecute: boolean;
  priority: number;
}

export interface AnalysisCondition {
  keywords: string[];
  updateTypes: UpdateType[];
  frameworkCodes: string[];
  urgencyIndicators: string[];
  excludePatterns: string[];
}

export interface ImpactAssessmentRule {
  scopeFactors: string[];
  severityMapping: Record<string, 'low' | 'medium' | 'high' | 'critical'>;
  effortEstimation: EffortEstimationRule;
  stakeholderMapping: Record<string, string[]>;
}

export interface EffortEstimationRule {
  baseEffort: string;
  complexityFactors: Record<string, number>;
  timelineFactors: Record<string, number>;
  costFactors: Record<string, number>;
}

export interface ActionTemplate {
  immediateActions: string[];
  shortTermActions: string[];
  mediumTermActions: string[];
  longTermActions: string[];
  stakeholderActions: Record<string, string[]>;
}

export interface IntelligenceNotificationSettings {
  enabled: boolean;
  recipients: IntelligenceRecipient[];
  urgencyThresholds: Record<string, number>; // minutes for different severity levels
  channels: NotificationChannel[];
  aggregation: {
    enabled: boolean;
    windowMinutes: number;
    maxUpdatesPerWindow: number;
  };
}

export interface IntelligenceRecipient {
  email: string;
  role: string;
  frameworkCodes: string[];
  updateTypes: UpdateType[];
  severityThreshold: 'low' | 'medium' | 'high' | 'critical';
}

export interface NotificationChannel {
  type: 'email' | 'sms' | 'webhook' | 'slack' | 'teams';
  config: Record<string, any>;
  enabled: boolean;
}

export interface MLConfiguration {
  enabled: boolean;
  models: {
    classificationModel?: string;
    impactPredictionModel?: string;
    urgencyPredictionModel?: string;
  };
  trainingData: {
    minSamples: number;
    retrainThreshold: number;
    validationSplit: number;
  };
  features: {
    textFeatures: boolean;
    temporalFeatures: boolean;
    contextualFeatures: boolean;
  };
}

export interface DetectionResult {
  sourceId: string;
  updates: RegulatoryUpdate[];
  errors: string[];
  processingTime: number;
  nextCheck: Date;
}

export interface AnalysisResult {
  updateId: string;
  analysis: UpdateAnalysis;
  impact: RegulatoryImpact;
  actionItems: ActionItem[];
  confidence: number;
  processingTime: number;
  mlPredictions?: MLPredictions;
}

export interface MLPredictions {
  urgencyScore: number;
  impactScore: number;
  categoryProbabilities: Record<string, number>;
  similarUpdates: string[];
}

export interface IntelligenceMetrics {
  totalUpdatesDetected: number;
  updatesByFramework: Record<string, number>;
  updatesBySeverity: Record<string, number>;
  averageAnalysisTime: number;
  sourceReliability: Record<string, number>;
  actionItemsGenerated: number;
  falsePositiveRate: number;
  mlModelAccuracy?: number;
}

export class RegulatoryIntelligenceEngine {
  private config: IntelligenceConfiguration;
  private updateCache: Map<string, RegulatoryUpdate> = new Map();
  private analysisCache: Map<string, AnalysisResult> = new Map();
  private sourceStatus: Map<string, SourceStatus> = new Map();
  private isRunning: boolean = false;
  private scheduledTasks: Map<string, NodeJS.Timeout> = new Map();

  constructor(config: IntelligenceConfiguration) {
    this.config = config;
  }

  /**
   * Start the regulatory intelligence engine
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Regulatory intelligence engine is already running');
    }


    this.isRunning = true;

    // Initialize sources
    await this.initializeSources();

    // Schedule monitoring tasks
    await this.scheduleMonitoringTasks();

    // Start ML model training if enabled
    if (this.config.machinelearning?.enabled) {
      await this.initializeMLModels();
    }

  }

  /**
   * Stop the regulatory intelligence engine
   */
  public async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }


    this.isRunning = false;

    // Clear scheduled tasks
    this.scheduledTasks.forEach(task => clearTimeout(task));
    this.scheduledTasks.clear();

  }

  /**
   * Detect regulatory updates from all sources
   */
  public async detectUpdates(): Promise<DetectionResult[]> {

    const results: DetectionResult[] = [];

    for (const source of this.config.sources) {
      if (!source.enabled) continue;

      const startTime = Date.now();

      try {
        const updates = await this.detectFromSource(source);
        const processingTime = Date.now() - startTime;

        // Update source status
        this.updateSourceStatus(source.id, true, updates.length);

        results.push({
          sourceId: source.id,
          updates,
          errors: [],
          processingTime,
          nextCheck: this.calculateNextCheck(source)
        });

        // Cache new updates
        for (const update of updates) {
          this.updateCache.set(update.id, update);
        }

        // Auto-analyze if enabled
        if (this.config.autoAnalysis) {
          for (const update of updates) {
            await this.analyzeUpdate(update);
          }
        }

      } catch (error) {
        const processingTime = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        // Update source status
        this.updateSourceStatus(source.id, false, 0, errorMessage);

        results.push({
          sourceId: source.id,
          updates: [],
          errors: [errorMessage],
          processingTime,
          nextCheck: this.calculateNextCheck(source)
        });

        console.error(`❌ Failed to detect updates from source ${source.name}:`, error);
      }
    }

    return results;
  }

  /**
   * Analyze a regulatory update
   */
  public async analyzeUpdate(update: RegulatoryUpdate): Promise<AnalysisResult> {

    const startTime = Date.now();

    try {
      // Check cache first
      if (this.analysisCache.has(update.id)) {
        return this.analysisCache.get(update.id)!;
      }

      // Perform rule-based analysis
      const ruleAnalysis = await this.performRuleBasedAnalysis(update);

      // Perform ML analysis if enabled
      let mlPredictions: MLPredictions | undefined;
      if (this.config.machinelearning?.enabled) {
        mlPredictions = await this.performMLAnalysis(update);
      }

      // Combine analyses
      const analysis = await this.combineAnalyses(update, ruleAnalysis, mlPredictions);

      // Generate action items
      const actionItems = await this.generateActionItems(update, analysis);

      const result: AnalysisResult = {
        updateId: update.id,
        analysis,
        impact: update.impact,
        actionItems,
        confidence: this.calculateConfidence(ruleAnalysis, mlPredictions),
        processingTime: Date.now() - startTime,
        mlPredictions
      };

      // Cache result
      this.analysisCache.set(update.id, result);

      // Process through framework engines
      await this.processWithFrameworkEngines(update, result);

      // Send notifications if required
      await this.sendIntelligenceNotifications(update, result);

      return result;

    } catch (error) {
      console.error(`❌ Failed to analyze update ${update.id}:`, error);
      throw error;
    }
  }

  /**
   * Get regulatory intelligence metrics
   */
  public getIntelligenceMetrics(): IntelligenceMetrics {
    const updates = Array.from(this.updateCache.values());
    const analyses = Array.from(this.analysisCache.values());

    // Calculate metrics
    const updatesByFramework: Record<string, number> = {};
    const updatesBySeverity: Record<string, number> = {};

    for (const update of updates) {
      // Count by framework
      if (!updatesByFramework[update.frameworkId]) {
        updatesByFramework[update.frameworkId] = 0;
      }
      updatesByFramework[update.frameworkId]++;

      // Count by severity
      if (!updatesBySeverity[update.impact.severity]) {
        updatesBySeverity[update.impact.severity] = 0;
      }
      updatesBySeverity[update.impact.severity]++;
    }

    const averageAnalysisTime = analyses.length > 0
      ? analyses.reduce((sum, a) => sum + a.processingTime, 0) / analyses.length
      : 0;

    const actionItemsGenerated = analyses.reduce((sum, a) => sum + a.actionItems.length, 0);

    // Calculate source reliability
    const sourceReliability: Record<string, number> = {};
    for (const [sourceId, status] of this.sourceStatus) {
      sourceReliability[sourceId] = status.successRate;
    }

    return {
      totalUpdatesDetected: updates.length,
      updatesByFramework,
      updatesBySeverity,
      averageAnalysisTime,
      sourceReliability,
      actionItemsGenerated,
      falsePositiveRate: 0.05, // Would be calculated from feedback
      mlModelAccuracy: this.config.machinelearning?.enabled ? 0.85 : undefined
    };
  }

  /**
   * Search regulatory updates
   */
  public searchUpdates(query: {
    keywords?: string[];
    frameworkCodes?: string[];
    updateTypes?: UpdateType[];
    dateRange?: { start: Date; end: Date };
    severity?: string[];
    limit?: number;
  }): RegulatoryUpdate[] {
    let results = Array.from(this.updateCache.values());

    // Apply filters
    if (query.keywords) {
      results = results.filter(update =>
        query.keywords!.some(keyword =>
          update.title.toLowerCase().includes(keyword.toLowerCase()) ||
          update.description.toLowerCase().includes(keyword.toLowerCase())
        )
      );
    }

    if (query.frameworkCodes) {
      results = results.filter(update =>
        query.frameworkCodes!.includes(update.frameworkId)
      );
    }

    if (query.updateTypes) {
      results = results.filter(update =>
        query.updateTypes!.includes(update.type)
      );
    }

    if (query.dateRange) {
      results = results.filter(update =>
        update.publishedDate >= query.dateRange!.start &&
        update.publishedDate <= query.dateRange!.end
      );
    }

    if (query.severity) {
      results = results.filter(update =>
        query.severity!.includes(update.impact.severity)
      );
    }

    // Sort by relevance/recency
    results.sort((a, b) => b.publishedDate.getTime() - a.publishedDate.getTime());

    // Apply limit
    if (query.limit) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  // Private methods

  private async initializeSources(): Promise<void> {
    for (const source of this.config.sources) {
      this.sourceStatus.set(source.id, {
        isHealthy: true,
        lastCheck: null,
        successCount: 0,
        errorCount: 0,
        successRate: 1.0,
        lastError: null,
        updatesDetected: 0
      });
    }
  }

  private async scheduleMonitoringTasks(): Promise<void> {
    for (const source of this.config.sources) {
      if (!source.enabled) continue;

      const delay = this.calculateSourceDelay(source);

      const taskId = setTimeout(async () => {
        if (this.isRunning) {
          await this.detectFromSource(source);
          // Reschedule
          await this.scheduleSourceMonitoring(source);
        }
      }, delay);

      this.scheduledTasks.set(source.id, taskId);
    }
  }

  private async scheduleSourceMonitoring(source: RegulatorySource): Promise<void> {
    const delay = this.calculateSourceDelay(source);

    const taskId = setTimeout(async () => {
      if (this.isRunning) {
        await this.detectFromSource(source);
        await this.scheduleSourceMonitoring(source);
      }
    }, delay);

    this.scheduledTasks.set(source.id, taskId);
  }

  private calculateSourceDelay(source: RegulatorySource): number {
    const baseDelay = {
      'hourly': 60 * 60 * 1000,
      'daily': 24 * 60 * 60 * 1000,
      'weekly': 7 * 24 * 60 * 60 * 1000
    };

    return baseDelay[source.checkFrequency];
  }

  private async detectFromSource(source: RegulatorySource): Promise<RegulatoryUpdate[]> {

    switch (source.type) {
      case 'rss':
        return await this.detectFromRSS(source);
      case 'api':
        return await this.detectFromAPI(source);
      case 'scraper':
        return await this.detectFromWebScraper(source);
      case 'manual':
        return await this.detectFromManualSource(source);
      default:
        throw new Error(`Unsupported source type: ${source.type}`);
    }
  }

  private async detectFromRSS(source: RegulatorySource): Promise<RegulatoryUpdate[]> {
    // Implementation for RSS feed monitoring
    // This would use a RSS parser library

    // Mock implementation
    return [
      {
        id: `rss_${source.id}_${Date.now()}`,
        frameworkId: source.frameworkCodes[0],
        title: 'New Environmental Reporting Guidance',
        description: 'Updated guidance on environmental disclosure requirements',
        type: 'guidance',
        effectiveDate: new Date('2025-01-01'),
        source: source.name,
        url: source.url,
        impact: {
          scope: ['reporting_requirements'],
          severity: 'medium',
          effort: 'moderate',
          cost: 5000,
          timeline: '3 months',
          affectedRequirements: ['environmental_disclosure'],
          newRequirements: [],
          removedRequirements: []
        },
        analysis: {
          summary: 'New guidance provides clarity on environmental reporting',
          keyChanges: ['Enhanced disclosure requirements'],
          businessImplications: ['Updated reporting processes needed'],
          technicalImplications: ['System updates required'],
          complianceGaps: [],
          opportunities: ['Improved stakeholder communication'],
          risks: ['Non-compliance if not implemented'],
          confidence: 0.8,
          analyst: 'AI Regulatory Intelligence',
          analysisDate: new Date()
        },
        actionItems: [],
        stakeholders: ['compliance_team'],
        status: 'detected',
        publishedDate: new Date(),
        detectedDate: new Date()
      }
    ];
  }

  private async detectFromAPI(source: RegulatorySource): Promise<RegulatoryUpdate[]> {
    // Implementation for API-based monitoring

    // This would make actual API calls
    return [];
  }

  private async detectFromWebScraper(source: RegulatorySource): Promise<RegulatoryUpdate[]> {
    // Implementation for web scraping

    // This would use a web scraping library
    return [];
  }

  private async detectFromManualSource(source: RegulatorySource): Promise<RegulatoryUpdate[]> {
    // Implementation for manual source monitoring

    // This would check a manual input system
    return [];
  }

  private updateSourceStatus(
    sourceId: string,
    success: boolean,
    updatesDetected: number,
    error?: string
  ): void {
    const status = this.sourceStatus.get(sourceId);
    if (!status) return;

    status.lastCheck = new Date();
    status.updatesDetected += updatesDetected;

    if (success) {
      status.successCount++;
      status.isHealthy = true;
      status.lastError = null;
    } else {
      status.errorCount++;
      status.lastError = error || null;
      // Mark as unhealthy if error rate is too high
      status.isHealthy = status.successCount / (status.successCount + status.errorCount) > 0.8;
    }

    status.successRate = status.successCount / (status.successCount + status.errorCount);
  }

  private calculateNextCheck(source: RegulatorySource): Date {
    const delay = this.calculateSourceDelay(source);
    return new Date(Date.now() + delay);
  }

  private async performRuleBasedAnalysis(update: RegulatoryUpdate): Promise<any> {
    // Implement rule-based analysis
    return {
      matchedRules: [],
      riskScore: 0.5,
      urgencyScore: 0.6,
      complexityScore: 0.4
    };
  }

  private async performMLAnalysis(update: RegulatoryUpdate): Promise<MLPredictions> {
    // Implement ML-based analysis
    return {
      urgencyScore: 0.7,
      impactScore: 0.6,
      categoryProbabilities: {
        'reporting': 0.8,
        'governance': 0.2
      },
      similarUpdates: []
    };
  }

  private async combineAnalyses(
    update: RegulatoryUpdate,
    ruleAnalysis: any,
    mlPredictions?: MLPredictions
  ): Promise<UpdateAnalysis> {
    // Combine rule-based and ML analyses
    return update.analysis;
  }

  private async generateActionItems(update: RegulatoryUpdate, analysis: UpdateAnalysis): Promise<ActionItem[]> {
    // Generate action items based on analysis
    return [
      {
        id: `action_${update.id}_1`,
        title: 'Review Update Requirements',
        description: 'Analyze the new regulatory requirements',
        priority: 'high',
        type: 'immediate',
        assignee: 'compliance_team',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'pending',
        dependencies: [],
        resources: []
      }
    ];
  }

  private calculateConfidence(ruleAnalysis: any, mlPredictions?: MLPredictions): number {
    // Calculate overall confidence score
    let confidence = 0.5;

    if (ruleAnalysis && mlPredictions) {
      // Combine rule and ML confidence
      confidence = (0.6 * ruleAnalysis.confidence + 0.4 * mlPredictions.urgencyScore);
    } else if (ruleAnalysis) {
      confidence = ruleAnalysis.confidence;
    } else if (mlPredictions) {
      confidence = mlPredictions.urgencyScore;
    }

    return Math.min(1.0, Math.max(0.0, confidence));
  }

  private async processWithFrameworkEngines(update: RegulatoryUpdate, result: AnalysisResult): Promise<void> {
    // Process update with relevant framework engines
    const engine = FrameworkFactory.createEngine(update.frameworkId, this.config.organizationId);
    await engine.processRegulatoryUpdate(update);
  }

  private async sendIntelligenceNotifications(update: RegulatoryUpdate, result: AnalysisResult): Promise<void> {
    // Send notifications based on configuration
    if (this.config.notificationSettings.enabled) {
    }
  }

  private async initializeMLModels(): Promise<void> {
    // Initialize machine learning models
  }
}

interface SourceStatus {
  isHealthy: boolean;
  lastCheck: Date | null;
  successCount: number;
  errorCount: number;
  successRate: number;
  lastError: string | null;
  updatesDetected: number;
}