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
 * Returns tasks scheduled for a specific date string, sorted by time.
 * @param {object[]} tasks
 * @param {string} dateStr - YYYY-MM-DD
 * @returns {object[]}
 */
const getTasksForDate = (tasks, dateStr) => {
  return tasks
    .filter(t => t.dueDate === dateStr)
    .sort((a, b) => {
      // All-day tasks go last
      if (!a.dueTime && !b.dueTime) return 0;
      if (!a.dueTime) return 1;
      if (!b.dueTime) return -1;
      return a.dueTime.localeCompare(b.dueTime);
    });
};

/**
 * Renders a single schedule task item (clickable to open edit modal).
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
    overdue              ? 'schedule-task--overdue'   : '',
    task.status === 'completed' ? 'schedule-task--completed' : '',
  ].filter(Boolean).join(' ');

  div.setAttribute('role', 'button');
  div.setAttribute('tabindex', '0');
  div.dataset.action = 'edit';
  div.dataset.id = task.id;
  div.setAttribute('aria-label',
    `${task.title}, ${task.priority} priority, ${status}${task.dueTime ? ', at ' + formatTime(task.dueTime) : ''}`
  );

  const timeLabel = task.dueTime ? escapeHtml(formatTime(task.dueTime)) : 'All day';

  div.innerHTML = `
    <div class="schedule-task__time">${timeLabel}</div>
    <div class="schedule-task__info">
      <div class="schedule-task__title">${escapeHtml(task.title)}</div>
      ${task.category ? `<div class="schedule-task__cat">${escapeHtml(task.category)}</div>` : ''}
    </div>
    <span class="badge priority-badge--${prio}" aria-hidden="true">${escapeHtml(task.priority)}</span>
  `;

  // Keyboard: Enter or Space opens edit modal
  div.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      div.click();
    }
  });

  return div;
};

/**
 * Renders the Day View for a single date.
 * @param {HTMLElement} container
 * @param {Date} date
 * @param {object[]} tasks
 * @param {Function} onAddTask - callback(dateStr)
 */
const renderDayView = (container, date, tasks, onAddTask) => {
  const { dateToString, formatDate, escapeHtml } = window.TFUtils;
  const dateStr  = dateToString(date);
  const dayTasks = getTasksForDate(tasks, dateStr);
  const isToday  = dateStr === window.TFUtils.todayString();
  const dayName  = DAY_NAMES[date.getDay()];

  container.innerHTML = '';

  // Header
  const header = document.createElement('div');
  header.className = 'schedule-day-header';

  const headingDiv = document.createElement('div');
  const h3 = document.createElement('h3');
  h3.className = 'schedule-day-name';
  h3.textContent = dayName;
  if (isToday) {
    const todayBadge = document.createElement('span');
    todayBadge.className = 'badge status-badge--pending';
    todayBadge.style.fontSize = '10px';
    todayBadge.style.marginLeft = '8px';
    todayBadge.textContent = 'Today';
    h3.appendChild(todayBadge);
  }
  const dateP = document.createElement('p');
  dateP.style.cssText = 'color:var(--color-text-muted);font-size:var(--font-size-sm)';
  dateP.textContent = formatDate(dateStr);
  headingDiv.appendChild(h3);
  headingDiv.appendChild(dateP);

  const addBtn = document.createElement('button');
  addBtn.className = 'btn btn--secondary btn--sm';
  addBtn.dataset.action = 'add-from-schedule';
  addBtn.dataset.date = dateStr;
  addBtn.textContent = '+ Add Task';
  if (onAddTask) addBtn.addEventListener('click', () => onAddTask(dateStr));

  header.appendChild(headingDiv);
  header.appendChild(addBtn);
  container.appendChild(header);

  // Task list
  const list = document.createElement('div');
  list.className = 'schedule-tasks-list';
  list.id = 'day-tasks-list';

  if (dayTasks.length === 0) {
    list.innerHTML = `
      <div class="empty-state" style="padding:var(--space-8)">
        <div class="empty-state__emoji">📅</div>
        <p class="empty-state__title">No tasks for ${escapeHtml(dayName)}</p>
        <p class="empty-state__text">Click "+ Add Task" to schedule something here.</p>
      </div>`;
  } else {
    dayTasks.forEach(task => list.appendChild(renderScheduleTask(task)));
  }

  container.appendChild(list);
};

/**
 * Renders the Week View showing Mon–Sun.
 * @param {HTMLElement} container
 * @param {Date} weekDate - any date within the target week
 * @param {object[]} tasks
 * @param {Function} onAddTask - callback(dateStr)
 */
