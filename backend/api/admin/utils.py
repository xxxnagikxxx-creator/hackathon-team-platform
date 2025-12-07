from datetime import datetime, timedelta
import jwt
import bcrypt
import hashlib
from backend.api.config import settings


def create_admin_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    to_encode.update({"exp": int(expire.timestamp())})
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


def _prepare_password(password: str) -> bytes:
    """
    Подготовка пароля для bcrypt.
    Если пароль длиннее 72 байт, применяем SHA-256 хеширование для обхода ограничения bcrypt.
    """
    password_bytes = password.encode('utf-8')
    
    if len(password_bytes) > 72:
        # Используем SHA-256 для длинных паролей, чтобы обойти ограничение bcrypt в 72 байта
        # Это стандартный подход для работы с длинными паролями
        return hashlib.sha256(password_bytes).digest()
    
    return password_bytes


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Проверка пароля"""
    try:
        password_bytes = _prepare_password(plain_password)
        hash_bytes = hashed_password.encode('utf-8') if isinstance(hashed_password, str) else hashed_password
        return bcrypt.checkpw(password_bytes, hash_bytes)
    except Exception as e:
        print(f"Error verifying password: {e}")
        return False


def hash_password(password: str) -> str:
    """Хеширование пароля без ограничения длины"""
    password_bytes = _prepare_password(password)
    hashed = bcrypt.hashpw(password_bytes, bcrypt.gensalt())
    return hashed.decode('utf-8')
