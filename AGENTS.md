# Codex project instructions

## Local CocoIndex code search

This repository has an optional local semantic code index for reducing repeated context loading.

- MCP server name: `mta_cocoindex`
- Index database: `.local/cocoindex/code-index.sqlite`
- CocoIndex state: `.local/cocoindex/state.lmdb`
- Reindex command: `./scripts/cocoindex-reindex.ps1`
- Full rebuild: `./scripts/cocoindex-reindex.ps1 -Full`
- Python environment: `.tools/cocoindex-venv`

Use the `mta_cocoindex` MCP tools when a task requires finding code by concept, locating an implementation across many files, or tracing an unfamiliar feature. Start with `search_code`, then use `fetch_code` for a bounded range. Keep returned context compact and prefer exact paths and line ranges. Use ordinary repository search and direct file reads for exact symbol matches, edits, verification, and small files.

Run `reindex_code` after substantial source changes when search results may be stale. Use `full=true` only after changing the indexing flow, embedding model, chunking rules, or included/excluded file patterns. Never index `.local`, `.tools`, build output, dependencies, media, fonts, videos, PDFs, or lockfiles.

The index is local-only and ignored by Git. It is a derived cache, not source of truth. Always verify important findings against the current files before editing.
