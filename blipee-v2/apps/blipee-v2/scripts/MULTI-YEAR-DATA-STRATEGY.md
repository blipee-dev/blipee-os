# Estratégia de Dados Multi-Ano

## Problema: Como lidar com dados de diferentes anos?

Para uma plataforma de sustentabilidade, é essencial:
1. ✅ Armazenar dados históricos (2020, 2021, 2022...)
2. ✅ Comparar ano a ano (YoY comparison)
3. ✅ Usar fatores de emissão corretos para cada ano
4. ✅ Gerar tendências e gráficos multi-ano
5. ✅ Relatórios GRI de múltiplos anos

## Solução Implementada

### 1. Armazenamento Multi-Ano ✅

**Tabela `metrics_data`** - Já preparada para multi-ano:

```sql
CREATE TABLE metrics_data (
  period_start DATE,    -- Data de início do período
  period_end DATE,      -- Data de fim do período
  value NUMERIC,        -- Valor da métrica
  co2e_emissions NUMERIC
);
```

**Exemplo: Eletricidade de 3 anos**
```sql
-- Ano 2022
INSERT INTO metrics_data VALUES
  ('2022-01-01', '2022-12-31', 50000, 14500);  -- 50 MWh, 14.5 tCO2e

-- Ano 2023
INSERT INTO metrics_data VALUES
  ('2023-01-01', '2023-12-31', 48000, 13440);  -- 48 MWh, 13.4 tCO2e

-- Ano 2024
INSERT INTO metrics_data VALUES
  ('2024-01-01', '2024-12-31', 45000, 12150);  -- 45 MWh, 12.2 tCO2e
```

### 2. Fatores de Emissão que Mudam ao Longo do Tempo ⚠️

**Problema**: O grid elétrico fica mais limpo cada ano!

| Ano | Fator PT (kg CO2e/kWh) | % Renovável |
|-----|------------------------|-------------|
| 2020 | 0.380 | 48% |
| 2021 | 0.340 | 54% |
| 2022 | 0.290 | 58% |
| 2023 | 0.280 | 62% |
| 2024 | 0.270 | 66% |

**Solução**: `emission_factors_cache` com `source_year`:

```sql
CREATE TABLE emission_factors_cache (
  activity_name TEXT,
  region_code TEXT,
  source_year INTEGER,    -- 🔑 ANO do fator
  factor_value NUMERIC,

  UNIQUE (activity_name, region_code, source_year)
);

-- Exemplo: Grid elétrico de Portugal ao longo dos anos
INSERT INTO emission_factors_cache VALUES
  ('electricity grid', 'PT', 2020, 0.380, 'kg CO2e/kWh', 'IEA 2020'),
  ('electricity grid', 'PT', 2021, 0.340, 'kg CO2e/kWh', 'IEA 2021'),
  ('electricity grid', 'PT', 2022, 0.290, 'kg CO2e/kWh', 'IEA 2022'),
  ('electricity grid', 'PT', 2023, 0.280, 'kg CO2e/kWh', 'IEA 2023'),
  ('electricity grid', 'PT', 2024, 0.270, 'kg CO2e/kWh', 'IEA 2024');
```

**Função para pegar fator correto**:
```sql
-- Buscar fator para 2022
SELECT * FROM get_correct_emission_factor(
  'electricity grid',  -- atividade
  'PT',                -- região
  2022                 -- ano
);

-- Retorna: factor_value = 0.290 (fator de 2022)
-- Se não existir fator de 2022, pega o mais recente anterior (2021, 2020...)
```

### 3. Views para Análise Multi-Ano 📊

Criamos 4 views SQL para facilitar análises:

#### View 1: `yearly_metrics_summary`
**Objetivo**: Resumo anual de todas as métricas

```sql
-- Uso: Ver tendência de eletricidade
SELECT year, total_value, total_co2e, unit
FROM yearly_metrics_summary
WHERE organization_id = 'org-uuid'
  AND metric_code = 'gri_302_1_electricity_consumption'
  AND year >= 2020
ORDER BY year;

-- Resultado:
-- year | total_value | total_co2e | unit
-- 2020 | 55200       | 20976      | kWh
-- 2021 | 52800       | 17952      | kWh
-- 2022 | 50000       | 14500      | kWh
-- 2023 | 48000       | 13440      | kWh
-- 2024 | 45000       | 12150      | kWh
```

