from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.models import User

async def all_users_info(session: AsyncSession) -> list[User]:
    result = await session.execute(select(User))
    return result.scalars().all()

async def get_user_info_by_telegram_id(session: AsyncSession, telegram_id: str) -> User | None:

    result = await session.execute(
        select(User).where(User.telegram_id == telegram_id)
    )
    user = result.scalars().first()
    return user

async def update_user_info(session: AsyncSession, user: User, fullname: str, description: str, tags: list) -> None:
    user.fullname = fullname
    user.description = description
    user.tags = tags


    await session.commit()
    await session.refresh(user)
