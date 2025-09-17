import nodemailer from 'nodemailer';

// Create reusable transporter using Gmail
const createGmailTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_SERVER || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || process.env.EMAIL_USER || 'pedro@blipee.com',
      pass: process.env.SMTP_PASSWORD || process.env.EMAIL_PASSWORD || 'dptc xmxt vlwl hvgk'
    }
  });
};

interface InvitationEmailData {
  email: string;
  userName: string;
  organizationName: string;
  inviterName: string;
  role: string;
  confirmationUrl: string;
  language?: 'en' | 'es' | 'pt';
}

// Email templates for each language
const emailTemplates = {
  en: {
    subject: 'Welcome to blipee - Set Your Password',
    title: 'Welcome to blipee',
    greeting: (name: string) => `Hi ${name},`,
    invited: (inviter: string, org: string) => `${inviter} has invited you to join <strong>${org}</strong>`,
    subtitle: 'has invited you to collaborate on sustainability management with AI-powered intelligence.',
    accessDetails: 'Your Access Details',
    emailLabel: 'Email:',
    roleLabel: 'Role:',
    organizationLabel: 'Organization:',
    buttonText: 'Set Password & Get Started',
    linkExpires: 'This link expires in 24 hours',
    whatYouCanDo: "What you'll be able to do:",
    features: [
      'Chat with AI for sustainability insights',
      'Track and manage emissions data',
      'Generate compliance reports automatically',
      'Get predictive analytics and recommendations'
    ],
    needHelp: 'Need help? Contact us at',
    copyright: '© 2025 blipee. All rights reserved.'
  },
  es: {
    subject: 'Bienvenido a blipee - Configura tu Contraseña',
    title: 'Bienvenido a blipee',
    greeting: (name: string) => `Hola ${name},`,
    invited: (inviter: string, org: string) => `${inviter} te ha invitado a unirte a <strong>${org}</strong>`,
    subtitle: 'te ha invitado a colaborar en la gestión de sostenibilidad con inteligencia impulsada por IA.',
    accessDetails: 'Tus Detalles de Acceso',
    emailLabel: 'Correo:',
    roleLabel: 'Rol:',
    organizationLabel: 'Organización:',
    buttonText: 'Configurar Contraseña y Comenzar',
    linkExpires: 'Este enlace expira en 24 horas',
    whatYouCanDo: 'Lo que podrás hacer:',
    features: [
      'Chatear con IA para obtener información sobre sostenibilidad',
      'Rastrear y gestionar datos de emisiones',
      'Generar informes de cumplimiento automáticamente',
      'Obtener análisis predictivos y recomendaciones'
    ],
    needHelp: '¿Necesitas ayuda? Contáctanos en',
    copyright: '© 2025 blipee. Todos los derechos reservados.'
  },
  pt: {
    subject: 'Bem-vindo ao blipee - Defina sua Senha',
    title: 'Bem-vindo ao blipee',
    greeting: (name: string) => `Olá ${name},`,
    invited: (inviter: string, org: string) => `${inviter} convidou você para juntar-se a <strong>${org}</strong>`,
    subtitle: 'convidou você para colaborar na gestão de sustentabilidade com inteligência alimentada por IA.',
    accessDetails: 'Seus Detalhes de Acesso',
    emailLabel: 'Email:',
    roleLabel: 'Função:',
    organizationLabel: 'Organização:',
    buttonText: 'Definir Senha e Começar',
    linkExpires: 'Este link expira em 24 horas',
    whatYouCanDo: 'O que você poderá fazer:',
    features: [
      'Conversar com IA para insights de sustentabilidade',
      'Rastrear e gerenciar dados de emissões',
      'Gerar relatórios de conformidade automaticamente',
      'Obter análises preditivas e recomendações'
    ],
    needHelp: 'Precisa de ajuda? Entre em contato em',
    copyright: '© 2025 blipee. Todos os direitos reservados.'
  }
};

