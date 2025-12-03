import asyncio
import logging
import sys
from pathlib import Path
from random import choices

from aiogram import Bot, Dispatcher, types
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.filters import CommandStart, Command
from aiogram.types import Message

from backend.bot.services import create_user, get_user_by_telegram_id
from backend.config import settings
from backend.database import async_session, create_all_tables
from backend.redis.redis_service import create_login_code


BASE_DIR = Path(__file__).resolve().parent.parent
AVATAR_DIR = BASE_DIR / "data" / "avatars"
AVATAR_DIR.mkdir(parents=True, exist_ok=True)


def generate_code() -> str:
    return ''.join(choices('0123456789', k=6))



TOKEN = settings.bot_token

bot = Bot(token=TOKEN, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
dp = Dispatcher()


@dp.message(CommandStart())
async def command_start_handler(message: Message) -> None:
    async with async_session() as session:
        telegram_id_str = str(message.from_user.id)
        user = await get_user_by_telegram_id(session=session, telegram_id=telegram_id_str)
        if user is None:
            await message.answer('Регистрация в системе...')
            await create_user(
                session=session,
                telegram_id=telegram_id_str,
                username=message.from_user.username,
                fullname=message.from_user.full_name
            )
            user_id = message.from_user.id
            photos = await bot.get_user_profile_photos(user_id)

            if photos.total_count > 0:
                avatar = photos.photos[0][-1]

                file = await bot.get_file(avatar.file_id)

                path = AVATAR_DIR / f"{user_id}.jpg"
                await bot.download_file(file.file_path, path)

        else:
            await message.answer('Ты уже зарегистрирован в системе!')


@dp.message(Command("login"))
async def login(message: types.Message):
    async with async_session() as session:
        telegram_id_str = str(message.from_user.id)
        user = await get_user_by_telegram_id(session=session, telegram_id=telegram_id_str)
        if user is None:
            await message.answer('Сначала зарегистрируйтесь! Используйте команду /start')
            return
        
        code = generate_code()
        await create_login_code(code, telegram_id_str)
        expire_minutes = settings.auth_code_expire // 60
        await message.answer(f"Ваш код для входа: {code}\nДействителен {expire_minutes} минут.")

@dp.message()
async def echo_handler(message: Message) -> None:
    try:
        await message.send_copy(chat_id=message.chat.id)
    except TypeError:
        await message.answer("Nice try!")

async def main() -> None:
    await create_all_tables()


    await dp.start_polling(bot)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, stream=sys.stdout)
    asyncio.run(main())