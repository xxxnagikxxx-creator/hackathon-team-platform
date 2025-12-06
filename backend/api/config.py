from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from typing import Optional
from pathlib import Path
BASE_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = BASE_DIR / '.env'

class Settings(BaseSettings):
    redis_host: str
    redis_port: int
    redis_password: Optional[str]
    redis_db: int
    redis_ssl: bool

    @classmethod
    def validate_redis_password(cls, v):
        if v == "" or (isinstance(v, str) and not v.strip()):
            return None
        return v
    
    @property
    def redis_password_value(self) -> Optional[str]:
        if self.redis_password and isinstance(self.redis_password, str) and self.redis_password.strip():
            return self.redis_password.strip()
        return None

    temp_token_expire: int = 3600
    auth_code_expire: int = 300

    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 30

    bot_token: str

    database_url: Optional[str] = None

    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE),
        env_file_encoding='utf-8',
        extra='ignore'
    )

settings = Settings()
