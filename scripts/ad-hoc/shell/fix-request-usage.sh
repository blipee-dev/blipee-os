#!/bin/bash

echo "🔧 FIXING request vs _request USAGE"
echo "================================="

# First, let's find which files actually USE the request parameter
echo "Analyzing request parameter usage..."

# For files that actually use request in the body, keep it as 'request'
# For files that don't use it, change to '_request'

# Function to check if request is used in a file
check_request_usage() {
    local file="$1"
    if grep -q "request\." "$file" || grep -q "await.*request" "$file" || grep -q "request)" "$file" || grep -q "request," "$file"; then
        # Request is used - keep as 'request'
        return 0
    else
        # Request is not used - should be '_request'
        return 1
    fi
}

# Process each API route file
for file in $(find src/app/api -name "*.ts" -type f); do
    if [[ -f "$file" ]]; then
        # Check if this file has a function parameter called 'request'
        if grep -q "function.*request: NextRequest" "$file" || grep -q "async function.*request: NextRequest" "$file"; then
            if check_request_usage "$file"; then
                echo "✓ $file - using request (parameter is used)"
            else
                echo "→ $file - changing to _request (parameter unused)"
                sed -i '' 's/function \([A-Za-z]*\)(request: NextRequest/function \1(_request: NextRequest/g' "$file" 2>/dev/null
                sed -i '' 's/async function \([A-Za-z]*\)(request: NextRequest/async function \1(_request: NextRequest/g' "$file" 2>/dev/null
            fi
        fi
    fi
done

echo "✅ Fixed request vs _request usage based on actual usage"
