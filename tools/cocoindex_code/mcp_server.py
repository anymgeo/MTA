from __future__ import annotations

import asyncio
import hashlib
import json
import os
import pathlib
import sqlite3
from typing import Any

import numpy as np
import sqlite_vec
import truststore
from mcp.server.fastmcp import FastMCP
from sentence_transformers import SentenceTransformer

truststore.inject_into_ssl()


ROOT = pathlib.Path(__file__).resolve().parents[2]
DB_PATH = ROOT / ".local" / "cocoindex" / "code-index.sqlite"
MODEL_NAME = os.environ.get(
    "COCOINDEX_EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2"
)
DEVICE = os.environ.get("COCOINDEX_DEVICE", "cuda")

mcp = FastMCP("mta-cocoindex-code-search")
_model: SentenceTransformer | None = None


def _model_instance() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer(MODEL_NAME, device=DEVICE)
    return _model


def _connection() -> sqlite3.Connection:
    if not DB_PATH.exists():
        raise RuntimeError(f"CocoIndex database does not exist: {DB_PATH}")
    connection = sqlite3.connect(f"file:{DB_PATH}?mode=ro", uri=True)
    connection.enable_load_extension(True)
    sqlite_vec.load(connection)
    connection.enable_load_extension(False)
    connection.row_factory = sqlite3.Row
    return connection


def _embedding_bytes(value: Any) -> np.ndarray:
    if isinstance(value, memoryview):
        value = value.tobytes()
    if isinstance(value, bytes):
        return np.frombuffer(value, dtype=np.float32)
    if isinstance(value, str):
        return np.asarray(json.loads(value), dtype=np.float32)
    return np.asarray(value, dtype=np.float32)


@mcp.tool()
def search_code(query: str, limit: int = 8, path_prefix: str = "") -> dict[str, Any]:
    """Search the local CocoIndex code index and return compact snippets with paths and lines."""
    query = query.strip()
    if not query:
        return {"results": [], "message": "Query is empty."}
    limit = max(1, min(limit, 20))
    query_vector = _model_instance().encode(query, normalize_embeddings=True)
    with _connection() as connection:
        rows = connection.execute(
            "SELECT id, path, start_line, end_line, text, embedding FROM code_chunks"
            + (" WHERE path LIKE ?" if path_prefix else ""),
            (path_prefix.rstrip("/") + "/%",) if path_prefix else (),
        ).fetchall()
    scored = []
    for row in rows:
        vector = _embedding_bytes(row["embedding"])
        denominator = np.linalg.norm(vector) * np.linalg.norm(query_vector)
        score = float(np.dot(vector, query_vector) / denominator) if denominator else 0.0
        scored.append((score, row))
    scored.sort(key=lambda item: item[0], reverse=True)
    return {
        "query": query,
        "results": [
            {
                "path": row["path"],
                "start_line": row["start_line"],
                "end_line": row["end_line"],
                "score": round(score, 4),
                "text": row["text"],
            }
            for score, row in scored[:limit]
        ],
    }


@mcp.tool()
def fetch_code(path: str, start_line: int = 1, end_line: int = 120) -> dict[str, Any]:
    """Read a bounded source range after search_code identifies a relevant file."""
    requested = (ROOT / path).resolve()
    if ROOT not in requested.parents and requested != ROOT:
        raise ValueError("Path must stay inside the project root")
    if not requested.is_file():
        raise FileNotFoundError(path)
    start_line = max(1, start_line)
    end_line = min(start_line + 240, max(start_line, end_line))
    lines = requested.read_text(encoding="utf-8").splitlines()
    return {"path": path, "start_line": start_line, "end_line": min(end_line, len(lines)),
            "text": "\n".join(lines[start_line - 1:end_line])}


@mcp.tool()
async def reindex_code(full: bool = False) -> dict[str, Any]:
    """Refresh the incremental CocoIndex code index; use full=true after changing flow settings."""
    command = [str(ROOT / ".tools" / "cocoindex-venv" / "Scripts" / "cocoindex.exe"),
               "update", str(ROOT / "tools" / "cocoindex_code" / "flow.py")]
    if full:
        command.append("--full-reprocess")
    process = await asyncio.create_subprocess_exec(*command, cwd=ROOT,
        stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.STDOUT)
    output, _ = await process.communicate()
    return {"exit_code": process.returncode, "output": output.decode(errors="replace")[-12000:]}


if __name__ == "__main__":
    mcp.run(transport="stdio")
