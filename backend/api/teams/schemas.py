from pydantic import BaseModel
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

class CreateTeam(BaseModel):
    title: str
    description: str | None
    captain_id: int
    password: str

class EnterTeam(BaseModel):
    password: str
    participant_id: int

class EnterTeamRequest(BaseModel):
    password: str

class UpdateTeam(BaseModel):
    title: str
    description: str




