# Power BI - Guia de Tabelas com Dados PLMJ

Guia passo-a-passo para criar tabelas profissionais no Power BI usando os endpoints de dados.

---

## 📊 Passo 1: Conectar aos Dados

### Opção A: Conectar a UM endpoint (ex: Energy)

```
Power BI Desktop
├─ Home Tab
├─ Get Data
├─ Web
└─ URL: https://www.blipee.io/api/powerbi/energy?organizationId=22647141-2ee4-4d8d-8b47-16b0cbd830b2&startDate=2024-01-01&endDate=2024-12-31
```

**Advanced Settings:**
```
HTTP Headers (new rows):
┌─────────────┬──────────────────────────────────────────────────┐
│ Header      │ Value                                            │
├─────────────┼──────────────────────────────────────────────────┤
│ x-api-key   │ blp_live_iaw2rPXZOxDeKLdVEufa5QmDCCA3m2jz        │
└─────────────┴──────────────────────────────────────────────────┘
```

### Opção B: Conectar a MÚLTIPLOS endpoints

Repita o processo acima para cada categoria:
- Energy → Renomear query para "Energy"
- Water → Renomear query para "Water"
- Waste → Renomear query para "Waste"
- Travel → Renomear query para "Travel"
- Sites → Renomear query para "Sites"

---

## 🔧 Passo 2: Transformar Dados (Power Query)

### 2.1. Expandir JSON

Quando conectar, verá isto no Power Query Editor:

```
┌─────────────────────────────────────┐
│ Query: Energy                       │
├─────────────────────────────────────┤
│ success      | true                 │
│ metadata     | [Record]             │ ← Ignorar
│ data         | [List]               │ ← EXPANDIR ISTO!
└─────────────────────────────────────┘
```

**Passos:**
1. Click na coluna "data"
2. No ribbon: "To Table"
3. Click no ícone de expand (↔) ao lado de "Column1"
4. Selecionar TODOS os campos
5. Desmarcar "Use original column name as prefix"
6. Click OK

### 2.2. Remover Colunas Desnecessárias

```
Right-click nas colunas: success, metadata
→ Remove Columns
```

### 2.3. Verificar Tipos de Dados

Power BI normalmente detecta automaticamente, mas confirme:

```
┌──────────────────┬─────────────┐
│ Campo            │ Tipo        │
├──────────────────┼─────────────┤
│ year             │ Whole Number│
│ month            │ Whole Number│
│ value            │ Decimal     │
│ co2e_emissions   │ Decimal     │
│ period_start     │ Date        │
│ period_end       │ Date        │
│ site_name        │ Text        │
└──────────────────┴─────────────┘
```

### 2.4. Close & Apply

```
Home Tab → Close & Apply
```

---

## 📋 Passo 3: Criar Tabela Simples

### Exemplo 1: Tabela de Consumo por Site

**Visualização:** Clique no ícone "Table" no painel Visualizations

**Arrastar campos:**
```
Columns (arrastar para cá):
├─ site_name
├─ value
├─ unit
├─ co2e_emissions
└─ data_quality
```

**Resultado:**
```
┌─────────────────┬─────────┬──────┬────────────────┬──────────────┐
│ Site            │ Value   │ Unit │ CO2e Emissions │ Data Quality │
├─────────────────┼─────────┼──────┼────────────────┼──────────────┤
│ Lisboa - FPM41  │ 2,593.4 │ kWh  │ 0.43 tCO2e     │ measured     │
│ Porto - POP     │ 467.5   │ kWh  │ 0.41 tCO2e     │ measured     │
│ Faro            │ 4.15    │ kWh  │ 0.00 tCO2e     │ calculated   │
└─────────────────┴─────────┴──────┴────────────────┴──────────────┘
```

**Formatação:**
1. Click na tabela
2. Format (paintbrush icon)
3. Ajustar:
   - Grid → Style: "Minimal"
   - Column headers → Text size: 12, Bold
   - Values → Text size: 10

---

## 📊 Exemplo 2: Tabela com Breakdown Temporal

### Consumo Mensal por Site (2024)

**Arrastar campos:**
```
Rows:
├─ site_name
└─ month (ou period_start)

Values:
├─ Sum of value
└─ Sum of co2e_emissions
```

**Configurar:**
1. Click em "month" → "Don't summarize"
2. Click em "value" → Sum
3. Click em "co2e_emissions" → Sum

