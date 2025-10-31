# 🤖 Plano de Deployment - Agentes Autônomos IA
Criado: 2025-10-29

## 📋 Resumo Executivo

Você tem **8 agentes de IA autônomos totalmente implementados** que trabalham 24/7 analisando dados de sustentabilidade e enviando mensagens proativas aos utilizadores. O código está pronto - só falta fazer o deployment do worker.

### O Que Tem Implementado

✅ **8 Agentes Especializados:**
- 🔍 Carbon Hunter - Monitorização de emissões
- ⚖️ Compliance Guardian - Verificação de compliance (GRI, TCFD, CDP)
- 💰 Cost Saving Finder - Identificação de poupanças
- 🔧 Predictive Maintenance - Manutenção preditiva
- ⚡ Autonomous Optimizer - Optimização de operações
- 🔗 Supply Chain Investigator - Análise de fornecedores
- 📋 Regulatory Foresight - Monitorização regulatória
- 👔 ESG Chief of Staff - Supervisão estratégica

✅ **Infraestrutura Completa:**
- Worker service com 844 linhas (`agent-worker.ts`)
- Framework de agentes com learning system
- Gerador de mensagens proativas
- Health checks automáticos
- 9 serviços adicionais (metrics, cleanup, forecasting, ML training, etc.)
- Sistema de otimização de prompts com A/B testing

### Benefícios dos Agentes

1. **Análise Proativa** - Agentes trabalham 24/7, não esperam por utilizadores
2. **Insights Automáticos** - Identificam problemas e oportunidades automaticamente
3. **Alertas Inteligentes** - Notificam apenas sobre findings importantes
4. **Cross-Organization** - Benchmarking entre organizações
5. **Self-Improving** - Sistema de learning que melhora com o tempo

---

## 🎯 Opções de Deployment

### Opção 1: Railway (RECOMENDADO) 🌟

**Porquê Railway?**
- ✅ Setup mais simples (2 comandos)
- ✅ Auto-restart se o worker crashar
- ✅ Logs em tempo real fáceis de ver
- ✅ Free tier generoso ($5 crédito/mês)
- ✅ Deploy automático via GitHub
- ✅ Health checks integrados

**Custo:** ~$5/mês após free tier

**Passos:**

```bash
# 1. Instalar Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Inicializar projeto
railway init

# 4. Configurar variáveis de ambiente (IMPORTANTE!)
railway variables set NEXT_PUBLIC_SUPABASE_URL=https://quovvwrwyfkzhgqdeham.supabase.co
railway variables set SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
railway variables set OPENAI_API_KEY=sk-proj-...
railway variables set ANTHROPIC_API_KEY=sk-ant-...
railway variables set DEEPSEEK_API_KEY=sk-...
railway variables set NODE_ENV=production
railway variables set RUN_INITIAL_ANALYSIS=true

# 5. Deploy!
railway up

# 6. Ver logs
railway logs

# 7. Ver status
curl https://seu-worker.railway.app/health
```

**Ficheiros já configurados:**
- ✅ `railway.json` existe
- ✅ `Dockerfile` existe
- ✅ Start command configurado

---

### Opção 2: Render.com

**Vantagens:**
- Free tier disponível
- Auto-deploy via GitHub
- Interface visual simples

**Custo:** Free ou $7/mês

**Passos:**

1. Ir a https://render.com
2. Conectar repositório GitHub
3. Create new **Background Worker**
4. Configurar:
   - **Name:** blipee-agent-worker
   - **Build Command:** `npm install`
   - **Start Command:** `npm run agents:start`
   - **Plan:** Free ou Starter
5. Adicionar environment variables (mesmo que Railway)
6. Deploy!

**Ficheiro já configurado:**
- ✅ `render.yaml` existe

---

### Opção 3: Heroku

**Vantagens:**
- Plataforma estabelecida
- Boa documentação

**Custo:** ~$7/mês (Eco dynos)

```bash
# 1. Instalar Heroku CLI
npm install -g heroku

# 2. Login
heroku login

# 3. Criar app
heroku create blipee-agent-worker

# 4. Set config vars
heroku config:set NEXT_PUBLIC_SUPABASE_URL=...
heroku config:set SUPABASE_SERVICE_KEY=...
heroku config:set OPENAI_API_KEY=...
heroku config:set ANTHROPIC_API_KEY=...
heroku config:set RUN_INITIAL_ANALYSIS=true

# 5. Deploy
git push heroku main

# 6. Escalar worker
heroku ps:scale worker=1

# 7. Ver logs
heroku logs --tail
```

**Ficheiro já configurado:**
- ✅ `Procfile` existe

---

