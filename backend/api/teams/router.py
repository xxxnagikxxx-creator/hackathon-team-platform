from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from random import choices

from backend.api.profile.service import get_user_info_by_telegram_id

from backend.api.depends import get_current_telegram_id
from backend.api.teams.models import Team
from backend.api.database import get_db
from backend.api.teams.schemas import TeamInfo, EnterTeam, CreateTeam, UpdateTeam, ShortTeamInfo, EnterTeamRequest
from backend.api.teams.service import all_teams, get_team_by_id, create_team, add_participant


router = APIRouter(prefix="/teams", tags=["teams"])


def generate_code() -> str:
    return ''.join(choices('0123456789', k=6))

@router.get("", response_model=list[ShortTeamInfo])
async def all_teams_info(
    session: AsyncSession = Depends(get_db),
):
    teams = await all_teams(session=session)

    return [
        ShortTeamInfo(
            team_id=team.team_id,
            title=team.title or "",
            description=team.description or "",
        )
        for team in teams if team
    ]

@router.post("/create", response_model=TeamInfo)
async def create_team(
    session: AsyncSession = Depends(get_db),
    captain_id: str = Depends(get_current_telegram_id)
) -> TeamInfo:
    password = str(generate_code())

    team = await create_team(session=session, captain_id=captain_id, password=password)
    captain = await get_user_info_by_telegram_id(session=session, 
                                                 telegram_id=str(team.captain_id))
    participants = [await get_user_info_by_telegram_id(session=session, 
                                                       telegram_id=str(participant_id)) for participant_id in (team.participants_id or [])]

    return TeamInfo(
        team_id=team.team_id,
        title=team.title,
        description=team.description or "",
        captain=captain,
        participants=participants
    )

@router.post("/{team_id}/enter", response_model=TeamInfo)
async def enter_team(
    team_id: int,
    request: EnterTeamRequest,
    session: AsyncSession = Depends(get_db),
    telegram_id: str = Depends(get_current_telegram_id)
) -> TeamInfo:

    team = await get_team_by_id(session=session, team_id=team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    if team.password != request.password:
        raise HTTPException(status_code=401, detail="Invalid password")
    
    participants_list = team.participants_id or []
    telegram_id_int = int(telegram_id)
    
    if telegram_id_int in participants_list:
        raise HTTPException(status_code=400, detail="User is already a member of this team")

    if team.captain_id == telegram_id_int:
        raise HTTPException(status_code=400, detail="Captain cannot join as participant")
    
    participants_list.append(telegram_id_int)
    team = await add_participant(session=session, participants_id=participants_list, team=team)
    
    captain = await get_user_info_by_telegram_id(session=session, 
                                                 telegram_id=str(team.captain_id))
    participants = [await get_user_info_by_telegram_id(session=session, 
                                                       telegram_id=str(participant_id)) for participant_id in (team.participants_id or [])]
    
    return TeamInfo(
        team_id=team.team_id,
        title=team.title,
        description=team.description or "",
        captain=captain,
        participants=participants
    )



@router.get("/{team_id}", response_model=TeamInfo)
async def hack_info(
    team_id: int,
    session: AsyncSession = Depends(get_db),
) -> TeamInfo:
    team = await get_team_by_id(session=session, team_id=team_id)

    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    captain = await get_user_info_by_telegram_id(session=session, telegram_id=str(team.captain_id))
    participants = [await get_user_info_by_telegram_id(session=session, telegram_id=str(participant_id)) for participant_id in (team.participants_id or [])]

    return TeamInfo(
        team_id=team.team_id,
        title=team.title,
        description=team.description or "",
        captain=captain,
        participants=participants
    )