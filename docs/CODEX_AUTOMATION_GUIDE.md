# Codex Automation Guide

This document explains how to use the Codex SDK and CLI automation
features that are now wired into `blipee-os`.

## Prerequisites

1. Install global dependencies (already handled):
   - `exa-mcp-server`, `firecrawl-mcp`, `vercel-mcp`,
     `mcp-server-puppeteer`, `playwright-mcp-server`
2. Ensure `~/.codex/config.toml` points to this repo and references
   `~/.codex/mcp.json` (done earlier).
3. Export required API keys before running Codex (helper script):

   ```bash
   ./scripts/codex/export-env.sh
   ```

   Or export the variables manually if you prefer.

4. Optional: set any additional secrets required by specific MCP servers
   (Supabase credentials are already embedded in `.mcp.json`).

## Using the TypeScript SDK

### Install

The project includes the `@openai/codex-sdk` dev dependency (added via
`npm install --save-dev @openai/codex-sdk`).

### Script: `scripts/codex/run-codex-plan.ts`

This script launches a Codex session against the `blipee-os` profile,
streams plan updates, command output, and step results, and then shuts
the session down cleanly.

Run it with `tsx` or `node --loader tsx`:

```bash
npx tsx scripts/codex/run-codex-plan.ts \
  "Audit the autonomous agent MCP configuration and list any missing migrations."
```

If no prompt is provided, the script uses a default request to summarize
agent follow-up tasks.

### Extend the Script

The `@openai/codex-sdk` client supports additional events:

- `artifactCreated`
- `artifactUpdated`
- `stepStarted`
- `commandStarted`

Hook into these events to persist logs, send notifications, or integrate
with monitoring.

## Workflow Runner (JSON-defined prompts)

For multi-step, repeatable runs, use the workflow runner:

```bash
./scripts/codex/export-env.sh
npx tsx scripts/codex/run-workflow.ts \
  scripts/codex/workflows/sample-agent-audit.json
```

- Workflows are defined in JSON and can include multiple steps, optional
  timeouts, and per-step sandbox settings.
- The bundled `sample-agent-audit.json` keeps prompts short (<150 words)
  and applies 2–3 minute timeouts so it works reliably in non-interactive
  environments.
- Outputs are written to `codex-outputs/` automatically; extend the JSON
  to add more steps or change destinations.

## Codex CLI Automation

You can also drive Codex directly from shell scripts or CI using
`codex exec` to avoid interactive sessions entirely.

Example:

```bash
codex exec --profile blipee-os \
  "Scan the repository for TODOs related to agents and open issues."
```

Combine this with `--plan` to emit structured plan updates in the CLI
output.

## GitHub Action (codex exec)

A reusable workflow has been added at
`.github/workflows/codex-plan-check.yml`. It runs two Codex prompts on
`workflow_dispatch` or scheduled runs, using read-only sandboxed
execution. Each invocation writes its last message to
`codex-outputs/*.json` for review.

Provide the required secrets in your repository settings:

- `EXA_API_KEY`
- `FIRECRAWL_API_KEY`
- `VERCEL_API_KEY`
- `OPENAI_API_KEY`

Trigger the workflow manually or on a schedule to perform automated
audits. Download the `codex-plan-summaries` artifact to inspect the JSON
summaries Codex generated for each prompt.

## Tips

- Share the `blipee-os` profile by running `codex --profile blipee-os`
  for interactive sessions; it automatically loads the same MCP servers.
- You can create additional scripts in `scripts/codex/` for recurring
  tasks (daily agent health checks, data quality audits, etc.).
- When running in CI, always pass explicit prompts and keep sandbox mode
  to `workspace-write` unless the job needs more privileges.
