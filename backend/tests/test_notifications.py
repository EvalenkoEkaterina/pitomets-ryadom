import os
import unittest
from unittest.mock import AsyncMock, patch

from pywebpush import WebPushException

from notifications import service


class NotificationServiceTests(unittest.IsolatedAsyncioTestCase):
    async def test_send_uses_active_subscriptions(self):
        subscription = {
            "endpoint": "https://push.example/subscription",
            "p256dh": "public-key",
            "auth": "auth-secret",
        }

        with (
            patch.dict(os.environ, {"VAPID_CLAIMS_SUB": "mailto:test@example.com"}),
            patch.object(
                service.repository,
                "get_active_subscriptions",
                AsyncMock(return_value=[subscription]),
            ),
            patch.object(service, "_send") as send,
        ):
            report = await service.send_test_notification()

        self.assertEqual(report["sent"], 1)
        self.assertEqual(report["total"], 1)
        send.assert_called_once()

    async def test_empty_database_returns_empty_report(self):
        with (
            patch.dict(os.environ, {"VAPID_CLAIMS_SUB": "mailto:test@example.com"}),
            patch.object(
                service.repository,
                "get_active_subscriptions",
                AsyncMock(return_value=[]),
            ),
        ):
            report = await service.send_test_notification()

        self.assertEqual(
            report,
            {"total": 0, "sent": 0, "removed": 0, "errors": []},
        )

    async def test_expired_subscription_is_disabled(self):
        subscription = {
            "endpoint": "https://push.example/expired",
            "p256dh": "public-key",
            "auth": "auth-secret",
        }
        response = type(
            "PushResponse",
            (),
            {"status_code": 410, "text": "Gone", "__bool__": lambda self: False},
        )()

        with (
            patch.dict(os.environ, {"VAPID_CLAIMS_SUB": "mailto:test@example.com"}),
            patch.object(
                service.repository,
                "get_active_subscriptions",
                AsyncMock(return_value=[subscription]),
            ),
            patch.object(
                service.repository, "unsubscribe", AsyncMock(return_value=True)
            ) as unsubscribe,
            patch.object(
                service,
                "_send",
                side_effect=WebPushException("expired", response=response),
            ),
        ):
            report = await service.send_test_notification()

        self.assertEqual(report["removed"], 1)
        self.assertEqual(report["sent"], 0)
        unsubscribe.assert_awaited_once_with(subscription["endpoint"])


if __name__ == "__main__":
    unittest.main()