#### View 2: `yearly_yoy_comparison`
**Objetivo**: Comparação ano a ano automática

```sql
-- Uso: Ver mudanças YoY em 2024 vs 2023
SELECT
  metric_name,
  current_year,
  current_value,
  previous_value,
  value_change_pct,
  co2e_change_pct
FROM yearly_yoy_comparison
WHERE organization_id = 'org-uuid'
  AND current_year = 2024
ORDER BY ABS(co2e_change_pct) DESC;

-- Resultado:
-- metric_name              | current | previous | value_change% | co2e_change%
-- Electricity Consumption  | 45000   | 48000    | -6.25         | -9.60
-- Direct Emissions         | 1250    | 1420     | -11.97        | -11.97
-- Business Travel          | 50      | 65       | -23.08        | -23.08
```

#### View 3: `gri_yearly_completeness`
**Objetivo**: Completude GRI por ano

```sql
-- Uso: Ver progresso de reporting ao longo dos anos
SELECT gri_standard, year, completeness_pct
FROM gri_yearly_completeness
WHERE organization_id = 'org-uuid'
ORDER BY year DESC, gri_standard;

-- Resultado:
-- gri_standard | year | completeness_pct
-- GRI 302      | 2024 | 95.00
-- GRI 305      | 2024 | 90.00
-- GRI 306      | 2024 | 80.00
-- GRI 302      | 2023 | 85.00
-- GRI 305      | 2023 | 75.00
-- GRI 306      | 2023 | 60.00
```

#### View 4: `emission_factor_history`
**Objetivo**: Como fatores mudaram ao longo do tempo

```sql
-- Uso: Ver evolução do grid de Portugal
SELECT
  source_year,
  factor_value,
  previous_year_factor,
  factor_change_pct
FROM emission_factor_history
WHERE activity_name = 'electricity grid'
  AND region_code = 'PT'
ORDER BY source_year DESC;

-- Resultado:
-- year | factor_value | previous | change%
-- 2024 | 0.270        | 0.280    | -3.57  (melhorou!)
-- 2023 | 0.280        | 0.290    | -3.45
-- 2022 | 0.290        | 0.340    | -14.71 (grande melhoria)
-- 2021 | 0.340        | 0.380    | -10.53
-- 2020 | 0.380        | NULL     | NULL
```

### 4. Função: `get_metric_trend()`

**Objetivo**: Tendência de uma métrica específica

```sql
-- Uso: Ver tendência de emissões diretas (2020-2024)
SELECT * FROM get_metric_trend(
  'org-uuid',
  'gri_305_1_direct_emissions',
  2020,  -- ano inicial
  2024   -- ano final
);

-- Resultado:
-- year | total_value | total_co2e | yoy_change% | trend
-- 2024 | 1250        | 1250       | -11.97      | decreasing ✅
-- 2023 | 1420        | 1420       | -10.12      | decreasing ✅
-- 2022 | 1580        | 1580       | -9.74       | decreasing ✅
-- 2021 | 1750        | 1750       | -5.41       | stable
-- 2020 | 1850        | 1850       | NULL        | NULL
```

## Casos de Uso Práticos

### Caso 1: Dashboard com Tendência de 5 Anos

```typescript
// src/app/dashboard/trends/page.tsx

async function getTrendData(orgId: string) {
  const { data } = await supabase.rpc('get_metric_trend', {
    p_organization_id: orgId,
    p_metric_code: 'gri_305_1_direct_emissions',
    p_start_year: 2020,
    p_end_year: 2024
  })

  return data
}

// Renderizar gráfico
<LineChart data={trendData}>
  <Line dataKey="total_co2e" name="Emissões (tCO2e)" />
  <Line dataKey="total_value" name="Atividade" />
</LineChart>
```

### Caso 2: Comparação YoY Automática

```typescript
// src/lib/data/gri-reporting.ts

async function getYoYComparison(orgId: string, currentYear: number) {
  const { data } = await supabase
    .from('yearly_yoy_comparison')
    .select('*')
    .eq('organization_id', orgId)
    .eq('current_year', currentYear)
    .order('co2e_change_pct', { ascending: true })

  return data
  // [
  //   { metric_name: 'Business Travel', co2e_change_pct: -23.08 },
  //   { metric_name: 'Direct Emissions', co2e_change_pct: -11.97 },
  //   { metric_name: 'Electricity', co2e_change_pct: -9.60 },
  // ]
}
```

### Caso 3: Relatório GRI Multi-Ano

