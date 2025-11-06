# Electricity Maps API - Análise Completa

## Visão Geral
A API Electricity Maps v3 fornece dados abrangentes sobre intensidade de carbono, mix de energia, preços e otimização para computação consciente do carbono.

**Base URL**: `https://api.electricitymaps.com/v3`
**Autenticação**: Header `auth-token: my-api-token`

---

## 🎯 Principais Categorias de Endpoints

### 1. **Carbon Intensity** (Intensidade de Carbono)
Métrica principal: `gCO2eq/kWh`

#### Endpoints:
- `GET /v3/carbon-intensity/past` - Ponto específico no passado
- `GET /v3/carbon-intensity/past-range` - Intervalo no passado (limite: 10 dias hourly, 100 dias daily)
- `GET /v3/carbon-intensity/history` - Últimas 24 horas
- `GET /v3/carbon-intensity/latest` - Dados mais recentes
- `GET /v3/carbon-intensity/forecast` - Previsão futura (25 horas padrão, até 72h)

#### Parâmetros Principais:
```
zone: string (ex: "DE", "FR", "US-CAL-CISO")
lat/lon: coordenadas geográficas alternativas
datetime: ISO format (ex: "2025-11-05T15:00Z")
temporalGranularity: "5_minutes" | "15_minutes" | "hourly" | "daily" | "weekly" | "monthly" | "quarterly" | "yearly"
emissionFactorType: "lifecycle" (LCA padrão) | "direct" (operacional)
disableEstimations: boolean
```

#### Resposta Exemplo:
```json
{
  "zone": "DE",
  "carbonIntensity": 322,
  "datetime": "2019-05-21T00:00:00.000Z",
  "updatedAt": "2022-04-07T15:32:21.002Z",
  "emissionFactorType": "lifecycle",
  "isEstimated": false,
  "temporalGranularity": "hourly"
}
```

---

### 2. **Carbon Intensity Fossil Only** (Apenas Combustíveis Fósseis)
Intensidade de carbono considerando apenas fontes fósseis (proxy para residual mix)

Mesma estrutura de endpoints que Carbon Intensity:
- `/past`, `/past-range`, `/history`, `/latest`, `/forecast`

**Uso**: Útil para calcular intensidade de carbono do residual mix

---

### 3. **Renewable Energy** (Energia Renovável)
Percentual de energia renovável: `%`

Endpoints idênticos à estrutura de Carbon Intensity:
- `/past`, `/past-range`, `/history`, `/latest`, `/forecast`

```json
{
  "zone": "DE",
  "datetime": "2019-05-21T00:00:00.000Z",
  "unit": "%",
  "value": "84",
  "isEstimated": false
}
```

---

### 4. **Carbon-Free Energy** (Energia Livre de Carbono)
Percentual de energia livre de carbono (renováveis + nuclear): `%`

Endpoints: `/past`, `/past-range`, `/history`, `/latest`, `/forecast`

---

### 5. **Electricity Mix** (Mix de Eletricidade)
Mix detalhado de eletricidade por fonte de energia

#### Fontes Disponíveis:
- Nuclear
- Geothermal
- Biomass
- Coal
- Wind
- Solar
- Hydro
- Gas
- Oil
- Unknown
- Hydro discharge
- Battery discharge

#### Endpoints Principais:
- `GET /v3/electricity-mix/past`
- `GET /v3/electricity-mix/past-range`
- `GET /v3/electricity-mix/history`
- `GET /v3/electricity-mix/latest`
- `GET /v3/electricity-mix/forecast`

#### Endpoints por Fonte:
- `GET /v3/electricity-mix/<sourceType>/past`
  - Exemplos: `/solar/past`, `/wind/past`, `/nuclear/past`

#### Parâmetros Especiais:
```
flowTraced: boolean (default: true) - rastreia importações/exportações
```

#### Resposta Exemplo:
```json
{
  "zone": "FR",
  "temporalGranularity": "hourly",
  "unit": "MW",
  "data": [{
    "datetime": "2024-05-28T00:00:00.000Z",
    "mix": {
      "nuclear": 27258,
      "wind": 2604,
      "solar": 0,
      "hydro": 5485,
      "gas": 325,
      "biomass": 534,
      "coal": 0,
      "oil": 80
    }
  }]
}
```

---

### 6. **Electricity Flows** (Fluxos de Eletricidade)
Importações e exportações entre zonas (MW)

