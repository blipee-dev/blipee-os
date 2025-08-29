#!/bin/bash

echo "Fixing duplicate imports..."

# Remove duplicate imports and empty imports from all affected files
for file in \
  src/components/OrganizationSwitcher.tsx \
  src/components/blipee-os/MessageSuggestions.tsx \
  src/components/blipee-os/SuggestedQueries.tsx \
  src/components/dynamic/EnhancedChartComponent.tsx \
  src/components/dynamic/ReportComponent.tsx \
  src/components/onboarding/ConversationalOnboarding.tsx
do
  if [ -f "$file" ]; then
    echo "Cleaning $file"
    # Remove duplicate framer-motion imports
    sed -i '' '/^import.*framer-motion.*;$/N;/^import.*framer-motion.*;\nimport.*framer-motion.*;$/d' "$file"
    # Remove empty imports from lucide-react
    sed -i '' 's/import { } from "lucide-react";//g' "$file"
    # Remove consecutive duplicate lines
    awk '!a[$0]++' "$file" > "$file.tmp" && mv "$file.tmp" "$file"
  fi
done

echo "Duplicate imports fixed!"