function generateEmailHtml(data: InvitationEmailData): string {
  const lang = data.language || 'en';
  const t = emailTemplates[lang];

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff;">
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 48px 24px;">

    <!-- Clean Logo -->
    <div style="text-align: center; margin-bottom: 48px;">
      <div style="display: inline-flex; align-items: center;">
        <!-- Icon container with gradient border -->
        <div style="width: 40px; height: 40px; padding: 2px; border-radius: 12px; background: linear-gradient(to bottom right, rgb(236, 72, 153), rgb(147, 51, 234));">
          <div style="width: 100%; height: 100%; background-color: rgba(255, 255, 255, 0.95); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
            <!-- Home icon with gradient -->
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="homeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:rgb(236, 72, 153)" />
                  <stop offset="100%" style="stop-color:rgb(147, 51, 234)" />
                </linearGradient>
              </defs>
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="url(#homeGradient)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
              <polyline points="9 22 9 12 15 12 15 22" stroke="url(#homeGradient)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            </svg>
          </div>
        </div>
        <!-- Text logo with gradient -->
        <span style="margin-left: 12px; font-size: 24px; font-weight: 400; background: linear-gradient(to right, rgb(236, 72, 153), rgb(147, 51, 234)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; color: rgb(236, 72, 153);">blipee</span>
      </div>
    </div>

    <!-- Simple welcome -->
    <h1 style="color: #111111; font-size: 24px; font-weight: 600; margin: 0 0 16px 0; text-align: center;">
      ${t.title}
    </h1>

    <p style="color: #616161; font-size: 16px; line-height: 24px; margin: 0 0 32px 0; text-align: center;">
      ${t.invited(data.inviterName, data.organizationName)}
    </p>

    <!-- Clean info card -->
    <div style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; margin: 0 0 32px 0;">
      <p style="color: #111111; font-size: 15px; margin: 0 0 16px 0;">
        ${t.greeting(data.userName)}
      </p>
      <p style="color: #616161; font-size: 15px; line-height: 22px; margin: 0;">
        ${data.inviterName} ${t.subtitle}
      </p>
    </div>

    <!-- Simple access details -->
    <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin: 0 0 32px 0;">
      <p style="color: #111111; font-size: 14px; font-weight: 600; margin: 0 0 12px 0;">${t.accessDetails}</p>
      <table style="width: 100%; font-size: 14px;">
        <tr>
          <td style="color: #616161; padding: 4px 0;">${t.emailLabel}</td>
          <td style="color: #111111; padding: 4px 0; text-align: right;">${data.email}</td>
        </tr>
        <tr>
          <td style="color: #616161; padding: 4px 0;">${t.roleLabel}</td>
          <td style="color: #111111; padding: 4px 0; text-align: right;">${data.role}</td>
        </tr>
        <tr>
          <td style="color: #616161; padding: 4px 0;">${t.organizationLabel}</td>
          <td style="color: #111111; padding: 4px 0; text-align: right;">${data.organizationName}</td>
        </tr>
      </table>
    </div>

    <!-- Clean CTA button -->
    <div style="text-align: center; margin: 0 0 24px 0;">
      <a href="${data.confirmationUrl}" style="display: inline-block; background: linear-gradient(135deg, rgb(236, 72, 153), rgb(147, 51, 234)); color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 500; font-size: 15px;">
        ${t.buttonText}
      </a>
    </div>

    <p style="color: #9ca3af; font-size: 13px; text-align: center; margin: 0 0 40px 0;">
      ${t.linkExpires}
    </p>

    <!-- What you can do - simplified -->
    <div style="border-top: 1px solid #e5e7eb; padding-top: 32px; margin: 0 0 32px 0;">
      <p style="color: #111111; font-size: 15px; font-weight: 600; margin: 0 0 16px 0;">
        ${t.whatYouCanDo}
      </p>
      <ul style="color: #616161; font-size: 14px; line-height: 22px; margin: 0; padding-left: 20px;">
        ${t.features.map(feature => `<li style="margin-bottom: 8px;">${feature}</li>`).join('')}
      </ul>
    </div>

    <!-- Simple footer -->
    <div style="text-align: center; padding-top: 24px; border-top: 1px solid #e5e7eb;">
      <p style="color: #9ca3af; font-size: 13px; margin: 0 0 16px 0;">
        ${t.needHelp} <a href="mailto:support@blipee.com" style="color: rgb(147, 51, 234); text-decoration: none;">support@blipee.com</a>
      </p>

      <!-- Small footer logo -->
      <div style="display: inline-flex; align-items: center; opacity: 0.6;">
        <div style="width: 24px; height: 24px; padding: 1px; border-radius: 6px; background: linear-gradient(to bottom right, rgb(236, 72, 153), rgb(147, 51, 234));">
          <div style="width: 100%; height: 100%; background-color: rgba(255, 255, 255, 0.95); border-radius: 5px; display: flex; align-items: center; justify-content: center;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="footerHomeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:rgb(236, 72, 153)" />
                  <stop offset="100%" style="stop-color:rgb(147, 51, 234)" />
                </linearGradient>
              </defs>
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="url(#footerHomeGradient)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
              <polyline points="9 22 9 12 15 12 15 22" stroke="url(#footerHomeGradient)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            </svg>
          </div>
        </div>
        <span style="margin-left: 6px; font-size: 12px; background: linear-gradient(to right, rgb(236, 72, 153), rgb(147, 51, 234)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; color: rgb(236, 72, 153);">blipee</span>
      </div>

      <p style="color: #cbd5e1; font-size: 11px; margin: 12px 0 0 0;">
        ${t.copyright}
      </p>
    </div>

  </div>
</body>
</html>`;
}

export async function sendInvitationEmailViaGmail(data: InvitationEmailData) {
  const lang = data.language || 'en';
  const t = emailTemplates[lang];

  // Create transporter
  const transporter = createGmailTransporter();

  try {
    // Send email
    const info = await transporter.sendMail({
      from: process.env.FROM_EMAIL || process.env.EMAIL_FROM || '"blipee" <no-reply@blipee.com>', // sender address
      to: data.email, // recipient
      subject: t.subject, // Subject line
      html: generateEmailHtml(data), // html body
    });

    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

// Function to detect language from browser headers
export function detectLanguageFromHeaders(headers: Headers): 'en' | 'es' | 'pt' {
  const acceptLanguage = headers.get('accept-language') || '';

  // Parse Accept-Language header (e.g., "es-ES,es;q=0.9,en;q=0.8")
  const languages = acceptLanguage
    .split(',')
    .map(lang => lang.split(';')[0].trim().toLowerCase());

  // Check for Spanish
  if (languages.some(lang => lang.startsWith('es'))) return 'es';

  // Check for Portuguese
  if (languages.some(lang => lang.startsWith('pt'))) return 'pt';

  // Default to English
  return 'en';
}