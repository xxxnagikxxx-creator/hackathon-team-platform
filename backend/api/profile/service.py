from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text, and_
from backend.api.models import User
from backend.api.profile.schemas import UserUpdate, UserInfo
from backend.api.profile.utils import get_avatar_base64, parse_tags
from backend.api.teams.service import get_captain_team_for_hackathon
from backend.api.hackathons.service import update_participants_count, get_hack_by_id

async def all_users_info(session: AsyncSession) -> list[User]:
    result = await session.execute(select(User))
    return result.scalars().all()

async def get_user_info_by_telegram_id(session: AsyncSession, telegram_id: str) -> User | None:
    telegram_id_str = str(telegram_id).strip()
    result = await session.execute(
        select(User).where(User.telegram_id == telegram_id_str)
    )
    user = result.scalars().first()
    return user


def user_to_user_info(user: User) -> UserInfo:
    return UserInfo(
        telegram_id=str(user.telegram_id) if user.telegram_id else "",
        fullname=(user.fullname or user.username or "").strip(),
        username=user.username,
        description=(user.description or "").strip() if user.description else "",
        role=user.role,
        pic=get_avatar_base64(user.avatar),
        tags=parse_tags(user.tags),
        team=None
    )

async def update_user_info(session: AsyncSession, user: User, data: UserUpdate) -> User:
    if data.username is not None and data.username.strip() != '':
        username_value = data.username.strip()
        user.username = username_value
        user.fullname = username_value
    elif data.fullname is not None and data.fullname.strip() != '' and (data.username is None or data.username.strip() == ''):
        fullname_value = data.fullname.strip()
        user.username = fullname_value
        user.fullname = fullname_value
    
    if data.description is not None:
        user.description = data.description
    if data.tags is not None:
        user.tags = data.tags
    if data.role is not None and data.role.strip() != '':
        user.role = data.role.strip()
    await session.commit()
    await session.refresh(user)
    return user

async def update_user_in_team(session: AsyncSession, telegram_id: str, team_id: int | None) -> User | None:
    user = await get_user_info_by_telegram_id(session=session, telegram_id=telegram_id)
    if not user:
        return None
    user.in_team = team_id
    
    try:
        await session.commit()
        await session.refresh(user)
        return user
    except Exception as e:
        await session.rollback()
        raise


async def get_user_team_for_hackathon(session: AsyncSession, telegram_id: str, hackathon_id: int) -> int | None:
    user = await get_user_info_by_telegram_id(session=session, telegram_id=telegram_id)
    if not user:
        return None
    
    
    captain_team = await get_captain_team_for_hackathon(
        session=session,
        captain_id=telegram_id,
        hackathon_id=hackathon_id
    )
    if captain_team and captain_team.team_id:
        return captain_team.team_id
    
    hackathon_teams = user.hackathon_teams or {}
    team_id_from_teams = hackathon_teams.get(str(hackathon_id)) or hackathon_teams.get(hackathon_id)
    if team_id_from_teams:
        return team_id_from_teams
    
    from backend.api.teams.models import Team
    result = await session.execute(
        select(Team).where(Team.hackathon_id == hackathon_id)
    )
    teams = result.scalars().all()
    
    for team in teams:
        participants_list = team.participants_id or []
        telegram_id_str = str(telegram_id).strip()
        for p_id in participants_list:
            if str(p_id).strip() == telegram_id_str:
                return team.team_id
    
    return None


async def update_user_team_for_hackathon(
    session: AsyncSession,
    telegram_id: str,
    hackathon_id: int,
    team_id: int | None,
    commit: bool = True,
    update_count: bool = True
) -> User | None:
    
    user = await get_user_info_by_telegram_id(session=session, telegram_id=telegram_id)
    if not user:
        return None
    hackathon_teams = user.hackathon_teams
    if hackathon_teams is None:
        hackathon_teams = {}
    elif not isinstance(hackathon_teams, dict):
        hackathon_teams = dict(hackathon_teams) if hackathon_teams else {}
    
    was_participating = str(hackathon_id) in hackathon_teams or hackathon_id in hackathon_teams
    will_be_participating = team_id is not None
    updated_teams = dict(hackathon_teams)
    
    if team_id is None:
        hackathon_id_str = str(hackathon_id)
        if hackathon_id_str in updated_teams:
            del updated_teams[hackathon_id_str]
        if hackathon_id in updated_teams:
            del updated_teams[hackathon_id]
    else:
        updated_teams[str(hackathon_id)] = team_id
    
    user.hackathon_teams = updated_teams
    
    try:
        if commit:
            await session.commit()
            await session.refresh(user)
        else:
            await session.flush()
        if update_count and was_participating != will_be_participating:
            
            
            hackathon = await get_hack_by_id(session=session, hack_id=hackathon_id, update_count=False)
            if hackathon:
                await update_participants_count(session=session, hackathon=hackathon, commit=commit)  
        return user
    except Exception as e:
        if commit:
            await session.rollback()
        raise

