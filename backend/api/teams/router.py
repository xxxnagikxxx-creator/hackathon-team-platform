from fastapi import APIRouter, Depends, HTTPException, Response, Query, Path
from sqlalchemy.ext.asyncio import AsyncSession
from random import choices
from backend.api.profile.schemas import UserInfo

from backend.api.profile.service import (
    get_user_info_by_telegram_id,
    get_user_team_for_hackathon,
    update_user_team_for_hackathon,
    user_to_user_info
)
from backend.api.hackathons.service import get_hack_by_id
from backend.api.hackathons.service import update_participants_count
from backend.api.depends import get_current_telegram_id, verify_captain_access, get_optional_telegram_id
from backend.api.database import get_db
from backend.api.teams.schemas import (
    TeamInfo, CreateTeam, UpdateTeam, ShortTeamInfo,
    TeamInvitationInfo, SendInvitationRequest, AcceptInvitationResponse
)
from backend.api.teams.service import (
    all_teams, get_team_by_id, get_teams_by_hackathon,
    create_team as create_team_service, add_participant, remove_participant,
    leave_team, update_team, delete_team, get_captain_team_for_hackathon
)
from backend.api.teams.invitation_service import (
    create_invitation, get_invitation_by_id, update_invitation_status,
    get_pending_invitations_for_participant, get_invitation_by_team_and_participant,
    get_invitations_by_team, cancel_invitations_for_team
)
from backend.api.config import settings
import jwt
import time


router = APIRouter(prefix="/teams", tags=["teams"])


def generate_code() -> str:
    return ''.join(choices('0123456789', k=6))

@router.get("", response_model=list[ShortTeamInfo])
async def all_teams_info(
    hackathon_id: int | None = None,
    session: AsyncSession = Depends(get_db),
):
    if hackathon_id:
        teams = await get_teams_by_hackathon(session=session, hackathon_id=hackathon_id)
    else:
        teams = await all_teams(session=session)

    return [
        ShortTeamInfo(
            team_id=team.team_id,
            hackathon_id=team.hackathon_id,
            title=team.title or "",
            description=team.description or "",
        )
        for team in teams if team
    ]

@router.get("/{team_id}", response_model=TeamInfo)
async def get_team_info(
    team_id: int,
    response: Response,
    session: AsyncSession = Depends(get_db),
    current_telegram_id: str | None = Depends(get_optional_telegram_id)
) -> TeamInfo:
    team = await get_team_by_id(session=session, team_id=team_id)

    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    

    
    captain_user = await get_user_info_by_telegram_id(session=session, telegram_id=team.captain_id)
    if not captain_user:
        raise HTTPException(status_code=404, detail="Team captain not found")
    
    try:
        captain_info = user_to_user_info(captain_user)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating captain info: {str(e)}")

    participants_info = []
    for participant_id in (team.participants_id or []):
        participant_user = await get_user_info_by_telegram_id(session=session, telegram_id=participant_id)
        if participant_user:
            try:
                participants_info.append(user_to_user_info(participant_user))
            except Exception as e:
                continue

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
        hackathon_id=team.hackathon_id,
        title=team.title,
        description=team.description or "",
        captain=captain_info,
        participants=participants_info,
        password=password
    )



#------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

