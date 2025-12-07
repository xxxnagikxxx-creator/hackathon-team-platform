from sqlalchemy import Column, Integer, TEXT, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from backend.api.database import Base


class Team(Base):
    __tablename__ = 'teams'
    
    team_id = Column(Integer, primary_key=True, autoincrement=True)
    hackathon_id = Column(Integer, ForeignKey('hackathons.hack_id'), nullable=False, index=True)
    password = Column(TEXT, nullable=False)

    title = Column(TEXT, nullable=False)
    description = Column(TEXT, nullable=False)

    captain_id = Column(TEXT, nullable=False)  # Храним как строку
    participants_id = Column(JSONB, nullable=True)  # Список строк




