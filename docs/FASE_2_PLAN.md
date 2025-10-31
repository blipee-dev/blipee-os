# FASE 2 - Sistema de Conversações 💬
## Plano de Implementação

**Data de Início:** 30 de Outubro de 2025
**Prazo Estimado:** 3 semanas
**Status:** 🚀 Ready to Start

---

## 📊 Contexto

### FASE 1 Completa ✅
- ✅ 8 Agentes autónomos com 10 ferramentas cada
- ✅ ML Training Service operacional (9 modelos treinados)
- ✅ Prophet Forecasting (16 previsões geradas)
- ✅ Proactive Agent Scheduler (deploy em produção)
- ✅ Admin Dashboards (Agent Activity + ML Performance)
- ✅ Railway deployment funcional

### FASE 2 Objetivo 🎯
Ativar **11 de 13 tabelas** do sistema de conversações que estão inativas:

**Estado Atual:**
- ✅ 2/13 tabelas ativas (15%): `conversations`, `messages`
- ❌ 11/13 tabelas inativas (85%): Todas as features avançadas

**Meta FASE 2:**
- ✅ 13/13 tabelas ativas (100%)
- Sistema de conversações completo e funcional

---

## 🗂️ Tabelas Inativas (11)

| # | Tabela | Propósito | Prioridade |
|---|--------|-----------|------------|
| 1 | `conversation_feedback` | Thumbs up/down nas mensagens | 🔴 Alta |
| 2 | `conversation_memories` | Memórias extraídas das conversas | 🔴 Alta |
| 3 | `conversation_contexts` | Contexto persistente | 🟡 Média |
| 4 | `conversation_state` | Estado da conversa | 🟡 Média |
| 5 | `conversation_analytics` | Analytics agregadas | 🟢 Baixa |
| 6 | `ai_conversation_analytics` | Analytics AI | 🟢 Baixa |
| 7 | `chat_attachments` | Upload de ficheiros | 🟡 Média |
| 8 | `chat_shares` | Partilha de conversas | 🟢 Baixa |
| 9 | `message_votes` | Votos em mensagens | 🟢 Baixa |
| 10 | `conversation_preferences` | Preferências do utilizador | 🟡 Média |
| 11 | `conversation_memory` | Memória alternativa | 🟢 Baixa |

---

## 📅 Cronograma (3 Semanas)

### **SEMANA 1: Feedback & Memórias** (5-7 dias)

#### 1.1 Conversation Feedback (2 dias)
**Objetivo:** Permitir thumbs up/down em mensagens de agentes

**Backend:**
- ✅ Já funciona (trigger existe na base de dados)

**Frontend:**
```typescript
// src/components/chat/MessageFeedback.tsx
- Componente com botões thumbs up/down
- Integração com Supabase
- Mostrar estado de feedback existente
```

**Integração:**
```typescript
// src/components/chat/ChatMessage.tsx
- Adicionar MessageFeedback após mensagens de assistant/agent
- Condicional: só mostrar para mensagens de IA
```

**Deliverable:**
- [ ] Componente MessageFeedback criado
- [ ] Integrado em todas as mensagens de agentes
- [ ] Teste: clicar thumbs funciona e guarda na DB

---

#### 1.2 Conversation Memories (3 dias)
**Objetivo:** Extrair e armazenar memórias importantes das conversas

**Backend Job:**
```typescript
// src/workers/jobs/extract-conversation-memories.ts
async function extractConversationMemories(conversationId: string) {
  // 1. Buscar mensagens (min 5)
  // 2. Usar AI para extrair memórias
  // 3. Guardar em conversation_memories
  // 4. Atualizar conversation_state.has_memories = true
}
```

**Cron Job:**
```typescript
// src/workers/services/memory-extraction-service.ts
- Runs daily at 04:00 UTC
- Processes conversations from last 24h with 5+ messages
- Uses OpenAI to extract key facts/preferences/context
```

**Frontend:**
```typescript
// src/components/chat/ConversationMemories.tsx
- Sidebar panel showing extracted memories
- Group by: facts, preferences, context
- Delete/edit memories
```

**Deliverable:**
- [ ] Memory extraction job criado
- [ ] Scheduled to run daily
- [ ] UI para visualizar memórias
- [ ] Teste: conversa >5 msgs gera memórias

---

### **SEMANA 2: Context & State Management** (7 dias)

#### 2.1 Conversation Contexts (2 dias)
**Objetivo:** Manter contexto persistente entre mensagens

**Backend:**
```typescript
// src/lib/conversations/context-manager.ts
class ConversationContextManager {
  async updateContext(conversationId, newContext) {
    // Merge with existing context
    // Save to conversation_contexts
  }

  async getActiveContext(conversationId) {
    // Return current context for agent
  }
}
```

**Integration:**
```typescript
// src/lib/ai/autonomous-agents/AgentOrchestrator.ts
- Before each agent call, load context
- After response, save updated context
- Context includes: current topic, mentioned entities, user intent
```

**Deliverable:**
- [ ] ContextManager implementado
- [ ] Integrado no AgentOrchestrator
- [ ] Contexto persiste entre mensagens

---

#### 2.2 Conversation State (2 dias)
**Objetivo:** Rastrear estado da conversa (active, paused, archived)

**Backend:**
```typescript
// src/lib/conversations/state-manager.ts
- updateState(conversationId, state)
- Trigger on new message (active)
- Trigger on 24h inactivity (paused)
- Manual archive option
```

