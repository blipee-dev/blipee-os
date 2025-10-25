# Sustainability Intelligence Layer

This document explains how the Sustainability Intelligence layer enriches dashboards with autonomous agent output.  
It covers the API surface, execution flow, caching, and practical verification steps.

---

## 1. Purpose

- Convert raw sustainability data into actionable insights, recommendations, and alerts.  
- Run the 8 autonomous agents in parallel and tailor their output to a specific dashboard context.  
- Provide a single API for the UI to request intelligence with consistent latency and error handling.

---

## 2. Key Files

| Path | Responsibility |
| --- | --- |
| `src/app/api/sustainability/intelligence/route.ts` | HTTP handlers (`POST`, `GET`, `DELETE`) securing the API, resolving the organization, and delegating to the service. |
| `src/lib/ai/sustainability-intelligence.ts` | Core orchestration service. Handles agent selection, caching, result transformation, and metrics. |
| `src/lib/ai/autonomous-agents/*` | Individual agent implementations (Carbon Hunter, Compliance Guardian, ESG Chief of Staff, etc.). |
| `src/lib/ai/autonomous-agents/agent-framework.ts` | Shared types (`AgentResult`, task contract) used by the intelligence layer. |

---

## 3. Endpoint Overview

### `POST /api/sustainability/intelligence`

Request body:

```json
{
  "dashboardType": "energy",
  "rawData": {},             // optional: dashboard dataset the UI has already fetched
  "preferences": {           // optional: forward-looking tuning parameters
    "refreshCache": false
  }
}
```

Behaviour:

1. Authenticates the user (`getAPIUser`) and resolves their organization (`getUserOrganizationById`).  
2. Calls `sustainabilityIntelligence.enrichDashboardData(dashboardType, organizationId, rawData)`.  
3. Returns a `DashboardIntelligence` payload:

```json
{
  "dashboardType": "energy",
  "organizationId": "org-123",
  "insights": [...],
  "recommendations": [...],
  "alerts": [...],
  "metrics": {
    "agentsExecuted": 5,
    "agentsSuccessful": 4,
    "executionTimeMs": 865,
    "insightsGenerated": 6,
    "recommendationsGenerated": 3,
    "alertsGenerated": 1
  },
  "generatedAt": "2025-02-14T12:34:56.000Z",
  "cacheHit": false
}
```

### `GET /api/sustainability/intelligence`

- Returns cache statistics (`cacheSize`, list of cached org-dashboard pairs, hit counts).  
- Useful for observability dashboards or smoke tests.

### `DELETE /api/sustainability/intelligence?organizationId=...&dashboardType=...`

- Clears cached entries, either globally or per organization/dashboard combination.  
- Use sparingly (staging environments, after backfilling data).

---

## 4. Execution Flow

1. **Cache Check** – `SustainabilityIntelligence` keeps a 5-minute in-memory cache keyed by `organizationId_dashboardType`.  
2. **Agent Selection** – `getRelevantAgents(dashboardType)` returns the subset of agents that should run. For example:
   - `energy`: Carbon Hunter + ESG Chief of Staff  
   - `compliance`: Compliance Guardian + ESG Chief of Staff
3. **Parallel Execution** – Each agent is instantiated with the organization context and given a dashboard-specific task. Promise.allSettled ensures one agent failure does not block the rest.  
4. **Result Transformation** – Agent outputs are normalised into insights, recommendations, and alerts with confidence, priority, and supporting metadata.  
5. **Metrics & Audit** – Execution metadata (duration, number of successful agents) is logged and returned. Security audit logs capture the request (`SecurityEventType.AI_STREAM_STARTED` for SSE flow, analogous logging for this endpoint).

---

## 5. Dependencies & Data Inputs

- **Supabase (Admin client)** – Used by agents for emissions, targets, and compliance datasets (`metrics_data`, `sustainability_targets`, etc.).  
- **Agent Framework** – Agents rely on helper services such as forecasting (`EnterpriseForecast`), baseline calculator, and compliance libraries.  
- **Feature Flags** – None specific to this endpoint; the layer is always-on and replaces legacy chat workflows.

---

## 6. Error Handling

- Authentication failures return `401`.  
- Missing organizations (e.g., user removed from org) return `404`.  
- Agent exceptions are logged per agent and downgraded to warnings; remaining agents still contribute output.  
- Unhandled errors bubble back as `500` with a generic message and optional stack trace in development.

---

## 7. Verification Checklist

1. **API Smoke Test**  
   ```bash
   curl -X POST http://localhost:3000/api/sustainability/intelligence \
     -H "Authorization: Bearer <TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{"dashboardType":"energy"}'
   ```
   Confirm response includes `insights`, `recommendations`, `metrics.executionTimeMs`, and `cacheHit`.

2. **Cache Behaviour**  
   - Call the endpoint twice within 5 minutes—second response should set `cacheHit: true`.  
   - Run `DELETE /api/sustainability/intelligence?organizationId=...` and confirm a fresh generation occurs.

3. **Agent Coverage**  
   - Change `dashboardType` across `["emissions","energy","compliance","targets","overview"]` and verify the expected agent IDs appear in the result sets.

4. **Monitoring**  
   - Tail logs for `"[Intelligence] Generated..."` messages to track duration and counts.  
   - When integrated with metrics tooling, ensure `metrics.executionTimeMs` aligns with observability dashboards.

---

## 8. Related Documentation

- `docs/DASHBOARD_DATA_PIPELINE.md` – Explains how dashboards consume the intelligence endpoint.  
- `docs/TARGETS_AND_FORECAST_APIS.md` – Reference for emissions/targets data used by the agents.  
- `docs/DOCUMENTATION_INDEX.md` – Source of truth for documentation ownership and review cadence.

