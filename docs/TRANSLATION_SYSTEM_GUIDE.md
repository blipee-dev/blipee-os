# 🌍 Sistema de Tradução - Páginas de Marketing Blipee

## 📋 Problema Identificado

As páginas de marketing (landing page, about, company, careers, contact) estavam mostrando **chaves de tradução** ao invés do texto traduzido porque:

1. ✅ **Os arquivos de tradução existem** em:
   - `/blipee-v2/apps/blipee-v2/src/i18n/locales/pt-PT/landing.json`
   - `/blipee-v2/apps/blipee-v2/src/i18n/locales/en-US/landing.json`
   - `/blipee-v2/apps/blipee-v2/src/i18n/locales/es-ES/landing.json`

2. ❌ **Mas o HTML estava hard-coded em inglês** sem usar o sistema de tradução

---

## ✅ Solução Implementada

### 1. Sistema de i18n Criado

Criado `/docs/landing-i18n.js` - Um sistema JavaScript de i18n que:

- ✅ Detecta idioma do browser automaticamente
- ✅ Permite seleção manual via seletor de idioma
- ✅ Carrega arquivos JSON de tradução
- ✅ Substitui elementos com `data-i18n` pelas traduções
- ✅ Salva preferência em `localStorage`
- ✅ Suporta 3 idiomas: `pt-PT`, `en-US`, `es-ES`

### 2. Estrutura de Arquivos

```
/home/user/blipee-os/docs/
├── blipee-landing.html          # Landing page atualizada
├── landing-i18n.js              # Sistema de tradução
└── i18n/                        # Arquivos de tradução
    ├── pt-PT/
    │   └── landing.json
    ├── en-US/
    │   └── landing.json
    └── es-ES/
        └── landing.json
```

### 3. Alterações no HTML

#### A. Adicionado script de i18n

```html
<!-- No final, antes do closing </body> -->
<script src="landing-i18n.js"></script>
```

#### B. Adicionado atributos `data-i18n` nos elementos

**Antes:**
```html
<span>8 AI Agents Working 24/7 for Your Sustainability Goals</span>
```

**Depois:**
```html
<span data-i18n="landing.hero.badge">8 AI Agents Working 24/7 for Your Sustainability Goals</span>
```

#### C. Adicionado seletor de idioma na navegação

```html
<ul class="nav-links">
  <li><a href="company.html" data-i18n="landing.nav.company">Company</a></li>
  <li><a href="about.html" data-i18n="landing.nav.about">About</a></li>
  <li><a href="careers.html" data-i18n="landing.nav.careers">Careers</a></li>
  <li><a href="signin.html" class="btn btn-primary" data-i18n="landing.nav.signIn">Sign In</a></li>
  <li><div id="lang-selector-nav"></div></li>  <!-- 🆕 Seletor de idioma -->
</ul>
```

#### D. Inicialização automática

```javascript
// Initialize language selector when i18n is ready
window.addEventListener('DOMContentLoaded', async () => {
  if (window.i18n) {
    await window.i18n.init();
    // Add language selector to navigation
    window.i18n.createLanguageSelector('lang-selector-nav');
  }
});
```

---

## 🎨 Como Funciona

### 1. **Detecção Automática de Idioma**

Ordem de preferência:
1. Parâmetro URL: `?lang=pt-PT`
2. localStorage: `blipee-lang`
3. Idioma do browser (`navigator.language`)
4. Fallback para `en-US`

### 2. **Estrutura das Traduções**

```json
{
  "landing": {
    "nav": {
      "company": "Empresa",
      "about": "Sobre",
      "careers": "Carreiras",
      "signIn": "Iniciar Sessão"
    },
    "hero": {
      "badge": "8 Agentes de IA a Trabalhar 24/7",
      "title": "Deixe de Gerir a Sustentabilidade.",
      "titleHighlight": "Comece a Vivê-la",
      "description": "Enquanto os seus concorrentes...",
      "primaryCta": "Começar",
      "secondaryCta": "Veja o Que Nos Distingue"
    }
  }
}
```

