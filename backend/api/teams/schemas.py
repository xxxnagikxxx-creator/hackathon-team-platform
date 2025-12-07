from __future__ import annotations
from typing import TYPE_CHECKING
from pydantic import BaseModel
from datetime import datetime

if TYPE_CHECKING:
    from backend.api.profile.schemas import UserInfo

class ShortTeamInfo(BaseModel):
    team_id: int
    hackathon_id: int
    title: str
    description: str

class TeamInfo(BaseModel):
    team_id: int
    hackathon_id: int
    title: str
    description: str
    captain: UserInfo
    participants: list[UserInfo]
    password: str | None = None 

class CreateTeam(BaseModel):
    hackathon_id: int
    title: str
    description: str | None = None

class EnterTeam(BaseModel):
    password: str
    participant_id: str

class EnterTeamRequest(BaseModel):
    password: str

class UpdateTeam(BaseModel):
    title: str
    description: str
class TeamInvitationInfo(BaseModel):
    invitation_id: int
    team_id: int
    hackathon_id: int
    captain_id: str
    participant_id: str
    status: str
    requested_by: str = 'captain'
    created_at: datetime
    updated_at: datetime

class SendInvitationRequest(BaseModel):
    participant_id: str

class AcceptInvitationResponse(BaseModel):
    team_id: int
    hackathon_id: int
    message: str



import sys
if 'backend.api.profile.schemas' in sys.modules:
    from backend.api.profile.schemas import UserInfo
    TeamInfo.model_rebuild()




