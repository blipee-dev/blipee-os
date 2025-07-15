#!/usr/bin/env node

/**
 * Fix incorrect role enum values
 * Changes 'sustainability_manager' to 'sustainability_lead'
 */

const fs = require('fs');
const { glob } = require('glob');

async function fixRoleEnum() {
  console.log('🔧 Fixing role enum values...');
  
  // Find all TypeScript/JavaScript files
  const files = await glob('src/**/*.{ts,tsx,js,jsx}', {
    ignore: ['**/node_modules/**', '**/dist/**']
  });
  
  let updatedCount = 0;
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    
    if (content.includes('sustainability_manager')) {
      const updatedContent = content.replace(/sustainability_manager/g, 'sustainability_lead');
      fs.writeFileSync(file, updatedContent);
      console.log(`✅ Updated: ${file}`);
      updatedCount++;
    }
  }
  
  console.log(`\n✨ Updated ${updatedCount} files`);
  
  // Also update any SQL files in migrations
  const sqlFiles = await glob('supabase/migrations/**/*.sql');
  
  for (const file of sqlFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    
    if (content.includes('sustainability_manager')) {
      const updatedContent = content.replace(/sustainability_manager/g, 'sustainability_lead');
      fs.writeFileSync(file, updatedContent);
      console.log(`✅ Updated SQL: ${file}`);
      updatedCount++;
    }
  }
  
  console.log('\n✅ Role enum fix complete!');
}

// Run the fix
fixRoleEnum().catch(console.error);