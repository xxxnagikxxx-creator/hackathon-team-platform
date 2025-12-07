from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text, and_
from backend.api.models import User
from backend.api.profile.schemas import UserUpdate, UserInfo
from backend.api.profile.utils import get_avatar_base64, parse_tags

async def all_users_info(session: AsyncSession) -> list[User]:
    result = await session.execute(select(User))
    return result.scalars().all()

async def get_user_info_by_telegram_id(session: AsyncSession, telegram_id: str) -> User | None:
    telegram_id_str = str(telegram_id).strip()
    result = await session.execute(
        select(User).where(User.telegram_id == telegram_id_str)
    )
    user = result.scalars().first()
    return user


def user_to_user_info(user: User) -> UserInfo:
    return UserInfo(
        telegram_id=str(user.telegram_id) if user.telegram_id else "",
        fullname=(user.fullname or user.username or "").strip(),
        username=user.username,
        description=(user.description or "").strip() if user.description else "",
        role=user.role,
        pic=get_avatar_base64(user.avatar),
        tags=parse_tags(user.tags),
        team=None
    )

async def update_user_info(session: AsyncSession, user: User, data: UserUpdate) -> User:
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info(f"update_user_info: Получены данные для обновления: fullname={data.fullname}, username={data.username}, role={data.role}, description={data.description}, tags={data.tags}")
    logger.info(f"update_user_info: Текущие данные пользователя: fullname={user.fullname}, username={user.username}, role={user.role}")
    
    # Обновляем username и fullname синхронно
    if data.username is not None and data.username.strip() != '':
        old_username = user.username
        old_fullname = user.fullname
        username_value = data.username.strip()
        user.username = username_value
        user.fullname = username_value  # Синхронизируем fullname с username
        logger.info(f"update_user_info: Обновлено username: '{old_username}' -> '{user.username}'")
        logger.info(f"update_user_info: Обновлено fullname: '{old_fullname}' -> '{user.fullname}'")
    elif data.fullname is not None and data.fullname.strip() != '' and (data.username is None or data.username.strip() == ''):
        # Fallback на fullname только если username НЕ передан или пустой
        old_username = user.username
        old_fullname = user.fullname
        fullname_value = data.fullname.strip()
        user.username = fullname_value  # Синхронизируем username с fullname
        user.fullname = fullname_value
        logger.info(f"update_user_info: Обновлено username из fullname: '{old_username}' -> '{user.username}'")
        logger.info(f"update_user_info: Обновлено fullname: '{old_fullname}' -> '{user.fullname}'")
    else:
        logger.info(f"update_user_info: username/fullname не обновляются (data.username={data.username}, data.fullname={data.fullname})")
    
    if data.description is not None:
        user.description = data.description
    if data.tags is not None:
        user.tags = data.tags
    if data.role is not None and data.role.strip() != '':
        old_role = user.role
        user.role = data.role.strip()
        logger.info(f"update_user_info: Обновлено role: '{old_role}' -> '{user.role}'")

    await session.commit()
    await session.refresh(user)
    logger.info(f"update_user_info: После commit - fullname={user.fullname}, username={user.username}, role={user.role}")
    return user

async def update_user_in_team(session: AsyncSession, telegram_id: str, team_id: int | None) -> User | None:
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info(f"update_user_in_team: Обновление пользователя telegram_id={telegram_id}, team_id={team_id}")
    
    user = await get_user_info_by_telegram_id(session=session, telegram_id=telegram_id)
    if not user:
        logger.error(f"update_user_in_team: Пользователь не найден: telegram_id={telegram_id}")
        return None
    
    logger.info(f"update_user_in_team: Пользователь найден, текущий in_team={user.in_team}")
    user.in_team = team_id
    
    try:
        await session.commit()
        await session.refresh(user)
        logger.info(f"update_user_in_team: Пользователь обновлен, новый in_team={user.in_team}")
        return user
    except Exception as e:
        logger.error(f"update_user_in_team: Ошибка при обновлении: {type(e).__name__}: {str(e)}", exc_info=True)
        await session.rollback()
        raise


