# Blipee V2 - Estratégia de Migração Incremental

**Compartilhando o mesmo backend entre V1 (produção) e V2 (nova)**

---

## 🎯 Estratégia: Strangler Fig Pattern

Migração gradual substituindo partes da aplicação sem downtime:

```
┌─────────────────────────────────────────────────┐
│                  FASE 0-1                       │
│  V1 (100%) + V2 (0%) - Mesmo Backend           │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│                  FASE 2-3                       │
│  V1 (80%) + V2 (20%) - Marketing pages         │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│                  FASE 4-5                       │
│  V1 (50%) + V2 (50%) - Auth + Dashboards       │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│                  FASE 6-7                       │
│  V1 (20%) + V2 (80%) - Deprecate V1            │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│                  FASE 8                         │
│  V1 (0%) + V2 (100%) - Full migration          │
└─────────────────────────────────────────────────┘
```

---

## 🏗️ Arquitetura de Coexistência

### Estrutura de Projetos

```
blipee/
│
├── blipee-v1/                    # Projeto atual (produção)
│   ├── src/
│   ├── package.json
│   └── vercel.json               # Deploy: blipee.com
│
├── blipee-v2/                    # Novo projeto (gradual)
│   ├── src/
│   ├── package.json
│   └── vercel.json               # Deploy: v2.blipee.com (staging)
│
└── shared/                       # Compartilhado
    ├── supabase/                 # Database compartilhado
    │   ├── migrations/
    │   ├── functions/
    │   └── config.toml
    │
    └── types/                    # TypeScript types compartilhados
        ├── database.ts           # Generated from Supabase
        └── shared.ts
```

### Roteamento com Vercel

```json
// vercel.json (V1 - blipee.com)
{
  "version": 2,
  "routes": [
    {
      "src": "/v2/(.*)",
      "dest": "https://v2.blipee.com/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ]
}
```

```json
// vercel.json (V2 - v2.blipee.com)
{
  "version": 2,
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key"
  }
}
```

---

## 🔄 FASE 1: Setup Inicial (Semana 1-2)

### 1. Criar Projeto V2 (separado)

```bash
# Clone repository
git clone https://github.com/blipee/blipee-v2.git
cd blipee-v2

# Install dependencies
npm install

# Setup Supabase (usa mesmo projeto da V1)
npx supabase init
npx supabase link --project-ref YOUR_PROJECT_REF
```

### 2. Compartilhar Environment Variables

```bash
# .env.local (V2)
# MESMO Supabase project da V1!
NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... # Admin access

# Database connection (pooler)
SUPABASE_DB_URL=postgresql://postgres:[password]@db.xyz.supabase.co:5432/postgres

# Feature flags
NEXT_PUBLIC_V2_ENABLED=false # Start disabled
```

### 3. Supabase: Versionamento de Schemas

```sql
-- migrations/001_add_version_tracking.sql
CREATE TABLE IF NOT EXISTS schema_versions (
  id serial PRIMARY KEY,
  version text NOT NULL,
  description text,
  applied_at timestamptz DEFAULT now()
);

-- Tag current schema as V1
INSERT INTO schema_versions (version, description)
VALUES ('v1.0.0', 'Current production schema');

-- Add app_version column to track which app version created data
ALTER TABLE carbon_metrics
ADD COLUMN IF NOT EXISTS app_version text DEFAULT 'v1';

-- Index for filtering by version
CREATE INDEX IF NOT EXISTS carbon_metrics_app_version_idx
  ON carbon_metrics(app_version);
```

### 4. Deploy V2 (staging only)

```bash
# Deploy to v2.blipee.com (staging)
vercel --prod

# Configure custom domain
vercel domains add v2.blipee.com
```

**Resultado FASE 1:**
- ✅ V1: 100% tráfego (blipee.com)
- ✅ V2: 0% tráfego (v2.blipee.com - staging/testing)
- ✅ Mesmo Supabase backend
- ✅ Schema versionado

---

## 🔀 FASE 2: Migração Gradual de Páginas (Semana 3-4)

### Estratégia: Edge Middleware Routing

```typescript
// middleware.ts (V1 - blipee.com)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Feature flag from Vercel Edge Config
import { get } from '@vercel/edge-config'

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Check if V2 is enabled for this route
  const v2Routes = await get('v2_enabled_routes') || []
  const isV2Route = v2Routes.some((route: string) =>
    path.startsWith(route)
  )

  // Get user tier (for gradual rollout)
  const userTier = request.cookies.get('tier')?.value
  const userId = request.cookies.get('user_id')?.value

  // Gradual rollout logic
  const shouldUseV2 = isV2Route && (
    userTier === 'enterprise' || // Enterprise users first
    userTier === 'pro' ||        // Then pro users
    (userId && parseInt(userId) % 10 === 0) // 10% of free users
  )

  if (shouldUseV2) {
    // Rewrite to V2
    const url = request.nextUrl.clone()
    url.hostname = 'v2.blipee.com'
    return NextResponse.rewrite(url)
  }

  // Continue with V1
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all routes except static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
```

