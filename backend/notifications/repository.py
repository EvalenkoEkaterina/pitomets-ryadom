from datetime import datetime

import database


async def save_subscription(
    endpoint: str,
    p256dh: str,
    auth: str,
    expiration_time: datetime | None,
    user_agent: str | None,
    latitude: float | None = None,
    longitude: float | None = None,
) -> None:
    """Insert a subscription or refresh an existing endpoint."""
    query = """
        INSERT INTO push_subscriptions (
            endpoint, p256dh, auth, expiration_time, user_agent, latitude, longitude
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (endpoint) DO UPDATE SET
            p256dh = EXCLUDED.p256dh,
            auth = EXCLUDED.auth,
            expiration_time = EXCLUDED.expiration_time,
            user_agent = EXCLUDED.user_agent,
            latitude = COALESCE(EXCLUDED.latitude, push_subscriptions.latitude),
            longitude = COALESCE(EXCLUDED.longitude, push_subscriptions.longitude),
            is_active = TRUE,
            updated_at = NOW();
    """
    async with database.pool.acquire() as connection:
        await connection.execute(
            query, endpoint, p256dh, auth, expiration_time, user_agent, latitude, longitude
        )


async def unsubscribe(endpoint: str) -> bool:
    query = """
        UPDATE push_subscriptions
        SET is_active = FALSE, updated_at = NOW()
        WHERE endpoint = $1 AND is_active = TRUE;
    """
    async with database.pool.acquire() as connection:
        result = await connection.execute(query, endpoint)
    return result != "UPDATE 0"


async def get_active_subscriptions() -> list[dict]:
    query = """
        SELECT endpoint, p256dh, auth, latitude, longitude
        FROM push_subscriptions
        WHERE is_active = TRUE
        ORDER BY id;
    """
    async with database.pool.acquire() as connection:
        rows = await connection.fetch(query)
    return [dict(row) for row in rows]


async def subscription_state(endpoint: str) -> dict:
    async with database.pool.acquire() as connection:
        row = await connection.fetchrow(
            "SELECT is_active, latitude, longitude FROM push_subscriptions WHERE endpoint=$1",
            endpoint,
        )
    return dict(row) if row else {"is_active": False, "latitude": None, "longitude": None}


async def update_location(endpoint: str, latitude: float, longitude: float) -> bool:
    async with database.pool.acquire() as connection:
        result = await connection.execute(
            """UPDATE push_subscriptions SET latitude=$2, longitude=$3, updated_at=NOW()
               WHERE endpoint=$1 AND is_active=TRUE""", endpoint, latitude, longitude
        )
    return result != "UPDATE 0"


async def reserve_delivery(pet_id: int, endpoint: str, stage: int) -> bool:
    # Уникальный ключ защищает и от двух одновременных запусков.
    async with database.pool.acquire() as connection:
        result = await connection.fetchval(
            """INSERT INTO push_deliveries (pet_id, endpoint, stage)
               VALUES ($1, $2, $3) ON CONFLICT DO NOTHING RETURNING pet_id""",
            pet_id, endpoint, stage,
        )
    return result is not None


async def finish_delivery(pet_id: int, endpoint: str, stage: int, status: str):
    async with database.pool.acquire() as connection:
        await connection.execute(
            "UPDATE push_deliveries SET status=$4 WHERE pet_id=$1 AND endpoint=$2 AND stage=$3",
            pet_id, endpoint, stage, status,
        )

