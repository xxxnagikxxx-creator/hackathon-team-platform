from typing import Optional, List
from pydantic import BaseModel


class UserInfo(BaseModel):
    telegram_id: str
    fullname: str
    description: str
    pic: str
    tags: list[str] | None = None


class UserUpdate(BaseModel):
    fullname: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None
