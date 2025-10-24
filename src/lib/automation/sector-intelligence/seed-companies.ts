/**
 * Seed Priority Companies
 * Loads high-priority companies from company-targets.json into the database
 */

import { createClient } from '@supabase/supabase-js';
import companyTargets from './company-targets.json';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function seedPriorityCompanies() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('🌱 Seeding priority companies...\n');

  let totalSeeded = 0;
  let totalSkipped = 0;

  for (const [sectorCode, sectorData] of Object.entries(companyTargets.sectors)) {
    console.log(`📂 Sector: ${sectorData.name} (${sectorCode})`);
    console.log(`   Companies: ${sectorData.priority_companies.length}`);

    for (const company of sectorData.priority_companies) {
      // Check if company already exists
      const { data: existing } = await supabase
        .from('sector_companies')
        .select('id')
        .eq('company_name', company.name)
        .eq('sector', sectorCode)
        .single();

      if (existing) {
        console.log(`   ⏭️  Skipped: ${company.name} (already exists)`);
        totalSkipped++;
        continue;
      }

      // Insert new company
      const { error } = await supabase
        .from('sector_companies')
        .insert({
          company_name: company.name,
          website: company.website,
          sector: sectorCode,
          industry: sectorData.name,
          company_size: company.size,
          country: company.country,
          stock_ticker: company.ticker,
          has_sustainability_report: !!company.sustainability_report_url,
          discovered_at: new Date().toISOString(),
          last_verified: new Date().toISOString(),
        });

      if (error) {
        console.error(`   ❌ Error seeding ${company.name}:`, error.message);
      } else {
        console.log(`   ✅ Seeded: ${company.name}`);
        totalSeeded++;
      }
    }

    console.log('');
  }

  console.log(`\n🎉 Seeding complete!`);
  console.log(`   ✅ Seeded: ${totalSeeded} companies`);
  console.log(`   ⏭️  Skipped: ${totalSkipped} companies (already in database)`);
  console.log(`   📊 Total: ${totalSeeded + totalSkipped} companies\n`);

  return { seeded: totalSeeded, skipped: totalSkipped };
}

/**
 * Get all companies for a specific sector
 */
export function getCompaniesForSector(sectorCode: string) {
  const sector = companyTargets.sectors[sectorCode as keyof typeof companyTargets.sectors];
  if (!sector) {
    throw new Error(`Unknown sector: ${sectorCode}`);
  }
  return sector.priority_companies;
}

/**
 * Get all discovery sources for a sector
 */
export function getDiscoverySourcesForSector(sectorCode: string) {
  const sector = companyTargets.sectors[sectorCode as keyof typeof companyTargets.sectors];
  if (!sector) {
    throw new Error(`Unknown sector: ${sectorCode}`);
  }
  return sector.discovery_sources;
}

/**
 * Get all sectors with their metadata
 */
export function getAllSectors() {
  return Object.entries(companyTargets.sectors).map(([code, data]) => ({
    code,
    name: data.name,
    companyCount: data.priority_companies.length,
    discoverySources: data.discovery_sources.length,
  }));
}

// Run if executed directly
if (require.main === module) {
  seedPriorityCompanies()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}
