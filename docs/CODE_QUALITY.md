# Code Quality Standards

## Pre-commit Checks

All code must pass the following checks before being committed:

### 1. TypeScript Check ✅
```bash
npm run type-check
```
- Strict mode enabled
- No implicit any
- No unused variables
- Proper type definitions

### 2. ESLint Check ✅
```bash
npm run lint
```
- React hooks rules enforced
- Next.js best practices
- No console.log in production code
- Consistent code style

### 3. Security Tests ✅
When security files are modified:
```bash
npm run test:security:all
```

## Running All Checks

Before committing, run:
```bash
npm run precommit
```

## Automated Pre-commit Hook

We use Husky for automated pre-commit checks. The hook will:
1. Run TypeScript check
2. Run ESLint
3. Run security tests (if security files changed)

To bypass in emergencies (not recommended):
```bash
git commit --no-verify
```

## Common Issues and Fixes

### TypeScript Errors
- **Property does not exist**: Check type definitions
- **Type 'never'**: Usually indicates Supabase types need regeneration
- **Strict optional properties**: Use conditional spreading

### ESLint Errors
- **React hooks rules**: Hooks must be at component top level
- **Missing dependencies**: Add to dependency array or use useCallback
- **No anonymous exports**: Name your exports

### Security Test Failures
- Ensure CSRF tokens are included in all mutations
- Check XSS sanitization is applied
- Verify security headers are set

## Best Practices

1. **Always run checks locally** before pushing
2. **Fix warnings** not just errors
3. **Keep dependencies updated** regularly
4. **Document type definitions** for complex types
5. **Use strict TypeScript** settings

## Ignoring Rules

Only ignore rules when absolutely necessary:

```typescript
// eslint-disable-next-line react-hooks/exhaustive-deps
```

```typescript
// @ts-ignore - Temporary fix for third-party type issue
```

Always include a comment explaining why.