#!/bin/bash

echo "🚀 AGGRESSIVE REQUEST → _REQUEST FIX"
echo "====================================="
echo ""

# Function to process a single file
process_file() {
    local file="$1"
    
    # Skip if file doesn't exist
    if [ ! -f "$file" ]; then
        return
    fi
    
    # Create backup
    cp "$file" "${file}.bak"
    
    # Apply comprehensive replacements
    # This is more aggressive and handles more edge cases
    
    # Step 1: Fix function signatures
    sed -i '' -E 's/export\s+(async\s+)?function\s+\w+\s*\(\s*request\s*:/export \1function \2(_request:/g' "$file"
    sed -i '' -E 's/\(\s*request\s*:\s*NextRequest/(_request: NextRequest/g' "$file"
    sed -i '' -E 's/async\s*\(\s*request\s*,/async (_request,/g' "$file"
    sed -i '' -E 's/async\s*\(\s*request\s*:/async (_request:/g' "$file"
    
    # Step 2: Fix all request. usages (but not Request class)
    sed -i '' -E 's/([^_])request\.([a-z])/\1_request.\2/g' "$file"
    sed -i '' -E 's/^request\./^_request./g' "$file"
    sed -i '' -E 's/\(request\./(_request./g' "$file"
    sed -i '' -E 's/ request\./ _request./g' "$file"
    sed -i '' -E 's/\{request\./\{_request./g' "$file"
    sed -i '' -E 's/\[request\./\[_request./g' "$file"
    sed -i '' -E 's/!request\./!_request./g' "$file"
    sed -i '' -E 's/\?request\./\?_request./g' "$file"
    
    # Step 3: Fix await patterns
    sed -i '' -E 's/await\s+request([^a-zA-Z])/await _request\1/g' "$file"
    
    # Step 4: Fix new URL patterns
    sed -i '' -E 's/new\s+URL\s*\(\s*request/new URL(_request/g' "$file"
    
    # Step 5: Fix searchParams patterns
    sed -i '' -E 's/const\s*\{\s*searchParams\s*\}\s*=\s*new\s+URL\s*\(\s*request/const { searchParams } = new URL(_request/g' "$file"
    
    # Step 6: Fix destructuring
    sed -i '' -E 's/=\s*request([^a-zA-Z0-9_])/= _request\1/g' "$file"
    
    # Step 7: Fix function calls with request as argument
    sed -i '' -E 's/\(\s*request\s*,/_request,/g' "$file"
    sed -i '' -E 's/\(\s*request\s*\)/(_request)/g' "$file"
    
    # Step 8: Fix specific patterns
    sed -i '' 's/requireAuth(request/requireAuth(_request/g' "$file"
    sed -i '' 's/validateRequest(request/validateRequest(_request/g' "$file"
    sed -i '' 's/getClientIp(request/getClientIp(_request/g' "$file"
    sed -i '' 's/logRequest(request/logRequest(_request/g' "$file"
    
    # Step 9: Clean up any double underscores
    sed -i '' 's/__request/_request/g' "$file"
    
    # Check if changes were made
    if cmp -s "$file" "${file}.bak"; then
        rm "${file}.bak"
        return 0
    else
        rm "${file}.bak"
        echo "✅ Fixed: $file"
        return 1
    fi
}

# Counter
FIXED=0

echo "🔍 Finding all TypeScript files in API routes..."
echo ""

# Process all TypeScript files in src/app/api
for file in $(find src/app/api -type f \( -name "*.ts" -o -name "*.tsx" \) 2>/dev/null); do
    if process_file "$file"; then
        :
    else
        ((FIXED++))
    fi
done

# Also process lib directories that might have API helpers
echo ""
echo "🔍 Checking lib directories..."
for file in $(find src/lib -type f \( -name "*.ts" -o -name "*.tsx" \) 2>/dev/null | xargs grep -l "NextRequest" 2>/dev/null); do
    if process_file "$file"; then
        :
    else
        ((FIXED++))
    fi
done

# Also process middleware
if [ -f "src/middleware.ts" ]; then
    echo ""
    echo "🔍 Checking middleware..."
    if process_file "src/middleware.ts"; then
        :
    else
        ((FIXED++))
    fi
fi

echo ""
echo "📊 RESULTS"
echo "=========="
echo "Total files fixed: $FIXED"
echo ""

# Verify remaining issues
echo "🔍 Scanning for remaining issues..."
echo ""

REMAINING=$(grep -r '\brequest\.' src/app/api --include="*.ts" --include="*.tsx" 2>/dev/null | \
    grep -v '_request\.' | \
    grep -v 'Request\.' | \
    grep -v '//.*request' | \
    grep -v '\* request' | \
    wc -l)

if [ "$REMAINING" -gt 0 ]; then
    echo "⚠️  Found $REMAINING potential remaining issues"
    echo ""
    echo "Top files with remaining 'request' references:"
    grep -r '\brequest\.' src/app/api --include="*.ts" --include="*.tsx" 2>/dev/null | \
        grep -v '_request\.' | \
        grep -v 'Request\.' | \
        grep -v '//.*request' | \
        cut -d: -f1 | sort | uniq -c | sort -rn | head -5
else
    echo "✅ All request references appear to be fixed!"
fi

echo ""
echo "🎯 Run 'npm run type-check' to see the impact!"