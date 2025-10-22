import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function clearOldScores() {
  console.log('🗑️  Clearing old performance scores...\n');

  // Delete category scores first (foreign key constraint)
  const { data: categoryScores, error: catError } = await supabase
    .from('category_scores')
    .select('id');

  if (!catError && categoryScores && categoryScores.length > 0) {
    const { error: deleteCatError } = await supabase
      .from('category_scores')
      .delete()
      .in('id', categoryScores.map(c => c.id));

    if (deleteCatError) {
      console.error('❌ Error deleting category scores:', deleteCatError);
    } else {
      console.log(`✅ Deleted ${categoryScores.length} category scores`);
    }
  }

  // Delete performance scores
  const { data: perfScores, error: perfError } = await supabase
    .from('performance_scores')
    .select('id');

  if (!perfError && perfScores && perfScores.length > 0) {
    const { error: deletePerfError } = await supabase
      .from('performance_scores')
      .delete()
      .in('id', perfScores.map(p => p.id));

    if (deletePerfError) {
      console.error('❌ Error deleting performance scores:', deletePerfError);
    } else {
      console.log(`✅ Deleted ${perfScores.length} performance scores`);
    }
  }

  console.log('\n✅ Old scores cleared! Refresh your browser to recalculate.\n');
}

clearOldScores();
