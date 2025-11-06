# 🌍 Fix: Páginas de Marketing Mostrando Chaves de Tradução

## 🐛 Problema

As páginas de marketing (about, company, careers, contact) em **blipee.app** estavam mostrando **chaves de tradução** (ex: `marketing.about.hero.title`) ao invés do texto traduzido.

## 🔍 Diagnóstico

### Código Correto ✅
As páginas Next.js estavam implementadas **corretamente**:

```typescript
// src/app/about/page.tsx
const t = useTranslations('marketing.about')
{t('hero.title')}  // Esperado: "A Construir os Negócios Sustentáveis"
{t('hero.titleHighlight')}  // Esperado: "de Amanhã Hoje"
```

### Arquivos de Tradução Existiam ✅
Os arquivos JSON estavam criados:

```
/blipee-v2/apps/blipee-v2/src/i18n/locales/
├── pt-PT/
│   ├── marketing.json    ✅ Existe
│   └── landing.json      ✅ Existe
├── en-US/
│   ├── marketing.json    ✅ Existe
│   └── landing.json      ✅ Existe
└── es-ES/
    ├── marketing.json    ✅ Existe
    └── landing.json      ✅ Existe
```

### Problema Real ❌
O **next-intl** está configurado para carregar de:

```typescript
// src/i18n.ts
const messages = (await import(`./messages/${locale}.json`)).default;
//                                 ^^^^^^^^^^^^^^^^^^^^^^
//                                 Carrega de /src/messages/
```

**Mas** os arquivos consolidados em `/src/messages/{locale}.json` **NÃO TINHAM** a chave `marketing`:

```json
// ❌ ANTES - src/messages/pt.json
{
  "common": {...},
  "dashboard": {...},
  "auth": {...}
  // ❌ "marketing" NÃO EXISTE!
}
```

Resultado: `useTranslations('marketing.about')` não encontrava traduções → exibia as chaves.

---

## ✅ Solução

### 1. Script de Consolidação

Criado `/scripts/consolidate-marketing-translations.js` que:

1. **Lê** os arquivos de tradução separados:
   - `/blipee-v2/apps/blipee-v2/src/i18n/locales/{locale}/marketing.json`
   - `/blipee-v2/apps/blipee-v2/src/i18n/locales/{locale}/landing.json`

2. **Mescla** no arquivo consolidado:
   - `/src/messages/{locale}.json`

3. **Preserva** todas as traduções existentes

### 2. Execução

```bash
node scripts/consolidate-marketing-translations.js
```

**Saída:**
```
🔄 Consolidating marketing translations...

📝 Processing pt (pt-PT)...
  ✅ Loaded existing pt.json
  ✅ Merged marketing.json
  ✅ Merged landing.json
  ✅ Wrote consolidated pt.json

📝 Processing en (en-US)...
  ✅ Loaded existing en.json
  ✅ Merged marketing.json
  ✅ Merged landing.json
  ✅ Wrote consolidated en.json

📝 Processing es (es-ES)...
  ✅ Loaded existing es.json
  ✅ Merged marketing.json
  ✅ Merged landing.json
  ✅ Wrote consolidated es.json

✅ Consolidation complete!
```

### 3. Resultado

```json
// ✅ DEPOIS - src/messages/pt.json
{
  "common": {...},
  "dashboard": {...},
  "auth": {...},
  "marketing": {          // ✅ ADICIONADO!
    "about": {
      "hero": {
        "title": "A Construir os Negócios Sustentáveis",
        "titleHighlight": "de Amanhã Hoje",
        "subtitle": "A nossa missão é tornar..."
      },
      ...
    },
    "company": {...},
    "careers": {...},
    "contact": {...}
  },
  "landing": {            // ✅ ADICIONADO!
    "hero": {...},
    "agents": {...},
    ...
  }
}
```

---

## 🧪 Verificação

### Teste Manual

```bash
# Verificar se traduções foram adicionadas
cat src/messages/pt.json | jq -r '.marketing.about.hero.title'
# Output: "A Construir os Negócios Sustentáveis" ✅

cat src/messages/en.json | jq -r '.marketing.about.hero.title'
# Output: "Building Tomorrow's Sustainable" ✅

cat src/messages/es.json | jq -r '.marketing.about.hero.title'
# Output: "Construyendo los Negocios Sostenibles" ✅
```

