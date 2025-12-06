from fastapi import APIRouter, Depends, Response, HTTPException
from backend.api.database import get_db
from backend.api.admin.services import get_admin
from sqlalchemy.ext.asyncio import AsyncSession
from backend.api.admin.schemas import AdminLogin
from backend.api.admin.utils import create_admin_access_token, verify_password

router = APIRouter(prefix='/admin', tags=['admin'])


@router.post("/login")
async def admin_login(
    data: AdminLogin,
    response: Response,
    session: AsyncSession = Depends(get_db),
):
    admin = await get_admin(session=session, email=data.email)

    if not admin or not verify_password(data.password, admin.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_admin_access_token({"sub": str(admin.id)})
    response.set_cookie(
        key="admin_access_token",
        value=token,
        httponly=True,
        samesite="lax",
        max_age=60*60*24,
        secure=False
    )

    return {"message": "Logged in"}


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("admin_access_token")
    return {"message": "Logged out"}

