import asyncio
import logging
import os
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone

import asyncpg
import jwt
from fastapi import Cookie, Depends, FastAPI, Form, HTTPException, Request, status
from fastapi.exceptions import HTTPException as FastAPIHTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.templating import Jinja2Templates

import database
from database import FurCreate

logger = logging.getLogger(__name__) 

# --- НАСТРОЙКИ БЕЗОПАСНОСТИ ---
SECRET_KEY = os.getenv("SECRET_KEY")
USERS = {}

admin_user = os.getenv("ADMIN_USERNAME")
admin_pass = os.getenv("ADMIN_PASSWORD")
if admin_user and admin_pass:
    USERS[admin_user] = admin_pass

for key in os.environ:
    if key.startswith("MANAGER_USERNAME"):
        suffix = key.replace("MANAGER_USERNAME", "")
        password_key = f"MANAGER_PASSWORD{suffix}"
        
        username = os.getenv(key)
        password = os.getenv(password_key)
        
        if username and password:
            USERS[username] = password

if not SECRET_KEY or not USERS:
    logger.critical("КРИТИЧЕСКАЯ ОШИБКА: Не заданы SECRET_KEY или список пользователей!")
    raise SystemExit(1)

ALGORITHM = "HS256"
templates = Jinja2Templates(directory="templates")


# --- ФУНКЦИИ JWT ---
def create_access_token(username: str):
    expire = datetime.now(timezone.utc) + timedelta(hours=2)
    to_encode = {"sub": username, "exp": expire}
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def verify_admin_token(access_token: str | None = Cookie(default=None)):
    if not access_token:
        raise HTTPException(status_code=401, detail="Вы не авторизованы")
    try:
        payload = jwt.decode(access_token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username not in USERS:
            raise HTTPException(status_code=401, detail="Неверный пользователь")
        return username
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Токен истек")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Неверный токен")


async def cleanup_found_pets():
    """
    автоудаление животных (3 дня)
    проверка каждый час
    """
    while True:
        try:
            async with database.pool.acquire() as conn:
                deleted = await conn.execute("""
                    DELETE FROM lost_pets
                    WHERE status = 'found'
                      AND found_at < NOW() - INTERVAL '3 days';
                """)
                if deleted != "DELETE 0":
                    logger.info(f"Автоочистка БД: удалены старые записи ({deleted})")
        except asyncpg.PostgresError as e:
            logger.error(f"Ошибка БД при автоудалении животных: {e}")

        await asyncio.sleep(3600)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await database.startup()
    cleanup_task = asyncio.create_task(cleanup_found_pets()) #задача активировать очистку при старте сервера
    yield
    cleanup_task.cancel() #Остановка очистки при остановки сервера
    await database.shutdown()


app = FastAPI(lifespan=lifespan, docs_url=None, redoc_url=None)


@app.exception_handler(FastAPIHTTPException)
async def custom_http_exception_handler(request: Request, exc: FastAPIHTTPException):
    if exc.status_code == 401 and "text/html" in request.headers.get("accept", ""):
        return RedirectResponse(url="/login", status_code=status.HTTP_303_SEE_OTHER)
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


# --- ЗАЩИТА ДОКУМЕНТАЦИИ ---
@app.get("/openapi.json", include_in_schema=False)
async def get_openapi(admin: str = Depends(verify_admin_token)):
    return app.openapi()


@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui_html(admin: str = Depends(verify_admin_token)):
    return get_swagger_ui_html(openapi_url="/openapi.json", title="API Docs")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- API ЭНДПОИНТЫ ---
@app.get("/api/pets")
async def get_all_pets(

    species: str | None = None, 
    report_type: str | None = None,
    status: str = "active"
):
    """
    Выдача только активных животных(вид, тип)
    """
    query = "SELECT * FROM lost_pets WHERE 1=1"
    params = []

    if status != "all":
        params.append(status.strip().lower())
        query += f" AND status = ${len(params)}"
    
    if species:
        params.append(species.strip().lower())
        query += f" AND LOWER(species) = ${len(params)}"
        
    if report_type:
        params.append(report_type.strip().lower())
        query += f" AND report_type = ${len(params)}"
        
    query += " ORDER BY id DESC"

    async with database.pool.acquire() as conn:
        to_get = await conn.fetch(query, *params)
    return [dict(row) for row in to_get]


