from sqlalchemy import Column, TEXT, DateTime, INTEGER, JSON
from backend.database import Base
from datetime import datetime



class User(Base):
    __tablename__ = 'users'
    id = Column(INTEGER, primary_key=True, autoincrement=True)
    telegram_id = Column(TEXT, unique=True, nullable=False)


    username = Column(TEXT, nullable=True)
    fullname = Column(TEXT, nullable=True)
    description = Column(TEXT, nullable=True)
    tags = Column(JSON, nullable=True)



    date_registration = Column(DateTime, default=datetime.utcnow)

