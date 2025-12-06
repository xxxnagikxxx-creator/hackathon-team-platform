from backend.api.models import User
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

async def create_user(session: AsyncSession, telegram_id: str, username: str, fullname: str) -> User:
    new_user = User(
        username=username,
        telegram_id=str(telegram_id),
        fullname=fullname,
    )
    session.add(new_user)
    await session.commit()
    await session.refresh(new_user)
    return new_user

async def get_user_by_telegram_id(session: AsyncSession, telegram_id: str) -> User | None:
    result = await session.execute(
        select(User).where(User.telegram_id == str(telegram_id))
    )
    user = result.scalars().first()
    return user

async def update_user_avatar(session: AsyncSession, user: User, avatar_bytes: bytes) -> None:
    user.avatar = avatar_bytes
    await session.commit()
    await session.refresh(user)
