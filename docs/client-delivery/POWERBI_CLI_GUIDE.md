# Power BI - CLI & Automation Guide

Guia completo de ferramentas de linha de comando para automatizar Power BI.

---

## 🛠️ Opções Disponíveis

### 1. **Power BI PowerShell** (Oficial Microsoft)
✅ Recomendado
✅ Suportado oficialmente
✅ Funciona no Windows, Mac, Linux

### 2. **Power BI REST API** (via curl/scripts)
✅ Cross-platform
✅ Pode ser usado em qualquer linguagem
✅ Ideal para CI/CD

### 3. **pbi-tools** (Community)
✅ Open-source
✅ Deploy de reports como código
✅ Version control para .pbix

### 4. **Tabular Editor** (Advanced)
✅ Editar datasets sem Power BI Desktop
✅ Scripting de modelos
✅ CI/CD para semantic models

---

## 🚀 Opção 1: Power BI PowerShell (Mais Fácil)

### Instalação

**Windows:**
```powershell
Install-Module -Name MicrosoftPowerBIMgmt -Scope CurrentUser
```

**Mac/Linux:**
```bash
# Instalar PowerShell primeiro
brew install --cask powershell

# Depois instalar módulo
pwsh
Install-Module -Name MicrosoftPowerBIMgmt -Scope CurrentUser
```

### Login
```powershell
Connect-PowerBIServiceAccount
# Abrirá browser para autenticação
```

### Comandos Úteis

**Listar Workspaces:**
```powershell
Get-PowerBIWorkspace
```

**Listar Datasets:**
```powershell
Get-PowerBIDataset -WorkspaceId "workspace-id-aqui"
```

**Refresh Manual de Dataset:**
```powershell
Invoke-PowerBIRestMethod -Url "groups/workspace-id/datasets/dataset-id/refreshes" -Method Post
```

**Publicar Report (.pbix):**
```powershell
New-PowerBIReport `
    -Path "C:\Reports\PLMJ_Energy_Dashboard.pbix" `
    -WorkspaceId "workspace-id" `
    -Name "PLMJ Energy Dashboard"
```

**Verificar Status de Refresh:**
```powershell
$refreshes = Invoke-PowerBIRestMethod `
    -Url "groups/workspace-id/datasets/dataset-id/refreshes" `
    -Method Get | ConvertFrom-Json

$refreshes.value | Select-Object refreshType, status, startTime, endTime
```

---

## 🌐 Opção 2: Power BI REST API (Cross-Platform)

### Autenticação

**1. Criar App no Azure AD:**
```
Azure Portal → Azure Active Directory → App Registrations → New Registration
Nome: "PLMJ Power BI Automation"
Redirect URI: http://localhost (para scripts locais)
```

**2. Dar Permissões:**
```
API Permissions → Add Permission → Power BI Service
Delegated: Dataset.ReadWrite.All, Report.ReadWrite.All
```

**3. Obter Token:**
```bash
#!/bin/bash
# get-token.sh

CLIENT_ID="your-app-client-id"
TENANT_ID="your-tenant-id"
USERNAME="user@plmj.pt"
PASSWORD="password"

curl -X POST \
  "https://login.microsoftonline.com/$TENANT_ID/oauth2/v2.0/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=$CLIENT_ID" \
  -d "scope=https://analysis.windows.net/powerbi/api/.default" \
  -d "username=$USERNAME" \
  -d "password=$PASSWORD" \
  -d "grant_type=password" \
| jq -r '.access_token' > token.txt
```

### Exemplos de Uso

**Listar Datasets:**
```bash
#!/bin/bash
TOKEN=$(cat token.txt)

curl -X GET \
  "https://api.powerbi.com/v1.0/myorg/groups/workspace-id/datasets" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.value[] | {id, name, isRefreshable}'
```

**Trigger Refresh:**
```bash
#!/bin/bash
TOKEN=$(cat token.txt)
WORKSPACE_ID="your-workspace-id"
DATASET_ID="your-dataset-id"

