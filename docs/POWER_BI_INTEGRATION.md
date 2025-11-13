# 📊 Power BI Integration Guide

Este guia explica como conectar dados da Blipee ao Power BI para criar dashboards de sustentabilidade.

---

## 🎯 Overview

```
Blipee API → Power BI Desktop → Power BI Service → SharePoint (embed)
```

---

## 📋 Pré-requisitos

1. **Power BI Desktop** instalado
2. **API Key** da Blipee (gerar nas configurações da organização)
3. **Organization ID** (encontrar nas configurações)

---

## 🚀 Passo 1: Criar API Key na Blipee

```sql
-- Execute esta migration para criar a tabela de API keys
-- (veja: supabase/migrations/create_api_keys_table.sql)
```

**Via Interface (futuro):**
1. Ir para **Settings** > **API Keys**
2. Clicar em **Generate New Key**
3. Dar um nome (ex: "Power BI Integration")
4. Copiar e guardar a key (só aparece uma vez!)

**Temporário (via SQL):**
```sql
INSERT INTO api_keys (organization_id, key, name, is_active)
VALUES (
  'your-org-id',
  'sk_live_' || gen_random_uuid()::text,
  'Power BI Integration',
  true
);
```

---

## 📥 Passo 2: Conectar no Power BI Desktop

### 2.1 Adicionar Data Source

1. Abrir **Power BI Desktop**
2. **Get Data** > **Web**
3. Escolher **Advanced**

### 2.2 Configurar Conexão

**URL:**
```
https://seu-dominio.com/api/powerbi/emissions?organizationId=YOUR_ORG_ID&startDate=2025-01-01&endDate=2025-12-31
```

**HTTP Headers:**
```
x-api-key: sua-api-key-aqui
```

![Power BI Connection](../assets/powerbi-connection.png)

### 2.3 Autenticação

- Escolher **Anonymous** (autenticação é via API key no header)
- Clicar **Connect**

---

## 🔄 Passo 3: Transformar Dados (Power Query)

Quando os dados carregarem, vão aparecer em formato JSON:

```json
{
  "success": true,
  "metadata": { ... },
  "data": [ ... ]
}
```

**No Power Query Editor:**

1. Click em **"data"** para expandir o array
2. Click em **"Expand"** para ver todas as colunas
3. Selecionar colunas que quer usar

**Colunas Disponíveis:**
- `period_start`, `period_end` (datas)
- `year`, `month`, `quarter` (dimensões temporais)
- `co2e_emissions` (valor principal)
- `metric_category`, `metric_subcategory` (categorias)
- `site_name`, `site_location` (localização)
- `emissions_per_employee`, `emissions_per_sqm` (intensidade)

**Tipos de Dados:**
- Certificar que datas são tipo `Date`
- Valores numéricos são tipo `Decimal Number`
- Textos são tipo `Text`

---

## 📊 Passo 4: Criar Visualizações

### Dashboard Exemplo: Emissions Overview

**KPIs:**
```
Total Emissions = SUM(emissions[co2e_emissions])
Avg Emissions per Employee = AVERAGE(emissions[emissions_per_employee])
```

**Gráficos:**

1. **Line Chart - Trend Over Time**
   - Axis: `period_start`
   - Values: `co2e_emissions`
   - Legend: `metric_category`

2. **Donut Chart - Breakdown by Category**
   - Legend: `metric_category`
   - Values: `co2e_emissions`

3. **Map - Emissions by Location**
   - Location: `site_location`
   - Size: `co2e_emissions`

4. **Table - Top Emitters**
   - Rows: `site_name`, `metric_name`
   - Values: `co2e_emissions`

---

## 🔄 Passo 5: Refresh Automático

### 5.1 Publish to Power BI Service

1. **File** > **Publish** > **Publish to Power BI**
2. Escolher workspace
3. Aguardar upload

### 5.2 Configurar Scheduled Refresh

No **Power BI Service**:

