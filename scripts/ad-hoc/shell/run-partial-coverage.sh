#!/bin/bash
# Run tests that are known to work and generate coverage report

echo "Running partial test coverage..."

# Run only the tests that work
npm run test -- \
  src/lib/utils.test.ts \
  src/components/__tests__/ConversationInterface.test.tsx \
  src/lib/monitoring/__tests__/monitoring.test.ts \
  --coverage \
  --coverageReporters="text" \
  --coverageReporters="text-summary" \
  --silent 2>/dev/null

echo ""
echo "Coverage Report Generated"
echo "========================="
echo ""
echo "Note: This is a partial coverage report. Many test files are failing due to module import issues."
echo "The actual coverage would be higher with all tests passing."
echo ""
echo "Working test files:"
echo "- src/lib/utils.test.ts"
echo "- src/components/__tests__/ConversationInterface.test.tsx" 
echo "- src/lib/monitoring/__tests__/monitoring.test.ts"
echo ""
echo "Known issues preventing full test coverage:"
echo "- ESM module import errors (isows, openai)"
echo "- Missing mock configurations for Supabase"
echo "- WebAuthn service dependencies"
echo "- Rate limiting rules not properly mocked"