import asyncio
import json
import os
from pathlib import Path

from pywebpush import WebPushException, webpush

from notifications import repository
from notifications.geo import select_nearby

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
        timeout=10,
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
                # Не возвращаем endpoint и ключи из текста исключения наружу.
                report["errors"].append(f"Push service error: {status_code or 'network'}")

    return report


async def send_announcement(pet_id: int, latitude: float, longitude: float,
                            title: str, body: str) -> dict:
    """Вызывается общим backend только после публикации объявления."""
    frontend_url = os.getenv("FRONTEND_URL", "").rstrip("/")
    if not frontend_url or not os.getenv("VAPID_CLAIMS_SUB"):
        raise RuntimeError("Set FRONTEND_URL and VAPID_CLAIMS_SUB")
    _private_key()
    recipients = select_nearby(await repository.get_active_subscriptions(), latitude, longitude)
    return await send_to_recipients(pet_id, recipients, title, body,
                                    f"{frontend_url}/#/pets/{pet_id}")


async def send_to_recipients(pet_id: int, recipients: list[dict], title: str,
                             body: str, url: str, stage: int = 1) -> dict:
    report = {"selected": len(recipients), "sent": 0, "skipped": 0, "failed": 0}
    payload = json.dumps({"title": title, "body": body, "url": url})
    claims_sub = os.getenv("VAPID_CLAIMS_SUB")
    if not claims_sub:
        raise RuntimeError("VAPID_CLAIMS_SUB is not set")
    _private_key()
    for subscription in recipients:
        endpoint = subscription["endpoint"]
        if not await repository.reserve_delivery(pet_id, endpoint, stage):
            report["skipped"] += 1
            continue
        try:
            # Проверяем ещё раз: человек мог отписаться после выбора получателей.
            if not (await repository.subscription_state(endpoint))["is_active"]:
                await repository.finish_delivery(pet_id, endpoint, stage, "cancelled")
                report["skipped"] += 1
                continue
            await asyncio.to_thread(_send, subscription, payload, claims_sub)
            await repository.finish_delivery(pet_id, endpoint, stage, "sent")
            report["sent"] += 1
        except WebPushException as error:
            if error.response is not None and error.response.status_code in (404, 410):
                await repository.unsubscribe(endpoint)
            await repository.finish_delivery(pet_id, endpoint, stage, "failed")
            report["failed"] += 1
        except (OSError, ValueError):
            await repository.finish_delivery(pet_id, endpoint, stage, "failed")
            report["failed"] += 1
    return report

