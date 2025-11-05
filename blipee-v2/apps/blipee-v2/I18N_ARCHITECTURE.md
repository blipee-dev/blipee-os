# Arquitetura de Internacionalização (i18n) - blipee v2

## Idiomas Suportados

- 🇺🇸 **en-US** - Inglês (Estados Unidos) - Default
- 🇪🇸 **es-ES** - Espanhol (Europeu)
- 🇵🇹 **pt-PT** - Português (Europeu)

## 1. Estrutura de Arquivos

```
src/
├── i18n/
│   ├── locales/
│   │   ├── en-US/
│   │   │   ├── common.json
│   │   │   ├── auth.json
│   │   │   ├── dashboard.json
│   │   │   ├── emails.json
│   │   │   └── errors.json
│   │   ├── es-ES/
│   │   │   ├── common.json
│   │   │   ├── auth.json
│   │   │   └── ...
│   │   └── pt-PT/
│   │       ├── common.json
│   │       ├── auth.json
│   │       └── ...
│   ├── config.ts          # Configuração i18n
│   ├── server.ts          # Utils para Server Components/Actions
│   ├── client.ts          # Utils para Client Components
│   └── types.ts           # TypeScript types
│
├── lib/
│   └── email/
│       ├── mailer.ts
│       ├── templates/
│       │   ├── index.ts
│       │   ├── en-US.ts   # English templates
│       │   ├── es-ES.ts   # Spanish templates
│       │   └── pt-PT.ts   # Portuguese templates
│       └── utils.ts       # Email i18n helpers
│
└── middleware.ts          # Detecção automática de idioma
```

## 2. Sistema de Email i18n

### 2.1 Detecção de Idioma para Emails

```typescript
// src/lib/email/utils.ts
export function getUserLocale(user: User): Locale {
  // Priority:
  // 1. User preference (from database)
  // 2. Accept-Language header (from signup)
  // 3. Country from IP (opcional)
  // 4. Default (en-US)

  return user.preferences?.locale
    || user.metadata?.signup_locale
    || 'en-US'
}
```

### 2.2 Template Selector

```typescript
// src/lib/email/templates/index.ts
import * as enUS from './en-US'
import * as esES from './es-ES'
import * as ptPT from './pt-PT'

const templates = {
  'en-US': enUS,
  'es-ES': esES,
  'pt-PT': ptPT,
}

export function getEmailTemplate(
  type: EmailType,
  locale: Locale,
  data: TemplateData
): string {
  const localeTemplates = templates[locale] || templates['en-US']

  switch (type) {
    case 'email_confirmation':
      return localeTemplates.emailConfirmation(data)
    case 'password_reset':
      return localeTemplates.passwordReset(data)
    case 'magic_link':
      return localeTemplates.magicLink(data)
    case 'user_invitation':
      return localeTemplates.userInvitation(data)
    default:
      throw new Error(`Unknown email type: ${type}`)
  }
}
```

### 2.3 Exemplo de Template Localizado

```typescript
// src/lib/email/templates/en-US.ts
export function emailConfirmation(data: EmailConfirmationData): string {
  return `
    <!DOCTYPE html>
    <html lang="en-US">
      <!-- ... -->
      <h1>Confirm Your Email</h1>
      <p>Click the button below to confirm your email address...</p>
      <a href="${data.confirmationUrl}">Confirm Email</a>
      <p>This link expires in 48 hours.</p>
      <!-- ... -->
    </html>
  `
}

// src/lib/email/templates/es-ES.ts
export function emailConfirmation(data: EmailConfirmationData): string {
  return `
    <!DOCTYPE html>
    <html lang="es-ES">
      <!-- ... -->
      <h1>Confirma tu Correo Electrónico</h1>
      <p>Haz clic en el botón de abajo para confirmar tu dirección de correo...</p>
      <a href="${data.confirmationUrl}">Confirmar Correo</a>
      <p>Este enlace caduca en 48 horas.</p>
      <!-- ... -->
    </html>
  `
}

// src/lib/email/templates/pt-PT.ts
export function emailConfirmation(data: EmailConfirmationData): string {
  return `
    <!DOCTYPE html>
    <html lang="pt-PT">
      <!-- ... -->
      <h1>Confirme o Seu Email</h1>
      <p>Clique no botão abaixo para confirmar o seu endereço de email...</p>
      <a href="${data.confirmationUrl}">Confirmar Email</a>
      <p>Esta ligação expira em 48 horas.</p>
      <!-- ... -->
    </html>
  `
}
```

