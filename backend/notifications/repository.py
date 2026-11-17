from datetime import datetime

import database


async def save_subscription(
    endpoint: str,
    p256dh: str,
    auth: str,
    expiration_time: datetime | None,
    user_agent: str | None,
) -> None:
    """Insert a subscription or refresh an existing endpoint."""
    query = """
        INSERT INTO push_subscriptions (
            endpoint, p256dh, auth, expiration_time, user_agent
        )
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (endpoint) DO UPDATE SET
            p256dh = EXCLUDED.p256dh,
            auth = EXCLUDED.auth,
            expiration_time = EXCLUDED.expiration_time,
            user_agent = EXCLUDED.user_agent,
            is_active = TRUE,
            updated_at = NOW();
    """
    async with database.pool.acquire() as connection:
        await connection.execute(
            query, endpoint, p256dh, auth, expiration_time, user_agent
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
        SELECT endpoint, p256dh, auth
        FROM push_subscriptions
        WHERE is_active = TRUE
        ORDER BY id;
    """
    async with database.pool.acquire() as connection:
        rows = await connection.fetch(query)
    return [dict(row) for row in rows]

