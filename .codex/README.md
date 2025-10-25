# Codex Local Configuration

This directory contains the local Codex CLI configuration for the
`blipee-os` workspace.

## Files

- `config.json`: Defines the `blipee-os` target and points Codex to the
  repository’s MCP server configuration at `../.mcp.json`.
- Global overrides live in `~/.codex/config.toml` with a reusable
  profile that targets this repo and a default sandbox/approval policy.
- Globally installed MCP servers are defined in `~/.codex/mcp.json`.

## Usage

From the project root, run:

```bash
codex --target blipee-os
```

Codex will start with the workspace root set to the repository and will
load all MCP servers defined in `.mcp.json` (Supabase, Exa, Firecrawl,
Docling, Playwright, Puppeteer, Vercel).

### Environment Variables

Codex does **not** automatically read `.env.local`. Before launching,
export the required keys (for example):

```bash
./scripts/codex/export-env.sh
codex --profile blipee-os
```

Any MCP server entry that references `${...}` will use whatever values
are present in your shell environment at launch time.
