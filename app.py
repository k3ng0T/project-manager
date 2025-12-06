import json
import re
import uuid
from pathlib import Path
from typing import Dict, List

from flask import Flask, jsonify, render_template, request

BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data" / "projects"
DATA_DIR.mkdir(parents=True, exist_ok=True)

app = Flask(__name__, static_folder="static", template_folder="templates")

SHORT_NAME_PATTERN = re.compile(r"^[A-Za-z0-9_-]+$")
PROJECT_INVALID_CHARS = set('\\/:*?"<>|')


def load_project(name: str) -> Dict:
    path = DATA_DIR / f"{name}.json"
    if not path.exists():
        return {}
    with path.open("r", encoding="utf-8") as fh:
        return json.load(fh)


def save_project(project: Dict) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    path = DATA_DIR / f"{project['name']}.json"
    with path.open("w", encoding="utf-8") as fh:
        json.dump(project, fh, indent=2, ensure_ascii=False)


def project_exists(name: str) -> bool:
    return (DATA_DIR / f"{name}.json").exists()


def compute_todo_progress(todo: Dict) -> Dict:
    processes = todo.get("processes", [])
    if not processes:
        todo["progress"] = 0
        todo["status"] = "in_progress"
        return todo

    total = sum(p.get("progress", 0) for p in processes)
    avg = round(total / len(processes), 2)
    todo["progress"] = avg
    todo["status"] = "completed" if all(p.get("progress", 0) >= 100 for p in processes) else "in_progress"
    return todo


def sanitize_project(project: Dict) -> Dict:
    project["todos"] = [compute_todo_progress(t) for t in project.get("todos", [])]
    return project


def summarize_project(project: Dict) -> Dict:
    sanitized = sanitize_project(project)
    todos = sanitized.get("todos", [])
    if not todos:
        progress = 0
    else:
        progress = round(sum(t["progress"] for t in todos) / len(todos), 2)
    return {
        "name": sanitized["name"],
        "backlogs": sanitized.get("backlogs", []),
        "todos": todos,
        "progress": progress,
    }


def validate_project_name(name: str) -> bool:
    if not name:
        return False
    return not any(ch in PROJECT_INVALID_CHARS for ch in name)


def validate_short_name(name: str) -> bool:
    return bool(SHORT_NAME_PATTERN.match(name))


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/projects", methods=["GET"])
def list_projects():
    projects: List[Dict] = []
    for path in DATA_DIR.glob("*.json"):
        with path.open("r", encoding="utf-8") as fh:
            data = json.load(fh)
            projects.append(summarize_project(data))
    return jsonify(projects)


@app.route("/api/projects", methods=["POST"])
def create_project():
    payload = request.get_json(force=True, silent=True) or {}
    name = (payload.get("name") or "").strip()
    if not validate_project_name(name):
        return jsonify({"error": "Project name can't contain / \\ : * ? \" < > | and can't be empty."}), 400
    if project_exists(name):
        return jsonify({"error": "Project already exists."}), 409

    project = {"name": name, "backlogs": [], "todos": []}
    save_project(project)
    return jsonify(summarize_project(project)), 201


@app.route("/api/projects/<string:name>", methods=["GET"])
def get_project(name: str):
    data = load_project(name)
    if not data:
        return jsonify({"error": "Project not found."}), 404
    return jsonify(summarize_project(data))


@app.route("/api/projects/<string:name>", methods=["DELETE"])
def delete_project(name: str):
    payload = request.get_json(force=True, silent=True) or {}
    confirm = (payload.get("confirmName") or "").strip()
    if confirm != name:
        return jsonify({"error": "Project name does not match confirmation."}), 400

    path = DATA_DIR / f"{name}.json"
    if not path.exists():
        return jsonify({"error": "Project not found."}), 404

    path.unlink()
    return jsonify({"status": "deleted", "name": name})


@app.route("/api/projects/<string:name>/backlogs", methods=["POST"])
def add_backlog(name: str):
    payload = request.get_json(force=True, silent=True) or {}
    backlog_name = (payload.get("name") or "").strip()
    if not backlog_name or not validate_short_name(backlog_name):
        return jsonify({"error": "Backlog name must be one word with letters, numbers, _ or -."}), 400

    project = load_project(name)
    if not project:
        return jsonify({"error": "Project not found."}), 404

    existing = set(project.get("backlogs", []))
    for todo in project.get("todos", []):
        for proc in todo.get("processes", []):
            existing.add(proc["name"])
    if backlog_name in existing:
        return jsonify({"error": "Backlog name already used."}), 409

    project.setdefault("backlogs", []).append(backlog_name)
    save_project(project)
    return jsonify(summarize_project(project)), 201


@app.route("/api/projects/<string:name>/backlogs/<string:backlog_name>", methods=["DELETE"])
def delete_backlog(name: str, backlog_name: str):
    project = load_project(name)
    if not project:
        return jsonify({"error": "Project not found."}), 404

    backlogs = project.get("backlogs", [])
    if backlog_name not in backlogs:
        return jsonify({"error": "Only free backlogs can be removed."}), 400

    project["backlogs"] = [b for b in backlogs if b != backlog_name]
    save_project(project)
    return jsonify(summarize_project(project))


@app.route("/api/projects/<string:name>/todos", methods=["POST"])
def add_todo(name: str):
    payload = request.get_json(force=True, silent=True) or {}
    todo_name = (payload.get("name") or "").strip()
    selected = payload.get("backlogs") or []

    if not todo_name or not validate_short_name(todo_name):
        return jsonify({"error": "To do name must be one word with letters, numbers, _ or -."}), 400
    if not isinstance(selected, list) or not selected:
        return jsonify({"error": "Select at least one backlog."}), 400

    project = load_project(name)
    if not project:
        return jsonify({"error": "Project not found."}), 404

    available = project.get("backlogs", [])
    if not set(selected).issubset(set(available)):
        return jsonify({"error": "Some backlogs are not available."}), 400

    processes = [{"name": b, "progress": 0} for b in selected]
    todo = {
        "id": str(uuid.uuid4()),
        "name": todo_name,
        "processes": processes,
        "status": "in_progress",
        "progress": 0,
    }
    project.setdefault("todos", []).append(todo)
    project["backlogs"] = [b for b in available if b not in selected]
    save_project(project)
    return jsonify(summarize_project(project)), 201


@app.route("/api/projects/<string:name>/todos/<string:todo_id>/progress", methods=["PATCH"])
def update_process(name: str, todo_id: str):
    payload = request.get_json(force=True, silent=True) or {}
    backlog_name = (payload.get("backlog") or "").strip()
    progress = payload.get("progress")

    if backlog_name == "" or progress is None:
        return jsonify({"error": "Backlog and progress are required."}), 400

    try:
        progress_val = float(progress)
    except (TypeError, ValueError):
        return jsonify({"error": "Progress must be a number."}), 400

    progress_val = max(0, min(100, progress_val))

    project = load_project(name)
    if not project:
        return jsonify({"error": "Project not found."}), 404

    todos = project.get("todos", [])
    todo = next((t for t in todos if t.get("id") == todo_id), None)
    if not todo:
        return jsonify({"error": "To do not found."}), 404

    process = next((p for p in todo.get("processes", []) if p.get("name") == backlog_name), None)
    if not process:
        return jsonify({"error": "Backlog not found in this to do."}), 404

    process["progress"] = progress_val
    compute_todo_progress(todo)
    save_project(project)
    return jsonify(summarize_project(project))


if __name__ == "__main__":
    app.run(debug=True, port=5000)