```typescript
// src/lib/reporting/gri-report.ts

async function generateGRIReport(orgId: string, years: number[]) {
  const report = {}

  for (const year of years) {
    // Buscar dados de cada ano
    const { data } = await supabase
      .from('yearly_metrics_summary')
      .select('metric_code, total_value, total_co2e')
      .eq('organization_id', orgId)
      .eq('year', year)
      .like('metric_code', 'gri_%')

    report[year] = data
  }

  return report
  // {
  //   2022: [{ metric_code: 'gri_305_1_...', total_co2e: 1580 }, ...],
  //   2023: [{ metric_code: 'gri_305_1_...', total_co2e: 1420 }, ...],
  //   2024: [{ metric_code: 'gri_305_1_...', total_co2e: 1250 }, ...]
  // }
}
```

### Caso 4: Cálculo com Fator Correto para o Ano

```typescript
// src/lib/apis/climatiq.ts

async function calculateHistoricalEmissions(
  activity: string,
  amount: number,
  region: string,
  year: number  // 🔑 Ano dos dados
) {
  // 1. Buscar fator correto para o ano
  const { data: factor } = await supabase.rpc('get_correct_emission_factor', {
    p_activity_name: activity,
    p_region_code: region,
    p_year: year
  })

  if (!factor) {
    // Se não temos fator, chamar API
    const newFactor = await climatiq.search(activity, region)
    // Armazenar com source_year
    await supabase.from('emission_factors_cache').insert({
      activity_name: activity,
      region_code: region,
      source_year: year,
      factor_value: newFactor.factor
    })
  }

  // 2. Calcular localmente
  const co2e = amount * factor.factor_value

  return {
    co2e,
    factor_used: factor.factor_value,
    factor_year: factor.source_year,
    factor_source: factor.source_dataset
  }
}

// Uso:
const emissions2022 = await calculateHistoricalEmissions(
  'electricity grid',
  50000,  // 50 MWh
  'PT',
  2022    // Dados de 2022
)
// Usa fator de 2022: 0.290 kg/kWh
// Resultado: 14,500 kg CO2e

const emissions2024 = await calculateHistoricalEmissions(
  'electricity grid',
  45000,  // 45 MWh
  'PT',
  2024    // Dados de 2024
)
// Usa fator de 2024: 0.270 kg/kWh
// Resultado: 12,150 kg CO2e
```

## Best Practices

### ✅ DO: Use o fator correto para cada ano
```typescript
// BOM ✅
const factor2022 = await getCorrectEmissionFactor('electricity', 'PT', 2022)
const emissions2022 = consumption2022 * factor2022.value

const factor2024 = await getCorrectEmissionFactor('electricity', 'PT', 2024)
const emissions2024 = consumption2024 * factor2024.value
```

### ❌ DON'T: Use o mesmo fator para todos os anos
```typescript
// ERRADO ❌
const factor = await getEmissionFactor('electricity', 'PT')  // Qual ano?
const emissions2022 = consumption2022 * factor.value  // Fator errado!
const emissions2024 = consumption2024 * factor.value  // Fator errado!
```

### ✅ DO: Armazene dados com período correto
```sql
-- BOM ✅
INSERT INTO metrics_data (period_start, period_end, value)
VALUES ('2024-01-01', '2024-12-31', 45000);  -- Ano completo de 2024
```

### ❌ DON'T: Use datas inconsistentes
```sql
-- ERRADO ❌
INSERT INTO metrics_data (period_start, period_end, value)
VALUES ('2024-01-01', '2023-12-31', 45000);  -- period_end < period_start?!
```

### ✅ DO: Use views para análises
```sql
-- BOM ✅ - Simples e otimizado
SELECT * FROM yearly_yoy_comparison
WHERE organization_id = 'org-uuid';
```

### ❌ DON'T: Recrie queries complexas repetidamente
```sql
-- ERRADO ❌ - Complexo e propenso a erros
WITH current AS (...), previous AS (...)
SELECT ... -- 50 linhas de SQL complexo
```

## Estratégia de Backfill (Dados Históricos)

### Se você tem dados de anos anteriores:

