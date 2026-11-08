import json
import os
from pathlib import Path

from dotenv import load_dotenv
from pywebpush import WebPushException, webpush

BASE_DIR = Path(__file__).resolve().parent.parent
SUBSCRIPTIONS_FILE = BASE_DIR / "subscriptions.json"

load_dotenv(BASE_DIR / ".env")


def load_subscriptions() -> list:
    if not SUBSCRIPTIONS_FILE.exists():
        return []
    with open(SUBSCRIPTIONS_FILE, "r", encoding="utf-8") as file:
        return json.load(file)


def save_subscriptions(subscriptions: list) -> None:
    with open(SUBSCRIPTIONS_FILE, "w", encoding="utf-8") as file:
        json.dump(subscriptions, file, ensure_ascii=False, indent=2)


def send_to_all(title: str, body: str, url: str = "/?from=notification") -> dict:
    """Отправляет push всем сохранённым подпискам и возвращает отчёт."""
    private_key = os.getenv("VAPID_PRIVATE_KEY")
    claims_sub = os.getenv("VAPID_CLAIMS_SUB")

    if not private_key or not claims_sub:
        raise RuntimeError("В .env не заданы VAPID_PRIVATE_KEY или VAPID_CLAIMS_SUB")

    subscriptions = load_subscriptions()
    payload = json.dumps({"title": title, "body": body, "url": url})

    alive = []
    sent = 0
    removed = 0
    errors = []

    for subscription in subscriptions:
        short_endpoint = subscription["endpoint"][:45] + "..."
        try:
            response = webpush(
                subscription_info=subscription,
                data=payload,
                vapid_private_key=str(BASE_DIR / private_key),
                vapid_claims={"sub": claims_sub},
                ttl=60,
            )
            print(f"[push] OK {response.status_code} -> {short_endpoint}")
            sent += 1
            alive.append(subscription)

        except WebPushException as error:
            status = error.response.status_code if error.response is not None else None
            text = error.response.text if error.response is not None else ""
            print(f"[push] ERROR status={status} body={text} -> {short_endpoint}")

            if status in (404, 410):
                # подписка больше не действует — удаляем
                removed += 1
                continue

            alive.append(subscription)
            errors.append(f"{status}: {text or error}")

    if removed:
        save_subscriptions(alive)

    return {"sent": sent, "removed": removed, "errors": errors}