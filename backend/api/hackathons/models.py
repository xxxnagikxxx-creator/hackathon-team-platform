from backend.api.database import Base
from sqlalchemy import TEXT, INTEGER, Column, DATE, LargeBinary

class Hackathon(Base):
    __tablename__='hackathons'

    hack_id = Column(INTEGER, nullable=False, autoincrement=True, primary_key=True)
    title = Column(TEXT, nullable=True)
    pic = Column(LargeBinary, nullable=True)
    description = Column(TEXT, nullable=True)
    event_date = Column(DATE, nullable=False)