## 3. Sistema de App i18n (next-intl recomendado)

### 3.1 Instalação

```bash
npm install next-intl
```

### 3.2 Configuração

```typescript
// src/i18n/config.ts
export const locales = ['en-US', 'es-ES', 'pt-PT'] as const
export type Locale = typeof locales[number]

export const defaultLocale: Locale = 'en-US'

export const localeNames: Record<Locale, string> = {
  'en-US': 'English (US)',
  'es-ES': 'Español (Europa)',
  'pt-PT': 'Português (Europa)',
}
```

### 3.3 Middleware para Detecção Automática

```typescript
// src/middleware.ts
import createMiddleware from 'next-intl/middleware'
import { locales, defaultLocale } from './i18n/config'

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed', // Não prefixar default locale
})

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
}
```

### 3.4 Estrutura de Traduções

```json
// src/i18n/locales/en-US/auth.json
{
  "signUp": {
    "title": "Create Your Account",
    "nameLabel": "Full Name",
    "emailLabel": "Email Address",
    "passwordLabel": "Password",
    "submitButton": "Sign Up",
    "successMessage": "Account created! Check your email to confirm."
  },
  "signIn": {
    "title": "Welcome Back",
    "emailLabel": "Email Address",
    "passwordLabel": "Password",
    "submitButton": "Sign In",
    "forgotPassword": "Forgot password?"
  }
}
```

```json
// src/i18n/locales/es-ES/auth.json
{
  "signUp": {
    "title": "Crea Tu Cuenta",
    "nameLabel": "Nombre Completo",
    "emailLabel": "Correo Electrónico",
    "passwordLabel": "Contraseña",
    "submitButton": "Registrarse",
    "successMessage": "¡Cuenta creada! Revisa tu correo para confirmar."
  },
  "signIn": {
    "title": "Bienvenido de Nuevo",
    "emailLabel": "Correo Electrónico",
    "passwordLabel": "Contraseña",
    "submitButton": "Iniciar Sesión",
    "forgotPassword": "¿Olvidaste tu contraseña?"
  }
}
```

## 4. Uso na Aplicação

### 4.1 Server Components

```typescript
// app/[locale]/auth/signin/page.tsx
import { useTranslations } from 'next-intl'

export default function SignInPage() {
  const t = useTranslations('auth.signIn')

  return (
    <div>
      <h1>{t('title')}</h1>
      <form>
        <label>{t('emailLabel')}</label>
        <input type="email" />

        <label>{t('passwordLabel')}</label>
        <input type="password" />

        <button>{t('submitButton')}</button>
      </form>
    </div>
  )
}
```

### 4.2 Server Actions

```typescript
// src/app/actions/v2/auth.ts
import { getTranslations } from 'next-intl/server'

export async function signUp(formData: FormData) {
  const t = await getTranslations('auth.signUp')

  // ... validation ...

  const { token } = await storeToken(email, 'email_confirmation')

  // Get user's locale
  const locale = await getUserLocaleFromRequest() // Helper function

  // Send localized email
  const emailTemplate = getEmailTemplate(
    'email_confirmation',
    locale,
    { name, confirmationUrl }
  )

  await sendEmail({
    to: email,
    subject: t('emailSubject'),
    html: emailTemplate,
  })

  return {
    success: true,
    message: t('successMessage')
  }
}
```

### 4.3 Client Components

