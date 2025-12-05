import os
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from backend.api.config import settings

env_database_url = os.getenv("DATABASE_URL") or (settings.database_url or "").strip()

if not env_database_url:
    raise ValueError("DATABASE_URL must be set in environment variables or settings")

DATABASE_URL = env_database_url


engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

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





