from fastapi import Depends, Cookie, HTTPException
from backend.config import settings
import jwt

def get_current_telegram_id(
    access_token: str | None = Cookie(default=None)
) -> str:
    if access_token is None:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        payload = jwt.decode(access_token, settings.secret_key, algorithms=[settings.algorithm])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

    telegram_id = payload.get("telegram_id")
    if telegram_id is None:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    # Конвертируем в str, если пришло как int (для обратной совместимости)
    return str(telegram_id)