import logging
import os

import asyncpg
from dotenv import load_dotenv
from pydantic import BaseModel

logger = logging.getLogger(__name__)
load_dotenv()  # переменные
pool = None
DATABASE_URL = os.getenv("DATABASE_URL")


async def startup():
    """
    Открытие пулла -> подготовка к работе с базой
    """
    global pool

    pool = await asyncpg.create_pool(DATABASE_URL, min_size=1, max_size=5)
    async with pool.acquire() as conn:
        await conn.execute("""
    CREATE TABLE IF NOT EXISTS lost_pets (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    species VARCHAR(50) NOT NULL,
    street VARCHAR(100) NOT NULL,
    photo_url VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active'
    );""")


async def shutdown():
    """
    Закрытие пулла, препятствие для утечки данных
    """
    if pool is not None:
        await pool.close()
    else:
        logger.error("ОШИБКА: Пул соединений не был инициализирован при выключении.")


class FurCreate(BaseModel):
    name: str | None = None
    species: str
    street: str
