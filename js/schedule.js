/* ============================================================
   TaskFlow – schedule.js
   Schedule planner: day view + week view
   ============================================================ */

'use strict';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Current schedule state
let _scheduleState = {
  view:        'week',  // 'day' | 'week'
  currentDate: new Date(),
};

/**
 * Returns tasks scheduled for a specific date string.
 * @param {object[]} tasks
 * @param {string} dateStr - YYYY-MM-DD
 * @returns {object[]}
 */
const getTasksForDate = (tasks, dateStr) => {
  return tasks
    .filter(t => t.dueDate === dateStr)
    .sort((a, b) => {
      if (!a.dueTime && !b.dueTime) return 0;
      if (!a.dueTime) return 1;
      if (!b.dueTime) return -1;
      return a.dueTime.localeCompare(b.dueTime);
    });
};

/**
 * Renders a schedule task item.
 * @param {object} task
 * @returns {HTMLElement}
 */
const renderScheduleTask = (task) => {
  const { escapeHtml, formatTime } = window.TFUtils;
  const { isOverdue, getDisplayStatus } = window.TFTasks;

  const status  = getDisplayStatus(task);
  const overdue = isOverdue(task);
  const prio    = (task.priority || 'medium').toLowerCase();

  const div = document.createElement('div');
  div.className = [
    'schedule-task',
    `schedule-task--${prio}`,
    overdue ? 'schedule-task--overdue' : '',
    task.status === 'completed' ? 'schedule-task--completed' : '',
  ].filter(Boolean).join(' ');
  div.setAttribute('role', 'button');
  div.setAttribute('tabindex', '0');
  div.dataset.action = 'edit';
  div.dataset.id = task.id;
  div.setAttribute('aria-label', `${task.title}, ${task.priority} priority, ${status}`);

  div.innerHTML = `
    <div class="schedule-task__time">${task.dueTime ? escapeHtml(formatTime(task.dueTime)) : 'All day'}</div>
    <div class="schedule-task__info">
      <div class="schedule-task__title">${escapeHtml(task.title)}</div>
      ${task.category ? `<div class="schedule-task__cat">${escapeHtml(task.category)}</div>` : ''}
    </div>
    <span class="badge priority-badge--${prio}" aria-hidden="true">${escapeHtml(task.priority)}</span>
  `;

  return div;
};

/**
 * Renders the Day View.
 * @param {HTMLElement} container
 * @param {Date} date
 * @param {object[]} tasks
 * @param {Function} onAddTask - callback(dateStr)
 */
const renderDayView = (container, date, tasks, onAddTask) => {
  const { dateToString, formatDate } = window.TFUtils;
  const dateStr  = dateToString(date);
  const dayTasks = getTasksForDate(tasks, dateStr);
  const isToday  = dateStr === window.TFUtils.todayString();

  container.innerHTML = `
    <div class="schedule-day-header">
      <div>
        <h3 class="schedule-day-name">${DAY_NAMES[date.getDay()]}${isToday ? ' <span class="badge status-badge--pending" style="font-size:10px">Today</span>' : ''}</h3>
        <p class="schedule-day-date" style="color:var(--color-text-muted);font-size:var(--font-size-sm)">${formatDate(dateStr)}</p>
      </div>
      <button class="btn btn--secondary btn--sm" data-action="add-from-schedule" data-date="${dateStr}">
        + Add Task
      </button>
    </div>
    <div class="schedule-tasks-list" id="day-tasks-list"></div>
  `;

  const list = container.querySelector('#day-tasks-list');
  if (dayTasks.length === 0) {
    list.innerHTML = `
      <div class="empty-state" style="padding:var(--space-8)">
        <div class="empty-state__emoji">📅</div>
        <p class="empty-state__title">No tasks for this day</p>
        <p class="empty-state__text">Click "+ Add Task" to schedule something.</p>
      </div>`;
  } else {
    dayTasks.forEach(task => list.appendChild(renderScheduleTask(task)));
  }

  // Wire add button
  const addBtn = container.querySelector('[data-action="add-from-schedule"]');
  if (addBtn && onAddTask) {
    addBtn.addEventListener('click', () => onAddTask(dateStr));
  }
};

