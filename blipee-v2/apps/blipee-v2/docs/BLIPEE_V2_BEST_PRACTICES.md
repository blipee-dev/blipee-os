# Blipee V2 - Best Practices (Vercel + Supabase)

**Baseado nas documentações oficiais do Vercel e Supabase (Outubro 2025)**

---

## 🎯 Princípios Fundamentais

### 1. **Server-First Architecture**
- **Server Components** por padrão (melhor performance, menor JS no cliente)
- **Client Components** apenas quando necessário (interatividade, hooks)
- **Data fetching** direto em Server Components (não API routes)

### 2. **Unified Data Layer**
- **Supabase RLS** como camada de segurança (auth no DB level)
- **Single Supabase client** por contexto (evita duplicação)
- **Deduplicação automática** com React `cache()`

### 3. **API Minimization**
- **Server Actions** para mutations (não API routes)
- **Route Handlers** APENAS para: webhooks, streaming, third-party
- **Parallel fetching** com `Promise.all`

---

## 🔐 Autenticação com Supabase SSR

### Instalação

```bash
npm install @supabase/supabase-js @supabase/ssr
```

### 3 Tipos de Clientes Supabase

#### 1. Client Component Client (`utils/supabase/client.ts`)

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

#### 2. Server Component Client (`utils/supabase/server.ts`)

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component - can't set cookies
          }
        },
      },
    }
  )
}
```

#### 3. Middleware Client (`utils/supabase/middleware.ts`)

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // CRITICAL: Refresh session
  const { data: { user } } = await supabase.auth.getUser()

  return supabaseResponse
}
```

### Middleware (`middleware.ts`)

```typescript
import { updateSession } from '@/utils/supabase/middleware'
import { type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes that don't need auth
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

---

## 🚫 NUNCA Faça Isso

### ❌ Não use `getSession()` em Server Components

```typescript
// ❌ ERRADO - pode ser spoofed
const { data: { session } } = await supabase.auth.getSession()
```

```typescript
// ✅ CORRETO - sempre valida no servidor
const { data: { user } } = await supabase.auth.getUser()
```

### ❌ Não crie API routes para mutations simples

```typescript
// ❌ ERRADO - API route desnecessária
// app/api/posts/create/route.ts
export async function POST(request: Request) {
  const body = await request.json()
  // ... criar post
}
```

```typescript
// ✅ CORRETO - Server Action
// app/actions/posts.ts
'use server'

export async function createPost(formData: FormData) {
  const supabase = await createClient()
  // ... criar post
  revalidatePath('/posts')
}
```

### ❌ Não faça fetching sequencial

```typescript
// ❌ ERRADO - requests sequenciais
const artist = await getArtist(id)
const albums = await getAlbums(id) // espera artist terminar
```

```typescript
// ✅ CORRETO - requests paralelos
const [artist, albums] = await Promise.all([
  getArtist(id),
  getAlbums(id)
])
```

---

## ✅ Arquitetura Otimizada

### Data Fetching: Server Components

```typescript
// app/dashboard/carbon/page.tsx
import { createClient } from '@/utils/supabase/server'
import { cache } from 'react'

// Deduplica automaticamente chamadas idênticas no mesmo render
const getCarbonData = cache(async (userId: string) => {
  const supabase = await createClient()

  // RLS garante que só vê seus dados
  const { data } = await supabase
    .from('carbon_metrics')
    .select('*')
    .eq('user_id', userId) // Sempre filtrar explicitamente!

  return data
})

export default async function CarbonDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/signin')
  }

  // Fetch paralelo de múltiplos dados
  const [carbonData, targets, initiatives] = await Promise.all([
    getCarbonData(user.id),
    getTargets(user.id),
    getInitiatives(user.id),
  ])

  return (
    <div>
      <CarbonMetrics data={carbonData} />
      <Suspense fallback={<LoadingSkeleton />}>
        <CarbonCharts data={carbonData} />
      </Suspense>
    </div>
  )
}
```

### Mutations: Server Actions

```typescript
// app/actions/carbon.ts
'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createCarbonEntry(formData: FormData) {
  const supabase = await createClient()

  // Validação
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  const value = formData.get('value')
  const category = formData.get('category')

  // RLS protege automaticamente
  const { error } = await supabase
    .from('carbon_metrics')
    .insert({
      user_id: user.id,
      value,
      category,
    })

  if (error) {
    return { error: error.message }
  }

  // Revalidar cache
  revalidatePath('/dashboard/carbon')

  // Opcional: redirect
  // redirect('/dashboard/carbon')

  return { success: true }
}
```

### Client Component com Server Action

```typescript
// components/dashboard/CarbonEntryForm.tsx
'use client'

import { createCarbonEntry } from '@/app/actions/carbon'
import { useActionState } from 'react'

