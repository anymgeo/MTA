from __future__ import annotations

import hashlib
import json
import os
import pathlib
from dataclasses import dataclass
from typing import Annotated

import truststore

truststore.inject_into_ssl()

import cocoindex as coco
from numpy.typing import NDArray
from cocoindex.connectors import localfs, sqlite
from cocoindex.ops.sentence_transformers import SentenceTransformerEmbedder
from cocoindex.resources.file import FileLike, PatternFilePathMatcher


ROOT = pathlib.Path(__file__).resolve().parents[2]
INDEX_DIR = ROOT / ".local" / "cocoindex"
INDEX_DB = INDEX_DIR / "code-index.sqlite"
STATE_DB = INDEX_DIR / "state.lmdb"

SOURCE_DIR = coco.ContextKey[pathlib.Path]("mta_project_root")
SQLITE_DB = coco.ContextKey[sqlite.ManagedConnection]("cocoindex_code_db")

MODEL_NAME = os.environ.get(
    "COCOINDEX_EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2"
)
DEVICE = os.environ.get("COCOINDEX_DEVICE", "cuda")
embedder = SentenceTransformerEmbedder(MODEL_NAME, device=DEVICE)


@dataclass
class CodeChunk:
    id: int
    path: str
    start_line: int
    end_line: int
    text: str
    metadata: str
    embedding: Annotated[NDArray, embedder]


def _chunk(text: str, size: int = 1800, overlap: int = 250):
    lines = text.splitlines()
    if not lines:
        return
    start = 0
    while start < len(lines):
        end = min(len(lines), start + size // 80)
        if end <= start:
            end = start + 1
        yield start + 1, end, "\n".join(lines[start:end])
        if end == len(lines):
            break
        start = max(start + 1, end - overlap // 80)


def _chunk_id(path: str, start_line: int) -> int:
    digest = hashlib.sha256(f"{path}:{start_line}".encode()).digest()
    return int.from_bytes(digest[:8], "big") & 0x7FFFFFFFFFFFFFFF


@coco.fn(memo=True)
async def process_file(file: FileLike, target: sqlite.TableTarget) -> None:
    relative_path = file.file_path.path.as_posix()
    try:
        content = await file.read_text()
    except (UnicodeDecodeError, OSError):
        return
    for start_line, end_line, text in _chunk(content):
        vector = await embedder.embed(text)
        target.declare_row(
            row=CodeChunk(
                id=_chunk_id(relative_path, start_line),
                path=relative_path,
                start_line=start_line,
                end_line=end_line,
                text=text,
                metadata=json.dumps({"path": relative_path, "start_line": start_line}),
                embedding=vector,
            )
        )


@coco.lifespan
def lifespan(builder: coco.EnvironmentBuilder):
    INDEX_DIR.mkdir(parents=True, exist_ok=True)
    builder.settings.db_path = STATE_DB
    with sqlite.managed_connection(INDEX_DB, load_vec=True) as connection:
        builder.provide(SOURCE_DIR, ROOT)
        builder.provide(SQLITE_DB, connection)
        yield


@coco.fn
async def app_main() -> None:
    schema = await sqlite.TableSchema.from_class(CodeChunk, primary_key=["id"])
    target = await sqlite.mount_table_target(
        SQLITE_DB,
        "code_chunks",
        schema,
        virtual_table_def=sqlite.Vec0TableDef(
            auxiliary_columns=["path", "start_line", "end_line", "text", "metadata"]
        ),
    )
    matcher = PatternFilePathMatcher(
        included_patterns=[
            "**/*.cs", "**/*.csproj", "**/*.js", "**/*.jsx", "**/*.mjs",
            "**/*.ts", "**/*.tsx", "**/*.json", "**/*.md", "**/*.ps1",
            "**/*.yml", "**/*.yaml", "**/*.css", "**/*.mjs",
        ],
        excluded_patterns=[
            "**/.git/**", "**/.local/**", "**/.tools/**", "**/.next/**", "**/.next*/**",
            "**/node_modules/**", "**/bin/**", "**/obj/**", "**/media/**",
            "**/*.lock", "**/*.png", "**/*.jpg", "**/*.jpeg", "**/*.webp",
            "**/*.mp4", "**/*.pdf", "**/*.ttf", "**/*.otf",
        ],
    )
    files = localfs.walk_dir(SOURCE_DIR, recursive=True, path_matcher=matcher)
    await coco.mount_each(process_file, files.items(), target)


app = coco.App(
    coco.AppConfig(name="MtaCodeSearch"),
    app_main,
)
