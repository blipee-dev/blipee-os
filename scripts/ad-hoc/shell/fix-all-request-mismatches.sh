#!/bin/bash

echo "🔧 FIXING ALL REQUEST PARAMETER MISMATCHES"
echo "========================================="

# Find all files with request parameter mismatches
find src -name "*.ts" -type f | while read file; do
    # Check if file has _request parameter but uses request in body
    if grep -q "_request: NextRequest" "$file" && (grep -q "request\." "$file" || grep -q "await.*request" "$file" || grep -q "request)" "$file" || grep -q "request," "$file"); then
        echo "Fixing $file - changing _request to request"
        sed -i '' 's/(_request: NextRequest)/(request: NextRequest)/g' "$file" 2>/dev/null
        sed -i '' 's/(request: NextRequest, _request: NextRequest)/(request: NextRequest)/g' "$file" 2>/dev/null
    fi
    
    # Check if file has request parameter but never uses it (should be _request)
    if grep -q "request: NextRequest" "$file" && ! (grep -q "request\." "$file" || grep -q "await.*request" "$file" || grep -q "request)" "$file" || grep -q "request," "$file"); then
        echo "Fixing $file - changing unused request to _request"
        sed -i '' 's/(request: NextRequest)/(_request: NextRequest)/g' "$file" 2>/dev/null
    fi
done

echo "✅ Fixed all request parameter mismatches"