@app.get("/api/species")
async def get_active_species():
    """
    Выдача всех списка видов активных животных в данный момент
    """
    async with database.pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT DISTINCT LOWER(species) AS species FROM lost_pets WHERE status = 'active' ORDER BY species;"
        )
    return [row["species"] for row in rows]


@app.get("/api/pets/{fur_id}")
async def get_one_pet(fur_id: int):
    async with database.pool.acquire() as conn:
        pet = await conn.fetchrow("SELECT * FROM lost_pets WHERE id = $1;", fur_id)
    if pet is None:
        raise HTTPException(status_code=404, detail="Питомец не найден")
    return dict(pet)


@app.post("/api/pets")
async def create_fur(fur: FurCreate):
    async with database.pool.acquire() as conn:
        inf = """INSERT INTO lost_pets (name, species, street, report_type, comment, contact_email)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;"""
        name_val = fur.name if fur.name and fur.name.strip() else None
        
        new_pet = await conn.fetchrow(
            inf, 
            name_val, 
            fur.species, 
            fur.street, 
            fur.report_type,
            fur.comment,
            fur.contact_email
        )
    return {"message": "Заявка добавлена", "data": dict(new_pet)}


@app.delete("/api/pets/{fur_id}")
async def dell_fur(fur_id: int, admin: str = Depends(verify_admin_token)):
    async with database.pool.acquire() as conn:
        inf = "DELETE FROM lost_pets WHERE id = $1;"
        status_fur = await conn.execute(inf, fur_id)
    if status_fur == "DELETE 0":
        raise HTTPException(status_code=404, detail="Питомец с таким ID не найден")
    return {"message": f"Животное с id={fur_id} удалено"}


@app.patch("/api/pets/{fur_id}/found")
async def mark_as_found(fur_id: int, admin: str = Depends(verify_admin_token)):
    """
    Обновление статуса животного на 'found' и фиксация времени находки.
    """
    async with database.pool.acquire() as conn:
        inf = """UPDATE lost_pets SET status = 'found', found_at = NOW() WHERE id = $1 RETURNING *;"""  # Запись времени обновления статуса
        updated_pet = await conn.fetchrow(inf, fur_id)
    if updated_pet is None:
        raise HTTPException(status_code=404, detail="Животное с таким ID не найдено")
    return {"message": "Статус животного обновлён на found", "data": dict(updated_pet)}


# --- ЭНДПОИНТЫ АВТОРИЗАЦИИ ---
@app.get("/login")
async def login_page(request: Request):
    return templates.TemplateResponse(request=request, name="login.html", context={})


@app.post("/login")
async def login(request: Request, username: str = Form(...), password: str = Form(...)):
    if USERS.get(username) == password:
        token = create_access_token(username)
        response = RedirectResponse(url="/admin", status_code=303)
        response.set_cookie(
            key="access_token", value=token, httponly=True, secure=True, samesite="lax", max_age=7200
        )
        return response
    else:
        return templates.TemplateResponse(
            request=request, name="login.html", context={"error": "Неверный логин или пароль"}
        )


@app.get("/logout")
async def logout():
    response = RedirectResponse(url="/login", status_code=303)
    response.delete_cookie("access_token")
    return response


# --- АДМИНКА ---
@app.get("/admin")
async def admin_panel(request: Request, admin: str = Depends(verify_admin_token)):
    async with database.pool.acquire() as conn:
        inf = await conn.fetch("SELECT * FROM lost_pets ORDER BY id DESC;")
    return templates.TemplateResponse(
        request=request, name="admin.html", context={"pets": [dict(row) for row in inf]}
    )


@app.post("/admin/delete/{fur_id}")
async def admin_delete_pet(fur_id: int, admin: str = Depends(verify_admin_token)):
    async with database.pool.acquire() as conn:
        await conn.execute("DELETE FROM lost_pets WHERE id = $1;", fur_id)
    return RedirectResponse(url="/admin", status_code=303)


@app.post("/admin/found/{fur_id}")
async def admin_found_pet(fur_id: int, admin: str = Depends(verify_admin_token)):
    """
    Обновление статуса животного на 'found', фиксация времени нахождения
    """
    async with database.pool.acquire() as conn:
        await conn.execute("UPDATE lost_pets SET status = 'found', found_at = NOW() WHERE id = $1;", fur_id) #запись времени нахождения
    return RedirectResponse(url="/admin", status_code=303)
