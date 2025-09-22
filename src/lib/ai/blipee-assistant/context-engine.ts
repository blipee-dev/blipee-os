/**
 * Blipee Assistant Context Engine
 * Extracts and builds rich context from every interaction
 */

import { UserRole } from '@/types/auth';
import {
  UserContext,
  PageContext,
  EnvironmentalContext,
  CompleteContext,
  Alert,
  Approval,
  Change,
  ConversationSummary
} from './types';
import { createClient } from '@/lib/supabase/server';
import { cache } from '@/lib/cache/redis-wrapper';

export class ContextEngine {
  /**
   * Extract complete context from current state
   */
  static async extractCompleteContext(
    session: any,
    pathname: string,
    message?: string
  ): Promise<CompleteContext> {
    const [userContext, pageContext, environmentalContext] = await Promise.all([
      this.extractUserContext(session),
      this.extractPageContext(pathname),
      this.extractEnvironmentalContext(session?.current_organization?.id)
    ]);

    return {
      user: userContext,
      page: pageContext,
      environment: environmentalContext,
      message
    };
  }

  /**
   * Extract context from current user state
   */
  static async extractUserContext(session: any): Promise<UserContext> {
    if (!session?.user) {
      throw new Error('No user session found');
    }

    // Get historical data from cache or database
    const [conversationHistory, frequentActions, pendingTasks] = await Promise.all([
      this.getConversationHistory(session.user.id),
      this.getFrequentActions(session.user.id),
      this.getPendingTasks(session.user.id)
    ]);

    return {
      userId: session.user.id,
      name: session.user.name || session.user.email.split('@')[0],
      email: session.user.email,
      role: session.user.role || UserRole.VIEWER,
      organizationId: session.current_organization?.id || '',
      organizationName: session.current_organization?.name || '',
      organizationSize: session.current_organization?.size || 'medium',
      industry: session.current_organization?.industry || 'general',
      permissions: this.extractPermissions(session),
      accessibleSites: await this.extractAccessibleSites(session),
      accessibleDevices: await this.extractAccessibleDevices(session),
      lastVisitedPage: await this.getLastVisitedPage(session.user.id),
      frequentActions,
      preferredVisualization: await this.getPreferredVisualization(session.user.id),
      technicalLevel: await this.assessTechnicalLevel(session.user.id),
      sessionDuration: this.calculateSessionDuration(session),
      actionsThisSession: await this.getSessionActions(session),
      currentGoal: await this.inferCurrentGoal(session),
      conversationHistory,
      achievedMilestones: await this.getMilestones(session.user.id),
      pendingTasks
    };
  }

  /**
   * Extract context from current page
   */
  static extractPageContext(pathname: string): PageContext {
    const pageType = this.identifyPageType(pathname);

    return {
      currentPath: pathname,
      pageType,
      availableActions: this.getAvailableActions(pageType, pathname),
      dataInView: undefined, // Will be populated by the page component
      userIntent: this.inferUserIntent(pathname, pageType)
    };
  }

  /**
   * Extract environmental context
   */
  static async extractEnvironmentalContext(
    organizationId?: string
  ): Promise<EnvironmentalContext> {
    if (!organizationId) {
      return this.getDefaultEnvironmentalContext();
    }

    const now = new Date();
    const hour = now.getHours();

    // Get real data from database
    const [alerts, approvals, changes, metrics] = await Promise.all([
      this.getActiveAlerts(organizationId),
      this.getPendingApprovals(organizationId),
      this.getRecentChanges(organizationId),
      this.getOrganizationMetrics(organizationId)
    ]);

    return {
      timeOfDay: this.getTimeOfDay(hour),
      dayOfWeek: now.toLocaleDateString('en-US', { weekday: 'long' }),
      isQuarterEnd: this.isQuarterEnd(now),
      reportingDeadline: await this.getNextReportingDeadline(organizationId),
      activeAlerts: alerts,
      pendingApprovals: approvals,
      recentChanges: changes,
      carbonReduction: metrics.carbonReduction,
      complianceScore: metrics.complianceScore,
      dataCompleteness: metrics.dataCompleteness
    };
  }

