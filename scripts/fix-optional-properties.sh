#!/bin/bash

echo "Fixing exactOptionalPropertyTypes violations..."

# The main issue is with properties that are `Type | undefined` being assigned to `Type`
# We need to add proper undefined checks or use non-null assertion where appropriate

# Fix common patterns in chat route
sed -i 's/components: UIComponent\[\] | undefined/components: UIComponent[] | undefined/g' src/app/api/ai/chat/route.ts
sed -i 's/actions: any\[\] | undefined/actions: any[] | undefined/g' src/app/api/ai/chat/route.ts

# Fix webhook event publisher actor issues - ensure actor is never undefined
find src/lib/webhooks -name "*.ts" | xargs sed -i 's/actor: { \.\.\. } | undefined/actor: { ... }/g'

# Add specific fixes for known problematic files
cat > /tmp/chat_fixes.js << 'EOF'
const fs = require('fs');
const path = 'src/app/api/ai/chat/route.ts';

if (fs.existsSync(path)) {
  let content = fs.readFileSync(path, 'utf8');
  
  // Fix the specific error on line 362
  content = content.replace(
    /components: response\.components,/g,
    'components: response.components || [],'
  );
  
  // Fix the specific error on line 461
  content = content.replace(
    /components: UIComponent\[\] \| undefined/g,
    'components: UIComponent[]'
  );
  
  fs.writeFileSync(path, content);
  console.log('Fixed chat route optional properties');
}
EOF

node /tmp/chat_fixes.js

# Fix webhook event publisher files
find src/lib/webhooks -name "*.ts" -exec sed -i 's/actor: .* | undefined/actor: actor || { type: "system", id: "unknown" }/g' {} \;

# Fix common undefined assignment patterns
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/: \([^|]*\) | undefined = \([^;]*\);/: \1 = \2 || undefined;/g'

echo "Optional properties fixes completed!"