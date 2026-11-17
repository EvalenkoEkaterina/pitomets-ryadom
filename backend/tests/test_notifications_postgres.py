"""Run against an isolated database using PUSH_TEST_DATABASE_URL."""
import os
import unittest

import asyncpg

import database
from notifications import repository
from notifications.schema import CREATE_PUSH_SUBSCRIPTIONS_TABLE


@unittest.skipUnless(os.getenv("PUSH_TEST_DATABASE_URL"), "test PostgreSQL not configured")
class PostgreSQLSubscriptionTests(unittest.IsolatedAsyncioTestCase):
    async def test_subscription_lifecycle_across_pool_restart(self):
        url = os.environ["PUSH_TEST_DATABASE_URL"]
        original_pool = database.pool
        endpoint = "https://push.example/integration-test"
        database.pool = await asyncpg.create_pool(url)
        try:
            async with database.pool.acquire() as conn:
                await conn.execute(CREATE_PUSH_SUBSCRIPTIONS_TABLE)
                await conn.execute("DELETE FROM push_subscriptions WHERE endpoint=$1", endpoint)
            await repository.save_subscription(endpoint, "key-1", "auth-1", None, "test")
            await repository.save_subscription(endpoint, "key-2", "auth-2", None, "test")
            await database.pool.close()
            database.pool = await asyncpg.create_pool(url)
            rows = await repository.get_active_subscriptions()
            matching = [row for row in rows if row["endpoint"] == endpoint]
            self.assertEqual(len(matching), 1)
            self.assertEqual(matching[0]["p256dh"], "key-2")
            self.assertTrue(await repository.unsubscribe(endpoint))
            self.assertFalse(await repository.unsubscribe(endpoint))
            self.assertNotIn(endpoint, [row["endpoint"] for row in await repository.get_active_subscriptions()])
            await repository.save_subscription(endpoint, "key-3", "auth-3", None, "test")
            self.assertIn(endpoint, [row["endpoint"] for row in await repository.get_active_subscriptions()])
        finally:
            async with database.pool.acquire() as conn:
                await conn.execute("DELETE FROM push_subscriptions WHERE endpoint=$1", endpoint)
            await database.pool.close()
            database.pool = original_pool
