const fs = require('fs');
const { execSync } = require('child_process');

const migrationSQL = fs.readFileSync('supabase/migrations/20251013_metric_recommendations.sql', 'utf8');

const command = `PGPASSWORD="MG5faEtcGRvBWkn1" psql -h aws-0-eu-central-1.pooler.supabase.com -p 6543 -U postgres.yrbmmymayojycyszUnis -d postgres -c "${migrationSQL.replace(/"/g, '\\"')}"`;

try {
  const output = execSync(command, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  console.log('✅ Migration applied successfully!');
  console.log(output);
} catch (error) {
  console.error('❌ Migration failed:');
  console.error(error.message);
  if (error.stdout) console.log('STDOUT:', error.stdout);
  if (error.stderr) console.log('STDERR:', error.stderr);
  process.exit(1);
}