Endpoints: `/past`, `/past-range`, `/history`, `/latest`, `/forecast`

```json
{
  "zone": "PL",
  "data": [{
    "datetime": "2024-05-19T03:00:00.000Z",
    "import": {
      "CZ": 0,
      "DE": 135,
      "LT": 74
    },
    "export": {
      "CZ": 550,
      "DE": 0,
      "UA": 256
    }
  }]
}
```

---

### 7. **Power Breakdown** ⚠️ (SERÁ DESCONTINUADO)
**Nota**: Será substituído por electricity-mix e electricity-flows

Inclui:
- powerConsumptionBreakdown
- powerProductionBreakdown
- powerImportBreakdown
- powerExportBreakdown
- fossilFreePercentage
- renewablePercentage

---

### 8. **Price Day-Ahead** (Preços Day-Ahead)
Preços de mercado em moeda local (ex: EUR/MWh, AUD/MWh)

#### Endpoints:
- `/past`, `/past-range`, `/history`, `/latest`
- `/forecast` - Combina preços publicados + previsões da Electricity Maps
- `/actual` - Apenas preços publicados pelos operadores
- `/modeled` - Apenas previsões da Electricity Maps (até 72h)

```json
{
  "zone": "AU-NSW",
  "datetime": "2024-05-19T03:00:00.000Z",
  "value": 10.14,
  "unit": "AUD/MWh",
  "source": "opennem.org.au"
}
```

---

### 9. **Total Load** (Carga Total)
Carga total disponível na rede (demand/consumption total): `MW`

Endpoints: `/past`, `/past-range`, `/history`, `/latest`, `/forecast`

---

### 10. **Net Load** (Carga Líquida)
Carga total **menos solar e vento** (com flow-tracing): `MW`

> Representa a carga que precisa ser atendida por outras fontes (principalmente fósseis)

Endpoints: `/past`, `/past-range`, `/history`, `/latest`, `/forecast`

---

### 11. **Levels** (Níveis Comparativos)
Sinal comparativo com média dos últimos 10 dias: `high` | `moderate` | `low`

#### Limiares:
- **Low**: 15% abaixo da média (ratio < 0.85)
- **Moderate**: entre -15% e +15% (0.85 ≤ ratio ≤ 1.15)
- **High**: 15% acima da média (ratio > 1.15)

#### Endpoints:
- `GET /v3/carbon-intensity-level/latest`
- `GET /v3/carbon-free-percentage-level/latest`
- `GET /v3/renewable-percentage-level/latest`

```json
{
  "zone": "DK-DK2",
  "data": [{
    "level": "high",
    "datetime": "2025-06-12T17:00:00.000Z"
  }]
}
```

---

### 12. **Optimizers** (Otimizadores)
Para carbon-aware computing e smart charging

#### Carbon Aware Optimizer
`POST /v3/carbon-aware-optimizer`

Determina melhor tempo e localização para executar job flexível.

**Request Body:**
```json
{
  "duration": "PT3H",
  "startWindow": "2025-06-16T15:00:00+00:00",
  "endWindow": "2025-06-22T01:00:00+00:00",
  "locations": [
    {"dataCenterProvider": "gcp", "dataCenterRegion": "europe-west1"},
    {"dataCenterProvider": "gcp", "dataCenterRegion": "europe-north1"}
  ],
  "optimizationMetric": "flow-traced_carbon_intensity"
}
```

**Métricas de Otimização:**
- `flow-traced_carbon_intensity`
- `net_load`
- `flow-traced_renewable_share`

**Response:**
```json
{
  "optimalStartTime": "2025-06-17T15:00:00.000Z",
  "optimalLocation": {
    "dataCenterProvider": "gcp",
    "dataCenterRegion": "europe-north1"
  },
  "optimizationOutput": {
    "metricValueImmediateExecution": 55.45,
    "metricValueOptimalExecution": 51.79,
    "metricValueStartWindowExecution": 55.37,
    "metricUnit": "gCO2/kWh"
  }
}
```

#### Smart Charging Optimizer
`POST /v3/smart-charging-optimizer`

Similar ao carbon-aware mas para carregamento de veículos elétricos.

```json
{
  "duration": "PT3H",
  "startWindow": "2025-08-19T17:00:00+00:00",
  "endWindow": "2025-08-21T01:00:00+00:00",
  "locations": [[2.35072, 48.8512576]],
  "optimizationMetric": "flow-traced_carbon_intensity",
  "powerConsumption": 100
}
```

