# Project markers

A free, self-hosted task management tool to take control of your time and actions. Plan your work, track progress, and stay organized — all without subscriptions or cloud dependencies.

Local web tool for personal planning: projects -> backlog -> to do with processes and progress. Data is stored as JSON, one file per project.

## Why use it?
- **100% Free** — No subscriptions, no hidden costs, no ads
- **Privacy-first** — Your data stays on your machine, no cloud sync required
- **Simple workflow** — Projects → Backlog → To-dos with progress tracking
- **Lightweight** — Runs locally with minimal resources
- **Full control** — Manage your tasks and time your way

## Stack
- Python + Flask (mini API and static files)
- Vanilla JS + CSS (GitHub-like styling)
- File storage: `data/projects/<project>.json`

## Features
- Create a project (name without `\/::*?"<>|`)
- Add backlog items (single word: letters/digits/_/-); double-click removes a free backlog item
- Create to-dos by selecting one or more free backlog items (they disappear from free list after selection)
- Each to-do contains processes for the selected backlogs, each with a 0-100% slider/number; average % is shown, 100% -> completed
- **Comments** — Add notes to each to-do and individual processes to track context, blockers, or details
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
- `PATCH /api/projects/<name>/todos/<todoId>/comment` - update to-do comment `{comment}`
- `PATCH /api/projects/<name>/todos/<todoId>/process-comment` - update process comment `{backlog, comment}`

## Project data structure
```json
{
  "name": "My Project",
  "backlogs": ["feature_a"],
  "todos": [
    {
      "id": "uuid",
      "name": "release_1",
      "comment": "Main release with core features",
      "processes": [
        {"name": "feature_a", "progress": 60, "comment": "Needs review"}
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