```typescript
// scripts/backfill-historical-data.ts

async function backfillData() {
  const historicalData = [
    // Dados de 2020
    { year: 2020, electricity_kwh: 55200, fuel_liters: 5000 },
    // Dados de 2021
    { year: 2021, electricity_kwh: 52800, fuel_liters: 4800 },
    // Dados de 2022
    { year: 2022, electricity_kwh: 50000, fuel_liters: 4500 },
  ]

  for (const yearData of historicalData) {
    // 1. Buscar fator correto para o ano
    const electricityFactor = await getCorrectEmissionFactor(
      'electricity grid',
      'PT',
      yearData.year
    )

    const fuelFactor = await getCorrectEmissionFactor(
      'diesel fuel',
      'PT',
      yearData.year
    )

    // 2. Calcular emissões
    const electricityCO2e = yearData.electricity_kwh * electricityFactor.value
    const fuelCO2e = yearData.fuel_liters * fuelFactor.value

    // 3. Inserir em metrics_data
    await supabase.from('metrics_data').insert([
      {
        metric_id: 'electricity-metric-id',
        organization_id: 'org-id',
        period_start: `${yearData.year}-01-01`,
        period_end: `${yearData.year}-12-31`,
        value: yearData.electricity_kwh,
        co2e_emissions: electricityCO2e,
        metadata: {
          emission_factor: {
            value: electricityFactor.value,
            year: electricityFactor.source_year,
            source: electricityFactor.source_dataset
          }
        }
      },
      {
        metric_id: 'fuel-metric-id',
        organization_id: 'org-id',
        period_start: `${yearData.year}-01-01`,
        period_end: `${yearData.year}-12-31`,
        value: yearData.fuel_liters,
        co2e_emissions: fuelCO2e
      }
    ])
  }

  console.log('✅ Backfill completo!')
}
```

## Dashboard Multi-Ano (Exemplo)

```typescript
// src/app/dashboard/multi-year/page.tsx

import { LineChart, BarChart } from '@/components/charts'

export default async function MultiYearDashboard({ params }: { params: { orgId: string } }) {
  // 1. Buscar tendência de emissões
  const emissionsTrend = await supabase.rpc('get_metric_trend', {
    p_organization_id: params.orgId,
    p_metric_code: 'gri_305_1_direct_emissions',
    p_start_year: 2020,
    p_end_year: 2024
  })

  // 2. Buscar comparação YoY
  const yoyComparison = await supabase
    .from('yearly_yoy_comparison')
    .select('*')
    .eq('organization_id', params.orgId)
    .eq('current_year', 2024)

  // 3. Buscar completude GRI
  const griCompleteness = await supabase
    .from('gri_yearly_completeness')
    .select('*')
    .eq('organization_id', params.orgId)
    .gte('year', 2020)

  return (
    <div className="space-y-8">
      {/* Tendência de 5 anos */}
      <Card>
        <h2>Emissões GRI 305-1 (2020-2024)</h2>
        <LineChart
          data={emissionsTrend.data}
          xKey="year"
          yKeys={['total_co2e']}
          trend={true}  // Mostrar linha de tendência
        />
      </Card>

      {/* Comparação YoY */}
      <Card>
        <h2>Mudanças 2024 vs 2023</h2>
        <BarChart
          data={yoyComparison.data}
          xKey="metric_name"
          yKey="co2e_change_pct"
          colors={(value) => value < 0 ? 'green' : 'red'}  // Verde se redução
        />
      </Card>

      {/* Completude GRI */}
      <Card>
        <h2>Completude GRI ao longo dos anos</h2>
        <LineChart
          data={griCompleteness.data}
          xKey="year"
          yKeys={['completeness_pct']}
          groupBy="gri_standard"
        />
      </Card>
    </div>
  )
}
```

## Resumo

### ✅ Sistema já preparado para multi-ano:
1. `metrics_data` tem `period_start`/`period_end`
2. `emission_factors_cache` tem `source_year`
3. YoY comparison já implementado em `energy.ts`

### ✅ Novas funcionalidades adicionadas:
1. **4 Views SQL** para análises multi-ano
2. **2 Funções** para tendências e fatores corretos
3. **Indexes** para performance

### ✅ Próximos passos:
1. Executar migration: `20250105_add_yearly_views.sql`
2. Fazer backfill de dados históricos (se tiver)
3. Criar dashboard multi-ano
4. Implementar relatórios GRI multi-ano

### 🎯 Resultado Final:
- ✅ Análise de tendências de 5+ anos
- ✅ Comparação YoY automática
- ✅ Fatores de emissão corretos por ano
- ✅ Relatórios GRI multi-ano
- ✅ Performance otimizada com views e indexes