---

### 13. **Updated Since** (Atualizações)
`GET /v3/updated-since`

Lista horas onde dados foram atualizados desde data especificada.

**Parâmetros:**
```
since: datetime ISO
start/end: intervalo a verificar (opcional)
limit: max 1000
threshold: duração ISO 8601 - filtrar apenas mudanças maiores que threshold
```

---

### 14. **Zone & Zones** (Zonas)

#### Get Zone from Coordinates
`GET /v3/zone?lat={lat}&lon={lon}`

Retorna zona Electricity Maps de coordenadas.

#### List All Zones
`GET /v3/zones`

Lista todas as zonas disponíveis e rotas acessíveis com o token.

```json
{
  "DE": {
    "zoneName": "Germany",
    "access": ["carbon-intensity/latest", "carbon-intensity/history"]
  },
  "PL": {
    "zoneName": "Poland",
    "access": ["*"]
  }
}
```

---

### 15. **Data Centers**
`GET /v3/data-centers`

Lista data centers mapeados pela Electricity Maps.

**Filtros:**
- `zone`: filtrar por zona
- `dataCenterProvider`: filtrar por provedor (aws, gcp, azure, etc.)
- `page`, `limit`: paginação

```json
[{
  "provider": "aws",
  "lonlat": [18.4231, -33.9221],
  "displayName": "Cape Town (af-south-1)",
  "region": "af-south-1",
  "zoneKey": "ZA",
  "status": "operational",
  "source": "https://..."
}]
```

---

## 🔑 Parâmetros de Localização

A API suporta 3 formas de especificar localização:

### 1. Zone Identifier
```
?zone=DE
?zone=FR
?zone=US-CAL-CISO
```

### 2. Geolocation
```
?lat=48.8566&lon=2.3522
```

### 3. Data Center
```
?dataCenterProvider=gcp&dataCenterRegion=europe-west1
```

---

## ⏰ Granularidade Temporal

| Valor | Descrição |
|-------|-----------|
| `5_minutes` | Dados a cada 5 minutos |
| `15_minutes` | Dados a cada 15 minutos |
| `hourly` | Dados horários (padrão) |
| `daily` | Dados diários (retorna MWh) |
| `weekly` | Dados semanais |
| `monthly` | Dados mensais |
| `quarterly` | Dados trimestrais |
| `yearly` | Dados anuais |

**Nota**: Granularidades maiores que hourly retornam dados em MWh ao invés de MW.

---

## 📏 Limites de Range

### Past-Range Endpoints:
- **Hourly**: máximo 10 dias (240 horas)
- **Daily**: máximo 100 dias

**Workaround**: Fazer loop em múltiplos ranges:
```
2025-01-01 to 2025-01-10
2025-01-10 to 2025-01-20
etc.
```

---

## 🔮 Forecast Horizons

| Parâmetro | Horas | Disponibilidade |
|-----------|-------|-----------------|
| `horizonHours=6` | 6h | Depende do plano |
| `horizonHours=24` | 24h (padrão) | Depende do plano |
| `horizonHours=48` | 48h | Depende do plano |
| `horizonHours=72` | 72h | Depende do plano |

**Nota**: forecast retorna N+1 pontos (ex: 24h = 25 pontos, de horizon 0 a 24)

---

## 🎨 Emission Factor Types

### Lifecycle (LCA) - Padrão
Inclui todo o ciclo de vida:
- Extração de recursos
- Construção de infraestrutura
- Operação
- Descomissionamento

### Direct (Operational)
Apenas emissões operacionais diretas.

```
?emissionFactorType=lifecycle
?emissionFactorType=direct
```

---

## 🌊 Flow Tracing

**Conceito**: Rastreia fluxos de importação/exportação para determinar mix real consumido.

```
?flowTraced=true (padrão)
?flowTraced=false (sem rastreamento)
```

**Impacto**:
- `flowTraced=true`: Mix consumido considerando importações
- `flowTraced=false`: Mix produzido localmente

---

## 📊 Campos Comuns nas Respostas

```json
{
  "zone": "DE",
  "datetime": "2025-06-17T15:00:00.000Z",
  "createdAt": "2025-06-17T06:55:15.908Z",
  "updatedAt": "2025-06-17T06:55:15.908Z",
  "value": 322,
  "unit": "gCO2eq/kWh",
  "isEstimated": false,
  "estimationMethod": null,
  "temporalGranularity": "hourly",
  "source": "entsoe.eu"
}
```

