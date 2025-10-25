# Documentation Index

This index tracks the current state of the most important documentation sets in the repository.  
Update the **Last Verified** column whenever you confirm the doc’s accuracy or complete a refresh.

| Domain | Primary Doc | Last Verified | Owner | Notes |
| --- | --- | --- | --- | --- |
| Sustainability Intelligence | `docs/SUSTAINABILITY_INTELLIGENCE.md` | 2025-02-14 | TBD | Canonical overview of the agent orchestration layer and public API. |
| Autonomous Agents & Orchestrator | `docs/PRODUCTION_READY_PLAN.md` | 2025-02-14 | TBD | Describes agent lifecycle and integration milestones; use as canonical architecture reference. |
| Targets & Forecast APIs | `docs/TARGETS_AND_FORECAST_APIS.md` | 2025-02-14 | TBD | Details all targets, allocation, and forecasting endpoints. |
| Dashboard Data Flow | `docs/DASHBOARD_DATA_PIPELINE.md` | 2025-02-14 | TBD | Explains React Query hooks, API routes, and caching strategy. |
| Vercel SDK & AI Providers | `VERCEL_SDK_COMPREHENSIVE_GUIDE.md` | 2025-02-14 | TBD | Keep in sync with `src/lib/ai` provider implementations and routing. |
| Sector Intelligence (MCP) | `docs/MCP_ENHANCED_SECTOR_INTELLIGENCE.md` | 2025-02-14 | TBD | Reference for multi-sector materiality models; link from sustainability intelligence doc. |
| Performance Index | `src/lib/ai/performance-scoring/blipee-performance-index.ts` + inline comments | 2025-02-14 | TBD | Primary source of truth lives in code; ensure doc cross-references stay current. |
| Deployment & Ops | `docs/WEEKLY_INTEGRATION_GUIDE.md` + `DEPLOYMENT_CHECKLIST.md` | 2025-02-14 | TBD | Confirm steps reflect latest infrastructure (Supabase, Redis, Vercel). |

## Archive / Consolidate Queue

The following documents reference the deprecated conversational chat experience and should be archived or rewritten around the sustainability intelligence flow.  
Archived files now live under `docs/archive/`.

- `CONVERSATION_CONTINUITY_FIX.md`
- `CONVERSATION_CONTINUITY_SUCCESS.md`
- `STREAMING_CHAT_COMPLETE_FIX.md`
- `STREAMING_CHAT_FIX.md`
- `MOBILE_CHAT_IMPLEMENTATION.md`
- `MOBILE_CHAT_SUCCESS.md`
- `SIMPLECHAT_FIX_COMPLETE.md`
- `TIME_AWARE_CHAT_COMPLETE.md`

Move any useful historical context into the canonical docs above, then delete the redundant files.

## Backlog & Follow-Up

1. Assign an owner to each primary doc (engineering, data, or product lead).  
2. Confirm links between code and docs—each major module should reference its primary doc via README or inline comment.  
3. Add additional domains as they stabilise (e.g., offline ingestion, docling extraction, compliance reporting).  
4. Review this index during the monthly documentation triage and update **Last Verified** dates.
