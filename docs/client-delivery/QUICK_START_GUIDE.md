# Power BI Integration - Quick Start Guide

**Tempo estimado:** 15 minutos
**Nível:** Médio (conhecimentos básicos de Power BI)

---

## ✅ Pré-requisitos

Antes de começar, certifiquem-se que têm:
- [ ] Power BI Desktop instalado
- [ ] API Key da Blipee (fornecida por email)
- [ ] Organization ID (fornecido por email)

---

## 🧪 Passo 0: Testar Credenciais (2 minutos)

Antes de configurar o Power BI, vamos confirmar que as credenciais estão corretas.

### Opção A: Teste no Browser (Mais Fácil)

1. Abrir browser e colar este URL:
```
https://blipee.io/api/powerbi/test?organizationId=PLMJ
```

2. Quando o browser pedir autenticação:
   - Username: (deixar vazio)
   - Password: [COLAR_SUA_API_KEY_AQUI]

3. Deve aparecer:
```json
{
  "success": true,
  "message": "🎉 Connection successful!",
  "data": {
    "organization": { "name": "Sua Empresa" },
    "statistics": { "total_sites": 3 }
  }
}
```

### Opção B: Teste com cURL (Terminal/CMD)

Abrir terminal e executar (substituir [SUA_API_KEY]):

```bash
curl -H "x-api-key: [SUA_API_KEY]" \
  "https://blipee.io/api/powerbi/test?organizationId=PLMJ"
```

### ✅ Se funcionou:
- Ver mensagem "Connection successful"
- Ver nome da organização
- Ver número de sites disponíveis

### ❌ Se deu erro:
- **"API key missing"** → Verificar que copiou a key corretamente
- **"Invalid API key"** → Contactar suporte para verificar status da key
- **"Organization mismatch"** → Verificar que Organization ID está correto

---

## 🚀 Passo 1: Abrir Power BI Desktop

1. Iniciar **Power BI Desktop**
2. Clicar em **Get Data** (botão no ribbon superior)
3. Na janela que abre, procurar por **"Web"**
4. Selecionar **Web** e clicar **Connect**

```
┌─────────────────────────────────────┐
│ Get Data                      [X]   │
├─────────────────────────────────────┤
│ Search: web                         │
│                                     │
│ ☐ Excel                             │
│ ☐ CSV                               │
│ ☑ Web         ← Selecionar          │
│ ☐ Database                          │
│                                     │
│            [Connect]                │
└─────────────────────────────────────┘
```

---

## 🔗 Passo 2: Configurar Conexão à API

### 2.1 Escolher "Advanced"

Na janela "From Web", clicar no botão **Advanced** (canto superior).

### 2.2 Inserir URL da API

**URL parts:**
```
https://blipee.io/api/powerbi/emissions
```

**Query parameters:**
| Parameter | Value |
|-----------|-------|
| organizationId | PLMJ |
| startDate | 2024-01-01 |
| endDate | 2024-12-31 |

**URL completo:**
```
https://blipee.io/api/powerbi/emissions?organizationId=PLMJ&startDate=2024-01-01&endDate=2024-12-31
```

### 2.3 Adicionar Header de Autenticação

Ainda na janela "Advanced", na secção **HTTP request header parameters**:

| Header name | Header value |
|-------------|--------------|
| x-api-key | [COLAR_SUA_API_KEY_AQUI] |

```
┌────────────────────────────────────────────┐
│ From Web                            [X]    │
├────────────────────────────────────────────┤
│ ○ Basic    ● Advanced                      │
│                                            │
│ URL parts:                                 │
│ https://app.blipee.com/api/powerbi/...    │
│                                            │
│ Query parameters:                          │
│ organizationId: abc123                     │
│ startDate: 2024-01-01                      │
│ endDate: 2024-12-31                        │
│                                            │
│ HTTP request header parameters:            │
│ x-api-key: sk_live_xxxxxxx                │
│                                            │
│                         [OK] [Cancel]      │
└────────────────────────────────────────────┘
```

### 2.4 Clicar OK

---

## 🔐 Passo 3: Autenticação

1. Quando Power BI perguntar sobre autenticação, selecionar **Anonymous**
   - (A autenticação já foi feita via API key no header)
2. Privacy level: **Organizational**
3. Clicar **Connect**

---

## 📊 Passo 4: Transformar Dados

Quando os dados carregarem, vão aparecer em formato JSON estruturado:

### 4.1 Expandir Campo "data"

1. Na janela Power Query Editor, procurar a coluna **"data"**
2. Clicar no ícone de **duas setas** (↔) ao lado de "data"
3. Aparece lista de colunas - **selecionar todas**
4. **Desmarcar** a opção "Use original column name as prefix"
5. Clicar **OK**

```
Before:                  After:
┌──────────────┐        ┌──────────────┬────────────┬─────────┐
│ data         │   →    │ period_start │ site_name  │ co2e... │
│ [Record]     │        ├──────────────┼────────────┼─────────┤
│ [Record]     │        │ 2024-01-01   │ Lisboa     │ 50.5    │
│ [Record]     │        │ 2024-02-01   │ Lisboa     │ 48.2    │
└──────────────┘        └──────────────┴────────────┴─────────┘
```

### 4.2 Verificar Tipos de Dados

Garantir que as colunas têm os tipos corretos:

| Coluna | Tipo Esperado | Como Corrigir |
|--------|---------------|---------------|
| period_start | Date | Click cabeçalho > Transform > Data Type > Date |
| period_end | Date | Transform > Data Type > Date |
| co2e_emissions | Decimal Number | Transform > Data Type > Decimal Number |
| year | Whole Number | Transform > Data Type > Whole Number |
| month | Whole Number | Transform > Data Type > Whole Number |

