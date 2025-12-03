from backend.redis.redis_client import redis_client
from backend.config import settings


async def create_login_code(code: str, telegram_id: str) -> str:
    expire_time = settings.auth_code_expire
    await redis_client.setex(code, expire_time, str(telegram_id))
    return code