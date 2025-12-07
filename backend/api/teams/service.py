from backend.api.teams.models import Team
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_


async def get_team_by_id(session: AsyncSession, team_id: int) -> Team | None:
    result = await session.execute(
        select(Team).where(Team.team_id == team_id)
    )
    team = result.scalars().first()
    return team

async def get_teams_by_hackathon(session: AsyncSession, hackathon_id: int) -> list[Team]:
    result = await session.execute(
        select(Team).where(Team.hackathon_id == hackathon_id)
    )
    return result.scalars().all()

async def all_teams(session: AsyncSession) -> list[Team]:
    result = await session.execute(select(Team))
    return result.scalars().all()

async def create_team(session: AsyncSession, description: str, title: str, captain_id: str, password: str, hackathon_id: int) -> Team:
    new_team = Team(
        title=title,
        description=description,
        password=password,
        captain_id=captain_id,
        hackathon_id=hackathon_id,
        participants_id=None
    )
    session.add(new_team)
    await session.flush() 
    await session.refresh(new_team)
    return new_team

async def add_participant(session: AsyncSession, participants_id: list[str], team: Team, commit: bool = True):
    team.participants_id = participants_id
    if commit:
        await session.commit()
        await session.refresh(team)
    else:
        await session.flush()
        await session.refresh(team)

    return team

async def remove_participant(session: AsyncSession, participants_id: list[str], team: Team, commit: bool = True):
    team.participants_id = participants_id
    if commit:
        await session.commit()
        await session.refresh(team)
    else:
        await session.flush()
        await session.refresh(team)

    return team

async def leave_team(session: AsyncSession, participants_id: list[str], team: Team, commit: bool = True) -> Team:
    return await remove_participant(session=session, participants_id=participants_id, team=team, commit=commit)

async def update_team(session: AsyncSession, team: Team, title: str, description: str) -> Team:
    team.title = title
    team.description = description
    await session.commit()
    await session.refresh(team)
    return team

async def delete_team(session: AsyncSession, team: Team, commit: bool = True) -> None:
    await session.delete(team)
    if commit:
        await session.commit()

async def get_captain_team_for_hackathon(session: AsyncSession, captain_id: str, hackathon_id: int) -> Team | None:
    result = await session.execute(
        select(Team).where(
            and_(
                Team.captain_id == captain_id,
                Team.hackathon_id == hackathon_id
            )
        )
    )
    return result.scalars().first()
