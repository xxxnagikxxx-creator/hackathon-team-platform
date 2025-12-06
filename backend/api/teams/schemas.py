from pydantic import BaseModel
from backend.api.models import User

class ShortTeamInfo(BaseModel):
    team_id: int
    title: str
    description: str


class TeamInfo(BaseModel):
    team_id: int
    title: str
    description: str
    captain: User
    participants: list[User]

class CreateTeam(BaseModel):
    title: str
    description: str | None
    captain_id: int
    password: str

class EnterTeam(BaseModel):
    password: str
    participant_id: int

class UpdateTeam(BaseModel):
    title: str
    description: str




