# ✅ Checklist de Validação - Melhores Práticas Vercel

Use este checklist para validar a implementação após deployment.

---

## 🔍 1. Analytics & Monitoring

### Vercel Analytics
- [ ] Acesse o dashboard do projeto na Vercel
- [ ] Verifique se a aba "Analytics" está ativa
- [ ] Confirme que pageviews estão sendo registradas
- [ ] Verifique métricas de visitantes

### Speed Insights
- [ ] Acesse "Speed Insights" no dashboard
- [ ] Confirme que Core Web Vitals estão sendo coletados:
  - [ ] LCP (Largest Contentful Paint)
  - [ ] FID (First Input Delay)
  - [ ] CLS (Cumulative Layout Shift)
- [ ] Verifique o score geral (meta: > 90)

**Como testar:**
1. Deploy na Vercel
2. Acesse seu site
3. Navegue por algumas páginas
4. Aguarde 5-10 minutos
5. Verifique os dashboards

---

## 🎨 2. Font Optimization

### Validação Visual
- [ ] Inspecione o elemento `<html>` no DevTools
- [ ] Confirme que a classe `font-inter` está aplicada
- [ ] Verifique que não há "flash" de fonte ao carregar

### Validação Técnica
- [ ] Abra DevTools > Network
- [ ] Filtre por "Font"
- [ ] Confirme que fontes são servidas do próprio domínio (não do Google)
- [ ] Verifique cache headers nas fontes

**Como testar:**
```bash
# Lighthouse no Chrome DevTools
1. F12 > Lighthouse
2. Run analysis
3. Verifique "Ensure text remains visible during webfont load" = PASS
```

---

## 📊 3. SEO & Metadata

### Sitemap
- [ ] Acesse `https://seu-dominio.com/sitemap.xml`
- [ ] Confirme que todas as rotas estão listadas
- [ ] Verifique tags `<lastmod>`, `<changefreq>`, `<priority>`

### Robots.txt
- [ ] Acesse `https://seu-dominio.com/robots.txt`
- [ ] Confirme regras de allow/disallow
- [ ] Verifique referência ao sitemap

### Open Graph
- [ ] Use [OpenGraph.xyz](https://www.opengraph.xyz/)
- [ ] Insira a URL do seu site
- [ ] Confirme preview correto no Twitter/Facebook/LinkedIn

### Metadata
- [ ] View Source da página
- [ ] Confirme tags:
  - [ ] `<title>` correto
  - [ ] `<meta name="description">`
  - [ ] `<meta property="og:*">`
  - [ ] `<meta name="twitter:*">`
  - [ ] `<link rel="canonical">`

**Como testar:**
```bash
# Google Rich Results Test
https://search.google.com/test/rich-results

# Meta Tags Checker
https://metatags.io/
```

---

## ⚡ 4. Loading States

### Visual Test
- [ ] Navegue para `/dashboard` (ou rota com loading)
- [ ] Confirme que skeleton aparece antes do conteúdo
- [ ] Verifique transição suave

### DevTools Test
- [ ] F12 > Network > Throttling > Slow 3G
- [ ] Navegue entre páginas
- [ ] Confirme loading states aparecem

---

## 🐛 5. Error Handling

### Teste de Erro
- [ ] Crie uma rota que gera erro de propósito
- [ ] Confirme que `error.tsx` captura o erro
- [ ] Verifique UI de erro
- [ ] Teste botão "Try again"

### Global Error
- [ ] Simule um erro crítico (ex: crash no root layout)
- [ ] Confirme que `global-error.tsx` é renderizado

**Como testar:**
```tsx
// Adicione temporariamente em uma página:
export default function TestPage() {
  throw new Error('Test error')
  return <div>This won't render</div>
}
```

---

## 🔒 6. Security Headers

### Header Check
- [ ] Abra DevTools > Network
- [ ] Selecione qualquer request
- [ ] Verifique Response Headers:
  - [ ] `Strict-Transport-Security`
  - [ ] `X-Frame-Options: SAMEORIGIN`
  - [ ] `X-Content-Type-Options: nosniff`
  - [ ] `Content-Security-Policy`

**Como testar:**
```bash
# SecurityHeaders.com
https://securityheaders.com/?q=seu-dominio.com

# Meta: Grade A ou A+
```

---

## 🚀 7. Performance

### Lighthouse Audit
- [ ] F12 > Lighthouse > Desktop
- [ ] Run analysis
- [ ] Metas:
  - [ ] Performance: > 90
  - [ ] Accessibility: > 95
  - [ ] Best Practices: 100
  - [ ] SEO: 100

### Core Web Vitals
- [ ] LCP < 2.5s (Good)
- [ ] FID < 100ms (Good)
- [ ] CLS < 0.1 (Good)

**Como testar:**
```bash
# PageSpeed Insights
https://pagespeed.web.dev/

# WebPageTest
https://www.webpagetest.org/
```

---

## 🌐 8. Deployment

### Vercel Deployment
- [ ] Build sem erros
- [ ] Deploy bem-sucedido
- [ ] Preview URLs funcionando
- [ ] Environment variables configuradas

### Git Integration
- [ ] PR gera preview deployment automático
- [ ] Merge para main gera production deployment
- [ ] Rollback funciona

---

## 📱 9. Cross-Browser Testing

### Desktop
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile
- [ ] iOS Safari
- [ ] Android Chrome
- [ ] Responsive design

---

## ✨ 10. Final Checks

### Functional
- [ ] Todas as rotas carregam
- [ ] Links de navegação funcionam
- [ ] Forms submetem corretamente
- [ ] Imagens carregam otimizadas

### Visual
- [ ] Fontes renderizam corretamente
- [ ] Layout não quebra
- [ ] Cores e estilos corretos
- [ ] Animações suaves

### Technical
- [ ] Console sem erros críticos
- [ ] Network requests otimizados
- [ ] Cache funcionando
- [ ] Middleware executando

---

## 🎯 Scorecard Final

| Categoria | Score | Meta |
|-----------|-------|------|
| Performance | ___/100 | > 90 |
| SEO | ___/100 | > 95 |
| Accessibility | ___/100 | > 90 |
| Best Practices | ___/100 | 100 |
| Security Headers | ___/__ | A+ |
| Core Web Vitals | ___/3 | 3/3 |

---

## 📝 Notas

**Data da validação:** ___/___/___

**Validado por:** _______________

**Issues encontradas:**
- [ ] _____________________
- [ ] _____________________
- [ ] _____________________

**Action items:**
- [ ] _____________________
- [ ] _____________________
- [ ] _____________________

---

## 🆘 Troubleshooting

### Analytics não aparece
- Aguarde 10-15 minutos após primeiro acesso
- Verifique se componentes `<Analytics />` estão no layout
- Confirme deploy na Vercel (não localhost)

### Fontes não otimizadas
- Verifique variável CSS `--font-inter` no HTML
- Confirme import de `next/font/google`
- Clear cache do browser

### SEO issues
- Valide sitemap.xml está acessível
- Confirme metadataBase está configurado
- Use ferramentas de validação listadas acima

### Performance baixa
- Otimize imagens (use next/image)
- Implemente code splitting
- Adicione Suspense boundaries
- Configure ISR onde apropriado

---

**Status: [ ] PASSED [ ] FAILED [ ] PENDING**

_Última atualização: 1 Novembro 2025_
