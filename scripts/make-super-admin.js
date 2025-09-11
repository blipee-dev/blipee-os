const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function makeSuperAdmin() {
  const userId = 'd5708d9c-34fb-4c85-90ec-34faad9e2896';
  const email = 'pedro@blipee.com';
  
  // Check if already super admin
  const { data: existing, error: checkError } = await supabase
    .from('super_admins')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (existing) {
    console.log('✅ User is already a super admin');
    return;
  }
  
  // Add as super admin
  const { data, error } = await supabase
    .from('super_admins')
    .insert({
      user_id: userId,
      created_at: new Date().toISOString()
    });
  
  if (error) {
    console.error('❌ Error making super admin:', error);
  } else {
    console.log('✅ Successfully made pedro@blipee.com a super admin!');
  }
}

makeSuperAdmin();