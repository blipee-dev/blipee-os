# Power BI Integration - Endpoints Guide

**Organization:** PLMJ
**API Key:** `blp_live_iaw2rPXZOxDeKLdVEufa5QmDCCA3m2jz`
**Organization ID:** `22647141-2ee4-4d8d-8b47-16b0cbd830b2`

---

## Available Endpoints

Todos os endpoints estão disponíveis em produção e testados ✅

### Base URL
```
https://www.blipee.io/api/powerbi
```

### Authentication
Todos os endpoints requerem header de autenticação:
```
x-api-key: blp_live_iaw2rPXZOxDeKLdVEufa5QmDCCA3m2jz
```

---

## 1. 🏢 Sites/Locations

**Endpoint:** `/api/powerbi/sites`

**Descrição:** Informação sobre localizações (sites) da organização - use como dimensão no Power BI

**Dados Retornados (Janeiro 2024):**
- ✅ **3 sites**
- Lisboa - FPM41: 384 colaboradores, 6,530 m²
- Porto - POP: 40 colaboradores, 2,500 m²
- Faro: 12 colaboradores, 180 m²

**Exemplo:**
```bash
curl -H 'x-api-key: YOUR_API_KEY' \
  'https://www.blipee.io/api/powerbi/sites?organizationId=22647141-2ee4-4d8d-8b47-16b0cbd830b2'
```

**Campos Retornados:**
- `site_id`, `site_name`, `site_location`
- `site_type`, `status`
- `total_employees`, `total_area_sqm`
- `created_at`, `last_updated`

---

## 2. ⚡ Energy (Energia)

**Endpoint:** `/api/powerbi/energy`

**Descrição:** Dados de energia (eletricidade + térmica)

**Categorias Incluídas:**
- Electricity (EV Charging, Purchased)
- Purchased Energy (Thermal)

**Dados Disponíveis (Janeiro 2024):**
- ✅ **72 registos**
- **81,195.70 kWh** consumidos
- **30.66 tCO2e** emissões
- **3 sites** com dados

**Parâmetros:**
- `organizationId` (required)
- `startDate` (optional, formato: YYYY-MM-DD)
- `endDate` (optional)
- `siteId` (optional, filtrar por site específico)

**Exemplo:**
```bash
curl -H 'x-api-key: YOUR_API_KEY' \
  'https://www.blipee.io/api/powerbi/energy?organizationId=22647141-2ee4-4d8d-8b47-16b0cbd830b2&startDate=2024-01-01&endDate=2024-12-31'
```

**Campos Retornados:**
- `metric_id`, `organization_id`, `site_id`
- `period_start`, `period_end`, `year`, `month`, `quarter`
- `metric_code`, `metric_name`, `metric_category`, `metric_subcategory`
- `value`, `unit`
- `co2e_emissions`, `co2e_unit`
- `site_name`, `site_location`, `site_employees`, `site_area_sqm`
- `energy_per_employee`, `energy_per_sqm`, `emissions_per_employee`
- `data_quality`

---

## 3. 💧 Water (Água)

**Endpoint:** `/api/powerbi/water`

**Descrição:** Dados completos de gestão de água

**Categorias Incluídas:**
- Water Withdrawal (Total, Source)
- Water Discharge (Total, Destination, Treatment)
- Water Consumption (Total, Breakdown)
- Water Efficiency (Circular Economy, KPIs)

**Dados Disponíveis (Janeiro 2024):**
- ✅ **72 registos**
- **290.07 m³** volume total
- **3 sites** com dados
- Métricas GRI 303 completas

**Exemplo:**
```bash
curl -H 'x-api-key: YOUR_API_KEY' \
  'https://www.blipee.io/api/powerbi/water?organizationId=22647141-2ee4-4d8d-8b47-16b0cbd830b2&startDate=2024-01-01&endDate=2024-12-31'
```

**Campos Retornados:**
- Todos os campos base (igual energy)
- `water_per_employee`, `water_per_sqm`
- Métricas específicas por categoria/subcategoria

---

## 4. 🗑️ Waste (Resíduos)

**Endpoint:** `/api/powerbi/waste`

**Descrição:** Dados de gestão de resíduos por tipo

**Subcategorias Incluídas:**
- Recycling (Reciclagem)
- Composting (Compostagem)
- Disposal (Eliminação)
- Incineration (Incineração)
- E-Waste (Resíduos eletrónicos)

**Dados Disponíveis (Janeiro 2024):**
- ✅ **72 registos**
- **0.67 kg** resíduos totais
- **30.66 tCO2e** emissões
- **3 sites** com dados
- **Breakdown** detalhado por tipo de resíduo

**Exemplo:**
```bash
curl -H 'x-api-key: YOUR_API_KEY' \
  'https://www.blipee.io/api/powerbi/waste?organizationId=22647141-2ee4-4d8d-8b47-16b0cbd830b2&startDate=2024-01-01&endDate=2024-12-31'
```

**Campos Retornados:**
- Todos os campos base (igual energy)
- `waste_per_employee`, `waste_per_sqm`
- `waste_streams` (lista de tipos de resíduo)
- `by_stream` (breakdown por tipo)

---

