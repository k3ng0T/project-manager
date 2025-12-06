# Project markers

Local web tool for personal planning: projects -> backlog -> to do with processes and progress. Data is stored as JSON, one file per project.

## Stack
- Python + Flask (mini API and static files)
- Vanilla JS + CSS (GitHub-like styling)
- File storage: `data/projects/<project>.json`

## Features
- Create a project (name without `\/::*?"<>|`)
- Add backlog items (single word: letters/digits/_/-); double-click removes a free backlog item
- Create to-dos by selecting one or more free backlog items (they disappear from free list after selection)
- Each to-do contains processes for the selected backlogs, each with a 0-100% slider/number; average % is shown, 100% -> completed
- Delete a project via modal with name confirmation

## Quick start (Windows, PowerShell)
```pwsh
cd F:\bankan
py -m venv .venv
.\.venv\Scripts\activate
py -m pip install -r requirements.txt
py app.py
```
Open: http://localhost:5000

## Quick start (*nix/macOS)
```bash
cd /path/to/bankan
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

## API (local)
- `GET /api/projects` - list projects
- `POST /api/projects` - create `{name}`
- `GET /api/projects/<name>` - get details
- `DELETE /api/projects/<name>` - delete `{confirmName}`
- `POST /api/projects/<name>/backlogs` - add `{name}`
- `DELETE /api/projects/<name>/backlogs/<backlog>` - delete a free backlog
- `POST /api/projects/<name>/todos` - create to-do `{name, backlogs: []}`
- `PATCH /api/projects/<name>/todos/<todoId>/progress` - update progress `{backlog, progress}`

## Project data structure
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

## Notes
- Data files live in `data/projects/`. For backup/migration, just copy this folder.
- In production, disable `debug=True` in `app.py`.
