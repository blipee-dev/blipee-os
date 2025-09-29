import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY!
);

async function checkUserOrganization() {
  // Check jose.pinto@plmj.pt user
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('id, email, organization_id')
    .eq('email', 'jose.pinto@plmj.pt');

  console.log('User data:', users);
  
  if (users && users.length > 0) {
    const user = users[0];
    console.log('\nUser found:');
    console.log('- ID:', user.id);
    console.log('- Email:', user.email);
    console.log('- Organization ID:', user.organization_id || 'NULL (This is the problem!)');
    
    if (!user.organization_id) {
      console.log('\n❌ PROBLEM: User has no organization_id!');
      console.log('This is why the APIs return "Organization not found"\n');
      
      // Check if there are any organizations
      const { data: orgs, error: orgError } = await supabase
        .from('organizations')
        .select('id, name')
        .limit(5);
      
      console.log('Available organizations:', orgs);
      
      if (orgs && orgs.length > 0) {
        console.log('\n✅ FIX: Assign user to organization');
        console.log('Run this SQL in Supabase:');
        console.log(`UPDATE users SET organization_id = '${orgs[0].id}' WHERE email = 'jose.pinto@plmj.pt';`);
      } else {
        console.log('\n❌ No organizations exist. Need to create one first.');
      }
    }
  } else {
    console.log('User not found in users table');
  }
}

checkUserOrganization();
