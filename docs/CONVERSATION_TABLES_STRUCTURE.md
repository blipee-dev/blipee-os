# Estrutura das Tabelas de Conversação 💬

**Data**: 2025-10-30
**Status**: Documentação Completa
**Base de Dados**: Supabase PostgreSQL (Produção)

---

## Executive Summary

Sistema completo de conversações implementado com 13 tabelas interligadas para suportar:
- ✅ **Chat com utilizadores** (42 conversações, 267 mensagens)
- ✅ **Agentes autónomos proativos** (1 conversação ativa do Autonomous Optimizer)
- ✅ **Analytics e métricas** de conversação
- ✅ **Memória contextual** e aprendizagem
- ✅ **Feedback** de utilizadores
- ✅ **Attachments** e partilha

---

## 1. Tabelas Principais de Conversação

### 1.1 `conversations` - Conversações

**Propósito**: Tabela principal que armazena todas as conversações (user chat e agent proactive)

**Schema**:
```sql
id                     uuid PRIMARY KEY
organization_id        uuid NOT NULL → organizations(id)
user_id                uuid NOT NULL → user_profiles(id)
parent_conversation_id uuid → conversations(id)
title                  varchar(500)
summary                text
context_type           varchar(100)
context_entities       uuid[]
status                 conversation_status (active/archived/deleted)
tags                   text[]
metadata               jsonb

-- AI Configuration
model                  text DEFAULT 'gpt-4o'
temperature            numeric(3,2) DEFAULT 0.7
max_tokens             integer DEFAULT 2000
system_prompt          text

-- Management
type                   text DEFAULT 'user_chat'  -- 'user_chat' | 'agent_proactive' | 'system'
is_archived            boolean DEFAULT false
is_pinned              boolean DEFAULT false

-- Metrics
message_count          integer DEFAULT 0
total_tokens_used      integer DEFAULT 0
total_cost_usd         numeric(10,4) DEFAULT 0

-- Relationships
building_id            uuid → buildings(id)

-- Timestamps
created_at             timestamptz DEFAULT now()
updated_at             timestamptz DEFAULT now()
last_message_at        timestamptz
```

**Índices Importantes**:
- `idx_conversations_org_user` - Para queries por organização e utilizador
- `idx_conversations_recent` - Para listar conversações recentes
- `idx_conversations_type` - Para filtrar por tipo (user_chat vs agent_proactive)
- `idx_conversations_is_archived` - Para listar conversações ativas

**Constraints**:
- `temperature` entre 0.00 e 2.00
- `max_tokens` entre 1 e 128,000
- `type` deve ser: 'user_chat', 'agent_proactive', ou 'system'

**Dados Atuais** (produção):
- **42 conversações totais**
  - 41 `user_chat` (active)
  - 1 `agent_proactive` (active) - "Autonomous Optimizer ⚡"
- **1 organização**
- **1 utilizador**

---

### 1.2 `messages` - Mensagens

**Propósito**: Armazena todas as mensagens dentro das conversações

**Schema**:
```sql
id                uuid PRIMARY KEY
conversation_id   uuid NOT NULL → conversations(id)
role              message_role NOT NULL  -- 'user' | 'assistant' | 'agent' | 'system'
content           text NOT NULL

-- AI Model Info
model             varchar(100)
prompt_tokens     integer
completion_tokens integer
total_tokens      integer
cost_usd          numeric(10,6)
latency_ms        integer
finish_reason     text

-- Function/Tool Calling
function_name     varchar(100)
function_args     jsonb
function_response jsonb
tool_calls        jsonb
tool_results      jsonb

-- UI & Metadata
ui_components     jsonb DEFAULT '[]'
parts             jsonb
metadata          jsonb DEFAULT '{}'

-- Agent Info
agent_id          text

-- Message Management
priority          text  -- 'info' | 'alert' | 'critical'
read              boolean DEFAULT false
is_edited         boolean DEFAULT false
is_regenerated    boolean DEFAULT false
parent_message_id uuid → messages(id)
streaming_enabled boolean DEFAULT true

-- Timestamps
created_at        timestamptz DEFAULT now()
updated_at        timestamptz DEFAULT now()
```

**Índices Importantes**:
- `idx_messages_conversation_created` - Para listar mensagens de uma conversação
- `idx_messages_content_fts` - Full-text search no conteúdo
- `idx_messages_agent` - Para mensagens de agentes
- `idx_messages_unread` - Para mensagens não lidas
- `idx_messages_priority` - Para priorizar alertas