**Resultado:**
```
┌─────────────────┬───────┬─────────┬────────────────┐
│ Site            │ Month │ Energy  │ Emissions      │
│                 │       │ (kWh)   │ (tCO2e)        │
├─────────────────┼───────┼─────────┼────────────────┤
│ Lisboa - FPM41  │ Jan   │ 15,701  │ 3.14           │
│ Lisboa - FPM41  │ Feb   │ 14,850  │ 2.97           │
│ Lisboa - FPM41  │ Mar   │ 16,200  │ 3.24           │
│ Porto - POP     │ Jan   │ 467.5   │ 0.41           │
│ Porto - POP     │ Feb   │ 445.0   │ 0.39           │
│ Porto - POP     │ Mar   │ 490.2   │ 0.43           │
│ Faro            │ Jan   │ 4.15    │ 0.00           │
│ Faro            │ Feb   │ 3.95    │ 0.00           │
│ Faro            │ Mar   │ 4.20    │ 0.00           │
└─────────────────┴───────┴─────────┴────────────────┘
```

---

## 🎯 Exemplo 3: Tabela com Totais e Subtotais

### Consumo Total com Breakdown por Categoria

**Criar Medida primeiro:**
```
New Measure (no painel Fields):

Total Energy = SUM(Energy[value])

Total Emissions = SUM(Energy[co2e_emissions])

Avg Intensity = AVERAGE(Energy[energy_per_employee])
```

**Tabela Matrix (não Table):**
```
Visualization: Matrix (não Table)

Rows:
├─ metric_category
└─ metric_subcategory

Values:
├─ Total Energy
├─ Total Emissions
└─ Avg Intensity
```

**Resultado:**
```
┌──────────────────┬──────────────────┬──────────┬────────────┬────────────┐
│ Category         │ Subcategory      │ Energy   │ Emissions  │ Intensity  │
│                  │                  │ (kWh)    │ (tCO2e)    │ (kWh/emp)  │
├──────────────────┼──────────────────┼──────────┼────────────┼────────────┤
│ Electricity      │                  │ 65,480   │ 13.10      │ 150.4      │
│                  │ Purchased        │ 62,890   │ 12.58      │ 144.5      │
│                  │ EV Charging      │ 2,590    │ 0.52       │ 5.9        │
├──────────────────┼──────────────────┼──────────┼────────────┼────────────┤
│ Purchased Energy │                  │ 15,715   │ 17.56      │ 36.1       │
│                  │ Thermal          │ 15,715   │ 17.56      │ 36.1       │
├──────────────────┼──────────────────┼──────────┼────────────┼────────────┤
│ TOTAL            │                  │ 81,195   │ 30.66      │ 186.5      │
└──────────────────┴──────────────────┴──────────┴────────────┴────────────┘
```

**Ativar Totais:**
```
Format → Subtotals → Row subtotals: On
Format → Grand total → Row: On
```

---

## 📈 Exemplo 4: Tabela Comparativa Multi-Ano

### Evolução Anual com Variação %

**Criar Medidas:**
```dax
Energy 2023 =
CALCULATE(
    SUM(Energy[value]),
    Energy[year] = 2023
)

Energy 2024 =
CALCULATE(
    SUM(Energy[value]),
    Energy[year] = 2024
)

YoY Variation =
VAR Diff = [Energy 2024] - [Energy 2023]
VAR PercentChange = DIVIDE(Diff, [Energy 2023])
RETURN PercentChange

YoY Absolute =
[Energy 2024] - [Energy 2023]
```

**Tabela:**
```
Visualization: Table

Columns:
├─ site_name
├─ Energy 2023
├─ Energy 2024
├─ YoY Absolute
└─ YoY Variation
```

**Formatação Condicional:**
```
YoY Variation column:
→ Conditional Formatting
→ Background color
→ Rules:
   - If value >= 0: Light Red
   - If value < 0: Light Green (redução é bom!)
```

**Resultado:**
```
┌─────────────────┬───────────┬───────────┬───────────┬──────────┐
│ Site            │ 2023      │ 2024      │ Variation │ YoY %    │
│                 │ (kWh)     │ (kWh)     │ (kWh)     │          │
├─────────────────┼───────────┼───────────┼───────────┼──────────┤
│ Lisboa - FPM41  │ 450,230   │ 523,890   │ +73,660   │ +16.4% 🔴│
│ Porto - POP     │ 68,450    │ 72,880    │ +4,430    │ +6.5%  🔴│
│ Faro            │ 5,061     │ 4,950     │ -111      │ -2.2%  🟢│
├─────────────────┼───────────┼───────────┼───────────┼──────────┤
│ TOTAL           │ 523,741   │ 601,720   │ +77,979   │ +14.9% 🔴│
└─────────────────┴───────────┴───────────┴───────────┴──────────┘
```

