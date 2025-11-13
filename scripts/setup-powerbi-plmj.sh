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
    local success=$(jq -r '.success // false' "${OUTPUT_DIR}/${name}.json" 2>/dev/null || echo "false")

    if [ "$success" = "true" ]; then
        # Para sites endpoint, usar total_sites ao invés de total_records
        if [ "$name" = "sites" ]; then
            local count=$(jq -r '.metadata.total_sites // 0' "${OUTPUT_DIR}/${name}.json" 2>/dev/null)
            echo "   ✅ Success: $count sites"
        else
            local records=$(jq -r '.metadata.totals.total_records // 0' "${OUTPUT_DIR}/${name}.json" 2>/dev/null)
            echo "   ✅ Success: $records records"
        fi
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
    if [ "$name" = "sites" ]; then
        count=$(jq -r '.metadata.total_sites // 0' "$file" 2>/dev/null || echo "0")
        echo "   $name: $count sites"
    else
        records=$(jq -r '.metadata.totals.total_records // 0' "$file" 2>/dev/null || echo "0")
        echo "   $name: $records records"
    fi
done

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Import JSON files into Power BI using 'Get Data > JSON'"
echo "2. Or use Power Query M code: ${OUTPUT_DIR}/PowerQuery.m"
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
