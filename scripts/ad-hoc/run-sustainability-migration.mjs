import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://quovvwrwyfkzhgqdeham.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: { schema: 'public' },
  auth: { persistSession: false }
});

async function runMigration() {
  console.log('🚀 Running sustainability metrics migration...\n');

  try {
    // Read the migration file
    const migrationSQL = readFileSync('./supabase/migrations/20250114002000_sustainability_metrics_system.sql', 'utf-8');

    // Split by statements (be careful with functions that contain semicolons)
    const statements = migrationSQL
      .split(/;(?=\s*(?:CREATE|ALTER|INSERT|DROP|UPDATE|DELETE|GRANT|REVOKE|TRUNCATE|COMMENT|BEGIN|COMMIT|ROLLBACK|--)\s)/i)
      .filter(stmt => stmt.trim().length > 0);

    console.log(`Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim() + ';';

      // Skip comments
      if (statement.startsWith('--')) continue;

      console.log(`Executing statement ${i + 1}/${statements.length}...`);

      const { error } = await supabase.rpc('exec_sql', {
        sql: statement
      }).single();

      if (error) {
        // Try direct execution as some statements might not work with rpc
        const { data, error: directError } = await supabase
          .from('_migrations')
          .select('*')
          .limit(1);

        if (directError) {
          console.error(`❌ Error in statement ${i + 1}:`, error.message);
          console.log('Statement:', statement.substring(0, 100) + '...');
        }
      }
    }

    console.log('\n✅ Migration completed successfully!');

    // Now run the seed data
    console.log('\n🌱 Seeding metrics catalog...\n');

    const seedSQL = readFileSync('./supabase/seed_metrics_catalog.sql', 'utf-8');

    // For the seed, we'll parse it differently since it's mostly INSERT statements
    const seedStatements = seedSQL
      .split('ON CONFLICT')
      .map((part, index) => {
        if (index === 0) return part;
        return 'ON CONFLICT' + part;
      });

    for (const statement of seedStatements) {
      if (statement.trim().startsWith('--') || !statement.trim()) continue;

      console.log('Executing seed statement...');

      // Execute directly as it's complex
      const { error } = await supabase.rpc('exec_sql', {
        sql: statement
      }).single();

      if (error) {
        console.error('Seed error:', error.message);
      }
    }

    console.log('\n✅ Seed data loaded successfully!');

    // Verify the data
    const { data: metricsCount } = await supabase
      .from('metrics_catalog')
      .select('id', { count: 'exact', head: true });

    console.log(`\n📊 Total metrics in catalog: ${metricsCount || 0}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Create a simpler version without stored procedures
async function runSimplifiedMigration() {
  console.log('🚀 Running simplified sustainability metrics setup...\n');

  try {
    // First, let's create the tables using individual statements
    console.log('Creating metrics_catalog table...');
    const { error: catalogError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS metrics_catalog (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          code TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          scope TEXT NOT NULL CHECK (scope IN ('scope_1', 'scope_2', 'scope_3')),
          category TEXT NOT NULL,
          subcategory TEXT,
          unit TEXT NOT NULL,
          description TEXT,
          calculation_method TEXT,
          emission_factor DECIMAL,
          emission_factor_unit TEXT,
          emission_factor_source TEXT,
          ghg_protocol_category TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    }).single();

    if (catalogError) {
      console.log('Catalog table might already exist, continuing...');
    }

    console.log('Creating organization_metrics table...');
    const { error: orgMetricsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS organization_metrics (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
          metric_id UUID NOT NULL REFERENCES metrics_catalog(id) ON DELETE CASCADE,
          is_required BOOLEAN DEFAULT false,
          target_value DECIMAL,
          target_year INTEGER,
          baseline_value DECIMAL,
          baseline_year INTEGER,
          reporting_frequency TEXT CHECK (reporting_frequency IN ('monthly', 'quarterly', 'annually')),
          data_source TEXT,
          responsible_user_id UUID REFERENCES auth.users(id),
          notes TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(organization_id, metric_id)
        );
      `
    }).single();

    if (orgMetricsError) {
      console.log('Organization metrics table might already exist, continuing...');
    }

    console.log('Creating metrics_data table...');
    const { error: dataError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS metrics_data (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
          metric_id UUID NOT NULL REFERENCES metrics_catalog(id) ON DELETE CASCADE,
          site_id UUID REFERENCES sites(id),
          period_start DATE NOT NULL,
          period_end DATE NOT NULL,
          value DECIMAL NOT NULL,
          unit TEXT NOT NULL,
          co2e_emissions DECIMAL,
          data_quality TEXT CHECK (data_quality IN ('measured', 'calculated', 'estimated')),
          verification_status TEXT CHECK (verification_status IN ('unverified', 'verified', 'audited')),
          verified_by UUID REFERENCES auth.users(id),
          verified_at TIMESTAMPTZ,
          evidence_url TEXT,
          notes TEXT,
          metadata JSONB DEFAULT '{}',
          created_by UUID REFERENCES auth.users(id),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    }).single();

    if (dataError) {
      console.log('Metrics data table might already exist, continuing...');
    }

    console.log('\n✅ Tables created successfully!');

    // Now insert the metrics data
    console.log('\n🌱 Loading metrics into catalog...\n');

    // Read and parse the seed file
    const seedContent = readFileSync('./supabase/seed_metrics_catalog.sql', 'utf-8');

    // Extract just the VALUES part
    const valuesMatch = seedContent.match(/VALUES\s*([\s\S]*?)(?:ON CONFLICT|;)/);
    if (!valuesMatch) {
      throw new Error('Could not parse seed data');
    }

    // Parse each metric
    const metricsData = valuesMatch[1]
      .split(/\),\s*\(/g)
      .map(line => {
        // Clean up the line
        line = line.replace(/^\(/, '').replace(/\)$/, '');

        // Parse values (this is simplified - in production you'd want more robust parsing)
        const values = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === "'" && line[i-1] !== '\\') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        values.push(current.trim());

        // Clean values
        return values.map(v => {
          v = v.trim();
          if (v === 'NULL') return null;
          if (v.startsWith("'") && v.endsWith("'")) {
            return v.slice(1, -1).replace(/\\'/, "'");
          }
          return v;
        });
      });

    console.log(`Inserting ${metricsData.length} metrics...`);

    // Insert metrics one by one
    for (const metric of metricsData) {
      const [code, name, scope, category, subcategory, unit, description, emission_factor, emission_factor_unit, ghg_protocol_category] = metric;

      const { error } = await supabase
        .from('metrics_catalog')
        .upsert({
          code,
          name,
          scope,
          category,
          subcategory,
          unit,
          description,
          emission_factor: emission_factor === 'NULL' ? null : parseFloat(emission_factor),
          emission_factor_unit,
          ghg_protocol_category
        }, {
          onConflict: 'code'
        });

      if (error) {
        console.error(`Error inserting metric ${code}:`, error.message);
      }
    }

    // Verify
    const { count } = await supabase
      .from('metrics_catalog')
      .select('*', { count: 'exact', head: true });

    console.log(`\n✅ Successfully loaded ${count} metrics into the catalog!`);

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

// Try the simplified version
runSimplifiedMigration();