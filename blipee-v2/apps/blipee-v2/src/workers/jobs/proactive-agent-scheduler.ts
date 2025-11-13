/**
 * Proactive Agent Scheduler
 *
 * Runs hourly to check triggers for all autonomous agents
 * and initiates proactive conversations when conditions are met.
 *
 * This is the "brain" that makes agents truly autonomous!
 */

import { createClient } from '@supabase/supabase-js';
import * as cron from 'node-cron';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ProactiveTrigger {
  agentId: string;
  agentName: string;
  priority: 'info' | 'alert' | 'critical';
  message: string;
  metadata: Record<string, any>;
}

/**
 * Main scheduler task - runs every hour
 */
let proactiveSchedulerTask: cron.ScheduledTask | null = null;

async function runProactiveCheck() {
  console.log('🤖 [Proactive Scheduler] Starting hourly check...');

  try {
    // Get all active organizations (not deleted)
    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('id, name')
      .is('deleted_at', null);

    if (orgsError) throw orgsError;

    console.log(`📊 Checking ${orgs?.length || 0} organizations`);

    for (const org of orgs || []) {
      await checkOrganizationTriggers(org.id, org.name);
    }

    console.log('✅ [Proactive Scheduler] Hourly check complete');
  } catch (error) {
    console.error('❌ [Proactive Scheduler] Error:', error);
  }
}

/**
 * Check all agent triggers for a single organization
 */
async function checkOrganizationTriggers(orgId: string, orgName: string) {
  console.log(`🔍 Checking triggers for ${orgName} (${orgId})`);

  const triggers: ProactiveTrigger[] = [];

  // Check each agent's triggers
  triggers.push(...await checkComplianceGuardianTriggers(orgId));
  triggers.push(...await checkCostSavingFinderTriggers(orgId));
  triggers.push(...await checkPredictiveMaintenanceTriggers(orgId));
  triggers.push(...await checkSupplyChainInvestigatorTriggers(orgId));
  triggers.push(...await checkRegulatoryForesightTriggers(orgId));
  triggers.push(...await checkCarbonHunterTriggers(orgId));
  triggers.push(...await checkEsgChiefOfStaffTriggers(orgId));

  // Send proactive messages for triggered agents
  for (const trigger of triggers) {
    await sendProactiveMessage(orgId, trigger);
  }

  if (triggers.length > 0) {
    console.log(`✅ Sent ${triggers.length} proactive messages for ${orgName}`);
  }
}

/**
 * COMPLIANCE GUARDIAN TRIGGERS
 */
async function checkComplianceGuardianTriggers(orgId: string): Promise<ProactiveTrigger[]> {
  const triggers: ProactiveTrigger[] = [];

  // Trigger 1: Compliance deadline approaching (< 30 days)
  const { data: deadlines } = await supabase
    .from('compliance_deadlines')
    .select('*')
    .eq('organization_id', orgId)
    .eq('status', 'pending')
    .gte('deadline_date', new Date().toISOString())
    .lte('deadline_date', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString());

  if (deadlines && deadlines.length > 0) {
    triggers.push({
      agentId: 'compliance_guardian',
      agentName: 'Compliance Guardian',
      priority: 'alert',
      message: `You have ${deadlines.length} compliance deadline(s) approaching within 30 days. Review requirements and prepare submissions.`,
      metadata: { deadlines: deadlines.slice(0, 5) }
    });
  }

  // Trigger 2: High anomaly score detected (compliance risk)
  const { data: recentData } = await supabase
    .from('metrics_data')
    .select('*')
    .eq('organization_id', orgId)
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })
    .limit(100);

  if (recentData) {
    // Simple anomaly detection: check for values 2x higher than average
    const avgValue = recentData.reduce((sum, d) => sum + (d.value || 0), 0) / recentData.length;
    const anomalies = recentData.filter(d => d.value > avgValue * 2);

    if (anomalies.length > 5) {
      triggers.push({
        agentId: 'compliance_guardian',
        agentName: 'Compliance Guardian',
        priority: 'critical',
        message: `Detected ${anomalies.length} unusual data points that may indicate compliance risks. Immediate investigation recommended.`,
        metadata: { anomaly_count: anomalies.length, avg_value: avgValue }
      });
    }
  }

  return triggers;
}

/**
 * COST SAVING FINDER TRIGGERS
 */
