# 🤖 Mapeamento de Ferramentas por Agente

Este documento detalha quais ferramentas cada agente deve usar para maximizar o seu potencial.

---

## 🔍 **1. Carbon Hunter V2** - Detetive de Emissões de Carbono

### Objetivo
Rastrear, verificar e caçar emissões de carbono em todos os scopes com precisão.

### Ferramentas Recomendadas

#### Core Sustainability Tools (5)
- ✅ `calculateEmissions` - **CRÍTICA** - Calcular totais por scope
- ✅ `detectAnomalies` - **CRÍTICA** - Encontrar spikes anómalos
- ✅ `benchmarkEfficiency` - Comparar com médias
- ✅ `generateCarbonReport` - Relatórios detalhados
- ✅ `investigateSources` - Rastrear fontes específicas

#### ML Analysis Tools (5)
- ✅ `getProphetForecast` - **CRÍTICA** - Prever emissões futuras (12 meses)
- ✅ `getAnomalyScore` - **CRÍTICA** - ML confirmation de anomalias
- ✅ `getPatternAnalysis` - Identificar padrões sazonais
- ✅ `getFastForecast` - Quick check para decisões imediatas
- ✅ `getRiskClassification` - Classificar risco por site

### Exemplo de Uso

```typescript
// Análise completa de carbono
const emissions = await calculateEmissions({
  organizationId,
  startDate: '2024-01-01',
  endDate: '2024-10-30'
});

// Detectar anomalias estatísticas
const anomalies = await detectAnomalies({
  organizationId,
  category: 'electricity'
});

// Confirmar com ML
const mlScore = await getAnomalyScore({
  organizationId,
  siteId,
  metricId: 'carbon_emissions'
});

// Prever futuro
const forecast = await getProphetForecast({
  organizationId,
  metricId: 'carbon_emissions'
});

// Classificar risco
const risk = await getRiskClassification({
  organizationId,
  siteId,
  metricId: 'carbon_emissions'
});

// Gerar insight
const insight = `
🔍 Carbon Hunter - Análise Completa

📊 Emissões Atuais: ${emissions.totalEmissions} tCO2e
🚨 Anomalias: ${anomalies.totalAnomalies} detectadas
🤖 ML Score: ${mlScore.anomalyScore} (${mlScore.severity})
📈 Previsão: ${forecast.analysis.direction} ${forecast.analysis.percentChange}%
⚠️ Risco: ${risk.riskLevel.toUpperCase()} (${risk.confidence * 100}% confiança)

💡 Recomendações:
${risk.recommendations.join('\n')}
`;
```

### Output Esperado
```
🔍 Carbon Hunter - Análise Completa de Carbono

📊 Situação Atual (Jan-Oct 2024):
• Total: 550 tCO2e
• Scope 1: 120 tCO2e (22%)
• Scope 2: 340 tCO2e (62%) ⚠️
• Scope 3: 90 tCO2e (16%)

🚨 Anomalias Detectadas:
• Electricity: 3 spikes detectados (+50% acima média)
• ML Autoencoder Score: 0.85 (HIGH severity)
• Sites afetados: Lisboa HQ, Porto Branch

📈 Previsão Prophet (12 meses):
• Tendência: +15% crescimento anual
• Próximo mês: 410 kg CO2e (intervalo: 380-440)
• Sazonalidade: 8% variação (inverno mais alto)

⚠️ Classificação de Risco:
• Nível: HIGH (95% confiança)
• Desvio da média: +42%
• Volatilidade: MEDIUM (18%)

💡 Recomendações Prioritárias:
1. Investigar sistema HVAC - Lisboa HQ
2. Verificar programação fora de horário
3. Potencial poupança: 450 kg CO2e/mês (~€60/mês)
```

---

## ⚖️ **2. Compliance Guardian V2** - Guardião de Conformidade

### Objetivo
Verificar compliance com frameworks GRI, TCFD, CDP, SASB, CSRD.

### Ferramentas Recomendadas