---

## 💧 Exemplo 5: Tabela de Água (GRI 303)

### Withdrawal, Discharge, Consumption

**Filtrar dados:**
```
Filters → metric_category
☑ Water Withdrawal
☑ Water Discharge
☑ Water Consumption
```

**Tabela Matrix:**
```
Rows:
├─ site_name
└─ metric_category

Values:
└─ Sum of value
```

**Pivot para formato wide:**
```
Transform → Pivot Column
Column: metric_category
Values: value
```

**Resultado:**
```
┌─────────────────┬────────────┬───────────┬─────────────┬────────────┐
│ Site            │ Withdrawal │ Discharge │ Consumption │ Reuse Rate │
│                 │ (m³)       │ (m³)      │ (m³)        │ (%)        │
├─────────────────┼────────────┼───────────┼─────────────┼────────────┤
│ Lisboa - FPM41  │ 32.95      │ 32.39     │ 0.56        │ 11.2%      │
│ Porto - POP     │ 8.00       │ 7.86      │ 0.14        │ 0.0%       │
│ Faro            │ 6.00       │ 5.90      │ 0.10        │ 0.0%       │
├─────────────────┼────────────┼───────────┼─────────────┼────────────┤
│ TOTAL           │ 46.95      │ 46.15     │ 0.80        │ 8.8%       │
└─────────────────┴────────────┴───────────┴─────────────┴────────────┘
```

---

## 🗑️ Exemplo 6: Tabela de Resíduos por Tipo

### Waste Breakdown com % Reciclagem

**Criar Medidas:**
```dax
Total Waste = SUM(Waste[value])

Recycled Waste =
CALCULATE(
    SUM(Waste[value]),
    Waste[metric_subcategory] = "Recycling"
)

Recycling Rate =
DIVIDE([Recycled Waste], [Total Waste])

Waste to Landfill =
CALCULATE(
    SUM(Waste[value]),
    Waste[metric_subcategory] IN {"Disposal", "Incineration"}
)
```

**Tabela:**
```
Rows:
├─ site_name
└─ metric_subcategory

Values:
├─ Sum of value
└─ Recycling Rate
```

**Resultado:**
```
┌─────────────────┬──────────────┬──────────┬───────────────┬──────────┐
│ Site            │ Stream       │ Weight   │ % of Total    │ Disposal │
│                 │              │ (kg)     │               │ Method   │
├─────────────────┼──────────────┼──────────┼───────────────┼──────────┤
│ Lisboa - FPM41  │ Recycling    │ 8,300.00 │ 75.2%         │ ♻️       │
│ Lisboa - FPM41  │ Composting   │ 2,400.00 │ 21.7%         │ 🌱       │
│ Lisboa - FPM41  │ E-Waste      │ 108.00   │ 1.0%          │ ⚡       │
│ Lisboa - FPM41  │ Disposal     │ 230.00   │ 2.1%          │ 🗑️       │
├─────────────────┼──────────────┼──────────┼───────────────┼──────────┤
│ Porto - POP     │ Recycling    │ 2,400.00 │ 73.8%         │ ♻️       │
│ Porto - POP     │ Composting   │ 580.00   │ 17.8%         │ 🌱       │
│ Porto - POP     │ Disposal     │ 270.00   │ 8.3%          │ 🗑️       │
├─────────────────┼──────────────┼──────────┼───────────────┼──────────┤
│ Faro            │ Recycling    │ 160.00   │ 57.1%         │ ♻️       │
│ Faro            │ Composting   │ 120.00   │ 42.9%         │ 🌱       │
├─────────────────┼──────────────┼──────────┼───────────────┼──────────┤
│ TOTAL           │              │ 14,568   │ 73.4% recyc.  │          │
└─────────────────┴──────────────┴──────────┴───────────────┴──────────┘
```

---

## ✈️ Exemplo 7: Tabela de Viagens

### Business Travel Breakdown

**Tabela:**
```
Rows:
├─ year
├─ travel_type (Air / Rail)
└─ site_name

Values:
├─ Sum of value (km)
├─ Sum of co2e_emissions
└─ Average of emissions_per_km
```