### Páginas Afetadas (Agora Funcionando)

- ✅ `/about` - About Us page
- ✅ `/company` - Company page
- ✅ `/careers` - Careers page
- ✅ `/contact` - Contact page
- ✅ `/` - Landing page

---

## 📋 Manutenção Futura

### Quando Adicionar Novas Traduções de Marketing

1. **Editar** os arquivos fonte:
   ```
   /blipee-v2/apps/blipee-v2/src/i18n/locales/pt-PT/marketing.json
   /blipee-v2/apps/blipee-v2/src/i18n/locales/en-US/marketing.json
   /blipee-v2/apps/blipee-v2/src/i18n/locales/es-ES/marketing.json
   ```

2. **Executar** o script de consolidação:
   ```bash
   node scripts/consolidate-marketing-translations.js
   ```

3. **Testar** localmente:
   ```bash
   npm run dev
   # Abrir http://localhost:3000/about
   # Verificar se traduções aparecem
   ```

4. **Commit** ambos os arquivos:
   ```bash
   git add blipee-v2/apps/blipee-v2/src/i18n/locales/*/marketing.json
   git add src/messages/*.json
   git commit -m "feat: update marketing translations"
   ```

### Automatização (Opcional)

Adicionar ao `package.json`:

```json
{
  "scripts": {
    "i18n:consolidate": "node scripts/consolidate-marketing-translations.js",
    "dev": "npm run i18n:consolidate && next dev",
    "build": "npm run i18n:consolidate && next build"
  }
}
```

Assim, as traduções serão consolidadas automaticamente antes de dev/build.

---

## 🏗️ Arquitetura de Tradução

### Fluxo Atual

```
┌─────────────────────────────────────────┐
│ Arquivos Fonte (por página)             │
├─────────────────────────────────────────┤
│ /blipee-v2/.../locales/pt-PT/          │
│  ├── marketing.json  (about, company)  │
│  ├── landing.json    (landing page)    │
│  ├── dashboard.json  (app dashboard)   │
│  └── common.json     (shared)          │
└─────────────────────────────────────────┘
              │
              ▼
    [consolidate script]
              │
              ▼
┌─────────────────────────────────────────┐
│ Arquivos Consolidados (por idioma)     │
├─────────────────────────────────────────┤
│ /src/messages/                          │
│  ├── pt.json  (todas as traduções PT)  │
│  ├── en.json  (todas as traduções EN)  │
│  └── es.json  (todas as traduções ES)  │
└─────────────────────────────────────────┘
              │
              ▼
    [next-intl carrega]
              │
              ▼
┌─────────────────────────────────────────┐
│ Páginas Next.js                         │
├─────────────────────────────────────────┤
│ useTranslations('marketing.about')     │
│ useTranslations('landing')             │
│ useTranslations('dashboard')           │
└─────────────────────────────────────────┘
```

### Por Que Essa Arquitetura?

**Prós:**
- ✅ **Organização**: Traduções separadas por contexto (marketing, landing, dashboard)
- ✅ **Manutenção**: Fácil encontrar e editar traduções específicas
- ✅ **Next-intl**: Performance otimizada com arquivo único por locale

**Contras:**
- ⚠️ **Passo Extra**: Precisa consolidar antes de usar
- ⚠️ **Sincronização**: Arquivos podem ficar desatualizados se esquecer de rodar script

**Alternativa Futura:**
Migrar para uma única fonte de verdade:
- Usar apenas `/src/messages/{locale}.json`
- Ou usar apenas `/blipee-v2/.../locales/{locale}/` e ajustar i18n.ts

---

## 📝 Resumo

### Problema
```
❌ Páginas mostravam: "marketing.about.hero.title"
```

### Causa
```
❌ /src/messages/pt.json não tinha chave "marketing"
```

### Solução
```
✅ Script consolidou marketing.json → /src/messages/{locale}.json
```

### Resultado
```
✅ Páginas mostram: "A Construir os Negócios Sustentáveis"
```

---

**Data**: 2025-11-06
**Status**: ✅ Resolvido
**Impacto**: Todas as páginas de marketing agora mostram traduções corretas