  /**
   * Build context string for prompts
   */
  static buildContextString(context: CompleteContext): string {
    const { user, page, environment } = context;

    return `
## User Profile
- Name: ${user.name}
- Role: ${user.role}
- Organization: ${user.organizationName} (${user.industry}, ${user.organizationSize})
- Technical Level: ${user.technicalLevel}
- Current Goal: ${user.currentGoal || 'Exploring'}

## Current Situation
- Page: ${page.currentPath} (${page.pageType})
- User Intent: ${page.userIntent}
- Time: ${environment.timeOfDay} on ${environment.dayOfWeek}
- Session Duration: ${user.sessionDuration} minutes
- Recent Actions: ${user.actionsThisSession.slice(-3).join(', ')}

## Organization Status
- Carbon Reduction: ${environment.carbonReduction}% this month
- Compliance Score: ${environment.complianceScore}/100
- Data Completeness: ${environment.dataCompleteness}%
- Active Alerts: ${environment.activeAlerts.length} (${environment.activeAlerts.filter(a => a.severity === 'critical').length} critical)
- Pending Approvals: ${environment.pendingApprovals.length}

## Available Actions
${page.availableActions.map(action => `- ${action}`).join('\n')}

## Behavioral Insights
- Preferred Visualization: ${user.preferredVisualization}
- Frequent Actions: ${user.frequentActions.slice(0, 3).join(', ')}
- Pending Tasks: ${user.pendingTasks.length} tasks
`;
  }

  // Helper methods with actual database queries
  private static extractPermissions(session: any): string[] {
    const rolePermissions: Record<string, string[]> = {
      'owner': ['all'],
      'manager': ['view', 'edit', 'approve', 'report'],
      'member': ['view', 'edit', 'suggest'],
      'viewer': ['view']
    };

    const role = session.user?.role?.toLowerCase() || 'viewer';
    return rolePermissions[role] || ['view'];
  }

