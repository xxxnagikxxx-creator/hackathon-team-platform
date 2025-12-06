from sqlalchemy import Column, Integer, TEXT
from backend.api.database import Base

class Admin(Base):
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(TEXT, unique=True, nullable=False)
    password_hash = Column(TEXT, nullable=False)


