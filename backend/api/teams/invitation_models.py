from sqlalchemy import Column, Integer, TEXT, ForeignKey, DateTime, Boolean
from sqlalchemy.sql import func
from backend.api.database import Base


class TeamInvitation(Base):
    __tablename__ = 'team_invitations'
    
    invitation_id = Column(Integer, primary_key=True, autoincrement=True)
    team_id = Column(Integer, ForeignKey('teams.team_id'), nullable=False, index=True)
    hackathon_id = Column(Integer, ForeignKey('hackathons.hack_id'), nullable=False, index=True)
    captain_id = Column(TEXT, nullable=False)
    participant_id = Column(TEXT, nullable=False, index=True)
    status = Column(TEXT, nullable=False, default='pending')
    requested_by = Column(TEXT, nullable=False, default='captain')
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
