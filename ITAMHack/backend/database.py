import logging
import os
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from backend.config import settings

logger = logging.getLogger(__name__)

# Получаем DATABASE_URL из переменных окружения или из настроек
env_database_url = os.getenv("DATABASE_URL") or (settings.database_url or "").strip()

if not env_database_url:
    raise ValueError(
        "DATABASE_URL не указан. Убедитесь, что переменная окружения DATABASE_URL установлена."
    )

# Используем PostgreSQL из DATABASE_URL
DATABASE_URL = env_database_url

logger.info(f"Подключение к базе данных: {DATABASE_URL.split('@')[-1] if '@' in DATABASE_URL else DATABASE_URL}")

# Создаём engine с настройками для PostgreSQL
engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True,  # Проверка соединения перед использованием
    pool_size=10,  # Размер пула соединений
    max_overflow=20,  # Максимальное количество дополнительных соединений
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




