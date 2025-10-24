# 🎭 Playwright MCP Testing Guide - Semantic Cache

## ✅ Database Verification (COMPLETE)

**Test Results**:
- ✅ `get_sustainability_schema()` - Working (4 GRI standards, 4 SQL patterns)
- ✅ `query_cache` table - Created with pgvector embeddings
- ✅ Cache statistics - Ready (0 queries - fresh install)

---

## 🧪 Manual Test with Playwright MCP

### Prerequisites
```bash
npm run dev  # Start server on http://localhost:3000
```

### Test 1: First Query (NOT Cached)
**Query**: "What are my Scope 2 emissions this year?"
**Expected**: 1-2 seconds, cached: false

### Test 2: Similar Query (SHOULD Be Cached)
**Query**: "Show me Scope 2 emissions for this year"
**Expected**: <100ms, cached: true, similarity >0.85

### Verify in Database
```sql
SELECT question_text, hit_count, created_at, last_used_at
FROM query_cache ORDER BY created_at DESC LIMIT 1;
```

---

## 🎯 Automated Test
```bash
npx playwright test tests/semantic-cache-e2e.spec.ts --headed
```

**Success Criteria**:
- First query: 1-2s response time
- Cached query: <100ms response time
- Cache hit rate: >50% after 10 queries
- Cost savings: 90% on cached queries

---

**Status**: ✅ Database ready, awaiting live server tests
