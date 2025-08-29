# TypeScript Error Patterns & Solutions

**Generated**: 2025-08-29  
**Progress**: Started fixing systematic errors

## Common Error Patterns Found

### 1. **SecurityAuditLog Import Issues**
**Pattern**: `import { SecurityAuditLog } from '@/lib/security/audit-logger';`  
**Issue**: `SecurityAuditLog` is an interface, not a class  
**Solution**: Use `securityAuditLogger` instance instead  

**Fix**:
```typescript
// BEFORE (❌ Error)
import { SecurityAuditLog } from '@/lib/security/audit-logger';
await SecurityAuditLog.log({ ... });

// AFTER (✅ Fixed)  
import { securityAuditLogger } from '@/lib/security/audit-logger';
await securityAuditLogger.log({ ... });
```

**Files Fixed**: 
- `src/app/api/ai/stream/route.ts` 
- `src/app/api/database/optimize/route.ts`
- `src/app/api/database/health/route.ts`

### 2. **SecurityEventType Enum Issues**
**Pattern**: Using string literals instead of enum values  
**Issue**: `eventType: 'AI_STREAM_STARTED'` instead of `SecurityEventType.AI_STREAM_STARTED`  
**Solution**: Import enum and use proper values, add missing enum values  

**Fix**:
```typescript
// BEFORE (❌ Error)
import { securityAuditLogger } from '@/lib/security/audit-logger';
await securityAuditLogger.log({
  eventType: 'AI_STREAM_STARTED', // string literal
});

// AFTER (✅ Fixed)  
import { securityAuditLogger, SecurityEventType } from '@/lib/security/audit-logger';
await securityAuditLogger.log({
  eventType: SecurityEventType.AI_STREAM_STARTED, // enum value
});
```

**Files Fixed**:
- `src/app/api/ai/stream/route.ts`
- `src/app/api/database/health/route.ts` 
- Added missing enum values in `src/lib/security/audit-logger.ts`

### 3. **Missing Required Properties in Audit Logs**
**Pattern**: Missing `eventType` and `result` properties  
**Issue**: Security audit log interface requires these properties  
**Solution**: Add missing required properties  

**Fix**:
```typescript
// BEFORE (❌ Error)
await securityAuditLogger.log({
  userId: user.id,
  action: 'database_optimization',
  // missing eventType and result
});

// AFTER (✅ Fixed)  
await securityAuditLogger.log({
  eventType: SecurityEventType.DATABASE_REPAIR,
  userId: user.id,
  action: 'database_optimization',
  result: 'success', // required property
});
```

**Files Fixed**:
- `src/app/api/database/optimize/route.ts` (3 instances)

### 4. **Unused Variable Declarations**
**Pattern**: Variables declared but never used  
**Issue**: `noUnusedLocals: true` in tsconfig catches these  
**Solution**: Remove unused destructuring or use the variables  

**Fix**:
```typescript
// BEFORE (❌ Error)
const { sessionId, stream } = await streamingService.createStreamingSession();
const encoder = new TextEncoder(); // never used

// AFTER (✅ Fixed)
const { sessionId } = await streamingService.createStreamingSession();  
// encoder removed since it wasn't needed
```

**Files Fixed**:
- `src/app/api/ai/stream/route.ts`

### 3. **Destructured Error Variable Naming**
**Pattern**: `const { error: _error }` then referencing `error`  
**Issue**: Variable renamed but old name still used  
**Solution**: Use consistent naming  

**Fix**:
```typescript
// BEFORE (❌ Error)
const { error: _error } = await supabase.from(...);
if (error) { ... } // error is undefined

// AFTER (✅ Fixed)
const { error } = await supabase.from(...);
if (error) { ... } // now works correctly
```

**Files Fixed**:
- `src/lib/onboarding/service.ts`
- `src/lib/auth/sso/service.ts` (unused import)

### 5. **ExactOptionalPropertyTypes Issues**
**Pattern**: `string | undefined` vs `string` for optional properties  
**Issue**: `exactOptionalPropertyTypes: true` requires explicit undefined  
**Solution**: Use nullish coalescing to convert properly  

**Fix**:
```typescript
// BEFORE (❌ Error)
const options = {
  tables: params.tables, // string[] | undefined
  userAgent: request.headers.get('user-agent'), // string | null
};

// AFTER (✅ Fixed)  
const options = {
  tables: params.tables ?? undefined, // string[] | undefined
  userAgent: request.headers.get('user-agent') || undefined, // string | undefined
};
```

**Files Fixed**:
- `src/app/api/backup/route.ts`
- `src/middleware.ts`

### 6. **Database vs Interface Type Mismatches**
**Pattern**: Database returns different types than TypeScript interfaces  
**Issue**: DB returns `string | null` but interface expects `string`  
**Solution**: Transform data or use type assertions  

**Fix**:
```typescript
// BEFORE (❌ Error)
return endpoint; // has description: string | null

// AFTER (✅ Fixed)  
return {
  ...endpoint,
  description: endpoint.description || undefined
};
```

**Files Fixed**:
- `src/lib/webhooks/webhook-service.ts` (3 instances)
- `src/app/api/auth/sso/logout/route.ts` (type assertion)

### 7. **Environment Variable Access**
**Pattern**: `process.env.VARIABLE` with index signature  
**Issue**: TypeScript requires bracket notation for index signatures  
**Solution**: Use `process.env['VARIABLE']`  

**Fix**:
```typescript
// BEFORE (❌ Error)
const key = process.env.ENCRYPTION_KEY;

// AFTER (✅ Fixed)  
const key = process.env['ENCRYPTION_KEY'];
```

**Files Fixed**:
- `src/lib/auth/sso/service.ts`

## Error Categories by Impact

### High Impact (Many files affected)
1. **AI Service Type Mismatches**: 1,837 errors
2. **Database Query Type Issues**: Interface/implementation gaps
3. **Component Prop Type Mismatches**: React component interfaces

### Medium Impact (Specific modules)
4. **SSO Configuration Type Issues**: Enum mismatches
5. **Webhook Service Type Problems**: Null vs undefined issues  
6. **File Upload Table Missing**: `uploaded_files` not in generated types

### Low Impact (Easy fixes)
7. **Import/Export Issues**: Wrong imports, unused variables
8. **Audit Logger Pattern**: Consistent across multiple files

## Next Priority Files

Based on error density:
1. `src/lib/onboarding/service.ts` (69 errors) ✅ Started
2. `src/lib/auth/sso/service.ts` (63 errors) 
3. `src/lib/auth/webauthn/service.ts` (61 errors)
4. `src/lib/auth/recovery/service.ts` (55 errors)
5. `src/lib/ai/ml-models/emissions-predictor.ts` (54 errors)

## Systematic Approach

### Phase 1: Quick Wins (In Progress)
- Fix import/export issues
- Fix unused variable issues  
- Fix audit logger pattern
- **Target**: 200+ easy errors

### Phase 2: Type Interface Fixes  
- Database type mismatches
- Component prop interfaces
- API response types

### Phase 3: Complex Type Issues
- Generic type constraints
- Union type resolutions
- Conditional type fixes

## Progress Tracking

**Started**: 2025-08-29  
**Completed Fixes**: ~10 errors  
**Files Modified**: 3
**Patterns Identified**: 3 major patterns  
**Estimated**: ~200 similar SecurityAuditLog errors across codebase