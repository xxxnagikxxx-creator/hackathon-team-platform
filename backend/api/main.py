from fastapi import FastAPI, HTTPException, Response, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from backend.api.database import create_all_tables, get_db
from backend.api.config import settings
from backend.api.redis.redis_client import redis_client
from backend.api.profile.router import router as profile_router
from backend.api.hackathons.router import router as hackathons_router
from backend.api.admin.router import router as admin_router
from backend.api.teams.router import router as teams_router
from backend.api.profile.service import get_user_info_by_telegram_id
from backend.api.bot.services import create_user


import jwt
import time


app = FastAPI(title="ITAMHack API")


from backend.api.profile.schemas import UserInfo
from backend.api.teams.schemas import TeamInfo, ShortTeamInfo
UserInfo.model_rebuild()
TeamInfo.model_rebuild()

# CORS origins - добавляем продакшен домены
cors_origins = [
    "http://localhost:5175",
    "http://localhost:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "http://89.169.160.161",
    "http://89.169.160.161:80",
    "http://89.169.160.161:8000",
]

# Добавляем origins из переменной окружения, если есть
import os
if os.getenv("CORS_ORIGINS"):
    cors_origins.extend(os.getenv("CORS_ORIGINS").split(","))

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-User-Id", "X-User-Name", "Editable"],
)

# Middleware для логирования всех запросов
@app.middleware("http")
async def log_requests(request, call_next):
    response = await call_next(request)
    return response


class CodeInput(BaseModel):
    code: str = Field(..., min_length=1, max_length=20, description="Код для входа")
from fastapi import APIRouter
auth_router = APIRouter(prefix="/api", tags=["auth"])

@auth_router.post("/login-by-code")
async def login_by_code(
    data: CodeInput, 
    response: Response,
    session: AsyncSession = Depends(get_db)
):
    code = data.code.strip()
    if not code:
        raise HTTPException(status_code=400, detail="Код не может быть пустым")
    if len(code) < 4 or len(code) > 20:
        raise HTTPException(status_code=400, detail="Неверный формат кода")
    
    try:
        telegram_id_str = await redis_client.get(code)
        if telegram_id_str is None:
            raise HTTPException(status_code=400, detail="Неверный или просроченный код")
        if isinstance(telegram_id_str, bytes):
            telegram_id = telegram_id_str.decode('utf-8')
        else:
            telegram_id = str(telegram_id_str).strip()
        if not telegram_id:
            raise HTTPException(status_code=400, detail="Неверный формат данных в коде")
        await redis_client.delete(code)
        user = await get_user_info_by_telegram_id(session=session, telegram_id=telegram_id)
        if not user:
            try:
                user = await create_user(
                    session=session,
                    telegram_id=telegram_id,
                    username=None,
                    fullname=f"User {telegram_id}",
                )
                await get_user_info_by_telegram_id(session=session, telegram_id=telegram_id)
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Ошибка создания пользователя: {str(e)}")

        
        token = jwt.encode(
            {
                "telegram_id": telegram_id,
                "exp": int(time.time()) + settings.access_token_expire_minutes * 60
            },
            settings.secret_key,
            algorithm=settings.algorithm
        )
        response.set_cookie(
            key="access_token",
            value=token,
            httponly=True,
            samesite="lax",
            secure=False,
            max_age=settings.access_token_expire_minutes * 60,
            path="/",
        )
        return {
            "detail": "Успешный вход, токен сохранён в куки",
            "telegram_id": telegram_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail="Внутренняя ошибка сервера при обработке кода"
        )


@auth_router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(
        key="access_token",
        httponly=True,
        samesite="lax",
        secure=False,
    )

    response.delete_cookie(
        key="captain-access-token",
        httponly=True,
        samesite="lax",
        secure=False,
    )
    
    return {"detail": "Успешный выход из системы"}


app.include_router(auth_router)
app.include_router(admin_router, prefix="/api")
app.include_router(profile_router, prefix="/api")
app.include_router(hackathons_router, prefix="/api")
app.include_router(teams_router, prefix="/api")


@app.on_event("startup")
async def on_startup():
    await create_all_tables()




