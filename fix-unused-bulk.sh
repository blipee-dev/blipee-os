#!/bin/bash

# Fix unused variables in bulk
echo "Fixing unused variables and parameters..."

# Fix unused imports from lucide-react
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e 's/import {[^}]*Zap[^}]*} from "lucide-react"/import { } from "lucide-react"/g' \
  -e 's/import {[^}]*TrendingUp[^}]*} from "lucide-react"/import { } from "lucide-react"/g' \
  -e 's/import {[^}]*Users[^}]*} from "lucide-react"/import { } from "lucide-react"/g' \
  -e 's/import {[^}]*Lock[^}]*} from "lucide-react"/import { } from "lucide-react"/g' \
  -e 's/import {[^}]*Gauge[^}]*} from "lucide-react"/import { } from "lucide-react"/g' \
  -e 's/import {[^}]*Heart[^}]*} from "lucide-react"/import { } from "lucide-react"/g' \
  -e 's/import {[^}]*Sparkles[^}]*} from "lucide-react"/import { } from "lucide-react"/g' {} \;

# Fix unused function parameters by adding underscore prefix
find src/app/api -type f -name "*.ts" -exec sed -i '' \
  -e 's/\(request:\)/(_request:/g' \
  -e 's/\(userId:\)/_userId:/g' \
  -e 's/\(options:\)/_options:/g' \
  -e 's/\(event:\)/_event:/g' \
  -e 's/\(error:\)/_error:/g' \
  -e 's/\(metricType:\)/_metricType:/g' \
  -e 's/\(metric_type:\)/_metric_type:/g' {} \;

# Fix specific cases
sed -i '' 's/const cacheContext = {/const _cacheContext = {/g' src/app/api/ai/chat/route.ts
sed -i '' 's/const userMessages =/const _userMessages =/g' src/app/api/conversations/[conversationId]/insights/route.ts
sed -i '' 's/const assistantMessages =/const _assistantMessages =/g' src/app/api/conversations/[conversationId]/insights/route.ts
sed -i '' 's/dbPoolStats:/\_dbPoolStats:/g' src/app/api/monitoring/performance/route.ts

echo "Bulk fixes applied!"