#!/bin/bash

echo "Fixing webhook syntax errors..."

# Fix import paths
find src/lib/webhooks -name "*.ts" | xargs sed -i "s/'!\/event-publisher'/'\.\/event-publisher'/g"

# Fix method chains with exclamation marks to dots
find src/lib/webhooks -name "*.ts" | xargs sed -i 's/!select(/\.select(/g'
find src/lib/webhooks -name "*.ts" | xargs sed -i 's/!insert(/\.insert(/g'
find src/lib/webhooks -name "*.ts" | xargs sed -i 's/!update(/\.update(/g'
find src/lib/webhooks -name "*.ts" | xargs sed -i 's/!delete(/\.delete(/g'
find src/lib/webhooks -name "*.ts" | xargs sed -i 's/!eq(/\.eq(/g'
find src/lib/webhooks -name "*.ts" | xargs sed -i 's/!neq(/\.neq(/g'
find src/lib/webhooks -name "*.ts" | xargs sed -i 's/!not(/\.not(/g'
find src/lib/webhooks -name "*.ts" | xargs sed -i 's/!lte(/\.lte(/g'
find src/lib/webhooks -name "*.ts" | xargs sed -i 's/!limit(/\.limit(/g'
find src/lib/webhooks -name "*.ts" | xargs sed -i 's/!order(/\.order(/g'
find src/lib/webhooks -name "*.ts" | xargs sed -i 's/!single(/\.single(/g'
find src/lib/webhooks -name "*.ts" | xargs sed -i 's/!createHmac(/\.createHmac(/g'
find src/lib/webhooks -name "*.ts" | xargs sed -i 's/!update(/\.update(/g'
find src/lib/webhooks -name "*.ts" | xargs sed -i 's/!digest(/\.digest(/g'

# Fix array methods
find src/lib/webhooks -name "*.ts" | xargs sed -i 's/!\[.*\]includes/\.includes/g'

# Fix optional chaining errors
find src/lib/webhooks -name "*.ts" | xargs sed -i 's/?!message/?.message/g'
find src/lib/webhooks -name "*.ts" | xargs sed -i 's/?!length/?.length/g'
find src/lib/webhooks -name "*.ts" | xargs sed -i 's/?!filter/?.filter/g'
find src/lib/webhooks -name "*.ts" | xargs sed -i 's/?!slice/?.slice/g'

# Fix specific patterns in webhooks
find src/lib/webhooks -name "*.ts" | xargs sed -i 's/endpoints?length/endpoints?.length/g'
find src/lib/webhooks -name "*.ts" | xargs sed -i 's/endpoints?filter/endpoints?.filter/g'
find src/lib/webhooks -name "*.ts" | xargs sed -i 's/deliveryStats?/deliveryStats?./g'
find src/lib/webhooks -name "*.ts" | xargs sed -i 's/delivery?attempt_number/delivery?.attempt_number/g'

# Fix regex patterns
find src/lib/webhooks -name "*.ts" | xargs sed -i 's/172\\!(1\[6-9\]|2\[0-9\]|3\[01\])\\!/172\\.(1[6-9]|2[0-9]|3[01])\\./g'

echo "Webhook syntax fixes completed!"