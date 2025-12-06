from __future__ import annotations
from typing import Optional, List, TYPE_CHECKING
from pydantic import BaseModel

if TYPE_CHECKING:
    from backend.api.teams.schemas import ShortTeamInfo


class UserInfo(BaseModel):
    telegram_id: str
    fullname: str
    pic: str
    role: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    team: Optional[ShortTeamInfo] = None 



class UserUpdate(BaseModel):
    role: Optional[str] = None
    fullname: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None



import sys
if 'backend.api.teams.schemas' in sys.modules:
    from backend.api.teams.schemas import ShortTeamInfo
    UserInfo.model_rebuild()

