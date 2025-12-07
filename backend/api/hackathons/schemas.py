from pydantic import BaseModel
from datetime import date
from typing import Optional

class HackInfo(BaseModel):
    hack_id: int
    title: str
    description: str
    pic: str
    event_date: date  
    start_date: date
    end_date: date
    location: Optional[str] = None
    participants_count: int = 0
    max_participants: Optional[int] = None

class CreateHack(BaseModel):
    title: str
    description: str
    pic: str
    event_date: date  
    start_date: date
    end_date: date
    location: Optional[str] = None
    max_participants: Optional[int] = None

class UpdateHackInfo(BaseModel):
    title: str
    description: str
    pic: str
    event_date: date  
    start_date: date
    end_date: date
    location: Optional[str] = None
    max_participants: Optional[int] = None

