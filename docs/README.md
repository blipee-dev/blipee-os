# Documentation Guide

This directory contains the primary knowledge base for blipee OS.  
Use this guide to keep documentation trustworthy while the platform evolves quickly.

## How to Navigate

1. Start with `docs/DOCUMENTATION_INDEX.md` for the authoritative list of domains and their current source of truth.  
2. Historical or legacy reports now live in `docs/archive/`. Check there before creating new documents with the same scope.  
3. If a document is missing from the index, treat it as historical—do not rely on it without verification.  
4. When you refresh a document, update the **Last Verified** column in the index and add a short note under “Backlog & Follow-Up”.

## Update Workflow

1. **Before coding**: Add a TODO entry to the relevant doc or the index if a change will require new documentation.  
2. **During implementation**: Capture reader-facing impacts in code comments or PR notes.  
3. **Before merging**: Ensure the doc is updated and linked from the code (README, inline comment, or commit message).  
4. **After merging**: Run `npm run docs:audit` to confirm no deprecated references remain.

## Monthly Triage Checklist

- Review `docs/DOCUMENTATION_INDEX.md` with the engineering & product leads.  
- Archive or delete any documents listed in the “Archive / Consolidate Queue”.  
- Scan for new high-impact features and add them to the index with an owner.  
- Log outcomes in the index backlog so open questions have a visible owner.

## Automation & Tooling

- `npm run docs:audit` checks for deprecated API references in documentation.  
- Add additional patterns to `scripts/docs/doc-audit.ts` when APIs or features are retired.  
- Integrate the command into CI to prevent regressions.

## Style Notes

- Prefer concise Markdown documents (≤ 500 lines) linked from `docs/DOCUMENTATION_INDEX.md`.  
- Include context, current behaviour, and verification steps; avoid stale implementation notes.  
- When multiple docs cover the same topic, consolidate into a single canonical document and archive the rest.