#### Core Tools
- ✅ `calculateEmissions` - Verificar dados para reporting
- ✅ `generateCarbonReport` - **CRÍTICA** - Relatórios compliance
- ✅ `benchmarkEfficiency` - Comparar com standards

#### ML Tools
- ✅ `getProphetForecast` - **CRÍTICA** - Planeamento de targets
- ✅ `getPatternAnalysis` - Identificar gaps sazonais
- ✅ `getRiskClassification` - **CRÍTICA** - Priorizar sites para audit

### Exemplo de Uso

```typescript
// Verificar completude de dados para GRI
const emissions = await calculateEmissions({
  organizationId,
  startDate: '2024-01-01',
  endDate: '2024-12-31'
});

// Prever se vai atingir targets
const forecast = await getProphetForecast({
  organizationId,
  metricId: 'carbon_emissions'
});

// Classificar risco de não-compliance por site
const sitesRisks = await Promise.all(
  sites.map(site => getRiskClassification({
    organizationId,
    siteId: site.id,
    metricId: 'carbon_emissions'
  }))
);

// Insight de compliance
const insight = `
⚖️ Compliance Guardian - Verificação GRI 305

✅ Dados Completos:
• Scope 1: ${emissions.totalsByScope.scope_1 ? '✓' : '✗'}
• Scope 2: ${emissions.totalsByScope.scope_2 ? '✓' : '✗'}
• Scope 3: ${emissions.totalsByScope.scope_3 ? '✓' : '✗'}

📊 Target Progress (SBTi):
• Meta 2030: Reduzir 50% (baseline 2020)
• Progresso atual: 12% redução
• Previsão: ${forecast.analysis.direction}
• Status: ${forecast.analysis.percentChange > -50 ? 'ON TRACK' : 'AT RISK'}

⚠️ Sites Prioritários para Audit:
${sitesRisks.filter(r => r.riskLevel === 'high').map(r => `• ${r.siteName}: ${r.riskLevel}`).join('\n')}
`;
```

---

## 💰 **3. Cost Saving Finder V2** - Detetive de Poupanças

### Objetivo
Identificar oportunidades de redução de custos em energia e operações.

### Ferramentas Recomendadas

#### Core Tools
- ✅ `calculateEmissions` - Calcular custos de carbono
- ✅ `detectAnomalies` - **CRÍTICA** - Encontrar desperdícios
- ✅ `benchmarkEfficiency` - **CRÍTICA** - Comparar com best practices

#### ML Tools
- ✅ `getAnomalyScore` - **CRÍTICA** - Identificar ineficiências
- ✅ `getPatternAnalysis` - **CRÍTICA** - Otimizar por sazonalidade
- ✅ `getRiskClassification` - Priorizar investimentos
- ✅ `getFastForecast` - Quick ROI calculations

### Exemplo de Uso

```typescript
// Encontrar anomalias = desperdícios
const anomalies = await detectAnomalies({
  organizationId,
  category: 'electricity'
});

// Confirmar com ML
const mlScore = await getAnomalyScore({
  organizationId,
  siteId,
  metricId: 'electricity'
});

// Analisar padrões para otimização
const patterns = await getPatternAnalysis({
  organizationId,
  siteId,
  metricId: 'electricity'
});

// Calcular poupança potencial
const baselineCost = currentElectricity * electricityPrice;
const optimizedCost = baselineCost * (1 - patterns.patterns.seasonality.variation / 100);
const savings = baselineCost - optimizedCost;

const insight = `
💰 Cost Saving Finder - Oportunidades Identificadas

🔍 Análise de Desperdícios:
• ${anomalies.highAnomalies} picos de consumo anómalos detectados
• ML Score: ${mlScore.anomalyScore} (potencial de otimização)
• Categoria principal: Electricity (62% do consumo)

📊 Padrões Identificados:
• Sazonalidade: ${patterns.patterns.seasonality.variation}% variação
• Pico: ${patterns.patterns.seasonality.peakMonth}
• Mínimo: ${patterns.patterns.seasonality.troughMonth}

