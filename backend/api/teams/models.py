from sqlalchemy import Column, Integer, TEXT
from sqlalchemy.dialects.postgresql import JSONB
from backend.api.database import Base


class Team(Base):
    __tablename__ = 'teams'
    
    team_id = Column(Integer, primary_key=True, autoincrement=True)
    password = Column(TEXT, nullable=False)


    title = Column(TEXT, nullable=True)
    description = Column(TEXT, nullable=True)


    captain_id = Column(TEXT, nullable=False)  # Храним как строку
    participants_id = Column(JSONB, nullable=True)  # Список строк




