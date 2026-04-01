const STORAGE_KEY = "simpleTodoMemoItems";

const todoForm = document.getElementById("todoForm");
const todoInput = document.getElementById("todoInput");
const todoList = document.getElementById("todoList");
const emptyState = document.getElementById("emptyState");
const totalCount = document.getElementById("totalCount");
const doneCount = document.getElementById("doneCount");
const leftCount = document.getElementById("leftCount");
const clearDoneButton = document.getElementById("clearDoneButton");
const todayText = document.getElementById("todayText");
const weekBarList = document.getElementById("weekBarList");
const WEEKLY_PROGRESS_KEY = "simpleTodoMemoWeeklyProgress";

let todos = loadTodos();

function loadTodos() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function loadWeeklyProgress() {
  try {
    const saved = localStorage.getItem(WEEKLY_PROGRESS_KEY);
    const parsed = saved ? JSON.parse(saved) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    return {};
  }
}

function saveWeeklyProgress(progress) {
  localStorage.setItem(WEEKLY_PROGRESS_KEY, JSON.stringify(progress));
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getStartOfWeek(date) {
  const start = new Date(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

function updateWeeklyProgress(total, done, left) {
  const today = new Date();
  const todayKey = formatDateKey(today);
  const progress = loadWeeklyProgress();
  const nextState = total > 0 && left === 0 ? "done" : done > 0 ? "partial" : "empty";

  if (nextState === "empty" && progress[todayKey] === "done") {
    saveWeeklyProgress(progress);
    return;
  }

  progress[todayKey] = nextState;
  saveWeeklyProgress(progress);
}

function renderWeekBar() {
  const progress = loadWeeklyProgress();
  const today = new Date();
  const todayKey = formatDateKey(today);
  const startOfWeek = getStartOfWeek(today);
  const items = weekBarList.querySelectorAll(".week-day");

  items.forEach((item, index) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + index);

    const key = formatDateKey(date);
    const state = progress[key] || "empty";

    item.classList.remove("is-today", "is-done", "is-partial");

    if (key === todayKey) {
      item.classList.add("is-today");
    }

    if (state === "done") {
      item.classList.add("is-done");
    }

    if (state === "partial") {
      item.classList.add("is-partial");
    }
  });
}

function formatToday() {
  const formatter = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long"
  });

  todayText.textContent = formatter.format(new Date());
}

function createTodoItem(todo) {
  const item = document.createElement("li");
  item.className = "todo-item";

  if (todo.done) {
    item.classList.add("is-done");
  }

  item.innerHTML = `
    <div class="todo-main">
      <label class="check-label">
        <input class="check-input" type="checkbox" ${todo.done ? "checked" : ""} aria-label="\uD560 \uC77C \uC644\uB8CC \uCCB4\uD06C">
        <span class="check-ui" aria-hidden="true"></span>
        <span class="todo-text"></span>
      </label>
    </div>
    <button type="button" class="delete-button" aria-label="\uD560 \uC77C \uC0AD\uC81C">\uC0AD\uC81C</button>
  `;

  const checkbox = item.querySelector(".check-input");
  const text = item.querySelector(".todo-text");
  const deleteButton = item.querySelector(".delete-button");

  text.textContent = todo.text;

  checkbox.addEventListener("change", () => {
    todos = todos.map((currentTodo) => (
      currentTodo.id === todo.id
        ? { ...currentTodo, done: checkbox.checked }
        : currentTodo
    ));
    saveTodos();
    renderTodos();
  });

  deleteButton.addEventListener("click", () => {
    todos = todos.filter((currentTodo) => currentTodo.id !== todo.id);
    saveTodos();
    renderTodos();
  });

  return item;
}

function updateSummary() {
  const total = todos.length;
  const done = todos.filter((todo) => todo.done).length;
  const left = total - done;

  totalCount.textContent = String(total);
  doneCount.textContent = String(done);
  leftCount.textContent = String(left);

  updateWeeklyProgress(total, done, left);
  renderWeekBar();
}

function renderTodos() {
  todoList.innerHTML = "";

  if (todos.length === 0) {
    emptyState.classList.remove("is-hidden");
  } else {
    emptyState.classList.add("is-hidden");
  }

  todos.forEach((todo) => {
    todoList.appendChild(createTodoItem(todo));
  });

  updateSummary();
}

function addTodo(text) {
  const trimmedText = text.trim();

  if (!trimmedText) {
    todoInput.focus();
    return;
  }

  todos = [
    {
      id: Date.now(),
      text: trimmedText,
      done: false
    },
    ...todos
  ];

  saveTodos();
  renderTodos();
  todoForm.reset();
  todoInput.focus();
}

todoForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addTodo(todoInput.value);
});

clearDoneButton.addEventListener("click", () => {
  todos = todos.filter((todo) => !todo.done);
  saveTodos();
  renderTodos();
});

formatToday();
renderTodos();
