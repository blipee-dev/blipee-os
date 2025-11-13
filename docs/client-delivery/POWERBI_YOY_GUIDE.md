# Power BI - Year over Year (YoY) Analysis Guide

**PLMJ tem dados de 2022 a 2025** - Perfeito para análise temporal e comparações YoY!

---

## ✅ 1. Breakdown Temporal Disponível

Os endpoints retornam campos temporais prontos para usar:

```json
{
  "period_start": "2024-01-01",
  "period_end": "2024-01-31",
  "year": 2024,
  "month": 1,
  "quarter": 1
}
```

### No Power BI:
- Arraste `year` para o eixo X → Gráfico anual
- Arraste `month` para o eixo X → Gráfico mensal
- Arraste `quarter` para o eixo X → Gráfico trimestral
- Use `period_start` como date hierarchy → Drill-down automático

---

## ✅ 2. Intensidades Automáticas

Todos os endpoints já calculam métricas de intensidade:

### Energy Endpoint
```json
{
  "value": 2593.4,
  "unit": "kWh",
  "energy_per_employee": 6.75,      // kWh por colaborador
  "energy_per_sqm": 0.40,            // kWh por m²
  "emissions_per_employee": 0.00111  // tCO2e por colaborador
}
```

### Water Endpoint
```json
{
  "value": 32.95,
  "unit": "m³",
  "water_per_employee": 0.086,  // m³ por colaborador
  "water_per_sqm": 0.005        // m³ por m²
}
```

### Waste Endpoint
```json
{
  "value": 29.8,
  "unit": "kg",
  "waste_per_employee": 0.078,  // kg por colaborador
  "waste_per_sqm": 0.0046       // kg por m²
}
```

### Travel Endpoint
```json
{
  "value": 49862,
  "unit": "km",
  "distance_per_employee": 129.85,    // km por colaborador
  "emissions_per_employee": 0.019,    // tCO2e por colaborador
  "emissions_per_km": 0.00015         // tCO2e por km
}
```

### No Power BI:
- Use estas métricas diretamente em visuais
- Compare intensidades entre sites
- Acompanhe evolução ao longo do tempo

---

## ✅ 3. Análise Year over Year (YoY)

### Dados Disponíveis (PLMJ):
```
2022: 664 registos | 1,208,854 kWh | 457.40 tCO2e (12 meses)
2023: 672 registos |   523,741 kWh | 199.57 tCO2e (12 meses)
2024: 850 registos | Dados completos (12 meses)
2025: 450 registos | Dados parciais (10 meses até Outubro)
```

### Opção 1: YoY Automático no Power BI

**Passo 1:** Buscar dados de todos os anos
```bash
# Endpoint com range amplo
GET /api/powerbi/energy?
    organizationId=22647141-2ee4-4d8d-8b47-16b0cbd830b2&
    startDate=2022-01-01&
    endDate=2025-12-31
```

**Passo 2:** Criar medida DAX para YoY %
```dax
Energy YoY % =
VAR CurrentYear =
    CALCULATE(
        SUM(Energy[value]),
        Energy[year] = MAX(Energy[year])
    )
VAR PreviousYear =
    CALCULATE(
        SUM(Energy[value]),
        Energy[year] = MAX(Energy[year]) - 1
    )
RETURN
    DIVIDE(CurrentYear - PreviousYear, PreviousYear)
```

**Passo 3:** Criar medida DAX para variação absoluta
```dax
Energy YoY Absolute =
VAR CurrentYear =
    CALCULATE(
        SUM(Energy[value]),
        Energy[year] = MAX(Energy[year])
    )
VAR PreviousYear =
    CALCULATE(
        SUM(Energy[value]),
        Energy[year] = MAX(Energy[year]) - 1
    )
RETURN
    CurrentYear - PreviousYear
```

### Opção 2: YoY usando Time Intelligence

**Passo 1:** Criar tabela Calendar no Power BI
```dax
Calendar =
ADDCOLUMNS(
    CALENDAR(DATE(2022,1,1), DATE(2025,12,31)),
    "Year", YEAR([Date]),
    "Month", MONTH([Date]),
    "MonthName", FORMAT([Date], "MMM"),
    "Quarter", QUARTER([Date]),
    "YearMonth", FORMAT([Date], "YYYY-MM")
)
```

**Passo 2:** Relacionar com dados
- Criar relação entre `Calendar[Date]` e `Energy[period_start]`