async def get_user_team_for_hackathon(session: AsyncSession, telegram_id: str, hackathon_id: int) -> int | None:
    """Проверяет, состоит ли пользователь в команде для данного хакатона.
    Проверяет как капитана команды, так и участника."""
    user = await get_user_info_by_telegram_id(session=session, telegram_id=telegram_id)
    if not user:
        return None
    
    # Сначала проверяем, является ли пользователь капитаном команды для этого хакатона
    from backend.api.teams.service import get_captain_team_for_hackathon
    captain_team = await get_captain_team_for_hackathon(
        session=session,
        captain_id=telegram_id,
        hackathon_id=hackathon_id
    )
    if captain_team and captain_team.team_id:
        return captain_team.team_id
    
    # Затем проверяем поле hackathon_teams (для участников)
    hackathon_teams = user.hackathon_teams or {}
    team_id_from_teams = hackathon_teams.get(str(hackathon_id)) or hackathon_teams.get(hackathon_id)
    if team_id_from_teams:
        return team_id_from_teams
    
    from backend.api.teams.models import Team
    result = await session.execute(
        select(Team).where(Team.hackathon_id == hackathon_id)
    )
    teams = result.scalars().all()
    
    for team in teams:
        participants_list = team.participants_id or []
        # Нормализуем telegram_id для сравнения
        telegram_id_str = str(telegram_id).strip()
        for p_id in participants_list:
            if str(p_id).strip() == telegram_id_str:
                return team.team_id
    
    return None


async def update_user_team_for_hackathon(
    session: AsyncSession,
    telegram_id: str,
    hackathon_id: int,
    team_id: int | None,
    commit: bool = True,
    update_count: bool = True
) -> User | None:
    
    user = await get_user_info_by_telegram_id(session=session, telegram_id=telegram_id)
    if not user:
        return None
    
    # Убеждаемся, что hackathon_teams - это словарь
    hackathon_teams = user.hackathon_teams
    if hackathon_teams is None:
        hackathon_teams = {}
    elif not isinstance(hackathon_teams, dict):
        # Если это не словарь, преобразуем
        hackathon_teams = dict(hackathon_teams) if hackathon_teams else {}
    
    was_participating = str(hackathon_id) in hackathon_teams or hackathon_id in hackathon_teams
    will_be_participating = team_id is not None
    
    # Создаем новый словарь, чтобы гарантировать обновление
    updated_teams = dict(hackathon_teams)
    
    if team_id is None:
        hackathon_id_str = str(hackathon_id)
        if hackathon_id_str in updated_teams:
            del updated_teams[hackathon_id_str]
        if hackathon_id in updated_teams:
            del updated_teams[hackathon_id]
    else:
        updated_teams[str(hackathon_id)] = team_id
    
    user.hackathon_teams = updated_teams
    
    try:
        if commit:
            await session.commit()
            await session.refresh(user)
        else:
            await session.flush()
        
        # Обновляем счетчик участников хакатона, если участие изменилось
        # Это должно происходить ПОСЛЕ коммита изменений пользователя
        if update_count and was_participating != will_be_participating:
            import logging
            logger = logging.getLogger(__name__)
            logger.info(f"update_user_team_for_hackathon: Участие изменилось для hackathon_id={hackathon_id}, было={was_participating}, будет={will_be_participating}")
            
            from backend.api.hackathons.service import update_participants_count, get_hack_by_id
            # Используем update_count=False чтобы избежать двойного обновления
            hackathon = await get_hack_by_id(session=session, hack_id=hackathon_id, update_count=False)
            if hackathon:
                logger.info(f"update_user_team_for_hackathon: Обновление счетчика для hackathon_id={hackathon_id}")
                await update_participants_count(session=session, hackathon=hackathon, commit=commit)
            else:
                logger.warning(f"update_user_team_for_hackathon: Хакатон не найден для hackathon_id={hackathon_id}")
        
        return user
    except Exception as e:
        if commit:
            await session.rollback()
        raise

