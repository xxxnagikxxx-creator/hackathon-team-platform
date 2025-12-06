from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.ext.asyncio import AsyncSession
from random import choices
import jwt
import time

from backend.api.profile.service import get_user_info_by_telegram_id, update_user_in_team

from backend.api.depends import get_current_telegram_id, verify_captain_access, get_optional_telegram_id
from backend.api.teams.models import Team
from backend.api.database import get_db
from backend.api.teams.schemas import TeamInfo, EnterTeam, CreateTeam, UpdateTeam, ShortTeamInfo, EnterTeamRequest
from backend.api.teams.service import all_teams, get_team_by_id, create_team as create_team_service, add_participant, remove_participant, leave_team, update_team, delete_team
from backend.api.config import settings


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

@router.get("/{team_id}", response_model=TeamInfo)
async def hack_info(
    team_id: int,
    response: Response,
    session: AsyncSession = Depends(get_db),
    current_telegram_id: str | None = Depends(get_optional_telegram_id)
) -> TeamInfo:
    team = await get_team_by_id(session=session, team_id=team_id)

    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    captain = await get_user_info_by_telegram_id(session=session, telegram_id=team.captain_id)
    participants = [await get_user_info_by_telegram_id(session=session, telegram_id=participant_id) for participant_id in (team.participants_id or [])]

    password = team.password if current_telegram_id and team.captain_id == current_telegram_id else None
    
    if current_telegram_id and team.captain_id == current_telegram_id:
        captain_token = jwt.encode(
            {"telegram_id": current_telegram_id, "team_id": team_id, "exp": int(time.time()) + settings.access_token_expire_minutes * 60},
            settings.secret_key,
            algorithm=settings.algorithm
        )
        response.set_cookie(
            key="captain-access-token",
            value=captain_token,
            httponly=True,
            samesite="lax",
            secure=False,
            max_age=settings.access_token_expire_minutes * 60,
        )

    return TeamInfo(
        team_id=team.team_id,
        title=team.title,
        description=team.description or "",
        captain=captain,
        participants=participants,
        password=password
    )



#------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

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
    
    user = await get_user_info_by_telegram_id(session=session, telegram_id=telegram_id)
    if user and user.in_team is not None:
        raise HTTPException(status_code=400, detail="User is already in a team")
    
    participants_list = team.participants_id or []
    if telegram_id in participants_list:
        raise HTTPException(status_code=400, detail="User is already a member of this team")

    if team.captain_id == telegram_id:
        raise HTTPException(status_code=400, detail="Captain cannot join as participant")
    
    participants_list.append(telegram_id)
    team = await add_participant(session=session, participants_id=participants_list, team=team)
    await update_user_in_team(session=session, telegram_id=telegram_id, team_id=team_id)
    
    captain = await get_user_info_by_telegram_id(session=session, 
                                                 telegram_id=team.captain_id)
    participants = [await get_user_info_by_telegram_id(session=session, 
                                                       telegram_id=participant_id) for participant_id in (team.participants_id or [])]
    
    return TeamInfo(
        team_id=team.team_id,
        title=team.title,
        description=team.description or "",
        captain=captain,
        participants=participants
    )


@router.post("/{team_id}/leave")
async def leave_team(
    team_id: int,
    session: AsyncSession = Depends(get_db),
    telegram_id: str = Depends(get_current_telegram_id)
) -> TeamInfo:
    team = await get_team_by_id(session=session, team_id=team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    if team.captain_id == telegram_id:
        raise HTTPException(status_code=400, detail="Captain cannot leave the team")
    
    participants_list = team.participants_id or []
    if telegram_id not in participants_list:
        raise HTTPException(status_code=400, detail="User is not a member of this team")
    
    participants_list.remove(telegram_id)
    team = await leave_team(session=session, participants_id=participants_list, team=team)
    
    # Убираем пользователя из команды (устанавливаем in_team = None)
    await update_user_in_team(session=session, telegram_id=telegram_id, team_id=None)
    
    captain = await get_user_info_by_telegram_id(session=session, 
                                                 telegram_id=team.captain_id)
    participants = [await get_user_info_by_telegram_id(session=session, 
                                                       telegram_id=participant_id) for participant_id in (team.participants_id or [])]
    
    return TeamInfo(
        team_id=team.team_id,
        title=team.title,
        description=team.description or "",
        captain=captain,
        participants=participants
    )

#------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

@router.post("/create", response_model=TeamInfo)
async def create_team(
    request: CreateTeam,
    response: Response,
    session: AsyncSession = Depends(get_db),
    captain_id: str = Depends(get_current_telegram_id)
) -> TeamInfo:
    user = await get_user_info_by_telegram_id(session=session, telegram_id=captain_id)
    if user and user.in_team is not None:
        raise HTTPException(status_code=400, detail="User is already in a team")
    
    password = str(generate_code())

    team = await create_team_service(
        session=session, 
        description=request.description or "",
        title=request.title, 
        captain_id=captain_id, 
        password=password
    )
    # Сохраняем team_id сразу, пока сессия активна
    team_id = team.team_id
    await update_user_in_team(session=session, telegram_id=captain_id, team_id=team_id)
    
    captain_token = jwt.encode(
        {"telegram_id": captain_id, "team_id": team_id, "exp": int(time.time()) + settings.access_token_expire_minutes * 60},
        settings.secret_key,
        algorithm=settings.algorithm
    )
    response.set_cookie(
        key="captain-access-token",
        value=captain_token,
        httponly=True,
        samesite="lax",
        secure=False,
        max_age=settings.access_token_expire_minutes * 60,
    )
    
    captain = await get_user_info_by_telegram_id(session=session, 
                                                 telegram_id=team.captain_id)
    participants = [await get_user_info_by_telegram_id(session=session, 
                                                       telegram_id=participant_id) for participant_id in (team.participants_id or [])]

    return TeamInfo(
        team_id=team_id,
        title=team.title,
        description=team.description or "",
        captain=captain,
        participants=participants
    )


@router.put("/{team_id}", response_model=TeamInfo)
async def update_team_info(
    team_id: int,
    request: UpdateTeam,
    session: AsyncSession = Depends(get_db),
    captain_id: str = Depends(verify_captain_access)
) -> TeamInfo:

    team = await get_team_by_id(session=session, team_id=team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    team = await update_team(
        session=session,
        team=team,
        title=request.title,
        description=request.description
    )
    
    captain = await get_user_info_by_telegram_id(session=session, 
                                                 telegram_id=team.captain_id)
    participants = [await get_user_info_by_telegram_id(session=session, 
                                                       telegram_id=participant_id) for participant_id in (team.participants_id or [])]
    
    return TeamInfo(
        team_id=team.team_id,
        title=team.title,
        description=team.description or "",
        captain=captain,
        participants=participants
    )

@router.delete("/{team_id}")
async def delete_team_info(
    team_id: int,
    session: AsyncSession = Depends(get_db),
    captain_id: str = Depends(verify_captain_access)
) -> dict:
    team = await get_team_by_id(session=session, team_id=team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    participants_list = team.participants_id or []
    for participant_id in participants_list:
        await update_user_in_team(session=session, telegram_id=participant_id, team_id=None)
    await update_user_in_team(session=session, telegram_id=team.captain_id, team_id=None)
    
    await delete_team(session=session, team=team)
    
    return {"detail": "Team deleted successfully"}