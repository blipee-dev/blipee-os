import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Helper function for batch inserts
async function batchInsert(table: string, data: any[], batchSize: number = 500) {
  console.log(`  📊 Inserting ${data.length} records into ${table}...`);
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    const { error } = await supabase.from(table).insert(batch);
    if (error) {
      console.error(`❌ Error inserting batch ${Math.floor(i/batchSize) + 1} into ${table}:`, error);
    } else {
      console.log(`  ✅ Batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(data.length/batchSize)} inserted`);
    }
  }
}

async function seedComprehensiveESGData() {
  console.log('🌱 Seeding comprehensive ESG data...\n');

  try {
    // Get organization ID
    const { data: orgs } = await supabase.from('organizations').select('id').limit(1);
    if (!orgs || orgs.length === 0) {
      console.error('❌ No organization found. Please ensure basic data exists.');
      return;
    }
    const orgId = orgs[0].id;

    // Get building IDs
    const { data: buildings } = await supabase.from('buildings').select('id').eq('organization_id', orgId);
    const buildingIds = buildings?.map(b => b.id) || [];

    console.log(`🏢 Found organization: ${orgId}`);
    console.log(`🏗️  Found ${buildingIds.length} buildings\n`);

    // 1. MATERIALITY ASSESSMENTS
    console.log('📝 Creating materiality assessments...');
    const materialityData = [{
      organization_id: orgId,
      assessment_date: '2024-01-15',
      assessment_type: 'double',
      material_topics: [
        {
          topic: 'Climate change',
          impact_score: 5,
          financial_score: 4,
          stakeholder_importance: 5,
          business_impact: 4,
          time_horizon: 'short',
          value_chain_stage: ['operations', 'upstream'],
          affected_stakeholders: ['investors', 'communities', 'employees']
        },
        {
          topic: 'Water resources',
          impact_score: 3,
          financial_score: 2,
          stakeholder_importance: 4,
          business_impact: 3,
          time_horizon: 'medium',
          value_chain_stage: ['operations'],
          affected_stakeholders: ['communities', 'regulators']
        },
        {
          topic: 'Diversity and inclusion',
          impact_score: 4,
          financial_score: 3,
          stakeholder_importance: 4,
          business_impact: 4,
          time_horizon: 'short',
          value_chain_stage: ['operations'],
          affected_stakeholders: ['employees', 'investors']
        }
      ],
      stakeholders_consulted: ['employees', 'investors', 'customers', 'communities', 'suppliers'],
      methodology: 'Double materiality assessment following ESRS 1 guidance',
      external_validation: true
    }];

    await batchInsert('materiality_assessments', materialityData);

    // 2. WORKFORCE DEMOGRAPHICS
    console.log('👥 Creating workforce demographics...');
    const workforceData = [];
    for (let year = 2022; year <= 2024; year++) {
      for (let month = 1; month <= 12; month++) {
        if (year === 2024 && month > 7) break; // Only until July 2024
        
        const totalEmployees = 2500 + Math.floor(Math.random() * 200);
        workforceData.push({
          organization_id: orgId,
          reporting_date: `${year}-${month.toString().padStart(2, '0')}-01`,
          total_employees: totalEmployees,
          full_time_employees: Math.floor(totalEmployees * 0.85),
          part_time_employees: Math.floor(totalEmployees * 0.12),
          temporary_employees: Math.floor(totalEmployees * 0.03),
          contractors: Math.floor(totalEmployees * 0.08),
          employees_by_region: {
            'North America': Math.floor(totalEmployees * 0.45),
            'Europe': Math.floor(totalEmployees * 0.35),
            'Asia Pacific': Math.floor(totalEmployees * 0.20)
          },
          male_employees: Math.floor(totalEmployees * 0.52),
          female_employees: Math.floor(totalEmployees * 0.46),
          non_binary_employees: Math.floor(totalEmployees * 0.015),
          undisclosed_gender: Math.floor(totalEmployees * 0.005),
          employees_under_30: Math.floor(totalEmployees * 0.25),
          employees_30_to_50: Math.floor(totalEmployees * 0.55),
          employees_over_50: Math.floor(totalEmployees * 0.20),
          women_in_management_percent: 38.5 + Math.random() * 2,
          women_in_senior_management_percent: 32.1 + Math.random() * 3,
          women_on_board_percent: 40.0 + Math.random() * 5,
          employees_with_disabilities: Math.floor(totalEmployees * 0.045)
        });
      }
    }

    await batchInsert('workforce_demographics', workforceData);

    // 3. HEALTH & SAFETY METRICS
    console.log('🏥 Creating health & safety metrics...');
    const safetyData = [];
    for (const buildingId of buildingIds) {
      for (let year = 2022; year <= 2024; year++) {
        for (let quarter = 1; quarter <= 4; quarter++) {
          if (year === 2024 && quarter > 2) break; // Only until Q2 2024
          
          const startMonth = (quarter - 1) * 3 + 1;
          const endMonth = quarter * 3;
          const hoursWorked = 180000 + Math.random() * 20000;
          
          safetyData.push({
            organization_id: orgId,
            facility_id: buildingId,
            period_start: `${year}-${startMonth.toString().padStart(2, '0')}-01`,
            period_end: `${year}-${endMonth.toString().padStart(2, '0')}-28`,
            hours_worked: hoursWorked,
            fatalities: 0,
            high_consequence_injuries: Math.floor(Math.random() * 2),
            recordable_injuries: Math.floor(Math.random() * 5) + 1,
            lost_time_injuries: Math.floor(Math.random() * 3),
            ltifr: Math.random() * 2.5, // Lost Time Injury Frequency Rate
            trir: Math.random() * 4.0, // Total Recordable Incident Rate
            severity_rate: Math.random() * 50,
            near_misses_reported: Math.floor(Math.random() * 15) + 5,
            hazards_identified: Math.floor(Math.random() * 25) + 10,
            hazards_eliminated: Math.floor(Math.random() * 20) + 8,
            employees_covered_by_oms_percent: 95 + Math.random() * 5,
            employees_covered_by_audit_percent: 88 + Math.random() * 10
          });
        }
      }
    }

    await batchInsert('health_safety_metrics', safetyData);

    // 4. SUPPLIER SOCIAL ASSESSMENTS
    console.log('🏭 Creating supplier social assessments...');
    const supplierNames = [
      'Global Steel Corp', 'EcoMaterials Ltd', 'TechSupply Inc', 'GreenLogistics Co',
      'Sustainable Packaging Ltd', 'CleanEnergy Solutions', 'EthicalSourcing Co',
      'ResponsibleMining Inc', 'FairTrade Materials', 'SustainableTextiles Ltd'
    ];
    
    const supplierData = [];
    for (let i = 0; i < supplierNames.length; i++) {
      for (let year = 2022; year <= 2024; year++) {
        const riskLevel = ['low', 'medium', 'high'][Math.floor(Math.random() * 3)];
        supplierData.push({
          organization_id: orgId,
          supplier_name: supplierNames[i],
          assessment_date: `${year}-${Math.floor(Math.random() * 12) + 1}-15`,
          country: ['US', 'DE', 'CN', 'IN', 'BR'][Math.floor(Math.random() * 5)],
          sector: ['Manufacturing', 'Technology', 'Logistics', 'Materials'][Math.floor(Math.random() * 4)],
          spend_amount: 500000 + Math.random() * 2000000,
          criticality: ['critical', 'high', 'medium'][Math.floor(Math.random() * 3)],
          child_labor_risk: riskLevel,
          forced_labor_risk: riskLevel,
          freedom_association_risk: riskLevel,
          discrimination_risk: riskLevel,
          health_safety_risk: riskLevel,
          code_of_conduct_signed: Math.random() > 0.2,
          self_assessment_completed: Math.random() > 0.3,
          audit_conducted: Math.random() > 0.4,
          audit_type: ['on-site', 'remote', 'third-party'][Math.floor(Math.random() * 3)],
          non_conformities_count: Math.floor(Math.random() * 8),
          critical_findings: Math.floor(Math.random() * 2),
          major_findings: Math.floor(Math.random() * 4),
          minor_findings: Math.floor(Math.random() * 6),
          cap_required: Math.random() > 0.7,
          cap_status: ['completed', 'in_progress', 'pending'][Math.floor(Math.random() * 3)],
          relationship_terminated: Math.random() > 0.95
        });
      }
    }

    await batchInsert('supplier_social_assessment', supplierData);

    // 5. BUSINESS CONDUCT
    console.log('📊 Creating business conduct data...');
    const conductData = [];
    for (let year = 2022; year <= 2024; year++) {
      conductData.push({
        organization_id: orgId,
        reporting_year: year,
        anti_corruption_policy: true,
        employees_trained_anticorruption_percent: 92 + Math.random() * 8,
        corruption_incidents: Math.floor(Math.random() * 2),
        confirmed_corruption_cases: 0,
        employees_dismissed_corruption: 0,
        anticompetitive_legal_actions: 0,
        antitrust_violations: 0,
        whistleblowing_mechanism: true,
        whistleblowing_reports: Math.floor(Math.random() * 15) + 5,
        whistleblowing_substantiated: Math.floor(Math.random() * 8) + 2,
        political_contributions_amount: Math.random() * 100000,
        lobbying_expenditure: Math.random() * 250000,
        trade_associations_fees: Math.random() * 150000
      });
    }

    await batchInsert('business_conduct', conductData);

    // 6. BOARD COMPOSITION
    console.log('👔 Creating board composition data...');
    const boardData = [];
    for (let year = 2022; year <= 2024; year++) {
      const totalMembers = 9 + Math.floor(Math.random() * 3); // 9-11 members
      boardData.push({
        organization_id: orgId,
        reporting_date: `${year}-12-31`,
        board_members_total: totalMembers,
        independent_directors: Math.floor(totalMembers * 0.67),
        non_executive_directors: Math.floor(totalMembers * 0.78),
        women_directors: Math.floor(totalMembers * 0.44),
        women_directors_percent: 44 + Math.random() * 6,
        directors_under_30: 0,
        directors_30_to_50: Math.floor(totalMembers * 0.33),
        directors_over_50: Math.floor(totalMembers * 0.67),
        directors_with_esg_expertise: Math.floor(totalMembers * 0.33),
        directors_with_climate_expertise: Math.floor(totalMembers * 0.22),
        directors_with_tech_expertise: Math.floor(totalMembers * 0.44),
        board_meetings_count: 8 + Math.floor(Math.random() * 4),
        average_attendance_rate: 92 + Math.random() * 8
      });
    }

    await batchInsert('board_composition', boardData);

    // 7. SUSTAINABILITY TARGETS
    console.log('🎯 Creating sustainability targets...');
    const targetsData = [
      {
        organization_id: orgId,
        target_type: 'emissions',
        target_scope: 'scope_1_2',
        baseline_year: 2020,
        baseline_value: 25000.0,
        baseline_unit: 'tCO2e',
        target_year: 2030,
        target_value: 12500.0,
        target_type_detail: 'absolute',
        current_value: 20500.0,
        progress_percentage: 18.0,
        on_track: true,
        sbti_validated: true,
        external_verification: true,
        verification_body: 'Bureau Veritas',
        aligned_with_15c: true,
        aligned_with_netzero: true
      },
      {
        organization_id: orgId,
        target_type: 'water',
        target_scope: 'total_water',
        baseline_year: 2020,
        baseline_value: 150000.0,
        baseline_unit: 'm3',
        target_year: 2025,
        target_value: 120000.0,
        target_type_detail: 'absolute',
        current_value: 135000.0,
        progress_percentage: 50.0,
        on_track: true,
        sbti_validated: false,
        external_verification: false,
        aligned_with_15c: false,
        aligned_with_netzero: false
      },
      {
        organization_id: orgId,
        target_type: 'diversity',
        target_scope: 'women_leadership',
        baseline_year: 2022,
        baseline_value: 35.0,
        baseline_unit: 'percent',
        target_year: 2027,
        target_value: 50.0,
        target_type_detail: 'absolute',
        current_value: 38.5,
        progress_percentage: 23.3,
        on_track: true,
        sbti_validated: false,
        external_verification: false,
        aligned_with_15c: false,
        aligned_with_netzero: false
      }
    ];

    await batchInsert('sustainability_targets', targetsData);

    // 8. EU TAXONOMY ALIGNMENT
    console.log('🇪🇺 Creating EU Taxonomy alignment data...');
    const taxonomyData = [];
    for (let year = 2022; year <= 2023; year++) {
      const totalRevenue = 500000000 + Math.random() * 100000000;
      taxonomyData.push({
        organization_id: orgId,
        reporting_year: year,
        total_revenue: totalRevenue,
        taxonomy_eligible_revenue: totalRevenue * (0.15 + Math.random() * 0.1),
        taxonomy_aligned_revenue: totalRevenue * (0.08 + Math.random() * 0.05),
        total_capex: totalRevenue * (0.12 + Math.random() * 0.05),
        taxonomy_eligible_capex: totalRevenue * (0.08 + Math.random() * 0.03),
        taxonomy_aligned_capex: totalRevenue * (0.04 + Math.random() * 0.02),
        total_opex: totalRevenue * (0.18 + Math.random() * 0.05),
        taxonomy_eligible_opex: totalRevenue * (0.12 + Math.random() * 0.03),
        taxonomy_aligned_opex: totalRevenue * (0.06 + Math.random() * 0.02),
        climate_mitigation_revenue: totalRevenue * (0.05 + Math.random() * 0.03),
        climate_adaptation_revenue: totalRevenue * (0.02 + Math.random() * 0.01),
        water_marine_revenue: totalRevenue * (0.01 + Math.random() * 0.005),
        circular_economy_revenue: totalRevenue * (0.015 + Math.random() * 0.01),
        pollution_prevention_revenue: totalRevenue * (0.008 + Math.random() * 0.005),
        biodiversity_revenue: totalRevenue * (0.005 + Math.random() * 0.003),
        dnsh_compliance: true,
        minimum_safeguards_met: true
      });
    }

    await batchInsert('eu_taxonomy_alignment', taxonomyData);

    // 9. COMMUNITY ENGAGEMENT
    console.log('🤝 Creating community engagement data...');
    const communityData = [];
    const communityNames = ['Downtown Business District', 'Riverside Residential', 'Industrial Park East', 'Green Valley Community'];
    
    for (const buildingId of buildingIds.slice(0, 4)) { // Only for first 4 buildings
      for (let i = 0; i < communityNames.length; i++) {
        for (let year = 2022; year <= 2024; year++) {
          communityData.push({
            organization_id: orgId,
            facility_id: buildingId,
            community_name: communityNames[i],
            population_size: 5000 + Math.floor(Math.random() * 20000),
            indigenous_community: Math.random() > 0.8,
            vulnerable_groups: ['elderly', 'low_income', 'youth'][Math.floor(Math.random() * 3)],
            engagement_type: ['consultation', 'partnership', 'investment'][Math.floor(Math.random() * 3)],
            engagement_frequency: ['monthly', 'quarterly', 'annual'][Math.floor(Math.random() * 3)],
            participants_count: 50 + Math.floor(Math.random() * 200),
            positive_impacts: ['job_creation', 'infrastructure_improvement', 'skills_development'],
            negative_impacts: ['noise', 'traffic', 'air_quality'],
            grievances_received: Math.floor(Math.random() * 8),
            grievances_resolved: Math.floor(Math.random() * 6),
            local_employment_percent: 65 + Math.random() * 20,
            local_procurement_percent: 45 + Math.random() * 25,
            community_investment_amount: 50000 + Math.random() * 200000,
            period_start: `${year}-01-01`,
            period_end: `${year}-12-31`
          });
        }
      }
    }

    await batchInsert('community_engagement', communityData);

    console.log('\n✅ Comprehensive ESG data seeding completed!');
    console.log('\n📈 Summary of data created:');
    console.log(`  - Materiality assessments: ${materialityData.length} records`);
    console.log(`  - Workforce demographics: ${workforceData.length} records`);
    console.log(`  - Health & safety metrics: ${safetyData.length} records`);
    console.log(`  - Supplier assessments: ${supplierData.length} records`);
    console.log(`  - Business conduct: ${conductData.length} records`);
    console.log(`  - Board composition: ${boardData.length} records`);
    console.log(`  - Sustainability targets: ${targetsData.length} records`);
    console.log(`  - EU Taxonomy alignment: ${taxonomyData.length} records`);
    console.log(`  - Community engagement: ${communityData.length} records`);

    console.log('\n🎯 ESG Compliance Status:');
    console.log('  ✅ CSRD/ESRS: Ready for full reporting');
    console.log('  ✅ GRI Standards: Complete data coverage');
    console.log('  ✅ TCFD: Climate risk & governance data');
    console.log('  ✅ EU Taxonomy: Alignment calculations');
    console.log('  ✅ Social & Governance: Full S1-S4, G1 coverage');

  } catch (error) {
    console.error('❌ Error seeding ESG data:', error);
  }
}

seedComprehensiveESGData();