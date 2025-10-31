# Plano: Implementar 100% do Sistema de Conversações 💬

**Data**: 2025-10-30
**Objetivo**: Ativar todas as 13 tabelas de conversação
**Foco**: Sistema de conversações apenas (não todo o Blipee OS)

---

## Estado Atual vs Objetivo

### ✅ Ativas (2/13 = 15%)

| Tabela | Registos | Frontend | Backend |
|--------|----------|----------|---------|
| **conversations** | 42 | ✅ | ✅ |
| **messages** | 267 | ✅ | ✅ |

### ❌ Inativas (11/13 = 85%)

| Tabela | Registos | Schema | Implementação Necessária |
|--------|----------|--------|--------------------------|
| **conversation_memories** | 0 | ✅ | Backend job + UI |
| **conversation_contexts** | 0 | ✅ | Backend logic |
| **conversation_state** | 0 | ✅ | Backend logic + UI |
| **conversation_analytics** | 0 | ✅ | Backend job + Dashboard |
| **ai_conversation_analytics** | 0 | ✅ | Backend job + Dashboard |
| **conversation_feedback** | 0 | ✅ | UI components |
| **chat_attachments** | 0 | ✅ | Upload UI + Storage |
| **chat_shares** | 0 | ✅ | Share UI + Public page |
| **message_votes** | 0 | ✅ | Vote UI |
| **conversation_preferences** | 0 | ✅ | Settings UI |
| **conversation_memory** | 0 | ✅ | Backend logic |

---

## Plano de Implementação (3 Semanas)

### **SEMANA 1: Feedback & Memória**

#### 1. Conversation Feedback (2 dias)

**Backend**: Já funciona (trigger existe)
**Frontend**: Criar UI

```typescript
// src/components/chat/MessageFeedback.tsx
export function MessageFeedback({ messageId, messageIndex, conversationId }) {
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  const handleFeedback = async (type: 'up' | 'down') => {
    await supabase.from('conversation_feedback').insert({
      conversation_id: conversationId,
      message_index: messageIndex,
      user_id: user.id,
      organization_id: org.id,
      feedback_type: type === 'up' ? 'thumbs_up' : 'thumbs_down',
      feedback_value: { rating: type === 'up' ? 5 : 1 }
    });
    setFeedback(type);
  };

  return (
    <div className="flex gap-2">
      <button onClick={() => handleFeedback('up')}>
        👍 {feedback === 'up' && '✓'}
      </button>
      <button onClick={() => handleFeedback('down')}>
        👎 {feedback === 'down' && '✓'}
      </button>
    </div>
  );
}
```

**Onde usar**: Após cada mensagem do assistant/agent

**Deliverable**: Thumbs up/down funcional em todas as mensagens

---

#### 2. Conversation Memories (3 dias)

**Backend**: Criar job de extração

```typescript
// src/workers/jobs/extract-conversation-memories.ts
export async function extractConversationMemories(conversationId: string) {
  // 1. Buscar todas as mensagens da conversação
  const { data: messages } = await supabase
    .from('messages')
    .select('content, role')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  // 2. Se <5 mensagens, skip
  if (messages.length < 5) return;

  // 3. Usar AI para extrair memórias
  const conversation = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');

  const prompt = `Analyze this conversation and extract:
- title: Short title for the conversation
- summary: 2-3 sentence summary
- key_topics: Array of main topics discussed
- entities: Array of {type, name, description} for important entities (people, places, concepts)
- sentiment: {positive: 0-1, neutral: 0-1, negative: 0-1}
- preferences: User preferences learned