💡 Oportunidades de Poupança:

1. **Otimização de HVAC** (Lisboa HQ)
   • Consumo anómalo: +50% vs baseline
   • Poupança potencial: €450/mês
   • Payback: 6 meses
   • ROI: 200%

2. **Ajuste Sazonal**
   • Reduzir consumo em ${patterns.patterns.seasonality.peakMonth}
   • Poupança potencial: €280/mês
   • Ação: Programação automática

3. **Eliminação de Desperdício**
   • Equipamento fora de horário
   • Poupança potencial: €120/mês
   • Ação: Sensores IoT

💰 Total Potencial: €850/mês (€10,200/ano)
🌱 Redução CO2e: 1,200 kg/mês
`;
```

---

## 🔧 **4. Predictive Maintenance** - Manutenção Preditiva

### Objetivo
Prever falhas de equipamento antes que aconteçam.

### Ferramentas Recomendadas

#### Core Tools
- ✅ `detectAnomalies` - **CRÍTICA** - Detectar comportamento anormal
- ✅ `investigateSources` - Rastrear equipamento específico

#### ML Tools
- ✅ `getAnomalyScore` - **CRÍTICA** - Score de falha iminente
- ✅ `getPatternAnalysis` - Padrões de degradação
- ✅ `getFastForecast` - **CRÍTICA** - Prever próximas 24-48h
- ✅ `getRiskClassification` - **CRÍTICA** - Priorizar manutenções

### Exemplo de Uso

```typescript
// Monitorizar equipamento
const anomalies = await detectAnomalies({
  organizationId,
  category: 'hvac_consumption'
});

// Score de falha
const failureScore = await getAnomalyScore({
  organizationId,
  siteId,
  metricId: 'hvac_consumption'
});

// Prever próximas 48h
const forecast = await getFastForecast({
  organizationId,
  siteId,
  metricId: 'hvac_consumption',
  daysToForecast: 2
});

// Classificar urgência
const risk = await getRiskClassification({
  organizationId,
  siteId,
  metricId: 'hvac_consumption'
});

const insight = `
🔧 Predictive Maintenance - Alerta de Equipamento

⚠️ HVAC System - Lisboa HQ

🚨 Score de Falha: ${failureScore.anomalyScore * 100}% (${failureScore.severity.toUpperCase()})

📊 Indicadores:
• Consumo anormal: +${failureScore.dataInfo.zScore}σ acima média
• Volatilidade: ${risk.factors.volatilityLevel}
• Tendência: ${risk.factors.trendImpact}

📈 Previsão 48h:
• Hora 0: ${forecast.forecasted[0]} kWh
• Hora 24: ${forecast.forecasted[1]} kWh (+${((forecast.forecasted[1] / forecast.forecasted[0] - 1) * 100).toFixed(0)}%)
• Hora 48: ${forecast.forecasted[2]} kWh

⚠️ Classificação: ${risk.riskLevel.toUpperCase()}

💡 Ação Recomendada:
${risk.riskLevel === 'high' ?
  '🚨 URGENTE: Agendar inspeção nas próximas 24h' :
  '⚠️ Monitorizar de perto nas próximas 48h'}

Potencial impacto:
• Downtime evitado: 8-12 horas
• Poupança: €2,000-€3,500 (reparação emergência vs planeada)
`;
```

---

## ⚡ **5. Autonomous Optimizer** - Otimizador Autónomo

### Objetivo
Otimizar operações HVAC, iluminação e recursos automaticamente.

### Ferramentas Recomendadas

#### Core Tools
- ✅ `detectAnomalies` - Identificar ineficiências
- ✅ `benchmarkEfficiency` - **CRÍTICA** - Comparar performance

#### ML Tools
- ✅ `getPatternAnalysis` - **CRÍTICA** - Otimizar por padrões
- ✅ `getFastForecast` - **CRÍTICA** - Decisões em tempo real
- ✅ `getProphetForecast` - Planeamento semanal/mensal
- ✅ `getRiskClassification` - Priorizar ações

### Exemplo de Uso

