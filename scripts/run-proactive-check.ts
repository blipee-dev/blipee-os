/**
 * Manual Proactive Agent Check Script
 *
 * Runs the proactive agent scheduler manually (one-time execution)
 * to test agent triggers and proactive message generation.
 *
 * Usage: tsx scripts/run-proactive-check.ts
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: '.env.local' });

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
 * Check all agent triggers for a single organization
 */
async function checkOrganizationTriggers(orgId: string, orgName: string) {
  console.log(`\n🔍 Checking triggers for ${orgName} (${orgId})\n`);
  console.log('═'.repeat(80));

  const triggers: ProactiveTrigger[] = [];

  // Check each agent's triggers
  console.log('\n📋 Evaluating agent triggers...\n');

  console.log('1️⃣  Compliance Guardian...');
  const complianceTriggers = await checkComplianceGuardianTriggers(orgId);
  triggers.push(...complianceTriggers);
  console.log(`   → ${complianceTriggers.length} trigger(s) detected\n`);

  console.log('2️⃣  Cost Saving Finder...');
  const costTriggers = await checkCostSavingFinderTriggers(orgId);
  triggers.push(...costTriggers);
  console.log(`   → ${costTriggers.length} trigger(s) detected\n`);

  console.log('3️⃣  Predictive Maintenance...');
  const maintenanceTriggers = await checkPredictiveMaintenanceTriggers(orgId);
  triggers.push(...maintenanceTriggers);
  console.log(`   → ${maintenanceTriggers.length} trigger(s) detected\n`);

  console.log('4️⃣  Supply Chain Investigator...');
  const supplyChainTriggers = await checkSupplyChainInvestigatorTriggers(orgId);
  triggers.push(...supplyChainTriggers);
  console.log(`   → ${supplyChainTriggers.length} trigger(s) detected\n`);

  console.log('5️⃣  Regulatory Foresight...');
  const regulatoryTriggers = await checkRegulatoryForesightTriggers(orgId);
  triggers.push(...regulatoryTriggers);
  console.log(`   → ${regulatoryTriggers.length} trigger(s) detected\n`);

  console.log('6️⃣  Carbon Hunter...');
  const carbonTriggers = await checkCarbonHunterTriggers(orgId);
  triggers.push(...carbonTriggers);
  console.log(`   → ${carbonTriggers.length} trigger(s) detected\n`);

  console.log('7️⃣  ESG Chief of Staff...');
  const esgTriggers = await checkEsgChiefOfStaffTriggers(orgId);
  triggers.push(...esgTriggers);
  console.log(`   → ${esgTriggers.length} trigger(s) detected\n`);

  console.log('═'.repeat(80));
  console.log(`\n📊 SUMMARY: ${triggers.length} total trigger(s) detected\n`);

  // Display all triggers
  if (triggers.length > 0) {
    console.log('📨 PROACTIVE MESSAGES TO BE SENT:\n');
    triggers.forEach((trigger, idx) => {
      const icon = trigger.priority === 'critical' ? '🚨' : trigger.priority === 'alert' ? '⚠️' : 'ℹ️';
      console.log(`${icon} [${idx + 1}] ${trigger.agentName} (${trigger.priority.toUpperCase()})`);
      console.log(`   ${trigger.message}`);
      console.log('');
    });

    // Ask user if they want to send these messages
    console.log('═'.repeat(80));
    console.log('\n🤔 Would you like to send these proactive messages to users?');
    console.log('   [Press Enter to send, Ctrl+C to cancel]\n');

    // Wait for user input
    await new Promise((resolve) => {
      process.stdin.once('data', resolve);
    });

    // Send proactive messages
    console.log('\n📤 Sending proactive messages...\n');
    let sentCount = 0;
    for (const trigger of triggers) {
      const success = await sendProactiveMessage(orgId, trigger);
      if (success) {
        sentCount++;
        console.log(`   ✅ Sent: ${trigger.agentName} (${trigger.priority})`);
      } else {
        console.log(`   ❌ Failed: ${trigger.agentName}`);
      }
    }

    console.log(`\n✅ Successfully sent ${sentCount}/${triggers.length} proactive message(s)`);
  } else {
    console.log('✅ No triggers detected - all systems nominal!\n');
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

  if (recentData && recentData.length > 0) {
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
      const potentialSavings = (currentAvg - previousAvg) * 365;

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

  return triggers;
}

/**
 * PREDICTIVE MAINTENANCE TRIGGERS
 */
async function checkPredictiveMaintenanceTriggers(orgId: string): Promise<ProactiveTrigger[]> {
  const triggers: ProactiveTrigger[] = [];

  // Trigger: Equipment anomaly detected (efficiency drop)
  const { data: equipmentData } = await supabase
    .from('equipment_readings')
    .select('*')
    .eq('organization_id', orgId)
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false });

  if (equipmentData && equipmentData.length > 0) {
    const equipmentGroups = equipmentData.reduce((acc, reading) => {
      if (!acc[reading.equipment_id]) acc[reading.equipment_id] = [];
      acc[reading.equipment_id].push(reading);
      return acc;
    }, {} as Record<string, any[]>);

    for (const [equipmentId, readings] of Object.entries(equipmentGroups)) {
      const avgEfficiency = readings.reduce((sum, r) => sum + (r.efficiency || 100), 0) / readings.length;

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

  return triggers;
}

/**
 * SUPPLY CHAIN INVESTIGATOR TRIGGERS
 */
async function checkSupplyChainInvestigatorTriggers(orgId: string): Promise<ProactiveTrigger[]> {
  const triggers: ProactiveTrigger[] = [];

  // Trigger: Supplier emission spike (>30% increase)
  const { data: supplierEmissions } = await supabase
    .from('supplier_emissions')
    .select('*')
    .eq('organization_id', orgId)
    .gte('reporting_period', new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString())
    .order('reporting_period', { ascending: false });

  if (supplierEmissions && supplierEmissions.length > 0) {
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

  return triggers;
}

/**
 * REGULATORY FORESIGHT TRIGGERS
 */
async function checkRegulatoryForesightTriggers(orgId: string): Promise<ProactiveTrigger[]> {
  const triggers: ProactiveTrigger[] = [];

  // Trigger: Regulatory change imminent (< 60 days)
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

  // Trigger: Emissions spike (>15% vs forecast)
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
    const predictedValue = Array.isArray(forecast.prediction) ? forecast.prediction[0] : forecast.prediction;

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

  // Trigger 1: Weekly summary (every Monday)
  if (dayOfWeek === 1) {
    triggers.push({
      agentId: 'esg_chief_of_staff',
      agentName: 'ESG Chief of Staff',
      priority: 'info',
      message: 'Weekly ESG performance summary: Review key metrics, progress towards targets, and strategic recommendations.',
      metadata: { report_type: 'weekly' }
    });
  }

  // Trigger 2: Monthly summary (1st of month)
  if (dayOfMonth === 1) {
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
async function sendProactiveMessage(orgId: string, trigger: ProactiveTrigger): Promise<boolean> {
  try {
    // Get the primary user for this organization
    const { data: orgMembers } = await supabase
      .from('organization_members')
      .select('user_id, role')
      .eq('organization_id', orgId)
      .in('role', ['account_owner', 'admin', 'sustainability_lead'])
      .limit(1);

    if (!orgMembers || orgMembers.length === 0) {
      console.log(`   ⚠️ No user found for org ${orgId}`);
      return false;
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

    return true;

  } catch (error) {
    console.error(`   ❌ Error sending proactive message:`, error);
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  🤖 Proactive Agent Scheduler - Manual Test Run         ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  try {
    // Get all active organizations (not deleted)
    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('id, name')
      .is('deleted_at', null);

    if (orgsError) throw orgsError;

    if (!orgs || orgs.length === 0) {
      console.log('⚠️  No active organizations found.');
      process.exit(0);
    }

    console.log(`📊 Found ${orgs.length} active organization(s):\n`);
    orgs.forEach((org, idx) => {
      console.log(`   ${idx + 1}. ${org.name} (${org.id})`);
    });

    // For now, check first organization (PLMJ)
    const targetOrg = orgs[0];
    await checkOrganizationTriggers(targetOrg.id, targetOrg.name);

    console.log('\n✅ Proactive check completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Proactive check failed:', error);
    process.exit(1);
  }
}

main();
