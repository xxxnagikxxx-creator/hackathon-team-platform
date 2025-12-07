from backend.api.database import Base
from sqlalchemy import TEXT, INTEGER, Column, DATE, LargeBinary

class Hackathon(Base):
    __tablename__='hackathons'

    hack_id = Column(INTEGER, nullable=False, autoincrement=True, primary_key=True)
    title = Column(TEXT, nullable=False)
    pic = Column(LargeBinary, nullable=True)
    description = Column(TEXT, nullable=False)
    event_date = Column(DATE, nullable=False)
    start_date = Column(DATE, nullable=False)
    end_date = Column(DATE, nullable=False)
    location = Column(TEXT, nullable=True)
    participants_count = Column(INTEGER, nullable=False, default=0)
    max_participants = Column(INTEGER, nullable=True)
