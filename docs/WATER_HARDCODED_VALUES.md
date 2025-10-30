# 🔍 VALORES HARDCODED - Water Dashboard System

**Data:** 2025-10-30
**Status:** Documentação completa após consolidação do Water API

---

## ⚠️ CRÍTICOS (Afetam Funcionalidade)

### 1. Filtros de Dados (Lógica de Negócio)
**Localização:** `/src/app/api/dashboard/water/route.ts` (linha 225)

```typescript
.eq('metrics_catalog.subcategory', 'Water')
```

**Impacto:** Se subcategory mudar no banco, nenhum dado será retornado
**Risco:** 🔴 Alto
**Solução:** Criar configuração ou usar múltiplos filtros

**Replicado em:**
- `/src/lib/sustainability/baseline-calculator.ts` (linha 495)
- `/src/app/api/dashboard/water/route.ts` (linha 508 - site comparison)

---

### 2. Detecção de Tipos de Água (String Matching)
**Localização:** `/src/app/api/dashboard/water/route.ts` (linhas 328-332)

```typescript
// Detecção de wastewater
const isWastewater = nameLower.includes('wastewater') || nameLower.includes('discharge');

// Detecção de água reciclada
const isRecycled = nameLower.includes('recycled') || nameLower.includes('reuse');

// Tipos de fonte
const sourceType = isRecycled ? 'recycled' : isWastewater ? 'wastewater' : 'municipal';
```

**Impacto:** Se nomes de métricas mudarem, classificação quebra
**Risco:** 🔴 Alto - baseado em strings no nome da métrica
**Exemplos de Nomes Esperados:**
- "Water - Toilets & Sanitary"
- "Wastewater - Kitchen & Cafeteria"
- "Recycled Water - Toilet Flush"

**Solução Recomendada:** Adicionar coluna `water_type` em `metrics_catalog`:
```sql
ALTER TABLE metrics_catalog
ADD COLUMN water_type TEXT CHECK (water_type IN ('withdrawal', 'discharge', 'recycled'));
```

---

### 3. Taxa de Redução de Água
**Localização:** `/src/lib/sustainability/unified-calculator.ts` (linha 256)

```typescript
case 'water':
  return target.water_reduction_percent || 2.5; // ← 2.5% HARDCODED
```

**Impacto:** Se target não tiver `water_reduction_percent`, usa 2.5% por padrão
**Risco:** 🟡 Médio - é um fallback razoável
**Solução:** Garantir que todos os targets tenham valor configurado

**Outros Defaults:**
- Energy: 4.2%
- Waste: 3.0%
- Emissions: 4.2%

---

### 4. Ano Baseline Default
**Localização:** `/src/app/api/dashboard/water/route.ts` (linha 76)

```typescript
const baselineYear = sustainabilityTarget?.baseline_year || 2023; // ← 2023 HARDCODED
```

**Impacto:** Se não houver target configurado, usa 2023
**Risco:** 🟡 Médio - deve sempre ter target
**Solução:** Garantir que organizações tenham `sustainability_target` criado

---

## ⚠️ MODERADOS (Defaults Razoáveis)

### 5. Área Padrão de Sites
**Localização:** `/src/app/api/dashboard/water/route.ts`

```typescript
// Linha 392 - Para cálculo de intensidade
const area = siteData?.total_area_sqm || 1000; // ← 1000 m² default

// Linha 548 - Para site comparison
const area = site.total_area_sqm || 1000; // ← 1000 m² default
```

**Impacto:** Sites sem área cadastrada usam 1000 m²
**Risco:** 🟢 Baixo - cálculo de intensidade fica incorreto, mas não quebra
**Solução:** Garantir que sites tenham `total_area_sqm` preenchido

---

### 6. Conversão de Unidades
**Localização:**
- `/src/app/api/dashboard/water/route.ts` (linhas 274-280)
- `/src/lib/sustainability/baseline-calculator.ts` (linhas 476-482)

```typescript
const convertToM3 = (value: number, unit: string): number => {
  const unitLower = unit.toLowerCase().trim();
  if (unitLower === 'm³' || unitLower === 'm3') return value;
  if (unitLower === 'ml' || unitLower === 'megaliters') return value * 1000; // ← 1000x
  if (unitLower === 'l' || unitLower === 'liters') return value / 1000;     // ← ÷1000
  return value; // ← Assume m³ se desconhecido
};
```

**Impacto:** Conversões matemáticas padrão
**Risco:** 🟢 Baixo - são conversões corretas
**Solução:** Nenhuma necessária (correto)

---

## ✅ BAIXO RISCO (Configurações UI)

### 7. Threshold de Unidades (Não Usado - Legacy)
**Localização:** `/src/components/dashboard/WaterDashboard.tsx` (linha 271)

