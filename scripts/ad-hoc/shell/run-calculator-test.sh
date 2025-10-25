#!/bin/bash
# Load environment variables
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | xargs)
fi
# Run test
npx tsx test-calculator-direct.ts