@router.post("/{team_id}/leave")
async def leave_team_endpoint(
    team_id: int,
    session: AsyncSession = Depends(get_db),
    telegram_id: str = Depends(get_current_telegram_id)
) -> TeamInfo:
    try:
        team = await get_team_by_id(session=session, team_id=team_id)
        if not team:
            raise HTTPException(status_code=404, detail="Team not found")

        if team.captain_id == telegram_id:
            raise HTTPException(status_code=400, detail="Captain cannot leave the team. Delete the team instead.")
        
        participants_list = team.participants_id or []
        telegram_id_str = str(telegram_id).strip()
        participant_found = False
        for p_id in participants_list:
            if str(p_id).strip() == telegram_id_str:
                participant_found = True
                telegram_id = str(p_id).strip()
                break
        
        if not participant_found:
            raise HTTPException(status_code=400, detail="User is not a member of this team")
        participants_list = [p_id for p_id in participants_list if str(p_id).strip() != telegram_id_str]
        team = await leave_team(session=session, participants_id=participants_list, team=team, commit=False)
        await update_user_team_for_hackathon(
            session=session,
            telegram_id=telegram_id,
            hackathon_id=team.hackathon_id,
            team_id=None,
            commit=False,
            update_count=True
        )
        await session.commit()
        await session.refresh(team)
        captain_user = await get_user_info_by_telegram_id(session=session, 
                                                     telegram_id=team.captain_id)
        if not captain_user:
            raise HTTPException(status_code=404, detail="Team captain not found")
        try:
            captain_info = user_to_user_info(captain_user)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error creating captain info: {str(e)}")
        
        participants_info = []
        for participant_id in (team.participants_id or []):
            participant_user = await get_user_info_by_telegram_id(session=session, telegram_id=participant_id)
            if participant_user:
                try:
                    participants_info.append(user_to_user_info(participant_user))
                except Exception as e:
                    continue

        return TeamInfo(
            team_id=team.team_id,
            hackathon_id=team.hackathon_id,
            title=team.title,
            description=team.description or "",
            captain=captain_info,
            participants=participants_info
        )
    except HTTPException:
        await session.rollback()
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Error leaving team: {str(e)}")


@router.post("/{team_id}/remove-participant/{participant_id}", response_model=TeamInfo)
async def remove_participant_endpoint(
    team_id: int,
    participant_id: str,
    session: AsyncSession = Depends(get_db),
    captain_id: str = Depends(verify_captain_access)
) -> TeamInfo:
    try:
        team = await get_team_by_id(session=session, team_id=team_id)
        if not team:
            raise HTTPException(status_code=404, detail="Team not found")
        participant_id_str = str(participant_id).strip()
        if str(team.captain_id).strip() == participant_id_str:
            raise HTTPException(status_code=400, detail="Cannot remove captain from team")
        participant_user = await get_user_info_by_telegram_id(session=session, telegram_id=participant_id_str)
        if not participant_user:
            raise HTTPException(status_code=404, detail="Participant not found")
        

        participants_list = team.participants_id or []
        participant_found = False
        for p_id in participants_list:
            if str(p_id).strip() == participant_id_str:
                participant_found = True
                participant_id = str(p_id).strip()
                break
        
        if not participant_found:
            raise HTTPException(status_code=400, detail="User is not a member of this team")
        
        participants_list = [p_id for p_id in participants_list if str(p_id).strip() != participant_id_str]
        team = await remove_participant(session=session, participants_id=participants_list, team=team, commit=False)

        await update_user_team_for_hackathon(
            session=session,
            telegram_id=participant_id,
            hackathon_id=team.hackathon_id,
            team_id=None,
            commit=False,
            update_count=True
        )
        
        await session.commit()
        await session.refresh(team)
        
        captain_user = await get_user_info_by_telegram_id(session=session, telegram_id=team.captain_id)
        if not captain_user:
            raise HTTPException(status_code=404, detail="Team captain not found")
        try:
            captain_info = user_to_user_info(captain_user)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error creating captain info: {str(e)}")
        
        participants_info = []
        for p_id in (team.participants_id or []):
            p_user = await get_user_info_by_telegram_id(session=session, telegram_id=p_id)
            if p_user:
                try:
                    participants_info.append(user_to_user_info(p_user))
                except Exception as e:
                    continue

        return TeamInfo(
            team_id=team.team_id,
            hackathon_id=team.hackathon_id,
            title=team.title,
            description=team.description or "",
            captain=captain_info,
            participants=participants_info
        )
    except HTTPException:
        await session.rollback()
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Error removing participant: {str(e)}")


#------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

