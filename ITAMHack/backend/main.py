import asyncio

import uvicorn
from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.config import settings
from backend.redis.redis_client import redis_client
from backend.profile.router import router as profile_router

import jwt
import time

app = FastAPI()

app.include_router(profile_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-User-Id", "X-User-Name", "Editable"],
)
SECRET = settings.secret_key


class CodeInput(BaseModel):
    code: str


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




