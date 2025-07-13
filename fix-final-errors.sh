#!/bin/bash

echo "Fixing final TypeScript errors..."

# Fix unused imports - remove specific unused imports
sed -i '/import.*Building2.*from/d' src/app/about/page.tsx
sed -i '/import.*Award.*from/d' src/app/about/page.tsx  
sed -i '/import.*TrendingUp.*from/d' src/app/about/page.tsx
sed -i '/import.*MessageSquare.*from/d' src/app/about/page.tsx
sed -i '/import.*Star.*from/d' src/app/about/page.tsx

sed -i '/import.*Cloud.*from/d' src/app/ai-technology/page.tsx
sed -i '/import.*BarChart3.*from/d' src/app/ai-technology/page.tsx
sed -i '/import.*Sparkles.*from/d' src/app/ai-technology/page.tsx
sed -i '/import.*Lock.*from/d' src/app/ai-technology/page.tsx
sed -i '/import.*Layers.*from/d' src/app/ai-technology/page.tsx

# Fix index signature access - change process.env.VAR to process.env['VAR']
sed -i "s/process\.env\.NODE_ENV/process.env\['NODE_ENV'\]/g" src/app/api/ai/chat-enhanced/route.ts
sed -i "s/process\.env\.OPENAI_API_KEY/process.env\['OPENAI_API_KEY'\]/g" src/app/api/ai/chat-enhanced/route.ts
sed -i "s/process\.env\.NEXT_PUBLIC_SUPABASE_URL/process.env\['NEXT_PUBLIC_SUPABASE_URL'\]/g" src/app/api/ai/chat-enhanced/route.ts

# Fix optional file parameter
sed -i 's/const extractedData = await documentParser\.parseDocument(file);/if (file) { const extractedData = await documentParser.parseDocument(file); }/g' src/app/api/ai/chat-enhanced/route.ts

# Fix components undefined issue
sed -i 's/components: contextResponse\.components,/components: contextResponse.components || [],/g' src/app/api/ai/chat/route.ts

# Fix suggestions undefined issue  
sed -i 's/suggestions: aiResponse\.suggestions,/suggestions: aiResponse.suggestions || [],/g' src/app/api/ai/chat/route.ts

# Fix index signature access in all files
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/weatherData\.energy/weatherData\["energy"\]/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/weatherData\.temperature/weatherData\["temperature"\]/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/weatherData\.report/weatherData\["report"\]/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/weatherData\.savings/weatherData\["savings"\]/g'

# Fix actor undefined issues in event publisher
sed -i 's/actor: actor || { type: '\''system'\'', id: '\''webhook-system'\'' },/actor: actor ?? { type: '\''system'\'' as const, id: '\''webhook-system'\'' },/g' src/lib/webhooks/event-publisher.ts

# Fix integration example
sed -i 's/buildingService\.calculateMetrics(/buildingService.calculateMetrics()/g' src/lib/webhooks/integration-example.ts

echo "Fixed remaining TypeScript errors"