### 3. **Chaves de Tradução**

Formato: `landing.section.elemento`

Exemplos:
- `landing.nav.company` → "Empresa" (PT) / "Company" (EN)
- `landing.hero.title` → "Deixe de Gerir..." (PT) / "Stop Managing..." (EN)
- `landing.agents.chiefOfStaff.name` → "Diretor-Geral ESG" (PT) / "ESG Chief of Staff" (EN)

---

## 🚀 Como Aplicar em Outras Páginas

### Passo 1: Copiar o script i18n

```bash
cp /home/user/blipee-os/docs/landing-i18n.js /caminho/da/sua/pagina/
```

### Passo 2: Adicionar ao HTML

```html
<!-- Antes do closing </body> -->
<script src="landing-i18n.js"></script>
```

### Passo 3: Adicionar data-i18n attributes

Para cada elemento de texto:

```html
<!-- Título -->
<h1 data-i18n="about.hero.title">Building Tomorrow's</h1>

<!-- Parágrafo -->
<p data-i18n="about.story.paragraph1">blipee was born...</p>

<!-- Botão -->
<button data-i18n="about.cta.button">Join Our Mission</button>

<!-- Input placeholder -->
<input type="email" data-i18n-placeholder="contact.form.placeholderEmail">

<!-- Link -->
<a href="#" data-i18n="nav.company">Company</a>
```

### Passo 4: Verificar arquivos de tradução

Os arquivos já existem em:
- `marketing.json` - Para about, company, careers, contact
- `landing.json` - Para landing page

Estrutura:
```
/blipee-v2/apps/blipee-v2/src/i18n/locales/
├── pt-PT/
│   ├── landing.json
│   └── marketing.json
├── en-US/
│   ├── landing.json
│   └── marketing.json
└── es-ES/
    ├── landing.json
    └── marketing.json
```

### Passo 5: Copiar traduções para docs/i18n

```bash
# Para about.html (usa marketing.json)
cp blipee-v2/apps/blipee-v2/src/i18n/locales/*/marketing.json docs/i18n/*/
```

### Passo 6: Atualizar o script para carregar o arquivo correto

No início do script `landing-i18n.js`, modifique para cada página:

```javascript
// Para about.html
const paths = [
  `./i18n/${lang}/marketing.json`,  // 🔄 Mudar de landing.json para marketing.json
  `/i18n/${lang}/marketing.json`
];
```

---

## 📝 Exemplo Completo - About Page

### 1. HTML Atualizado

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>blipee - About Us</title>
</head>
<body>
  <nav>
    <a href="/" class="logo">blipee</a>
    <ul>
      <li><a href="company.html" data-i18n="marketing.nav.company">Company</a></li>
      <li><a href="about.html" data-i18n="marketing.nav.about">About</a></li>
      <li><div id="lang-selector-nav"></div></li>
    </ul>
  </nav>

  <section class="hero">
    <h1>
      <span data-i18n="marketing.about.hero.title">Building Tomorrow's</span>
      <span data-i18n="marketing.about.hero.titleHighlight" class="gradient-text">Sustainable Businesses Today</span>
    </h1>
    <p data-i18n="marketing.about.hero.subtitle">
      Our mission is to make sustainability profitable, measurable...
    </p>
  </section>

  <!-- Adicionar script -->
  <script src="landing-i18n.js"></script>
  <script>
    window.addEventListener('DOMContentLoaded', async () => {
      if (window.i18n) {
        await window.i18n.init();
        window.i18n.createLanguageSelector('lang-selector-nav');
      }
    });
  </script>
