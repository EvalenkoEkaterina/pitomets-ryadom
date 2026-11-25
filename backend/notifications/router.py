import os
import secrets
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlsplit

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from fastapi.responses import FileResponse
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from notifications import repository
from notifications.service import send_announcement, send_test_notification

STATIC_DIR = Path(__file__).resolve().parent / "static"
router = APIRouter(tags=["web-push"])


class SubscriptionKeys(BaseModel):
    p256dh: str = Field(min_length=1)
    auth: str = Field(min_length=1)


class Subscription(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    endpoint: str = Field(min_length=1)
    expiration_time: float | None = Field(default=None, alias="expirationTime", ge=0,
                                          le=253402300799000, allow_inf_nan=False)
    keys: SubscriptionKeys
    latitude: float | None = Field(default=None, ge=-90, le=90, allow_inf_nan=False)
    longitude: float | None = Field(default=None, ge=-180, le=180, allow_inf_nan=False)

    @field_validator("endpoint")
    @classmethod
    def check_endpoint(cls, value):
        url = urlsplit(value)
        allowed = ("fcm.googleapis.com", "updates.push.services.mozilla.com", "push.apple.com")
        host = url.hostname or ""
        if (url.scheme != "https" or url.username or url.password or url.port not in (None, 443)
                or not any(host == domain or host.endswith("." + domain) for domain in allowed)):
            raise ValueError("Ожидается HTTPS endpoint push-сервиса Chrome, Firefox или Safari")
        return value

    @model_validator(mode="after")
    def check_point(self):
        if (self.latitude is None) != (self.longitude is None):
            raise ValueError("Передайте обе координаты")
        return self


class UnsubscribeRequest(BaseModel):
    endpoint: str = Field(min_length=1)


class LocationRequest(UnsubscribeRequest):
    latitude: float = Field(ge=-90, le=90, allow_inf_nan=False)
    longitude: float = Field(ge=-180, le=180, allow_inf_nan=False)


class AnnouncementRequest(BaseModel):
    pet_id: int = Field(gt=0)
    latitude: float = Field(ge=-90, le=90, allow_inf_nan=False)
    longitude: float = Field(ge=-180, le=180, allow_inf_nan=False)
    title: str = Field(min_length=1, max_length=80)
    body: str = Field(min_length=1, max_length=200)


def require_test_access(x_push_test_token: str | None = Header(default=None)):
    token = os.getenv("PUSH_TEST_TOKEN")
    if not token:
        raise HTTPException(status_code=404, detail="Test sending is disabled")
    if not x_push_test_token or not secrets.compare_digest(token, x_push_test_token):
        raise HTTPException(status_code=403, detail="Invalid test token")


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
        subscription.latitude,
        subscription.longitude,
    )
    return {"message": "Subscription saved"}


@router.post("/api/push/subscriptions/state")
async def subscription_state(subscription: UnsubscribeRequest):
    return await repository.subscription_state(subscription.endpoint)


@router.patch("/api/push/subscriptions/location")
async def update_location(location: LocationRequest):
    if not await repository.update_location(location.endpoint, location.latitude, location.longitude):
        raise HTTPException(status_code=404, detail="Active subscription not found")
    return {"message": "Location saved"}


@router.delete("/api/push/subscriptions")
async def delete_subscription(subscription: UnsubscribeRequest):
    disabled = await repository.unsubscribe(subscription.endpoint)
    return {"message": "Subscription disabled", "disabled": disabled}


@router.post("/api/push/send-test", dependencies=[Depends(require_test_access)])
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


@router.post("/api/push/send-announcement", dependencies=[Depends(require_test_access)])
async def send_announcement_test(announcement: AnnouncementRequest):
    try:
        return await send_announcement(**announcement.model_dump())
    except RuntimeError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error