**Passo 3:** Usar funções Time Intelligence
```dax
Energy Same Period Last Year =
CALCULATE(
    SUM(Energy[value]),
    SAMEPERIODLASTYEAR(Calendar[Date])
)

Energy YoY Growth =
VAR CurrentPeriod = SUM(Energy[value])
VAR LastYear = [Energy Same Period Last Year]
RETURN
    DIVIDE(CurrentPeriod - LastYear, LastYear)
```

---

## 📊 Exemplos de Visualizações YoY

### 1. Gráfico de Linha: Consumo Mensal Multi-Ano

**Setup:**
- Eixo X: `period_start` (hierarchy: Year → Month)
- Eixo Y: `SUM(value)`
- Legenda: `year`
- Filtro: `unit = "kWh"`

**Resultado:** Linhas de tendência para cada ano, fácil comparar sazonalidade

### 2. Gráfico de Colunas: YoY por Site

**Setup:**
- Eixo X: `site_name`
- Eixo Y: `[Energy YoY %]` (medida criada)
- Cores condicionais: Verde se > 0%, Vermelho se < 0%

**Resultado:** Barras mostrando % mudança por site

### 3. Cartão: Total YoY Variation

**Setup:**
- Valor: `[Energy YoY %]`
- Formatação condicional
- Adicionar seta: ↑ ou ↓

**Resultado:** KPI destaque no dashboard

### 4. Tabela: Breakdown Detalhado

**Setup:**
```
Site | 2023 | 2024 | Variação Abs | Variação %
-----|------|------|--------------|------------
Lisboa | 450 | 523 | +73 kWh | +16.2%
Porto  | 89  | 95  | +6 kWh  | +6.7%
Faro   | 45  | 48  | +3 kWh  | +6.7%
```

**DAX:**
```dax
Table =
SUMMARIZE(
    Energy,
    Energy[site_name],
    "2023", CALCULATE(SUM(Energy[value]), Energy[year]=2023),
    "2024", CALCULATE(SUM(Energy[value]), Energy[year]=2024),
    "Absolute", [Energy YoY Absolute],
    "Percent", [Energy YoY %]
)
```

### 5. Gráfico Combo: Consumo + YoY %

**Setup:**
- Eixo X: `month`
- Eixo Y primário (colunas): `SUM(value)` para 2023 e 2024
- Eixo Y secundário (linha): `[Energy YoY %]`

**Resultado:** Visual híbrido mostrando valores absolutos + crescimento

---

## 🎯 Métricas Sugeridas para YoY

### Energy
```dax
Energy Consumption 2024 =
CALCULATE(SUM(Energy[value]), Energy[year]=2024)

Energy Consumption 2023 =
CALCULATE(SUM(Energy[value]), Energy[year]=2023)

Energy YoY kWh = [Energy Consumption 2024] - [Energy Consumption 2023]

Energy YoY % =
DIVIDE([Energy YoY kWh], [Energy Consumption 2023])
```

### Emissions
```dax
Emissions 2024 =
CALCULATE(SUM(Emissions[co2e_emissions]), Emissions[year]=2024)

Emissions 2023 =
CALCULATE(SUM(Emissions[co2e_emissions]), Emissions[year]=2023)

Emissions Reduction % =
DIVIDE([Emissions 2023] - [Emissions 2024], [Emissions 2023])
```

### Intensidades YoY
```dax
Energy Intensity 2024 =
CALCULATE(
    AVERAGE(Energy[energy_per_employee]),
    Energy[year]=2024
)

Energy Intensity 2023 =
CALCULATE(
    AVERAGE(Energy[energy_per_employee]),
    Energy[year]=2023
)

Intensity Improvement % =
DIVIDE(
    [Energy Intensity 2023] - [Energy Intensity 2024],
    [Energy Intensity 2023]
)
```

---

## 📈 Dashboard Exemplo: Multi-Year Analysis

