// ---------- Setup ----------
const form = document.querySelector("#task-form");
const titleInput = document.querySelector("#task-title");
const deadlineInput = document.querySelector("#task-deadline");
const categoryInput = document.querySelector("#task-category");
const list = document.querySelector("#task-list");
const filterSelect = document.querySelector("#filter-category");
const progressFill = document.querySelector("#progress-fill");
const progressText = document.querySelector("#progress-text");
const banner = document.querySelector("#reminder-banner");

let tasks = loadTasks();

// ---------- Saving and loading ----------
function loadTasks() {
  try {
    return JSON.parse(localStorage.getItem("tasks")) || [];
  } catch (error) {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

// ---------- Helpers ----------
function todayString() {
  // Local date as YYYY-MM-DD, same format as the date input
  return new Date().toLocaleDateString("en-CA");
}

function isOverdue(task) {
  return !task.done && task.deadline && task.deadline < todayString();
}

function formatDeadline(deadline) {
  if (!deadline) return "No deadline";
  const [year, month, day] = deadline.split("-");
  return `${day}.${month}.${year}`;
}

// ---------- Add a task ----------
form.addEventListener("submit", function (event) {
  event.preventDefault();

  const title = titleInput.value.trim();
  if (!title) return;

  tasks.push({
    id: Date.now(),
    title: title,
    deadline: deadlineInput.value,
    category: categoryInput.value,
    done: false,
    reminded: false,
  });

  saveTasks();
  form.reset();
  render();
  checkReminders();
});

// ---------- Show the list ----------
function render() {
  list.innerHTML = "";

  const filter = filterSelect.value;
  const visible = tasks
    .filter((task) => filter === "all" || task.category === filter)
    .sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1; // finished tasks last
      if (!a.deadline) return 1; // no deadline last
      if (!b.deadline) return -1;
      return a.deadline.localeCompare(b.deadline); // earliest first
    });

  if (visible.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent = "No tasks here yet. Add one above 🌸";
    list.appendChild(empty);
  }

  visible.forEach((task) => list.appendChild(createTaskElement(task)));
  updateProgress();
}

function createTaskElement(task) {
  const li = document.createElement("li");
  li.className = "task";
  if (task.done) li.classList.add("done");
  if (isOverdue(task)) li.classList.add("overdue");

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = task.done;
  checkbox.setAttribute("aria-label", "Mark task as done");
   checkbox.addEventListener("change", () => {
    task.done = checkbox.checked;
    if (checkbox.checked) {
      const box = checkbox.getBoundingClientRect();
      burst(box.left + box.width / 2, box.top + box.height / 2);
    }
    saveTasks();
    render();
  });

  const title = document.createElement("span");
  title.className = "title";
  title.textContent = task.title;

  const deadline = document.createElement("span");
  deadline.className = "deadline";
  deadline.textContent = isOverdue(task)
    ? "Overdue: " + formatDeadline(task.deadline)
    : formatDeadline(task.deadline);

  const category = document.createElement("span");
  category.className = "category " + task.category;
  category.textContent = task.category;

  const deleteButton = document.createElement("button");
  deleteButton.className = "delete";
  deleteButton.textContent = "✕";
  deleteButton.setAttribute("aria-label", "Delete task");
  deleteButton.addEventListener("click", () => {
    tasks = tasks.filter((t) => t.id !== task.id);
    saveTasks();
    render();
  });

  li.append(checkbox, title, deadline, category, deleteButton);
  return li;
}

function burst(x, y) {
  const emojis = ["💖", "✨", "🌸", "⭐", "🎀"];
  for (let i = 0; i < 12; i++) {
    const piece = document.createElement("span");
    piece.className = "confetti";
    piece.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    piece.style.left = x + "px";
    piece.style.top = y + "px";
    piece.style.setProperty("--dx", Math.random() * 240 - 120 + "px");
    piece.style.setProperty("--dy", Math.random() * -160 - 40 + "px");
    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), 900);
  }
}

// ---------- Progress ----------
function updateProgress() {
  const total = tasks.length;
  const done = tasks.filter((task) => task.done).length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  progressFill.style.width = percent + "%";
  progressText.textContent =
    total === 0 ? "" : `${done} of ${total} done (${percent}%)`;
}

filterSelect.addEventListener("change", render);

// ---------- Reminders ----------
function askNotificationPermission() {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

function checkReminders() {
  const today = todayString();
  const due = tasks.filter(
    (task) => !task.done && !task.reminded && task.deadline && task.deadline <= today
  );

  if (due.length === 0) return;

  const names = due.map((task) => task.title).join(", ");
  const message = `Due today or overdue: ${names}`;

  // In-page banner (always works)
  banner.textContent = "🔔 " + message;
  banner.hidden = false;

  /*// Browser notification (if allowed)
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("Task reminder", { body: message });
  }
    */

  due.forEach((task) => (task.reminded = true));
  saveTasks();
  render();
}

banner.addEventListener("click", () => (banner.hidden = true));

// ---------- Start ----------
askNotificationPermission();
render();
checkReminders();
setInterval(checkReminders, 60 * 1000); // check every minute