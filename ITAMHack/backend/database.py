import logging
from pathlib import Path
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from backend.config import settings

BASE_DIR = Path(__file__).resolve().parent.parent
SQLITE_PATH = BASE_DIR / "data" / "app.db"
SQLITE_PATH.parent.mkdir(parents=True, exist_ok=True)

logger = logging.getLogger(__name__)

env_database_url = (settings.database_url or "").strip()

if env_database_url.startswith("sqlite"):
    DATABASE_URL = env_database_url
elif env_database_url:
    logger.warning(
        "DATABASE_URL specified but non-sqlite backend disabled; falling back to sqlite at %s",
        SQLITE_PATH,
    )
    DATABASE_URL = f"sqlite+aiosqlite:///{SQLITE_PATH.as_posix()}"
else:
    DATABASE_URL = f"sqlite+aiosqlite:///{SQLITE_PATH.as_posix()}"

engine = create_async_engine(DATABASE_URL, echo=False)

async_session = async_sessionmaker(
    bind=engine,
    expire_on_commit=True,
    class_=AsyncSession,
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        yield session


async def create_all_tables() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)




