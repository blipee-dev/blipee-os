#!/bin/bash
echo "=== DETAILED API AUDIT ==="
echo ""
echo "Total sustainability API routes:"
find src/app/api/sustainability -name "route.ts" -type f | wc -l

echo ""
echo "APIs WITH reduce() calls:"
find src/app/api/sustainability -name "route.ts" -type f -exec grep -l "reduce(" {} \; | wc -l

echo ""
echo "APIs WITH @deprecated (already updated):"
find src/app/api/sustainability -name "route.ts" -type f -exec grep -l "@deprecated" {} \; | wc -l

echo ""
echo "=== BREAKDOWN BY CATEGORY ==="
echo ""
echo "All 32 APIs:"
find src/app/api/sustainability -name "route.ts" -type f | sed 's|src/app/api/sustainability/||' | sed 's|/route.ts||' | sort -n
