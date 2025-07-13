#!/bin/bash

echo "Fixing syntax errors..."

# Fix incorrect periods after array declarations []
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/\[\]\./[]/g'

# Fix incorrect periods after types
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/string\[\]\./string[]/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/any\[\]\./any[]/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/File\[\]\./File[]/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/AgentTask\[\]\./AgentTask[]/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/SupplierAssessment\[\]\./SupplierAssessment[]/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/SupplyChainRisk\[\]\./SupplyChainRisk[]/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/SupplyChainOpportunity\[\]\./SupplyChainOpportunity[]/g'

# Fix double periods in various places
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/\.\././g'

# Fix map/array destructuring errors
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/\[key, value\]\./[key, value]/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/\[code, count\]\./[code, count]/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/\[key, data\]\./[key, data]/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/\[timestamp, data\]\./[timestamp, data]/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/\[method, ...pathParts\]\./[method, ...pathParts]/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/\[site, siteData\]\./[site, siteData]/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/\[metric, change\]\./[metric, change]/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/\[scope, value\]\./[scope, value]/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/, value\]\./[key, value]/g'

# Fix type declarations with periods
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/: \[number, number\]\./: [number, number]/g'

# Fix message arrays
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/messages: \[\]/messages: []/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/]\.,/],/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/}\.,/},/g'

# Fix property access after arrays
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/expectedBytes\[i\]\./expectedBytes[i]/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/buffer\[i\]\./buffer[i]/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/patterns\.energy\[month - 1\]\./patterns.energy[month - 1]/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/recoveryData\[0\]\./recoveryData[0]/g'

# Fix optional chaining after split
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/\.split("@")\[1\]\./.split("@")[1]/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/\.split("@")\[0\]\./.split("@")[0]/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i "s/\.split('T')\[0\]\./.split('T')[0]/g"

# Fix process.env with period
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i "s/process\.env\['NEXT_PUBLIC_SUPABASE_URL'\]\./process.env['NEXT_PUBLIC_SUPABASE_URL']/g"
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i "s/process\.env\['SUPABASE_SERVICE_ROLE_KEY'\]\./process.env['SUPABASE_SERVICE_ROLE_KEY']/g"
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i "s/process\.env\['OPENAI_API_KEY'\]\./process.env['OPENAI_API_KEY']/g"
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i "s/process\.env\['NODE_ENV'\]\./process.env['NODE_ENV']/g"
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i "s/process\.env\['NEXT_PUBLIC_APP_URL'\]\./process.env['NEXT_PUBLIC_APP_URL']/g"

# Fix enum arrays
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i "s/\['totp'\]\./['totp']/g"

# Fix validation session access
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i "s/validation\.session\?\./validation.session?/g"

# Fix result object access
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i "s/result\?\./result?/g"
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i "s/ssoConfig\?\./ssoConfig?/g"
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i "s/data\.metrics\?\./data.metrics?/g"
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i "s/result\.metadata\?\./result.metadata?/g"

# Fix not operator
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/\./!/g'

# Fix optional field access
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/usageData\?\./usageData?/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/error\?\./error?/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/quotaData\?\./quotaData?/g'

# Fix files array access
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/files\[0\]\./files[0]/g'

echo "Syntax error fixes completed!"