const renderWeekView = (container, weekDate, tasks, onAddTask) => {
  const { getWeekDays, dateToString, formatWeekRange, escapeHtml } = window.TFUtils;
  const days  = getWeekDays(weekDate);
  const today = window.TFUtils.todayString();

  container.innerHTML = '';

  // Week range subheading
  const rangeP = document.createElement('p');
  rangeP.style.cssText = 'font-size:var(--font-size-sm);color:var(--color-text-muted);margin-bottom:var(--space-4)';
  rangeP.textContent = formatWeekRange(days);
  container.appendChild(rangeP);

  // Grid
  const grid = document.createElement('div');
  grid.className = 'week-grid';
  grid.id = 'week-grid';

  days.forEach(day => {
    const dateStr  = dateToString(day);
    const dayTasks = getTasksForDate(tasks, dateStr);
    const isToday  = dateStr === today;
    const hasOverdue = dayTasks.some(t => window.TFTasks.isOverdue(t));

    const col = document.createElement('div');
    col.className = `week-day${isToday ? ' week-day--today' : ''}`;
    col.style.cssText = [
      'background: var(--color-bg-secondary)',
      `border: 1px solid ${isToday ? 'var(--color-accent)' : 'var(--color-border)'}`,
      'border-radius: var(--radius-md)',
      'padding: var(--space-3)',
      'display: flex',
      'flex-direction: column',
      'gap: var(--space-2)',
      'min-height: 140px',
      hasOverdue ? 'border-top: 2px solid var(--color-danger)' : '',
    ].filter(Boolean).join(';');

    // Day column header
    const colHeader = document.createElement('div');
    colHeader.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;flex-shrink:0';

    const dayInfo = document.createElement('div');
    const shortName = document.createElement('div');
    shortName.style.cssText = `font-size:var(--font-size-xs);color:var(--color-text-muted);font-weight:var(--font-weight-medium)`;
    shortName.textContent = DAY_SHORT[day.getDay()];

    const dayNum = document.createElement('div');
    dayNum.style.cssText = `font-size:var(--font-size-md);font-weight:var(--font-weight-bold);color:${isToday ? 'var(--color-accent)' : 'var(--color-text-primary)'}`;
    dayNum.textContent = String(day.getDate());

    dayInfo.appendChild(shortName);
    dayInfo.appendChild(dayNum);

    // Task count badge
    if (dayTasks.length > 0) {
      const countBadge = document.createElement('span');
      countBadge.className = `badge ${hasOverdue ? 'status-badge--overdue' : 'status-badge--pending'}`;
      countBadge.style.fontSize = '10px';
      countBadge.textContent = String(dayTasks.length);
      countBadge.setAttribute('aria-label', `${dayTasks.length} task${dayTasks.length !== 1 ? 's' : ''}`);
      dayInfo.appendChild(countBadge);
    }

    const addColBtn = document.createElement('button');
    addColBtn.className = 'btn btn--icon';
    addColBtn.style.cssText = 'font-size:12px;min-width:24px;min-height:24px;padding:2px';
    addColBtn.dataset.action = 'add-from-schedule';
    addColBtn.dataset.date = dateStr;
    addColBtn.setAttribute('aria-label', `Add task for ${DAY_NAMES[day.getDay()]}`);
    addColBtn.textContent = '+';
    if (onAddTask) {
      addColBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        onAddTask(dateStr);
      });
    }

    colHeader.appendChild(dayInfo);
    colHeader.appendChild(addColBtn);
    col.appendChild(colHeader);

    // Separator
    const sep = document.createElement('hr');
    sep.style.cssText = 'border:none;border-top:1px solid var(--color-border);margin:0;flex-shrink:0';
    col.appendChild(sep);

    if (dayTasks.length === 0) {
      const emptyMsg = document.createElement('p');
      emptyMsg.style.cssText = 'font-size:var(--font-size-xs);color:var(--color-text-muted);text-align:center;padding:var(--space-2) 0;flex:1';
      emptyMsg.textContent = 'No tasks';
      col.appendChild(emptyMsg);
    } else {
      // Show up to 4 tasks; add overflow indicator
      const LIMIT = 4;
      const visible = dayTasks.slice(0, LIMIT);
      const overflow = dayTasks.length - LIMIT;

      visible.forEach(task => col.appendChild(renderScheduleTask(task)));

      if (overflow > 0) {
        const more = document.createElement('button');
        more.className = 'btn btn--ghost btn--sm';
        more.style.cssText = 'font-size:var(--font-size-xs);width:100%;margin-top:auto';
        more.textContent = `+${overflow} more`;
        more.addEventListener('click', () => {
          // Switch to day view for this date
          _scheduleState.view = 'day';
          _scheduleState.currentDate = day;
          // Trigger re-render via app.js — dispatch a custom event
          document.dispatchEvent(new CustomEvent('taskflow:schedule-day', { detail: { date: dateStr } }));
        });
        col.appendChild(more);
      }
    }

    grid.appendChild(col);
  });

  container.appendChild(grid);
};

/**
 * Returns current schedule state (copy).
 * @returns {{ view: string, currentDate: Date }}
 */
const getState = () => ({ ..._scheduleState });

/**
 * Navigates the schedule view.
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
  renderScheduleTask,
  renderDayView,
  renderWeekView,
  getState,
  navigate,
  setView,
};