### 4.3 Renomear Query (Opcional)

No painel esquerdo, clicar com botão direito na query e escolher **Rename**:
- De: `Query1`
- Para: `Emissions_Data`

### 4.4 Fechar e Aplicar

Clicar em **Close & Apply** no ribbon superior.

⏳ Power BI vai carregar os dados (pode demorar alguns segundos).

---

## 📈 Passo 5: Criar Primeira Visualização

Agora que os dados estão carregados, vamos criar um gráfico simples:

### 5.1 KPI Card - Total Emissions

1. No painel **Visualizations**, clicar no ícone **Card**
2. Arrastar campo `co2e_emissions` para **Fields**
3. Power BI vai automaticamente fazer SUM
4. No painel superior, dar nome ao visual: "Total Emissions"

```
┌─────────────────────────┐
│  Total Emissions        │
│                         │
│      487.1              │
│      tCO2e              │
└─────────────────────────┘
```

### 5.2 Line Chart - Trend Over Time

1. Clicar área vazia do canvas
2. Selecionar ícone **Line Chart**
3. Configurar:
   - **X-axis:** `period_start`
   - **Y-axis:** `co2e_emissions`
   - **Legend:** `site_name` (para ver por localização)

```
tCO2e
 60 ┤     ╭─╮
 50 ┤   ╭─╯ ╰╮
 40 ┤ ╭─╯    ╰─╮
 30 ┤─╯        ╰─
    └─┴─┴─┴─┴─┴─┴─→
    Jan Feb Mar Apr May Jun

    ─── Lisboa  ─── Porto  ─── Faro
```

### 5.3 Donut Chart - Breakdown by Category

1. Clicar área vazia
2. Selecionar ícone **Donut Chart**
3. Configurar:
   - **Legend:** `metric_category`
   - **Values:** `co2e_emissions`

```
        ┌─────────────┐
      42%│ Business    │
        │ Travel      │
        ├─────────────┤
      34%│ Electricity │
        ├─────────────┤
      24%│ Other       │
        └─────────────┘
```

---

## 💾 Passo 6: Guardar e Publicar

### 6.1 Guardar Localmente

1. **File** > **Save As**
2. Nome: `Blipee_Emissions_Dashboard.pbix`
3. Guardar em local apropriado

### 6.2 Publicar no Power BI Service (Opcional)

1. **Home** > **Publish**
2. Escolher workspace (ou criar novo)
3. Aguardar confirmação de upload
4. Clicar link para abrir no browser

---

## ⚙️ Passo 7: Configurar Atualização Automática

**No Power BI Service** (browser):

1. Ir para workspace onde publicou
2. Encontrar dataset `Blipee_Emissions_Dashboard`
3. Clicar **⋯** (três pontos) > **Settings**
4. **Scheduled refresh**:
   - ☑ Keep your data up to date
   - Frequency: **Daily**
   - Time: **06:00** (ou horário preferido)
   - Time zone: **Europe/Lisbon**
5. **Data source credentials**:
   - Authentication method: **Anonymous**
   - Privacy level: **Organizational**
6. **Apply**

```
┌──────────────────────────────────────┐
│ Scheduled refresh                    │
├──────────────────────────────────────┤
│ ☑ Keep your data up to date          │
│                                      │
│ Refresh frequency: Daily       ▼     │
│ Time: 06:00                    ▼     │
│ Time zone: (UTC) Lisbon        ▼     │
│                                      │
│         [Apply]  [Cancel]            │
└──────────────────────────────────────┘
```

---

## ✨ Próximos Passos

Agora que têm a integração a funcionar:

### Explorar Template Fornecido
- Abrir `Blipee_Dashboard_Template.pbix` (anexo ao email)
- Ver exemplos de visualizações avançadas
- Copiar/adaptar para vossas necessidades

### Adicionar Mais Dados
Podem conectar outros endpoints:
- `/api/powerbi/sites` - Informação de localizações
- `/api/powerbi/water` - Consumo de água (futuro)
- `/api/powerbi/energy` - Consumo de energia (futuro)

### Customizar Dashboard
- Adicionar filtros (por site, por período, por categoria)
- Criar páginas diferentes (Overview, Details, Trends)
- Adicionar logo da empresa
- Configurar tema/cores corporativas

### Embedar no SharePoint
- No Power BI Service: **File** > **Embed** > **SharePoint Online**
- Copiar código
- Colar numa página SharePoint

---

## 🆘 Troubleshooting

### Erro: "Unable to connect"
**Causa:** URL ou API key incorretos
**Solução:**
- Verificar que copiou URL completo
- Verificar que API key não tem espaços no início/fim
- Verificar que header se chama exatamente `x-api-key` (lowercase)

### Erro: "Invalid API key"
**Causa:** Key expirada ou desativada
**Solução:**
- Contactar suporte Blipee para verificar status da key
- Pode ser necessário gerar nova key

### Dados não aparecem
**Causa:** Intervalo de datas sem dados
**Solução:**
- Ajustar `startDate` e `endDate` na URL
- Verificar que organização tem dados para esse período

### Refresh falha
**Causa:** Credenciais não configuradas
**Solução:**
- Power BI Service > Dataset Settings > Data source credentials
- Reintroduzir credenciais (Anonymous)

---

## 📞 Suporte

**Email:** support@blipee.com
**Documentação completa:** `/docs/POWER_BI_INTEGRATION.md`
**Agendar sessão:** calendly.com/blipee-support

---

**Última atualização:** Janeiro 2025
**Versão:** 1.0