/**
 * Renders the Week View (Mon–Sun).
 * @param {HTMLElement} container
 * @param {Date} weekDate - any date in the target week
 * @param {object[]} tasks
 * @param {Function} onAddTask - callback(dateStr)
 */
const renderWeekView = (container, weekDate, tasks, onAddTask) => {
  const { getWeekDays, dateToString, formatWeekRange } = window.TFUtils;
  const days    = getWeekDays(weekDate);
  const today   = window.TFUtils.todayString();

  container.innerHTML = `
    <div class="week-header" style="margin-bottom:var(--space-4)">
      <h3 style="font-size:var(--font-size-base);font-weight:var(--font-weight-semibold);color:var(--color-text-secondary)">
        ${window.TFUtils.escapeHtml(formatWeekRange(days))}
      </h3>
    </div>
    <div class="week-grid" id="week-grid"></div>
  `;

  const grid = container.querySelector('#week-grid');

  days.forEach(day => {
    const dateStr  = dateToString(day);
    const dayTasks = getTasksForDate(tasks, dateStr);
    const isToday  = dateStr === today;

    const col = document.createElement('div');
    col.className = `week-day${isToday ? ' week-day--today' : ''}`;
    col.style.cssText = `
      background: var(--color-bg-secondary);
      border: 1px solid ${isToday ? 'var(--color-accent)' : 'var(--color-border)'};
      border-radius: var(--radius-md);
      padding: var(--space-3);
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      min-height: 120px;
    `;

    const header = document.createElement('div');
    header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:4px';
    header.innerHTML = `
      <div>
        <div style="font-size:var(--font-size-xs);color:var(--color-text-muted);font-weight:var(--font-weight-medium)">${DAY_SHORT[day.getDay()]}</div>
        <div style="font-size:var(--font-size-md);font-weight:var(--font-weight-bold);color:${isToday ? 'var(--color-accent)' : 'var(--color-text-primary)'}">${day.getDate()}</div>
      </div>
      <button class="btn btn--icon" style="font-size:12px;min-width:24px;min-height:24px"
              data-action="add-from-schedule" data-date="${dateStr}"
              aria-label="Add task for ${DAY_NAMES[day.getDay()]}">+</button>
    `;
    col.appendChild(header);

    if (dayTasks.length === 0) {
      const empty = document.createElement('p');
      empty.style.cssText = 'font-size:var(--font-size-xs);color:var(--color-text-muted);text-align:center;padding:var(--space-2) 0';
      empty.textContent = 'No tasks';
      col.appendChild(empty);
    } else {
      dayTasks.forEach(task => {
        const item = renderScheduleTask(task);
        col.appendChild(item);
      });
    }

    grid.appendChild(col);
  });

  // Wire add-from-schedule buttons
  if (onAddTask) {
    grid.querySelectorAll('[data-action="add-from-schedule"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        onAddTask(btn.dataset.date);
      });
    });
  }
};

/**
 * Returns current schedule state.
 */
const getState = () => ({ ..._scheduleState });

/**
 * Navigates the schedule (prev/next/today).
 * @param {'prev'|'next'|'today'} dir
 */
const navigate = (dir) => {
  if (dir === 'today') {
    _scheduleState.currentDate = new Date();
    return;
  }

  const d = new Date(_scheduleState.currentDate);
  if (_scheduleState.view === 'day') {
    d.setDate(d.getDate() + (dir === 'next' ? 1 : -1));
  } else {
    d.setDate(d.getDate() + (dir === 'next' ? 7 : -7));
  }
  _scheduleState.currentDate = d;
};

/**
 * Switches between day and week view.
 * @param {'day'|'week'} view
 */
const setView = (view) => {
  _scheduleState.view = view;
};

window.TFSchedule = {
  getTasksForDate,
  renderDayView,
  renderWeekView,
  getState,
  navigate,
  setView,
};
