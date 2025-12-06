from __future__ import annotations
from typing import TYPE_CHECKING
from pydantic import BaseModel

if TYPE_CHECKING:
    from backend.api.profile.schemas import UserInfo

class ShortTeamInfo(BaseModel):
    team_id: int
    title: str
    description: str

class TeamInfo(BaseModel):
    team_id: int
    title: str
    description: str
    captain: UserInfo
    participants: list[UserInfo]
    password: str | None = None 

class CreateTeam(BaseModel):
    title: str
    description: str | None
    captain_id: str
    password: str

class EnterTeam(BaseModel):
    password: str
    participant_id: str

class EnterTeamRequest(BaseModel):
    password: str

class UpdateTeam(BaseModel):
    title: str
    description: str



import sys
if 'backend.api.profile.schemas' in sys.modules:
    from backend.api.profile.schemas import UserInfo
    TeamInfo.model_rebuild()




