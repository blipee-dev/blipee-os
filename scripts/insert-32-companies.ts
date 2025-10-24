/**
 * Insert 32 new companies (Europe-focused, 4 Portuguese)
 * Uses Supabase API with service role key
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const companies = [
  // GRI-11: Oil & Gas (5 companies)
  { company_name: 'Galp Energia', sector: 'GRI-11', industry: 'Oil & Gas', country: 'Portugal', website: 'https://www.galp.com', has_sustainability_report: true, company_size: 'Large (>1000)' },
  { company_name: 'Equinor', sector: 'GRI-11', industry: 'Oil & Gas', country: 'Norway', website: 'https://www.equinor.com', has_sustainability_report: true, company_size: 'Large (>1000)' },
  { company_name: 'Eni', sector: 'GRI-11', industry: 'Oil & Gas', country: 'Italy', website: 'https://www.eni.com', has_sustainability_report: true, company_size: 'Large (>1000)' },
  { company_name: 'Repsol', sector: 'GRI-11', industry: 'Oil & Gas', country: 'Spain', website: 'https://www.repsol.com', has_sustainability_report: true, company_size: 'Large (>1000)' },
  { company_name: 'OMV', sector: 'GRI-11', industry: 'Oil & Gas', country: 'Austria', website: 'https://www.omv.com', has_sustainability_report: true, company_size: 'Large (>1000)' },

  // GRI-12: Mining (5 companies)
  { company_name: 'Boliden', sector: 'GRI-12', industry: 'Mining & Metals', country: 'Sweden', website: 'https://www.boliden.com', has_sustainability_report: true, company_size: 'Large (>1000)' },
  { company_name: 'LKAB', sector: 'GRI-12', industry: 'Mining & Metals', country: 'Sweden', website: 'https://www.lkab.com', has_sustainability_report: true, company_size: 'Large (>1000)' },
  { company_name: 'Norsk Hydro', sector: 'GRI-12', industry: 'Mining & Metals', country: 'Norway', website: 'https://www.hydro.com', has_sustainability_report: true, company_size: 'Large (>1000)' },
  { company_name: 'Fortescue Metals', sector: 'GRI-12', industry: 'Mining & Metals', country: 'Australia', website: 'https://www.fmgl.com.au', has_sustainability_report: true, company_size: 'Large (>1000)' },
  { company_name: 'Freeport-McMoRan', sector: 'GRI-12', industry: 'Mining & Metals', country: 'USA', website: 'https://www.fcx.com', has_sustainability_report: true, company_size: 'Large (>1000)' },

  // GRI-13: Agriculture (5 companies)
  { company_name: 'Unilever', sector: 'GRI-13', industry: 'Food & Agriculture', country: 'UK', website: 'https://www.unilever.com', has_sustainability_report: true, company_size: 'Large (>1000)' },
  { company_name: 'Danone', sector: 'GRI-13', industry: 'Food & Agriculture', country: 'France', website: 'https://www.danone.com', has_sustainability_report: true, company_size: 'Large (>1000)' },
  { company_name: 'Nestlé', sector: 'GRI-13', industry: 'Food & Agriculture', country: 'Switzerland', website: 'https://www.nestle.com', has_sustainability_report: true, company_size: 'Large (>1000)' },
  { company_name: 'Mowi', sector: 'GRI-13', industry: 'Aquaculture', country: 'Norway', website: 'https://www.mowi.com', has_sustainability_report: true, company_size: 'Large (>1000)' },
  { company_name: 'Royal DSM', sector: 'GRI-13', industry: 'Food & Agriculture', country: 'Netherlands', website: 'https://www.dsm.com', has_sustainability_report: true, company_size: 'Large (>1000)' },

  // GRI-14: Manufacturing (2 companies)
  { company_name: 'Navigator Company', sector: 'GRI-14', industry: 'Paper Manufacturing', country: 'Portugal', website: 'https://www.thenavigatorcompany.com', has_sustainability_report: true, company_size: 'Large (>1000)' },
  { company_name: 'ABB', sector: 'GRI-14', industry: 'Industrial Equipment', country: 'Switzerland', website: 'https://global.abb', has_sustainability_report: true, company_size: 'Large (>1000)' },

  // GRI-15: Construction (5 companies)
  { company_name: 'Mota-Engil', sector: 'GRI-15', industry: 'Construction', country: 'Portugal', website: 'https://www.mota-engil.com', has_sustainability_report: true, company_size: 'Large (>1000)' },
  { company_name: 'Vinci', sector: 'GRI-15', industry: 'Construction', country: 'France', website: 'https://www.vinci.com', has_sustainability_report: true, company_size: 'Large (>1000)' },
  { company_name: 'Bouygues', sector: 'GRI-15', industry: 'Construction', country: 'France', website: 'https://www.bouygues.com', has_sustainability_report: true, company_size: 'Large (>1000)' },
  { company_name: 'Ferrovial', sector: 'GRI-15', industry: 'Construction', country: 'Spain', website: 'https://www.ferrovial.com', has_sustainability_report: true, company_size: 'Large (>1000)' },
  { company_name: 'Skanska', sector: 'GRI-15', industry: 'Construction', country: 'Sweden', website: 'https://www.skanska.com', has_sustainability_report: true, company_size: 'Large (>1000)' },

  // GRI-16: Technology (5 companies)
  { company_name: 'SAP', sector: 'GRI-16', industry: 'Software', country: 'Germany', website: 'https://www.sap.com', has_sustainability_report: true, company_size: 'Large (>1000)' },
  { company_name: 'Nokia', sector: 'GRI-16', industry: 'Telecommunications', country: 'Finland', website: 'https://www.nokia.com', has_sustainability_report: true, company_size: 'Large (>1000)' },
  { company_name: 'Ericsson', sector: 'GRI-16', industry: 'Telecommunications', country: 'Sweden', website: 'https://www.ericsson.com', has_sustainability_report: true, company_size: 'Large (>1000)' },
  { company_name: 'Vodafone', sector: 'GRI-16', industry: 'Telecommunications', country: 'UK', website: 'https://www.vodafone.com', has_sustainability_report: true, company_size: 'Large (>1000)' },
  { company_name: 'Deutsche Telekom', sector: 'GRI-16', industry: 'Telecommunications', country: 'Germany', website: 'https://www.telekom.com', has_sustainability_report: true, company_size: 'Large (>1000)' },

  // GRI-17: Retail (5 companies)
  { company_name: 'Jerónimo Martins', sector: 'GRI-17', industry: 'Retail', country: 'Portugal', website: 'https://www.jeronimomartins.com', has_sustainability_report: true, company_size: 'Large (>1000)' },
  { company_name: 'Carrefour', sector: 'GRI-17', industry: 'Retail', country: 'France', website: 'https://www.carrefour.com', has_sustainability_report: true, company_size: 'Large (>1000)' },
  { company_name: 'Tesco', sector: 'GRI-17', industry: 'Retail', country: 'UK', website: 'https://www.tescoplc.com', has_sustainability_report: true, company_size: 'Large (>1000)' },
  { company_name: 'IKEA', sector: 'GRI-17', industry: 'Retail', country: 'Sweden', website: 'https://www.ikea.com', has_sustainability_report: true, company_size: 'Large (>1000)' },
  { company_name: 'H&M Group', sector: 'GRI-17', industry: 'Retail', country: 'Sweden', website: 'https://hmgroup.com', has_sustainability_report: true, company_size: 'Large (>1000)' },
];

async function main() {
  console.log('🚀 Inserting 32 new companies...\n');

  const { data, error } = await supabase
    .from('sector_companies')
    .insert(companies)
    .select();

  if (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }

  console.log(`✅ Successfully inserted ${data.length} companies!\n`);

  // Count by sector
  const sectors = companies.reduce((acc, c) => {
    acc[c.sector] = (acc[c.sector] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('📊 By Sector:');
  Object.entries(sectors).forEach(([sector, count]) => {
    console.log(`   ${sector}: ${count} companies`);
  });

  // Count Portuguese companies
  const portugueseCount = companies.filter(c => c.country === 'Portugal').length;
  console.log(`\n🇵🇹 Portuguese companies: ${portugueseCount}`);

  // Verify total
  const { count } = await supabase
    .from('sector_companies')
    .select('*', { count: 'exact', head: true });

  console.log(`\n📈 Total companies in database: ${count}`);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