## 🔧 Teste Local Primeiro

Antes de fazer deployment, teste localmente:

```bash
# Terminal 1: Next.js app
npm run dev

# Terminal 2: Agent worker
npm run agents:dev

# Ou executar ambos:
npm run dev:with-agents
```

Verificar logs para:
```
🚀 Starting Blipee AI Global Agent Worker...
✅ Global workforce initialized successfully
   • 8 agents active globally
👂 Starting global task listener...
💚 Health check server listening on port 8080
✅ Global agent worker fully operational
```

Testar health endpoint:
```bash
curl http://localhost:8080/health
```

---

## 📝 Variáveis de Ambiente Necessárias

### Obrigatórias

| Variável | Onde Obter | Exemplo |
|----------|------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard > Settings > API | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_KEY` | Supabase Dashboard > Settings > API > service_role | `eyJhbGciOiJI...` ⚠️ SECRETO! |
| `OPENAI_API_KEY` | https://platform.openai.com/api-keys | `sk-proj-...` |

### Recomendadas

| Variável | Onde Obter | Benefício |
|----------|------------|-----------|
| `ANTHROPIC_API_KEY` | https://console.anthropic.com | Claude para agentes (melhor raciocínio) |
| `DEEPSEEK_API_KEY` | https://platform.deepseek.com | Alternativa económica |

### Opcionais

| Variável | Descrição | Default |
|----------|-----------|---------|
| `NODE_ENV` | production/development | production |
| `PORT` | Porta do health check | 8080 |
| `RUN_INITIAL_ANALYSIS` | Processar dados históricos no primeiro deployment | false |

⚠️ **IMPORTANTE:** Nunca commitar `SUPABASE_SERVICE_KEY` no git!

---

## 🚀 Modo Bootstrap (Primeira Vez)

Na primeira vez que fizer deployment, ative o **Bootstrap Mode** para processar todos os dados históricos:

```bash
railway variables set RUN_INITIAL_ANALYSIS=true
```

**O que faz:**
1. ✅ Computa todas as métricas de sustentabilidade
2. ✅ Analisa dados históricos de emissões
3. ✅ Gera forecasts Prophet
4. ✅ Treina modelos ML (simulados)
5. ✅ Identifica oportunidades de optimização
6. ✅ Cria relatórios iniciais
7. ✅ Analisa padrões de conversação

**Tempo estimado:** 2-5 minutos

Depois do bootstrap completar, o sistema entra em modo normal com tasks agendadas.

---

## 📊 O Que os Agentes Fazem

### Schedules Automáticas

| Agente | Frequência | O Que Analisa |
|--------|------------|---------------|
| Carbon Hunter | Bi-semanal (1º e 15º) | Emissões, anomalias, padrões incomuns |
| Compliance Guardian | Bi-semanal (5º e 20º) | GRI, TCFD, CDP, SASB, CSRD compliance |
| Cost Saving Finder | Bi-semanal (3º e 18º) | Custos de energia, oportunidades de poupança |
| Predictive Maintenance | Cada 4 horas | Equipamento, falhas potenciais |
| Autonomous Optimizer | Cada 2 horas | HVAC, iluminação, recursos |
| Supply Chain Investigator | Semanal (Quarta) | Fornecedores, riscos, disrupções |
| Regulatory Foresight | Diário | Mudanças regulatórias, deadlines |
| ESG Chief of Staff | Semanal (Segunda) | Overview estratégico, coordenação |

### Serviços Adicionais

**Fase 1 - Foundation:**
- Metrics pre-computation (diário 2:00 UTC)
- Data cleanup GDPR (diário 3:00 UTC)
- Notification queue (cada 5 min)

**Fase 2 - Intelligence:**
- Optimization opportunities (diário 4:00 UTC)
- Database optimization (semanal Domingo 1:00 UTC)
- Weather data polling (horário)

**Fase 3 - Advanced Analytics:**
- Report generation (mensal dia 1, 6:00 UTC)
- ML model training (mensal dia 15, 2:00 UTC)
- Prophet forecasting (cada 4 horas, 6x/dia)

**Prompt Optimization:**
- Pattern analysis (horário)
- A/B experiment monitoring (cada 15 min)

---

## 💬 Como Funcionam as Mensagens Proativas

### Fluxo

1. **Agente executa task** (ex: Carbon Hunter analisa emissões)
2. **Escreve resultado** em `agent_task_results`
3. **Worker detecta** novo resultado via Supabase Realtime
4. **Avalia importância** do finding
5. **Se importante:** Gera mensagem proativa
6. **Notifica utilizadores** relevantes (admins, sustainability managers)
7. **Aparece no chat** como mensagem do agente (caixa azul)

### Exemplo de Notificação

```
🔍 Carbon Hunter
Prioridade: Alta
Hora: 14:30