</body>
</html>
```

---

## 🧪 Como Testar

### 1. Abrir a página no browser

```bash
cd /home/user/blipee-os/docs
python3 -m http.server 8000
```

Abrir: http://localhost:8000/blipee-landing.html

### 2. Verificar idioma automático

O sistema deve detectar o idioma do browser automaticamente.

### 3. Testar seletor de idioma

Clique nos botões 🇵🇹 🇺🇸 🇪🇸 na navegação.

### 4. Testar via URL

```
http://localhost:8000/blipee-landing.html?lang=pt-PT
http://localhost:8000/blipee-landing.html?lang=en-US
http://localhost:8000/blipee-landing.html?lang=es-ES
```

### 5. Verificar localStorage

No DevTools Console:
```javascript
localStorage.getItem('blipee-lang')  // Deve retornar: "pt-PT", "en-US", ou "es-ES"
```

### 6. Verificar tradução em tempo real

```javascript
// No console
window.i18n.setLanguage('pt-PT')  // Muda para português
window.i18n.setLanguage('en-US')  // Muda para inglês
```

---

## 🎯 Próximos Passos

### 1. Aplicar em todas as páginas de marketing

- [ ] `about.html`
- [ ] `company.html`
- [ ] `careers.html`
- [ ] `contact.html`

### 2. Criar versão do script por tipo de página

```
landing-i18n.js    → Para landing.html (usa landing.json)
marketing-i18n.js  → Para outras (usa marketing.json)
```

### 3. Adicionar mais seções

Atualmente apenas Hero e Nav foram atualizados. Falta:
- [ ] Problem section
- [ ] Agents section (todos os 8 agentes)
- [ ] Features section
- [ ] Impact section
- [ ] CTA section
- [ ] Footer

### 4. Consolidar com sistema principal

Se o Blipee v2 usa Next.js com i18n integrado, considerar:
- Migrar páginas HTML para Next.js
- Usar `next-i18next` ou similar
- Unificar sistema de tradução

---

## 🐛 Troubleshooting

### Problema: Tradução não aparece

**Causa**: Arquivo JSON não foi encontrado

**Solução**:
```bash
# Verificar se arquivos existem
ls /home/user/blipee-os/docs/i18n/pt-PT/landing.json

# Verificar no browser console
# Deve mostrar: "✅ Loaded translations for pt-PT"
```

### Problema: Seletor de idioma não aparece

**Causa**: Container não existe

**Solução**:
```html
<!-- Adicionar container no HTML -->
<div id="lang-selector-nav"></div>

<!-- Verificar se ID está correto no script -->
window.i18n.createLanguageSelector('lang-selector-nav');
```

### Problema: Chave de tradução aparece ao invés do texto

**Causa**: Chave incorreta ou tradução não existe

**Solução**:
```javascript
// No console, verificar se tradução existe:
window.i18n.get('landing.hero.title')  // Deve retornar o texto, não a chave
```

Se retornar a chave, verificar:
1. Chave está correta no `data-i18n`
2. Tradução existe no JSON
3. Estrutura do JSON está correta (nested objects)

---

## 📚 Referências

- **Arquivos de Tradução**: `/blipee-v2/apps/blipee-v2/src/i18n/locales/`
- **Sistema i18n**: `/docs/landing-i18n.js`
- **Exemplo Implementado**: `/docs/blipee-landing.html`

---

## 🎨 Customização do Seletor de Idioma

O seletor de idioma é criado dinamicamente e usa CSS inline. Para customizar:

```javascript
// Em landing-i18n.js, método createLanguageSelector()

// Mudar estilo do container
selector.style.cssText = `
  display: inline-flex;
  gap: 0.5rem;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 0.5rem;
  padding: 0.5rem;
`;

// Mudar estilo dos botões
button.style.cssText = `
  background: ${this.currentLang === lang.code ? 'var(--gradient-primary)' : 'transparent'};
  color: ${this.currentLang === lang.code ? '#ffffff' : 'var(--text-secondary)'};
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
`;
```

---

**Status**: ✅ Sistema implementado e testado
**Data**: 2025-11-06
**Autor**: Claude

