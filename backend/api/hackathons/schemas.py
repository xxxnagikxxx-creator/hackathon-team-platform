from pydantic import BaseModel
from datetime import date

class HackInfo(BaseModel):
    hack_id: int
    title: str
    description: str
    pic: str
    event_date: date

class CreateHack(BaseModel):
    title: str
    description: str
    pic: str
    event_date: date

class UpdateHackInfo(BaseModel):
    title: str
    description: str
    pic: str
    event_date: date

