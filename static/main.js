const state = {
  projects: [],
  modalProject: null,
  selectedBacklogs: [],
  deleteTarget: null,
};

const projectsList = document.getElementById("projects-list");
const emptyState = document.getElementById("projects-empty");
const toastEl = document.getElementById("toast");

const projectModal = document.getElementById("modal-project");
const backlogModal = document.getElementById("modal-backlog");
const todoModal = document.getElementById("modal-todo");
const deleteModal = document.getElementById("modal-delete");

const projectInput = document.getElementById("project-input");
const backlogInput = document.getElementById("backlog-input");
const todoInput = document.getElementById("todo-input");
const deleteInput = document.getElementById("delete-input");

const availableList = document.getElementById("available-backlogs");
const selectedList = document.getElementById("selected-backlogs");

function showToast(message, variant = "info") {
  toastEl.textContent = message;
  toastEl.classList.remove("hidden");
  toastEl.dataset.variant = variant;
  setTimeout(() => toastEl.classList.add("hidden"), 2400);
}

async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.error || "Request failed";
    throw new Error(msg);
  }
  return data;
}

async function loadProjects() {
  try {
    const data = await request("/api/projects");
    state.projects = data;
    renderProjects();
  } catch (err) {
    showToast(err.message, "error");
  }
}

function renderProjects() {
  projectsList.innerHTML = "";
  if (!state.projects.length) {
    emptyState.classList.remove("hidden");
    return;
  }
  emptyState.classList.add("hidden");
  state.projects.forEach((project) => {
    projectsList.appendChild(renderProjectCard(project));
  });
}

function renderProjectCard(project) {
  const card = document.createElement("div");
  card.className = "card";
  card.dataset.project = project.name;

  const header = document.createElement("div");
  header.className = "card-header";

  const title = document.createElement("div");
  title.className = "card-title";

  const chevron = document.createElement("button");
  chevron.className = "chevron";
  chevron.dataset.action = "toggle-project";
  chevron.dataset.project = project.name;
  chevron.textContent = "ᐱ";

  const name = document.createElement("div");
  name.textContent = project.name;

  const summary = document.createElement("span");
  summary.className = "muted";
  summary.textContent = `${project.todos.length} to do • ${project.backlogs.length} backlog`;

  title.append(chevron, name, summary);

  const actions = document.createElement("div");
  actions.className = "card-actions";

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "danger";
  deleteBtn.dataset.action = "delete-project";
  deleteBtn.dataset.project = project.name;
  deleteBtn.textContent = "Delete";

  actions.append(deleteBtn);
  header.append(title, actions);
  card.append(header);

  const body = document.createElement("div");
  body.className = "card-body hidden";

  const backlogSection = document.createElement("div");
  backlogSection.className = "section";
  backlogSection.innerHTML = `
    <div class="section-head">
      <span>Backlog</span>
      <div class="section-actions">
        <button class="primary" data-action="add-backlog" data-project="${project.name}">Add backlog</button>
      </div>
    </div>
  `;

  const backlogList = document.createElement("ul");
  backlogList.className = "pill-list";
  backlogList.dataset.project = project.name;
  backlogList.dataset.role = "backlog-list";

  if (!project.backlogs.length) {
    const empty = document.createElement("div");
    empty.className = "muted";
    empty.textContent = "Пусто. Добавьте backlog.";
    backlogSection.append(empty);
  } else {
    project.backlogs.forEach((b) => {
      const item = document.createElement("li");
      item.className = "pill";
      item.textContent = b;
      item.title = "Двойной клик чтобы удалить";
      item.dataset.action = "remove-backlog";
      item.dataset.project = project.name;
      item.dataset.backlog = b;
      backlogList.appendChild(item);
    });
    backlogSection.append(backlogList);
  }

  const todoSection = document.createElement("div");
  todoSection.className = "section";
  todoSection.innerHTML = `
    <div class="section-head">
      <span>To do</span>
      <div class="section-actions">
        <button class="primary" data-action="add-todo" data-project="${project.name}">Add to do</button>
      </div>
    </div>
  `;

  const todoList = document.createElement("div");
  todoList.className = "todo-list";
  todoList.dataset.project = project.name;

  if (!project.todos.length) {
    const emptyTodo = document.createElement("div");
    emptyTodo.className = "muted";
    emptyTodo.textContent = "Нет to do. Добавьте задачу.";
    todoList.appendChild(emptyTodo);
  } else {
    project.todos.forEach((todo) => {
      todoList.appendChild(renderTodoCard(project.name, todo));
    });
  }

  todoSection.append(todoList);
  body.append(backlogSection, todoSection);
  card.append(body);
  return card;
}