```typescript
// Analisar padrões de uso
const patterns = await getPatternAnalysis({
  organizationId,
  siteId,
  metricId: 'electricity'
});

// Forecast rápido para próximas horas
const shortTerm = await getFastForecast({
  organizationId,
  siteId,
  metricId: 'electricity',
  daysToForecast: 1
});

// Calcular otimização
const currentUsage = shortTerm.context.recentAverage;
const optimalUsage = currentUsage * (1 - patterns.patterns.seasonality.variation / 100);
const savingsPotential = currentUsage - optimalUsage;

const insight = `
⚡ Autonomous Optimizer - Otimização Automática

📊 Análise de Padrões (Lisboa HQ):

Padrão Sazonal Detectado:
• Variação: ${patterns.patterns.seasonality.variation}%
• Pico: ${patterns.patterns.seasonality.peakMonth} (ajustar -20%)
• Vale: ${patterns.patterns.seasonality.troughMonth} (baseline ideal)

⚡ Otimização Recomendada:

1. **Próximas 24h** (Tempo Real)
   • Consumo previsto: ${shortTerm.forecasted[0]} kWh
   • Consumo ótimo: ${optimalUsage.toFixed(0)} kWh
   • Redução: ${savingsPotential.toFixed(0)} kWh (-${((savingsPotential/currentUsage)*100).toFixed(0)}%)

2. **Ajustes Imediatos**
   • HVAC: Reduzir 15% durante ${patterns.patterns.seasonality.peakMonth}
   • Iluminação: Modo ECO durante baixa ocupação
   • Ventilação: Seguir padrão de ocupação

3. **ROI**
   • Poupança diária: €${(savingsPotential * 0.15).toFixed(0)}
   • Poupança mensal: €${(savingsPotential * 0.15 * 30).toFixed(0)}
   • Redução CO2e: ${(savingsPotential * 0.4).toFixed(0)} kg/dia

✅ Ação Automática:
${patterns.patterns.seasonality.hasSeasonality ?
  '🤖 Ajustando setpoints de HVAC baseado em padrões sazonais...' :
  '⏳ Aguardando mais dados para otimização automática'}
`;
```

---

## 🔗 **6. Supply Chain Investigator** - Investigador de Cadeia de Fornecimento

### Objetivo
Analisar fornecedores e identificar riscos na supply chain.

### Ferramentas Recomendadas

#### Core Tools
- ✅ `calculateEmissions` - **CRÍTICA** - Emissões Scope 3
- ✅ `investigateSources` - **CRÍTICA** - Rastrear fornecedores
- ✅ `benchmarkEfficiency` - Comparar fornecedores

#### ML Tools
- ✅ `getRiskClassification` - **CRÍTICA** - Classificar fornecedores por risco
- ✅ `getPatternAnalysis` - Padrões de fornecimento
- ✅ `getProphetForecast` - Prever disrupções
- ✅ `getAnomalyScore` - Detectar comportamentos suspeitos

### Exemplo de Uso

```typescript
// Calcular emissões Scope 3
const scope3 = await calculateEmissions({
  organizationId,
  scope: 'scope_3'
});

// Classificar fornecedores por risco
const suppliers = await Promise.all(
  supplierList.map(async supplier => ({
    ...supplier,
    risk: await getRiskClassification({
      organizationId,
      siteId: supplier.site_id,
      metricId: 'scope3_emissions'
    }),
    anomaly: await getAnomalyScore({
      organizationId,
      siteId: supplier.site_id,
      metricId: 'scope3_emissions'
    })
  }))
);

// Prever impacto futuro
const forecast = await getProphetForecast({
  organizationId,
  metricId: 'scope3_emissions'
});

const highRiskSuppliers = suppliers.filter(s => s.risk.riskLevel === 'high');

const insight = `
🔗 Supply Chain Investigator - Análise de Fornecedores

📊 Scope 3 Emissions: ${scope3.totalEmissions} tCO2e (${((scope3.totalEmissions / totalEmissions) * 100).toFixed(0)}% do total)

