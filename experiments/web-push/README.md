# Web Push: пример для «Питомец рядом»

Минимальный пример: браузер подписывается на push, FastAPI принимает подписку,
Python отправляет уведомление через pywebpush и VAPID, Service Worker показывает
его, клик открывает страницу.

> ⚠️ Подписки временно хранятся в локальном файле `subscriptions.json`.
> Это только для демонстрации. В основном проекте они будут в PostgreSQL
> (см. `docs/web-push.md`). Файл и ключи в Git не попадают.

Проверено в: **Safari 26.5 / Chrome 157, macOS**.

## Запуск

Из папки `experiments/web-push`:

```bash
uv venv
uv pip install -r requirements.txt
```

### Ключи VAPID

```bash
uv run vapid --gen
uv run vapid --applicationServerKey
```

Первая команда создаёт `private_key.pem` и `public_key.pem`. Вторая печатает
публичный ключ для браузера.

Скопируйте `.env.example` в `.env` и заполните:

```
VAPID_PUBLIC_KEY=<ключ из vapid --applicationServerKey>
VAPID_PRIVATE_KEY=private_key.pem
VAPID_CLAIMS_SUB=mailto:ваша_почта@example.com
```

### Сервер

```bash
uv run uvicorn app.main:app --reload
```

Откройте http://127.0.0.1:8000/

## Как проверить

1. Нажмите «Подписаться на уведомления» и разрешите их.
2. Статус сменится на «Подписан».
3. Во втором терминале выполните отправку из Python:
   ```bash
   uv run python send_push.py
   ```
4. Появится системное уведомление. Клик по нему открывает страницу с зелёным баннером.
5. Если запретить уведомления в настройках браузера и обновить страницу,
   появится статус «Уведомления запрещены…».

Если уведомления не видны, проверьте Фокус / «Не беспокоить» в macOS и
Системные настройки → Уведомления → ваш браузер.

## Файлы

- `app/main.py` — FastAPI: приём и удаление подписки, VAPID-ключ, тестовая отправка
- `app/sender.py` — отправка через pywebpush, удаление устаревших подписок (404/410)
- `app/static/` — страница, стили, скрипт подписки, Service Worker
- `send_push.py` — отправка из Python без участия страницы

## Не коммитить

`.env`, `*.pem`, `subscriptions.json`, `.venv/`