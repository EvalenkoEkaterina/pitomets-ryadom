# Web Push через PostgreSQL

Общий backend хранит браузерные подписки в таблице `push_subscriptions`.
Таблица создаётся в `database.startup()` и не исчезает после перезапуска FastAPI.

Регистрация пользователя не нужна: подписка определяется по уникальному
`endpoint`. Повторная отправка того же `endpoint` обновляет ключи и вновь активирует
подписку. Отписка ставит `is_active = FALSE`.

## Настройка

В папке `backend` установите зависимости:

```bash
python -m pip install -r requirements.txt
```

Создайте VAPID-ключи:

```bash
vapid --gen
vapid --applicationServerKey
```

Добавьте в `.env`:

```dotenv
VAPID_PUBLIC_KEY=<ключ из vapid --applicationServerKey>
VAPID_PRIVATE_KEY=private_key.pem
VAPID_CLAIMS_SUB=mailto:example@example.com
```

Не добавляйте `.env`, `private_key.pem` и реальные подписки в Git. На Render эти значения
нужно задать как secret environment variables.

## Запуск

```bash
cd backend
uvicorn main:app --reload
```

Откройте `http://127.0.0.1:8000/web-push` в Chrome. `localhost` и `127.0.0.1`
разрешены для Service Worker без HTTPS; на удалённом сервере нужен HTTPS.

## Проверка

1. Нажмите «Подписаться» и разрешите уведомления.
2. Нажмите «Отправить тестовый push».
3. Перезапустите backend и повторите отправку: подписка должна остаться в PostgreSQL.
4. Закройте вкладку и отправьте push через `POST /api/push/send-test`: системное
   уведомление должно прийти без открытой вкладки.
5. Откройте страницу, нажмите «Отписаться» и снова вызовите тестовую
   отправку: активных подписок больше нет и уведомление не приходит.

Ручная отправка без страницы:

```bash
curl -X POST http://127.0.0.1:8000/api/push/send-test
```

## API

- `POST /api/push/subscriptions` — сохранение или обновление подписки;
- `DELETE /api/push/subscriptions` — отписка;
- `GET /api/push/vapid-public-key` — публичный VAPID-ключ для браузера;
- `POST /api/push/send-test` — ручная тестовая отправка всем активным подпискам.

Рассылка по радиусу и автоматическая отправка после публикации в эту задачу
не входят.
