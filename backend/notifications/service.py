import asyncio
import json
import os
from pathlib import Path

from pywebpush import WebPushException, webpush

from notifications import repository

BACKEND_DIR = Path(__file__).resolve().parent.parent


def _private_key() -> str:
    value = os.getenv("VAPID_PRIVATE_KEY")
    if not value:
        raise RuntimeError("VAPID_PRIVATE_KEY is not set")

    if "BEGIN PRIVATE KEY" in value or "BEGIN EC PRIVATE KEY" in value:
        return value

    path = Path(value)
    if not path.is_absolute():
        path = BACKEND_DIR / path
    return str(path) if path.is_file() else value


def _send(subscription: dict, payload: str, claims_sub: str) -> None:
    webpush(
        subscription_info={
            "endpoint": subscription["endpoint"],
            "keys": {
                "p256dh": subscription["p256dh"],
                "auth": subscription["auth"],
            },
        },
        data=payload,
        vapid_private_key=_private_key(),
        vapid_claims={"sub": claims_sub},
        ttl=60,
    )


async def send_test_notification() -> dict:
    claims_sub = os.getenv("VAPID_CLAIMS_SUB")
    if not claims_sub:
        raise RuntimeError("VAPID_CLAIMS_SUB is not set")

    subscriptions = await repository.get_active_subscriptions()
    payload = json.dumps(
        {
            "title": "Питомец рядом",
            "body": "Тестовое Web Push уведомление",
            "url": "/web-push/?from=notification",
        }
    )
    report = {"total": len(subscriptions), "sent": 0, "removed": 0, "errors": []}

    for subscription in subscriptions:
        try:
            await asyncio.to_thread(_send, subscription, payload, claims_sub)
            report["sent"] += 1
        except WebPushException as error:
            status_code = (
                error.response.status_code if error.response is not None else None
            )
            if status_code in (404, 410):
                await repository.unsubscribe(subscription["endpoint"])
                report["removed"] += 1
            else:
                response_text = (
                    error.response.text if error.response is not None else str(error)
                )
                report["errors"].append(f"{status_code or 'network'}: {response_text}")

    return report

