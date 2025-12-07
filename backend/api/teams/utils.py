from backend.api.teams.models import Team
from backend.api.teams.schemas import TeamInfo, TeamInvitationInfo
from backend.api.teams.invitation_models import TeamInvitation
from backend.api.profile.service import get_user_info_by_telegram_id, user_to_user_info
from sqlalchemy.ext.asyncio import AsyncSession


def normalize_telegram_id(telegram_id: str | int) -> str:
    return str(telegram_id).strip()


def find_participant_in_list(participants_list: list[str], telegram_id: str) -> tuple[bool, str | None]:
    telegram_id_str = normalize_telegram_id(telegram_id)
    for p_id in participants_list:
        if normalize_telegram_id(p_id) == telegram_id_str:
            return True, normalize_telegram_id(p_id)
    return False, None


def invitation_to_info(invitation: TeamInvitation, default_requested_by: str = 'captain') -> TeamInvitationInfo:
    return TeamInvitationInfo(
        invitation_id=invitation.invitation_id,
        team_id=invitation.team_id,
        hackathon_id=invitation.hackathon_id,
        captain_id=invitation.captain_id,
        participant_id=invitation.participant_id,
        status=invitation.status,
        requested_by=getattr(invitation, 'requested_by', default_requested_by),
        created_at=invitation.created_at,
        updated_at=invitation.updated_at
    )


async def build_team_info(
    session: AsyncSession,
    team: Team,
    include_password: bool = False
) -> TeamInfo:
    captain_user = await get_user_info_by_telegram_id(session=session, telegram_id=team.captain_id)
    if not captain_user:
        raise ValueError(f"Team captain not found: {team.captain_id}")
    
    captain_info = user_to_user_info(captain_user)
    
    participants_info = []
    for participant_id in (team.participants_id or []):
        participant_user = await get_user_info_by_telegram_id(session=session, telegram_id=participant_id)
        if participant_user:
            try:
                participants_info.append(user_to_user_info(participant_user))
            except Exception:
                continue
    
    return TeamInfo(
        team_id=team.team_id,
        hackathon_id=team.hackathon_id,
        title=team.title,
        description=team.description or "",
        captain=captain_info,
        participants=participants_info,
        password=team.password if include_password else None
    )
