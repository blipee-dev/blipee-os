# 🛠️ Comandos Úteis - Blipee V2

Referência rápida de comandos para desenvolvimento e deployment.

---

## 📦 Instalação

```bash
# Instalar todas as dependências
npm install

# Instalar apenas no workspace v2
npm install --workspace blipee-v2

# Adicionar nova dependência
npm install <package> --workspace blipee-v2

# Adicionar dev dependency
npm install -D <package> --workspace blipee-v2
```

---

## 🚀 Development

```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Ou diretamente na pasta
cd apps/blipee-v2
npm run dev

# Com porta específica (padrão é 3005)
npm run dev -- --port 3000

# Com turbo para watch mode otimizado
npm run dev --turbo
```

---

## 🏗️ Build & Deploy

```bash
# Build de produção
npm run build

# Build com análise de bundle
ANALYZE=true npm run build

# Iniciar servidor de produção local
npm run start

# Type checking sem build
npm run type-check

# Lint do código
npm run lint

# Lint com auto-fix
npm run lint -- --fix
```

---

## 🧪 Testing

```bash
# Executar testes (quando implementado)
npm test

# Testes em watch mode
npm test -- --watch

# Testes com coverage
npm test -- --coverage

# E2E tests (quando implementado)
npm run test:e2e
```

---

## 📊 Analytics & Monitoring

```bash
# Bundle analyzer
npm install -D @next/bundle-analyzer

# Adicionar ao next.config.js:
# const withBundleAnalyzer = require('@next/bundle-analyzer')({
#   enabled: process.env.ANALYZE === 'true',
# })
# module.exports = withBundleAnalyzer(nextConfig)

# Executar análise
ANALYZE=true npm run build
```

---

## 🔍 Debugging

```bash
# Debug mode no Node.js
NODE_OPTIONS='--inspect' npm run dev

# Com breakpoint logo no início
NODE_OPTIONS='--inspect-brk' npm run dev

# Debug do build
DEBUG=* npm run build

# Logs verbose
npm run dev -- --verbose
```

---

## 🗄️ Database (Supabase)

```bash
# Executar migrations (quando implementado)
npm run db:migrate

# Gerar types do Supabase
npx supabase gen types typescript --project-id <project-id> > src/types/supabase.ts

# Seed do database
npm run db:seed

# Reset database
npm run db:reset
```

---

## 🔐 Environment Variables

```bash
# Copiar example para .env.local
cp .env.example .env.local

# Validar env vars (quando implementado)
npm run validate:env

# Listar env vars disponíveis
env | grep NEXT_PUBLIC_

# Carregar env de arquivo específico
env $(cat .env.production | xargs) npm run build
```

---

## 📝 Code Generation

```bash
# Gerar novo componente (quando implementado)
npm run generate:component <ComponentName>

# Gerar nova página
npm run generate:page <route-name>

# Gerar types do Supabase
npm run generate:types
```

---

## 🧹 Limpeza & Manutenção

```bash
# Limpar cache do Next.js
rm -rf .next

# Limpar node_modules e reinstalar
rm -rf node_modules package-lock.json
npm install

# Limpar cache do turbopack
rm -rf .turbo

# Limpar tudo e recomeçar
npm run clean
# ou
rm -rf .next node_modules .turbo
npm install
```

---

## 🚀 Vercel CLI

```bash
# Instalar Vercel CLI globalmente
npm install -g vercel

# Login na Vercel
vercel login

# Deploy para preview
vercel

# Deploy para production
vercel --prod

# Listar deployments
vercel ls

# Ver logs em tempo real
vercel logs <deployment-url> --follow

# Secrets
vercel env ls
vercel env add <name>
vercel env rm <name>

# Pull env vars do Vercel
vercel env pull .env.local
```

---

## 📊 Performance Analysis

