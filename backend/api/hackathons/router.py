from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from backend.api.depends import get_current_admin

from backend.api.hackathons.utils import get_pic_base64
from backend.api.admin.models import Admin
from backend.api.database import get_db
from backend.api.hackathons.schemas import HackInfo, UpdateHackInfo, CreateHack
from backend.api.hackathons.service import update_hack, create_hack, all_hacks, get_hack_by_id, delete_hack


router = APIRouter(prefix="/hackathons", tags=["hackathons"])




#Общедоступные методы -----------------------------------------------------------------------------------------------------------------
@router.get("", response_model=list[HackInfo])
async def all_hacks_info(
    session: AsyncSession = Depends(get_db),
):
    try:
        hacks = await all_hacks(session=session)

        result = []
        for hack in hacks:
            if hack:
                try:
                    result.append(HackInfo(
                        hack_id=hack.hack_id,
                        title=hack.title or "",
                        description=hack.description or "",
                        pic=get_pic_base64(hack.pic),
                        event_date=hack.event_date,
                        start_date=hack.start_date,
                        end_date=hack.end_date,
                        location=hack.location,
                        participants_count=int(getattr(hack, 'participants_count', 0) or 0),
                        max_participants=getattr(hack, 'max_participants', None)
                    ))
                except Exception as e:
                    # Если не удалось обработать один хакатон, пропускаем его
                    continue
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching hackathons: {str(e)}")

@router.get("/{hack_id}", response_model=HackInfo)
async def hack_info(
    hack_id: int,
    session: AsyncSession = Depends(get_db),
) -> HackInfo:
    hack = await get_hack_by_id(session=session, hack_id=hack_id)

    if not hack:
        raise HTTPException(status_code=404, detail="Hack not found")

    return HackInfo(
        hack_id=hack.hack_id,
        title=hack.title or "",
        description=hack.description or "",
        pic=get_pic_base64(hack.pic),
        event_date=hack.event_date,
        start_date=hack.start_date,
        end_date=hack.end_date,
        location=hack.location,
        participants_count=hack.participants_count or 0,
        max_participants=getattr(hack, 'max_participants', None)
    )
#-----------------------------------------------------------------------------------------------------------------------------------------


#Методы админа ---------------------------------------------------------------------------------------------------------------------------
@router.post("/{hack_id}/update_hack", response_model=HackInfo)
async def update_hack_info(
    hack_id: int,
    data: UpdateHackInfo,
    session: AsyncSession = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
) -> HackInfo:
    hack = await get_hack_by_id(session=session, hack_id=hack_id)
    if not hack:
        raise HTTPException(status_code=404, detail="Hack not found or already deleted")

    hack = await update_hack(
        session=session,
        hack=hack,
        title=data.title,
        description=data.description,
        pic=data.pic,
        event_date=data.event_date,
        start_date=data.start_date,
        end_date=data.end_date,
        location=data.location,
        max_participants=data.max_participants,
    )

    return HackInfo(
        hack_id=hack.hack_id,
        title=hack.title or "",
        description=hack.description or "",
        pic=get_pic_base64(hack.pic),
        event_date=hack.event_date,
        start_date=hack.start_date,
        end_date=hack.end_date,
        location=hack.location,
        participants_count=hack.participants_count or 0,
        max_participants=getattr(hack, 'max_participants', None)
    )


@router.post("/{hack_id}/delete_hack")
async def delete_hack_info(
    hack_id: int,
    session: AsyncSession = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
) -> dict[str, str]:
    hack = await get_hack_by_id(session=session, hack_id=hack_id)

    if not hack:
        raise HTTPException(status_code=404, detail="Hack not found")

    await delete_hack(session=session, hack=hack)

    return {"message": "Успешно удалено"}



@router.post("/create_hack", response_model=HackInfo)
async def create_hack_endpoint(
        data: CreateHack,
        session: AsyncSession = Depends(get_db),
        admin: Admin = Depends(get_current_admin)
) -> HackInfo:
    try:
        hack = await create_hack(
            session=session,
            title=data.title,
            description=data.description,
            pic=data.pic,
            event_date=data.event_date,
            start_date=data.start_date,
            end_date=data.end_date,
            location=data.location,
            max_participants=data.max_participants
        )
        pic_base64 = ""
        try:
            pic_base64 = get_pic_base64(hack.pic)
        except Exception:
            pic_base64 = ""

        hack_id = getattr(hack, 'hack_id', None)
        if hack_id is None:
            raise HTTPException(status_code=500, detail="Failed to create hack: hack_id is None")
        
        title = getattr(hack, 'title', None) or ""
        description = getattr(hack, 'description', None) or ""
        event_date = getattr(hack, 'event_date', None)
        start_date = getattr(hack, 'start_date', None)
        end_date = getattr(hack, 'end_date', None)
        location = getattr(hack, 'location', None)
        
        if event_date is None:
            raise HTTPException(status_code=500, detail="Failed to create hack: event_date is None")
        if start_date is None:
            raise HTTPException(status_code=500, detail="Failed to create hack: start_date is None")
        if end_date is None:
            raise HTTPException(status_code=500, detail="Failed to create hack: end_date is None")

        return HackInfo(
            hack_id=hack_id,
            title=title,
            description=description,
            pic=pic_base64,
            event_date=event_date,
            start_date=start_date,
            end_date=end_date,
            location=location,
            participants_count=getattr(hack, 'participants_count', 0) or 0,
            max_participants=getattr(hack, 'max_participants', None)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating hack: {str(e)}")


#-----------------------------------------------------------------------------------------------------------------------------------------



