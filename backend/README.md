# Backend FastAPI

## Как запустить локально:
1. `pip install -r requirements.txt`
2. Создайте файл `.env` (по примеру `.env.example`) и заполните данные от PostgreSQL.
3. Запустите сервер: `uvicorn main:app --reload`
4. Swagger (документация): `http://127.0.0.1:8000/docs`

**Важно:** Публичный API для фронтенда (React) уже развернут в облаке. Для локальной разработки фронтенда поднимать бэкенд не обязательно. 
Ссылка на живой API: `https://твоя-новая-ссылка.onrender.com/api/pets`
