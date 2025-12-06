from backend.api.teams.models import Team
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select


async def get_team_by_id(session: AsyncSession, team_id: int) -> Team | None:
    result = await session.execute(
        select(Team).where(Team.team_id == team_id)
    )
    team = result.scalars().first()
    return team

async def all_teams(session: AsyncSession) -> list[Team]:
    result = await session.execute(select(Team))
    return result.scalars().all()

async def create_team(session: AsyncSession, description: str, title: str, captaind_id: int, password: str) -> Team:
    
    new_team = Team(
        title=title,
        description=description,
        password=password,
        captaind_id=captaind_id,
        participants_id=None
    )

    session.add(new_team)
    await session.commit()
    await session.refresh(new_team)

    return new_team

async def add_participant(session: AsyncSession, participants_id: list[int], team: Team):
    team.participants_id = participants_id
    await session.commit()
    await session.refresh(team)

    return team

async def delete_hack(session: AsyncSession, team: Team) -> None:
    await session.delete(team)
    await session.flush()
    await session.commit()
    session.expunge(team)
