# Backend FastAPI (Pet Finder)

## О проекте
Бэкенд для сервиса поиска потерянных питомцев. 
Написан на FastAPI с использованием асинхронного драйвера `asyncpg` для работы с базой данных PostgreSQL.

## Как запустить локально:
1. Установите зависимости: `pip install -r requirements.txt`
2. Создайте файл `.env` (по примеру `.env.example`) и впишите свои данные от PostgreSQL.
3. Запустите сервер: `uvicorn main:app --reload`
4. Документация (Swagger): `http://127.0.0.1:8000/docs`

