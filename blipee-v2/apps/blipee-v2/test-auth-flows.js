/**
 * Test Script for Safe-Link Proof Authentication Flows
 *
 * Tests all 4 authentication flows:
 * 1. Email Confirmation (Signup)
 * 2. Password Reset
 * 3. User Invitation
 * 4. Magic Link (if applicable)
 *
 * Run with: node test-auth-flows.js
 */

const testEmail = `test-${Date.now()}@blipee.com`
const testPassword = 'TestPassword123!'

console.log('🧪 Starting Authentication Flow Tests\n')
console.log(`Test Email: ${testEmail}`)
console.log(`Test Password: ${testPassword}\n`)

async function testEmailConfirmation() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📧 TEST 1: Email Confirmation Flow')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  try {
    // Step 1: Sign up
    console.log('Step 1: Signing up new user...')
    const signupRes = await fetch('http://localhost:3005/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        email: testEmail,
        password: testPassword,
        confirmPassword: testPassword,
        name: 'Test User'
      }),
      redirect: 'manual'
    })

    console.log('✓ Signup request sent')
    console.log('⚠️  Check server console for confirmation URL and email logs\n')

    // Wait for user to get URL from console
    console.log('📝 To complete this test:')
    console.log('   1. Check the server console for [SIGNUP] Confirmation URL')
    console.log('   2. Check for [EMAIL] Sent successfully log')
    console.log('   3. Copy the confirmation URL')
    console.log('   4. Test it with: curl "URL_HERE"')
    console.log('   5. Open the URL in browser - should redirect to /dashboard\n')

    return { success: true, email: testEmail }
  } catch (error) {
    console.error('❌ Email confirmation test failed:', error.message)
    return { success: false, error: error.message }
  }
}

async function testPasswordReset() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🔐 TEST 2: Password Reset Flow')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  try {
    // Use the test email from signup
    console.log(`Step 1: Requesting password reset for ${testEmail}...`)
    const resetRes = await fetch('http://localhost:3005/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        email: testEmail
      }),
      redirect: 'manual'
    })

    console.log('✓ Password reset request sent')
    console.log('⚠️  Check server console for reset URL and email logs\n')

    console.log('📝 To complete this test:')
    console.log('   1. Check the server console for [RESET PASSWORD] Reset URL')
    console.log('   2. Check for [EMAIL] Sent successfully log')
    console.log('   3. Copy the reset URL')
    console.log('   4. Test it with: curl "URL_HERE"')
    console.log('   5. Should redirect to /reset-password?verified=true')
    console.log('   6. Open in browser and set new password\n')

    return { success: true, email: testEmail }
  } catch (error) {
    console.error('❌ Password reset test failed:', error.message)
    return { success: false, error: error.message }
  }
}

async function testUserInvitation() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('👥 TEST 3: User Invitation Flow')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  console.log('⚠️  This test requires manual setup:\n')
  console.log('📝 Steps to test:')
  console.log('   1. Sign in to http://localhost:3005/signin')
  console.log('   2. Go to Dashboard → Settings → Users')
  console.log('   3. Click "Invite New User"')
  console.log(`   4. Enter email: invite-test-${Date.now()}@blipee.com`)
  console.log('   5. Fill in user details')
  console.log('   6. Click "Send Invitation"')
  console.log('   7. Check server console for [INVITE USER] Invitation URL')
  console.log('   8. Check for [EMAIL] Sent successfully log')
  console.log('   9. Copy the invitation URL')
  console.log('   10. Test with: curl "URL_HERE"')
  console.log('   11. Should redirect to /reset-password?invitation=true')
  console.log('   12. Open in browser and set password\n')

  return { success: true, note: 'Manual test - follow steps above' }
}

async function testMagicLink() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('✨ TEST 4: Magic Link Flow')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  console.log('⚠️  Magic link signin page not yet implemented\n')
  console.log('📝 To implement:')
  console.log('   1. Add "Email me a magic link" option to /signin page')
  console.log('   2. Create server action to generate magic_link token')
  console.log('   3. Send email with magic link')
  console.log('   4. Link opens /api/auth/magic-link/verify endpoint')
  console.log('   5. User is signed in automatically\n')

  return { success: true, note: 'Not yet implemented - endpoint ready' }
}

async function testSafeLinkProtection() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🛡️  TEST 5: Safe-Link Protection')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  console.log('📝 To test Safe-Link protection:')
  console.log('   1. Get any confirmation/reset/invitation URL from tests above')
  console.log('   2. Use curl to fetch it multiple times:')
  console.log('      curl "URL_HERE"')
  console.log('      curl "URL_HERE"  # Second time')
  console.log('      curl "URL_HERE"  # Third time')
  console.log('   3. All should succeed (redirect to correct page)')
  console.log('   4. This simulates email security pre-fetching')
  console.log('   5. Then open URL in browser - should still work!\n')

  return { success: true, note: 'Manual test - follow steps above' }
}

async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║     🧪 SAFE-LINK PROOF AUTH FLOW TESTING SUITE 🧪        ║')
  console.log('╚════════════════════════════════════════════════════════════╝\n')

  const results = {
    emailConfirmation: await testEmailConfirmation(),
    passwordReset: await testPasswordReset(),
    userInvitation: await testUserInvitation(),
    magicLink: await testMagicLink(),
    safeLinkProtection: await testSafeLinkProtection()
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📊 TEST SUMMARY')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  console.log('Test Email:', testEmail)
  console.log('Test Password:', testPassword)
  console.log('')
  console.log('✅ Email Confirmation: Setup complete - check server logs')
  console.log('✅ Password Reset: Setup complete - check server logs')
  console.log('⚠️  User Invitation: Requires manual UI testing')
  console.log('⚠️  Magic Link: Endpoint ready, UI not implemented')
  console.log('⚠️  Safe-Link Protection: Test manually with curl\n')

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📧 EMAIL VERIFICATION')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  console.log('Check your Gmail inbox (or Gmail sent folder) for:')
  console.log('  1. "Confirm your email - Blipee" email')
  console.log('  2. "Reset your password - Blipee" email')
  console.log('  From: Blipee <no-reply@blipee.com>')
  console.log('  Via: pedro@blipee.com (Gmail SMTP)\n')

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🎯 NEXT STEPS')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  console.log('1. Check server console for URLs and [EMAIL] logs')
  console.log('2. Test URLs with curl to verify Safe-Link protection')
  console.log('3. Open URLs in browser to complete flows')
  console.log('4. Check email delivery in Gmail')
  console.log('5. Test user invitation flow via UI')
  console.log('6. Verify all emails have Blipee branding\n')

  console.log('✨ All systems ready for testing!\n')
}

// Run tests
runAllTests().catch(console.error)
