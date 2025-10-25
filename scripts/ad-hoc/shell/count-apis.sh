#!/bin/bash
echo "📊 Counting all sustainability APIs..."
echo ""
total=$(find src/app/api/sustainability -name "route.ts" -type f | wc -l)
echo "Total APIs found: $total"
echo ""
echo "APIs with reduce() calls:"
grep -l "reduce(" src/app/api/sustainability/**/route.ts 2>/dev/null | wc -l
echo ""
echo "Listing all API routes:"
find src/app/api/sustainability -name "route.ts" -type f | sed 's|src/app/api/sustainability/||' | sed 's|/route.ts||' | sort