curl -X POST \
  "https://api.powerbi.com/v1.0/myorg/groups/$WORKSPACE_ID/datasets/$DATASET_ID/refreshes" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

echo "Refresh triggered successfully!"
```

**Verificar Status de Refresh:**
```bash
#!/bin/bash
TOKEN=$(cat token.txt)
WORKSPACE_ID="your-workspace-id"
DATASET_ID="your-dataset-id"

curl -X GET \
  "https://api.powerbi.com/v1.0/myorg/groups/$WORKSPACE_ID/datasets/$DATASET_ID/refreshes?$top=1" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.value[0] | {status, startTime, endTime, refreshType}'
```

**Obter Connection String de um Dataset:**
```bash
curl -X GET \
  "https://api.powerbi.com/v1.0/myorg/groups/$WORKSPACE_ID/datasets/$DATASET_ID/datasources" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.value[] | {datasourceType, connectionDetails}'
```

---

## 🔄 Opção 3: Automatizar Setup Completo (Script)

### Script: setup-powerbi-plmj.sh

```bash
#!/bin/bash
# setup-powerbi-plmj.sh
# Script para automatizar setup inicial do Power BI para PLMJ

set -e  # Exit on error

echo "🚀 PLMJ Power BI Setup Automation"
echo "=================================="
echo ""

# Configuração
ORG_ID="22647141-2ee4-4d8d-8b47-16b0cbd830b2"
API_KEY="blp_live_iaw2rPXZOxDeKLdVEufa5QmDCCA3m2jz"
BASE_URL="https://www.blipee.io/api/powerbi"
OUTPUT_DIR="./powerbi-data"

# Criar diretório de output
mkdir -p "$OUTPUT_DIR"

# Função para testar endpoint
test_endpoint() {
    local endpoint=$1
    local name=$2

    echo "📊 Testing $name endpoint..."

    curl -sL \
        -H "x-api-key: $API_KEY" \
        "${BASE_URL}/${endpoint}?organizationId=${ORG_ID}&startDate=2024-01-01&endDate=2024-12-31" \
        > "${OUTPUT_DIR}/${name}.json"

    # Verificar se tem dados
    local records=$(jq '.metadata.totals.total_records' "${OUTPUT_DIR}/${name}.json" 2>/dev/null || echo "0")

    if [ "$records" != "null" ] && [ "$records" != "0" ]; then
        echo "   ✅ Success: $records records"
        return 0
    else
        echo "   ❌ Failed or no data"
        return 1
    fi
}

# Testar todos os endpoints
echo ""
echo "📡 Testing all endpoints..."
echo ""

test_endpoint "sites" "sites"
test_endpoint "energy" "energy"
test_endpoint "water" "water"
test_endpoint "waste" "waste"
test_endpoint "travel" "travel"
test_endpoint "emissions" "emissions"

echo ""
echo "📁 Data saved to: $OUTPUT_DIR/"
echo ""

