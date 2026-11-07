from pathlib import Path
import os

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from app.sender import load_subscriptions, save_subscriptions, send_to_all

BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "app" / "static"

app = FastAPI(title="Web Push Experiment")
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


class SubscriptionRequest(BaseModel):
    endpoint: str
    keys: dict


class UnsubscribeRequest(BaseModel):
    endpoint: str


@app.get("/")
def index():
    return FileResponse(STATIC_DIR / "index.html")


@app.get("/sw.js")
def service_worker():
    return FileResponse(
        STATIC_DIR / "sw.js",
        media_type="application/javascript",
        headers={"Cache-Control": "no-cache"},
    )


@app.get("/api/vapid-public-key")
def get_vapid_public_key():
    public_key = os.getenv("VAPID_PUBLIC_KEY")
    if not public_key:
        raise HTTPException(status_code=500, detail="VAPID_PUBLIC_KEY не задан в .env")
    return {"publicKey": public_key}


@app.post("/api/subscribe")
def subscribe(subscription: SubscriptionRequest):
    if not {"p256dh", "auth"} <= subscription.keys.keys():
        raise HTTPException(status_code=422, detail="В подписке нет ключей p256dh/auth")

    subscriptions = load_subscriptions()
    data = subscription.model_dump()

    for index, item in enumerate(subscriptions):
        if item["endpoint"] == subscription.endpoint:
            subscriptions[index] = data  # обновляем ключи
            break
    else:
        subscriptions.append(data)

    save_subscriptions(subscriptions)
    return {"message": "Подписка сохранена", "total": len(subscriptions)}


@app.post("/api/unsubscribe")
def unsubscribe(request: UnsubscribeRequest):
    subscriptions = [s for s in load_subscriptions() if s["endpoint"] != request.endpoint]
    save_subscriptions(subscriptions)
    return {"message": "Подписка удалена", "total": len(subscriptions)}


@app.post("/api/send-test")
def send_test_push():
    if not load_subscriptions():
        raise HTTPException(status_code=400, detail="Нет сохранённых подписок")

    try:
        report = send_to_all(
            title="Питомец рядом",
            body="Это тестовое Web Push уведомление, отправленное из Python!",
        )
    except RuntimeError as error:
        raise HTTPException(status_code=500, detail=str(error))

    if report["sent"] == 0:
        raise HTTPException(
            status_code=502,
            detail=f"Push не доставлен. Ответ push-сервиса: {report['errors'] or 'подписка устарела'}",
        )

    return {"message": "Push отправлен", **report}