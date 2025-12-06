import redis.asyncio as redis
from backend.api.config import settings

def create_redis_client():
    redis_config = {
        "host": settings.redis_host,
        "port": settings.redis_port,
        "db": settings.redis_db,
        "decode_responses": True
    }

    if settings.redis_ssl:
        redis_config["ssl"] = True

    password = settings.redis_password_value
    if password:
        redis_config["password"] = password
    
    return redis.Redis(**redis_config)

redis_client = create_redis_client()
