#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function fixAuthIntegration() {
  console.log('🔧 Fixing Supabase Auth Integration Issues...\n');

  try {
    // Read issues file if it exists
    const fs = require('fs');
    if (!fs.existsSync('verify-auth-issues.json')) {
      console.log('❌ No issues file found. Run verify-auth-integration.js first.');
      return;
    }

    const issues = JSON.parse(fs.readFileSync('verify-auth-issues.json', 'utf8'));
    console.log(`📋 Found ${issues.length} issues to fix\n`);

    let fixed = 0;
    let failed = 0;

    for (const issue of issues) {
      console.log(`\n🔧 Processing ${issue.email}...`);

      switch (issue.type) {
        case 'orphaned_app_user':
          // App user exists but no auth account
          console.log('   Creating auth account for app_user...');

          try {
            // Create auth user with temporary password
            const tempPassword = Math.random().toString(36).slice(-16) + 'Aa1!';

            const { data: authUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
              email: issue.email,
              password: tempPassword,
              email_confirm: false,
              user_metadata: {
                app_user_id: issue.app_user_id
              }
            });

            if (createError) {
              console.log(`   ❌ Failed to create auth user: ${createError.message}`);

              // If user already exists in auth, link it
              if (createError.message.includes('already registered')) {
                console.log('   🔄 User already exists in auth, linking...');

                // Find the existing auth user
                const { data: authData } = await supabaseAdmin.auth.admin.listUsers();
                const existingAuthUser = authData.users.find(u => u.email === issue.email);

                if (existingAuthUser) {
                  // Update app_user with auth_user_id
                  const { error: updateError } = await supabaseAdmin
                    .from('app_users')
                    .update({ auth_user_id: existingAuthUser.id })
                    .eq('id', issue.app_user_id);

                  if (updateError) {
                    console.log(`   ❌ Failed to link: ${updateError.message}`);
                    failed++;
                  } else {
                    console.log(`   ✅ Linked existing auth user ${existingAuthUser.id}`);
                    fixed++;
                  }
                } else {
                  console.log('   ❌ Could not find existing auth user');
                  failed++;
                }
              } else {
                failed++;
              }
            } else {
              // Update app_user with the new auth_user_id
              const { error: updateError } = await supabaseAdmin
                .from('app_users')
                .update({ auth_user_id: authUser.user.id })
                .eq('id', issue.app_user_id);

              if (updateError) {
                console.log(`   ❌ Failed to update app_user: ${updateError.message}`);
                failed++;
              } else {
                console.log(`   ✅ Created auth user and linked to app_user`);
                console.log(`   📧 Send password reset email to ${issue.email}`);

                // Generate password reset link
                const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
                  type: 'recovery',
                  email: issue.email
                });

                if (resetData && !resetError) {
                  console.log(`   🔗 Password reset link: ${resetData.properties.action_link}`);
                }

                fixed++;
              }
            }
          } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
            failed++;
          }
          break;

        case 'orphaned_auth_user':
          // Auth user exists but no app_user entry
          console.log('   Creating app_user for auth account...');

          try {
            // Get auth user details
            const { data: authData } = await supabaseAdmin.auth.admin.listUsers();
            const authUser = authData.users.find(u => u.id === issue.auth_user_id);

            if (!authUser) {
              console.log('   ❌ Could not find auth user');
              failed++;
              continue;
            }

            // Create app_user entry
            const { data: appUser, error: createError } = await supabaseAdmin
              .from('app_users')
              .insert({
                auth_user_id: authUser.id,
                email: authUser.email,
                name: authUser.user_metadata?.full_name ||
                      authUser.user_metadata?.display_name ||
                      authUser.email.split('@')[0],
                role: authUser.user_metadata?.role || 'viewer',
                organization_id: authUser.user_metadata?.organization_id || null,
                status: 'active',
                permissions: authUser.user_metadata?.permissions || {
                  access_level: 'organization',
                  site_ids: []
                }
              })
              .select()
              .single();

            if (createError) {
              // Check if it's a duplicate email error
              if (createError.message.includes('duplicate')) {
                console.log('   ⚠️  App user already exists, updating auth_user_id...');

                const { error: updateError } = await supabaseAdmin
                  .from('app_users')
                  .update({ auth_user_id: authUser.id })
                  .eq('email', authUser.email);

                if (updateError) {
                  console.log(`   ❌ Failed to update: ${updateError.message}`);
                  failed++;
                } else {
                  console.log('   ✅ Updated existing app_user with auth_user_id');
                  fixed++;
                }
              } else {
                console.log(`   ❌ Failed to create app_user: ${createError.message}`);
                failed++;
              }
            } else {
              console.log(`   ✅ Created app_user for auth account`);
              fixed++;
            }
          } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
            failed++;
          }
          break;

        case 'email_mismatch':
          // Emails don't match between app_users and auth.users
          console.log('   Fixing email mismatch...');

          try {
            // Update app_user email to match auth.users
            const { error: updateError } = await supabaseAdmin
              .from('app_users')
              .update({ email: issue.auth_email })
              .eq('auth_user_id', issue.auth_user_id);

            if (updateError) {
              console.log(`   ❌ Failed to update email: ${updateError.message}`);
              failed++;
            } else {
              console.log(`   ✅ Updated app_user email from ${issue.app_email} to ${issue.auth_email}`);
              fixed++;
            }
          } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
            failed++;
          }
          break;
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 FIX SUMMARY:');
    console.log('='.repeat(60));
    console.log(`✅ Fixed: ${fixed} issues`);
    console.log(`❌ Failed: ${failed} issues`);

    if (fixed === issues.length) {
      console.log('\n🎉 All issues have been fixed!');
      console.log('   Users are now properly integrated with Supabase Auth.');

      // Clean up issues file
      fs.unlinkSync('verify-auth-issues.json');
      console.log('   Cleaned up issues file.');
    } else if (failed > 0) {
      console.log(`\n⚠️  Some issues could not be fixed automatically.`);
      console.log('   Review the output above for manual intervention.');
    }

    console.log('\n💡 Next steps:');
    console.log('   1. Run verify-auth-integration.js again to confirm fixes');
    console.log('   2. Send password reset emails to any newly created users');
    console.log('   3. Test login for affected users');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the fix
fixAuthIntegration();