1. Ir para **Workspace** > Encontrar seu dataset
2. **Settings** > **Scheduled refresh**
3. Configurar:
   - **Refresh frequency**: Daily
   - **Time**: 06:00 AM (ou quando preferir)
   - **Time zone**: Europe/Lisbon

4. **Data source credentials**:
   - Edit credentials
   - Authentication: Anonymous
   - Privacy level: Organizational

---

## 🔗 Passo 6: Embedar no SharePoint

### 6.1 Publish Report

1. No Power BI Service, abrir o report
2. **File** > **Embed** > **SharePoint Online**
3. Copiar o embed code

### 6.2 Adicionar ao SharePoint

1. Ir para página SharePoint
2. **Edit** > **Add a web part**
3. Escolher **Embed**
4. Colar o código do Power BI
5. **Publish** a página

---

## 🛠️ Endpoints Disponíveis

### Emissions Data
```
GET /api/powerbi/emissions
```

**Parâmetros:**
- `organizationId` (required)
- `startDate` (optional, formato: YYYY-MM-DD)
- `endDate` (optional, formato: YYYY-MM-DD)
- `siteId` (optional)

**Resposta:**
```json
{
  "success": true,
  "metadata": {
    "organization_id": "...",
    "generated_at": "2025-01-13T...",
    "totals": {
      "total_emissions_tco2e": 487.1,
      "total_records": 150,
      "sites_count": 3
    }
  },
  "data": [
    {
      "metric_id": "...",
      "period_start": "2025-01-01",
      "co2e_emissions": 50.5,
      "site_name": "Lisboa",
      "emissions_per_employee": 1.12,
      ...
    }
  ]
}
```

### Sites Data
```
GET /api/powerbi/sites
```

**Parâmetros:**
- `organizationId` (required)

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "site_id": "...",
      "site_name": "Lisboa",
      "total_employees": 384,
      "total_area_sqm": 6530
    }
  ]
}
```

---

## 🔐 Segurança

### API Key Best Practices

✅ **DO:**
- Guardar API keys em local seguro (password manager)
- Usar nomes descritivos ("Power BI Prod", "Power BI Test")
- Rotar keys periodicamente
- Usar keys diferentes para ambientes diferentes

❌ **DON'T:**
- Commit keys no Git
- Partilhar keys por email/chat
- Usar mesma key para múltiplos propósitos
- Deixar keys inativas ativas

### Revogar Key

Se uma key foi comprometida:

```sql
UPDATE api_keys
SET is_active = false
WHERE key = 'compromised-key';
```

---

## 📈 Métricas de Performance

**Otimizações:**

1. **Usar filtros na API** (não buscar tudo):
   ```
   ?startDate=2025-01-01&endDate=2025-01-31
   ```

2. **Incremental Refresh** no Power BI:
   - Só refresh dos últimos 30 dias
   - Manter histórico em cache

3. **Aggregations** no Power BI:
   - Pre-agregar dados por mês/trimestre
   - Usar para dashboards executivos

---

## 🐛 Troubleshooting

### Erro: "Invalid API Key"
- Verificar que copiou a key completa
- Verificar que key está ativa no banco
- Verificar que header se chama `x-api-key` (lowercase)

### Erro: "No data returned"
- Verificar `organizationId` correto
- Verificar intervalo de datas tem dados
- Ver logs do servidor para detalhes

### Data não atualiza
- Verificar scheduled refresh configurado
- Verificar credentials não expiraram
- Ver refresh history para erros

---

## 📞 Suporte

**Documentação adicional:**
- API Reference: `/docs/api`
- Swagger: `/api/docs`

**Contacto:**
- Email: support@blipee.com
- Slack: #power-bi-integration

---

## 🎓 Recursos Adicionais

**Power BI Learning:**
- [Power BI Guided Learning](https://docs.microsoft.com/power-bi/guided-learning/)
- [DAX Basics](https://docs.microsoft.com/power-bi/dax-basics)

**Templates Disponíveis:**
- Emissions Dashboard Template (`.pbix`)
- GRI Reporting Template (`.pbix`)
- ESG Executive Summary (`.pbix`)

Download: `/templates/powerbi/`