⚠️ Fornecedores de Alto Risco: ${highRiskSuppliers.length}/${suppliers.length}

🚨 Prioridades:

${highRiskSuppliers.slice(0, 3).map((s, i) => `
${i + 1}. **${s.name}**
   • Emissões: ${s.emissions} tCO2e/ano
   • Risco: ${s.risk.riskLevel.toUpperCase()} (${(s.risk.confidence * 100).toFixed(0)}% confiança)
   • Anomalia ML: ${(s.anomaly.anomalyScore * 100).toFixed(0)}%
   • Tendência: ${s.risk.factors.trend > 0 ? '📈 Aumentando' : '📉 Diminuindo'} (${s.risk.factors.trend.toFixed(1)}%)
   • Ação: ${s.risk.riskLevel === 'high' ? '🔴 Audit urgente' : '🟡 Monitorizar'}
`).join('\n')}

📈 Previsão Scope 3:
• Próximos 12 meses: ${forecast.analysis.direction} (${forecast.analysis.percentChange}%)
• Risco de não-compliance: ${Math.abs(parseFloat(forecast.analysis.percentChange)) > 10 ? 'ALTO' : 'MÉDIO'}

💡 Recomendações:
1. Realizar audit a fornecedores de alto risco
2. Diversificar supply chain (reduzir dependência)
3. Estabelecer targets de redução para fornecedores
4. Implementar supplier scorecard ESG
`;
```

---

## 📋 **7. Regulatory Foresight** - Vigilante Regulatório

### Objetivo
Monitorizar mudanças regulatórias e antecipar compliance requirements.

### Ferramentas Recomendadas

#### Core Tools
- ✅ `calculateEmissions` - Verificar compliance atual
- ✅ `generateCarbonReport` - **CRÍTICA** - Reporting regulatório
- ✅ `benchmarkEfficiency` - Comparar com requirements

#### ML Tools
- ✅ `getProphetForecast` - **CRÍTICA** - Prever se vai cumprir targets
- ✅ `getRiskClassification` - **CRÍTICA** - Risco de não-compliance
- ✅ `getPatternAnalysis` - Identificar gaps

### Exemplo de Uso

```typescript
// Verificar compliance atual
const current = await calculateEmissions({
  organizationId,
  startDate: '2024-01-01',
  endDate: '2024-12-31'
});

// Prever se vai cumprir target 2030
const forecast = await getProphetForecast({
  organizationId,
  metricId: 'carbon_emissions'
});

// Calcular gap
const target2030 = baselineEmissions * 0.5; // -50% SBTi
const currentTrajectory = current.totalEmissions * (1 + parseFloat(forecast.analysis.percentChange) / 100);
const gap = currentTrajectory - target2030;

// Risco de não-compliance
const risk = await getRiskClassification({
  organizationId,
  siteId,
  metricId: 'carbon_emissions'
});

const insight = `
📋 Regulatory Foresight - Análise de Compliance

🌍 Regulamentação Aplicável:
• EU CSRD (Corporate Sustainability Reporting Directive)
• SBTi (Science Based Targets initiative)
• CDP (Carbon Disclosure Project)

📊 Status Atual (2024):
• Emissões: ${current.totalEmissions} tCO2e
• Target 2030: ${target2030} tCO2e (-50% vs 2020)
• Gap: ${gap > 0 ? `⚠️ ${gap.toFixed(0)} tCO2e ACIMA` : `✅ ${Math.abs(gap).toFixed(0)} tCO2e ABAIXO`}

📈 Projeção Prophet:
• Tendência: ${forecast.analysis.direction} (${forecast.analysis.percentChange}%)
• Trajetória 2030: ${currentTrajectory.toFixed(0)} tCO2e
• Status: ${gap > 0 ? '🔴 EM RISCO' : '🟢 ON TRACK'}

⚠️ Risco de Não-Compliance:
• Nível: ${risk.riskLevel.toUpperCase()}
• Confiança: ${(risk.confidence * 100).toFixed(0)}%
• Probabilidade de multa: ${risk.riskLevel === 'high' ? 'ALTA (>70%)' : 'MÉDIA (30-70%)'}

