from backend.api.models import User
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

async def create_user(session: AsyncSession, telegram_id: str, username: str | None, fullname: str | None) -> User:
    telegram_id_clean = str(telegram_id).strip()
    username_value = username or fullname or f"User {telegram_id_clean}"
    fullname_value = fullname or username or f"User {telegram_id_clean}"
    
    new_user = User(
        username=username,
        telegram_id=telegram_id_clean,
        fullname=fullname_value,
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
