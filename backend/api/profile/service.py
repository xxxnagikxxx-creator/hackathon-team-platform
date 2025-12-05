from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from backend.api.models import User
from backend.api.profile.schemas import UserUpdate

async def all_users_info(session: AsyncSession) -> list[User]:
    result = await session.execute(select(User))
    return result.scalars().all()

async def get_user_info_by_telegram_id(session: AsyncSession, telegram_id: str) -> User | None:
    result = await session.execute(
        select(User).where(User.telegram_id == telegram_id)
    )
    user = result.scalars().first()
    return user

async def update_user_info(session: AsyncSession, user: User, data: UserUpdate) -> User:
    if data.fullname is not None:
        user.fullname = data.fullname
    if data.description is not None:
        user.description = data.description
    if data.tags is not None:
        user.tags = data.tags
    if data.role is not None:
        user.role = data.role

    await session.commit()
    await session.refresh(user)
    return user

