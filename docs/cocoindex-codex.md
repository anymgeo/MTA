# CocoIndex + Codex local code search

This project uses a local CocoIndex semantic index exposed to Codex through the `mta_cocoindex` MCP server.

## Setup

The ignored environment is `.tools/cocoindex-venv`. It contains CocoIndex, the MCP Python SDK, Sentence Transformers, and CUDA-enabled PyTorch. The ignored database files are under `.local/cocoindex`.

The index uses `sentence-transformers/all-MiniLM-L6-v2` and is configured for CUDA. It includes source and documentation files while excluding dependencies, generated output, private runtime data and binary media.

## Commands

```powershell
./scripts/cocoindex-reindex.ps1
./scripts/cocoindex-reindex.ps1 -Full
```

Normal reindexing is incremental. Use a full rebuild only after changing the flow, model, chunking or file filters.

## Codex usage

Codex should call `search_code` for conceptual or cross-file discovery, then `fetch_code` for a small verified source range. The MCP server returns local results only; it does not call a cloud embedding API. Important results must still be checked against the current working tree because the index is a derived cache.