@router.post("/create", response_model=TeamInfo)
async def create_team(
    request: CreateTeam,
    response: Response,
    session: AsyncSession = Depends(get_db),
    captain_id: str = Depends(get_current_telegram_id)
) -> TeamInfo:
    try:


        if not hasattr(request, 'hackathon_id') or request.hackathon_id is None:
            raise HTTPException(status_code=400, detail="hackathon_id is required")
        hackathon = await get_hack_by_id(session=session, hack_id=request.hackathon_id, update_count=False)
        if not hackathon:
            raise HTTPException(status_code=404, detail="Hackathon not found")
        

        
        user = await get_user_info_by_telegram_id(session=session, telegram_id=captain_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        

        existing_captain_team = await get_captain_team_for_hackathon(
            session=session, 
            captain_id=captain_id, 
            hackathon_id=request.hackathon_id
        )
        if existing_captain_team is not None:
            raise HTTPException(
                status_code=400, 
                detail=f"You are already a captain of a team (team_id={existing_captain_team.team_id}, title={existing_captain_team.title}) for this hackathon"
            )
        
        existing_team_id = await get_user_team_for_hackathon(
            session=session, 
            telegram_id=captain_id, 
            hackathon_id=request.hackathon_id
        )
        if existing_team_id is not None:
            raise HTTPException(
                status_code=400, 
                detail=f"You are already in a team (team_id={existing_team_id}) for this hackathon. Please leave your current team first before creating a new one."
            )
        password = str(generate_code())

        team = await create_team_service(
            session=session, 
            description=request.description or "",
            title=request.title, 
            captain_id=captain_id, 
            password=password,
            hackathon_id=request.hackathon_id
        )
        team_id = team.team_id
        if team_id is None:
            await session.rollback()
            raise HTTPException(status_code=500, detail="Failed to create team: team_id is None")
        hackathon_teams = user.hackathon_teams or {}
        if not isinstance(hackathon_teams, dict):
            hackathon_teams = dict(hackathon_teams) if hackathon_teams else {}
        hackathon_teams[str(request.hackathon_id)] = team_id
        user.hackathon_teams = hackathon_teams
        await session.flush()
        try:
            captain_info = user_to_user_info(user)
        except Exception as e:
            await session.rollback()
            raise HTTPException(status_code=500, detail=f"Error creating captain info: {str(e)}")
        
        participants_info = []
        for participant_id in (team.participants_id or []):
            participant = await get_user_info_by_telegram_id(session=session, telegram_id=participant_id)
            if participant:
                try:
                    participants_info.append(user_to_user_info(participant))
                except Exception as e:
                    continue
        await session.commit()
        await session.refresh(team)
        await session.refresh(user)
        
        try:
            hackathon = await get_hack_by_id(session=session, hack_id=request.hackathon_id, update_count=False)
            if hackathon:
                await update_participants_count(session=session, hackathon=hackathon)
        except Exception:
            pass
        
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
            path="/"
        )
        
        try:
            team_info = TeamInfo(
                team_id=team_id,
                hackathon_id=request.hackathon_id,
                title=team.title,
                description=team.description or "",
                captain=captain_info,
                participants=participants_info
            )
            return team_info
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error creating TeamInfo response: {str(e)}")
    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating team: {type(e).__name__}: {str(e)}")


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
    
    captain_user = await get_user_info_by_telegram_id(session=session, 
                                                 telegram_id=team.captain_id)
    if not captain_user:
        raise HTTPException(status_code=404, detail="Team captain not found")
    try:
        captain_info = user_to_user_info(captain_user)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating captain info: {str(e)}")

    participants_info = []
    for participant_id in (team.participants_id or []):
        participant_user = await get_user_info_by_telegram_id(session=session, telegram_id=participant_id)
        if participant_user:
            try:
                participants_info.append(user_to_user_info(participant_user))
            except Exception as e:
                continue

    return TeamInfo(
        team_id=team.team_id,
        hackathon_id=team.hackathon_id,
        title=team.title,
        description=team.description or "",
        captain=captain_info,
        participants=participants_info
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
    hackathon_id = team.hackathon_id
    
    await cancel_invitations_for_team(session=session, team_id=team_id, commit=False)
    
    for participant_id in participants_list:
        await update_user_team_for_hackathon(
            session=session,
            telegram_id=participant_id,
            hackathon_id=hackathon_id,
            team_id=None,
            commit=False,
            update_count=False
        )
    await update_user_team_for_hackathon(
        session=session,
        telegram_id=team.captain_id,
        hackathon_id=hackathon_id,
        team_id=None,
        commit=False,
        update_count=False
    )
    await delete_team(session=session, team=team, commit=False)
    
    try:
        from backend.api.hackathons.service import update_participants_count
        hackathon = await get_hack_by_id(session=session, hack_id=hackathon_id, update_count=False)
        if hackathon:
            await update_participants_count(session=session, hackathon=hackathon, commit=False)
    except Exception:
        pass
    
    await session.commit()
    
    return {"detail": "Team deleted successfully"}


#------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


@router.post("/{team_id}/invite", response_model=TeamInvitationInfo)
async def send_invitation(
    team_id: int,
    request: SendInvitationRequest,
    session: AsyncSession = Depends(get_db),
    captain_id: str = Depends(verify_captain_access)
) -> TeamInvitationInfo:
    team = await get_team_by_id(session=session, team_id=team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    participant_user = await get_user_info_by_telegram_id(session=session, telegram_id=request.participant_id)
    if not participant_user:
        raise HTTPException(status_code=404, detail="Participant not found")
    
    if request.participant_id == captain_id:
        raise HTTPException(status_code=400, detail="Cannot invite yourself")
    
    existing_team_id = await get_user_team_for_hackathon(
        session=session,
        telegram_id=request.participant_id,
        hackathon_id=team.hackathon_id
    )
    if existing_team_id is not None:
        raise HTTPException(
            status_code=400,
            detail=f"Participant is already in a team (team_id={existing_team_id}) for this hackathon"
        )
    
    existing_invitation = await get_invitation_by_team_and_participant(
        session=session,
        team_id=team_id,
        participant_id=request.participant_id
    )
    if existing_invitation:
        raise HTTPException(status_code=400, detail="Invitation already sent and pending")
    
    participants_list = team.participants_id or []
    if request.participant_id in participants_list:
        raise HTTPException(status_code=400, detail="Participant is already a member of this team")
    
    invitation = await create_invitation(
        session=session,
        team_id=team_id,
        hackathon_id=team.hackathon_id,
        captain_id=captain_id,
        participant_id=request.participant_id,
        requested_by='captain'
    )
    
    await session.commit()
    await session.refresh(invitation)
    
    return TeamInvitationInfo(
        invitation_id=invitation.invitation_id,
        team_id=invitation.team_id,
        hackathon_id=invitation.hackathon_id,
        captain_id=invitation.captain_id,
        participant_id=invitation.participant_id,
        status=invitation.status,
        requested_by=getattr(invitation, 'requested_by', 'captain'),
        created_at=invitation.created_at,
        updated_at=invitation.updated_at
    )


@router.get("/{team_id}/invitations", response_model=list[TeamInvitationInfo])
async def get_team_invitations(
    team_id: int,
    session: AsyncSession = Depends(get_db),
    current_telegram_id: str | None = Depends(get_optional_telegram_id)
) -> list[TeamInvitationInfo]:
    if current_telegram_id is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    team = await get_team_by_id(session=session, team_id=team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    if team.captain_id != current_telegram_id:
        raise HTTPException(status_code=403, detail="Only team captain can perform this action")
    
    invitations = await get_invitations_by_team(session=session, team_id=team_id)
    
    return [
        TeamInvitationInfo(
            invitation_id=inv.invitation_id,
            team_id=inv.team_id,
            hackathon_id=inv.hackathon_id,
            captain_id=inv.captain_id,
            participant_id=inv.participant_id,
            status=inv.status,
            requested_by=getattr(inv, 'requested_by', 'captain'),
            created_at=inv.created_at,
            updated_at=inv.updated_at
        )
        for inv in invitations
    ]


@router.get("/invitations/my", response_model=list[TeamInvitationInfo])
async def get_my_invitations(
    hackathon_id: int | None = Query(None, description="Optional hackathon ID to filter invitations"),
    session: AsyncSession = Depends(get_db),
    telegram_id: str = Depends(get_current_telegram_id)
) -> list[TeamInvitationInfo]:
    """Получить свои pending приглашения и запросы"""
    if hackathon_id:
        invitations = await get_pending_invitations_for_participant(
            session=session,
            participant_id=telegram_id,
            hackathon_id=hackathon_id
        )
    else:
        from backend.api.teams.invitation_models import TeamInvitation
        from sqlalchemy import select, and_
        result = await session.execute(
            select(TeamInvitation).where(
                and_(
                    TeamInvitation.participant_id == telegram_id,
                    TeamInvitation.status == 'pending'
                )
            )
        )
        invitations = result.scalars().all()
    
    return [
        TeamInvitationInfo(
            invitation_id=inv.invitation_id,
            team_id=inv.team_id,
            hackathon_id=inv.hackathon_id,
            captain_id=inv.captain_id,
            participant_id=inv.participant_id,
            status=inv.status,
            requested_by=getattr(inv, 'requested_by', 'captain'),
            created_at=inv.created_at,
            updated_at=inv.updated_at
        )
        for inv in invitations
    ]


@router.post("/invitations/{invitation_id}/accept", response_model=AcceptInvitationResponse)
async def accept_invitation(
    invitation_id: int,
    session: AsyncSession = Depends(get_db),
    telegram_id: str = Depends(get_current_telegram_id)
) -> AcceptInvitationResponse:
    invitation = await get_invitation_by_id(session=session, invitation_id=invitation_id)
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found")
    
    if invitation.requested_by != 'captain':
        raise HTTPException(status_code=400, detail="This is a join request, not an invitation. Only the captain can approve it.")
    
    if invitation.participant_id != telegram_id:
        raise HTTPException(status_code=403, detail="This invitation is not for you")
    
    if invitation.status != 'pending':
        raise HTTPException(status_code=400, detail=f"Invitation is already {invitation.status}")
    
    existing_team_id = await get_user_team_for_hackathon(
        session=session,
        telegram_id=telegram_id,
        hackathon_id=invitation.hackathon_id
    )
    if existing_team_id is not None:
        await update_invitation_status(session=session, invitation=invitation, status='declined', commit=True)
        raise HTTPException(
            status_code=400,
            detail=f"Already in a team (team_id={existing_team_id}) for this hackathon"
        )
    
    team = await get_team_by_id(session=session, team_id=invitation.team_id)
    if not team:
        await update_invitation_status(session=session, invitation=invitation, status='declined', commit=True)
        raise HTTPException(status_code=404, detail="Team not found")
    
    participants_list = team.participants_id or []
    if telegram_id not in participants_list:
        participants_list.append(telegram_id)
        team = await add_participant(session=session, participants_id=participants_list, team=team, commit=False)
    
    await update_user_team_for_hackathon(
        session=session,
        telegram_id=telegram_id,
        hackathon_id=invitation.hackathon_id,
        team_id=invitation.team_id,
        commit=False,
        update_count=True
    )
    
    invitation = await update_invitation_status(session=session, invitation=invitation, status='accepted', commit=False)
    
    await session.commit()
    await session.refresh(team)
    await session.refresh(invitation)
    
    return AcceptInvitationResponse(
        team_id=invitation.team_id,
        hackathon_id=invitation.hackathon_id,
        message="Invitation accepted successfully"
    )


@router.post("/invitations/{invitation_id}/decline")
async def decline_invitation(
    invitation_id: int,
    session: AsyncSession = Depends(get_db),
    telegram_id: str = Depends(get_current_telegram_id)
) -> dict:
    invitation = await get_invitation_by_id(session=session, invitation_id=invitation_id)
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found")
    
    team = await get_team_by_id(session=session, team_id=invitation.team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    if team.captain_id != telegram_id:
        raise HTTPException(status_code=403, detail="Only team captain can decline requests and invitations")
    
    if invitation.status != 'pending':
        raise HTTPException(status_code=400, detail=f"Invitation is already {invitation.status}")
    
    await update_invitation_status(session=session, invitation=invitation, status='declined', commit=True)
    
    return {"detail": "Invitation declined successfully"}


@router.post("/{team_id}/request-join", response_model=TeamInvitationInfo)
async def request_join_team(
    team_id: int,
    session: AsyncSession = Depends(get_db),
    telegram_id: str = Depends(get_current_telegram_id)
) -> TeamInvitationInfo:
    team = await get_team_by_id(session=session, team_id=team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    user = await get_user_info_by_telegram_id(session=session, telegram_id=telegram_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if team.captain_id == telegram_id:
        raise HTTPException(status_code=400, detail="You are already the captain of this team")
    
    existing_team_id = await get_user_team_for_hackathon(
        session=session,
        telegram_id=telegram_id,
        hackathon_id=team.hackathon_id
    )
    if existing_team_id is not None:
        raise HTTPException(
            status_code=400,
            detail=f"You are already in a team (team_id={existing_team_id}) for this hackathon"
        )
    
    participants_list = team.participants_id or []
    if telegram_id in participants_list:
        raise HTTPException(status_code=400, detail="You are already a member of this team")
    
    existing_invitation = await get_invitation_by_team_and_participant(
        session=session,
        team_id=team_id,
        participant_id=telegram_id
    )
    if existing_invitation:
        if existing_invitation.status == 'pending':
            raise HTTPException(status_code=400, detail="Request or invitation already sent and pending")
    
    invitation = await create_invitation(
        session=session,
        team_id=team_id,
        hackathon_id=team.hackathon_id,
        captain_id=team.captain_id,
        participant_id=telegram_id,
        requested_by='participant'
    )
    
    await session.commit()
    await session.refresh(invitation)
    
    return TeamInvitationInfo(
        invitation_id=invitation.invitation_id,
        team_id=invitation.team_id,
        hackathon_id=invitation.hackathon_id,
        captain_id=invitation.captain_id,
        participant_id=invitation.participant_id,
        status=invitation.status,
        requested_by=getattr(invitation, 'requested_by', 'participant'),
        created_at=invitation.created_at,
        updated_at=invitation.updated_at
    )


@router.post("/invitations/{invitation_id}/approve", response_model=AcceptInvitationResponse)
async def approve_join_request(
    invitation_id: int,
    session: AsyncSession = Depends(get_db),
    telegram_id: str = Depends(get_current_telegram_id)
) -> AcceptInvitationResponse:
    invitation = await get_invitation_by_id(session=session, invitation_id=invitation_id)
    if not invitation:
        raise HTTPException(status_code=404, detail="Request not found")
    
    if getattr(invitation, 'requested_by', 'captain') != 'participant':
        raise HTTPException(status_code=400, detail="This is an invitation, not a join request. Only the participant can accept it.")
    
    team = await get_team_by_id(session=session, team_id=invitation.team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    if team.captain_id != telegram_id:
        raise HTTPException(status_code=403, detail="Only team captain can approve join requests")
    
    if invitation.status != 'pending':
        raise HTTPException(status_code=400, detail=f"Request is already {invitation.status}")
    
    existing_team_id = await get_user_team_for_hackathon(
        session=session,
        telegram_id=invitation.participant_id,
        hackathon_id=invitation.hackathon_id
    )
    if existing_team_id is not None:
        await update_invitation_status(session=session, invitation=invitation, status='declined', commit=True)
        raise HTTPException(
            status_code=400,
            detail=f"User is already in a team (team_id={existing_team_id}) for this hackathon"
        )
    
    participants_list = team.participants_id or []
    if invitation.participant_id in participants_list:
        await update_invitation_status(session=session, invitation=invitation, status='declined', commit=True)
        raise HTTPException(status_code=400, detail="User is already a member of this team")
    
    participants_list.append(invitation.participant_id)
    team = await add_participant(session=session, participants_id=participants_list, team=team, commit=False)

    await update_user_team_for_hackathon(
        session=session,
        telegram_id=invitation.participant_id,
        hackathon_id=invitation.hackathon_id,
        team_id=invitation.team_id,
        commit=False,
        update_count=True
    )
    
    invitation = await update_invitation_status(session=session, invitation=invitation, status='accepted', commit=False)
    
    await session.commit()
    await session.refresh(team)
    await session.refresh(invitation)
    return AcceptInvitationResponse(
        team_id=invitation.team_id,
        hackathon_id=invitation.hackathon_id,
        message="Join request approved successfully"
    )