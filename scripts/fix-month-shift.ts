import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Please check your .env.local file.');
  process.exit(1);
}

// Create Supabase client with service role key for full access
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface MetricsData {
  id: string;
  period_start: string;
  period_end: string;
  metric_id: string;
  site_id: string;
  value: number;
}

async function analyzeData() {
  console.log('🔍 Analyzing metrics data...\n');

  // Fetch all metrics data
  const { data, error } = await supabase
    .from('metrics_data')
    .select('id, period_start, period_end, metric_id, site_id, value')
    .order('period_start', { ascending: true });

  if (error) {
    console.error('Error fetching data:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('No data found.');
    return;
  }

  console.log(`Total records found: ${data.length}\n`);

  const updates: Array<{
    id: string;
    original: { period_start: string; period_end: string };
    updated: { period_start: string; period_end: string };
  }> = [];

  const correctEntries: string[] = [];
  const issues: Array<{ id: string; reason: string; dates: string }> = [];

  // Analyze each entry
  data.forEach((entry) => {
    const periodStart = new Date(entry.period_start);
    const periodEnd = new Date(entry.period_end);
    
    const startMonth = periodStart.getMonth(); // 0-11
    const startDay = periodStart.getDate();
    const endMonth = periodEnd.getMonth();
    const endDay = periodEnd.getDate();
    
    // Check if this entry needs fixing
    if (startDay > 28 && endMonth === (startMonth + 1) % 12) {
      // This entry spans two months and needs to be fixed
      const targetMonth = endMonth; // The month it should belong to
      const targetYear = periodEnd.getFullYear();
      
      // Calculate new dates - full month
      const newPeriodStart = new Date(targetYear, targetMonth, 1);
      const newPeriodEnd = new Date(targetYear, targetMonth + 1, 0); // Last day of month
      
      updates.push({
        id: entry.id,
        original: {
          period_start: entry.period_start,
          period_end: entry.period_end
        },
        updated: {
          period_start: newPeriodStart.toISOString(),
          period_end: newPeriodEnd.toISOString()
        }
      });
    } else if (startMonth === endMonth && startDay === 1 && endDay >= 28) {
      // This entry is already correct (starts on 1st, ends at end of same month)
      correctEntries.push(entry.id);
    } else {
      // Flag any other patterns as potential issues
      issues.push({
        id: entry.id,
        reason: 'Unexpected date pattern',
        dates: `${entry.period_start} to ${entry.period_end}`
      });
    }
  });

  console.log('📊 Analysis Results:');
  console.log(`- Entries needing update: ${updates.length}`);
  console.log(`- Correct entries: ${correctEntries.length}`);
  console.log(`- Potential issues: ${issues.length}\n`);

  if (updates.length > 0) {
    console.log('📝 Sample entries to be updated:');
    updates.slice(0, 5).forEach((update, index) => {
      const origStart = new Date(update.original.period_start).toLocaleDateString();
      const origEnd = new Date(update.original.period_end).toLocaleDateString();
      const newStart = new Date(update.updated.period_start).toLocaleDateString();
      const newEnd = new Date(update.updated.period_end).toLocaleDateString();
      
      console.log(`${index + 1}. ID: ${update.id.substring(0, 8)}...`);
      console.log(`   Current: ${origStart} - ${origEnd}`);
      console.log(`   Will be: ${newStart} - ${newEnd}\n`);
    });

    if (updates.length > 5) {
      console.log(`... and ${updates.length - 5} more entries\n`);
    }
  }

  if (issues.length > 0) {
    console.log('\n⚠️  Potential issues found:');
    issues.slice(0, 5).forEach((issue, index) => {
      console.log(`${index + 1}. ID: ${issue.id.substring(0, 8)}... - ${issue.reason}: ${issue.dates}`);
    });
    if (issues.length > 5) {
      console.log(`... and ${issues.length - 5} more issues`);
    }
  }

  return updates;
}

async function applyFixes(updates: Array<{ id: string; updated: { period_start: string; period_end: string } }>) {
  console.log('\n🔧 Applying fixes...\n');

  let successCount = 0;
  let errorCount = 0;
  const errors: any[] = [];

  // Process updates in batches to avoid overwhelming the API
  const batchSize = 50;
  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);
    
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(updates.length / batchSize)}...`);
    
    // Execute batch updates
    const promises = batch.map(update =>
      supabase
        .from('metrics_data')
        .update({
          period_start: update.updated.period_start,
          period_end: update.updated.period_end
        })
        .eq('id', update.id)
    );

    const results = await Promise.all(promises);
    
    results.forEach((result, index) => {
      if (result.error) {
        errorCount++;
        errors.push({
          id: batch[index].id,
          error: result.error
        });
      } else {
        successCount++;
      }
    });
  }

  console.log('\n✅ Update complete!');
  console.log(`- Successfully updated: ${successCount} entries`);
  console.log(`- Failed updates: ${errorCount} entries`);

  if (errors.length > 0) {
    console.log('\n❌ Errors:');
    errors.slice(0, 5).forEach((err, index) => {
      console.log(`${index + 1}. ID: ${err.id.substring(0, 8)}... - Error: ${err.error.message}`);
    });
    if (errors.length > 5) {
      console.log(`... and ${errors.length - 5} more errors`);
    }
  }
}

async function main() {
  console.log('🚀 Month Shift Data Cleanup Script\n');
  console.log('This script will fix the month shift issue in sustainability metrics data.');
  console.log('It will adjust entries that span two months to be within a single month.\n');

  // First, analyze the data
  const updates = await analyzeData();

  if (!updates || updates.length === 0) {
    console.log('\n✨ No updates needed!');
    return;
  }

  // Ask for confirmation
  console.log('\n❓ Do you want to apply these fixes? (yes/no)');
  
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  readline.question('> ', async (answer) => {
    if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
      await applyFixes(updates);
    } else {
      console.log('\n❌ Operation cancelled.');
    }
    
    readline.close();
    process.exit(0);
  });
}

// Run the script
main().catch(console.error);