**Resultado:**
```
┌──────┬─────────┬─────────────────┬───────────┬────────────┬────────────┐
│ Year │ Type    │ Site            │ Distance  │ Emissions  │ gCO2e/km   │
│      │         │                 │ (km)      │ (tCO2e)    │            │
├──────┼─────────┼─────────────────┼───────────┼────────────┼────────────┤
│ 2024 │ Air     │ Lisboa - FPM41  │ 49,862    │ 7.48       │ 150.0      │
│ 2024 │ Air     │ Porto - POP     │ 8,450     │ 1.27       │ 150.0      │
│ 2024 │ Rail    │ Lisboa - FPM41  │ 1,917     │ 0.08       │ 41.7       │
│ 2024 │ Rail    │ Porto - POP     │ 450       │ 0.02       │ 44.4       │
├──────┼─────────┼─────────────────┼───────────┼────────────┼────────────┤
│      │         │ TOTAL 2024      │ 60,679    │ 8.85       │ 145.8      │
└──────┴─────────┴─────────────────┴───────────┴────────────┴────────────┘
```

---

## 🎨 Formatação Avançada

### Números

**Para valores de energia (kWh):**
```
Select column → Modeling → Format: Whole Number
Display units: None
Use 1000 separator: Yes
Decimal places: 0
```

**Para emissões (tCO2e):**
```
Format: Decimal Number
Decimal places: 2
Custom format: #,##0.00 "tCO2e"
```

**Para percentagens:**
```
Format: Percentage
Decimal places: 1
```

### Formatação Condicional

**Ícones baseados em performance:**
```
Select column → Conditional Formatting → Icons

Rules:
├─ >= 5%: ⬆️ Red (aumento)
├─ 0 to 5%: ➡️ Yellow (estável)
└─ < 0%: ⬇️ Green (redução)
```

**Cores baseadas em qualidade de dados:**
```
data_quality column → Background color

Rules:
├─ "measured": Green (#D4EDDA)
├─ "calculated": Yellow (#FFF3CD)
└─ "estimated": Orange (#FCE8D9)
```

### Headers Personalizados

```
Column → Rename:
- value → "Consumption (kWh)"
- co2e_emissions → "CO₂e Emissions (tonnes)"
- energy_per_employee → "Intensity (kWh/employee)"
```

---

## 🔍 Tabelas com Drill-Through

### Criar hierarquia temporal

```
Fields pane → Right-click "year"
→ New Hierarchy → "Time Hierarchy"

Drag para hierarchy:
├─ year (Level 1)
├─ quarter (Level 2)
└─ month (Level 3)
```

**Na tabela:**
```
Rows: Time Hierarchy
Values: Sum of value

Resultado: Click em "+" para expandir
2024 (click +)
  ├─ Q1
  │  ├─ Janeiro: 15,701 kWh
  │  ├─ Fevereiro: 14,850 kWh
  │  └─ Março: 16,200 kWh
  ├─ Q2
  └─ Q3
```

---

## 📊 Tabelas com Múltiplas Fontes

### Combinar Energy + Sites data

**Criar relação:**
```
Model View (left sidebar)
→ Drag from Energy[site_id] to Sites[site_id]
→ Cardinality: Many to One
→ Cross filter direction: Both
```

**Tabela combinada:**
```
Columns:
├─ Sites[site_name]
├─ Sites[total_employees]
├─ Sites[total_area_sqm]
├─ Sum of Energy[value]
├─ Energy Intensity (medida custom)
```

**Medida:**
```dax
Energy Intensity =
DIVIDE(
    SUM(Energy[value]),
    MAX(Sites[total_employees])
)
```

**Resultado:**
```
┌─────────────────┬───────────┬────────┬──────────┬────────────┐
│ Site            │ Employees │ Area   │ Energy   │ Intensity  │
│                 │           │ (m²)   │ (kWh)    │ (kWh/emp)  │
├─────────────────┼───────────┼────────┼──────────┼────────────┤
│ Lisboa - FPM41  │ 384       │ 6,530  │ 523,890  │ 1,364.3    │
│ Porto - POP     │ 40        │ 2,500  │ 72,880   │ 1,822.0    │
│ Faro            │ 12        │ 180    │ 4,950    │ 412.5      │
└─────────────────┴───────────┴────────┴──────────┴────────────┘

Insights: Porto tem maior intensidade energética por colaborador!
```

---

## 🎯 Tabelas Prontas (Templates)

### Template 1: Executive Summary Table

