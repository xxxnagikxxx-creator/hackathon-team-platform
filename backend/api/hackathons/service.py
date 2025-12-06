from backend.api.hackathons.models import Hackathon
from backend.api.hackathons.utils import decode_pic_base64
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import date





async def get_hack_by_id(session: AsyncSession, hack_id: int) -> Hackathon | None:
    result = await session.execute(
        select(Hackathon).where(Hackathon.hack_id == hack_id)
    )
    hack = result.scalars().first()
    return hack

async def all_hacks(session: AsyncSession) -> list[Hackathon]:
    result = await session.execute(select(Hackathon))
    return result.scalars().all()


async def create_hack(session: AsyncSession, description: str, pic: str, event_date: date, title: str) -> Hackathon:
    pic_bytes = decode_pic_base64(pic)
    
    new_hack = Hackathon(
        title=title,
        pic=pic_bytes,
        description=description,
        event_date=event_date,
    )

    session.add(new_hack)
    await session.commit()
    await session.refresh(new_hack)

    return new_hack


async def update_hack(session: AsyncSession, hack: Hackathon, title: str, description: str, pic: str, event_date: date) -> Hackathon:
    pic_bytes = decode_pic_base64(pic)

    hack.title = title
    hack.description = description
    hack.pic = pic_bytes
    hack.event_date = event_date

    await session.commit()
    await session.refresh(hack)

    return hack

async def delete_hack(session: AsyncSession, hack: Hackathon) -> None:
    await session.delete(hack)
    await session.flush()
    await session.commit()
    session.expunge(hack)