```
┌─────────────────────────────────────────────────────────────┐
│ PLMJ Energy Dashboard - Multi-Year Analysis                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│ │ Total 2024   │  │ YoY Change   │  │ YoY %        │     │
│ │ 523,741 kWh  │  │ -685,113 kWh │  │ -56.7% ↓     │     │
│ └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
│ ┌───────────────────────────────────────────────────────┐ │
│ │      Energy Consumption Trend (2022-2024)             │ │
│ │                                                       │ │
│ │  1.2M │                                               │ │
│ │  1.0M │ ████████████                                  │ │
│ │  800K │ ████████████                                  │ │
│ │  600K │ ████████████ ██████                           │ │
│ │  400K │ ████████████ ██████                           │ │
│ │  200K │ ████████████ ██████                           │ │
│ │    0K └──────┴──────┴──────┴──────┴──────┴──────     │ │
│ │       Jan   Apr   Jul   Oct   Jan   Apr              │ │
│ │       ─ 2022 ─ 2023 ─ 2024                           │ │
│ └───────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────┐  ┌────────────────────────┐  │
│ │ Intensity Per Employee  │  │ YoY by Site            │  │
│ │                         │  │                        │  │
│ │ 2022: 3,148 kWh/person │  │ Lisboa: -56.8% ↓       │  │
│ │ 2023: 1,364 kWh/person │  │ Porto:  -55.9% ↓       │  │
│ │ 2024: In progress...   │  │ Faro:   -58.1% ↓       │  │
│ │                         │  │                        │  │
│ │ Improvement: 56.7% ✓    │  │ All sites improved ✓  │  │
│ └─────────────────────────┘  └────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Configuração Rápida

### 1. Conectar Dados Multi-Ano
```
Power BI Desktop
→ Get Data
→ Web
→ URL: https://www.blipee.io/api/powerbi/energy?organizationId=22647141-2ee4-4d8d-8b47-16b0cbd830b2&startDate=2022-01-01&endDate=2025-12-31
→ Advanced
→ HTTP Headers: x-api-key = blp_live_iaw2rPXZOxDeKLdVEufa5QmDCCA3m2jz
```

### 2. Expandir JSON
```
Power Query Editor
→ Clicar em "data" column
→ "Expand to New Rows"
→ Selecionar todos os campos
→ OK
```

### 3. Criar Coluna YoY
```
Add Column
→ Custom Column
→ Nome: "Year_Label"
→ Fórmula: if [year] = 2024 then "2024" else if [year] = 2023 then "2023" else "Outros"
```

### 4. Criar Medidas YoY
```
New Measure
→ Copiar DAX examples acima
→ Testar no visual
```

### 5. Publicar
```
File → Publish → Publish to Power BI
→ Selecionar workspace
→ Configurar scheduled refresh (diário ou semanal)
```

---

## 📅 Periodicidade Recomendada

Para melhores análises YoY:

| Métrica | Frequência Refresh | Análise Típica |
|---------|-------------------|----------------|
| Energy | Mensal | MoM, YoY, QoQ |
| Water | Mensal | MoM, YoY, sazonalidade |
| Waste | Mensal | YoY, waste diversion rate |
| Travel | Mensal | YoY, business activity correlation |
| Emissions | Mensal | YoY, decarbonization progress |

---

## ✅ Checklist de Análise YoY

- [ ] Dados de pelo menos 2 anos completos
- [ ] Mesma metodologia de medição entre anos
- [ ] Normalizar por intensidade (per employee/sqm)
- [ ] Considerar fatores externos (ex: COVID em 2020-2021)
- [ ] Documentar mudanças significativas
- [ ] Verificar data quality consistency
- [ ] Aplicar filtros apropriados (ex: remover outliers)

---

## 🎓 Dicas Avançadas

### 1. Normalização para comparação justa
```dax
Normalized Energy =
DIVIDE(
    SUM(Energy[value]),
    AVERAGE(Sites[total_employees])  // Normalizar por nº colaboradores
)
```

### 2. Excluir meses parciais
```dax
Complete Months Only =
FILTER(
    Energy,
    NOT(Energy[year] = YEAR(TODAY()) && Energy[month] > MONTH(TODAY()))
)
```

### 3. Benchmark contra target
```dax
vs Target =
VAR Actual = SUM(Energy[value])
VAR Target = 1000000  // Target anual em kWh
RETURN
    DIVIDE(Actual - Target, Target)
```

---

## 📊 Resumo

**SIM, os endpoints permitem:**

✅ **Breakdowns por mês** - Campos `year`, `month`, `quarter`, `period_start`
✅ **Intensidades automáticas** - `per_employee`, `per_sqm` já calculados
✅ **Análise YoY** - Dados de 2022-2025 disponíveis (4 anos!)

**No Power BI pode:**
- Criar dashboards multi-ano
- Calcular variações YoY, MoM, QoQ
- Comparar intensidades entre sites e anos
- Visualizar tendências e sazonalidade
- Fazer forecasting baseado em histórico

**Tudo está pronto para análise temporal completa!** 🚀
