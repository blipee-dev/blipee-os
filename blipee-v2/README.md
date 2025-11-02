# Blipee Monorepo

Este repositório abriga as aplicações Blipee V1 e Blipee V2, bem como pacotes compartilhados.

## Estrutura

```
apps/
  blipee-v1/   # Aplicação atual em produção (placeholder)
  blipee-v2/   # Nova aplicação Next.js 14 + Supabase SSR
packages/
  shared/      # Utilidades reutilizáveis entre as apps
```

## Fluxo de trabalho

- Execute comandos usando `npm run <script> --workspace <app>` ou scripts prontos do root (`npm run dev:v2`).
- Dependências específicas de cada app vivem no `package.json` correspondente dentro de `apps/`.
- Código compartilhado deve residir em `packages/shared` e ser publicado via workspace.

## Próximos passos

1. Popular `apps/blipee-v1` com o código atual da V1.
2. Extrair tipos/clients comuns para `packages/shared`.
3. Ajustar pipelines de CI/CD para apontar para os subdiretórios corretos.