# Gerar resumo
echo "📊 Data Summary:"
echo "==============="
for file in "$OUTPUT_DIR"/*.json; do
    name=$(basename "$file" .json)
    records=$(jq '.metadata.totals.total_records // 0' "$file" 2>/dev/null)
    echo "   $name: $records records"
done

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Import JSON files into Power BI using 'Get Data > JSON'"
echo "2. Or use Power Query M code (see below)"
echo ""

# Gerar Power Query M code
cat > "${OUTPUT_DIR}/PowerQuery.m" << 'EOF'
// Power Query M Code - PLMJ Energy Data
// Copy this into Power BI Desktop > Transform Data > New Source > Blank Query

let
    // Configuração
    BaseUrl = "https://www.blipee.io/api/powerbi",
    OrganizationId = "22647141-2ee4-4d8d-8b47-16b0cbd830b2",
    ApiKey = "blp_live_iaw2rPXZOxDeKLdVEufa5QmDCCA3m2jz",
    StartDate = "2024-01-01",
    EndDate = "2024-12-31",

    // Construir URL
    Url = BaseUrl & "/energy?organizationId=" & OrganizationId & "&startDate=" & StartDate & "&endDate=" & EndDate,

    // Fazer request
    Source = Json.Document(
        Web.Contents(
            Url,
            [
                Headers=[
                    #"x-api-key" = ApiKey,
                    #"Content-Type" = "application/json"
                ]
            ]
        )
    ),

    // Extrair dados
    data = Source[data],

    // Converter para tabela
    ToTable = Table.FromList(data, Splitter.SplitByNothing(), null, null, ExtraValues.Error),

    // Expandir records
    ExpandColumn = Table.ExpandRecordColumn(
        ToTable,
        "Column1",
        {
            "metric_id", "organization_id", "site_id",
            "period_start", "period_end", "year", "month", "quarter",
            "metric_code", "metric_name", "metric_category", "metric_subcategory",
            "value", "unit", "co2e_emissions", "co2e_unit",
            "site_name", "site_location", "site_employees", "site_area_sqm",
            "energy_per_employee", "energy_per_sqm", "emissions_per_employee",
            "data_quality", "last_updated"
        }
    ),

    // Converter tipos
    ChangedTypes = Table.TransformColumnTypes(
        ExpandColumn,
        {
            {"year", Int64.Type},
            {"month", Int64.Type},
            {"quarter", Int64.Type},
            {"value", type number},
            {"co2e_emissions", type number},
            {"site_employees", Int64.Type},
            {"site_area_sqm", type number},
            {"energy_per_employee", type number},
            {"energy_per_sqm", type number},
            {"emissions_per_employee", type number},
            {"period_start", type date},
            {"period_end", type date}
        }
    )
in
    ChangedTypes
EOF

echo "📝 Power Query M code generated: ${OUTPUT_DIR}/PowerQuery.m"
echo ""
```

**Uso:**
```bash
chmod +x setup-powerbi-plmj.sh
./setup-powerbi-plmj.sh
```

**Output:**
```
🚀 PLMJ Power BI Setup Automation
==================================

📡 Testing all endpoints...

📊 Testing sites endpoint...
   ✅ Success: 3 records
📊 Testing energy endpoint...
   ✅ Success: 664 records
📊 Testing water endpoint...
   ✅ Success: 664 records
📊 Testing waste endpoint...
   ✅ Success: 664 records
📊 Testing travel endpoint...
   ✅ Success: 664 records
📊 Testing emissions endpoint...
   ✅ Success: 664 records

📁 Data saved to: ./powerbi-data/

📊 Data Summary:
===============
   sites: 3 records
   energy: 664 records
   water: 664 records
   waste: 664 records
   travel: 664 records
   emissions: 664 records

✅ Setup complete!
```

---

## 🔧 Opção 4: pbi-tools (Deploy como Código)

### Instalação
```bash
# Windows
choco install pbi-tools

# Mac
brew install pbi-tools

# Linux
dotnet tool install -g pbi-tools
```

### Extrair Report para Source Control
```bash
# Extrair .pbix para formato texto (git-friendly)
pbi-tools extract -pbixPath "PLMJ_Dashboard.pbix" -extractFolder "./src"

# Estrutura criada:
src/
├── Model/
│   ├── tables/
│   ├── relationships/
│   └── measures/
├── Report/
│   ├── pages/
│   └── visuals/
└── Queries/
    └── *.m
```

### Build Report a partir do Source
```bash
# Recriar .pbix a partir dos ficheiros
pbi-tools compile -folder "./src" -outPath "PLMJ_Dashboard_v2.pbix"
```

### Use Case: CI/CD
```yaml
# .github/workflows/powerbi-deploy.yml
name: Deploy Power BI Report

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Install pbi-tools
        run: dotnet tool install -g pbi-tools

      - name: Compile Report
        run: pbi-tools compile -folder "./powerbi/src" -outPath "report.pbix"

      - name: Deploy to Power BI Service
        run: |
          # PowerShell script para publicar
          pwsh -File deploy-report.ps1
        env:
          POWERBI_CLIENT_ID: ${{ secrets.POWERBI_CLIENT_ID }}
          POWERBI_CLIENT_SECRET: ${{ secrets.POWERBI_CLIENT_SECRET }}
```

---

## 📊 Script Python: Gestão Completa

### powerbi_manager.py

```python
#!/usr/bin/env python3
"""
Power BI Manager - PLMJ
Gestão automatizada de datasets e reports
"""

import requests
import json
import time
from datetime import datetime

class PowerBIManager:
    def __init__(self, client_id, client_secret, tenant_id):
        self.client_id = client_id
        self.client_secret = client_secret
        self.tenant_id = tenant_id
        self.token = None
        self.base_url = "https://api.powerbi.com/v1.0/myorg"

    def authenticate(self):
        """Obter access token"""
        token_url = f"https://login.microsoftonline.com/{self.tenant_id}/oauth2/v2.0/token"

        data = {
            'client_id': self.client_id,
            'client_secret': self.client_secret,
            'scope': 'https://analysis.windows.net/powerbi/api/.default',
            'grant_type': 'client_credentials'
        }

        response = requests.post(token_url, data=data)
        self.token = response.json()['access_token']
        print("✅ Authenticated successfully")

    def get_headers(self):
        return {
            'Authorization': f'Bearer {self.token}',
            'Content-Type': 'application/json'
        }

    def list_workspaces(self):
        """Listar todos os workspaces"""
        url = f"{self.base_url}/groups"
        response = requests.get(url, headers=self.get_headers())
        workspaces = response.json()['value']

        print("\n📁 Workspaces:")
        for ws in workspaces:
            print(f"   - {ws['name']} ({ws['id']})")

        return workspaces

    def list_datasets(self, workspace_id):
        """Listar datasets num workspace"""
        url = f"{self.base_url}/groups/{workspace_id}/datasets"
        response = requests.get(url, headers=self.get_headers())
        datasets = response.json()['value']

        print(f"\n📊 Datasets:")
        for ds in datasets:
            print(f"   - {ds['name']}: {ds.get('isRefreshable', 'N/A')}")

        return datasets

    def refresh_dataset(self, workspace_id, dataset_id):
        """Trigger refresh de um dataset"""
        url = f"{self.base_url}/groups/{workspace_id}/datasets/{dataset_id}/refreshes"

        response = requests.post(url, headers=self.get_headers())

        if response.status_code == 202:
            print(f"✅ Refresh triggered successfully")
            return True
        else:
            print(f"❌ Refresh failed: {response.text}")
            return False

    def check_refresh_status(self, workspace_id, dataset_id):
        """Verificar status do último refresh"""
        url = f"{self.base_url}/groups/{workspace_id}/datasets/{dataset_id}/refreshes?$top=1"

        response = requests.get(url, headers=self.get_headers())
        refreshes = response.json()['value']

        if refreshes:
            latest = refreshes[0]
            print(f"\n🔄 Latest Refresh:")
            print(f"   Status: {latest['status']}")
            print(f"   Started: {latest.get('startTime', 'N/A')}")
            print(f"   Ended: {latest.get('endTime', 'N/A')}")

            return latest
        else:
            print("No refresh history")
            return None

    def update_datasource_credentials(self, workspace_id, dataset_id, credentials):
        """Atualizar credenciais da fonte de dados"""
        # Primeiro, obter datasources
        url = f"{self.base_url}/groups/{workspace_id}/datasets/{dataset_id}/datasources"
        response = requests.get(url, headers=self.get_headers())
        datasources = response.json()['value']

        for ds in datasources:
            gateway_id = ds['gatewayId']
            datasource_id = ds['datasourceId']

            # Atualizar credenciais
            update_url = f"{self.base_url}/gateways/{gateway_id}/datasources/{datasource_id}"

            payload = {
                "credentialDetails": {
                    "credentialType": "Key",
                    "credentials": json.dumps({
                        "key": credentials['api_key']
                    }),
                    "encryptedConnection": "Encrypted",
                    "encryptionAlgorithm": "None",
                    "privacyLevel": "None"
                }
            }

            response = requests.patch(update_url, json=payload, headers=self.get_headers())

            if response.status_code == 200:
                print(f"✅ Credentials updated for datasource {datasource_id}")
            else:
                print(f"❌ Failed to update credentials: {response.text}")

# Uso
if __name__ == "__main__":
    # Configuração (usar variáveis de ambiente em produção!)
    manager = PowerBIManager(
        client_id="your-client-id",
        client_secret="your-client-secret",
        tenant_id="your-tenant-id"
    )

    # Autenticar
    manager.authenticate()

    # Listar recursos
    workspaces = manager.list_workspaces()

    # Escolher workspace
    workspace_id = workspaces[0]['id']
    datasets = manager.list_datasets(workspace_id)

    # Refresh dataset
    dataset_id = datasets[0]['id']
    manager.refresh_dataset(workspace_id, dataset_id)

    # Aguardar e verificar
    time.sleep(10)
    manager.check_refresh_status(workspace_id, dataset_id)
```

**Uso:**
```bash
python3 powerbi_manager.py
```

---

## ⚙️ Automatizar Refresh Diário

### Opção A: Cron (Linux/Mac)

```bash
# Editar crontab
crontab -e

# Adicionar linha (refresh diário às 6h)
0 6 * * * /usr/bin/python3 /path/to/powerbi_refresh.py >> /var/log/powerbi.log 2>&1
```

### Opção B: Task Scheduler (Windows)

```powershell
# Script: daily-refresh.ps1
Connect-PowerBIServiceAccount

$workspaceId = "your-workspace-id"
$datasetId = "your-dataset-id"

Invoke-PowerBIRestMethod `
    -Url "groups/$workspaceId/datasets/$datasetId/refreshes" `
    -Method Post

Write-Host "Refresh triggered at $(Get-Date)"
```

**Criar Task:**
```powershell
$action = New-ScheduledTaskAction -Execute "pwsh.exe" -Argument "-File C:\Scripts\daily-refresh.ps1"
$trigger = New-ScheduledTaskTrigger -Daily -At 6am
Register-ScheduledTask -Action $action -Trigger $trigger -TaskName "PowerBI Daily Refresh" -Description "PLMJ Energy Dashboard"
```

### Opção C: GitHub Actions

```yaml
# .github/workflows/powerbi-refresh.yml
name: Daily Power BI Refresh

on:
  schedule:
    - cron: '0 6 * * *'  # 6h UTC todos os dias
  workflow_dispatch:  # Permitir trigger manual

jobs:
  refresh:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Power BI Refresh
        run: |
          curl -X POST \
            "https://api.powerbi.com/v1.0/myorg/groups/${{ secrets.WORKSPACE_ID }}/datasets/${{ secrets.DATASET_ID }}/refreshes" \
            -H "Authorization: Bearer ${{ secrets.POWERBI_TOKEN }}"

      - name: Wait for completion
        run: sleep 60

      - name: Check Status
        run: |
          STATUS=$(curl -X GET \
            "https://api.powerbi.com/v1.0/myorg/groups/${{ secrets.WORKSPACE_ID }}/datasets/${{ secrets.DATASET_ID }}/refreshes?$top=1" \
            -H "Authorization: Bearer ${{ secrets.POWERBI_TOKEN }}" \
            | jq -r '.value[0].status')

          echo "Refresh status: $STATUS"

          if [ "$STATUS" != "Completed" ]; then
            exit 1
          fi
```

---

## 🎯 CLI Completo para PLMJ

### plmj-powerbi CLI Tool

```bash
#!/bin/bash
# plmj-powerbi - CLI tool para gestão Power BI

VERSION="1.0.0"
CONFIG_FILE="$HOME/.plmj-powerbi.conf"

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Funções auxiliares
log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

# Comandos
cmd_init() {
    log_info "Initializing PLMJ Power BI configuration..."

    read -p "Organization ID: " ORG_ID
    read -p "API Key: " API_KEY
    read -p "Power BI Workspace ID (optional): " WORKSPACE_ID

    cat > "$CONFIG_FILE" << EOF
ORG_ID="$ORG_ID"
API_KEY="$API_KEY"
WORKSPACE_ID="$WORKSPACE_ID"
BASE_URL="https://www.blipee.io/api/powerbi"
EOF

    chmod 600 "$CONFIG_FILE"
    log_info "Configuration saved to $CONFIG_FILE"
}

cmd_test() {
    source "$CONFIG_FILE"

    log_info "Testing all endpoints..."

    for endpoint in sites energy water waste travel emissions; do
        printf "  %-12s ... " "$endpoint"

        response=$(curl -sL \
            -H "x-api-key: $API_KEY" \
            "${BASE_URL}/${endpoint}?organizationId=${ORG_ID}&startDate=2024-01-01&endDate=2024-12-31")

        success=$(echo "$response" | jq -r '.success // false')

        if [ "$success" = "true" ]; then
            records=$(echo "$response" | jq -r '.metadata.totals.total_records // 0')
            echo -e "${GREEN}✓${NC} ($records records)"
        else
            echo -e "${RED}✗${NC}"
        fi
    done
}

cmd_fetch() {
    source "$CONFIG_FILE"

    ENDPOINT=$1
    OUTPUT=${2:-"${ENDPOINT}.json"}

    log_info "Fetching $ENDPOINT data..."

    curl -sL \
        -H "x-api-key: $API_KEY" \
        "${BASE_URL}/${ENDPOINT}?organizationId=${ORG_ID}&startDate=2024-01-01&endDate=2024-12-31" \
        > "$OUTPUT"

    records=$(jq -r '.metadata.totals.total_records // 0' "$OUTPUT")
    log_info "Saved $records records to $OUTPUT"
}

cmd_summary() {
    source "$CONFIG_FILE"

    log_info "PLMJ Data Summary"
    echo "=================="

    for endpoint in energy water waste travel; do
        response=$(curl -sL \
            -H "x-api-key: $API_KEY" \
            "${BASE_URL}/${endpoint}?organizationId=${ORG_ID}&startDate=2024-01-01&endDate=2024-12-31")

        records=$(echo "$response" | jq -r '.metadata.totals.total_records // 0')
        sites=$(echo "$response" | jq -r '.metadata.totals.sites_count // 0')

        printf "%-10s: %4d records, %d sites\n" "$endpoint" "$records" "$sites"
    done
}

cmd_help() {
    cat << EOF
PLMJ Power BI CLI v$VERSION

Usage: plmj-powerbi <command> [options]

Commands:
  init              Initialize configuration
  test              Test all endpoints
  fetch <endpoint>  Fetch data from endpoint
  summary           Show data summary
  help              Show this help

Examples:
  plmj-powerbi init
  plmj-powerbi test
  plmj-powerbi fetch energy
  plmj-powerbi summary

EOF
}

# Main
case "$1" in
    init)    cmd_init ;;
    test)    cmd_test ;;
    fetch)   cmd_fetch "$2" "$3" ;;
    summary) cmd_summary ;;
    help)    cmd_help ;;
    *)       cmd_help ;;
esac
```

**Instalação:**
```bash
# Copiar para /usr/local/bin
sudo cp plmj-powerbi /usr/local/bin/
sudo chmod +x /usr/local/bin/plmj-powerbi

# Usar
plmj-powerbi init
plmj-powerbi test
plmj-powerbi summary
```

---

## 📝 Resumo: Qual Usar?

| Use Case | Ferramenta Recomendada |
|----------|------------------------|
| **Gestão básica de reports** | PowerShell cmdlets |
| **Automação cross-platform** | REST API + curl/python |
| **Version control de .pbix** | pbi-tools |
| **CI/CD pipelines** | REST API + GitHub Actions |
| **Scheduled refreshes** | Cron/Task Scheduler + scripts |
| **Setup inicial rápido** | Script bash personalizado |

---

## ✅ Quick Start Recomendado

**Para PLMJ, recomendo:**

1. **Setup inicial:** Script bash `setup-powerbi-plmj.sh`
2. **Refresh diário:** GitHub Actions ou Cron
3. **Gestão ad-hoc:** PowerShell cmdlets
4. **CI/CD futuro:** pbi-tools + REST API

Tudo documentado e pronto a usar! 🚀
