import os

import asyncpg
from dotenv import load_dotenv

# Load .env.local first, then .env
load_dotenv(".env.local")
load_dotenv()


def get_database_url() -> str:
    url = os.getenv("DATABASE_URL")
    if not url:
        raise RuntimeError("DATABASE_URL is not set (check .env.local or .env)")
    return url


async def create_pool(url: str | None = None, min_size: int = 1, max_size: int = 10) -> asyncpg.Pool:
    """Create and return an asyncpg connection pool."""
    if url is None:
        url = get_database_url()
    return await asyncpg.create_pool(url, min_size=min_size, max_size=max_size)
