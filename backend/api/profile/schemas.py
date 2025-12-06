from typing import Optional, List
from pydantic import BaseModel


class UserInfo(BaseModel):
    telegram_id: str
    fullname: str
    pic: str
    role: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None



class UserUpdate(BaseModel):
    role: Optional[str] = None
    fullname: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None

