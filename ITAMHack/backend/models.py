from sqlalchemy import Column, String, DateTime, Integer, JSON
from sqlalchemy.sql import func
from backend.database import Base


class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    telegram_id = Column(String(31), unique=True, nullable=False, index=True)
    username = Column(String(255), nullable=True)
    fullname = Column(String(255), nullable=True)
    description = Column(String(2000), nullable=True)
    tags = Column(JSON, nullable=True)
    date_registration = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
