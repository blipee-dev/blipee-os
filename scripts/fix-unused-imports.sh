#!/bin/bash

echo "Fixing unused imports and variables..."

# Get all TypeScript errors and extract unused import/variable errors
npm run type-check 2>&1 | grep "error TS6133\|error TS6192" | while read -r line; do
    # Extract file path and error details
    file=$(echo "$line" | cut -d'(' -f1)
    error_detail=$(echo "$line" | grep -o "'[^']*' is declared but its value is never read\|All imports in import declaration are unused")
    
    if [[ -f "$file" ]]; then
        if [[ "$error_detail" == "All imports in import declaration are unused" ]]; then
            # Get line number
            line_num=$(echo "$line" | grep -o '([0-9]*,' | tr -d '(,')
            if [[ -n "$line_num" ]]; then
                # Comment out the entire import line
                sed -i "${line_num}s/^/\/\/ /" "$file"
                echo "Commented out unused import in $file:$line_num"
            fi
        else
            # Extract variable name
            var_name=$(echo "$error_detail" | grep -o "'[^']*'" | tr -d "'")
            if [[ -n "$var_name" ]]; then
                # Remove unused import from import statement
                sed -i "s/, *$var_name//g" "$file"
                sed -i "s/$var_name, *//g" "$file"
                sed -i "s/{ *$var_name *}/{ }/g" "$file"
                sed -i "s/import { } from/\/\/ import { } from/g" "$file"
                echo "Removed unused import '$var_name' from $file"
            fi
        fi
    fi
done

# Clean up empty import statements
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i '/^import { } from/d'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i '/^\/\/ import { } from/d'

echo "Unused imports cleanup completed!"