export function CarbonEntryForm() {
  const [state, action, pending] = useActionState(createCarbonEntry, null)

  return (
    <form action={action}>
      <input name="value" type="number" required />
      <input name="category" type="text" required />

      <button type="submit" disabled={pending}>
        {pending ? 'Saving...' : 'Save Entry'}
      </button>

      {state?.error && (
        <div className="error">{state.error}</div>
      )}
    </form>
  )
}
```

---

## 🗄️ Database: Row Level Security (RLS)

### Sempre Habilitar RLS

```sql
-- Habilitar RLS em TODAS as tabelas públicas
ALTER TABLE carbon_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE energy_metrics ENABLE ROW LEVEL SECURITY;
```

### Policies Otimizadas

```sql
-- ✅ Policy otimizada para SELECT
CREATE POLICY "Users can view own data"
  ON carbon_metrics
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- ✅ Policy otimizada para INSERT
CREATE POLICY "Users can insert own data"
  ON carbon_metrics
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- ✅ Policy otimizada para UPDATE
CREATE POLICY "Users can update own data"
  ON carbon_metrics
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- ✅ Policy otimizada para DELETE
CREATE POLICY "Users can delete own data"
  ON carbon_metrics
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);
```

### Performance: Indexes

```sql
-- Index na coluna usada em policies
CREATE INDEX carbon_metrics_user_id_idx ON carbon_metrics(user_id);
CREATE INDEX water_metrics_user_id_idx ON water_metrics(user_id);
CREATE INDEX energy_metrics_user_id_idx ON energy_metrics(user_id);
```

### Security Definer Functions (para joins complexos)

```sql
-- Function para verificar se user tem acesso a organization
CREATE OR REPLACE FUNCTION user_has_org_access(org_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
    AND user_id = auth.uid()
  );
$$;

-- Policy usando a function
CREATE POLICY "Users can view organization data"
  ON organization_metrics
  FOR SELECT
  TO authenticated
  USING ((SELECT user_has_org_access(organization_id)));
```

---

## 📊 Otimização de APIs

### Estratégia: Unificar e Reutilizar

#### ❌ ANTES (múltiplas APIs)

```
/api/dashboard/carbon/metrics
/api/dashboard/carbon/targets
/api/dashboard/carbon/initiatives
/api/dashboard/energy/metrics
/api/dashboard/energy/consumption
/api/dashboard/water/metrics
```

#### ✅ DEPOIS (Server Components + RLS)

```typescript
// Sem API routes! Fetching direto em Server Components

// app/dashboard/carbon/page.tsx
const metrics = await getDashboardMetrics(user.id, 'carbon')

// app/dashboard/energy/page.tsx
const metrics = await getDashboardMetrics(user.id, 'energy')

// app/dashboard/water/page.tsx
const metrics = await getDashboardMetrics(user.id, 'water')

// lib/dashboard/metrics.ts
export const getDashboardMetrics = cache(async (userId: string, category: string) => {
  const supabase = await createClient()

  // Single query com RLS
  const { data } = await supabase
    .from('sustainability_metrics')
    .select('*')
    .eq('user_id', userId)
    .eq('category', category)
    .order('created_at', { ascending: false })
    .limit(100)

  return data
})
```

### Quando Usar Route Handlers

**APENAS para:**

1. **Webhooks** (third-party callbacks)
2. **Streaming** (SSE, real-time)
3. **File uploads** (multipart/form-data)
4. **OAuth callbacks** (third-party auth)

```typescript
// app/api/webhooks/stripe/route.ts
export async function POST(request: Request) {
  const signature = request.headers.get('stripe-signature')
  // ... webhook handling
}

// app/api/chat/stream/route.ts
export async function POST(request: Request) {
  const stream = new ReadableStream({
    // ... streaming response
  })
  return new Response(stream)
}
```

---

## 🎨 Layouts e Route Groups

### Estrutura Otimizada

```
app/
├── (marketing)/          # Layout público
│   ├── layout.tsx        # Navbar + Footer
│   ├── about/
│   └── pricing/
│
├── (auth)/               # Layout clean
│   ├── layout.tsx        # Sem navbar
│   ├── signin/
│   └── signup/
│
├── (dashboard)/          # Layout protegido
│   ├── layout.tsx        # Sidebar + Navbar
│   ├── carbon/
│   │   └── page.tsx      # Server Component
│   ├── energy/
│   └── water/
│
├── actions/              # Server Actions centralizados
│   ├── auth.ts
│   ├── carbon.ts
│   └── dashboard.ts
│
└── api/                  # APENAS webhooks/streaming
    ├── webhooks/
    └── chat/