**Constraints**:
- `priority` deve ser: 'info', 'alert', ou 'critical'

**Triggers**:
- `trigger_update_conversation_stats_on_message` - Atualiza contadores na tabela conversations
- `trigger_update_messages_updated_at` - Atualiza updated_at automaticamente

**Dados Atuais** (produção):
- **267 mensagens totais**
  - 139 `user` (52%)
  - 125 `assistant` (47%)
  - 3 `agent` (1%) - do optimization_agent
- **42 conversações únicas**

---

## 2. Tabelas de Memória e Contexto

### 2.1 `conversation_memories` - Memórias de Conversação

**Propósito**: Armazena memórias extraídas das conversações para contexto de longo prazo

**Schema**:
```sql
id              uuid PRIMARY KEY
organization_id uuid NOT NULL → organizations(id)
user_id         uuid NOT NULL → auth.users(id)

-- Memory Content
title           text
summary         text NOT NULL
key_topics      text[] DEFAULT '{}'
entities        jsonb DEFAULT '[]'

-- Analysis
sentiment       jsonb DEFAULT '{}'  -- positive/negative/neutral scores
preferences     jsonb DEFAULT '{}'  -- user preferences learned

-- Metadata
metadata        jsonb DEFAULT '{}'
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()
```

**Índices Importantes**:
- `idx_conversation_memories_key_topics` - GIN index para pesquisa em topics
- `idx_conversation_memories_entities` - GIN index para pesquisa em entidades
- `idx_conversation_memories_title_search` - Full-text search no título
- `idx_conversation_memories_summary_search` - Full-text search no resumo

**Dados Atuais**: 0 registos (funcionalidade não ativa ainda)

---

### 2.2 `conversation_contexts` - Contextos Temporários

**Propósito**: Armazena contexto temporário durante uma conversação ativa

**Schema**:
```sql
id              uuid PRIMARY KEY
conversation_id uuid NOT NULL
organization_id uuid NOT NULL → organizations(id)
user_id         uuid NOT NULL → auth.users(id)

-- Context Data
context_data    jsonb NOT NULL
relevance_score real DEFAULT 0  -- 0.0 to 1.0
token_estimate  integer DEFAULT 0

-- Lifecycle
expires_at      timestamptz DEFAULT now() + interval '1 day'
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()
```

**Índices Importantes**:
- `idx_conversation_contexts_conversation_id` - Para queries por conversação
- `idx_conversation_contexts_relevance_score` - Para ordenar por relevância
- `idx_conversation_contexts_expires_at` - Para limpeza de contextos expirados

**Dados Atuais**: 0 registos

---

### 2.3 `conversation_state` - Estado da Conversação

**Propósito**: Armazena estado temporário da conversação (ex: wizard steps, form progress)

**Schema**:
```sql
id              uuid PRIMARY KEY
conversation_id uuid NOT NULL
user_id         uuid NOT NULL → auth.users(id)
organization_id uuid NOT NULL → organizations(id)

-- State
state_type      text NOT NULL  -- ex: 'wizard_step', 'form_progress', 'filter_state'
state_value     jsonb NOT NULL
confidence      double precision DEFAULT 1.0
valid_until     timestamptz

-- Timestamps
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()
```

**Dados Atuais**: 0 registos

---

## 3. Tabelas de Feedback e Analytics

### 3.1 `conversation_feedback` - Feedback de Utilizadores

**Propósito**: Captura feedback dos utilizadores sobre mensagens específicas

**Schema**:
```sql
id               uuid PRIMARY KEY
conversation_id  uuid NOT NULL
message_index    integer NOT NULL
user_id          uuid NOT NULL → auth.users(id)
organization_id  uuid NOT NULL → organizations(id)

-- Feedback
feedback_type    text NOT NULL  -- 'thumbs_up', 'thumbs_down', 'rating', 'correction'
feedback_value   jsonb NOT NULL

-- ML Training
applied_to_model boolean DEFAULT false

created_at       timestamptz DEFAULT now()
```

**Triggers**:
- `update_preferences_on_feedback` - Atualiza preferências do utilizador automaticamente

**Dados Atuais**: 0 registos

---

### 3.2 `conversation_analytics` - Analytics Agregadas

