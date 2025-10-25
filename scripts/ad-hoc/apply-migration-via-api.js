const fs = require('fs');
const https = require('https');

const migrationSQL = fs.readFileSync('supabase/migrations/20251013_metric_recommendations.sql', 'utf8');

const options = {
  hostname: 'aws-0-eu-central-1.pooler.supabase.com',
  port: 6543,
  path: '/rest/v1/rpc/exec_sql',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`
  }
};

const data = JSON.stringify({
  query: migrationSQL
});

const req = https.request(options, (res) => {
  let body = '';

  res.on('data', (chunk) => {
    body += chunk;
  });

  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', body);

    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log('✅ Migration applied successfully!');
    } else {
      console.error('❌ Migration failed!');
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error);
  process.exit(1);
});

req.write(data);
req.end();