```

### Dashboard Layout com Auth

```typescript
// app/(dashboard)/layout.tsx
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { Navbar } from '@/components/dashboard/Navbar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/signin')
  }

  return (
    <div className="dashboard-layout">
      <Navbar user={user} />
      <Sidebar />
      <main>{children}</main>
    </div>
  )
}
```

---

## ⚡ Performance Checklist

### Server Components
- ✅ Use Server Components por padrão
- ✅ Client Components apenas quando necessário
- ✅ Async/await direto em Server Components
- ✅ Parallel fetching com `Promise.all`
- ✅ React `cache()` para deduplicação

### Supabase
- ✅ RLS habilitado em todas as tabelas públicas
- ✅ Indexes nas colunas de policies
- ✅ `auth.uid()` wrapped em `(select auth.uid())`
- ✅ Filtros explícitos em todas as queries
- ✅ Security definer functions para joins complexos

### Caching
- ✅ `revalidatePath()` após mutations
- ✅ `revalidateTag()` para granularidade
- ✅ React `cache()` para fetch deduplication
- ✅ Supabase query filters sempre presentes

### Auth
- ✅ Middleware para token refresh
- ✅ `getUser()` (NUNCA `getSession()`)
- ✅ JWT expiration: 1 hour (padrão)
- ✅ RLS policies com `TO authenticated`

---

## 📝 API Design Patterns

### Pattern 1: Unified Dashboard API

```typescript
// lib/api/dashboard.ts
import { createClient } from '@/utils/supabase/server'
import { cache } from 'react'

export type MetricCategory = 'carbon' | 'energy' | 'water' | 'waste'

export const getDashboardData = cache(async (
  userId: string,
  category: MetricCategory,
  startDate?: Date,
  endDate?: Date
) => {
  const supabase = await createClient()

  let query = supabase
    .from('sustainability_metrics')
    .select(`
      *,
      targets (*),
      initiatives (*)
    `)
    .eq('user_id', userId)
    .eq('category', category)

  if (startDate) {
    query = query.gte('created_at', startDate.toISOString())
  }

  if (endDate) {
    query = query.lte('created_at', endDate.toISOString())
  }

  const { data, error } = await query

  if (error) throw error

  return data
})
```

### Pattern 2: Unified Mutation Handler

```typescript
// app/actions/dashboard.ts
'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createMetric(
  category: MetricCategory,
  formData: FormData
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('sustainability_metrics')
    .insert({
      user_id: user.id,
      category,
      value: formData.get('value'),
      unit: formData.get('unit'),
      date: formData.get('date'),
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/dashboard/${category}`)
  return { success: true }
}
```

---

## 🔒 Security Best Practices

### 1. Sempre validar user em Server Actions

```typescript
'use server'

export async function protectedAction() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  // ... rest of action
}
```

### 2. RLS policies com role específico

```sql
-- Apenas para authenticated users
CREATE POLICY "policy_name"
  ON table_name
  FOR SELECT
  TO authenticated  -- Não public!
  USING (auth.uid() = user_id);
```

### 3. Nunca confiar em dados do cliente

```typescript
// ❌ ERRADO - user_id do cliente
const userId = formData.get('user_id')

// ✅ CORRETO - user_id do token
const { data: { user } } = await supabase.auth.getUser()
const userId = user.id
```

### 4. MFA enforcement para ações sensíveis

```sql
CREATE POLICY "require_mfa_for_delete"
  ON sensitive_data
  FOR DELETE
  TO authenticated
  USING (
    (auth.jwt()->>'aal') = 'aal2'  -- MFA required
    AND auth.uid() = user_id
  );
```

---

## 📦 Resumo da Arquitetura

### Data Flow

```
User Request
    ↓
Middleware (refresh tokens)
    ↓
Server Component (fetch data with RLS)
    ↓
Render HTML
    ↓
Client Hydration (minimal JS)
    ↓
User Interaction (form submission)
    ↓
Server Action (mutation with RLS)
    ↓
Revalidate Cache
    ↓
Re-render Component
```

### File Structure

```
src/
├── app/
│   ├── (marketing)/       # Public pages
│   ├── (auth)/            # Auth pages
│   ├── (dashboard)/       # Protected pages
│   └── actions/           # Server Actions
│
├── components/
│   ├── blipee/            # Design system
│   ├── dashboard/         # Dashboard components
│   └── marketing/         # Marketing components
│
├── lib/
│   ├── api/               # Data fetching functions
│   │   └── dashboard.ts   # Unified dashboard API
│   └── utils/
│       └── supabase/      # Supabase clients
│
└── utils/
    └── supabase/
        ├── client.ts      # Browser client
        ├── server.ts      # Server client
        └── middleware.ts  # Middleware client
```

---

## 🎯 Próximos Passos

1. ✅ Setup Supabase clients (3 tipos)
2. ✅ Configure middleware para token refresh
3. ✅ Enable RLS em todas as tabelas
4. ✅ Create policies otimizadas
5. ✅ Add indexes nas colunas de policies
6. ✅ Migrate API routes para Server Actions
7. ✅ Implement unified dashboard data fetching
8. ✅ Add React cache() para deduplication
9. ✅ Configure revalidation strategies

---

**Resultado esperado:**
- ⚡ **Performance**: ~70% menos API calls
- 🔒 **Security**: Auth no DB level com RLS
- 🛠️ **Manutenção**: 50% menos código
- 💰 **Custo**: Menor uso de compute e database