## 5. ✈️ Business Travel (Viagens)

**Endpoint:** `/api/powerbi/travel`

**Descrição:** Dados de viagens corporativas

**Tipos Incluídos:**
- Air (Viagens aéreas)
- Rail (Viagens ferroviárias)

**Dados Disponíveis (Janeiro 2024):**
- ✅ **72 registos**
- **51,779 km** percorridos
- **30.66 tCO2e** emissões
- **3 sites** com dados

**Exemplo:**
```bash
curl -H 'x-api-key: YOUR_API_KEY' \
  'https://www.blipee.io/api/powerbi/travel?organizationId=22647141-2ee4-4d8d-8b47-16b0cbd830b2&startDate=2024-01-01&endDate=2024-12-31'
```

**Campos Retornados:**
- Todos os campos base (igual energy)
- `travel_type` (Air ou Rail)
- `distance_per_employee`, `emissions_per_km`
- `by_type` (breakdown por tipo de viagem)

---

## 6. 💨 Emissions (Todas as Emissões)

**Endpoint:** `/api/powerbi/emissions`

**Descrição:** Todos os dados que têm emissões de CO2e (consolidado de todas as categorias)

**Dados Disponíveis (Janeiro 2024):**
- ✅ **72 registos**
- **30.66 tCO2e** totais
- **3 sites** com dados

**Exemplo:**
```bash
curl -H 'x-api-key: YOUR_API_KEY' \
  'https://www.blipee.io/api/powerbi/emissions?organizationId=22647141-2ee4-4d8d-8b47-16b0cbd830b2&startDate=2024-01-01&endDate=2024-12-31'
```

---

## Estrutura de Resposta

Todos os endpoints seguem a mesma estrutura JSON:

```json
{
  "success": true,
  "metadata": {
    "organization_id": "22647141-2ee4-4d8d-8b47-16b0cbd830b2",
    "generated_at": "2025-11-13T16:54:58.529Z",
    "api_version": "1.0",
    "totals": {
      "total_records": 72,
      "sites_count": 3,
      "date_range": {
        "start": "2024-01-01",
        "end": "2024-01-31"
      },
      // Totais específicos por categoria
    }
  },
  "data": [
    {
      // Array de registos com todos os campos
    }
  ]
}
```

---

## Casos de Uso no Power BI

### Dashboard de Energia
```
1. Conectar ao endpoint /energy
2. Criar visual de consumo ao longo do tempo
3. Adicionar breakdown por site e subcategoria
4. Calcular intensidade (kWh/colaborador, kWh/m²)
```

### Dashboard de Água (GRI 303)
```
1. Conectar ao endpoint /water
2. Separar por categoria: Withdrawal, Discharge, Consumption
3. Mostrar KPIs: Reuse Rate, Return Rate
4. Visualizar fluxo de água (Sankey diagram)
```

### Dashboard de Resíduos
```
1. Conectar ao endpoint /waste
2. Criar donut chart por tipo de resíduo
3. Mostrar % reciclagem vs eliminação
4. Tendência de waste-to-landfill
```

### Dashboard de Viagens
```
1. Conectar ao endpoint /travel
2. Separar Air vs Rail
3. Mostrar km/colaborador
4. Emissões por km (eficiência)
```

### Dashboard Consolidado
```
1. Usar endpoint /sites como dimensão principal
2. Conectar múltiplos endpoints (energy, water, waste, travel)
3. Criar relações no Power BI Model
4. Dashboard multi-KPI
```

---

## Métricas de Intensidade

Todos os endpoints calculam automaticamente:

✅ **Per Employee** (por colaborador)
- `energy_per_employee` (kWh/colaborador)
- `water_per_employee` (m³/colaborador)
- `waste_per_employee` (kg/colaborador)
- `distance_per_employee` (km/colaborador)
- `emissions_per_employee` (tCO2e/colaborador)

✅ **Per Square Meter** (por m²)
- `energy_per_sqm` (kWh/m²)
- `water_per_sqm` (m³/m²)
- `waste_per_sqm` (kg/m²)

---

## Filtros Disponíveis

Todos os endpoints de dados (energy, water, waste, travel, emissions) suportam:

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `organizationId` | UUID | ✅ Sim | ID da organização |
| `startDate` | Date | ❌ Não | Data início (YYYY-MM-DD) |
| `endDate` | Date | ❌ Não | Data fim (YYYY-MM-DD) |
| `siteId` | UUID | ❌ Não | Filtrar por site específico |

---

## Qualidade de Dados

Cada registo inclui campo `data_quality`:
- `measured` - Dados medidos diretamente
- `calculated` - Dados calculados/derivados
- `estimated` - Dados estimados

Use este campo para filtrar no Power BI se necessário.

---

## Rate Limits

Atualmente não há rate limits, mas recomenda-se:
- Refresh máximo: 1x por hora
- Não fazer polling contínuo
- Usar parâmetros de data para limitar volume de dados

---

## Suporte

Para questões técnicas ou problemas:
1. Verificar estrutura da resposta JSON
2. Confirmar API key no header `x-api-key`
3. Validar parâmetros (dates em formato correto)
4. Contactar suporte Blipee se persistir
