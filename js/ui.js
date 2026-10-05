/* ============================================================
   TaskFlow – ui.js
   DOM rendering helpers — no business logic, no storage calls
   ============================================================ */

'use strict';

/* ── Toast Notifications ──────────────────────────────────── */

const elToastContainer = () => document.getElementById('toast-container');

/**
 * Shows a toast message.
 * @param {string} message
 * @param {'success'|'error'|'warning'|'info'} type
 * @param {number} [duration=4000]
 */
const showToast = (message, type = 'info', duration = 4000) => {
  const container = elToastContainer();
  if (!container) return;

  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'polite');

  toast.innerHTML = `
    <span class="toast__icon" aria-hidden="true">${icons[type] || icons.info}</span>
    <span class="toast__message">${window.TFUtils.escapeHtml(message)}</span>
    <button class="toast__close" aria-label="Dismiss notification">×</button>
  `;

  toast.querySelector('.toast__close').addEventListener('click', () => removeToast(toast));
  container.appendChild(toast);

  if (duration > 0) {
    setTimeout(() => removeToast(toast), duration);
  }
};

const removeToast = (toast) => {
  if (!toast || !toast.parentNode) return;
  toast.style.animation = 'toastOut 0.3s ease forwards';
  setTimeout(() => toast.remove(), 300);
};

/* ── Priority & Status Helpers ────────────────────────────── */

const priorityBadgeHtml = (priority) => {
  const cls = `priority-badge--${(priority || 'medium').toLowerCase()}`;
  return `<span class="badge ${cls}">${window.TFUtils.escapeHtml(priority || 'Medium')}</span>`;
};

const statusBadgeHtml = (status) => {
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return `<span class="badge status-badge--${status}">${label}</span>`;
};

const categoryChipHtml = (category) => {
  if (!category) return '';
  return `<span class="category-chip">${window.TFUtils.escapeHtml(category)}</span>`;
};

/* ── Countdown Display ────────────────────────────────────── */

/**
 * Formats a time-remaining object into a display string.
 * @param {{ days, hours, minutes, seconds, overdue }} tr
 * @returns {string}
 */
const formatCountdown = (tr) => {
  if (!tr) return '';
  if (tr.overdue) return 'Overdue';
  const { days, hours, minutes, seconds } = tr;
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
};

/* ── Task Card ────────────────────────────────────────────── */

/**
 * Renders a single task card element.
 * @param {object} task
 * @returns {HTMLElement}
 */
const renderTaskCard = (task) => {
  const { getDisplayStatus, isOverdue } = window.TFTasks;
  const { formatDueDateTime, escapeHtml } = window.TFUtils;

  const status   = getDisplayStatus(task);
  const overdue  = isOverdue(task);
  const priority = (task.priority || 'medium').toLowerCase();
  const isDone   = task.status === 'completed';

  const li = document.createElement('li');
  li.className = [
    'task-card',
    `task-card--${priority}`,
    isDone   ? 'task-card--completed' : '',
    overdue  ? 'task-card--overdue'   : '',
  ].filter(Boolean).join(' ');
  li.dataset.taskId = task.id;

  const dueLine = formatDueDateTime(task.dueDate, task.dueTime);
  const cdClass = overdue ? 'task-card__countdown--overdue' : '';

  li.innerHTML = `
    <div class="task-card__header">
      <h3 class="task-card__title">${escapeHtml(task.title)}</h3>
      <button class="task-complete-btn ${isDone ? 'completed' : ''}"
              aria-label="${isDone ? 'Reopen' : 'Complete'} task: ${escapeHtml(task.title)}"
              data-action="toggle" data-id="${escapeHtml(task.id)}">
        ${isDone ? '✓' : ''}
      </button>
    </div>
    <div class="task-card__badges">
      ${priorityBadgeHtml(task.priority)}
      ${statusBadgeHtml(status)}
      ${categoryChipHtml(task.category)}
    </div>
    ${task.description ? `<p class="task-card__description">${escapeHtml(task.description)}</p>` : ''}
    <div class="task-card__meta">
      ${task.dueDate ? `<span class="task-card__meta-item">📅 ${escapeHtml(dueLine)}</span>` : ''}
    </div>
    ${task.dueDate && !isDone ? `
      <div class="task-card__countdown ${cdClass}"
           aria-live="polite" aria-label="Time remaining"
           data-countdown="${task.id}">
        --
      </div>` : ''}
    <div class="task-card__actions">
      <button class="btn btn--icon btn--sm" data-action="edit" data-id="${escapeHtml(task.id)}"
              aria-label="Edit task: ${escapeHtml(task.title)}">✏️</button>
      <button class="btn btn--icon btn--sm" data-action="delete" data-id="${escapeHtml(task.id)}"
              aria-label="Delete task: ${escapeHtml(task.title)}">🗑️</button>
    </div>
  `;

  return li;
};

/* ── Task List ────────────────────────────────────────────── */

/**
 * Renders a list of tasks into a container element.
 * @param {HTMLElement} container - <ul> element
 * @param {object[]} tasks
 * @param {string} [emptyMessage]
 */
const renderTaskList = (container, tasks, emptyMessage = 'No tasks found.') => {
  if (!container) return;
  container.innerHTML = '';

  if (!tasks || tasks.length === 0) {
    container.innerHTML = `
      <li class="empty-state">
        <div class="empty-state__emoji">📋</div>
        <h3 class="empty-state__title">Nothing here</h3>
        <p class="empty-state__text">${window.TFUtils.escapeHtml(emptyMessage)}</p>
      </li>`;
    return;
  }

  const fragment = document.createDocumentFragment();
  tasks.forEach(task => fragment.appendChild(renderTaskCard(task)));
  container.appendChild(fragment);
};

/* ── Compact Task List (dashboard) ───────────────────────── */

