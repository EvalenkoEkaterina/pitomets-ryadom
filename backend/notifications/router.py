import os
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import FileResponse
from pydantic import BaseModel, ConfigDict, Field

from notifications import repository
from notifications.service import send_test_notification

STATIC_DIR = Path(__file__).resolve().parent / "static"
router = APIRouter(tags=["web-push"])


class SubscriptionKeys(BaseModel):
    p256dh: str = Field(min_length=1)
    auth: str = Field(min_length=1)


class Subscription(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    endpoint: str = Field(min_length=1)
    expiration_time: float | None = Field(default=None, alias="expirationTime")
    keys: SubscriptionKeys


class UnsubscribeRequest(BaseModel):
    endpoint: str = Field(min_length=1)


@router.get("/web-push/", include_in_schema=False)
async def test_page():
    return FileResponse(STATIC_DIR / "index.html")


@router.get("/web-push/{filename}", include_in_schema=False)
async def browser_file(filename: str):
    if filename not in {"app.js", "style.css", "sw.js"}:
        raise HTTPException(status_code=404, detail="File not found")
    headers = {"Cache-Control": "no-cache"} if filename == "sw.js" else None
    return FileResponse(STATIC_DIR / filename, headers=headers)


@router.get("/api/push/vapid-public-key")
async def vapid_public_key():
    public_key = os.getenv("VAPID_PUBLIC_KEY")
    if not public_key:
        raise HTTPException(status_code=500, detail="VAPID_PUBLIC_KEY is not set")
    return {"publicKey": public_key}


@router.post("/api/push/subscriptions", status_code=201)
async def subscribe(subscription: Subscription, request: Request):
    expiration_time = None
    if subscription.expiration_time is not None:
        expiration_time = datetime.fromtimestamp(
            subscription.expiration_time / 1000, tz=timezone.utc
        )
    await repository.save_subscription(
        subscription.endpoint,
        subscription.keys.p256dh,
        subscription.keys.auth,
        expiration_time,
        request.headers.get("user-agent"),
    )
    return {"message": "Subscription saved"}


@router.delete("/api/push/subscriptions")
async def delete_subscription(subscription: UnsubscribeRequest):
    disabled = await repository.unsubscribe(subscription.endpoint)
    return {"message": "Subscription disabled", "disabled": disabled}


@router.post("/api/push/send-test")
async def send_test():
    try:
        report = await send_test_notification()
    except RuntimeError as error:
        raise HTTPException(status_code=500, detail=str(error)) from error

    if report["total"] == 0:
        raise HTTPException(status_code=400, detail="No active subscriptions")
    if report["sent"] == 0:
        raise HTTPException(status_code=502, detail={"report": report})
    return {"message": "Push sent", **report}