function renderTodoCard(projectName, todo) {
  const card = document.createElement("div");
  card.className = "todo-card";
  card.dataset.todoId = todo.id;
  card.dataset.project = projectName;

  const head = document.createElement("div");
  head.className = "todo-head";
  head.dataset.action = "toggle-todo";
  head.dataset.todoId = todo.id;
  head.dataset.project = projectName;

  const title = document.createElement("div");
  title.textContent = todo.name;

  const badge = document.createElement("div");
  badge.className = `status ${todo.status === "completed" ? "completed" : ""}`;
  badge.textContent = todo.status === "completed" ? "completed" : `${todo.progress}%`;

  head.append(title, badge);

  const body = document.createElement("div");
  body.className = "todo-body hidden";

  todo.processes.forEach((proc) => {
    const row = document.createElement("div");
    row.className = "progress-row";
    row.dataset.project = projectName;
    row.dataset.todoId = todo.id;
    row.dataset.backlog = proc.name;

    const label = document.createElement("div");
    label.textContent = proc.name;

    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = "0";
    slider.max = "100";
    slider.value = proc.progress;
    slider.dataset.progressSlider = "true";

    const number = document.createElement("input");
    number.type = "number";
    number.min = "0";
    number.max = "100";
    number.value = proc.progress;
    number.dataset.progressNumber = "true";

    row.append(label, slider, number);
    body.appendChild(row);
  });

  card.append(head, body);
  return card;
}

function toggleElement(el) {
  if (!el) return;
  el.classList.toggle("hidden");
}

function openModal(modal, project) {
  state.modalProject = project || null;
  modal.classList.remove("hidden");
  document.body.classList.add("modal-open");
}

function closeModal(modal) {
  modal.classList.add("hidden");
  state.modalProject = null;
  state.selectedBacklogs = [];
  if (modal === deleteModal) {
    state.deleteTarget = null;
  }
  backlogInput.value = "";
  todoInput.value = "";
  deleteInput.value = "";
  projectInput.value = "";
  deleteInput.dispatchEvent(new Event("input"));
  availableList.innerHTML = "";
  selectedList.innerHTML = "";
  // remove blur when all modals are hidden
  const anyOpen = [projectModal, backlogModal, todoModal, deleteModal].some(
    (m) => !m.classList.contains("hidden")
  );
  if (!anyOpen) {
    document.body.classList.remove("modal-open");
  }
}

function setAvailableBacklogs(list) {
  availableList.innerHTML = "";
  list.forEach((name) => {
    const li = document.createElement("li");
    li.className = "pill";
    li.textContent = name;
    li.dataset.name = name;
    li.dataset.role = "available";
    availableList.appendChild(li);
  });
}

function setSelectedBacklogs(list) {
  selectedList.innerHTML = "";
  list.forEach((name) => {
    const li = document.createElement("li");
    li.className = "pill active";
    li.textContent = name;
    li.dataset.name = name;
    li.dataset.role = "selected";
    selectedList.appendChild(li);
  });
}

function handlePickerClick(e) {
  const pill = e.target.closest("li");
  if (!pill) return;
  const name = pill.dataset.name;
  const role = pill.dataset.role;
  const current = getCurrentProject();
  if (!current) return;

  if (role === "available") {
    if (!state.selectedBacklogs.includes(name)) {
      state.selectedBacklogs.push(name);
    }
  } else if (role === "selected") {
    state.selectedBacklogs = state.selectedBacklogs.filter((b) => b !== name);
  }
  const remaining = current.backlogs.filter((b) => !state.selectedBacklogs.includes(b));
  setSelectedBacklogs(state.selectedBacklogs);
  setAvailableBacklogs(remaining);
}

function getCurrentProject() {
  return state.projects.find((p) => p.name === state.modalProject);
}

