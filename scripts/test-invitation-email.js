#!/usr/bin/env node

// Test script for Gmail invitation emails
// Run with: node scripts/test-invitation-email.js

const nodemailer = require('nodemailer');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Email configuration from your environment
const SMTP_CONFIG = {
  host: process.env.SMTP_SERVER || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || process.env.EMAIL_USER || 'pedro@blipee.com',
    pass: process.env.SMTP_PASSWORD || process.env.EMAIL_PASSWORD || 'dptc xmxt vlwl hvgk'
  }
};

const FROM_EMAIL = process.env.FROM_EMAIL || process.env.EMAIL_FROM || 'no-reply@blipee.com';

// Test email data
const TEST_RECIPIENTS = [
  {
    email: 'test@example.com', // Change this to your test email
    language: 'en',
    name: 'John Doe'
  },
  {
    email: 'test-es@example.com', // Spanish test
    language: 'es',
    name: 'Juan Pérez'
  },
  {
    email: 'test-pt@example.com', // Portuguese test
    language: 'pt',
    name: 'João Silva'
  }
];

// Email templates
const emailTemplates = {
  en: {
    subject: 'Welcome to blipee - Set Your Password',
    greeting: (name) => `Hi ${name},`,
    body: 'You have been invited to join blipee. Click the link below to set your password.',
    button: 'Set Password & Get Started'
  },
  es: {
    subject: 'Bienvenido a blipee - Configura tu Contraseña',
    greeting: (name) => `Hola ${name},`,
    body: 'Has sido invitado a unirte a blipee. Haz clic en el enlace de abajo para configurar tu contraseña.',
    button: 'Configurar Contraseña y Comenzar'
  },
  pt: {
    subject: 'Bem-vindo ao blipee - Defina sua Senha',
    greeting: (name) => `Olá ${name},`,
    body: 'Você foi convidado para juntar-se ao blipee. Clique no link abaixo para definir sua senha.',
    button: 'Definir Senha e Começar'
  }
};

async function sendTestEmail(recipient) {
  const transporter = nodemailer.createTransport(SMTP_CONFIG);
  const template = emailTemplates[recipient.language];

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Test Email</title>
    </head>
    <body style="font-family: Arial, sans-serif; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">blipee</h1>
        <p>${template.greeting(recipient.name)}</p>
        <p>${template.body}</p>
        <div style="margin: 30px 0;">
          <a href="http://localhost:3000/set-password" style="background: linear-gradient(135deg, rgb(236, 72, 153), rgb(147, 51, 234)); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">
            ${template.button}
          </a>
        </div>
        <p style="color: #666; font-size: 12px;">This is a test email from blipee</p>
      </div>
    </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from: FROM_EMAIL,
      to: recipient.email,
      subject: template.subject,
      html: html
    });

    console.log(`✅ Email sent to ${recipient.email} (${recipient.language}):`, info.messageId);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send to ${recipient.email}:`, error.message);
    return false;
  }
}

async function testEmailConfiguration() {
  console.log('🚀 Testing Gmail Email Configuration...\n');
  console.log('Configuration:');
  console.log('  SMTP Server:', SMTP_CONFIG.host);
  console.log('  SMTP Port:', SMTP_CONFIG.port);
  console.log('  SMTP User:', SMTP_CONFIG.auth.user);
  console.log('  From Email:', FROM_EMAIL);
  console.log('');

  // Test SMTP connection
  const transporter = nodemailer.createTransport(SMTP_CONFIG);

  try {
    await transporter.verify();
    console.log('✅ SMTP connection successful!\n');
  } catch (error) {
    console.error('❌ SMTP connection failed:', error.message);
    console.log('\nPlease check your Gmail configuration:');
    console.log('1. Make sure 2-factor authentication is enabled');
    console.log('2. Generate an app-specific password');
    console.log('3. Update .env.local with correct credentials');
    process.exit(1);
  }

  // Send test emails
  console.log('Sending test emails...\n');

  // Update the test email address to your actual email
  const testEmail = 'pedro@blipee.com'; // Testing with your email

  if (testEmail === 'your-test-email@example.com') {
    console.log('⚠️  Please update the test email address in the script!');
    console.log('   Edit scripts/test-invitation-email.js and change the testEmail variable.\n');
    process.exit(1);
  }

  // Send a test email in each language
  for (const lang of ['en', 'es', 'pt']) {
    await sendTestEmail({
      email: testEmail,
      language: lang,
      name: 'Test User'
    });
  }

  console.log('\n✨ Test complete!');
}

// Run the test
testEmailConfiguration().catch(console.error);