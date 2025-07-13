#!/bin/bash

# Fix index signature access issues in bulk

# Dynamic UI Renderer
sed -i "s/properties\.title/properties['title']/g" src/components/blipee-os/DynamicUIRenderer.tsx
sed -i "s/properties\.steps/properties['steps']/g" src/components/blipee-os/DynamicUIRenderer.tsx
sed -i "s/properties\.completedCount/properties['completedCount']/g" src/components/blipee-os/DynamicUIRenderer.tsx
sed -i "s/properties\.totalCount/properties['totalCount']/g" src/components/blipee-os/DynamicUIRenderer.tsx
sed -i "s/properties\.topics/properties['topics']/g" src/components/blipee-os/DynamicUIRenderer.tsx
sed -i "s/properties\.opportunities/properties['opportunities']/g" src/components/blipee-os/DynamicUIRenderer.tsx
sed -i "s/properties\.totalSavings/properties['totalSavings']/g" src/components/blipee-os/DynamicUIRenderer.tsx
sed -i "s/properties\.roiTimeline/properties['roiTimeline']/g" src/components/blipee-os/DynamicUIRenderer.tsx
sed -i "s/properties\.priority/properties['priority']/g" src/components/blipee-os/DynamicUIRenderer.tsx
sed -i "s/properties\.insights/properties['insights']/g" src/components/blipee-os/DynamicUIRenderer.tsx

# Autonomous agents
sed -i "s/process\.env\.SUPABASE_SERVICE_KEY/process.env['SUPABASE_SERVICE_KEY']/g" src/lib/ai/autonomous-agents/*.ts
sed -i "s/process\.env\.NEXT_PUBLIC_SUPABASE_ANON_KEY/process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']/g" src/lib/ai/autonomous-agents/*.ts
sed -i "s/row\.id/row['id']/g" src/lib/ai/autonomous-agents/*.ts
sed -i "s/row\.agent_id/row['agent_id']/g" src/lib/ai/autonomous-agents/*.ts
sed -i "s/row\.organization_id/row['organization_id']/g" src/lib/ai/autonomous-agents/*.ts
sed -i "s/row\.task/row['task']/g" src/lib/ai/autonomous-agents/*.ts
sed -i "s/row\.status/row['status']/g" src/lib/ai/autonomous-agents/*.ts
sed -i "s/row\.created_at/row['created_at']/g" src/lib/ai/autonomous-agents/*.ts

# Industry intelligence models
sed -i "s/data\.pesticide_intensity/data['pesticide_intensity']/g" src/lib/ai/industry-intelligence/models/*.ts
sed -i "s/data\.water_use_efficiency/data['water_use_efficiency']/g" src/lib/ai/industry-intelligence/models/*.ts
sed -i "s/data\.crop_yield_per_hectare/data['crop_yield_per_hectare']/g" src/lib/ai/industry-intelligence/models/*.ts
sed -i "s/data\.ghg_intensity_coal/data['ghg_intensity_coal']/g" src/lib/ai/industry-intelligence/models/*.ts
sed -i "s/data\.methane_capture_rate/data['methane_capture_rate']/g" src/lib/ai/industry-intelligence/models/*.ts
sed -i "s/data\.fatality_rate_coal/data['fatality_rate_coal']/g" src/lib/ai/industry-intelligence/models/*.ts

echo "Fixed index signature access issues in bulk"