**Frontend:**
```typescript
// src/components/chat/ConversationList.tsx
- Filter por estado
- Badge indicador (Active/Paused/Archived)
- Opção "Archive" no menu
```

**Deliverable:**
- [ ] State tracking automático
- [ ] UI para ver/filtrar estados
- [ ] Archive manual funcional

---

#### 2.3 Conversation Preferences (2 dias)
**Objetivo:** Preferências por conversa (notificações, tom, idioma)

**Backend:**
```typescript
// conversation_preferences schema já existe
// Criar API endpoints
```

**Frontend:**
```typescript
// src/components/chat/ConversationSettings.tsx
- Notification preferences (email, in-app)
- Agent tone (formal, casual, technical)
- Language preference
- Auto-archive after X days
```

**Deliverable:**
- [ ] Settings UI criada
- [ ] Preferences salvam na DB
- [ ] Agents respeitam tone preference

---

### **SEMANA 3: Analytics & Advanced Features** (7 dias)

#### 3.1 Analytics (3 dias)

**Backend Jobs:**
```typescript
// src/workers/jobs/aggregate-conversation-analytics.ts
- Daily job (05:00 UTC)
- Aggregate: message count, avg response time, sentiment
- Save to conversation_analytics

// src/workers/jobs/ai-conversation-analytics.ts
- Weekly job (Sundays 02:00 UTC)
- AI analyzes patterns, topics, effectiveness
- Save to ai_conversation_analytics
```

**Frontend:**
```typescript
// src/app/(protected)/admin/conversations/page.tsx
- Dashboard com métricas:
  - Total conversations
  - Avg messages per conversation
  - Most active agents
  - User satisfaction (from feedback)
  - Topic distribution
```

**Deliverable:**
- [ ] Analytics jobs criados
- [ ] Dashboard funcional
- [ ] Métricas atualizam diariamente

---

#### 3.2 Chat Attachments (2 dias)
**Objetivo:** Upload de ficheiros nas conversas

**Backend:**
```typescript
// src/app/api/chat/attachments/route.ts
- POST: Upload file to Supabase Storage
- Save metadata to chat_attachments
- Return secure URL
```

**Frontend:**
```typescript
// src/components/chat/ChatInput.tsx
- File upload button
- Preview antes de enviar
- Mostrar anexos na mensagem

// src/components/chat/AttachmentViewer.tsx
- Download/preview attachments
```

**Deliverable:**
- [ ] Upload de PDF, CSV, images funcional
- [ ] Anexos aparecem nas mensagens
- [ ] Download funciona

---

#### 3.3 Message Votes & Chat Shares (2 dias)
**Objetivo:** Votos em mensagens alternativas + partilha de conversas

**Message Votes:**
```typescript
// src/components/chat/MessageVoteButton.tsx
- Upvote/downvote em respostas específicas
- Para A/B testing de prompts
```

**Chat Shares:**
```typescript
// src/app/(protected)/shared/[shareId]/page.tsx
- Página pública para conversa partilhada
- Gerar link único
- Controlo de expiração
```

**Deliverable:**
- [ ] Vote system funcional
- [ ] Share gera link público
- [ ] Link expira após X dias

---

## 🎯 Success Criteria

Ao fim das 3 semanas:

### Functional Requirements
- [ ] Todas 13 tabelas de conversação têm dados
- [ ] UI para todas as features implementadas
- [ ] Jobs automáticos a correr em produção
- [ ] Zero erros em production logs

### Quality Metrics
- [ ] 100% das tabelas ativas (vs 15% atual)
- [ ] <200ms latência em chat
- [ ] 95%+ uptime nos jobs
- [ ] User satisfaction >4.0/5 (via feedback)

### Documentation
- [ ] FASE_2_COMPLETE.md criado
- [ ] API documentation atualizada
- [ ] User guide para novas features

---

## 🔄 Dependencies

### FASE 1 Prerequisites (Already Done ✅)
- ✅ Agent Worker deployed on Railway
- ✅ Supabase tables created
- ✅ OpenAI integration working
- ✅ Storage bucket configured

### FASE 2 Prerequisites (To Check)
- [ ] Supabase Storage bucket for attachments
- [ ] OpenAI model for memory extraction (gpt-4o-mini)
- [ ] Email service for notifications (optional)

---

## 📊 Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Memory extraction expensive | Medium | Use gpt-4o-mini, batch process |
| File upload storage costs | Low | Set max file size (10MB) |
| Analytics queries slow | Medium | Pre-aggregate daily, cache results |
| User adoption low | Low | Progressive rollout, user education |

---

## 🚀 Getting Started

### Day 1 Checklist
1. [ ] Review all 11 inactive table schemas
2. [ ] Create FASE_2 branch: `git checkout -b fase-2-conversations`
3. [ ] Set up development environment
4. [ ] Start with conversation_feedback (easiest win)

### Week 1 Goals
- [ ] Feedback system live in production
- [ ] Memory extraction running nightly
- [ ] At least 3/13 tables active

---

## 📝 Notes

- **Progressive Deployment:** Each feature can be deployed independently
- **Backward Compatible:** Existing conversations continue working
- **User Testing:** Get feedback from PLMJ users after Week 1
- **Performance:** Monitor database query times as data grows

---

**Next Steps After FASE 2:**
- FASE 3: Landing Pages Integration
- FASE 4: Advanced Analytics & Reporting
- FASE 5: Mobile App (future)

---

**Document Status:** Draft
**Last Updated:** 2025-10-30
**Owner:** Pedro @ Blipee
**Reviewers:** TBD
