# Fluxo de Forecast - Energy Dashboard

## 🔄 Fluxo Completo (do Banco de Dados ao UI)

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. API CONSOLIDADA                                              │
│    /api/dashboard/energy/route.ts (linha 104-106)              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  selectedYear === currentYear                                   │
│    ? calculator.getProjected('energy')  ← CHAMA O CALCULATOR   │
│    : Promise.resolve(null)                                      │
│                                                                 │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. UNIFIED CALCULATOR                                           │
│    src/lib/sustainability/unified-calculator.ts (linha 358)    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  async getProjected(domain: Domain) {                          │
│    1. Busca YTD real (getYTDActual)                           │
│    2. Verifica cache (metrics_cache table)                     │
│    3. Se não tem cache, chama ML forecast                      │
│    4. Fallback: projeção linear                                │
│  }                                                              │
│                                                                 │
└────────────────────┬────────────────────────────────────────────┘
                     │
    ┌────────────────┴────────────────┐
    │                                 │
    ▼                                 ▼
┌────────────────┐            ┌─────────────────┐
│ 2a. YTD ACTUAL │            │ 2b. ML FORECAST │
│  (linha 312)   │            │   (linha 392)   │
├────────────────┤            ├─────────────────┤
│                │            │                 │
│ getYTDActual() │            │ Import:         │
│  ↓             │            │ unified-        │
│ Chama:         │            │ forecast.ts     │
│ getEnergyTotal │            │                 │
│  ↓             │            │ Usa modelos ML  │
│ Soma consumo   │            │ para prever     │
│ Jan-Oct 2025   │            │ Nov-Dec 2025    │
│                │            │                 │
│ Retorna:       │            │ Retorna:        │
│ 994.8 MWh      │            │ 76.2 MWh        │
│                │            │                 │
└────────────────┘            └─────────────────┘
         │                              │
         └──────────┬───────────────────┘
                    ▼
        ┌───────────────────────┐
        │  RESULTADO COMBINADO  │
        ├───────────────────────┤
        │                       │
        │  {                    │
        │    value: 1071,       │ ← YTD + Forecast = Total anual
        │    ytd: 994.8,        │ ← Consumo real até agora
        │    forecast: 76.2,    │ ← Previsão resto do ano
        │    method: "ml_..."   │ ← Método usado
        │  }                    │
        │                       │
        └───────────┬───────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. ADAPTER HOOK                                                 │
│    src/hooks/useConsolidatedDashboard.ts (linha 320-349)       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  forecast: {                                                    │
│    data: {                                                      │
│      forecast: [{                                               │
│        total: data.forecast.value * 1000,  // MWh → kWh        │
│      }],                                                        │
│      ytd: data.forecast.ytd * 1000,        // 994.8 → 994800   │
│      projected: data.forecast.projected * 1000, // 76.2 → 76200│
│      fullYearProjection: data.forecast.value * 1000, // 1071000│
│    }                                                            │
│  }                                                              │
│                                                                 │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. COMPONENTE                                                   │
│    src/components/dashboard/EnergyDashboard.tsx (linha 655)   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  const ytdEnergyResult = forecastDataRes?.ytd || totalEnergy   │
│  const projectedAnnualEnergyResult =                           │
│    forecastDataRes?.fullYearProjection ||                      │
│    (ytdEnergyResult + forecastDataRes?.projected)              │
│                                                                 │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
            ┌────────────────┐
            │   UI DISPLAY   │
            ├────────────────┤
            │                │
            │ Energia YTD:   │
            │  994.8 MWh ✅  │
            │                │
            │ Projetado:     │
            │  1071.0 MWh ✅ │
            │                │
            └────────────────┘
