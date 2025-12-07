from fastapi import Cookie, Depends, HTTPException, Response, Path, Header
from typing import Annotated, Any
from backend.api.admin.models import Admin
from backend.api.config import settings
from backend.api.database import get_db
from backend.api.teams.service import get_team_by_id
from backend.api.teams.models import Team
from sqlalchemy.ext.asyncio import AsyncSession
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

    return str(telegram_id)


def get_optional_telegram_id(
    access_token: str | None = Cookie(default=None)
) -> str | None:
    if access_token is None:
        return None

    try:
        payload = jwt.decode(access_token, settings.secret_key, algorithms=[settings.algorithm])
        telegram_id = payload.get("telegram_id")
        return str(telegram_id) if telegram_id else None
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None


async def get_current_admin(
    admin_access_token: str | None = Cookie(default=None),
    session: AsyncSession = Depends(get_db),
):
    if not admin_access_token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        payload = jwt.decode(
            admin_access_token,
            settings.secret_key,
            algorithms=[settings.algorithm],
        )
        admin_id = payload.get("sub")
        if admin_id is None:
            raise HTTPException(status_code=401, detail="Invalid token payload")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

    admin = await session.get(Admin, int(admin_id))
    if not admin:
        raise HTTPException(status_code=401, detail="Admin not found")

    return admin


async def check_user_editable(
    telegram_id: Annotated[str, Path()],
    response: Response,
    current_telegram_id: str | None = Depends(get_optional_telegram_id),
) -> bool:
    is_editable = current_telegram_id is not None and current_telegram_id == telegram_id
    
    if is_editable:
        response.headers["Editable"] = "true"
        response.headers["X-User-Id"] = current_telegram_id
    
    return is_editable


async def verify_captain_access(
    team_id: Annotated[int, Path()],
    captain_access_token: str | None = Cookie(default=None, alias="captain-access-token"),
    session: AsyncSession = Depends(get_db),
    current_telegram_id: str | None = Depends(get_optional_telegram_id),
) -> str:
    if current_telegram_id is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    team = await get_team_by_id(session=session, team_id=team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Проверяем, что пользователь является капитаном команды
    if team.captain_id != current_telegram_id:
        raise HTTPException(status_code=403, detail="Only team captain can perform this action")
    
    # Если есть токен, проверяем его валидность (опционально)
    if captain_access_token:
        try:
            payload = jwt.decode(captain_access_token, settings.secret_key, algorithms=[settings.algorithm])
            token_telegram_id = payload.get("telegram_id")
            token_team_id = payload.get("team_id")
            
            if token_telegram_id != current_telegram_id:
                raise HTTPException(status_code=401, detail="Token telegram_id mismatch")
            
            if token_team_id != team_id:
                raise HTTPException(status_code=403, detail="Token team_id mismatch")
        except jwt.ExpiredSignatureError:
            pass
        except jwt.InvalidTokenError:
            pass
    
    return current_telegram_id


async def get_team_by_id_dependency(
    team_id: Annotated[int, Path()],
    session: AsyncSession = Depends(get_db),
) -> Team:
    """Зависимость для получения команды по ID с проверкой существования"""
    team = await get_team_by_id(session=session, team_id=team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return team
