#!/usr/bin/env tsx

import { config } from 'dotenv';
import { resolve } from 'path';
import { migrationManager } from '../src/lib/database/migration';
import { logger } from '../src/lib/logger';

// Load environment variables
config({ path: resolve(__dirname, '../.env.local') });

// Ensure we have required environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error('❌ Missing required Supabase environment variables');
  process.exit(1);
}

async function main() {
  const command = process.argv[2];
  const args = process.argv.slice(3);
  
  console.log('🗄️  Blipee OS Migration Tool\n');
  
  try {
    switch (command) {
      case 'run':
      case 'up': {
        console.log('Running pending migrations...');
        const count = await migrationManager.runPendingMigrations();
        console.log(`✅ Completed ${count} migrations`);
        break;
      }
      
      case 'status': {
        console.log('Checking migration status...');
        const status = await migrationManager.exportStatus();
        
        console.log('\n📊 Migration Status:');
        console.log(`Applied: ${status.applied.length}`);
        console.log(`Pending: ${status.pending.length}`);
        console.log(`Valid: ${status.validation.valid ? '✅' : '❌'}`);
        
        if (status.applied.length > 0) {
          console.log('\n✅ Applied Migrations:');
          status.applied.forEach(m => {
            console.log(`  - ${m.name} (v${m.version}) - ${new Date(m.applied_at!).toLocaleString()}`);
          });
        }
        
        if (status.pending.length > 0) {
          console.log('\n⏳ Pending Migrations:');
          status.pending.forEach(m => {
            console.log(`  - ${m.name} (v${m.version})`);
          });
        }
        
        if (status.validation.issues.length > 0) {
          console.log('\n⚠️  Validation Issues:');
          status.validation.issues.forEach(issue => {
            console.log(`  - ${issue}`);
          });
        }
        break;
      }
      
      case 'validate': {
        console.log('Validating migrations...');
        const result = await migrationManager.validateMigrations();
        
        if (result.valid) {
          console.log('✅ All migrations are valid');
        } else {
          console.log('❌ Validation failed:');
          result.issues.forEach(issue => {
            console.log(`  - ${issue}`);
          });
        }
        break;
      }
      
      case 'create': {
        const name = args[0];
        if (!name) {
          console.error('❌ Please provide a migration name');
          console.log('Usage: npm run migrate create <name>');
          process.exit(1);
        }
        
        console.log(`Creating migration: ${name}`);
        const filepath = await migrationManager.createMigration(name);
        console.log(`✅ Created migration: ${filepath}`);
        console.log('📝 Edit the file to add your SQL statements');
        break;
      }
      
      case 'list': {
        console.log('Listing all migrations...');
        const files = await migrationManager.getMigrationFiles();
        const applied = await migrationManager.getAppliedMigrations();
        const appliedVersions = new Set(applied.map(m => m.version));
        
        console.log(`\n📁 Found ${files.length} migration files:\n`);
        
        files.forEach(file => {
          const status = appliedVersions.has(file.version) ? '✅' : '⏳';
          console.log(`${status} ${file.name}`);
        });
        break;
      }
      
      case 'help':
      default: {
        console.log('Available commands:');
        console.log('  run, up     - Run all pending migrations');
        console.log('  status      - Show migration status');
        console.log('  validate    - Validate migration files');
        console.log('  create      - Create a new migration file');
        console.log('  list        - List all migrations');
        console.log('  help        - Show this help message');
        console.log('\nExamples:');
        console.log('  npm run migrate run');
        console.log('  npm run migrate create add_user_preferences');
        console.log('  npm run migrate status');
        break;
      }
    }
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});