### Vercel Edge Config (Feature Flags)

```bash
# Install Vercel CLI
npm i -g vercel

# Create edge config
vercel edge-config create

# Set initial config
vercel edge-config set v2_enabled_routes '[]'

# Enable /about page for V2
vercel edge-config set v2_enabled_routes '["/about"]'

# Gradually enable more routes
vercel edge-config set v2_enabled_routes '["/about", "/pricing", "/contact"]'
```

### Ordem de Migração de Páginas

#### 1. Marketing Pages (Baixo Risco)
```javascript
// Week 3
["/about", "/pricing", "/contact"]

// Week 4
["/features", "/blog", "/docs"]
```

#### 2. Auth Pages (Médio Risco - testar bem)
```javascript
// Week 5-6
["/signin", "/signup", "/forgot-password"]
```

#### 3. Dashboard (Alto Risco - migração cuidadosa)
```javascript
// Week 7-8
["/dashboard/overview"]

// Week 9
["/dashboard/carbon", "/dashboard/energy"]

// Week 10
["/dashboard/water", "/dashboard/waste"]
```

**Resultado FASE 2:**
- ✅ V1: 80-90% tráfego
- ✅ V2: 10-20% tráfego (marketing pages)
- ✅ Rollout gradual por tier
- ✅ Feature flags dinâmicos

---

## 🔐 FASE 3: Compatibilidade de Auth (Semana 5-6)

### Supabase Auth: Compartilhado automaticamente

```typescript
// V1 e V2 usam o MESMO Supabase Auth
// Tokens são válidos em ambas versões

// V1: lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// V2: utils/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, // MESMO!
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // MESMO!
  )
}
```

### Session Sharing

```typescript
// middleware.ts (ambos V1 e V2)
// Cookies de auth são compartilhados automaticamente
// Mesmo domínio: .blipee.com

// Set cookie domain
cookieStore.set('sb-access-token', token, {
  domain: '.blipee.com', // Shared across subdomains
  path: '/',
  secure: true,
  httpOnly: true,
  sameSite: 'lax',
})
```

**Resultado FASE 3:**
- ✅ User faz login em V1 → funciona em V2
- ✅ User faz login em V2 → funciona em V1
- ✅ Tokens compartilhados
- ✅ Sessões sincronizadas

---

## 📊 FASE 4: Compatibilidade de Dados (Semana 7-8)

### 1. Schema Compatibility Layer

```sql
-- V2 pode adicionar colunas NULLABLE
ALTER TABLE carbon_metrics
ADD COLUMN IF NOT EXISTS category_v2 text; -- Novo campo V2

-- V1 continua funcionando (ignora coluna)
-- V2 usa novo campo

-- View para V1 (backwards compatible)
CREATE OR REPLACE VIEW carbon_metrics_v1 AS
SELECT
  id,
  user_id,
  organization_id,
  value,
  unit,
  date,
  created_at,
  updated_at
FROM carbon_metrics;

-- View para V2 (inclui novos campos)
CREATE OR REPLACE VIEW carbon_metrics_v2 AS
SELECT * FROM carbon_metrics;
```

### 2. API Compatibility

```typescript
// V1: app/api/dashboard/carbon/route.ts
export async function GET(request: Request) {
  const supabase = createClient()

  // Usa view V1 (backwards compatible)
  const { data } = await supabase
    .from('carbon_metrics_v1') // View V1
    .select('*')

  return Response.json(data)
}

// V2: app/(dashboard)/carbon/page.tsx (Server Component)
export default async function CarbonPage() {
  const supabase = await createClient()

  // Usa tabela completa (com novos campos)
  const { data } = await supabase
    .from('carbon_metrics') // Tabela completa
    .select('*')

  return <CarbonDashboard data={data} />
}
```

### 3. Data Migration Background Job

```typescript
// lib/jobs/migrate-data.ts
import { inngest } from '@/lib/inngest'

export const migrateV1DataToV2 = inngest.createFunction(
  { name: 'Migrate V1 data to V2 format' },
  { cron: '0 2 * * *' }, // Every night at 2am
  async ({ step }) => {
    // Step 1: Find records without V2 fields
    const records = await step.run('find-old-records', async () => {
      const supabase = createClient()
      return await supabase
        .from('carbon_metrics')
        .select('id, value, category')
        .is('category_v2', null)
        .limit(1000)
    })

    // Step 2: Migrate in batches
    await step.run('migrate-batch', async () => {
      const supabase = createClient()

      for (const record of records) {
        await supabase
          .from('carbon_metrics')
          .update({
            category_v2: mapCategoryV1ToV2(record.category),
            app_version: 'v2',
          })
          .eq('id', record.id)
      }
    })

    return { migrated: records.length }
  }
)
```

