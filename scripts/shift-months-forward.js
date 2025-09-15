const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Please check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function shiftMonthsForward() {
  console.log('🔍 Fetching data from April to October...\n');

  // Fetch all metrics data for months April (3) through October (9)
  // Note: JavaScript months are 0-indexed, so April = 3, October = 9
  const { data, error } = await supabase
    .from('metrics_data')
    .select('*')
    .order('period_start', { ascending: true });

  if (error) {
    console.error('Error fetching data:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('No data found.');
    return;
  }

  // Filter entries for April through October
  const entriesToShift = data.filter(entry => {
    const startDate = new Date(entry.period_start);
    const month = startDate.getMonth(); // 0-11
    return month >= 3 && month <= 9; // April (3) to October (9)
  });

  console.log(`Total entries found: ${data.length}`);
  console.log(`Entries to shift (April-October): ${entriesToShift.length}\n`);

  // Group by year for better visibility
  const entriesByYear = {};
  entriesToShift.forEach(entry => {
    const year = new Date(entry.period_start).getFullYear();
    if (!entriesByYear[year]) {
      entriesByYear[year] = [];
    }
    entriesByYear[year].push(entry);
  });

  console.log('📊 Entries to shift by year:');
  Object.entries(entriesByYear).forEach(([year, entries]) => {
    console.log(`  ${year}: ${entries.length} entries`);
  });

  // Create updates - shift each entry forward by one month
  const updates = entriesToShift.map(entry => {
    const oldStart = new Date(entry.period_start);
    const oldEnd = new Date(entry.period_end);
    
    // Add one month to both dates
    const newStart = new Date(oldStart);
    newStart.setMonth(newStart.getMonth() + 1);
    
    const newEnd = new Date(oldEnd);
    newEnd.setMonth(newEnd.getMonth() + 1);
    
    return {
      id: entry.id,
      original: {
        period_start: entry.period_start,
        period_end: entry.period_end
      },
      updated: {
        period_start: newStart.toISOString(),
        period_end: newEnd.toISOString()
      }
    };
  });

  // Show sample updates
  console.log('\n📝 Sample updates (first 10):');
  updates.slice(0, 10).forEach((update, index) => {
    const origStart = new Date(update.original.period_start);
    const newStart = new Date(update.updated.period_start);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    console.log(`${index + 1}. ID: ${update.id.substring(0, 8)}...`);
    console.log(`   From: ${months[origStart.getMonth()]} ${origStart.getFullYear()}`);
    console.log(`   To:   ${months[newStart.getMonth()]} ${newStart.getFullYear()}\n`);
  });

  return updates;
}

async function applyShift(updates) {
  console.log('\n🔧 Applying month shift...\n');

  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  // Process in batches
  const batchSize = 50;
  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);
    
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(updates.length / batchSize)}...`);
    
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

  console.log('\n✅ Shift complete!');
  console.log(`- Successfully updated: ${successCount} entries`);
  console.log(`- Failed updates: ${errorCount} entries`);
  console.log('\n📌 Result: April is now empty, and October has been populated with September\'s data');
}

async function main() {
  console.log('🚀 Month Shift Script - Move April-October data forward by one month\n');
  console.log('This will:');
  console.log('- Move April data → May');
  console.log('- Move May data → June');
  console.log('- Move June data → July');
  console.log('- Move July data → August');
  console.log('- Move August data → September');
  console.log('- Move September data → October');
  console.log('- Result: April will be empty, October will have data\n');

  const updates = await shiftMonthsForward();

  if (!updates || updates.length === 0) {
    console.log('\n✨ No data to shift!');
    return;
  }

  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  readline.question('\n❓ Do you want to apply this shift? (yes/no)\n> ', async (answer) => {
    if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
      await applyShift(updates);
    } else {
      console.log('\n❌ Operation cancelled.');
    }
    
    readline.close();
  });
}

main().catch(console.error);