async function checkCostSavingFinderTriggers(orgId: string): Promise<ProactiveTrigger[]> {
  const triggers: ProactiveTrigger[] = [];

  // Trigger 1: Cost spike detected (>20% increase)
  const { data: recentCosts } = await supabase
    .from('metrics_data')
    .select('value, created_at')
    .eq('organization_id', orgId)
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })
    .limit(60);

  if (recentCosts && recentCosts.length >= 30) {
    const last30Days = recentCosts.slice(0, 30);
    const previous30Days = recentCosts.slice(30, 60);

    const currentAvg = last30Days.reduce((sum, d) => sum + (d.value || 0), 0) / 30;
    const previousAvg = previous30Days.reduce((sum, d) => sum + (d.value || 0), 0) / 30;

    const percentChange = ((currentAvg - previousAvg) / previousAvg) * 100;

    if (percentChange > 20) {
      const potentialSavings = (currentAvg - previousAvg) * 365; // Annualized

      triggers.push({
        agentId: 'cost_saving_finder',
        agentName: 'Cost Saving Finder',
        priority: 'alert',
        message: `Detected ${percentChange.toFixed(1)}% cost increase over the past 30 days. Potential savings of €${potentialSavings.toFixed(0)} if optimized. Investigation recommended.`,
        metadata: {
          percent_change: percentChange,
          current_avg: currentAvg,
          previous_avg: previousAvg,
          potential_savings: potentialSavings
        }
      });
    }
  }

  // Trigger 2: Contract renewal approaching
  const { data: contracts } = await supabase
    .from('vendor_contracts')
    .select('*')
    .eq('organization_id', orgId)
    .gte('renewal_date', new Date().toISOString())
    .lte('renewal_date', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString());

  if (contracts && contracts.length > 0) {
    triggers.push({
      agentId: 'cost_saving_finder',
      agentName: 'Cost Saving Finder',
      priority: 'info',
      message: `${contracts.length} vendor contract(s) up for renewal soon. Time to negotiate better rates and terms.`,
      metadata: { contracts: contracts.slice(0, 3) }
    });
  }

  return triggers;
}

/**
 * PREDICTIVE MAINTENANCE TRIGGERS
 */
async function checkPredictiveMaintenanceTriggers(orgId: string): Promise<ProactiveTrigger[]> {
  const triggers: ProactiveTrigger[] = [];

  // Trigger 1: Equipment anomaly detected (efficiency drop)
  const { data: equipmentData } = await supabase
    .from('equipment_readings')
    .select('*')
    .eq('organization_id', orgId)
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false });

  if (equipmentData && equipmentData.length > 0) {
    // Group by equipment
    const equipmentGroups = equipmentData.reduce((acc, reading) => {
      if (!acc[reading.equipment_id]) acc[reading.equipment_id] = [];
      acc[reading.equipment_id].push(reading);
      return acc;
    }, {} as Record<string, any[]>);

    for (const [equipmentId, readings] of Object.entries(equipmentGroups)) {
      const avgEfficiency = readings.reduce((sum, r) => sum + (r.efficiency || 100), 0) / readings.length;

      // Flag if efficiency < 80%
      if (avgEfficiency < 80) {
        triggers.push({
          agentId: 'predictive_maintenance',
          agentName: 'Predictive Maintenance',
          priority: 'alert',
          message: `Equipment ${equipmentId} showing ${avgEfficiency.toFixed(1)}% efficiency (below 80% threshold). Maintenance recommended to prevent failure.`,
          metadata: {
            equipment_id: equipmentId,
            efficiency: avgEfficiency,
            reading_count: readings.length
          }
        });
      }
    }
  }

  // Trigger 2: Scheduled maintenance approaching
  const { data: maintenanceSchedule } = await supabase
    .from('maintenance_schedule')
    .select('*')
    .eq('organization_id', orgId)
    .eq('status', 'scheduled')
    .gte('scheduled_date', new Date().toISOString())
    .lte('scheduled_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString());

  if (maintenanceSchedule && maintenanceSchedule.length > 0) {
    triggers.push({
      agentId: 'predictive_maintenance',
      agentName: 'Predictive Maintenance',
      priority: 'info',
      message: `${maintenanceSchedule.length} maintenance task(s) scheduled within 7 days. Review equipment status and prepare.`,
      metadata: { tasks: maintenanceSchedule.slice(0, 5) }
    });
  }

  return triggers;
}

/**
 * SUPPLY CHAIN INVESTIGATOR TRIGGERS
 */