**Resultado FASE 4:**
- ✅ V1 e V2 lêem/escrevem no mesmo DB
- ✅ Schema backwards compatible
- ✅ Migration job automático
- ✅ Zero data loss

---

## 🎛️ FASE 5: Feature Flags Granulares (Semana 9-10)

### Vercel Edge Config + Database Flags

```typescript
// lib/feature-flags.ts
import { get } from '@vercel/edge-config'
import { createClient } from '@/utils/supabase/server'

export async function isFeatureEnabled(
  featureName: string,
  userId?: string
): Promise<boolean> {
  // 1. Check global flag (Edge Config - fast)
  const globalEnabled = await get(`feature_${featureName}_enabled`)
  if (!globalEnabled) return false

  // 2. Check user-specific flag (Database - slower but granular)
  if (userId) {
    const supabase = await createClient()
    const { data } = await supabase
      .from('feature_flags')
      .select('enabled')
      .eq('user_id', userId)
      .eq('feature', featureName)
      .single()

    if (data) return data.enabled
  }

  // 3. Check rollout percentage
  const rolloutPercent = await get(`feature_${featureName}_rollout`) || 0

  if (userId) {
    // Consistent hashing for gradual rollout
    const hash = hashUserId(userId)
    return hash % 100 < rolloutPercent
  }

  return rolloutPercent === 100
}

// Usage
export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const showNewDashboard = await isFeatureEnabled('new_dashboard', user?.id)

  if (showNewDashboard) {
    return <NewDashboard />
  }

  return <LegacyDashboard />
}
```

### Database Feature Flags Table

```sql
-- Feature flags per user
CREATE TABLE feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  organization_id uuid REFERENCES organizations(id),
  feature text NOT NULL,
  enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, feature)
);

-- Enable RLS
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- Users can view their own flags
CREATE POLICY "Users view own flags"
  ON feature_flags FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can manage all flags
CREATE POLICY "Admins manage all flags"
  ON feature_flags FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );
```

### Admin UI para Feature Flags

```typescript
// app/(dashboard)/admin/feature-flags/page.tsx
'use server'

export default async function FeatureFlagsPage() {
  const flags = await getFeatureFlags()

  return (
    <div>
      <h1>Feature Flags</h1>

      {flags.map(flag => (
        <FeatureFlagCard
          key={flag.name}
          name={flag.name}
          enabled={flag.enabled}
          rollout={flag.rollout}
          onToggle={toggleFlag}
        />
      ))}
    </div>
  )
}

async function toggleFlag(flagName: string, enabled: boolean) {
  'use server'

  // Update Edge Config (instant)
  await vercel.edge.config.set(`feature_${flagName}_enabled`, enabled)

  // Log change
  await logAudit({
    action: 'feature_flag.toggled',
    resource: flagName,
    metadata: { enabled },
  })
}
```

**Resultado FASE 5:**
- ✅ Feature flags por feature
- ✅ Rollout gradual (0-100%)
- ✅ Per-user overrides
- ✅ Admin UI para controle

---

## 📈 FASE 6: Monitoramento de Coexistência (Semana 11)

### Dual Metrics Tracking

```typescript
// lib/metrics.ts
export class DualMetricsTracker {
  static track(event: string, data: any, version: 'v1' | 'v2') {
    // Track to Vercel Analytics
    analytics.track(event, {
      ...data,
      app_version: version,
    })

    // Track to custom metrics
    logger.info({
      event,
      version,
      ...data,
    }, `[${version.toUpperCase()}] ${event}`)
  }
}

// Usage in V1
DualMetricsTracker.track('dashboard.loaded', { userId }, 'v1')

// Usage in V2
DualMetricsTracker.track('dashboard.loaded', { userId }, 'v2')
```

### Comparison Dashboard

```typescript
// app/(dashboard)/admin/migration/page.tsx
export default async function MigrationDashboard() {
  const metrics = await getComparisonMetrics()

  return (
    <div>
      <h1>V1 vs V2 Migration Status</h1>

      <MetricCard
        title="Traffic Split"
        v1={metrics.v1.traffic}
        v2={metrics.v2.traffic}
      />

      <MetricCard
        title="Error Rate"
        v1={metrics.v1.errorRate}
        v2={metrics.v2.errorRate}
      />

      <MetricCard
        title="Latency (P95)"
        v1={metrics.v1.latencyP95}
        v2={metrics.v2.latencyP95}
      />

      <Chart
        title="Migration Progress"
        data={metrics.timeline}
      />
    </div>
  )
}
```

**Resultado FASE 6:**
- ✅ Comparação V1 vs V2 em tempo real
- ✅ Error rates side-by-side
- ✅ Performance comparison
- ✅ User experience tracking

