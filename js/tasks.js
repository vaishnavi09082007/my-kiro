/* ============================================================
   TaskFlow – tasks.js
   Business logic: CRUD, validation, filter, sort, search
   All exported functions are pure (no DOM, no storage side effects)
   ============================================================ */

'use strict';

const PRIORITY_ORDER = { 'High': 0, 'Medium': 1, 'Low': 2 };

/* ── Validation ───────────────────────────────────────────── */

/**
 * Validates raw task form data.
 * @param {object} data
 * @returns {{ valid: boolean, errors: object }}
 */
const validateTask = (data) => {
  const errors = {};

  const title = (data.title || '').trim();
  if (!title) {
    errors.title = 'Title is required.';
  } else if (title.length > 200) {
    errors.title = 'Title must be 200 characters or fewer.';
  }

  if (data.description && data.description.length > 1000) {
    errors.description = 'Description must be 1000 characters or fewer.';
  }

  if (!['Low', 'Medium', 'High'].includes(data.priority)) {
    errors.priority = 'Priority must be Low, Medium, or High.';
  }

  if (data.category && data.category.length > 50) {
    errors.category = 'Category must be 50 characters or fewer.';
  }

  if (data.dueDate) {
    const dateRe = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRe.test(data.dueDate)) {
      errors.dueDate = 'Invalid date format.';
    } else {
      const [y, m, d] = data.dueDate.split('-').map(Number);
      const parsed = new Date(y, m - 1, d);
      if (isNaN(parsed.getTime()) || parsed.getMonth() !== m - 1) {
        errors.dueDate = 'Invalid date.';
      }
    }
  }

  if (data.dueTime) {
    if (!data.dueDate) {
      errors.dueTime = 'Due time requires a due date.';
    } else {
      const timeRe = /^\d{2}:\d{2}$/;
      if (!timeRe.test(data.dueTime)) {
        errors.dueTime = 'Invalid time format (HH:MM).';
      } else {
        const [h, m] = data.dueTime.split(':').map(Number);
        if (h > 23 || m > 59) errors.dueTime = 'Invalid time value.';
      }
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
};

/* ── CRUD ─────────────────────────────────────────────────── */

/**
 * Creates a new task object (does NOT save to storage).
 * @param {object} data - validated form data
 * @returns {object} task
 */
const createTask = (data) => {
  const { generateUUID } = window.TFUtils;
  const now = new Date().toISOString();
  return {
    id:          generateUUID(),
    title:       (data.title || '').trim(),
    description: (data.description || '').trim(),
    priority:    data.priority || 'Medium',
    category:    (data.category || '').trim(),
    dueDate:     data.dueDate || null,
    dueTime:     data.dueTime || null,
    status:      'pending',
    createdAt:   now,
    updatedAt:   now,
    completedAt: null,
  };
};

/**
 * Returns a new task array with the specified task updated.
 * @param {object[]} tasks
 * @param {string} id
 * @param {object} changes
 * @returns {object[]}
 */
const updateTask = (tasks, id, changes) => {
  return tasks.map(t => {
    if (t.id !== id) return t;
    return {
      ...t,
      ...changes,
      id,              // protect id
      createdAt: t.createdAt,  // protect creation time
      updatedAt: new Date().toISOString(),
    };
  });
};

/**
 * Returns a new task array with the specified task removed.
 * @param {object[]} tasks
 * @param {string} id
 * @returns {object[]}
 */
const deleteTask = (tasks, id) => {
  return tasks.filter(t => t.id !== id);
};

/**
 * Toggles a task between completed and pending.
 * @param {object[]} tasks
 * @param {string} id
 * @returns {object[]}
 */
const toggleComplete = (tasks, id) => {
  return tasks.map(t => {
    if (t.id !== id) return t;
    const isCompleting = t.status !== 'completed';
    return {
      ...t,
      status:      isCompleting ? 'completed' : 'pending',
      completedAt: isCompleting ? new Date().toISOString() : null,
      updatedAt:   new Date().toISOString(),
    };
  });
};

/* ── Derived state ────────────────────────────────────────── */

/**
 * Determines whether a task is overdue (computed, not stored).
 * @param {object} task
 * @returns {boolean}
 */
const isOverdue = (task) => {
  if (!task || task.status === 'completed' || !task.dueDate) return false;
  const { parseDateTime } = window.TFUtils;
  const deadline = parseDateTime(task.dueDate, task.dueTime);
  if (!deadline) return false;
  return deadline < new Date();
};

/**
 * Returns effective display status of a task.
 * @param {object} task
 * @returns {'completed'|'overdue'|'pending'}
 */
const getDisplayStatus = (task) => {
  if (task.status === 'completed') return 'completed';
  if (isOverdue(task)) return 'overdue';
  return 'pending';
};

/* ── Filter / Search / Sort ───────────────────────────────── */

/**
 * Filters tasks by status.
 * @param {object[]} tasks
 * @param {'all'|'pending'|'completed'|'overdue'} filter
 * @returns {object[]}
 */
const filterByStatus = (tasks, filter) => {
  if (!tasks || filter === 'all') return tasks || [];
  if (filter === 'overdue')   return tasks.filter(t => isOverdue(t));
  if (filter === 'completed') return tasks.filter(t => t.status === 'completed');
  if (filter === 'pending')   return tasks.filter(t => t.status !== 'completed');
  return tasks;
};

/**
 * Filters tasks by priority.
 * @param {object[]} tasks
 * @param {string} priority - 'all' | 'Low' | 'Medium' | 'High'
 * @returns {object[]}
 */
const filterByPriority = (tasks, priority) => {
  if (!tasks || !priority || priority === 'all') return tasks || [];
  return tasks.filter(t => t.priority === priority);
};

/**
 * Filters tasks by category.
 * @param {object[]} tasks
 * @param {string} category - 'all' or specific category name
 * @returns {object[]}
 */
const filterByCategory = (tasks, category) => {
  if (!tasks || !category || category === 'all') return tasks || [];
  return tasks.filter(t => t.category === category);
};

/**
 * Searches tasks by title and description (case-insensitive).
 * @param {object[]} tasks
 * @param {string} query
 * @returns {object[]}
 */
const searchTasks = (tasks, query) => {
  if (!tasks) return [];
  const q = (query || '').trim().toLowerCase();
  if (!q) return tasks;
  return tasks.filter(t =>
    t.title.toLowerCase().includes(q) ||
    (t.description || '').toLowerCase().includes(q)
  );
};

/**
 * Sorts tasks by field and direction.
 * @param {object[]} tasks
 * @param {'dueDate'|'priority'|'title'|'createdAt'} field
 * @param {'asc'|'desc'} direction
 * @returns {object[]}
 */
const sortTasks = (tasks, field, direction = 'asc') => {
  if (!tasks || tasks.length < 2) return tasks || [];
  const copy = [...tasks];

  copy.sort((a, b) => {
    if (field === 'dueDate') {
      // null due dates go last
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      const da = window.TFUtils.parseDateTime(a.dueDate, a.dueTime);
      const db = window.TFUtils.parseDateTime(b.dueDate, b.dueTime);
      return direction === 'asc' ? da - db : db - da;
    }

    if (field === 'priority') {
      const pa = PRIORITY_ORDER[a.priority] ?? 1;
      const pb = PRIORITY_ORDER[b.priority] ?? 1;
      return direction === 'asc' ? pa - pb : pb - pa;
    }

    if (field === 'title') {
      const ta = a.title.toLowerCase();
      const tb = b.title.toLowerCase();
      const cmp = ta < tb ? -1 : ta > tb ? 1 : 0;
      return direction === 'asc' ? cmp : -cmp;
    }

    if (field === 'createdAt') {
      const da = new Date(a.createdAt);
      const db = new Date(b.createdAt);
      return direction === 'asc' ? da - db : db - da;
    }

    return 0;
  });

  return copy;
};

/**
 * Applies all active filters and search to the task list.
 * @param {object[]} tasks
 * @param {object} filters - { status, priority, category, search, sortField, sortDir }
 * @returns {object[]}
 */
const applyFilters = (tasks, filters = {}) => {
  let result = tasks || [];
  result = filterByStatus(result, filters.status || 'all');
  result = filterByPriority(result, filters.priority || 'all');
  result = filterByCategory(result, filters.category || 'all');
  result = searchTasks(result, filters.search || '');
  if (filters.sortField) {
    result = sortTasks(result, filters.sortField, filters.sortDir || 'asc');
  }
  return result;
};

/* ── Analytics ────────────────────────────────────────────── */

/**
 * Calculates completion percentage.
 * @param {object[]} tasks
 * @returns {number} 0–100
 */
const completionPercentage = (tasks) => {
  if (!tasks || tasks.length === 0) return 0;
  const done = tasks.filter(t => t.status === 'completed').length;
  return Math.round((done / tasks.length) * 100);
};

/**
 * Calculates all dashboard statistics from task data.
 * @param {object[]} tasks
 * @returns {object}
 */
const calcStats = (tasks) => {
  const all   = tasks || [];
  const today = window.TFUtils.todayString();

  const completed  = all.filter(t => t.status === 'completed');
  const overdue    = all.filter(t => isOverdue(t));
  const highPri    = all.filter(t => t.priority === 'High' && t.status !== 'completed');
  const todayTasks = all.filter(t => t.dueDate === today);
  const pending    = all.filter(t => t.status !== 'completed');

  // Upcoming: due in next 7 days, not overdue, not completed
  const now     = new Date();
  const in7days = new Date(now.getTime() + 7 * 24 * 3600 * 1000);
  const upcoming = all.filter(t => {
    if (t.status === 'completed' || !t.dueDate) return false;
    const d = window.TFUtils.parseDateTime(t.dueDate, t.dueTime);
    return d && d > now && d <= in7days;
  });

  return {
    total:      all.length,
    completed:  completed.length,
    pending:    pending.length,
    overdue:    overdue.length,
    highPri:    highPri.length,
    today:      todayTasks.length,
    upcoming:   upcoming.length,
    percentage: completionPercentage(all),
    todayList:  todayTasks,
    upcomingList: upcoming,
    overdueList:  overdue,
  };
};

window.TFTasks = {
  validateTask,
  createTask,
  updateTask,
  deleteTask,
  toggleComplete,
  isOverdue,
  getDisplayStatus,
  filterByStatus,
  filterByPriority,
  filterByCategory,
  searchTasks,
  sortTasks,
  applyFilters,
  completionPercentage,
  calcStats,
};