### Estimation Methods
- `null`: dados medidos
- `"FORECASTS_HIERARCHY"`: baseado em previsões
- `"TIME_SLICER_AVERAGE"`: média temporal
- `"MEASURED"`: dados medidos
- `"PREDICTED"`: previsão

---

## 🚀 Casos de Uso Principais

### 1. Dashboard de Intensidade de Carbono em Tempo Real
```
GET /v3/carbon-intensity/latest?zone=DE
GET /v3/carbon-intensity/history?zone=DE
```

### 2. Análise Histórica de Tendências
```
GET /v3/carbon-intensity/past-range?zone=DE&start=2025-01-01&end=2025-01-10
GET /v3/renewable-energy/past-range?zone=DE&start=2025-01-01&end=2025-01-10
```

### 3. Previsão e Planejamento
```
GET /v3/carbon-intensity/forecast?zone=DE&horizonHours=72
GET /v3/price-day-ahead/forecast?zone=DE
```

### 4. Carbon-Aware Computing
```
POST /v3/carbon-aware-optimizer
{
  "duration": "PT3H",
  "startWindow": "2025-06-16T15:00:00+00:00",
  "endWindow": "2025-06-22T01:00:00+00:00",
  "locations": [...],
  "optimizationMetric": "flow-traced_carbon_intensity"
}
```

### 5. Smart Charging de EVs
```
POST /v3/smart-charging-optimizer
{
  "duration": "PT3H",
  "locations": [[lat, lon]],
  "optimizationMetric": "flow-traced_carbon_intensity"
}
```

### 6. Relatórios de Sustentabilidade
```
GET /v3/carbon-intensity/past-range (dados históricos)
GET /v3/renewable-energy/past-range (% renovável)
GET /v3/carbon-free-energy/past-range (% livre de carbono)
```

### 7. Mix Energético Detalhado
```
GET /v3/electricity-mix/latest?zone=DE
GET /v3/electricity-mix/solar/history?zone=DE
GET /v3/electricity-mix/wind/forecast?zone=DE
```

### 8. Análise de Preços
```
GET /v3/price-day-ahead/latest?zone=DE
GET /v3/price-day-ahead/forecast?zone=DE
```

---

## ⚠️ Pontos de Atenção

### 1. Power Breakdown Deprecated
Os endpoints `/v3/power-breakdown/*` serão descontinuados.
**Migrar para**: `/v3/electricity-mix/*` + `/v3/electricity-flows/*`

### 2. Limites de Range
- Hourly: 10 dias max
- Daily: 100 dias max
- Usar loops para períodos maiores

### 3. Forecast Default
- Padrão: 25 pontos (horizons 0 a 24)
- Sempre começa no início da hora atual

### 4. Token Permissions
Nem todos os endpoints estão disponíveis para todos os tokens.
Verificar com: `GET /v3/zones` (com auth)

### 5. Estimations
Por padrão, dados estimados são incluídos.
Usar `?disableEstimations=true` para apenas dados medidos.

---

## 🔗 Integrações Sugeridas para Blipee

### 1. Métricas ESG - Carbon Intensity
```typescript
// Coletar intensidade de carbono para localizações dos sites
GET /v3/carbon-intensity/past-range?zone={zone}&start={start}&end={end}

// Calcular médias mensais/anuais
temporalGranularity=monthly
```

### 2. Dashboard de Energia Renovável
```typescript
// % Renovável em tempo real
GET /v3/renewable-energy/latest?zone={zone}

// Histórico para gráficos
GET /v3/renewable-energy/history?zone={zone}
```

### 3. Relatórios GRI 305
```typescript
// Intensidade de carbono (Scope 2)
GET /v3/carbon-intensity/past-range

// Mix de energia
GET /v3/electricity-mix/past-range?flowTraced=true

// Breakdown por fonte
GET /v3/electricity-mix/solar/past-range
GET /v3/electricity-mix/wind/past-range
```

### 4. Otimização de Data Centers
```typescript
// Listar data centers disponíveis
GET /v3/data-centers?dataCenterProvider=gcp

// Otimizar execução de jobs
POST /v3/carbon-aware-optimizer
```