---

## ⚠️ FASE 7: Rollback Strategy (Semana 12)

### Instant Rollback

```typescript
// scripts/rollback.ts
import { vercel } from '@/lib/vercel-api'

export async function rollbackToV1(reason: string) {
  console.log(`🔙 Rolling back to V1: ${reason}`)

  // 1. Disable all V2 routes (instant via Edge Config)
  await vercel.edge.config.set('v2_enabled_routes', [])

  // 2. Update feature flags
  await vercel.edge.config.set('v2_global_enabled', false)

  // 3. Alert team
  await sendAlert({
    type: 'ROLLBACK',
    reason,
    timestamp: new Date().toISOString(),
  })

  // 4. Log incident
  await logAudit({
    action: 'migration.rollback',
    metadata: { reason },
  })

  console.log('✅ Rollback completed')
}

// Automatic rollback on high error rate
export async function checkHealthAndRollback() {
  const v2ErrorRate = await getV2ErrorRate()
  const v1ErrorRate = await getV1ErrorRate()

  // If V2 error rate is 2x higher than V1
  if (v2ErrorRate > v1ErrorRate * 2 && v2ErrorRate > 0.05) {
    await rollbackToV1(
      `High error rate detected: V2=${v2ErrorRate}, V1=${v1ErrorRate}`
    )
  }
}
```

### Cron Job para Health Check

```typescript
// vercel.json
{
  "crons": [{
    "path": "/api/cron/health-check",
    "schedule": "*/5 * * * *" // Every 5 minutes
  }]
}

// app/api/cron/health-check/route.ts
export async function GET() {
  await checkHealthAndRollback()
  return Response.json({ status: 'ok' })
}
```

**Resultado FASE 7:**
- ✅ Rollback em < 1 minuto
- ✅ Automatic rollback em caso de erro
- ✅ Alertas para equipe
- ✅ Audit trail completo

---

## 📅 Timeline Completo de Migração

### Semana 1-2: Foundation
- Setup V2 project (mesmo Supabase)
- Deploy v2.blipee.com (staging)
- Schema versioning
- Environment sync

### Semana 3-4: Marketing Pages (10% tráfego)
- /about, /pricing, /contact
- Edge middleware routing
- Feature flags setup
- Monitoring dashboard

### Semana 5-6: Auth Pages (20% tráfego)
- /signin, /signup
- Session sharing
- Testing com usuários reais

### Semana 7-8: Dashboard Overview (30% tráfego)
- /dashboard/overview
- Data compatibility layer
- Background migration job

### Semana 9-10: Detailed Dashboards (60% tráfego)
- /dashboard/carbon
- /dashboard/energy
- /dashboard/water
- /dashboard/waste

### Semana 11: Settings & Final Pages (90% tráfego)
- /settings/*
- Performance comparison
- User feedback

### Semana 12: Full Migration (100% V2)
- Deprecate V1
- Redirect blipee.com → V2
- Archive V1 code
- Celebration! 🎉

---

## ✅ Checklist de Migração

### Pre-Migration
- [ ] V2 project setup
- [ ] Supabase credentials shared
- [ ] Deploy v2.blipee.com
- [ ] Edge Config setup
- [ ] Feature flags infrastructure
- [ ] Monitoring dashboards
- [ ] Rollback scripts tested

### Durante Migration
- [ ] Rollout gradual (tier-based)
- [ ] Error rate monitoring (< 5% delta)
- [ ] Latency monitoring (< 2x V1)
- [ ] User feedback collection
- [ ] Daily standups
- [ ] Incident response ready

### Post-Migration
- [ ] 100% tráfego em V2
- [ ] V1 deprecated
- [ ] DNS update (blipee.com → V2)
- [ ] Archive V1 repository
- [ ] Documentation update
- [ ] Team retrospective

---

## 🎯 Success Metrics

| Métrica | Target | Rollback if |
|---------|--------|-------------|
| **Error Rate** | < 1% | > 5% |
| **Latency P95** | < 2s | > 3s |
| **Availability** | > 99.9% | < 99% |
| **User Complaints** | < 5/day | > 20/day |
| **Rollback Time** | < 1 min | N/A |

---

## 🚀 Comandos Rápidos

### Deploy V2 (staging)
```bash
cd blipee-v2
vercel --prod
```

### Enable route in V2
```bash
vercel edge-config set v2_enabled_routes '["/about"]'
```

### Check traffic split
```bash
vercel logs --since 1h | grep "app_version"
```

### Rollback to V1
```bash
npm run rollback:v1 "High error rate"
```

### Full migration (100% V2)
```bash
vercel edge-config set v2_enabled_routes '["/*"]'
```

---

**Ready to start migration? 🚀**

Próximo passo: **FASE 1 - Setup Inicial**
