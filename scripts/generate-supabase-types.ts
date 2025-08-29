#!/usr/bin/env tsx

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import path from 'path';

console.log('🔧 Supabase Type Generation Script\n');

// Check if Supabase CLI is installed
try {
  execSync('supabase --version', { stdio: 'pipe' });
  console.log('✅ Supabase CLI is installed');
} catch {
  console.error('❌ Supabase CLI is not installed');
  console.log('\nPlease install it with:');
  console.log('  brew install supabase/tap/supabase');
  console.log('  # or');
  console.log('  npm install -g supabase');
  process.exit(1);
}

// Check for environment variables
const envPath = path.join(process.cwd(), '.env.local');
if (!existsSync(envPath)) {
  console.error('❌ .env.local file not found');
  console.log('\nPlease create .env.local with your Supabase credentials:');
  console.log('  NEXT_PUBLIC_SUPABASE_URL=your-project-url');
  console.log('  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key');
  process.exit(1);
}

// Parse .env.local
const envContent = readFileSync(envPath, 'utf-8');
const envVars = Object.fromEntries(
  envContent
    .split('\n')
    .filter(line => line && !line.startsWith('#'))
    .map(line => {
      const [key, ...values] = line.split('=');
      return [key, values.join('=').trim()];
    })
);

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

// Extract project ID from URL
const projectId = supabaseUrl.match(/https:\/\/([\w-]+)\.supabase\.co/)?.[1];
if (!projectId) {
  console.error('❌ Could not extract project ID from Supabase URL');
  process.exit(1);
}

console.log(`\n📦 Project ID: ${projectId}`);

// Generate types
console.log('\n🔄 Generating TypeScript types...\n');

try {
  // First, try to generate types using the project ID
  execSync(
    `npx supabase gen types typescript --project-id ${projectId} > src/types/supabase.ts`,
    { stdio: 'inherit' }
  );
  console.log('✅ Types generated successfully!');
} catch (error) {
  console.log('\n⚠️  Direct generation failed. Trying with database URL...\n');
  
  // If that fails, try using the database URL approach
  const dbUrl = envVars.DATABASE_URL || envVars.SUPABASE_DB_URL;
  
  if (dbUrl) {
    try {
      execSync(
        `npx supabase gen types typescript --db-url "${dbUrl}" > src/types/supabase.ts`,
        { stdio: 'inherit' }
      );
      console.log('✅ Types generated successfully using database URL!');
    } catch {
      console.error('\n❌ Failed to generate types');
      console.log('\nAlternative approaches:');
      console.log('1. Make sure you are logged in to Supabase CLI:');
      console.log('   npx supabase login');
      console.log('\n2. Link your project:');
      console.log(`   npx supabase link --project-ref ${projectId}`);
      console.log('\n3. Then run:');
      console.log('   npx supabase gen types typescript --linked > src/types/supabase.ts');
      process.exit(1);
    }
  } else {
    console.error('\n❌ Failed to generate types');
    console.log('\nPlease try:');
    console.log('1. Login to Supabase CLI:');
    console.log('   npx supabase login');
    console.log('\n2. Link your project:');
    console.log(`   npx supabase link --project-ref ${projectId}`);
    console.log('\n3. Then run this script again');
    process.exit(1);
  }
}

// Verify the generated file
const typesPath = path.join(process.cwd(), 'src/types/supabase.ts');
if (existsSync(typesPath)) {
  const content = readFileSync(typesPath, 'utf-8');
  if (content.length > 0) {
    console.log(`\n✅ Types file created at: ${typesPath}`);
    console.log(`📏 File size: ${content.length} characters`);
    
    // Count the number of tables
    const tableMatches = content.match(/Tables: {[\s\S]*?}/);
    if (tableMatches) {
      const tableNames = tableMatches[0].match(/(\w+):\s*{/g);
      console.log(`📊 Number of tables: ${tableNames?.length || 0}`);
    }
  } else {
    console.error('\n⚠️  Types file is empty!');
  }
}

console.log('\n✨ Done!');