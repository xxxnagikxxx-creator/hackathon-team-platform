from pathlib import Path
import base64


from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_db
from backend.profile.schemas import UserInfo, UserUpdate
from backend.profile.service import get_user_info_by_telegram_id, update_user_info, all_users_info
from backend.depends import get_current_telegram_id


router = APIRouter(prefix="/participants", tags=["participants"])
BASE_DIR = Path(__file__).resolve().parent.parent
AVATAR_DIR = BASE_DIR / "data" / "avatars"
AVATAR_DIR.mkdir(parents=True, exist_ok=True)
SUPPORTED_AVATAR_EXT = (".jpg", ".jpeg", ".png", ".webp", ".gif")


def load_avatar(telegram_id: str) -> bytes:
    for ext in SUPPORTED_AVATAR_EXT:
        candidate = AVATAR_DIR / f"{telegram_id}{ext}"
        if candidate.exists():
            return candidate.read_bytes()
    return b""



@router.get("", response_model=list[UserInfo])
async def user_profile(
    session: AsyncSession = Depends(get_db),
):
    users = await all_users_info(session=session)

    return [
        UserInfo(
            telegram_id=user.telegram_id,
            fullname=user.fullname or "",
            description=user.description or "",
            pic=base64.b64encode(load_avatar(user.telegram_id)).decode(),
            tags=user.tags or [],
        )
        for user in users if user
    ]

@router.get("/{telegram_id}", response_model=UserInfo)
async def user_profile(
    telegram_id: str,
    session: AsyncSession = Depends(get_db),
) -> UserInfo:
    user = await get_user_info_by_telegram_id(session=session, telegram_id=telegram_id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return UserInfo(
        telegram_id=user.telegram_id,
        fullname=user.fullname or "",
        description=user.description or "",
        pic=base64.b64encode(load_avatar(user.telegram_id)).decode(),
        tags=user.tags or [],
    )


@router.post("/{telegram_id}", response_model=UserInfo)
async def update_user_profile(
    telegram_id: str,
    data: UserUpdate,
    response: Response,
    session: AsyncSession = Depends(get_db),
    current_telegram_id: str = Depends(get_current_telegram_id),
) -> UserInfo:
    if current_telegram_id != telegram_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    user = await get_user_info_by_telegram_id(session=session, telegram_id=telegram_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if data.fullname is not None:
        user.fullname = data.fullname
    if data.description is not None:
        user.description = data.description
    if data.tags is not None:
        user.tags = data.tags

    await session.commit()
    await session.refresh(user)

    response.headers["X-User-Id"] = user.telegram_id

    return UserInfo(
        telegram_id=user.telegram_id,
        fullname=user.fullname or "",
        description=user.description or "",
        pic=base64.b64encode(load_avatar(user.telegram_id)).decode(),
        tags=user.tags or [],
    )

