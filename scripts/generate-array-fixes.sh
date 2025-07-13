#!/bin/bash

# Script to generate specific fixes for empty array initializations

echo "=== Generating Specific Fixes for Empty Arrays ==="
echo ""

# Create fix file
FIX_FILE="/tmp/array-fixes/proposed_fixes.md"
cat > "$FIX_FILE" << 'EOF'
# Proposed Fixes for Empty Array Initializations

This document contains specific fixes for the empty array initializations found in the autonomous agents files.

## Overview

We found 864 empty array initializations that fall into these categories:
- Direct assignments that need type annotations (180 instances)
- Return statements that may need type checking (41 instances)
- Default parameters that might need review (142 instances)

## Priority Fixes

### 1. Direct Empty Array Assignments

These are the most critical as they can cause TypeScript inference issues.

EOF

# Analyze direct assignments and generate fixes
echo "1. Analyzing direct assignments..."
cat /tmp/array-fixes/direct_assignments.txt | while IFS=: read -r file line_num content; do
    # Extract the property name
    property_name=$(echo "$content" | grep -oE "[a-zA-Z_][a-zA-Z0-9_]*\s*:\s*\[\]" | cut -d: -f1 | tr -d ' ')
    
    # Try to determine likely type based on property name
    case "$property_name" in
        *actions*)
            suggested_type="Action[]"
            ;;
        *metrics*)
            suggested_type="Metric[]"
            ;;
        *insights*)
            suggested_type="string[]"
            ;;
        *steps*)
            suggested_type="Step[]"
            ;;
        *data*)
            suggested_type="any[]"
            ;;
        *ids*)
            suggested_type="string[]"
            ;;
        *results*)
            suggested_type="Result[]"
            ;;
        *dependencies*)
            suggested_type="string[]"
            ;;
        *)
            suggested_type="unknown[]"
            ;;
    esac
    
    # Only output first 10 examples
    if [ ${#property_name} -gt 0 ] && [ $(grep -n "$property_name" "$FIX_FILE" | wc -l) -lt 10 ]; then
        cat >> "$FIX_FILE" << EOF

#### File: $(basename "$file"), Line: $line_num
**Current:** \`$property_name: []\`
**Suggested:** \`$property_name: [] as $suggested_type\`
**Context:** Direct assignment needs explicit type annotation

EOF
    fi
done

# Analyze return statements
echo "2. Analyzing return statements..."
cat >> "$FIX_FILE" << 'EOF'

### 2. Return Statement Fixes

These return statements need to match their function's declared return type.

EOF

cat /tmp/array-fixes/return_statements.txt | head -5 | while IFS=: read -r file line_num content; do
    cat >> "$FIX_FILE" << EOF

#### File: $(basename "$file"), Line: $line_num
**Current:** \`return []\`
**Action Required:** Check function return type and ensure consistency
**Possible fixes:**
- If function returns \`T[]\`: Keep as is
- If function returns \`T[] | null\`: Consider \`return null\` for empty case
- If function returns specific type: Add type assertion \`return [] as SpecificType[]\`

EOF
done

# Create automated fix script
echo ""
echo "3. Creating automated fix script..."
cat > /tmp/array-fixes/apply-fixes.ts << 'EOF'
#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';

// Type mappings based on common patterns
const typeMapping: Record<string, string> = {
  'actions': 'ExecutedAction[]',
  'insights': 'string[]',
  'metrics': 'Metric[]',
  'dependencies': 'string[]',
  'steps': 'Step[]',
  'tasks': 'Task[]',
  'learnings': 'Learning[]',
  'conditions': 'string[]',
  'rules': 'Rule[]',
  'capabilities': 'AgentCapability[]',
  'permissions': 'string[]',
  'data': 'any[]',
  'results': 'Result[]',
  'errors': 'Error[]',
  'warnings': 'string[]',
  'recommendations': 'string[]'
};

function getSuggestedType(propertyName: string): string {
  // Check exact matches first
  if (typeMapping[propertyName]) {
    return typeMapping[propertyName];
  }
  
  // Check if property ends with any known pattern
  for (const [pattern, type] of Object.entries(typeMapping)) {
    if (propertyName.endsWith(pattern)) {
      return type;
    }
  }
  
  // Default fallback
  return 'unknown[]';
}

// This is a template for automated fixes
// In practice, you would need to parse the AST and apply transformations
console.log('Automated fix script template created.');
console.log('To apply fixes, you would need to:');
console.log('1. Parse TypeScript AST');
console.log('2. Find empty array literals');
console.log('3. Add appropriate type assertions');
console.log('4. Write back the modified code');

EOF

# Generate final recommendations
echo ""
echo "4. Generating final recommendations..."
cat >> "$FIX_FILE" << 'EOF'

## Automated Fix Strategy

### Step 1: Type Inference Rules

Based on property naming patterns, we can infer likely types:
- `*actions` → `ExecutedAction[]`
- `*insights` → `string[]`
- `*metrics` → `Metric[]`
- `*dependencies` → `string[]`
- `*data` → Consider specific data type or `any[]` temporarily

### Step 2: Safe Fix Application

For each empty array:
1. Check if it's in a type declaration (no fix needed)
2. Check if it's a direct assignment (add type assertion)
3. Check if it's a return statement (verify function signature)
4. Check if it's a default parameter (review if empty is appropriate)

### Step 3: Verification

After applying fixes:
1. Run TypeScript compiler: `npx tsc --noEmit`
2. Run tests to ensure no runtime behavior changed
3. Review any remaining type errors

## Manual Review Required

Some cases require manual review:
1. Complex generic types
2. Union types where empty array might not be valid
3. Functions with overloaded signatures
4. Cases where empty array indicates a code smell

## Next Steps

1. Review the proposed fixes in this document
2. Apply fixes file by file, starting with the most critical
3. Run type checking after each file
4. Update tests if needed
EOF

echo ""
echo "=== Fix Generation Complete ==="
echo ""
echo "Generated files:"
echo "  - Proposed fixes: $FIX_FILE"
echo "  - Fix script template: /tmp/array-fixes/apply-fixes.ts"
echo ""
echo "Review the proposed fixes before applying them."