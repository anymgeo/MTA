from __future__ import annotations

import asyncio
import pathlib

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client


ROOT = pathlib.Path(__file__).resolve().parents[1]
PYTHON = ROOT / ".tools" / "cocoindex-venv" / "Scripts" / "python.exe"
SERVER = ROOT / "tools" / "cocoindex_code" / "mcp_server.py"


async def main() -> None:
    params = StdioServerParameters(command=str(PYTHON), args=[str(SERVER)], cwd=str(ROOT))
    async with stdio_client(params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            tools = await session.list_tools()
            result = await session.call_tool("search_code", {"query": "CSRF authentication", "limit": 3})
            print("tools:", [tool.name for tool in tools.tools])
            print("result:", result.content[0].text[:2000])


if __name__ == "__main__":
    asyncio.run(main())