```

---

## 📊 Métodos de Forecast (Hierarquia)

O `UnifiedSustainabilityCalculator.getProjected()` tenta os métodos nesta ordem:

### 1️⃣ Cache (Mais Rápido) ⚡
```typescript
// Linha 371-390
const cachedForecast = await getCachedForecast(
  organizationId,
  domain,
  forecastStartDate,
  supabaseAdmin
);
```

**Fonte:** Tabela `metrics_cache`
**Quando:** Forecast pré-computado pelo serviço diário
**Retorna:** `{ total: 76.2, method: "ml_forecast_cached" }`

### 2️⃣ ML Forecast (Dinâmico) 🤖
```typescript
// Linha 393-414
const forecastModule = await import('./unified-forecast');
const forecast = await forecastModule.getUnifiedForecast({
  organizationId,
  domain,
  startDate: forecastStartDate,
  endDate: `${currentYear}-12-31`,
});
```

**Fonte:** Módulo `unified-forecast.ts`
**Quando:** Cache miss, calcula em tempo real
**Usa:** Modelos ML (EnterpriseForecast)
**Retorna:** `{ total: 76.2, method: "ml_forecast" }`

### 3️⃣ Linear Fallback (Simples) 📈
```typescript
// Linha 419-429
const monthlyAverage = ytd / currentMonth;
const projectedAnnual = monthlyAverage * 12;
```

**Fonte:** Cálculo simples
**Quando:** ML não disponível
**Usa:** Média mensal × 12
**Retorna:** `{ total: estimativa, method: "linear_fallback" }`

---

## 🔍 Como o YTD é Calculado

### `getYTDActual(domain)` - Linha 312

```typescript
async getYTDActual(domain: Domain): Promise<number> {
  const currentMonth = new Date().getMonth() + 1; // 10 (Outubro)
  const startDate = `2025-01-01`;
  const endDate = `2025-10-31`;

  // Para energy:
  const energy = await getEnergyTotal(
    organizationId,
    startDate,
    endDate
  );
  return energy.value; // 994.8 MWh
}
```

**Processo:**
1. Identifica mês atual (Outubro = mês 10)
2. Define período: 01/Jan/2025 → 31/Out/2025
3. Chama `getEnergyTotal()` do baseline-calculator
4. Soma todo o consumo de energia nesse período
5. Retorna **994.8 MWh**

---

## 📦 Estrutura de Dados no Fluxo

### API Response (Raw):
```json
{
  "forecast": {
    "value": 1071,      // MWh - total anual projetado
    "ytd": 994.8,       // MWh - consumo real até agora
    "forecast": 76.2,   // MWh - previsão para resto do ano
    "method": "ml_forecast"
  }
}
```

### Adapter Transform (kWh):
```typescript
{
  ytd: 994800,                    // kWh
  projected: 76200,               // kWh
  fullYearProjection: 1071000     // kWh
}
```

### Component Calculation:
```typescript
ytdEnergyResult = 994800          // Exibido no card YTD
projectedAnnualEnergyResult = 1071000  // Exibido como "Projetado"
```

---

## ⚙️ Configuração da Cache

### Tabela: `metrics_cache`
```sql
CREATE TABLE metrics_cache (
  organization_id UUID,
  domain TEXT,           -- 'energy', 'water', 'waste', 'emissions'
  forecast_start DATE,   -- Data início da previsão
  forecast_total DECIMAL, -- Total previsto
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### TTL (Time-to-Live):
- **Cache database:** Recomputado diariamente
- **Instance cache:** Válido durante request
- **React Query cache:** 5 minutos (staleTime)

---

## 🐛 Debug: Como Verificar

### 1. Console do Navegador:
```javascript
📦 [CONSOLIDATED API] Raw data: {
  "forecast": {
    "value": 1071,
    "ytd": 994.8,
    "forecast": 76.2,
    "method": "ml_forecast"
  }
}

📊 [PROJECTED CALCULATION] {
  ytdEnergyResult: 994800,
  fullYearProjection: 1071000,
  projectedAnnualEnergyResult: 1071000,
  inMWh: "1071.0"
}
```

### 2. Server Terminal:
```
[UnifiedCalculator] getProjected('energy')
  → YTD: 994.8 MWh
  → Cached forecast: 76.2 MWh
  → Total: 1071.0 MWh
  → Method: ml_forecast_cached
```

### 3. Query Database:
```sql
-- Ver forecast na cache
SELECT * FROM metrics_cache
WHERE organization_id = '22647141-2ee4-4d8d-8b47-16b0cbd830b2'
  AND domain = 'energy'
  AND forecast_start >= '2025-11-01'
ORDER BY created_at DESC
LIMIT 1;
```

---

## ✅ Valores Corretos (Seu Sistema)

| Campo | Valor MWh | Valor kWh | Descrição |
|-------|-----------|-----------|-----------|
| **YTD** | 994.8 | 994,800 | Consumo real Jan-Out 2025 |
| **Projected** | 76.2 | 76,200 | Previsão Nov-Dez 2025 |
| **Full Year** | 1071.0 | 1,071,000 | YTD + Projected |

**No UI deve aparecer:**
- **Energia YTD:** 994.8 MWh ✅
- **Projetado:** 1071.0 MWh ✅

---

**Data:** 2025-01-29
**Status:** ✅ Forecast funcionando corretamente
