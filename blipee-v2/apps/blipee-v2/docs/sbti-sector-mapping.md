# SBTi Sector Mapping System

## 📋 Visão Geral

O sistema SBTi da Blipee inclui um **mapeamento automático** entre a indústria/setor da organização e os pathways científicos SBTi. Isto permite que as organizações obtenham recomendações de targets precisas e específicas para o seu setor.

## 🎯 Como Funciona

### 1. **Prioridade de Mapeamento**

O sistema utiliza uma hierarquia de métodos para determinar o setor SBTi mais apropriado:

```
1. GRI Sector Code (Mais preciso) → Confiança: ALTA
2. NAICS Code (Standard) → Confiança: ALTA
3. Keyword Matching (Texto livre) → Confiança: MÉDIA
4. Cross-sector (Default) → Confiança: BAIXA
```

### 2. **Setores SBTi Disponíveis**

| Setor SBTi | Pathways Disponíveis | Descrição |
|------------|---------------------|-----------|
| `cement` | ETP_B2DS, SBTi_1.5C | Produção de cimento e clínquer |
| `iron_steel` | ETP_B2DS, SBTi_1.5C | Siderurgia e aço |
| `aluminum` | ETP_B2DS | Produção de alumínio |
| `pulp_paper` | ETP_B2DS | Papel e celulose |
| `power_generation` | ETP_B2DS, SBTi_1.5C | Geração de energia elétrica |
| `buildings` | ETP_B2DS, SBTi_1.5C | Construção e edifícios |
| `flag` | ETP_B2DS | Forest, Land & Agriculture |
| `transport` | ETP_B2DS | Transporte geral |
| `aviation` | ETP_B2DS | Aviação |
| `maritime` | ETP_B2DS | Transporte marítimo |
| `oil_gas` | ETP_B2DS | Petróleo e gás |
| `chemicals` | ETP_B2DS | Indústria química |
| `cross_sector` | ETP_B2DS, SBTi_1.5C | Universal (todas as indústrias) |

### 3. **Exemplos de Mapeamento**

#### ✅ Alta Confiança (GRI)

```typescript
Organization: {
  name: "AgriTech Farms",
  industry: "Agriculture",
  gri_sector_code: "GRI 13"
}
→ SBTi Sector: "flag" (Forest, Land & Agriculture)
→ Confidence: HIGH
→ Method: GRI
```

#### ✅ Alta Confiança (NAICS)

```typescript
Organization: {
  name: "CementCo",
  industry: "Manufacturing",
  naics_code: "3241"
}
→ SBTi Sector: "cement"
→ Confidence: HIGH
→ Method: NAICS
```

#### ⚠️ Média Confiança (Keywords)

```typescript
Organization: {
  name: "Green Energy Solutions",
  industry: "Renewable Energy"
}
→ SBTi Sector: "power_generation"
→ Confidence: MEDIUM
→ Method: Keyword matching on "renewable energy"
```

#### ⚠️ Baixa Confiança (Default)

```typescript
Organization: {
  name: "Tech Startup",
  industry: "Software"
}
→ SBTi Sector: "cross_sector"
→ Confidence: LOW
→ Method: Default (no specific match found)
→ Suggestions: ["buildings", "power_generation", "flag"]
```

## 🔧 Implementação Técnica

### Ficheiros Principais

1. **`src/lib/sbti/sector-mapping.ts`**
   - Lógica de mapeamento
   - Definições de setores
   - Keyword matching

2. **`src/app/actions/sbti/sector.ts`**
   - Server actions para buscar setor da organização
   - Integração com base de dados
   - Validação de pathways disponíveis

3. **`src/app/dashboard/sbti/SectorMappingCard.tsx`**
   - Componente UI que mostra o setor mapeado
   - Indicador de confiança
   - Sugestões de setores alternativos

### Fluxo de Dados

```
Organizations Table
       ↓
  [industry, gri_sector_code, naics_code]
       ↓
mapOrganizationToSBTiSector()
       ↓
  {sector, confidence, method}
       ↓
getOrganizationPathway()
       ↓
SBTi Pathways Database
       ↓
Calculate Target
```

## 📊 Dados de Pathways

### Cobertura Atual

```sql
SELECT sector, COUNT(DISTINCT scenario) as scenarios,
       COUNT(*) / COUNT(DISTINCT scenario) as years_per_scenario
FROM sbti_pathways
GROUP BY sector
ORDER BY sector;
```