```
┌──────────────┬──────────┬────────────┬────────────┬──────────┐
│ Metric       │ 2023     │ 2024       │ Change     │ Target   │
├──────────────┼──────────┼────────────┼────────────┼──────────┤
│ Energy (MWh) │ 523.7    │ 601.7      │ +14.9% 🔴  │ -10%     │
│ Water (m³)   │ 556      │ 563        │ +1.3% 🟡   │ 0%       │
│ Waste (t)    │ 12.5     │ 14.6       │ +16.8% 🔴  │ -5%      │
│ Travel (km)  │ 48,230   │ 60,679     │ +25.8% 🔴  │ 0%       │
│ CO₂e (t)     │ 199.6    │ 245.3      │ +22.9% 🔴  │ -20%     │
└──────────────┴──────────┴────────────┴────────────┴──────────┘
```

### Template 2: Site Comparison Table

```
┌─────────────┬──────────┬──────────┬──────────┬────────────┐
│ KPI         │ Lisboa   │ Porto    │ Faro     │ Avg/Best   │
├─────────────┼──────────┼──────────┼──────────┼────────────┤
│ Energy/emp  │ 1,364 ⭐ │ 1,822    │ 412      │ 1,199      │
│ Water/emp   │ 0.09     │ 0.20     │ 0.50 ⚠️  │ 0.11       │
│ Waste/emp   │ 28.8     │ 81.2 ⚠️  │ 23.3 ⭐  │ 33.5       │
│ CO₂e/emp    │ 0.08     │ 0.10     │ 0.04 ⭐  │ 0.08       │
└─────────────┴──────────┴──────────┴──────────┴────────────┘

⭐ = Best performer | ⚠️ = Needs attention
```

### Template 3: Monthly Trend Table

```
┌──────────┬──────────┬──────────┬──────────┬──────────┐
│ Month    │ Energy   │ vs Prev  │ vs 2023  │ Forecast │
│          │ (kWh)    │ Month    │ Same Mo. │          │
├──────────┼──────────┼──────────┼──────────┼──────────┤
│ Jan 2024 │ 48,250   │ -        │ +12.3%   │ 45,000   │
│ Feb 2024 │ 45,830   │ -5.0% ⬇️ │ +8.9%    │ 43,500   │
│ Mar 2024 │ 52,100   │ +13.7% ⬆️│ +15.6%   │ 48,200   │
│ Apr 2024 │ 49,650   │ -4.7% ⬇️ │ +11.2%   │ 46,800   │
│ May 2024 │ 47,920   │ -3.5% ⬇️ │ +9.4%    │ 45,500   │
└──────────┴──────────┴──────────┴──────────┴──────────┘
```

---

## 💡 Dicas Pro

### 1. Usar Slicers para Filtros Interativos

```
Add Slicer visual:
├─ year (multi-select)
├─ site_name (dropdown)
├─ metric_category (list)
└─ data_quality (checkbox)

Sincronizar slicers entre páginas:
View → Sync Slicers → Select pages
```

### 2. Exportar Tabela para Excel

```
Click na tabela → ... (More options)
→ Export data
→ Summarized data (com totais)
→ Save as Excel
```

### 3. Destacar Valores Extremos

```
Conditional Formatting → Data bars
- Green: valores mais altos
- Red: valores mais baixos
```

### 4. Adicionar Sparklines (mini gráficos)

```
Instalar custom visual: "Sparkline by OKViz"

Add column com sparkline de tendência mensal
```

---

## ✅ Checklist para Tabela Profissional

- [ ] Dados conectados e atualizados
- [ ] Colunas renomeadas para português/legível
- [ ] Números formatados (separador milhares, decimais)
- [ ] Totais/subtotais ativados
- [ ] Ordenação lógica (por site, por data, etc.)
- [ ] Formatação condicional aplicada
- [ ] Headers com estilo consistente
- [ ] Unidades mostradas (kWh, m³, kg, tCO2e)
- [ ] Cores alinhadas com tema corporativo
- [ ] Exportável para Excel/PDF

---

## 🚀 Próximos Passos

Agora que sabe criar tabelas:

1. ✅ Experimente os templates acima
2. ✅ Combine com gráficos para dashboards completos
3. ✅ Configure refresh automático (Data → Scheduled refresh)
4. ✅ Publique para Power BI Service
5. ✅ Partilhe no SharePoint

**Todas as tabelas acima funcionam com os dados reais PLMJ!** 🎉
