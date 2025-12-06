from datetime import datetime, timedelta
import jwt
from backend.api.config import settings
from passlib.context import CryptContext


def create_admin_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    to_encode.update({"exp": int(expire.timestamp())})
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)



pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)
def hash_password(password):
    return pwd_context.hash(password)