| Sector | Scenarios | Years per Scenario |
|--------|-----------|-------------------|
| aluminum | 1 (ETP_B2DS) | 37 (2014-2050) |
| buildings | 2 | 37 |
| cement | 2 | 37 |
| cross_sector | 2 | 37 |
| iron_steel | 2 | 37 |
| power_generation | 2 | 37 |
| pulp_paper | 1 (ETP_B2DS) | 37 |

**Total**: 407 pathways importados

## 🚀 Como Usar

### No Código (Server-Side)

```typescript
import { getOrganizationSBTiSector, getOrganizationPathway } from '@/app/actions/sbti/sector'

// Get organization's mapped sector
const result = await getOrganizationSBTiSector()
console.log(result.data?.sector) // "cement"
console.log(result.data?.confidence) // "high"

// Get pathway for organization's sector
const pathway = await getOrganizationPathway({
  scenario: 'SBTi_1.5C',
  baseYear: 2020,
  targetYear: 2030
})
console.log(pathway.data?.requiredReduction) // 18.6%
```

### Na UI

O componente `<SectorMappingCard />` mostra automaticamente:
- ✅ Setor SBTi mapeado
- ✅ Nível de confiança
- ✅ Método de determinação
- ✅ Cenários disponíveis
- ✅ Cobertura temporal
- ⚠️ Sugestões (se confiança baixa)

## 🎨 Melhorar a Precisão

### Opção 1: Definir GRI Sector Code

Nas definições da organização, configurar o código GRI:

```sql
UPDATE organizations
SET gri_sector_code = 'GRI 11' -- Oil and Gas
WHERE id = 'org-uuid';
```

### Opção 2: Definir NAICS Code

Através da interface de classificação de indústria:

```sql
UPDATE organizations
SET industry_classification_id = (
  SELECT id FROM industry_classifications
  WHERE code = '3241' AND classification_system = 'NAICS'
)
WHERE id = 'org-uuid';
```

### Opção 3: Keywords na Indústria

Usar palavras-chave específicas:

```typescript
// ✅ BOM
industry: "Cement Manufacturing"
industry_primary: "Construction Materials - Cement"

// ❌ VAGO
industry: "Manufacturing"
industry_primary: "Industrial"
```

## 📈 Exemplo Completo: Target Calculation

```typescript
// 1. Organização: Fabricante de Cimento
const org = {
  name: "Global Cement Corp",
  industry: "Cement Manufacturing",
  gri_sector_code: null
}

// 2. Mapeamento automático
const sector = await getOrganizationSBTiSector()
// → sector = "cement", confidence = "medium", method = "keyword"

// 3. Obter pathway
const pathway = await getOrganizationPathway({
  scenario: 'SBTi_1.5C',
  baseYear: 2020,
  targetYear: 2030
})
// → requiredReduction = 18.6%

// 4. Aplicar ao inventory da empresa
const companyEmissions2020 = 50000 // tCO2e
const targetEmissions2030 = companyEmissions2020 * (1 - 0.186)
// → 40,700 tCO2e

// 5. Validação SBTi
// ✅ Timeframe: 10 anos (válido: 5-10)
// ✅ Ambition: 1.5°C (válido para Scope 1+2)
// ✅ Pathway: Cement-specific (melhor que cross-sector)
```

## 🔍 Testing

### Script de Teste

```bash
# Testar mapeamento de setores
node scripts/test-sector-mapping.js

# Testar pathways completos
node scripts/test-sbti-pathways.js
```

### Output Esperado

```
✅ Cement → cement (medium confidence via keywords)
✅ Steel → iron_steel (medium confidence via keywords)
✅ Renewable Energy → power_generation (medium confidence via keywords)
✅ Agriculture + GRI 13 → flag (high confidence via GRI)
⚠️ Software → cross_sector (low confidence - default)
```

## 📚 Referências

- **SBTi Sector Pathways**: [SBTi Database Sheet](https://sciencebasedtargets.org/)
- **GRI Sectors**: [GRI Sector Standards](https://www.globalreporting.org/)
- **NAICS Codes**: [U.S. Census Bureau](https://www.census.gov/naics/)

---

**Nota**: Este sistema permite que QUALQUER organização use SBTi targets, mesmo sem classificação formal. O pathway "cross-sector" serve como fallback universal.
