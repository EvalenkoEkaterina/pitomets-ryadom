# Питомец рядом

Командный проект на Django.

## Что нужно установить

- Python 3.14
- Git

Версии пакетов проекта указаны в `requirements.txt`.

## Как запустить проект

Откройте Терминал в папке `pitomets-ryadom`.

### 1. Создайте и включите окружение

На macOS:

```bash
python3.14 -m venv .venv
source .venv/bin/activate
```

На Windows в командной строке CMD:

```bat
py -3.14 -m venv .venv
.venv\Scripts\activate.bat
```

### 2. Установите пакеты

```bash
python -m pip install -r requirements.txt
```

### 3. Подготовьте локальную базу данных

```bash
python manage.py migrate
```

### 4. Запустите сервер

```bash
python manage.py runserver
```

Откройте в браузере: http://127.0.0.1:8000/

Для остановки сервера нажмите Control + C в Терминале.

## Где находятся файлы

- `config/` — настройки Django и адреса страниц.
- `templates/` — HTML-файлы страниц.
- `static/css/` — CSS-файлы оформления.
- `requirements.txt` — список пакетов и их версий.

Окружение `.venv`, локальная база данных и файл `.env` исключены из Git через `.gitignore`.