```typescript
const threshold = 10000; // ← Não usado mais (legacy)
const useKL = totalWithdrawal < threshold; // Keep for legacy intensity calculations
```

**Impacto:** Nenhum - variável não é usada
**Risco:** Zero
**Status:** Legacy code após padronização para m³
**Solução:** Pode remover em cleanup futuro

---

## 📋 RESUMO POR PRIORIDADE

| Prioridade | Item | Risco | Ação Recomendada |
|-----------|------|-------|------------------|
| 🔴 **Alta** | Filtro `subcategory = 'Water'` | Alto | Documentar ou adicionar fallbacks |
| 🔴 **Alta** | String matching (wastewater, recycled) | Alto | Adicionar coluna `water_type` no DB |
| 🟡 **Média** | Taxa redução 2.5% | Médio | Garantir targets configurados |
| 🟡 **Média** | Baseline year 2023 | Médio | Garantir targets configurados |
| 🟢 **Baixa** | Área padrão 1000 m² | Baixo | Garantir sites com área preenchida |
| 🟢 **Baixa** | Conversão ML/L/m³ | Baixo | OK - conversões corretas |

---

## 🎯 RECOMENDAÇÕES

### Curto Prazo (Mitigação Imediata)
1. ✅ **Documentar** dependência de `subcategory = 'Water'` no README
2. ✅ **Validar** que todos os sites têm `total_area_sqm` preenchido
3. ✅ **Validar** que todas as orgs têm `sustainability_targets` configurado
4. ✅ **Adicionar** logs quando defaults são usados (baseline_year, water_reduction_percent)

### Médio Prazo (Melhorias de Arquitetura)

#### 1. Adicionar Coluna `water_type`
```sql
-- Migration: Add water_type column
ALTER TABLE metrics_catalog
ADD COLUMN water_type TEXT
CHECK (water_type IN ('withdrawal', 'discharge', 'recycled'));

-- Update existing metrics
UPDATE metrics_catalog
SET water_type =
  CASE
    WHEN name ILIKE '%wastewater%' OR name ILIKE '%discharge%' THEN 'discharge'
    WHEN name ILIKE '%recycled%' OR name ILIKE '%reuse%' THEN 'recycled'
    ELSE 'withdrawal'
  END
WHERE subcategory = 'Water';
```

**Benefício:** Elimina string matching no código, mais robusto

#### 2. Criar Tabela de Domain Mappings
```sql
CREATE TABLE metric_domain_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL,
  filter_type TEXT NOT NULL, -- 'category', 'subcategory', 'name'
  filter_value TEXT NOT NULL,
  priority INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exemplo de dados
INSERT INTO metric_domain_mappings (domain, filter_type, filter_value) VALUES
  ('water', 'subcategory', 'Water'),
  ('energy', 'category', 'Electricity'),
  ('energy', 'category', 'Natural Gas');
```

**Benefício:** Filtros configuráveis, fácil adicionar novos domínios

### Longo Prazo (Ideal State)

1. 🚀 **UI de Configuração** de taxas de redução por organização
   - Settings > Sustainability Targets > Custom Reduction Rates

2. 🚀 **Validação Obrigatória** de área de sites no cadastro
   - Form validation: `total_area_sqm` required field

3. 🚀 **Metadata Estruturado** em vez de inferência por nome
   - Schema JSON em `metadata` column com campos tipados

4. 🚀 **Configuration Service**
   ```typescript
   class MetricsConfigService {
     async getWaterFilters(orgId: string): Promise<FilterConfig[]>
     async getReductionRate(orgId: string, domain: string): Promise<number>
     async getBaselineYear(orgId: string): Promise<number>
   }
   ```

---

## 📊 IMPACTO DA CONSOLIDAÇÃO

**Antes da Consolidação:**
- Múltiplas categorias hardcoded: `['Water Consumption', 'Water Withdrawal', ...]`
- N+1 queries para sites
- Diferentes lógicas em diferentes APIs

**Depois da Consolidação:**
- ✅ Single source of truth: `subcategory = 'Water'`
- ✅ Single query para todos os sites
- ✅ Lógica replicada e consistente (Water API ↔ Baseline Calculator)

---

## 🔄 CHANGELOG

**2025-10-30:**
- ✅ Padronizado filtro para `subcategory = 'Water'`
- ✅ Replicado lógica de string matching em todos os locais
- ✅ Adicionado conversão automática de unidades (ML/L → m³)
- ✅ Unified Calculator retorna 'm³' (não mais 'ML')
- ✅ Documentado todos os valores hardcoded

---

**Próxima Revisão:** Após implementação de `water_type` column
