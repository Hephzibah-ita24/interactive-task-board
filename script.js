
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

let draggedTaskId = null;


const taskForm = document.getElementById("task-form");
const taskTitle = document.getElementById("task-title");
const taskDescription = document.getElementById("task-description");
const taskCategory = document.getElementById("task-category");
const taskPriority = document.getElementById("task-priority");

const searchInput = document.getElementById("search-input");
const categoryFilter = document.getElementById("category-filter");

const themeToggle = document.getElementById("theme-toggle");


document.addEventListener("DOMContentLoaded", () => {

    renderTasks();

    if (localStorage.getItem("theme") === "dark") {
        document.body.classList.add("dark-mode");
        themeToggle.textContent = "☀️ Light Mode";
    }

  
    taskForm.addEventListener("submit", handleAddTask);

    searchInput.addEventListener("input", renderTasks);

    categoryFilter.addEventListener("change", renderTasks);

    themeToggle.addEventListener("click", toggleDarkMode);

    // Enable drag and drop on all columns
    setupDragAndDrop();
});


function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}


function handleAddTask(e) {

    e.preventDefault();

    const newTask = {
        id: Date.now().toString(),

        title: taskTitle.value.trim(),

        description: taskDescription.value.trim(),

        category: taskCategory.value,

        priority: taskPriority.value,

        status: "todo"
    };

    tasks.push(newTask);

    saveTasks();
    renderTasks();

    taskForm.reset();
}


function updateTaskStatus(id, newStatus) {

    tasks = tasks.map(task => {

        if (task.id === id) {
            return {
                ...task,
                status: newStatus
            };
        }

        return task;
    });

    saveTasks();
    renderTasks();
}


function deleteTask(id) {

    tasks = tasks.filter(task => task.id !== id);

    saveTasks();
    renderTasks();
}


function renderTasks() {

    const searchTerm = searchInput.value.toLowerCase().trim();

    const selectedCategory = categoryFilter.value;

    // Get the three task columns
    const lists = {
        "todo": document.getElementById("list-todo"),
        "in-progress": document.getElementById("list-in-progress"),
        "completed": document.getElementById("list-completed")
    };

    // Clear existing task cards
    Object.values(lists).forEach(list => {
        list.innerHTML = "";
    });

    // Initialise task counters
    const counts = {
        "todo": 0,
        "in-progress": 0,
        "completed": 0
    };

    // Filter tasks based on search and category
    const filteredTasks = tasks.filter(task => {

        const matchesSearch = task.title
            .toLowerCase()
            .includes(searchTerm);

        const matchesCategory =
            selectedCategory === "All" ||
            task.category === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    // Display matching tasks
    filteredTasks.forEach(task => {

        if (!lists[task.status]) return;

        counts[task.status]++;

        const card = createTaskCard(task);

        lists[task.status].appendChild(card);
    });

    // Display an empty message where necessary
    Object.entries(lists).forEach(([status, list]) => {

        if (counts[status] === 0) {
            list.innerHTML =
                '<p class="empty-message">No tasks here yet.</p>';
        }
    });

    // Update column counters
    document.getElementById("count-todo").textContent =
        counts["todo"];

    document.getElementById("count-in-progress").textContent =
        counts["in-progress"];

    document.getElementById("count-completed").textContent =
        counts["completed"];

    // Update overall statistics
    updateTaskCounters();
}

function createTaskCard(task) {

    const card = document.createElement("div");

    card.className = "task-card";

    card.draggable = true;

    card.dataset.priority = task.priority;

    card.dataset.id = task.id;

    // Escape user-entered text before inserting HTML
    card.innerHTML = `
        <div class="task-card-title">
            ${escapeHtml(task.title)}
        </div>

        <p class="task-description">
            ${escapeHtml(task.description)}
        </p>

        <div class="task-meta">
            <span>${escapeHtml(task.category)}</span>

            <span>${escapeHtml(task.priority)} Priority</span>
        </div>

        <div class="task-actions">

            <select class="status-select"
                    aria-label="Change task status">

                <option value="todo"
                    ${task.status === "todo" ? "selected" : ""}>
                    To Do
                </option>

                <option value="in-progress"
                    ${task.status === "in-progress" ? "selected" : ""}>
                    In Progress
                </option>

                <option value="completed"
                    ${task.status === "completed" ? "selected" : ""}>
                    Completed
                </option>

            </select>

            <button class="btn-danger delete-btn">
                Delete
            </button>

        </div>
    `;

    // Change task status using the dropdown
    card.querySelector(".status-select")
        .addEventListener("change", (e) => {

            updateTaskStatus(task.id, e.target.value);

        });

    // Delete task
    card.querySelector(".delete-btn")
        .addEventListener("click", () => {

            deleteTask(task.id);

        });

    return card;
}

// Prevent user-entered text from being interpreted as HTML
function escapeHtml(str) {

    return String(str).replace(/[&<>"']/g, character => {

        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[character];
    });
}


function updateTaskCounters() {

    // Completed tasks
    const completed = tasks.filter(task =>
        task.status === "completed"
    ).length;

    // Active tasks are everything not completed
    const active = tasks.length - completed;

    document.getElementById("active-count").textContent = active;

    document.getElementById("completed-count").textContent =
        completed;

    document.getElementById("total-count").textContent =
        tasks.length;
}


function toggleDarkMode() {

    document.body.classList.toggle("dark-mode");

    const isDarkMode =
        document.body.classList.contains("dark-mode");

    if (isDarkMode) {

        localStorage.setItem("theme", "dark");

        themeToggle.textContent = "☀️ Light Mode";

    } else {

        localStorage.setItem("theme", "light");

        themeToggle.textContent = "🌙 Dark Mode";
    }
}


/* =========================
   13. Drag and Drop
========================= */

function setupDragAndDrop() {

    const columns = document.querySelectorAll(".column");

    columns.forEach(column => {

        // When dragging starts
        column.addEventListener("dragstart", (e) => {

            const card = e.target.closest(".task-card");

            if (!card) return;

            draggedTaskId = card.dataset.id;

            card.classList.add("dragging");

            e.dataTransfer.effectAllowed = "move";

            e.dataTransfer.setData("text/plain", draggedTaskId);
        });

        // When dragging ends
        column.addEventListener("dragend", (e) => {

            const card = e.target.closest(".task-card");

            if (card) {
                card.classList.remove("dragging");
            }

            draggedTaskId = null;

            columns.forEach(col => {
                col.classList.remove("drag-over");
            });
        });

        // Allow tasks to be dropped into a column
        column.addEventListener("dragover", (e) => {

            e.preventDefault();

            e.dataTransfer.dropEffect = "move";

            column.classList.add("drag-over");
        });

        // Remove highlighting when leaving a column
        column.addEventListener("dragleave", (e) => {

            if (!column.contains(e.relatedTarget)) {
                column.classList.remove("drag-over");
            }
        });

        // Handle dropping a task
        column.addEventListener("drop", (e) => {

            e.preventDefault();

            column.classList.remove("drag-over");

            const taskId = e.dataTransfer.getData("text/plain")
                || draggedTaskId;

            if (!taskId) return;

            const newStatus = column.dataset.status;

            const taskExists = tasks.some(task =>
                task.id === taskId
            );

            if (taskExists) {
                updateTaskStatus(taskId, newStatus);
            }
        });

    });
}
