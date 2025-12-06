from sqlalchemy import Column, DateTime, Integer, TEXT, LargeBinary
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from backend.api.database import Base


class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    telegram_id = Column(TEXT, unique=True, nullable=False, index=True)
    username = Column(TEXT, nullable=True)
    fullname = Column(TEXT, nullable=True)
    description = Column(TEXT, nullable=True)
    role = Column(TEXT, nullable=True)
    tags = Column(JSONB, nullable=True)
    avatar = Column(LargeBinary, nullable=True)
    date_registration = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