**Propósito**: Métricas diárias agregadas por utilizador/organização

**Schema**:
```sql
id                      uuid PRIMARY KEY
organization_id         uuid NOT NULL → organizations(id)
user_id                 uuid NOT NULL → auth.users(id)
date                    date NOT NULL DEFAULT CURRENT_DATE

-- Metrics
total_conversations     integer DEFAULT 0
total_messages          integer DEFAULT 0
avg_conversation_length real DEFAULT 0
top_topics              text[]
sentiment_distribution  jsonb  -- {positive: 0.6, neutral: 0.3, negative: 0.1}
ai_provider_usage       jsonb  -- {gpt-4o: 45, claude-3: 12}
response_times          jsonb  -- {avg: 2.3, p50: 1.8, p95: 5.2}
user_satisfaction_score real

-- Timestamps
created_at              timestamptz DEFAULT now()
updated_at              timestamptz DEFAULT now()
```

**Unique Constraint**: `(organization_id, user_id, date)` - uma linha por dia por utilizador

**Dados Atuais**: 0 registos (agregação não ativa)

---

### 3.3 `ai_conversation_analytics` - Analytics de AI

**Propósito**: Analytics específicas sobre interações com AI

**Schema**:
```sql
id                      uuid PRIMARY KEY
organization_id         uuid → organizations(id)
conversation_id         uuid

-- Metrics
message_count           integer
avg_response_time_ms    integer
user_satisfaction_score numeric(3,2)
topics_discussed        text[]
common_intents          text[]
conversation_metadata   jsonb

-- Timestamps
analyzed_at             timestamptz DEFAULT now()
created_at              timestamptz DEFAULT now()
```

**Dados Atuais**: 0 registos

---

## 4. Tabelas de Attachments e Sharing

### 4.1 `chat_attachments` - Anexos

**Propósito**: Armazena ficheiros anexados às conversações/mensagens

**Schema**:
```sql
id              uuid PRIMARY KEY
conversation_id uuid → conversations(id)
message_id      uuid → messages(id)
file_name       text NOT NULL
file_type       text NOT NULL
file_size       bigint
file_url        text NOT NULL
thumbnail_url   text
metadata        jsonb
uploaded_by     uuid → auth.users(id)
created_at      timestamptz DEFAULT now()
```

**Dados Atuais**: 0 registos

---

### 4.2 `chat_shares` - Conversações Partilhadas

**Propósito**: Permite partilhar conversações com outros utilizadores

**Schema**:
```sql
id              uuid PRIMARY KEY
conversation_id uuid NOT NULL → conversations(id)
shared_by       uuid NOT NULL → auth.users(id)
shared_with     uuid → auth.users(id)  -- null = public share
share_token     text UNIQUE
expires_at      timestamptz
permissions     jsonb  -- read_only, can_comment, etc.
created_at      timestamptz DEFAULT now()
```

**Dados Atuais**: 0 registos

---

### 4.3 `message_votes` - Votos em Mensagens

**Propósito**: Sistema de votos (upvote/downvote) para mensagens

**Schema**:
```sql
id         uuid PRIMARY KEY
message_id uuid NOT NULL → messages(id)
user_id    uuid NOT NULL → auth.users(id)
vote_type  text NOT NULL  -- 'upvote' | 'downvote'
created_at timestamptz DEFAULT now()
```

**Dados Atuais**: Não verificado ainda

---

### 4.4 `conversation_preferences` - Preferências

**Propósito**: Preferências do utilizador para conversações (UI, notificações, etc.)

**Schema**: Não documentado ainda (existe mas não foi verificado em detalhe)

---

## 5. Integração com Agentes Autónomos

### 5.1 Conversações Proativas de Agentes

**Como funciona**:

1. **Agent cria conversação**:
```typescript
const { data: conversation } = await supabase
  .from('conversations')
  .insert({
    organization_id: orgId,
    user_id: userId,
    type: 'agent_proactive',  // ← Tipo especial
    title: `${agentName} 🤖`,
    model: 'gpt-4o',
    system_prompt: 'You are...',
    metadata: {
      agent_id: 'optimization_agent',
      trigger: 'anomaly_detected',
      priority: 'high'
    }
  });
```