```typescript
'use client'

import { useTranslations } from 'next-intl'

export function LanguageSwitcher() {
  const t = useTranslations('common')

  return (
    <select>
      <option value="en-US">🇺🇸 English (US)</option>
      <option value="es-ES">🇪🇸 Español (Europa)</option>
      <option value="pt-PT">🇵🇹 Português (Europa)</option>
    </select>
  )
}
```

## 5. Database Schema para Preferências

```sql
-- Adicionar coluna de locale nas tabelas relevantes
ALTER TABLE user_profiles
ADD COLUMN preferred_locale VARCHAR(10) DEFAULT 'en-US';

-- Adicionar índice para performance
CREATE INDEX idx_user_profiles_locale ON user_profiles(preferred_locale);

-- Adicionar coluna de locale de signup em user_metadata
-- Já existe como JSONB, adicionar via application:
-- user_metadata.signup_locale = 'en-US'
```

## 6. Prioridades de Implementação

### Fase 1: Emails (CRÍTICO - fazer agora)
1. ✅ Criar estrutura de templates por idioma
2. ✅ Implementar função `getEmailTemplate()`
3. ✅ Atualizar Server Actions para passar locale
4. ✅ Adicionar locale em user_metadata no signup

### Fase 2: Páginas Públicas (AUTH)
1. Instalar next-intl
2. Configurar middleware
3. Traduzir páginas de autenticação (signup, signin, reset)
4. Adicionar language switcher

### Fase 3: Dashboard
1. Traduzir componentes do dashboard
2. Traduzir mensagens de erro
3. Traduzir tooltips e help texts

### Fase 4: Funcionalidades Avançadas
1. Detecção automática via IP/geolocation
2. Formatação de datas/números por locale
3. RTL support (se necessário no futuro)

## 7. Considerações Técnicas

### Vantagens desta Abordagem:
- ✅ **Type-safe**: TypeScript com auto-complete
- ✅ **Performance**: Apenas o idioma necessário é carregado
- ✅ **Escalável**: Fácil adicionar novos idiomas
- ✅ **SEO-friendly**: URLs localizadas (/es-ES/dashboard)
- ✅ **SSR-compatible**: Funciona com Server Components
- ✅ **Emails robustos**: Templates separados, fácil manter

### Alternativas Consideradas:
- **i18next**: Mais complexo, overhead desnecessário
- **react-intl**: Focado em client-side, não ideal para Next.js App Router
- **Custom solution**: Reinventar a roda, não vale a pena

## 8. Testes

```typescript
// tests/i18n/email-templates.test.ts
describe('Email Templates i18n', () => {
  test('should return English template for en-US', () => {
    const html = getEmailTemplate('email_confirmation', 'en-US', mockData)
    expect(html).toContain('Confirm Your Email')
  })

  test('should return Spanish template for es-ES', () => {
    const html = getEmailTemplate('email_confirmation', 'es-ES', mockData)
    expect(html).toContain('Confirma tu Correo')
  })

  test('should fallback to en-US for unsupported locale', () => {
    const html = getEmailTemplate('email_confirmation', 'fr-FR', mockData)
    expect(html).toContain('Confirm Your Email')
  })
})
```

## 9. Documentação para Tradutores

Criar um guia simples para adicionar novos idiomas:

```markdown
# Como Adicionar um Novo Idioma

1. Criar pasta `src/i18n/locales/[novo-locale]/`
2. Copiar todos os arquivos JSON de `en-US/`
3. Traduzir todos os textos
4. Criar `src/lib/email/templates/[novo-locale].ts`
5. Adicionar locale em `src/i18n/config.ts`
6. Testar com `npm run test:i18n`
```

---

## Resumo

Esta arquitetura permite:
- ✅ **Emails localizados** desde o início
- ✅ **Aplicação multi-idioma** escalável
- ✅ **Manutenção fácil** de traduções
- ✅ **Performance otimizada**
- ✅ **Type-safety** com TypeScript
- ✅ **SEO-friendly** com URLs localizadas