/**
 * Renders a compact task list (for dashboard panels).
 * @param {HTMLElement} container
 * @param {object[]} tasks
 * @param {string} [emptyText]
 */
const renderCompactList = (container, tasks, emptyText = 'No tasks') => {
  if (!container) return;
  container.innerHTML = '';

  if (!tasks || tasks.length === 0) {
    container.innerHTML = `<p class="text-muted" style="font-size:var(--font-size-sm);padding:var(--space-3) 0">${window.TFUtils.escapeHtml(emptyText)}</p>`;
    return;
  }

  tasks.slice(0, 6).forEach(task => {
    const div = document.createElement('div');
    div.className = 'task-list-compact__item';
    div.setAttribute('role', 'button');
    div.setAttribute('tabindex', '0');
    div.dataset.taskId = task.id;
    div.dataset.action = 'edit';
    div.dataset.id = task.id;

    const dueLine = task.dueDate ? window.TFUtils.formatDueDateTime(task.dueDate, task.dueTime) : '';
    const prio = (task.priority || 'medium').toLowerCase();

    div.innerHTML = `
      <span class="task-list-compact__dot task-list-compact__dot--${prio}" aria-hidden="true"></span>
      <span class="task-list-compact__title">${window.TFUtils.escapeHtml(task.title)}</span>
      ${dueLine ? `<span class="task-list-compact__time">${window.TFUtils.escapeHtml(dueLine)}</span>` : ''}
    `;
    container.appendChild(div);
  });
};

/* ── Modal helpers ────────────────────────────────────────── */

/**
 * Opens a modal overlay and traps focus inside.
 * @param {string} modalId
 */
const openModal = (modalId) => {
  const overlay = document.getElementById(modalId);
  if (!overlay) return;
  overlay.classList.add('open');
  overlay.removeAttribute('aria-hidden');

  // Move focus to first focusable element
  requestAnimationFrame(() => {
    const focusable = overlay.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length) focusable[0].focus();
  });
};

/**
 * Closes a modal overlay.
 * @param {string} modalId
 * @param {HTMLElement} [returnFocus] element to return focus to
 */
const closeModal = (modalId, returnFocus) => {
  const overlay = document.getElementById(modalId);
  if (!overlay) return;
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  if (returnFocus) returnFocus.focus();
};

/**
 * Traps Tab focus inside a modal panel.
 * @param {KeyboardEvent} e
 * @param {HTMLElement} panel
 */
const trapFocus = (e, panel) => {
  if (e.key !== 'Tab') return;
  const focusable = [...panel.querySelectorAll(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )].filter(el => el.offsetParent !== null);
  if (!focusable.length) return;
  const first = focusable[0];
  const last  = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault(); last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault(); first.focus();
  }
};

/* ── Form helpers ─────────────────────────────────────────── */

/**
 * Displays validation errors on a form.
 * @param {HTMLElement} form
 * @param {object} errors - { fieldName: errorMessage }
 */
const showFormErrors = (form, errors) => {
  // Clear previous errors
  form.querySelectorAll('.form-error').forEach(el => el.textContent = '');
  form.querySelectorAll('.form-input--error, .form-select--error, .form-textarea--error')
      .forEach(el => el.classList.remove('form-input--error', 'form-select--error', 'form-textarea--error'));

  Object.entries(errors).forEach(([field, msg]) => {
    const input = form.querySelector(`[name="${field}"]`);
    const errEl = form.querySelector(`[data-error="${field}"]`);
    if (input) {
      const cls = input.tagName === 'SELECT' ? 'form-select--error' :
                  input.tagName === 'TEXTAREA' ? 'form-textarea--error' : 'form-input--error';
      input.classList.add(cls);
    }
    if (errEl) errEl.textContent = msg;
  });
};

/**
 * Clears all validation errors on a form.
 * @param {HTMLElement} form
 */
const clearFormErrors = (form) => {
  form.querySelectorAll('.form-error').forEach(el => el.textContent = '');
  form.querySelectorAll('[class*="--error"]').forEach(el => {
    el.className = el.className.replace(/\S+--error/g, '').trim();
  });
};

/* ── Navigation ───────────────────────────────────────────── */

/**
 * Activates a page section and updates nav.
 * @param {string} sectionId
 */
const showSection = (sectionId) => {
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => {
    n.classList.remove('active');
    n.removeAttribute('aria-current');
  });

  const section = document.getElementById(sectionId);
  if (section) section.classList.add('active');

  const navItem = document.querySelector(`.nav-item[data-section="${sectionId}"]`);
  if (navItem) {
    navItem.classList.add('active');
    navItem.setAttribute('aria-current', 'page');
  }

  // Update header title
  const titleEl = document.getElementById('header-title');
  if (titleEl && navItem) {
    const label = navItem.querySelector('.nav-item__label');
    if (label) titleEl.textContent = label.textContent;
  }
};

/* ── Progress bar ─────────────────────────────────────────── */

/**
 * Updates a progress bar element.
 * @param {string} barId - id of .progress-bar__fill element
 * @param {string} labelId - id of percentage label element
 * @param {number} pct - 0–100
 */
const updateProgressBar = (barId, labelId, pct) => {
  const bar   = document.getElementById(barId);
  const label = document.getElementById(labelId);
  if (bar)   bar.style.width = `${pct}%`;
  if (label) label.textContent = `${pct}%`;
};

window.TFUI = {
  showToast,
  renderTaskCard,
  renderTaskList,
  renderCompactList,
  openModal,
  closeModal,
  trapFocus,
  showFormErrors,
  clearFormErrors,
  showSection,
  updateProgressBar,
  priorityBadgeHtml,
  statusBadgeHtml,
  categoryChipHtml,
  formatCountdown,
};