2. **Agent adiciona mensagens**:
```typescript
await supabase
  .from('messages')
  .insert({
    conversation_id: conversationId,
    role: 'agent',  // ← Role especial para agentes
    agent_id: 'optimization_agent',
    content: 'I detected an anomaly...',
    priority: 'alert',  // 'info' | 'alert' | 'critical'
    metadata: {
      analysis_id: 'xxx',
      recommendations: [...]
    }
  });
```

3. **Utilizador responde**:
```typescript
await supabase
  .from('messages')
  .insert({
    conversation_id: conversationId,
    role: 'user',
    content: 'Tell me more...'
  });
```

4. **Agent continua conversação** através do Vercel AI SDK

---

### 5.2 Exemplo Real - Autonomous Optimizer

**Conversação Ativa**:
- **ID**: `6b001f91-97ec-4186-9fb7-35ecbcfb93e1`
- **Tipo**: `agent_proactive`
- **Título**: "Autonomous Optimizer ⚡"
- **Mensagens**: 29 total
- **Agent ID**: `optimization_agent`

**Última Mensagem do Agent** (29 Out 2025):
```
🤖 optimization_agent

I recently completed an analysis of your energy consumption patterns for
the past month and identified an unusual spike.

**Key Findings:**
Your energy consumption surged by **758.2%** compared to last month.
This is a significant increase that could indicate potential equipment
malfunctions or inefficient usage patterns. Addressing this could lead
to a potential savings of **$195.82** and reduce emissions by
approximately **652.73 kg**.

**Why It Matters:**
Such a drastic increase in energy use can inflate your operational
costs and negatively impact your sustainability goals.

**Recommended Actions:**
1. **Conduct a thorough inspection** of all equipment to identify
   any malfunctions or inefficiencies.
2. **Review operational practices** to find opportunities for more
   efficient usage.
3. **Utilize energy monitoring tools** to gain real-time insights
   moving forward.

If you need assistance in any of these areas, please don't hesitate
to reach out. I'm here to help!
```

---

## 6. Row Level Security (RLS) Policies

### Conversations
- ✅ Users can only view conversations from their organization
- ✅ Users can create/update/delete their own conversations
- ✅ Super admins bypass all restrictions

### Messages
- ✅ Users can only view messages from conversations they have access to
- ✅ Users can create messages in conversations they have access to
- ✅ Agents can insert messages with role='agent'

### Conversation Memories
- ✅ Users can only view/edit their own memories
- ✅ Admins can view memories from their organization

### Analytics
- ✅ Users can view their own analytics
- ✅ Admins/Sustainability Leads can view org-wide analytics

---

## 7. Queries Úteis

### 7.1 Listar Conversações Recentes com Contagem de Mensagens

```sql
SELECT
  c.id,
  c.type,
  c.title,
  c.message_count,
  c.total_cost_usd,
  c.last_message_at,
  c.created_at
FROM conversations c
WHERE
  c.organization_id = 'xxx'
  AND c.is_archived = false
ORDER BY c.last_message_at DESC NULLS LAST
LIMIT 20;
```

### 7.2 Obter Mensagens de uma Conversação

```sql
SELECT
  m.id,
  m.role,
  m.agent_id,
  m.content,
  m.total_tokens,
  m.cost_usd,
  m.created_at
FROM messages m
WHERE m.conversation_id = 'xxx'
ORDER BY m.created_at ASC;
```

### 7.3 Listar Conversações Proativas de Agentes

```sql
SELECT
  c.id,
  c.title,
  c.message_count,
  c.metadata->>'agent_id' as agent_id,
  c.metadata->>'trigger' as trigger,
  c.created_at
FROM conversations c
WHERE
  c.type = 'agent_proactive'
  AND c.organization_id = 'xxx'
ORDER BY c.created_at DESC;
```

### 7.4 Estatísticas de Utilização por Modelo

```sql
SELECT
  model,
  COUNT(*) as conversations,
  SUM(message_count) as total_messages,
  SUM(total_tokens_used) as total_tokens,
  SUM(total_cost_usd) as total_cost
FROM conversations
WHERE organization_id = 'xxx'
GROUP BY model
ORDER BY total_cost DESC;
```

### 7.5 Mensagens Não Lidas por Prioridade

```sql
SELECT
  m.priority,
  m.agent_id,
  COUNT(*) as unread_count
FROM messages m
WHERE
  m.read = false
  AND m.agent_id IS NOT NULL
GROUP BY m.priority, m.agent_id
ORDER BY
  CASE m.priority
    WHEN 'critical' THEN 1
    WHEN 'alert' THEN 2
    WHEN 'info' THEN 3
  END;
```

