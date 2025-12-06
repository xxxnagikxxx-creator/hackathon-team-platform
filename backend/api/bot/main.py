import asyncio
import logging
import sys
from random import choices

import aiohttp
from aiogram.exceptions import TelegramForbiddenError
from aiogram import Bot, Dispatcher, types
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.filters import CommandStart
from aiogram.types import Message

from backend.api.bot.services import create_user, get_user_by_telegram_id, update_user_avatar
from backend.api.config import settings
from backend.api.database import async_session
from backend.api.redis.redis_service import create_login_code


def generate_code() -> str:
    return ''.join(choices('0123456789', k=6))



TOKEN = settings.bot_token

bot = Bot(token=TOKEN, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
dp = Dispatcher()



async def echo_handler(message: types.Message):
    try:
        await message.send_copy(chat_id=message.chat.id)
    except TelegramForbiddenError:
        print(f"User {message.chat.id} blocked the bot.")


@dp.message(CommandStart())
async def command_start_handler(message: Message) -> None:
    async with async_session() as session:
        telegram_id_str = str(message.from_user.id)
        user = await get_user_by_telegram_id(session=session, telegram_id=telegram_id_str)
        if user is None:
            user = await create_user(
                session=session,
                telegram_id=telegram_id_str,
                username=message.from_user.username,
                fullname=message.from_user.full_name
            )
        
        if user.avatar is None:
            user_id = message.from_user.id
            photos = await bot.get_user_profile_photos(user_id)

            if photos.total_count > 0:
                avatar = photos.photos[0][-1]
                file = await bot.get_file(avatar.file_id)
                
                file_url = f"https://api.telegram.org/file/bot{TOKEN}/{file.file_path}"
                async with aiohttp.ClientSession() as http_session:
                    async with http_session.get(file_url) as response:
                        avatar_data = await response.read()
                
                await update_user_avatar(session=session, user=user, avatar_bytes=avatar_data)

    telegram_id_str = str(message.from_user.id)
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
    await dp.start_polling(bot)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, stream=sys.stdout)
    asyncio.run(main())
