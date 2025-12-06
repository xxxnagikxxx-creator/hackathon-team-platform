from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.api.database import create_all_tables
from backend.api.config import settings
from backend.api.redis.redis_client import redis_client
from backend.api.profile.router import router as profile_router
from backend.api.hackathons.router import router as hackathons_router
from backend.api.admin.router import router as admin_router
from backend.api.teams.router import router as teams_router


import jwt
import time

app = FastAPI(title="ITAMHack API", prefix="/api")


from backend.api.profile.schemas import UserInfo
from backend.api.teams.schemas import TeamInfo, ShortTeamInfo
UserInfo.model_rebuild()
TeamInfo.model_rebuild()

app.include_router(admin_router, prefix="/api")
app.include_router(profile_router, prefix="/api")
app.include_router(hackathons_router, prefix="/api")
app.include_router(teams_router, prefix="/api")


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5175",
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-User-Id", "X-User-Name", "Editable"],
)
SECRET = settings.secret_key


class CodeInput(BaseModel):
    code: str

@app.on_event("startup")
async def on_startup():
    await create_all_tables()



@app.post("/login-by-code")
async def login_by_code(data: CodeInput, response: Response):
    key = data.code

    telegram_id_str = await redis_client.get(key)

    if telegram_id_str is None:
        raise HTTPException(status_code=400, detail="Неверный или просроченный код")

    await redis_client.delete(key)
    telegram_id = telegram_id_str.decode() if isinstance(telegram_id_str, bytes) else telegram_id_str

    token = jwt.encode(
        {"telegram_id": telegram_id, "exp": int(time.time()) + settings.access_token_expire_minutes * 60},
        SECRET,
        algorithm=settings.algorithm
    )

    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        samesite="lax",
        secure=False,
        max_age=settings.access_token_expire_minutes * 60,
    )

    return {"detail": "Успешный вход, токен сохранён в куки"}