### 5. Comparação de Zonas
```typescript
// Obter zona de coordenadas
GET /v3/zone?lat={lat}&lon={lon}

// Comparar múltiplas zonas
Promise.all([
  fetch('/v3/carbon-intensity/latest?zone=DE'),
  fetch('/v3/carbon-intensity/latest?zone=FR'),
  fetch('/v3/carbon-intensity/latest?zone=ES')
])
```

---

## 📝 Exemplo de Integração TypeScript

```typescript
interface ElectricityMapsConfig {
  apiToken: string;
  baseUrl: string;
}

class ElectricityMapsClient {
  constructor(private config: ElectricityMapsConfig) {}

  async getCarbonIntensity(zone: string, date?: Date) {
    const endpoint = date
      ? '/v3/carbon-intensity/past'
      : '/v3/carbon-intensity/latest';

    const params = new URLSearchParams({ zone });
    if (date) params.append('datetime', date.toISOString());

    const response = await fetch(
      `${this.config.baseUrl}${endpoint}?${params}`,
      {
        headers: {
          'auth-token': this.config.apiToken
        }
      }
    );

    return response.json();
  }

  async getRenewablePercentageRange(
    zone: string,
    start: Date,
    end: Date,
    granularity: 'hourly' | 'daily' | 'monthly' = 'daily'
  ) {
    const params = new URLSearchParams({
      zone,
      start: start.toISOString(),
      end: end.toISOString(),
      temporalGranularity: granularity
    });

    const response = await fetch(
      `${this.config.baseUrl}/v3/renewable-energy/past-range?${params}`,
      {
        headers: {
          'auth-token': this.config.apiToken
        }
      }
    );

    return response.json();
  }

  async optimizeCarbonAwareJob(job: {
    duration: string;
    startWindow: string;
    endWindow: string;
    locations: Array<{
      dataCenterProvider: string;
      dataCenterRegion: string;
    }>;
  }) {
    const response = await fetch(
      `${this.config.baseUrl}/v3/carbon-aware-optimizer`,
      {
        method: 'POST',
        headers: {
          'auth-token': this.config.apiToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...job,
          optimizationMetric: 'flow-traced_carbon_intensity'
        })
      }
    );

    return response.json();
  }
}

// Uso
const client = new ElectricityMapsClient({
  apiToken: process.env.ELECTRICITY_MAPS_TOKEN!,
  baseUrl: 'https://api.electricitymaps.com'
});

// Intensidade de carbono atual
const current = await client.getCarbonIntensity('DE');

// Histórico de renováveis
const renewables = await client.getRenewablePercentageRange(
  'DE',
  new Date('2025-01-01'),
  new Date('2025-01-31'),
  'daily'
);

// Otimizar job
const optimal = await client.optimizeCarbonAwareJob({
  duration: 'PT3H',
  startWindow: '2025-06-16T15:00:00+00:00',
  endWindow: '2025-06-22T01:00:00+00:00',
  locations: [
    { dataCenterProvider: 'gcp', dataCenterRegion: 'europe-west1' },
    { dataCenterProvider: 'gcp', dataCenterRegion: 'europe-north1' }
  ]
});
```

---

## 🎯 Recomendações

1. **Caching**: Implementar cache para dados past (não mudam)
2. **Rate Limiting**: Verificar limites do plano contratado
3. **Error Handling**: Tratar 404 (zona não disponível), 401 (auth), 429 (rate limit)
4. **Bulk Operations**: Usar past-range ao invés de múltiplas chamadas past
5. **Granularidade**: Usar granularidade apropriada (evitar 5_minutes se não necessário)
6. **Flow Tracing**: Preferir `flowTraced=true` para dados mais precisos
7. **Lifecycle**: Usar `emissionFactorType=lifecycle` para relatórios ESG completos

---

## 📚 Recursos Adicionais

- **Methodology**: Detalhes em https://www.electricitymaps.com/methodology
- **Zone Mapping**: Verificar zonas disponíveis com `/v3/zones`
- **Data Quality**: Campo `isEstimated` indica se dado é medido ou estimado
- **Updates**: Usar `/v3/updated-since` para sincronização incremental

---

## 🔐 Segurança

- **Token**: Nunca expor `auth-token` no frontend
- **Proxy**: Criar proxy backend para proteger token
- **HTTPS**: API usa apenas HTTPS
- **CORS**: Verificar políticas de CORS para aplicações web

---

*Análise gerada em: 2025-11-06*
*API Version: v3*