async function createProject() {
  const name = projectInput.value.trim();
  if (!name) {
    showToast("Введите имя проекта", "error");
    return;
  }
  try {
    const project = await request("/api/projects", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
    state.projects.push(project);
    projectInput.value = "";
    renderProjects();
    closeModal(projectModal);
    showToast("Проект создан");
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function submitBacklog() {
  const name = backlogInput.value.trim();
  if (!name) {
    showToast("Введите backlog", "error");
    return;
  }
  try {
    const project = await request(`/api/projects/${state.modalProject}/backlogs`, {
      method: "POST",
      body: JSON.stringify({ name }),
    });
    replaceProject(project);
    closeModal(backlogModal);
    showToast("Backlog добавлен");
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function submitTodo() {
  const name = todoInput.value.trim();
  if (!name || !state.selectedBacklogs.length) {
    showToast("Укажите имя и выберите backlog", "error");
    return;
  }
  try {
    const project = await request(`/api/projects/${state.modalProject}/todos`, {
      method: "POST",
      body: JSON.stringify({ name, backlogs: state.selectedBacklogs }),
    });
    replaceProject(project);
    closeModal(todoModal);
    showToast("To do создан");
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function deleteProject() {
  if (!state.deleteTarget) return;
  try {
    await request(`/api/projects/${state.deleteTarget}`, {
      method: "DELETE",
      body: JSON.stringify({ confirmName: deleteInput.value.trim() }),
    });
    state.projects = state.projects.filter((p) => p.name !== state.deleteTarget);
    closeModal(deleteModal);
    renderProjects();
    showToast("Проект удален");
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function removeBacklog(projectName, backlog) {
  try {
    const project = await request(`/api/projects/${projectName}/backlogs/${backlog}`, {
      method: "DELETE",
    });
    replaceProject(project);
    showToast("Backlog удален");
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function updateProgress(row) {
  const project = row.dataset.project;
  const todoId = row.dataset.todoId;
  const backlog = row.dataset.backlog;
  const slider = row.querySelector('input[type="range"]');
  const value = Number(slider.value);
  try {
    const updated = await request(`/api/projects/${project}/todos/${todoId}/progress`, {
      method: "PATCH",
      body: JSON.stringify({ backlog, progress: value }),
    });
    replaceProject(updated);
  } catch (err) {
    showToast(err.message, "error");
  }
}

function replaceProject(project) {
  const idx = state.projects.findIndex((p) => p.name === project.name);
  if (idx >= 0) {
    state.projects[idx] = project;
  } else {
    state.projects.push(project);
  }
  renderProjects();
}

projectsList.addEventListener("click", (e) => {
  const actionEl = e.target.closest("[data-action]");
  if (!actionEl) return;
  const action = actionEl.dataset.action;
  const project = actionEl.dataset.project;

  if (action === "toggle-project") {
    const card = actionEl.closest(".card");
    const body = card.querySelector(".card-body");
    toggleElement(body);
    actionEl.classList.toggle("open");
  }

  if (action === "delete-project") {
    state.deleteTarget = project;
    deleteInput.value = "";
    document.getElementById("confirm-delete").disabled = true;
    openModal(deleteModal, project);
  }

  if (action === "add-backlog") {
    openModal(backlogModal, project);
  }

  if (action === "add-todo") {
    state.selectedBacklogs = [];
    const current = state.projects.find((p) => p.name === project);
    if (!current || !current.backlogs.length) {
      showToast("Нет свободных backlog для to do", "error");
      return;
    }
    setAvailableBacklogs(current.backlogs);
    setSelectedBacklogs([]);
    openModal(todoModal, project);
  }

  if (action === "toggle-todo") {
    const card = actionEl.closest(".todo-card");
    toggleElement(card.querySelector(".todo-body"));
  }
});

projectsList.addEventListener("dblclick", (e) => {
  const el = e.target.closest("[data-action='remove-backlog']");
  if (!el) return;
  removeBacklog(el.dataset.project, el.dataset.backlog);
});

projectsList.addEventListener("input", (e) => {
  const row = e.target.closest(".progress-row");
  if (!row) return;
  const slider = row.querySelector('input[type="range"]');
  const number = row.querySelector('input[type="number"]');
  if (e.target.type === "range") {
    number.value = e.target.value;
  } else if (e.target.type === "number") {
    slider.value = e.target.value;
  }
});

projectsList.addEventListener("change", (e) => {
  const row = e.target.closest(".progress-row");
  if (!row) return;
  const slider = row.querySelector('input[type="range"]');
  const num = row.querySelector('input[type="number"]');
  const clamped = Math.min(100, Math.max(0, Number(num.value)));
  slider.value = clamped;
  num.value = clamped;
  updateProgress(row);
});

availableList.addEventListener("click", handlePickerClick);
selectedList.addEventListener("click", handlePickerClick);

document.querySelectorAll("[data-close]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const id = btn.dataset.close;
    closeModal(document.getElementById(id));
  });
});

document.getElementById("create-project").addEventListener("click", createProject);
document.getElementById("open-project-modal").addEventListener("click", () => {
  projectInput.value = "";
  openModal(projectModal);
});
document.getElementById("submit-backlog").addEventListener("click", submitBacklog);
document.getElementById("submit-todo").addEventListener("click", submitTodo);
document.getElementById("confirm-delete").addEventListener("click", deleteProject);

deleteInput.addEventListener("input", () => {
  const btn = document.getElementById("confirm-delete");
  btn.disabled = deleteInput.value.trim() !== state.deleteTarget;
});

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    [backlogModal, todoModal, deleteModal].forEach((m) => {
      if (!m.classList.contains("hidden")) closeModal(m);
    });
  }
});

document.addEventListener("DOMContentLoaded", loadProjects);

