from backend.api.hackathons.models import Hackathon
from backend.api.hackathons.utils import decode_pic_base64
from backend.api.models import User
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import date



async def count_participants_for_hackathon(session: AsyncSession, hackathon_id: int) -> int:
    """Подсчитывает количество участников для конкретного хакатона"""
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        # Используем более эффективный запрос с фильтрацией на стороне БД
        result = await session.execute(select(User))
        users = result.scalars().all()
        
        count = 0
        hackathon_id_str = str(hackathon_id)
        for user in users:
            hackathon_teams = user.hackathon_teams
            if hackathon_teams is None:
                hackathon_teams = {}
            elif not isinstance(hackathon_teams, dict):
                # Если это не словарь, преобразуем
                try:
                    hackathon_teams = dict(hackathon_teams) if hackathon_teams else {}
                except (TypeError, ValueError):
                    logger.warning(f"count_participants_for_hackathon: Не удалось преобразовать hackathon_teams для user {user.telegram_id}: {type(hackathon_teams)}")
                    hackathon_teams = {}
            
            # Проверяем оба формата ключа
            if hackathon_id_str in hackathon_teams:
                count += 1
                logger.debug(f"count_participants_for_hackathon: Найден участник {user.telegram_id} (ключ: {hackathon_id_str})")
            elif hackathon_id in hackathon_teams:
                count += 1
                logger.debug(f"count_participants_for_hackathon: Найден участник {user.telegram_id} (ключ: {hackathon_id})")
        
        logger.info(f"count_participants_for_hackathon: Итого участников для hackathon_id={hackathon_id}: {count}")
        return count
    except Exception as e:
        logger.error(f"count_participants_for_hackathon: Ошибка при подсчете участников: {type(e).__name__}: {str(e)}")
        # В случае ошибки возвращаем 0, чтобы не ломать запрос
        return 0


async def update_participants_count(session: AsyncSession, hackathon: Hackathon, commit: bool = True) -> None:
    """Обновляет счетчик участников для хакатона
    
    Args:
        session: Сессия базы данных
        hackathon: Объект хакатона для обновления
        commit: Если True, делает commit. Если False, только flush (для использования внутри транзакций)
    """
    import logging
    logger = logging.getLogger(__name__)
    
    old_count = getattr(hackathon, 'participants_count', None) or 0
    count = await count_participants_for_hackathon(session, hackathon.hack_id)
    
    # Убеждаемся, что count - это целое число
    count = int(count) if count is not None else 0
    
    hackathon.participants_count = count
    
    logger.info(f"update_participants_count: Обновление для hackathon_id={hackathon.hack_id}, старый счетчик={old_count}, новый счетчик={count}")
    
    try:
        await session.flush()  # Сначала flush для проверки ошибок
        if commit:
            await session.commit()
            await session.refresh(hackathon)
            
            # Проверяем, что значение действительно сохранилось
            final_count = getattr(hackathon, 'participants_count', None)
            logger.info(f"update_participants_count: Счетчик обновлен для hackathon_id={hackathon.hack_id}, participants_count в объекте={final_count}")
            
            if final_count != count:
                logger.warning(f"update_participants_count: ПРОБЛЕМА! Ожидали {count}, получили {final_count}")
    except Exception as e:
        logger.error(f"update_participants_count: Ошибка при обновлении счетчика: {type(e).__name__}: {str(e)}", exc_info=True)
        if commit:
            await session.rollback()
        raise


async def get_hack_by_id(session: AsyncSession, hack_id: int, update_count: bool = False) -> Hackathon | None:
    result = await session.execute(
        select(Hackathon).where(Hackathon.hack_id == hack_id)
    )
    hack = result.scalars().first()
    # По умолчанию не обновляем счетчик, чтобы избежать проблем с сессиями
    # Обновление происходит только при явном запросе и только в определенных случаях
    if hack and update_count:
        try:
            await update_participants_count(session, hack, commit=True)
        except Exception:
            # Если не удалось обновить счетчик, продолжаем без обновления
            pass
    return hack


async def all_hacks(session: AsyncSession) -> list[Hackathon]:
    result = await session.execute(select(Hackathon))
    hacks = result.scalars().all()
    # Не обновляем счетчики автоматически при получении списка
    # Счетчики обновляются только при изменении данных (создание/удаление команды)
    # Это предотвращает проблемы с сессиями и улучшает производительность
    return hacks


async def create_hack(
    session: AsyncSession, 
    description: str, 
    pic: str, 
    event_date: date, 
    title: str,
    start_date: date,
    end_date: date,
    location: str | None = None,
    max_participants: int | None = None
) -> Hackathon:
    pic_bytes = decode_pic_base64(pic)
    
    new_hack = Hackathon(
        title=title,
        pic=pic_bytes,
        description=description,
        event_date=event_date,
        start_date=start_date,
        end_date=end_date,
        location=location,
        participants_count=0, 
        max_participants=max_participants,
    )

    session.add(new_hack)
    await session.commit()
    await session.refresh(new_hack)
    try:
        await update_participants_count(session, new_hack)
    except Exception:
        # Если не удалось обновить счетчик, это не критично - он уже равен 0
        pass

    return new_hack


async def update_hack(
    session: AsyncSession, 
    hack: Hackathon, 
    title: str, 
    description: str, 
    pic: str, 
    event_date: date,
    start_date: date,
    end_date: date,
    location: str | None = None,
    max_participants: int | None = None
) -> Hackathon:
    pic_bytes = decode_pic_base64(pic)

    hack.title = title
    hack.description = description
    hack.pic = pic_bytes
    hack.event_date = event_date  # Оставляем для обратной совместимости
    hack.start_date = start_date
    hack.end_date = end_date
    hack.location = location
    hack.max_participants = max_participants

    await session.commit()
    await session.refresh(hack)
    # Обновляем счетчик участников после обновления
    try:
        await update_participants_count(session, hack)
    except Exception:
        pass

    return hack

async def delete_hack(session: AsyncSession, hack: Hackathon) -> None:
    """Удаляет хакатон и все связанные данные"""
    from backend.api.teams.models import Team
    from backend.api.teams.invitation_models import TeamInvitation
    from sqlalchemy import delete
    
    hackathon_id = hack.hack_id
    
    # Удаляем все приглашения для этого хакатона
    await session.execute(
        delete(TeamInvitation).where(TeamInvitation.hackathon_id == hackathon_id)
    )
    
    await session.execute(
        delete(Team).where(Team.hackathon_id == hackathon_id)
    )
    
    result = await session.execute(select(User))
    users = result.scalars().all()
    
    hackathon_id_str = str(hackathon_id)
    for user in users:
        hackathon_teams = user.hackathon_teams or {}
        if hackathon_id_str in hackathon_teams:
            del hackathon_teams[hackathon_id_str]
        if hackathon_id in hackathon_teams:
            del hackathon_teams[hackathon_id]
        user.hackathon_teams = hackathon_teams
    
    await session.delete(hack)
    await session.commit()
    session.expunge(hack)


