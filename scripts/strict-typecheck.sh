#!/bin/bash

echo "🔍 Running strict TypeScript check..."

# Run TypeScript compiler with the strictest possible settings
npx tsc --noEmit \
  --strict \
  --noImplicitAny \
  --noImplicitThis \
  --alwaysStrict \
  --strictNullChecks \
  --strictFunctionTypes \
  --strictPropertyInitialization \
  --strictBindCallApply \
  --noUnusedLocals \
  --noUnusedParameters \
  --noImplicitReturns \
  --noFallthroughCasesInSwitch \
  --noUncheckedIndexedAccess \
  --noImplicitOverride \
  --noPropertyAccessFromIndexSignature \
  --exactOptionalPropertyTypes \
  --useUnknownInCatchVariables \
  --forceConsistentCasingInFileNames \
  --esModuleInterop \
  --skipLibCheck \
  --isolatedModules

if [ $? -eq 0 ]; then
  echo "✅ Strict type check passed!"
else
  echo "❌ Strict type check failed. Fix the errors above before pushing."
  exit 1
fi