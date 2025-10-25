#!/usr/bin/env bash

# Helper script to export the core MCP-related environment variables
# from .env.local for Codex CLI and automation workflows.

set -euo pipefail

ENV_FILE="${1:-.env.local}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing environment file: $ENV_FILE" >&2
  exit 1
fi

extract() {
  local key="$1"
  local value
  value="$(grep -E "^${key}=" "$ENV_FILE" | tail -n 1 | cut -d'=' -f2-)"
  if [[ -z "$value" ]]; then
    echo "Warning: ${key} not found in $ENV_FILE" >&2
  else
    export "$key=$value"
    echo "Exported ${key}"
  fi
}

extract "EXA_API_KEY"
extract "FIRECRAWL_API_KEY"
extract "VERCEL_TOKEN"
if [[ -n "${VERCEL_TOKEN:-}" ]]; then
  export VERCEL_API_KEY="$VERCEL_TOKEN"
  echo "Exported VERCEL_API_KEY (from VERCEL_TOKEN)"
fi
extract "OPENAI_API_KEY"
extract "SUPABASE_SERVICE_KEY"
extract "SUPABASE_SERVICE_ROLE_KEY"
extract "GITHUB_PERSONAL_ACCESS_TOKEN"

echo "Environment variables ready for Codex sessions."