```bash
# Lighthouse CI (quando configurado)
npm run lighthouse

# Bundle size tracking
npm run analyze:bundle

# Performance profiling
npm run build && npm run start
# Depois use Chrome DevTools Performance tab

# Verificar source maps
npm run build
ls -lh .next/static/chunks/*.js.map
```

---

## 🔒 Security

```bash
# Audit de segurança
npm audit

# Fix vulnerabilidades automáticas
npm audit fix

# Fix forçado (pode quebrar coisas)
npm audit fix --force

# Verificar licenças
npx license-checker

# Verificar headers de segurança
curl -I https://seu-dominio.com | grep -i security
```

---

## 🎨 Formatação & Code Quality

```bash
# Prettier format (quando configurado)
npm run format

# Prettier check
npm run format:check

# ESLint
npm run lint

# Type check
npm run type-check

# Todos os checks
npm run validate
```

---

## 📦 Package Management

```bash
# Verificar pacotes desatualizados
npm outdated

# Atualizar pacotes (cuidado!)
npm update

# Atualizar Next.js
npm install next@latest react@latest react-dom@latest

# Verificar espaço usado
npm list --depth=0

# Deduplicate packages
npm dedupe
```

---

## 🔧 Helpers

```bash
# Ver versão do Next.js
npm list next

# Ver versão do Node
node -v

# Ver versão do npm
npm -v

# Info do projeto
npm run info

# Verificar tipos do TypeScript
npx tsc --noEmit

# Gerar sitemap
curl https://seu-dominio.com/sitemap.xml

# Testar robots.txt
curl https://seu-dominio.com/robots.txt
```

---

## 🐳 Docker (quando implementado)

```bash
# Build imagem
docker build -t blipee-v2 .

# Run container
docker run -p 3000:3000 blipee-v2

# Docker compose
docker-compose up -d

# Logs
docker-compose logs -f

# Stop
docker-compose down
```

---

## 📱 Mobile Testing

```bash
# Servir na rede local
npm run dev -- --hostname 0.0.0.0

# Depois acesse de:
# http://SEU-IP-LOCAL:3005

# ngrok para testar externamente (instale primeiro)
ngrok http 3005
```

---

## 🔄 CI/CD

```bash
# Build like Vercel does
npm run build

# Simular Vercel build
vercel build

# Verificar output
vercel inspect <deployment-url>
```

---

## 📚 Documentation

```bash
# Gerar documentação de componentes (quando implementado)
npm run docs:generate

# Servir documentação
npm run docs:serve

# Build documentação
npm run docs:build
```

---

## 🎯 Aliases Úteis

Adicione ao seu `.bashrc` ou `.zshrc`:

```bash
# Aliases para blipee-v2
alias bv2="cd /path/to/blipee-v2"
alias bv2-dev="cd /path/to/blipee-v2 && npm run dev"
alias bv2-build="cd /path/to/blipee-v2 && npm run build"
alias bv2-clean="cd /path/to/blipee-v2 && rm -rf .next node_modules && npm install"
alias bv2-logs="cd /path/to/blipee-v2 && vercel logs --follow"
```

---

## 🆘 Troubleshooting

```bash
# "Module not found"
rm -rf node_modules .next
npm install

# "Port already in use"
lsof -ti:3005 | xargs kill

# "Type errors"
rm -rf node_modules/.cache
npm run type-check

# Build muito lento
rm -rf .next/cache
npm run build

# Git issues
git clean -fdx
git reset --hard
```

---

## 📊 Scripts Customizados

Adicione ao `package.json`:

```json
{
  "scripts": {
    "dev": "next dev --port 3005",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "format": "prettier --write \"src/**/*.{ts,tsx}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx}\"",
    "validate": "npm run type-check && npm run lint",
    "clean": "rm -rf .next node_modules .turbo",
    "analyze": "ANALYZE=true npm run build"
  }
}
```

---

**Dica**: Salve este arquivo como referência rápida! 📌

_Última atualização: 1 Novembro 2025_
