from backend.api.admin.models import Admin
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

async def get_admin(session: AsyncSession, email: str) -> Admin:
    result = await session.execute(select(Admin).where(Admin.email == email))
    admin = result.scalars().first()

    return admin

async def create_admin(session: AsyncSession, email: str, password_hash: str):
    new_admin = Admin(
        email=email,
        password_hash=password_hash
    )
    session.add(new_admin)

    await session.commit()
    await session.refresh(new_admin)
