#!/bin/bash

echo "🔧 FIXING ERROR REFERENCE ISSUES"
echo "==============================="

# Fix cases where catch uses _error but then references error
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's/} catch (_error.*{[^}]*if.*error\./} catch (error/g' 2>/dev/null
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's/} catch (_error.*{[^}]*error\./} catch (error/g' 2>/dev/null

# Fix specific patterns
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's/&& error\.message/\&\& _error.message/g' 2>/dev/null
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's/error\.message/.message/g' 2>/dev/null

echo "✅ Fixed error reference issues"
