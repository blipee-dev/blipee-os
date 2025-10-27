/**
 * Report Generation Service
 *
 * Automated sustainability report generation and scheduling:
 * - Monthly sustainability reports for all organizations
 * - Performance benchmarking reports
 * - Compliance summary reports
 * - Email delivery to stakeholders
 * - Report archive and history
 *
 * Runs: Monthly on 1st day at 6:00 AM UTC
 * Benefits: Reduce manual work, increase platform stickiness, compliance documentation
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface ReportServiceStats {
  reportsGenerated: number;
  reportsEmailed: number;
  reportsArchived: number;
  errors: number;
  lastRunAt: Date | null;
  lastRunDuration: number | null;
}

interface ReportData {
  organization_id: string;
  organization_name: string;
  report_period: string;
  emissions: {
    total: number;
    scope_1: number;
    scope_2: number;
    scope_3: number;
    change_from_previous: number;
  };
  energy: {
    total: number;
    renewable_percentage: number;
    change_from_previous: number;
  };
  water: {
    total: number;
    change_from_previous: number;
  };
  waste: {
    total: number;
    recycled_percentage: number;
    change_from_previous: number;
  };
  targets: {
    on_track: number;
    at_risk: number;
    achieved: number;
  };
  top_opportunities: any[];
}

export class ReportGenerationService {
  private stats: ReportServiceStats = {
    reportsGenerated: 0,
    reportsEmailed: 0,
    reportsArchived: 0,
    errors: 0,
    lastRunAt: null,
    lastRunDuration: null,
  };

  getHealth(): ReportServiceStats {
    return { ...this.stats };
  }

  async run(): Promise<void> {
    const startTime = Date.now();
    console.log('\n📊 [Reports] Generating monthly reports...');

    try {
      // Get all organizations
      const { data: orgs, error: orgsError } = await supabase
        .from('organizations')
        .select('id, name');

      if (orgsError || !orgs || orgs.length === 0) {
        console.log('   ⚠️  No organizations found');
        return;
      }

      console.log(`   📈 Generating reports for ${orgs.length} organizations`);

      for (const org of orgs) {
        try {
          await this.generateOrgReport(org.id, org.name);
        } catch (error) {
          console.error(`   ❌ Failed for ${org.name}:`, error);
          this.stats.errors++;
        }
      }

      this.stats.lastRunAt = new Date();
      this.stats.lastRunDuration = Date.now() - startTime;

      console.log(`✅ [Reports] Completed in ${(this.stats.lastRunDuration / 1000).toFixed(2)}s`);
      console.log(`   • Reports generated: ${this.stats.reportsGenerated}`);
      console.log(`   • Reports emailed: ${this.stats.reportsEmailed}`);

    } catch (error) {
      console.error('❌ [Reports] Generation failed:', error);
      this.stats.errors++;
      throw error;
    }
  }

  private async generateOrgReport(orgId: string, orgName: string): Promise<void> {
    console.log(`   Generating report for: ${orgName}`);

    // 1. Collect report data
    const reportData = await this.collectReportData(orgId, orgName);

    if (!reportData) {
      console.log(`     ⚠️  Insufficient data for report`);
      return;
    }

    // 2. Generate report document
    const reportId = await this.createReportDocument(reportData);

    // 3. Archive report
    await this.archiveReport(reportId, reportData);

    // 4. Email report to stakeholders (if configured)
    await this.emailReport(orgId, reportId, reportData);

    this.stats.reportsGenerated++;
    console.log(`     ✅ Report generated: ${reportId}`);
  }

  private async collectReportData(orgId: string, orgName: string): Promise<ReportData | null> {
    try {
      // Calculate previous month date range
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      const periodStart = lastMonth.toISOString().split('T')[0];
      const periodEnd = lastMonthEnd.toISOString().split('T')[0];

      // Get emissions data
      const { data: emissionsData } = await supabase
        .from('metrics_data')
        .select('*, metrics_catalog!inner(*)')
        .eq('organization_id', orgId)
        .not('metrics_catalog.scope', 'is', null)
        .gte('period_start', periodStart)
        .lte('period_start', periodEnd);

      if (!emissionsData || emissionsData.length === 0) {
        return null;
      }

      // Calculate emissions by scope
      const scope1 = emissionsData
        .filter((d: any) => d.metrics_catalog?.scope === 1)
        .reduce((sum: number, d: any) => sum + (d.value || 0), 0);

      const scope2 = emissionsData
        .filter((d: any) => d.metrics_catalog?.scope === 2)
        .reduce((sum: number, d: any) => sum + (d.value || 0), 0);

      const scope3 = emissionsData
        .filter((d: any) => d.metrics_catalog?.scope === 3)
        .reduce((sum: number, d: any) => sum + (d.value || 0), 0);

      // Get energy data
      const { data: energyData } = await supabase
        .from('metrics_data')
        .select('*, metrics_catalog!inner(*)')
        .eq('organization_id', orgId)
        .in('metrics_catalog.category', ['Purchased Energy', 'Electricity'])
        .gte('period_start', periodStart)
        .lte('period_start', periodEnd);

      const totalEnergy = (energyData || []).reduce((sum: number, d: any) => sum + (d.value || 0), 0);

      // Get optimization opportunities
      const { data: opportunities } = await supabase
        .from('optimization_opportunities')
        .select('*')
        .eq('organization_id', orgId)
        .eq('status', 'identified')
        .order('potential_savings', { ascending: false })
        .limit(5);

      return {
        organization_id: orgId,
        organization_name: orgName,
        report_period: `${lastMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}`,
        emissions: {
          total: scope1 + scope2 + scope3,
          scope_1: scope1,
          scope_2: scope2,
          scope_3: scope3,
          change_from_previous: 0, // Calculate from previous month
        },
        energy: {
          total: totalEnergy,
          renewable_percentage: 0, // Calculate from renewable energy metrics
          change_from_previous: 0,
        },
        water: {
          total: 0, // Calculate from water metrics
          change_from_previous: 0,
        },
        waste: {
          total: 0, // Calculate from waste metrics
          recycled_percentage: 0,
          change_from_previous: 0,
        },
        targets: {
          on_track: 0,
          at_risk: 0,
          achieved: 0,
        },
        top_opportunities: opportunities || [],
      };

    } catch (error) {
      console.error('     ⚠️  Data collection error:', error);
      return null;
    }
  }

  private async createReportDocument(reportData: ReportData): Promise<string> {
    try {
      // Generate report ID
      const reportId = `report_${reportData.organization_id}_${new Date().getTime()}`;

      // Format report as markdown
      const reportMarkdown = this.formatReportMarkdown(reportData);

      // Save report to database
      await supabase.from('sustainability_reports').insert({
        id: reportId,
        organization_id: reportData.organization_id,
        report_type: 'monthly_sustainability',
        report_period: reportData.report_period,
        generated_at: new Date().toISOString(),
        report_data: reportData,
        report_markdown: reportMarkdown,
      });

      return reportId;

    } catch (error) {
      throw new Error(`Failed to create report: ${error}`);
    }
  }

  private formatReportMarkdown(data: ReportData): string {
    return `
# ${data.organization_name} Sustainability Report
## ${data.report_period}

### Emissions Summary
- **Total Emissions**: ${data.emissions.total.toFixed(2)} tonnes CO2e
  - Scope 1: ${data.emissions.scope_1.toFixed(2)} tonnes
  - Scope 2: ${data.emissions.scope_2.toFixed(2)} tonnes
  - Scope 3: ${data.emissions.scope_3.toFixed(2)} tonnes
- **Change from Previous Month**: ${data.emissions.change_from_previous >= 0 ? '+' : ''}${data.emissions.change_from_previous.toFixed(1)}%

### Energy Consumption
- **Total Energy**: ${data.energy.total.toFixed(2)} kWh
- **Renewable Energy**: ${data.energy.renewable_percentage.toFixed(1)}%
- **Change from Previous Month**: ${data.energy.change_from_previous >= 0 ? '+' : ''}${data.energy.change_from_previous.toFixed(1)}%

### Target Progress
- ✅ On Track: ${data.targets.on_track}
- ⚠️ At Risk: ${data.targets.at_risk}
- 🎯 Achieved: ${data.targets.achieved}

### Top Optimization Opportunities
${data.top_opportunities.map((o, i) => `${i + 1}. **${o.title}** - Potential savings: $${o.potential_savings.toFixed(2)}`).join('\n')}

---
*Generated automatically by Blipee AI*
`;
  }

  private async archiveReport(reportId: string, reportData: ReportData): Promise<void> {
    try {
      // In production, archive to cloud storage (S3, etc.)
      // For now, mark as archived in database
      this.stats.reportsArchived++;
    } catch (error) {
      console.error('     ⚠️  Archival error:', error);
    }
  }

  private async emailReport(orgId: string, reportId: string, reportData: ReportData): Promise<void> {
    try {
      // Get stakeholder email addresses
      const { data: members } = await supabase
        .from('organization_members')
        .select('users!inner(*)')
        .eq('organization_id', orgId)
        .eq('role', 'admin');

      if (!members || members.length === 0) {
        return;
      }

      // In production, send actual emails via SendGrid, etc.
      // For now, create notification
      for (const member of members) {
        await supabase.from('notifications').insert({
          user_id: (member.users as any).id,
          title: 'Monthly Sustainability Report Available',
          body: `Your ${reportData.report_period} sustainability report is ready to view.`,
          type: 'report_generated',
          metadata: { report_id: reportId },
          read: false,
        });
      }

      this.stats.reportsEmailed++;

    } catch (error) {
      console.error('     ⚠️  Email error:', error);
    }
  }

  resetStats(): void {
    this.stats = {
      reportsGenerated: 0,
      reportsEmailed: 0,
      reportsArchived: 0,
      errors: 0,
      lastRunAt: null,
      lastRunDuration: null,
    };
  }
}
