/**
 * Direct Email Test
 * Tests the email system directly
 */

async function testEmailConnection() {
  console.log('🧪 Testing Email Connection\n')

  try {
    // Test SMTP connection
    const response = await fetch('http://localhost:3005/api/test-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: 'pedro@blipee.com',
        subject: 'Test Email from Blipee',
        test: true
      })
    })

    const result = await response.json()
    console.log('Response:', result)

    if (result.success) {
      console.log('\n✅ Email system is working!')
      console.log('Check pedro@blipee.com inbox for test email')
    } else {
      console.log('\n❌ Email system failed:', result.error)
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testEmailConnection()