async function checkSupplyChainInvestigatorTriggers(orgId: string): Promise<ProactiveTrigger[]> {
  const triggers: ProactiveTrigger[] = [];

  // Trigger 1: Supplier emission spike (>30% increase)
  const { data: supplierEmissions } = await supabase
    .from('supplier_emissions')
    .select('*')
    .eq('organization_id', orgId)
    .gte('reporting_period', new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString())
    .order('reporting_period', { ascending: false });

  if (supplierEmissions && supplierEmissions.length > 0) {
    // Group by supplier and compare periods
    const supplierGroups = supplierEmissions.reduce((acc, emission) => {
      if (!acc[emission.supplier_id]) acc[emission.supplier_id] = [];
      acc[emission.supplier_id].push(emission);
      return acc;
    }, {} as Record<string, any[]>);

    for (const [supplierId, emissions] of Object.entries(supplierGroups)) {
      if (emissions.length >= 2) {
        const latest = emissions[0];
        const previous = emissions[1];
        const percentChange = ((latest.total_emissions - previous.total_emissions) / previous.total_emissions) * 100;

        if (percentChange > 30) {
          triggers.push({
            agentId: 'supply_chain_investigator',
            agentName: 'Supply Chain Investigator',
            priority: 'alert',
            message: `Supplier ${supplierId} showing ${percentChange.toFixed(1)}% increase in emissions. Investigation and engagement recommended.`,
            metadata: {
              supplier_id: supplierId,
              percent_change: percentChange,
              latest_emissions: latest.total_emissions
            }
          });
        }
      }
    }
  }

  // Trigger 2: New supplier added
  const { data: newSuppliers } = await supabase
    .from('suppliers')
    .select('*')
    .eq('organization_id', orgId)
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  if (newSuppliers && newSuppliers.length > 0) {
    triggers.push({
      agentId: 'supply_chain_investigator',
      agentName: 'Supply Chain Investigator',
      priority: 'info',
      message: `${newSuppliers.length} new supplier(s) added. Sustainability assessment and emissions verification recommended.`,
      metadata: { new_suppliers: newSuppliers.slice(0, 3) }
    });
  }

  return triggers;
}

/**
 * REGULATORY FORESIGHT TRIGGERS
 */
async function checkRegulatoryForesightTriggers(orgId: string): Promise<ProactiveTrigger[]> {
  const triggers: ProactiveTrigger[] = [];

  // Trigger 1: New regulation published (simulated - would integrate with RSS/API)
  // In production, this would check regulatory RSS feeds or APIs
  const mockNewRegulations = []; // Placeholder

  // Trigger 2: Regulatory change imminent (< 60 days)
  const { data: upcomingChanges } = await supabase
    .from('regulatory_changes')
    .select('*')
    .eq('organization_id', orgId)
    .eq('status', 'announced')
    .gte('effective_date', new Date().toISOString())
    .lte('effective_date', new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString());

  if (upcomingChanges && upcomingChanges.length > 0) {
    triggers.push({
      agentId: 'regulatory_foresight',
      agentName: 'Regulatory Foresight',
      priority: 'alert',
      message: `${upcomingChanges.length} regulatory change(s) becoming effective within 60 days. Preparation and compliance review recommended.`,
      metadata: { changes: upcomingChanges.slice(0, 5) }
    });
  }

  return triggers;
}

/**
 * CARBON HUNTER TRIGGERS
 */
async function checkCarbonHunterTriggers(orgId: string): Promise<ProactiveTrigger[]> {
  const triggers: ProactiveTrigger[] = [];

  // Trigger 1: Emissions spike (>15% vs forecast)
  const { data: forecasts } = await supabase
    .from('ml_predictions')
    .select('*')
    .eq('organization_id', orgId)
    .eq('prediction_type', 'forecast')
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })
    .limit(1);

  if (forecasts && forecasts.length > 0) {
    const forecast = forecasts[0];
    const predictedValue = forecast.prediction[0]; // First value in forecast

    // Get actual value
    const { data: actuals } = await supabase
      .from('metrics_data')
      .select('value')
      .eq('organization_id', orgId)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(7);

    if (actuals && actuals.length > 0) {
      const avgActual = actuals.reduce((sum, d) => sum + (d.value || 0), 0) / actuals.length;
      const percentDiff = ((avgActual - predictedValue) / predictedValue) * 100;

      if (percentDiff > 15) {
        triggers.push({
          agentId: 'carbon_hunter',
          agentName: 'Carbon Hunter',
          priority: 'alert',
          message: `Emissions ${percentDiff.toFixed(1)}% higher than forecast. Urgent investigation needed to identify sources and take corrective action.`,
          metadata: {
            actual: avgActual,
            forecast: predictedValue,
            percent_diff: percentDiff
          }
        });
      }
    }
  }

  // Trigger 2: Target at risk (Prophet predicts miss)
  // This would use Prophet forecasts to predict if yearly target will be missed

  return triggers;
}

