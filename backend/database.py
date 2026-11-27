import logging
import os

import asyncpg
from notifications.schema import CREATE_PUSH_SUBSCRIPTIONS_TABLE
from dotenv import load_dotenv
from pydantic import BaseModel, Field, field_validator

logger = logging.getLogger(__name__)
load_dotenv()
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
                report_type VARCHAR(20) DEFAULT 'lost',
                photo_url VARCHAR(255),
                comment VARCHAR(340) NOT NULL,
                contact_email VARCHAR(100) NOT NULL,
                status VARCHAR(20) DEFAULT 'active',
                found_at TIMESTAMPTZ
            );
        """)
        await conn.execute(CREATE_PUSH_SUBSCRIPTIONS_TABLE)

async def shutdown():
    if pool is not None:
        await pool.close()
    else:
        logger.error("ОШИБКА: Пул соединений не был инициализирован при выключении.")


class FurCreate(BaseModel):
    name: str | None = Field(default=None, max_length=100)
    species: str = Field(min_length=2, max_length=50)
    street: str = Field(min_length=2, max_length=100)
    report_type: str = Field(default="lost", pattern="^(lost|found)$")
    comment: str = Field(min_length=1, max_length=340)
    contact_email: str = Field(min_length=5, max_length=100)

    @field_validator("species")
    @classmethod
    def normalize_species(cls, v: str) -> str:
        return v.strip().lower()
