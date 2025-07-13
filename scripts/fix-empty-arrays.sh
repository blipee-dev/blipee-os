#!/bin/bash

# Script to find and fix empty array initializations in autonomous agents files

echo "=== Finding Empty Array Initializations in Autonomous Agents ==="

# Create output directory for analysis
mkdir -p /tmp/array-fixes

# Find all empty array patterns
echo "1. Finding all empty array patterns..."
grep -n "\[\]" src/lib/ai/autonomous-agents/*.ts | grep -v "as any\[\]" | grep -v "__tests__" > /tmp/array-fixes/all_empty_arrays.txt

# Count total occurrences
TOTAL=$(wc -l < /tmp/array-fixes/all_empty_arrays.txt)
echo "   Found $TOTAL empty array initializations"

# Categorize by pattern
echo ""
echo "2. Categorizing patterns..."

# Property declarations (e.g., property: Type[])
echo "   a) Property declarations:"
grep -E ":\s*[A-Za-z]+\[\]" /tmp/array-fixes/all_empty_arrays.txt > /tmp/array-fixes/property_declarations.txt
PROP_COUNT=$(wc -l < /tmp/array-fixes/property_declarations.txt)
echo "      Found $PROP_COUNT property declarations"

# Direct assignments (e.g., property: [])
echo "   b) Direct empty array assignments:"
grep -E ":\s*\[\]" /tmp/array-fixes/all_empty_arrays.txt > /tmp/array-fixes/direct_assignments.txt
DIRECT_COUNT=$(wc -l < /tmp/array-fixes/direct_assignments.txt)
echo "      Found $DIRECT_COUNT direct assignments"

# Return statements (e.g., return [])
echo "   c) Return statements:"
grep -E "return\s*\[\]" /tmp/array-fixes/all_empty_arrays.txt > /tmp/array-fixes/return_statements.txt
RETURN_COUNT=$(wc -l < /tmp/array-fixes/return_statements.txt)
echo "      Found $RETURN_COUNT return statements"

# Default parameters (e.g., = [])
echo "   d) Default parameters:"
grep -E "=\s*\[\]" /tmp/array-fixes/all_empty_arrays.txt | grep -v ":\s*\[\]" > /tmp/array-fixes/default_parameters.txt
DEFAULT_COUNT=$(wc -l < /tmp/array-fixes/default_parameters.txt)
echo "      Found $DEFAULT_COUNT default parameters"

# Array method calls (e.g., .filter(), .map())
echo "   e) Array method calls:"
grep -E "\.(filter|map|reduce|flatMap|concat)\(" /tmp/array-fixes/all_empty_arrays.txt > /tmp/array-fixes/array_methods.txt
METHOD_COUNT=$(wc -l < /tmp/array-fixes/array_methods.txt)
echo "      Found $METHOD_COUNT array method calls"

# Generate fix suggestions
echo ""
echo "3. Generating fix suggestions..."

# Process each file
for file in src/lib/ai/autonomous-agents/*.ts; do
    if [[ -f "$file" && ! "$file" =~ "__tests__" ]]; then
        filename=$(basename "$file")
        echo ""
        echo "   Processing: $filename"
        
        # Count empty arrays in this file
        FILE_COUNT=$(grep -c "\[\]" "$file" 2>/dev/null || echo 0)
        if [ "$FILE_COUNT" -gt 0 ]; then
            echo "   - Found $FILE_COUNT empty arrays"
            
            # Extract type information for better fixes
            grep -n "\[\]" "$file" | while IFS=: read -r line_num line_content; do
                # Try to determine the array type from context
                if echo "$line_content" | grep -q ":\s*[A-Za-z]+\[\]"; then
                    # This is a type declaration, no fix needed
                    continue
                elif echo "$line_content" | grep -q ":\s*\[\]"; then
                    # Direct assignment - need to add type
                    echo "      Line $line_num: Consider adding explicit type annotation"
                elif echo "$line_content" | grep -q "return\s*\[\]"; then
                    # Return statement - check function return type
                    echo "      Line $line_num: Ensure return type matches empty array"
                fi
            done
        fi
    fi
done

# Create summary report
echo ""
echo "4. Creating summary report..."
cat > /tmp/array-fixes/summary.md << EOF
# Empty Array Analysis Report

## Summary
- Total empty arrays found: $TOTAL
- Property declarations: $PROP_COUNT
- Direct assignments: $DIRECT_COUNT
- Return statements: $RETURN_COUNT
- Default parameters: $DEFAULT_COUNT
- Array method calls: $METHOD_COUNT

## Files Analyzed
$(ls src/lib/ai/autonomous-agents/*.ts | grep -v "__tests__" | wc -l) TypeScript files

## Recommendations
1. For direct assignments (\`property: []\`), add explicit type annotations
2. For return statements, ensure they match the function's return type
3. For default parameters, consider if empty array is the right default
4. Review array method chains that might produce empty results

## Next Steps
Run the TypeScript compiler to identify type-related issues:
\`\`\`bash
npx tsc --noEmit --project tsconfig.json
\`\`\`
EOF

echo ""
echo "=== Analysis Complete ==="
echo "Results saved in /tmp/array-fixes/"
echo "Summary report: /tmp/array-fixes/summary.md"
echo ""
echo "To view specific patterns:"
echo "  - Property declarations: cat /tmp/array-fixes/property_declarations.txt"
echo "  - Direct assignments: cat /tmp/array-fixes/direct_assignments.txt"
echo "  - Return statements: cat /tmp/array-fixes/return_statements.txt"
echo "  - Default parameters: cat /tmp/array-fixes/default_parameters.txt"