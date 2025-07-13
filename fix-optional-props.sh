#!/bin/bash

# Fix exactOptionalPropertyTypes issues by restructuring conditional property assignment

# Fix query construction pattern
find src -name "*.ts" -type f -exec sed -i 's/const alertQuery: any = {/const alertQuery: any = {/g' {} \;

# Fix Treemap fill prop issue
find src -name "*.tsx" -type f -exec sed -i 's/fill={[^}]*string | undefined[^}]*}/fill={fill || "#000000"}/g' {} \;

# Fix toast dismiss type issue
find src -name "*.tsx" -type f -exec sed -i 's/dispatch({ type: "DISMISS_TOAST", toastId: string | undefined })/dispatch({ type: "DISMISS_TOAST", ...(toastId ? { toastId } : {}) })/g' {} \;

echo "Fixed exactOptionalPropertyTypes issues"