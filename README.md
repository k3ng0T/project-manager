# Project markers

Локальный веб‑инструмент для личного планирования: проекты → backlog → to do с процессами и прогрессом. Данные хранятся в JSON по одному файлу на проект.

## Стек
- Python + Flask (мини‑API и статика)
- Ванильный JS + CSS (стили в духе GitHub)
- Файловое хранилище: `data/projects/<project>.json`

## Возможности
- Создать проект (имя без `\/:*?"<>|`)
- Добавлять backlog (одно слово: буквы/цифры/_/-), двойной клик удаляет свободный backlog
- Создавать to do, выбирая один или несколько свободных backlog (после выбора они пропадают из свободных)
- Внутри to do есть процессы по выбранным backlog, у каждого ползунок/число 0–100%; средний % выводится, 100% → completed
- Удаление проекта через модалку с подтверждением именем

## Быстрый старт (Windows, PowerShell)
```pwsh
cd F:\bankan
py -m venv .venv
.\.venv\Scripts\activate
py -m pip install -r requirements.txt
py app.py
```
Открыть: http://localhost:5000

## Быстрый старт (*nix/macOS)
```bash
cd /path/to/bankan
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

## API (локально)
- `GET /api/projects` — список
- `POST /api/projects` — создать `{name}`
- `GET /api/projects/<name>` — детали
- `DELETE /api/projects/<name>` — удалить `{confirmName}`
- `POST /api/projects/<name>/backlogs` — добавить `{name}`
- `DELETE /api/projects/<name>/backlogs/<backlog>` — удалить свободный backlog
- `POST /api/projects/<name>/todos` — создать to do `{name, backlogs: []}`
- `PATCH /api/projects/<name>/todos/<todoId>/progress` — обновить прогресс `{backlog, progress}`

## Структура данных проекта
```json
{
  "name": "My Project",
  "backlogs": ["feature_a"],
  "todos": [
    {
      "id": "uuid",
      "name": "release_1",
      "processes": [
        {"name": "feature_a", "progress": 60}
      ],
      "status": "in_progress",
      "progress": 60
    }
  ]
}
```

## Примечания
- Файлы данных лежат в `data/projects/`. Для бэкапа/миграции достаточно копировать эту папку.
- В прод окружении выключите `debug=True` в `app.py`.