  private static async extractAccessibleSites(session: any): Promise<string[]> {
    if (!session.current_organization?.id) return [];

    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('sites')
        .select('id')
        .eq('organization_id', session.current_organization.id);

      return data?.map(s => s.id) || [];
    } catch {
      return [];
    }
  }

  private static async extractAccessibleDevices(session: any): Promise<string[]> {
    if (!session.current_organization?.id) return [];

    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('devices')
        .select('id')
        .eq('organization_id', session.current_organization.id);

      return data?.map(d => d.id) || [];
    } catch {
      return [];
    }
  }

  private static async getLastVisitedPage(userId: string): Promise<string> {
    const cached = await cache.get(`user:${userId}:lastPage`);
    return cached || '/blipee-ai';
  }

  private static async getFrequentActions(userId: string): Promise<string[]> {
    const cached = await cache.get(`user:${userId}:frequentActions`);
    return cached ? JSON.parse(cached) : ['view_dashboard', 'check_alerts', 'generate_report'];
  }

  private static async getPreferredVisualization(
    userId: string
  ): Promise<'chart' | 'table' | 'summary'> {
    const cached = await cache.get(`user:${userId}:vizPreference`);
    return (cached as 'chart' | 'table' | 'summary') || 'chart';
  }

  private static async assessTechnicalLevel(
    userId: string
  ): Promise<'beginner' | 'intermediate' | 'expert'> {
    // TODO: Implement based on user behavior analysis
    return 'intermediate';
  }

  private static calculateSessionDuration(session: any): number {
    if (!session.created_at) return 0;
    const start = new Date(session.created_at);
    const now = new Date();
    return Math.floor((now.getTime() - start.getTime()) / 60000); // minutes
  }

  private static async getSessionActions(session: any): Promise<string[]> {
    const cached = await cache.get(`session:${session.id}:actions`);
    return cached ? JSON.parse(cached) : ['signed_in', 'viewed_dashboard'];
  }

  private static async inferCurrentGoal(session: any): Promise<string | undefined> {
    // Analyze recent actions to infer goal
    const actions = await this.getSessionActions(session);

    if (actions.includes('data_entry')) return 'Adding emissions data';
    if (actions.includes('report_generation')) return 'Creating compliance report';
    if (actions.includes('analysis')) return 'Analyzing performance';

    return undefined;
  }

  private static async getConversationHistory(userId: string): Promise<ConversationSummary[]> {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('conversations')
        .select('id, created_at, metadata')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      return data?.map(c => ({
        id: c.id,
        date: new Date(c.created_at),
        topic: c.metadata?.topic || 'General inquiry',
        outcome: c.metadata?.outcome || 'Completed',
        satisfaction: c.metadata?.satisfaction
      })) || [];
    } catch {
      return [];
    }
  }

  private static async getMilestones(userId: string): Promise<string[]> {
    // TODO: Implement achievement tracking
    return [];
  }

  private static async getPendingTasks(userId: string): Promise<string[]> {
    // TODO: Implement task tracking
    return [];
  }

  private static identifyPageType(pathname: string): PageContext['pageType'] {
    if (pathname.includes('blipee-ai')) return 'ai-chat';
    if (pathname.includes('dashboard')) return 'dashboard';
    if (pathname.includes('settings')) return 'settings';
    if (pathname.includes('data')) return 'data-entry';
    if (pathname.includes('report')) return 'report';
    if (pathname.includes('analysis')) return 'analysis';
    return 'dashboard';
  }

  private static getAvailableActions(
    pageType: PageContext['pageType'],
    pathname: string
  ): string[] {
    const actions: Record<PageContext['pageType'], string[]> = {
      'ai-chat': ['Ask question', 'Generate report', 'Analyze data', 'Get recommendations'],
      dashboard: ['View emissions trends', 'Generate report', 'Check compliance', 'Set targets'],
      settings: ['Manage team', 'Configure integrations', 'Update organization', 'Set preferences'],
      'data-entry': ['Upload documents', 'Manual entry', 'Import data', 'Validate entries'],
      report: ['Download PDF', 'Share report', 'Schedule delivery', 'Customize metrics'],
      analysis: ['Deep dive', 'Compare periods', 'Forecast', 'Identify opportunities']
    };

    return actions[pageType] || [];
  }

  private static inferUserIntent(pathname: string, pageType: PageContext['pageType']): string {
    const intents: Record<PageContext['pageType'], string> = {
      'ai-chat': 'Getting AI assistance',
      dashboard: 'Monitoring performance',
      settings: 'Configuring system',
      'data-entry': 'Adding emissions data',
      report: 'Generating documentation',
      analysis: 'Finding insights'
    };

    return intents[pageType] || 'Exploring platform';
  }

  private static getTimeOfDay(hour: number): EnvironmentalContext['timeOfDay'] {
    if (hour < 6) return 'night';
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    if (hour < 22) return 'evening';
    return 'night';
  }

  private static isQuarterEnd(date: Date): boolean {
    const month = date.getMonth();
    const day = date.getDate();
    // Last 10 days of quarter months
    return [2, 5, 8, 11].includes(month) && day > 20;
  }

  private static async getNextReportingDeadline(organizationId: string): Promise<Date | undefined> {
    // TODO: Fetch from organization settings
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(15);
    return nextMonth;
  }

  private static async getActiveAlerts(organizationId: string): Promise<Alert[]> {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('alerts')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .order('severity', { ascending: true });

      return data?.map(a => ({
        id: a.id,
        severity: a.severity,
        message: a.message,
        actionRequired: a.action_required,
        timestamp: new Date(a.created_at)
      })) || [];
    } catch {
      return [];
    }
  }

  private static async getPendingApprovals(organizationId: string): Promise<Approval[]> {
    // TODO: Implement approval system
    return [];
  }

  private static async getRecentChanges(organizationId: string): Promise<Change[]> {
    // TODO: Implement audit log
    return [];
  }

  private static async getOrganizationMetrics(organizationId: string) {
    // TODO: Fetch real metrics from database
    return {
      carbonReduction: 12.3,
      complianceScore: 87,
      dataCompleteness: 73
    };
  }

  private static getDefaultEnvironmentalContext(): EnvironmentalContext {
    const now = new Date();
    return {
      timeOfDay: this.getTimeOfDay(now.getHours()),
      dayOfWeek: now.toLocaleDateString('en-US', { weekday: 'long' }),
      isQuarterEnd: false,
      reportingDeadline: undefined,
      activeAlerts: [],
      pendingApprovals: [],
      recentChanges: [],
      carbonReduction: 0,
      complianceScore: 0,
      dataCompleteness: 0
    };
  }
}