Detetei um aumento de 15% nas emissões de Scope 2
este mês comparado com o baseline. Principais causas:

• Consumo de eletricidade +18% (Edifício Lisboa)
• HVAC a funcionar fora do horário (3 ocorrências)

Oportunidade de poupança: ~450 kg CO2e/mês

Recomendação: Verificar programação do sistema HVAC.
```

### Filtros de Notificação

Utilizadores recebem notificações apenas se:
- ✅ Têm permissões adequadas (account_owner, sustainability_manager, analyst)
- ✅ Finding é considerado importante pelo agente
- ✅ Ultrapassa thresholds configurados

---

## 🔍 Monitoring e Debugging

### Health Checks

**Endpoint:** `http://seu-worker.railway.app/health`

Resposta esperada:
```json
{
  "status": "healthy",
  "uptime": 3600,
  "agents": {
    "mode": "global",
    "totalAgents": 8,
    "organizations": 5,
    "crossOrgBenchmarking": true
  },
  "phase1Services": {
    "metrics": { "status": "healthy", "lastRun": "..." },
    "cleanup": { "status": "healthy", "lastRun": "..." },
    "notifications": { "status": "healthy", "lastRun": "..." }
  },
  "promptOptimization": {
    "patternsAnalyzed": 12,
    "experimentsCompleted": 2
  }
}
```

### Ver Logs

**Railway:**
```bash
railway logs
railway logs --tail  # Follow logs
```

**Render:**
- Dashboard > Logs tab

**Heroku:**
```bash
heroku logs --tail
```

### Queries Úteis

```sql
-- Ver task results dos agentes
SELECT
    agent_id,
    task_type,
    success,
    execution_time_ms,
    created_at
FROM agent_task_results
ORDER BY created_at DESC
LIMIT 20;

-- Ver mensagens proativas geradas
SELECT
    role,
    content,
    metadata->>'agentId' as agent_id,
    metadata->>'priority' as priority,
    created_at
FROM messages
WHERE role = 'agent'
ORDER BY created_at DESC
LIMIT 10;

-- Ver notificações
SELECT
    type,
    title,
    message,
    priority,
    read,
    created_at
FROM notifications
WHERE type = 'agent_message'
ORDER BY created_at DESC
LIMIT 10;

-- Health check dos agentes
SELECT
    COUNT(*) as executions,
    AVG(execution_time_ms) as avg_time,
    SUM(CASE WHEN success THEN 1 ELSE 0 END)::float / COUNT(*) * 100 as success_rate
FROM agent_task_executions
WHERE created_at > NOW() - INTERVAL '24 hours';
```

---

## ⚠️ Problemas Comuns e Soluções

### 1. Worker não inicia

**Sintomas:**
```
❌ Failed to initialize global workforce
```

**Verificar:**
- ✅ Variáveis de ambiente configuradas?
- ✅ SUPABASE_SERVICE_KEY correto (não o ANON key)?
- ✅ OpenAI API key válido?

**Fix:**
```bash
# Re-set environment variables
railway variables set SUPABASE_SERVICE_KEY=...

# Restart
railway restart
```

### 2. Agentes não enviam mensagens

**Sintomas:**
- Worker está running
- Não aparecem mensagens no chat

**Verificar:**
```sql
-- Há organizações na DB?
SELECT COUNT(*) FROM organizations;

-- Há task results?
SELECT COUNT(*) FROM agent_task_results
WHERE created_at > NOW() - INTERVAL '1 day';

-- Há membros da organização para notificar?
SELECT COUNT(*) FROM organization_members;
```

**Fix:**
- Executar bootstrap mode se primeira vez
- Verificar schedules dos agentes
- Check thresholds de notificação

### 3. Erro de conexão à DB

**Sintomas:**
```
❌ Failed to fetch organizations
Error: connect ETIMEDOUT
```

**Fix:**
```bash
# Testar conexão manualmente
psql "postgresql://postgres:PASSWORD@db.quovvwrwyfkzhgqdeham.supabase.co:5432/postgres" \
  -c "SELECT version();"

# Se funcionar, problema é no worker
# Verificar se service role key está correto
```

### 4. Alto uso de memória

**Sintomas:**
- Worker crashs com OOM
- Slow performance

**Fix:**
Editar `src/lib/ai/autonomous-agents/base/AgentOrchestrator.ts`:
```typescript
private readonly maxTasksPerAgent = 3; // Reduzir de 5
private readonly maxConcurrentAgents = 2; // Reduzir de 4
```