🚨 Ações Urgentes:
${gap > 0 ? `
1. Redução necessária: ${(gap / 6).toFixed(0)} tCO2e/ano até 2030
2. Implementar programa de descarbonização
3. Investir em energia renovável (PPA/PPC)
4. Offset credits como último recurso: ${(gap * 0.3).toFixed(0)} tCO2e
` : `
✅ Mantendo trajetória atual para cumprir target 2030
📊 Continuar monitorização trimestral
`}

📅 Deadlines Importantes:
• CSRD Reporting: 31 Março 2025
• CDP Submission: 31 Julho 2025
• SBTi Validation: Q4 2025
`;
```

---

## 👔 **8. ESG Chief of Staff** - Coordenador Estratégico ESG

### Objetivo
Visão estratégica e coordenação de todos os agentes.

### Ferramentas Recomendadas

#### Core Tools
- ✅ `calculateEmissions` - **CRÍTICA** - Overview completo
- ✅ `generateCarbonReport` - **CRÍTICA** - Executive summaries
- ✅ `benchmarkEfficiency` - **CRÍTICA** - Posicionamento competitivo

#### ML Tools
- ✅ `getProphetForecast` - **CRÍTICA** - Planeamento estratégico
- ✅ `getRiskClassification` - **CRÍTICA** - Portfolio de riscos
- ✅ `getPatternAnalysis` - Insights estratégicos
- ✅ `getAnomalyScore` - Validação de decisões

### Exemplo de Uso

```typescript
// Executive overview
const emissions = await calculateEmissions({ organizationId });
const forecast = await getProphetForecast({ organizationId, metricId: 'total_emissions' });
const efficiency = await benchmarkEfficiency({ organizationId });

// Portfolio de riscos
const sites = await getSites({ organizationId });
const risks = await Promise.all(
  sites.map(site => getRiskClassification({
    organizationId,
    siteId: site.id,
    metricId: 'carbon_emissions'
  }))
);

const highRiskCount = risks.filter(r => r.riskLevel === 'high').length;
const patterns = await getPatternAnalysis({ organizationId, siteId: sites[0].id, metricId: 'carbon_emissions' });

const insight = `
👔 ESG Chief of Staff - Executive Summary

📊 **Performance Overview (YTD 2024)**

Emissões Totais: ${emissions.totalEmissions} tCO2e
├─ Scope 1: ${emissions.totalsByScope.scope_1} tCO2e (${((emissions.totalsByScope.scope_1 / emissions.totalEmissions) * 100).toFixed(0)}%)
├─ Scope 2: ${emissions.totalsByScope.scope_2} tCO2e (${((emissions.totalsByScope.scope_2 / emissions.totalEmissions) * 100).toFixed(0)}%)
└─ Scope 3: ${emissions.totalsByScope.scope_3} tCO2e (${((emissions.totalsByScope.scope_3 / emissions.totalEmissions) * 100).toFixed(0)}%)

📈 **Strategic Outlook**

Target 2030: -50% vs baseline (SBTi)
Trajetória Atual: ${forecast.analysis.direction} (${forecast.analysis.percentChange}%)
Status: ${Math.abs(parseFloat(forecast.analysis.percentChange)) > 10 ? '🔴 INTERVENÇÃO NECESSÁRIA' : '🟢 ON TRACK'}

⚖️ **Risk Portfolio**

Total Sites: ${sites.length}
├─ 🔴 High Risk: ${highRiskCount}
├─ 🟡 Medium Risk: ${risks.filter(r => r.riskLevel === 'medium').length}
└─ 🟢 Low Risk: ${risks.filter(r => r.riskLevel === 'low').length}

💰 **Financial Impact**

