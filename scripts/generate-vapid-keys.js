/**
 * Generate VAPID Keys for Web Push Notifications
 *
 * Run this script once to generate keys, then add them to your .env.local:
 * VAPID_PUBLIC_KEY=<public_key>
 * VAPID_PRIVATE_KEY=<private_key>
 * VAPID_SUBJECT=mailto:your-email@example.com
 */

const webpush = require('web-push');

console.log('🔑 Generating VAPID keys for Web Push notifications...\n');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('✅ VAPID keys generated successfully!\n');
console.log('📋 Add these to your .env.local file:\n');
console.log('─────────────────────────────────────────────────────────────');
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log(`VAPID_SUBJECT=mailto:noreply@blipee.io`);
console.log('─────────────────────────────────────────────────────────────\n');
console.log('⚠️  IMPORTANT: Keep your VAPID_PRIVATE_KEY secret!');
console.log('   Never commit it to version control.\n');
