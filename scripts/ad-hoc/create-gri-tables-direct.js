const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

async function setupGRITables() {
  console.log('Setting up GRI additional standards...\n');

  // For now, let's just add the materials metrics to the catalog
  console.log('Adding GRI 301 materials metrics to catalog...');

  const materialsMetrics = [
    // Raw materials (scope_1 = direct/operational)
    { code: 'MAT-001', name: 'Total Raw Materials Used', category: 'Raw Materials', scope: 'scope_1', unit: 'tonnes', description: 'Total weight of all raw materials used' },
    { code: 'MAT-002', name: 'Non-Renewable Materials', category: 'Raw Materials', scope: 'scope_1', unit: 'tonnes', description: 'Metals, minerals, plastics from virgin sources' },
    { code: 'MAT-003', name: 'Renewable Materials', category: 'Raw Materials', scope: 'scope_1', unit: 'tonnes', description: 'Wood, paper, bio-based materials' },
    { code: 'MAT-004', name: 'Metals Used', category: 'Raw Materials', scope: 'scope_1', unit: 'tonnes', description: 'Total metals consumed' },
    { code: 'MAT-005', name: 'Plastics Used', category: 'Raw Materials', scope: 'scope_1', unit: 'tonnes', description: 'Total plastics consumed' },
    { code: 'MAT-006', name: 'Paper & Cardboard Used', category: 'Raw Materials', scope: 'scope_1', unit: 'tonnes', description: 'Total paper products consumed' },
    { code: 'MAT-007', name: 'Wood Used', category: 'Raw Materials', scope: 'scope_1', unit: 'tonnes', description: 'Total wood consumed' },
    { code: 'MAT-008', name: 'Chemicals Used', category: 'Raw Materials', scope: 'scope_1', unit: 'tonnes', description: 'Total chemicals consumed' },
    // Recycled content
    { code: 'MAT-010', name: 'Recycled Materials Input', category: 'Recycled Materials', scope: 'scope_1', unit: 'tonnes', description: 'Total recycled materials used as input' },
    { code: 'MAT-011', name: 'Recycled Metals Input', category: 'Recycled Materials', scope: 'scope_1', unit: 'tonnes', description: 'Recycled metals used' },
    { code: 'MAT-012', name: 'Recycled Plastics Input', category: 'Recycled Materials', scope: 'scope_1', unit: 'tonnes', description: 'Recycled plastics used' },
    { code: 'MAT-013', name: 'Recycled Paper Input', category: 'Recycled Materials', scope: 'scope_1', unit: 'tonnes', description: 'Recycled paper used' },
    { code: 'MAT-014', name: 'Recycled Content Percentage', category: 'Recycled Materials', scope: 'scope_1', unit: '%', description: 'Percentage of materials that are recycled' },
    // Packaging materials
    { code: 'MAT-020', name: 'Total Packaging Materials', category: 'Packaging Materials', scope: 'scope_1', unit: 'tonnes', description: 'Total packaging materials used' },
    { code: 'MAT-021', name: 'Plastic Packaging', category: 'Packaging Materials', scope: 'scope_1', unit: 'tonnes', description: 'Plastic packaging materials' },
    { code: 'MAT-022', name: 'Paper Packaging', category: 'Packaging Materials', scope: 'scope_1', unit: 'tonnes', description: 'Paper/cardboard packaging' },
    { code: 'MAT-023', name: 'Metal Packaging', category: 'Packaging Materials', scope: 'scope_1', unit: 'tonnes', description: 'Metal packaging (cans, tins)' },
    { code: 'MAT-024', name: 'Glass Packaging', category: 'Packaging Materials', scope: 'scope_1', unit: 'tonnes', description: 'Glass packaging' },
    { code: 'MAT-025', name: 'Recycled Packaging Content', category: 'Packaging Materials', scope: 'scope_1', unit: '%', description: 'Percentage of packaging that is recycled content' },
    // Product reclamation
    { code: 'MAT-030', name: 'Products Reclaimed', category: 'Product Reclamation', scope: 'scope_1', unit: 'units', description: 'Number of products reclaimed at end-of-life' },
    { code: 'MAT-031', name: 'Products Reclaimed Weight', category: 'Product Reclamation', scope: 'scope_1', unit: 'tonnes', description: 'Weight of products reclaimed' },
    { code: 'MAT-032', name: 'Packaging Reclaimed', category: 'Product Reclamation', scope: 'scope_1', unit: 'tonnes', description: 'Weight of packaging reclaimed' },
    { code: 'MAT-033', name: 'Reclamation Rate', category: 'Product Reclamation', scope: 'scope_1', unit: '%', description: 'Percentage of products/packaging reclaimed' }
  ];

  let inserted = 0;
  let skipped = 0;

  for (const metric of materialsMetrics) {
    const { error } = await supabase
      .from('metrics_catalog')
      .insert(metric);

    if (error) {
      if (error.code === '23505') { // Duplicate key
        skipped++;
      } else {
        console.error(`Error inserting ${metric.code}:`, error.message);
      }
    } else {
      inserted++;
    }
  }

  console.log(`✓ Inserted ${inserted} new materials metrics`);
  if (skipped > 0) console.log(`⊘ Skipped ${skipped} existing metrics`);

  // Verify
  const { data: allMaterials } = await supabase
    .from('metrics_catalog')
    .select('code, name, category')
    .or('category.eq.Raw Materials,category.eq.Recycled Materials,category.eq.Packaging Materials,category.eq.Product Reclamation');

  console.log(`\n✓ Total materials metrics in catalog: ${allMaterials?.length || 0}`);

  console.log('\n📝 Note: Database tables for GRI 304, 307, 308 need to be created via Supabase Dashboard SQL Editor');
  console.log('   Copy the SQL from: supabase/migrations/20251014_gri_additional_standards.sql');
  console.log('   Paste in: Supabase Dashboard → SQL Editor → New Query');
}

setupGRITables().catch(console.error);