/**
 * ESG CHIEF OF STAFF TRIGGERS
 */
async function checkEsgChiefOfStaffTriggers(orgId: string): Promise<ProactiveTrigger[]> {
  const triggers: ProactiveTrigger[] = [];

  const now = new Date();
  const dayOfWeek = now.getDay();
  const dayOfMonth = now.getDate();

  // Trigger 1: Weekly summary (every Monday at 9am)
  if (dayOfWeek === 1 && now.getHours() === 9) {
    triggers.push({
      agentId: 'esg_chief_of_staff',
      agentName: 'ESG Chief of Staff',
      priority: 'info',
      message: 'Weekly ESG performance summary: Review key metrics, progress towards targets, and strategic recommendations.',
      metadata: { report_type: 'weekly' }
    });
  }

  // Trigger 2: Monthly summary (1st of month at 9am)
  if (dayOfMonth === 1 && now.getHours() === 9) {
    triggers.push({
      agentId: 'esg_chief_of_staff',
      agentName: 'ESG Chief of Staff',
      priority: 'alert',
      message: 'Monthly ESG strategic review: Comprehensive analysis of performance, risks, opportunities, and executive recommendations.',
      metadata: { report_type: 'monthly' }
    });
  }

  return triggers;
}

/**
 * Send proactive message to user via conversations table
 */
async function sendProactiveMessage(orgId: string, trigger: ProactiveTrigger) {
  try {
    // Get the primary user for this organization
    const { data: orgMembers } = await supabase
      .from('organization_members')
      .select('user_id, role')
      .eq('organization_id', orgId)
      .in('role', ['account_owner', 'admin', 'sustainability_lead'])
      .limit(1);

    if (!orgMembers || orgMembers.length === 0) {
      console.log(`⚠️ No user found for org ${orgId}`);
      return;
    }

    const userId = orgMembers[0].user_id;

    // Create or get existing agent conversation
    const { data: existingConv } = await supabase
      .from('conversations')
      .select('id')
      .eq('organization_id', orgId)
      .eq('type', 'agent_proactive')
      .eq('metadata->>agent_id', trigger.agentId)
      .single();

    let conversationId: string;

    if (existingConv) {
      conversationId = existingConv.id;
    } else {
      // Create new agent conversation
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({
          organization_id: orgId,
          user_id: userId,
          type: 'agent_proactive',
          title: `${trigger.agentName} 🤖`,
          metadata: {
            agent_id: trigger.agentId,
            agent_name: trigger.agentName
          }
        })
        .select()
        .single();

      if (convError) throw convError;
      conversationId = newConv.id;
    }

    // Insert proactive message
    const { error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'agent',
        agent_id: trigger.agentId,
        content: `🤖 ${trigger.agentName}\n\n${trigger.message}`,
        priority: trigger.priority,
        read: false,
        metadata: trigger.metadata
      });

    if (msgError) throw msgError;

    console.log(`📨 Sent proactive message from ${trigger.agentName} to org ${orgId}`);

    // Log agent activity
    await supabase
      .from('agent_activity_logs')
      .insert({
        agent_name: trigger.agentId,
        activity_type: 'proactive_message',
        activity_data: {
          priority: trigger.priority,
          message_preview: trigger.message.substring(0, 100),
          metadata: trigger.metadata
        },
        organization_id: orgId
      });

  } catch (error) {
    console.error(`❌ Error sending proactive message:`, error);
  }
}

/**
 * Start the scheduler
 */
export function startProactiveScheduler() {
  if (proactiveSchedulerTask) {
    console.log('⚠️ Proactive Agent Scheduler already running');
    return;
  }

  console.log('🚀 Starting Proactive Agent Scheduler...');

  // Schedule to run every hour at minute 0 (node-cron starts automatically)
  proactiveSchedulerTask = cron.schedule('0 * * * *', runProactiveCheck, {
    timezone: 'UTC'
  });

  console.log('✅ Proactive Agent Scheduler started (runs hourly at :00)');
}

/**
 * Stop the scheduler
 */
export function stopProactiveScheduler() {
  if (!proactiveSchedulerTask) {
    console.log('⚠️ Proactive Agent Scheduler not running');
    return;
  }

  console.log('🛑 Stopping Proactive Agent Scheduler...');
  proactiveSchedulerTask.stop();
  proactiveSchedulerTask = null;
  console.log('✅ Proactive Agent Scheduler stopped');
}
