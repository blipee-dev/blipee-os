// Test login script
async function testLogin() {
  try {
    console.log('Testing login for pedro@blipee.com...');
    
    const response = await fetch('http://localhost:3001/api/auth/signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'pedro@blipee.com',
        password: 'password123', // Use the actual password you set
      }),
    });

    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ Login successful!');
      console.log('User:', data.data.user);
      console.log('Session:', data.data.session);
    } else {
      console.log('❌ Login failed:', data.error);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testLogin();