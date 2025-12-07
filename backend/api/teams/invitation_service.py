from backend.api.teams.invitation_models import TeamInvitation
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_


async def get_invitation_by_id(session: AsyncSession, invitation_id: int) -> TeamInvitation | None:
    result = await session.execute(
        select(TeamInvitation).where(TeamInvitation.invitation_id == invitation_id)
    )
    invitation = result.scalars().first()
    return invitation


async def get_pending_invitations_for_participant(session: AsyncSession, participant_id: str, hackathon_id: int) -> list[TeamInvitation]:
    result = await session.execute(
        select(TeamInvitation).where(
            and_(
                TeamInvitation.participant_id == participant_id,
                TeamInvitation.hackathon_id == hackathon_id,
                TeamInvitation.status == 'pending'
            )
        )
    )
    return result.scalars().all()


async def get_invitation_by_team_and_participant(session: AsyncSession, team_id: int, participant_id: str) -> TeamInvitation | None:
    result = await session.execute(
        select(TeamInvitation).where(
            and_(
                TeamInvitation.team_id == team_id,
                TeamInvitation.participant_id == participant_id,
                TeamInvitation.status == 'pending'
            )
        )
    )
    invitation = result.scalars().first()
    return invitation


async def create_invitation(
    session: AsyncSession,
    team_id: int,
    hackathon_id: int,
    captain_id: str,
    participant_id: str,
    requested_by: str = 'captain'
) -> TeamInvitation:
    new_invitation = TeamInvitation(
        team_id=team_id,
        hackathon_id=hackathon_id,
        captain_id=captain_id,
        participant_id=participant_id,
        status='pending',
        requested_by=requested_by
    )
    
    session.add(new_invitation)
    await session.flush()
    await session.refresh(new_invitation)
    
    return new_invitation


async def update_invitation_status(
    session: AsyncSession,
    invitation: TeamInvitation,
    status: str,
    commit: bool = True
) -> TeamInvitation:
    invitation.status = status
    if commit:
        await session.commit()
        await session.refresh(invitation)
    else:
        await session.flush()
    return invitation


async def get_invitations_by_team(session: AsyncSession, team_id: int) -> list[TeamInvitation]:
    result = await session.execute(
        select(TeamInvitation).where(TeamInvitation.team_id == team_id)
    )
    return result.scalars().all()


async def cancel_invitations_for_team(session: AsyncSession, team_id: int, commit: bool = True) -> None:
    """Отменить все pending приглашения для команды"""
    result = await session.execute(
        select(TeamInvitation).where(
            and_(
                TeamInvitation.team_id == team_id,
                TeamInvitation.status == 'pending'
            )
        )
    )
    invitations = result.scalars().all()
    for invitation in invitations:
        invitation.status = 'declined'
    if commit:
        await session.commit()
    else:
        await session.flush()