Carbon Cost (€50/tCO2e): €${(emissions.totalEmissions * 50).toLocaleString()}
Optimization Potential: €${(emissions.totalEmissions * 50 * 0.15).toLocaleString()} (15% reduction)
ROI: ${((emissions.totalEmissions * 50 * 0.15) / 50000 * 100).toFixed(0)}% (payback: ${(50000 / (emissions.totalEmissions * 50 * 0.15 / 12)).toFixed(0)} meses)

🎯 **Strategic Priorities Q4 2024**

1. **Descarbonização** (€${(emissions.totalEmissions * 50 * 0.10).toLocaleString()}/ano)
   - Energia renovável: 40% do consumo até 2025
   - Eficiência HVAC: -20% consumo

2. **Risk Mitigation** (${highRiskCount} sites)
   - Audit high-risk sites
   - Implementar monitoring contínuo

3. **Compliance** (Q1 2025)
   - CSRD reporting (deadline: 31 Mar)
   - CDP submission
   - SBTi validation

4. **Innovation** (€25k investment)
   - IoT sensors para real-time monitoring
   - AI-powered optimization
   - Blockchain supply chain tracking

📅 **Next Board Meeting: Key Messages**

✅ On track para targets 2030 (com intervenções)
⚠️ ${highRiskCount} sites precisam atenção urgente
💰 €${(emissions.totalEmissions * 50 * 0.15 / 1000).toFixed(0)}k poupança anual identificada
🌱 Posicionamento competitivo: ${efficiency.ranking} no setor
`;
```

---

## 📊 Resumo de Ferramentas por Agente

| Agente | Core Tools | ML Tools | Prioridade |
|--------|-----------|----------|------------|
| **Carbon Hunter** | 5/5 | 5/5 | MÁXIMA |
| **Compliance Guardian** | 3/5 | 3/5 | ALTA |
| **Cost Saving Finder** | 3/5 | 4/5 | ALTA |
| **Predictive Maintenance** | 2/5 | 5/5 | MÁXIMA |
| **Autonomous Optimizer** | 2/5 | 4/5 | ALTA |
| **Supply Chain Investigator** | 3/5 | 4/5 | ALTA |
| **Regulatory Foresight** | 3/5 | 3/5 | MÉDIA |
| **ESG Chief of Staff** | 3/5 | 4/5 | MÁXIMA |

---

## 🚀 Implementação

### Passo 1: Atualizar Agentes

Adicionar as novas ferramentas ML a cada agente:

```typescript
import { getSustainabilityTools } from '../tools';
import { getMLAnalysisTools } from '../tools/ml-analysis-tools';

// Em cada agente V2:
const result = await generateText({
  model: this.model,
  tools: {
    ...getSustainabilityTools(),  // 5 core tools
    ...getMLAnalysisTools(),       // 5 ML tools
  },
  prompt: taskDescription
});
```

### Passo 2: Treinar Modelos ML

```bash
# No Railway, os modelos serão treinados automaticamente
# ML Training Service roda mensalmente (dia 15, 2:00 AM UTC)
# Agora vai treinar 5 tipos de modelos em vez de 2
```

### Passo 3: Verificar Resultados

```sql
-- Ver modelos treinados por tipo
SELECT model_type, COUNT(*) as count
FROM ml_models
GROUP BY model_type;

-- Resultado esperado:
-- emissions_prediction    | 66  (LSTM)
-- anomaly_detection       | 66  (Autoencoder)
-- pattern_recognition     | 66  (CNN) ← NOVO
-- fast_forecast           | 66  (GRU) ← NOVO
-- risk_classification     | 66  (Classification) ← NOVO
-- TOTAL: 330 modelos ML!
```

---

## ✅ Próximos Passos

1. ✅ Modelos ML implementados (CNN, GRU, Classification)
2. ✅ Tools criadas (5 ferramentas ML avançadas)
3. ✅ Mapeamento completo por agente
4. ⏳ Atualizar agentes para usar novas tools
5. ⏳ Deploy e testar no Railway
6. ⏳ Monitorizar performance e ROI

**Cada agente agora tem acesso a 10 ferramentas poderosas (5 core + 5 ML) para maximizar o seu impacto!** 🚀
