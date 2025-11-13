# 📦 Pacote de Entrega - Power BI Integration

Este diretório contém todos os ficheiros necessários para entregar a integração Power BI ao cliente.

---

## 📋 Conteúdos do Pacote

### 1. **EMAIL_TEMPLATE.md**
Email profissional para enviar ao cliente com:
- Introdução à integração
- Credenciais de acesso
- Lista de anexos
- Próximos passos
- Contactos de suporte

**Como usar:**
1. Copiar conteúdo do ficheiro
2. Substituir placeholders `[...]` com informação real
3. Anexar ficheiros listados abaixo
4. Enviar ao contacto principal do cliente

---

### 2. **QUICK_START_GUIDE.md**
Guia passo-a-passo simplificado (3 páginas) com:
- Screenshots textuais
- Instruções visuais
- Troubleshooting básico
- Tempo estimado: 15 minutos

**Como usar:**
1. Exportar para PDF:
   ```bash
   # Opção 1: Usar Markdown to PDF (VSCode extension)
   # Opção 2: Usar pandoc
   pandoc QUICK_START_GUIDE.md -o Quick_Start_Guide.pdf
   ```
2. Anexar ao email

---

### 3. **API Reference** (via link)
Documentação técnica completa:
- Location: `/docs/POWER_BI_INTEGRATION.md`
- Ou gerar PDF e anexar

---

### 4. **Credenciais**
Ficheiro gerado pelo script `generate-api-key.ts`:
- Organization ID
- API Key
- API Base URL
- Exemplos de uso

**Como gerar:**
```bash
# Modo interativo (recomendado)
npm run generate-api-key

# Ou modo comando
npm run generate-api-key -- --org=<org-id> --name="Power BI Production"
```

Ficheiro é guardado em `/credentials/` automaticamente.

⚠️ **Encriptar antes de enviar:**
```bash
# Opção 1: ZIP com password
zip -e credentials.zip credentials_*.txt

# Opção 2: GPG
gpg -c credentials_*.txt

# Opção 3: Enviar por canal seguro (não email)
```

---

## 🎯 Checklist de Entrega

Antes de enviar ao cliente, verificar:

### Preparação
- [ ] API keys table criada no banco (migration aplicada)
- [ ] API key gerada para o cliente
- [ ] Organization ID confirmado
- [ ] API endpoints testados e funcionais
- [ ] URLs de produção corretos no email

### Documentação
- [ ] EMAIL_TEMPLATE.md personalizado (substituir `[...]`)
- [ ] QUICK_START_GUIDE.md exportado para PDF
- [ ] API Reference disponível (PDF ou link)
- [ ] Screenshots atualizados (se aplicável)

### Credenciais
- [ ] Ficheiro de credenciais gerado
- [ ] Credenciais testadas (fazer request de teste)
- [ ] Ficheiro encriptado/protegido
- [ ] Password partilhada por canal separado (SMS, phone call)

### Template Power BI (Opcional)
- [ ] Template .pbix criado e testado
- [ ] Conexão à API configurada no template
- [ ] Visualizações exemplo funcionais
- [ ] Cores/tema neutro (não branded Blipee)

### Suporte
- [ ] Email de suporte configurado (support@blipee.com)
- [ ] Calendly link ativo (se aplicável)
- [ ] Equipa informada sobre novo cliente
- [ ] SLA de resposta definido

---

## 📧 Como Enviar

### Opção A: Email Direto (Recomendado para cliente de nível médio)

1. **Assunto:** "Integração Power BI + SharePoint - Blipee | Documentação e Credenciais"

2. **Corpo:** Usar `EMAIL_TEMPLATE.md`

3. **Anexos:**
   - `Quick_Start_Guide.pdf` (~1MB)
   - `API_Reference.pdf` (ou link) (~2MB)
   - `Blipee_Dashboard_Template.pbix` (~500KB) - se disponível
   - `credentials.zip` (encrypted) (~1KB)

4. **Seguimento:**
   - Email separado com password do ZIP
   - SMS ou phone call com password

### Opção B: Portal Seguro

Se tiverem portal de partilha segura:

1. Upload dos ficheiros para portal
2. Gerar link temporário (7 dias)
3. Enviar link por email
4. Password por canal separado

### Opção C: Sessão Presencial/Zoom

Para clientes que preferem setup assistido:

1. Agendar sessão de 30-45 minutos
2. Partilhar credenciais durante a chamada
3. Fazer setup inicial juntos
4. Gravar sessão para referência futura

---

## 🔐 Segurança

### Credenciais

**NUNCA:**
- ❌ Enviar API key em plain text por email
- ❌ Guardar credenciais em Git
- ❌ Partilhar password do ZIP no mesmo email
- ❌ Usar password fraca para encriptação

**SEMPRE:**
- ✅ Encriptar ficheiro de credenciais
- ✅ Partilhar password por canal diferente (SMS, call)
- ✅ Usar password forte para ZIP/GPG
- ✅ Definir prazo de validade para links

### API Keys

- Registar quando foi partilhada
- Monitoring de uso (first use)
- Alertar se uso anómalo
- Possibilidade de revogar

```sql
-- Ver uso da key
SELECT * FROM api_keys
WHERE organization_id = 'xxx'
ORDER BY last_used_at DESC;

-- Revogar se necessário
UPDATE api_keys
SET is_active = false
WHERE key = 'sk_live_xxx';
```

---

## 📞 Suporte Pós-Entrega

### Primeira Semana

Check-in proativo:
- Day 1: Confirmar receção
- Day 3: Verificar se conseguiram conectar
- Day 7: Perguntar se precisam de ajuda

### Ongoing

- Resposta a dúvidas: 24h
- Issues técnicos: 48h
- Requests de features: Backlog

---

## 📊 Métricas de Sucesso

Acompanhar:
- [ ] Cliente conseguiu conectar? (first API call)
- [ ] Dashboards criados? (feedback)
- [ ] Refresh automático configurado?
- [ ] Embedado no SharePoint?
- [ ] Satisfação geral (NPS survey após 2 semanas)

---

## 🔄 Atualizações Futuras

Quando há updates na API:

1. **Breaking changes:**
   - Notificar com 30 dias antecedência
   - Fornecer migration guide
   - Manter backward compatibility por 60 dias

2. **New endpoints:**
   - Anunciar via changelog
   - Documentação atualizada
   - Exemplos de uso

3. **Performance improvements:**
   - Comunicar benefícios
   - Sem ação necessária do cliente

---

## 📝 Templates Adicionais

### Calendly Event Description
```
Power BI Integration - Setup Session

Nesta sessão de 30 minutos vamos:
- Verificar conexão à API Blipee
- Configurar primeiro dashboard
- Responder a dúvidas técnicas
- Agendar próximos passos

Por favor ter:
- Power BI Desktop instalado
- Credenciais Blipee à mão
- Lista de perguntas (se houver)

Link Zoom: [auto-generated]
```

### Follow-up Email (Day 3)
```
Assunto: Power BI Integration - Como está a correr?

Olá [Nome],

Espero que estejam bem!

Queria fazer um check-in rápido sobre a integração Power BI que partilhámos na segunda-feira.

Questões rápidas:
1. Conseguiram conectar à API com sucesso?
2. Há alguma dúvida ou bloqueio?
3. Precisam de apoio técnico adicional?

Estamos disponíveis para uma quick call se ajudar.

Cumprimentos,
[Nome]
```

---

**Última atualização:** Janeiro 2025
**Versão:** 1.0
**Maintainer:** Equipa Blipee