---

## 📈 Custos Estimados

### Infrastructure

| Serviço | Plano | Custo/mês |
|---------|-------|-----------|
| **Railway** | Starter | $5 (após free tier) |
| **Render** | Starter | $7 |
| **Heroku** | Eco | $7 |
| **Vercel** | Hobby | $0 (app principal) |
| **Supabase** | Free | $0 |

### APIs de IA (variável)

Depende do uso, mas estimativa conservadora:

| Provider | Uso Estimado | Custo/mês |
|----------|--------------|-----------|
| **OpenAI GPT-4o** | 8 agentes × 2x/dia | ~$20-30 |
| **Anthropic Claude** | Alternativa | ~$15-25 |
| **DeepSeek** | Mais económico | ~$5-10 |

**Total estimado:** $30-45/mês (worker + APIs)

### Como Reduzir Custos

1. **Usar DeepSeek** em vez de GPT-4o para tarefas simples
2. **Reduzir frequência** dos agentes (ex: bi-semanal → semanal)
3. **Aumentar thresholds** de notificação (menos mensagens)
4. **Caching** de análises repetidas
5. **Usar Railway free tier** inicialmente

---

## ✅ Checklist de Deployment

### Pré-Deployment

- [ ] Variáveis de ambiente preparadas
- [ ] Conta Railway/Render/Heroku criada
- [ ] Testado localmente (`npm run agents:dev`)
- [ ] Health check funciona (http://localhost:8080/health)
- [ ] Organizações existem na DB
- [ ] Utilizadores com permissões corretas

### Deployment

- [ ] Railway CLI instalado
- [ ] Variáveis configuradas no Railway
- [ ] `RUN_INITIAL_ANALYSIS=true` (primeira vez)
- [ ] Deploy executado (`railway up`)
- [ ] Logs mostram "fully operational"
- [ ] Health endpoint responde

### Pós-Deployment

- [ ] Verificar logs (sem erros)
- [ ] Query `agent_task_results` (dados a aparecer?)
- [ ] Query `agent_task_executions` (tasks a executar?)
- [ ] Testar mensagem proativa (aparece no chat?)
- [ ] Configurar alertas (Railway/Render dashboard)
- [ ] Documentar URL do health endpoint

---

## 🎯 Próximos Passos Recomendados

### Curto Prazo (Esta Semana)

1. **Fazer deployment no Railway** (mais fácil)
2. **Activar bootstrap mode** (processar histórico)
3. **Monitorizar logs** primeiras 24h
4. **Verificar primeira mensagem** proativa
5. **Ajustar thresholds** se muitas/poucas notificações

### Médio Prazo (Próximas 2 Semanas)

1. **Otimizar schedules** dos agentes
2. **Implementar caching** para reduzir API calls
3. **Configurar alertas** (Slack/email) para falhas
4. **Dashboard de monitoring** (Railway analytics)
5. **A/B testing** de prompts diferentes

### Longo Prazo (Próximo Mês)

1. **Scaling horizontal** se muitas organizações
2. **Rate limiting** inteligente
3. **Custom metrics** no dashboard
4. **Integration testes** automatizados
5. **Documentation** para utilizadores finais

---

## 🆘 Suporte

Se encontrar problemas:

1. **Verificar logs** primeiro
2. **Query database** (ver queries acima)
3. **Test health endpoint**
4. **Verificar variáveis** de ambiente
5. **Restart worker** como último recurso

**Contactos:**
- Issues: GitHub repository
- Email: suporte@blipee.com
- Docs: `/docs/AGENT_DEPLOYMENT_GUIDE.md`

---

## 🚀 TL;DR - Deploy Rápido

```bash
# 1. Instalar Railway CLI
npm install -g @railway/cli

# 2. Login e init
railway login
railway init

# 3. Set vars (usar os seus valores!)
railway variables set NEXT_PUBLIC_SUPABASE_URL=https://quovvwrwyfkzhgqdeham.supabase.co
railway variables set SUPABASE_SERVICE_KEY=<seu-service-key>
railway variables set OPENAI_API_KEY=<seu-openai-key>
railway variables set ANTHROPIC_API_KEY=<seu-anthropic-key>
railway variables set RUN_INITIAL_ANALYSIS=true

# 4. Deploy!
railway up

# 5. Ver logs e confirmar
railway logs

# 6. Check health
curl https://seu-worker.railway.app/health
```

**Tempo total:** 10-15 minutos

---

**Pronto para ativar os seus 8 assistentes de IA? 🤖**

O código está 100% pronto. Basta fazer deploy e os agentes começam a trabalhar!
