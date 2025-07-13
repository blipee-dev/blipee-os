#!/bin/bash

echo "Fixing most common TypeScript error patterns..."

# Fix unused import patterns - remove specific unused imports
find src -name "*.ts" -o -name "*.tsx" | while read file; do
  # Remove unused imports from lucide-react icons
  sed -i '/^import.*lucide-react.*{[^}]*Target[^}]*}.*$/d' "$file"
  sed -i '/^import.*lucide-react.*{[^}]*TreePine[^}]*}.*$/d' "$file"  
  sed -i '/^import.*lucide-react.*{[^}]*Building2[^}]*}.*$/d' "$file"
  sed -i '/^import.*lucide-react.*{[^}]*Award[^}]*}.*$/d' "$file"
  sed -i '/^import.*lucide-react.*{[^}]*TrendingUp[^}]*}.*$/d' "$file"
  sed -i '/^import.*lucide-react.*{[^}]*MessageSquare[^}]*}.*$/d' "$file"
  sed -i '/^import.*lucide-react.*{[^}]*Star[^}]*}.*$/d' "$file"
  sed -i '/^import.*lucide-react.*{[^}]*Cloud[^}]*}.*$/d' "$file"
  sed -i '/^import.*lucide-react.*{[^}]*BarChart3[^}]*}.*$/d' "$file"
  sed -i '/^import.*lucide-react.*{[^}]*Sparkles[^}]*}.*$/d' "$file"
  sed -i '/^import.*lucide-react.*{[^}]*Lock[^}]*}.*$/d' "$file"
  sed -i '/^import.*lucide-react.*{[^}]*Layers[^}]*}.*$/d' "$file"
  
  # Remove individual unused imports from import lines
  sed -i 's/,\s*Target\s*//g' "$file"
  sed -i 's/\s*Target\s*,//g' "$file"
  sed -i 's/{Target}/{}/' "$file"
  sed -i 's/,\s*TreePine\s*//g' "$file"
  sed -i 's/\s*TreePine\s*,//g' "$file"
  sed -i 's/{TreePine}/{}/' "$file"
  
  # Clean up empty imports
  sed -i '/^import.*{.*}.*from.*$/s/{[[:space:]]*}/{}/g' "$file"
  sed -i '/^import.*{}.*$/d' "$file"
done

# Fix process.env access patterns
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i "s/process\.env\.NEXT_PUBLIC_SUPABASE_URL/process.env['NEXT_PUBLIC_SUPABASE_URL']/g"
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i "s/process\.env\.SUPABASE_SERVICE_ROLE_KEY/process.env['SUPABASE_SERVICE_ROLE_KEY']/g"
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i "s/process\.env\.OPENAI_API_KEY/process.env['OPENAI_API_KEY']/g"
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i "s/process\.env\.NODE_ENV/process.env['NODE_ENV']/g"

# Fix common unused variable patterns
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/for (const \[key, value\] of/for (const [key, _] of/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/function.*([^)]*key[^)]*,[^)]*value[^)]*)/function(...args) { const [key] = args;/g'

echo "Common error fixes completed!"