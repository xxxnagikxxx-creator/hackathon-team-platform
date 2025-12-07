from backend.api.hackathons.models import Hackathon
from backend.api.hackathons.utils import decode_pic_base64
from backend.api.models import User
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import date
from backend.api.teams.models import Team
from backend.api.teams.invitation_models import TeamInvitation
from sqlalchemy import delete
    



async def count_participants_for_hackathon(session: AsyncSession, hackathon_id: int) -> int:
    try:
        result = await session.execute(select(User))
        users = result.scalars().all()
        
        count = 0
        hackathon_id_str = str(hackathon_id)
        for user in users:
            hackathon_teams = user.hackathon_teams
            if hackathon_teams is None:
                hackathon_teams = {}
            elif not isinstance(hackathon_teams, dict):
                try:
                    hackathon_teams = dict(hackathon_teams) if hackathon_teams else {}
                except (TypeError, ValueError):
                    hackathon_teams = {}
            if hackathon_id_str in hackathon_teams:
                count += 1
            elif hackathon_id in hackathon_teams:
                count += 1       
        return count
    except Exception as e:
        return 0


async def update_participants_count(session: AsyncSession, hackathon: Hackathon, commit: bool = True) -> None:
    old_count = getattr(hackathon, 'participants_count', None) or 0
    count = await count_participants_for_hackathon(session, hackathon.hack_id)
    count = int(count) if count is not None else 0
    hackathon.participants_count = count
    try:
        await session.flush()
        if commit:
            await session.commit()
            await session.refresh(hackathon)
    except Exception as e:
        if commit:
            await session.rollback()
        raise


async def get_hack_by_id(session: AsyncSession, hack_id: int, update_count: bool = False) -> Hackathon | None:
    result = await session.execute(
        select(Hackathon).where(Hackathon.hack_id == hack_id)
    )
    hack = result.scalars().first()
    if hack and update_count:
        try:
            await update_participants_count(session, hack, commit=True)
        except Exception:
            pass
    return hack


async def all_hacks(session: AsyncSession) -> list[Hackathon]:
    result = await session.execute(select(Hackathon))
    hacks = result.scalars().all()
    return hacks


async def create_hack(
    session: AsyncSession, 
    description: str, 
    pic: str, 
    event_date: date, 
    title: str,
    start_date: date,
    end_date: date,
    location: str | None = None,
    max_participants: int | None = None
) -> Hackathon:
    pic_bytes = decode_pic_base64(pic)
    
    new_hack = Hackathon(
        title=title,
        pic=pic_bytes,
        description=description,
        event_date=event_date,
        start_date=start_date,
        end_date=end_date,
        location=location,
        participants_count=0, 
        max_participants=max_participants,
    )

    session.add(new_hack)
    await session.commit()
    await session.refresh(new_hack)
    try:
        await update_participants_count(session, new_hack)
    except Exception:
        pass

    return new_hack


async def update_hack(
    session: AsyncSession, 
    hack: Hackathon, 
    title: str, 
    description: str, 
    pic: str, 
    event_date: date,
    start_date: date,
    end_date: date,
    location: str | None = None,
    max_participants: int | None = None
) -> Hackathon:
    pic_bytes = decode_pic_base64(pic)

    hack.title = title
    hack.description = description
    hack.pic = pic_bytes
    hack.event_date = event_date
    hack.start_date = start_date
    hack.end_date = end_date
    hack.location = location
    hack.max_participants = max_participants

    await session.commit()
    await session.refresh(hack)
    try:
        await update_participants_count(session, hack)
    except Exception:
        pass

    return hack

async def delete_hack(session: AsyncSession, hack: Hackathon) -> None:
    
    hackathon_id = hack.hack_id
    
    # Удаляем все приглашения для этого хакатона
    await session.execute(
        delete(TeamInvitation).where(TeamInvitation.hackathon_id == hackathon_id)
    )
    
    await session.execute(
        delete(Team).where(Team.hackathon_id == hackathon_id)
    )
    
    result = await session.execute(select(User))
    users = result.scalars().all()
    
    hackathon_id_str = str(hackathon_id)
    for user in users:
        hackathon_teams = user.hackathon_teams or {}
        if hackathon_id_str in hackathon_teams:
            del hackathon_teams[hackathon_id_str]
        if hackathon_id in hackathon_teams:
            del hackathon_teams[hackathon_id]
        user.hackathon_teams = hackathon_teams
    
    await session.delete(hack)
    await session.commit()
    session.expunge(hack)