### 7.6 Analytics de Agentes (última semana)

```sql
SELECT
  m.agent_id,
  COUNT(DISTINCT m.conversation_id) as conversations,
  COUNT(*) as messages,
  COUNT(*) FILTER (WHERE m.priority = 'critical') as critical_alerts,
  COUNT(*) FILTER (WHERE m.priority = 'alert') as alerts,
  AVG(m.latency_ms) as avg_latency_ms
FROM messages m
WHERE
  m.agent_id IS NOT NULL
  AND m.created_at >= NOW() - INTERVAL '7 days'
GROUP BY m.agent_id
ORDER BY messages DESC;
```

---

## 8. Integração com Frontend

### 8.1 React Hook para Conversações

```typescript
import { useSupabase } from '@/lib/supabase';

export function useConversations(organizationId: string) {
  const supabase = useSupabase();

  // Lista conversações
  const { data: conversations } = useQuery({
    queryKey: ['conversations', organizationId],
    queryFn: async () => {
      const { data } = await supabase
        .from('conversations')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_archived', false)
        .order('last_message_at', { ascending: false });
      return data;
    }
  });

  return { conversations };
}
```

### 8.2 Real-time Subscription para Novas Mensagens

```typescript
useEffect(() => {
  const channel = supabase
    .channel('messages')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      (payload) => {
        // Adiciona nova mensagem ao estado
        setMessages(prev => [...prev, payload.new]);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [conversationId]);
```

### 8.3 Marcar Mensagens como Lidas

```typescript
async function markMessagesAsRead(conversationId: string) {
  await supabase
    .from('messages')
    .update({ read: true })
    .eq('conversation_id', conversationId)
    .eq('read', false);
}
```

---

## 9. Próximos Passos Recomendados

### 9.1 Ativar Features Não Utilizadas

1. **Conversation Memories** - Implementar extração automática de memórias
2. **Analytics Agregadas** - Job diário para popular conversation_analytics
3. **Feedback System** - UI para thumbs up/down em mensagens
4. **Attachments** - Suporte para upload de ficheiros

### 9.2 Melhorias de Performance

1. **Partitioning** - Particionar tabela `messages` por data (cresce rápido!)
2. **Archival** - Job para arquivar conversações antigas (> 6 meses)
3. **Indexing** - Adicionar índices compostos baseados em queries reais

### 9.3 Novas Features

1. **Message Branching** - Suporte para múltiplas respostas (usando parent_message_id)
2. **Conversation Templates** - Templates pré-definidos para agentes
3. **Message Reactions** - Emojis e reações em mensagens
4. **Voice Messages** - Suporte para áudio

---

## 10. Resumo do Estado Atual

| Tabela | Registos | Status | Utilização |
|--------|----------|--------|------------|
| **conversations** | 42 | ✅ Ativa | Chat utilizador + 1 agente proativo |
| **messages** | 267 | ✅ Ativa | 139 user + 125 assistant + 3 agent |
| **conversation_memories** | 0 | ⏸️ Inativa | Feature não implementada ainda |
| **conversation_contexts** | 0 | ⏸️ Inativa | Feature não implementada ainda |
| **conversation_analytics** | 0 | ⏸️ Inativa | Agregação não ativa |
| **conversation_feedback** | 0 | ⏸️ Inativa | UI não implementada ainda |
| **conversation_state** | 0 | ⏸️ Inativa | Feature não utilizada ainda |
| **ai_conversation_analytics** | 0 | ⏸️ Inativa | Análise não ativa |
| **chat_attachments** | 0 | ⏸️ Inativa | Feature não implementada |
| **chat_shares** | 0 | ⏸️ Inativa | Feature não implementada |

**✅ Sistema de conversações funcional e em produção!**

**🎯 Foco atual**: User chat + Agent proactive messages (Autonomous Optimizer)

**🚀 Potencial**: Muitas features já preparadas, só precisam de implementação frontend/backend

---

## Referências

- Tabela conversations: `public.conversations`
- Tabela messages: `public.messages`
- Base de dados: Supabase PostgreSQL (15.236.11.53:5432)
- Autenticação: Supabase Auth + RLS Policies
- Real-time: Supabase Realtime (PostgreSQL CDC)
