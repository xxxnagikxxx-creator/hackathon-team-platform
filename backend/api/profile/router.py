from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.ext.asyncio import AsyncSession

from backend.api.database import get_db
from backend.api.profile.schemas import UserInfo, UserUpdate
from backend.api.profile.service import get_user_info_by_telegram_id, all_users_info, update_user_info
from backend.api.depends import get_current_telegram_id, check_user_editable
from backend.api.profile.utils import get_avatar_base64, parse_tags


router = APIRouter(prefix="/participants", tags=["participants"])


@router.get("", response_model=list[UserInfo])
async def all_user_profile(
    session: AsyncSession = Depends(get_db),
):
    users = await all_users_info(session=session)

    return [
        UserInfo(
            telegram_id=user.telegram_id,
            fullname=user.fullname or "",
            description=user.description or "",
            role=user.role,
            pic=get_avatar_base64(user.avatar),
            tags=parse_tags(user.tags),
        )
        for user in users if user
    ]

@router.get("/{telegram_id}", response_model=UserInfo)
async def user_profile(
    telegram_id: str,
    response: Response,
    session: AsyncSession = Depends(get_db),
    _: bool = Depends(check_user_editable),
) -> UserInfo:
    user = await get_user_info_by_telegram_id(session=session, telegram_id=telegram_id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return UserInfo(
        telegram_id=user.telegram_id,
        fullname=user.fullname or "",
        description=user.description or "",
        role=user.role,
        pic=get_avatar_base64(user.avatar),
        tags=parse_tags(user.tags),
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

    user = await update_user_info(session=session, user=user, data=data)

    response.headers["X-User-Id"] = user.telegram_id
    response.headers["Editable"] = "true"

    return UserInfo(
        telegram_id=user.telegram_id,
        fullname=user.fullname or "",
        description=user.description or "",
        role=user.role,
        pic=get_avatar_base64(user.avatar),
        tags=parse_tags(user.tags),
    )