Conversation:
${conversation}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' }
  });

  const analysis = JSON.parse(response.choices[0].message.content);

  // 4. Guardar memória
  await supabase.from('conversation_memories').insert({
    organization_id: conv.organization_id,
    user_id: conv.user_id,
    title: analysis.title,
    summary: analysis.summary,
    key_topics: analysis.key_topics,
    entities: analysis.entities,
    sentiment: analysis.sentiment,
    preferences: analysis.preferences,
    metadata: {
      conversation_id: conversationId,
      message_count: messages.length
    }
  });
}
```

**Trigger**: Executar quando:
- Conversação termina (user fecha)
- Após 10+ mensagens trocadas
- Ou manualmente (botão "Save Memory")

**Frontend**: Mostrar memórias

```typescript
// src/components/chat/ConversationMemories.tsx
export function ConversationMemories({ userId }) {
  const { data: memories } = useQuery({
    queryKey: ['memories', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('conversation_memories')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);
      return data;
    }
  });

  return (
    <div className="space-y-4">
      {memories?.map(memory => (
        <div key={memory.id} className="border rounded-lg p-4">
          <h3 className="font-bold">{memory.title}</h3>
          <p className="text-sm text-gray-600">{memory.summary}</p>
          <div className="flex gap-2 mt-2">
            {memory.key_topics.map(topic => (
              <span key={topic} className="badge">{topic}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

**Deliverable**: Memórias extraídas automaticamente + UI para visualizar

---

### **SEMANA 2: Context, State & Attachments**

#### 3. Conversation Contexts (2 dias)

**Backend**: Carregar contexto ao iniciar conversação

```typescript
// src/lib/ai/context-manager.ts
export async function loadRelevantContext(userId: string, query: string) {
  // 1. Buscar memórias relevantes do utilizador
  const { data: memories } = await supabase
    .from('conversation_memories')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(5);

  // 2. Calcular relevância (pode usar embeddings depois)
  // Por agora, usar as 3 mais recentes
  const relevantMemories = memories.slice(0, 3);

  // 3. Criar contexto
  const context = {
    user_preferences: {},
    recent_topics: [],
    entities_known: [],
    conversation_history: []
  };

  relevantMemories.forEach(mem => {
    context.recent_topics.push(...mem.key_topics);
    context.entities_known.push(...mem.entities);
    Object.assign(context.user_preferences, mem.preferences);
  });

  // 4. Guardar contexto temporário
  await supabase.from('conversation_contexts').insert({
    conversation_id: newConversationId,
    organization_id: orgId,
    user_id: userId,
    context_data: context,
    relevance_score: 0.8,
    token_estimate: JSON.stringify(context).length / 4,
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h
  });

  return context;
}
```

**Usar em**: System prompt ao iniciar nova conversação

**Deliverable**: Contexto carregado automaticamente em novas conversas

---

#### 4. Conversation State (1 dia)

**Use case**: Wizard flows, form progress

```typescript
// src/lib/ai/conversation-state.ts
export async function saveConversationState(
  conversationId: string,
  stateType: string,
  stateValue: any
) {
  await supabase.from('conversation_state').upsert({
    conversation_id: conversationId,
    user_id: user.id,
    organization_id: org.id,
    state_type: stateType,
    state_value: stateValue,
    confidence: 1.0
  });
}

export async function getConversationState(conversationId: string, stateType: string) {
  const { data } = await supabase
    .from('conversation_state')
    .select('*')
    .eq('conversation_id', conversationId)
    .eq('state_type', stateType)
    .single();

  return data?.state_value;
}
```

**Exemplo de uso**: Onboarding wizard

```typescript
// Agent mantém track do passo atual
await saveConversationState(convId, 'onboarding_step', { step: 3, completed_steps: [1, 2] });
```

**Deliverable**: State management funcional para wizards

---

#### 5. Chat Attachments (2 dias)

**Backend**: Upload para Supabase Storage

```typescript
// src/components/chat/FileUpload.tsx
export function FileUpload({ conversationId, onUpload }) {
  const handleFileUpload = async (file: File) => {
    // 1. Upload para Supabase Storage
    const fileName = `${conversationId}/${Date.now()}_${file.name}`;
    const { data: uploadData, error } = await supabase.storage
      .from('chat-attachments')
      .upload(fileName, file);

    if (error) throw error;

    // 2. Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('chat-attachments')
      .getPublicUrl(fileName);

    // 3. Registar em chat_attachments
    await supabase.from('chat_attachments').insert({
      conversation_id: conversationId,
      message_id: null, // ou messageId se for attachment de mensagem específica
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      file_url: publicUrl,
      uploaded_by: user.id,
      metadata: {
        original_name: file.name,
        mime_type: file.type
      }
    });

    onUpload(publicUrl);
  };

  return (
    <input
      type="file"
      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
    />
  );
}
```

**Storage Bucket**: Criar bucket `chat-attachments` no Supabase

**Deliverable**: Upload de ficheiros funcional

---

### **SEMANA 3: Analytics, Sharing & Voting**

#### 6. Conversation Analytics (2 dias)

**Backend**: Job diário de agregação

```typescript
// src/workers/jobs/aggregate-conversation-analytics.ts
import { CronJob } from 'cron';

export const conversationAnalyticsJob = new CronJob(
  '0 2 * * *', // Todos os dias às 02:00 UTC
  async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    // Para cada utilizador com conversações ontem
    const { data: users } = await supabase
      .from('conversations')
      .select('user_id, organization_id')
      .gte('created_at', yesterday.toISOString())
      .lt('created_at', new Date().toISOString());

    const uniqueUsers = [...new Set(users.map(u => u.user_id))];

    for (const userId of uniqueUsers) {
      const orgId = users.find(u => u.user_id === userId)?.organization_id;

      // Calcular métricas
      const { data: convs } = await supabase
        .from('conversations')
        .select('id, message_count')
        .eq('user_id', userId)
        .gte('created_at', yesterday.toISOString())
        .lt('created_at', new Date().toISOString());

      const { data: msgs } = await supabase
        .from('messages')
        .select('conversation_id')
        .in('conversation_id', convs.map(c => c.id));

      const avgLength = convs.reduce((sum, c) => sum + c.message_count, 0) / convs.length;

      // Guardar analytics
      await supabase.from('conversation_analytics').upsert({
        organization_id: orgId,
        user_id: userId,
        date: yesterday.toISOString().split('T')[0],
        total_conversations: convs.length,
        total_messages: msgs.length,
        avg_conversation_length: avgLength,
        top_topics: [], // Extrair das memórias
        sentiment_distribution: {}, // Calcular
        ai_provider_usage: { 'gpt-4o': convs.length },
        response_times: {},
        user_satisfaction_score: null
      });
    }
  }
);
```

**Frontend**: Dashboard

```typescript
// src/components/analytics/ConversationAnalyticsDashboard.tsx
export function ConversationAnalyticsDashboard({ userId }) {
  const { data: analytics } = useQuery({
    queryKey: ['conv-analytics', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('conversation_analytics')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(30);
      return data;
    }
  });

  return (
    <div className="grid grid-cols-2 gap-4">
      <MetricCard
        title="Total Conversations"
        value={analytics?.reduce((sum, a) => sum + a.total_conversations, 0)}
      />
      <MetricCard
        title="Total Messages"
        value={analytics?.reduce((sum, a) => sum + a.total_messages, 0)}
      />
      <MetricCard
        title="Avg Conversation Length"
        value={analytics?.[0]?.avg_conversation_length?.toFixed(1)}
      />
      <MetricCard
        title="Satisfaction Score"
        value={analytics?.[0]?.user_satisfaction_score || 'N/A'}
      />

      <div className="col-span-2">
        <LineChart data={analytics} xKey="date" yKey="total_conversations" />
      </div>
    </div>
  );
}
```

**Deliverable**: Analytics agregadas diariamente + Dashboard

---

#### 7. AI Conversation Analytics (1 dia)

**Backend**: Análise individual de conversações

```typescript
// Trigger: Quando conversação termina
async function analyzeConversation(conversationId: string) {
  const { data: conv } = await supabase
    .from('conversations')
    .select('*, messages(*)')
    .eq('id', conversationId)
    .single();

  // Usar AI para analisar
  const analysis = await analyzeWithAI(conv.messages);

  await supabase.from('ai_conversation_analytics').insert({
    organization_id: conv.organization_id,
    conversation_id: conversationId,
    message_count: conv.messages.length,
    avg_response_time_ms: calculateAvgResponseTime(conv.messages),
    topics_discussed: analysis.topics,
    common_intents: analysis.intents,
    conversation_metadata: {
      satisfaction_signals: analysis.satisfaction,
      user_sentiment: analysis.sentiment
    }
  });
}
```

**Deliverable**: Análise AI individual de conversações

---

#### 8. Chat Shares (1 dia)

**Backend**: Gerar share token

```typescript
// src/lib/chat-sharing.ts
export async function shareConversation(conversationId: string, options: {
  expiresIn?: number; // days
  permissions?: 'read_only' | 'can_comment';
}) {
  const shareToken = crypto.randomUUID();
  const expiresAt = options.expiresIn
    ? new Date(Date.now() + options.expiresIn * 24 * 60 * 60 * 1000)
    : null;

  await supabase.from('chat_shares').insert({
    conversation_id: conversationId,
    shared_by: user.id,
    share_token: shareToken,
    expires_at: expiresAt,
    permissions: { level: options.permissions || 'read_only' }
  });

  return `https://blipee.com/shared/${shareToken}`;
}
```

**Frontend**: Página pública de share

```typescript
// src/app/shared/[token]/page.tsx
export default async function SharedConversationPage({ params }) {
  const { token } = params;

  // Buscar share
  const { data: share } = await supabase
    .from('chat_shares')
    .select('*, conversations(*, messages(*))')
    .eq('share_token', token)
    .single();

  if (!share || (share.expires_at && new Date(share.expires_at) < new Date())) {
    return <div>Share expired or not found</div>;
  }

  return (
    <div>
      <h1>Shared Conversation</h1>
      <ChatView
        conversation={share.conversations}
        readOnly={share.permissions.level === 'read_only'}
      />
    </div>
  );
}
```

**Deliverable**: Sharing de conversações funcional

---

#### 9. Message Votes (1 dia)

**Frontend**: UI de voting

```typescript
// src/components/chat/MessageVote.tsx
export function MessageVote({ messageId }) {
  const [vote, setVote] = useState<'upvote' | 'downvote' | null>(null);
  const [voteCount, setVoteCount] = useState(0);

  useEffect(() => {
    // Carregar votos existentes
    supabase
      .from('message_votes')
      .select('vote_type')
      .eq('message_id', messageId)
      .then(({ data }) => {
        const upvotes = data?.filter(v => v.vote_type === 'upvote').length || 0;
        const downvotes = data?.filter(v => v.vote_type === 'downvote').length || 0;
        setVoteCount(upvotes - downvotes);
      });
  }, [messageId]);

  const handleVote = async (type: 'upvote' | 'downvote') => {
    // Remover voto anterior se existir
    await supabase
      .from('message_votes')
      .delete()
      .eq('message_id', messageId)
      .eq('user_id', user.id);

    // Adicionar novo voto
    await supabase.from('message_votes').insert({
      message_id: messageId,
      user_id: user.id,
      vote_type: type
    });

    setVote(type);
    setVoteCount(prev => type === 'upvote' ? prev + 1 : prev - 1);
  };

  return (
    <div className="flex items-center gap-2">
      <button onClick={() => handleVote('upvote')}>⬆️</button>
      <span>{voteCount}</span>
      <button onClick={() => handleVote('downvote')}>⬇️</button>
    </div>
  );
}
```

**Deliverable**: Voting em mensagens funcional

---

#### 10. Conversation Preferences (1 dia)

**Frontend**: Settings UI

```typescript
// src/components/settings/ConversationPreferences.tsx
export function ConversationPreferences() {
  const [prefs, setPrefs] = useState({
    notifications: {
      email: true,
      push: false,
      slack: false
    },
    ui: {
      theme: 'light',
      compact_mode: false,
      show_timestamps: true
    },
    ai: {
      model: 'gpt-4o',
      temperature: 0.7,
      max_tokens: 2000
    }
  });

  const savePreferences = async () => {
    await supabase.from('conversation_preferences').upsert({
      user_id: user.id,
      organization_id: org.id,
      preferences: prefs,
      notification_settings: prefs.notifications,
      ui_settings: prefs.ui
    });
  };

  return (
    <div className="space-y-6">
      <Section title="Notifications">
        <Toggle label="Email" checked={prefs.notifications.email} />
        <Toggle label="Push" checked={prefs.notifications.push} />
        <Toggle label="Slack" checked={prefs.notifications.slack} />
      </Section>

      <Section title="UI">
        <Select label="Theme" options={['light', 'dark', 'auto']} />
        <Toggle label="Compact mode" />
      </Section>

      <Section title="AI Model">
        <Select label="Model" options={['gpt-4o', 'claude-3-5-sonnet']} />
        <Slider label="Temperature" min={0} max={2} step={0.1} />
      </Section>

      <Button onClick={savePreferences}>Save Preferences</Button>
    </div>
  );
}
```

**Deliverable**: UI de preferências funcional

---

## Resumo de Entregas

### Semana 1
- ✅ Feedback UI (thumbs up/down)
- ✅ Memory extraction automática
- ✅ Memory viewer UI

### Semana 2
- ✅ Context loading automático
- ✅ Conversation state management
- ✅ File upload funcional

### Semana 3
- ✅ Analytics agregadas (job diário)
- ✅ Analytics dashboard
- ✅ Conversation sharing
- ✅ Message voting
- ✅ Preferences UI

---

## Checklist de Implementação

**Backend**:
- [ ] Memory extraction job
- [ ] Context loader
- [ ] Analytics aggregation job
- [ ] File upload handler
- [ ] Share token generator
- [ ] Cron jobs setup (Railway)

**Frontend**:
- [ ] Feedback buttons em mensagens
- [ ] Memory viewer page
- [ ] File upload component
- [ ] Analytics dashboard
- [ ] Share conversation modal
- [ ] Vote buttons
- [ ] Preferences page

**Database**:
- [ ] Criar bucket `chat-attachments` no Supabase Storage
- [ ] Verificar RLS policies em todas as tabelas
- [ ] Criar índices adicionais se necessário

**Testing**:
- [ ] Testar feedback flow completo
- [ ] Testar memory extraction
- [ ] Testar file uploads (vários tipos)
- [ ] Testar sharing (público vs privado)
- [ ] Testar analytics job
- [ ] Load testing (muitas conversações simultâneas)

---

## Métricas de Sucesso

Após 1 mês de implementação:

| Métrica | Target |
|---------|--------|
| **Feedback rate** | >50% mensagens têm feedback |
| **Memories extracted** | >100 memórias guardadas |
| **Files uploaded** | >20% conversações com attachments |
| **Conversations shared** | >5% conversações partilhadas |
| **User satisfaction** | ≥4.5/5 (via feedback) |
| **Analytics coverage** | 100% utilizadores com analytics |
| **Preferences set** | >80% utilizadores configuram preferências |

---

## Próximos Passos Imediatos

### Hoje
1. Setup do projeto:
   - Criar branch `feature/conversations-100`
   - Criar tasks no Jira/Linear
   - Criar bucket Supabase Storage

2. Começar Semana 1:
   - Implementar `MessageFeedback` component
   - Testar inserção em `conversation_feedback`

### Amanhã
1. Continuar Feedback UI
2. Começar memory extraction job
3. Setup OpenAI para análise de conversações

### Esta Semana
1. Completar Semana 1 (Feedback + Memories)
2. Deploy para staging
3. User testing interno

---

## Custos Estimados

**OpenAI API** (memory extraction):
- ~500 tokens por conversação
- ~$0.01 por conversação
- 100 conversações/dia = $1/dia = $30/mês

**Supabase Storage**:
- 1GB grátis
- $0.021/GB depois
- Estimativa: 10GB/mês = $0.21/mês

**Total adicional**: ~$30/mês (principalmente OpenAI)

---

## Perguntas?

1. Queres começar pela Semana 1 (Feedback + Memories)?
2. Há alguma feature específica que queres priorizar?
3. Preferes implementação incremental (uma feature de cada vez) ou em paralelo?

**Ready to ship! 🚀**
