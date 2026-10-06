/* ============================================================
   TaskFlow – app.js
   Application bootstrap: wires all modules, handles navigation,
   task modal, settings, sidebar, and global events.
   ============================================================ */

'use strict';

/* ── State ────────────────────────────────────────────────── */
let _editingTaskId  = null;  // null = new task, string = editing existing
let _currentSection = 'section-dashboard';
let _filters = {
  status:    'all',
  priority:  'all',
  category:  'all',
  search:    '',
  sortField: 'dueDate',
  sortDir:   'asc',
};
let _pendingScheduleDate = null; // pre-fill date when adding from schedule

/* ── Landing page ─────────────────────────────────────────── */

const initLandingPage = () => {
  const landing = document.getElementById('landing-page');
  if (!landing) return;

  // If user already visited, skip landing page
  if (sessionStorage.getItem('tf_visited')) {
    landing.classList.add('hidden');
    return;
  }

  const launchApp = () => {
    sessionStorage.setItem('tf_visited', '1');
    landing.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    landing.style.opacity = '0';
    landing.style.transform = 'scale(0.98)';
    setTimeout(() => {
      landing.classList.add('hidden');
      landing.style.transition = '';
      landing.style.opacity = '';
      landing.style.transform = '';
      // Focus main content for accessibility
      const mainContent = document.getElementById('main-content');
      if (mainContent) mainContent.focus();
    }, 500);
  };

  // Wire all CTA buttons
  ['lp-get-started-btn', 'lp-nav-get-started', 'lp-cta-btn'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', launchApp);
  });
};

/* ── Boot ─────────────────────────────────────────────────── */

const init = () => {
  initLandingPage();
  applyTheme();
  updateHeaderDate();
  showSection('section-dashboard');
  refreshTasksView();
  TFDashboard.refreshDashboard();
  TFCountdown.startCountdownTimer();
  TFNotifications.startReminderChecker();

  // Show notification prompt after 3 seconds
  setTimeout(() => TFNotifications.showPermissionPrompt(), 3000);

  wireNavigation();
  wireHeader();
  wireSidebar();
  wireTaskModal();
  wireConfirmModal();
  wireSettingsPage();
  wireSchedulePage();
  wireGlobalEvents();

  // Re-render schedule if on schedule section
  renderScheduleView();
};

/* ── Theme ────────────────────────────────────────────────── */

const applyTheme = () => {
  const settings = TFStorage.getSettings();
  const theme = settings.theme || 'dark';
  document.documentElement.setAttribute('data-theme', theme);
  // sync settings page toggle if it exists
  const toggle = document.getElementById('settings-theme');
  if (toggle) toggle.checked = theme === 'light';
};

/* ── Header date ──────────────────────────────────────────── */

const updateHeaderDate = () => {
  const el = document.getElementById('header-date');
  if (el) {
    el.textContent = new Date().toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    });
  }
};

/* ── Navigation ───────────────────────────────────────────── */

const wireNavigation = () => {
  document.querySelectorAll('.nav-item[data-section]').forEach(item => {
    item.addEventListener('click', () => {
      const sectionId = item.dataset.section;
      navigateTo(sectionId);
    });
    item.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        item.click();
      }
    });
  });
};

const navigateTo = (sectionId) => {
  _currentSection = sectionId;
  TFUI.showSection(sectionId);

  // Close mobile sidebar
  closeMobileSidebar();

  if (sectionId === 'section-dashboard') {
    TFDashboard.refreshDashboard();
  } else if (sectionId === 'section-tasks') {
    refreshTasksView();
  } else if (sectionId === 'section-schedule') {
    renderScheduleView();
  } else if (sectionId === 'section-completed') {
    renderCompletedView();
  } else if (sectionId === 'section-settings') {
    renderSettingsPage();
  }
};

/* ── Sidebar ──────────────────────────────────────────────── */

const wireSidebar = () => {
  const collapseBtn = document.getElementById('sidebar-collapse-btn');
  const sidebar     = document.getElementById('sidebar');
  const pageWrapper = document.getElementById('page-wrapper');

  if (collapseBtn) {
    collapseBtn.addEventListener('click', () => {
      const isCollapsed = sidebar.classList.toggle('collapsed');
      pageWrapper.classList.toggle('sidebar-collapsed', isCollapsed);
      collapseBtn.setAttribute('aria-expanded', String(!isCollapsed));
    });
  }
};

const closeMobileSidebar = () => {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  sidebar.classList.remove('mobile-open');
  if (overlay) overlay.classList.remove('visible');
};

/* ── Header ───────────────────────────────────────────────── */

const wireHeader = () => {
  // Hamburger menu
  const menuBtn = document.getElementById('header-menu-btn');
  const overlay = document.getElementById('sidebar-overlay');
  const sidebar = document.getElementById('sidebar');

  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      const isOpen = sidebar.classList.toggle('mobile-open');
      if (overlay) overlay.classList.toggle('visible', isOpen);
    });
  }

  if (overlay) {
    overlay.addEventListener('click', closeMobileSidebar);
  }

  // Global search
  const searchInput = document.getElementById('header-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      _filters.search = e.target.value;
      if (_currentSection !== 'section-tasks') {
        navigateTo('section-tasks');
      } else {
        refreshTasksView();
      }
    });
    // Handle native clear button on type="search"
    searchInput.addEventListener('search', (e) => {
      if (!e.target.value) {
        _filters.search = '';
        refreshTasksView();
      }
    });
    // Escape clears search when focused
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        searchInput.value = '';
        _filters.search = '';
        refreshTasksView();
        searchInput.blur();
      }
    });
  }

  // Notification bell
  const bellBtn = document.getElementById('notif-bell-btn');
  if (bellBtn) {
    bellBtn.addEventListener('click', async () => {
      TFNotifications.clearNotifBell();
      const perm = TFNotifications.getPermission();
      if (perm === 'default') {
        const result = await TFNotifications.requestPermission();
        if (result === 'granted') {
          TFUI.showToast('Notifications enabled!', 'success');
        }
      } else if (perm === 'granted') {
        TFUI.showToast('Notifications are enabled.', 'info');
      } else {
        TFUI.showToast('Notifications are blocked. Enable them in browser settings.', 'warning');
      }
    });
  }
};

/* ── Task Modal ───────────────────────────────────────────── */

const wireTaskModal = () => {
  // Open new task modal
  const addBtn = document.getElementById('add-task-btn');
  if (addBtn) addBtn.addEventListener('click', () => openTaskModal(null));

  // Modal close
  document.getElementById('task-modal-close')?.addEventListener('click', closeTaskModal);
  document.getElementById('task-modal-cancel')?.addEventListener('click', closeTaskModal);

  // Overlay click closes
  document.getElementById('task-modal-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'task-modal-overlay') closeTaskModal();
  });

  // Escape key closes
  document.getElementById('task-modal-overlay')?.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeTaskModal();
    const panel = document.getElementById('task-modal');
    if (panel) TFUI.trapFocus(e, panel);
  });

  // Form submit
  document.getElementById('task-form')?.addEventListener('submit', handleTaskFormSubmit);

  // dueTime validation: disable if no dueDate
  const dueDateInput = document.getElementById('task-dueDate');
  const dueTimeInput = document.getElementById('task-dueTime');
  if (dueDateInput && dueTimeInput) {
    dueDateInput.addEventListener('change', () => {
      dueTimeInput.disabled = !dueDateInput.value;
      if (!dueDateInput.value) dueTimeInput.value = '';
    });
  }
};

const openTaskModal = (taskId, prefillDate = null) => {
  _editingTaskId = taskId;
  const form  = document.getElementById('task-form');
  const title = document.getElementById('task-modal-title');

  TFUI.clearFormErrors(form);
  form.reset();

  // Enable dueTime by default
  const dueTimeInput = document.getElementById('task-dueTime');
  if (dueTimeInput) dueTimeInput.disabled = false;

  if (taskId) {
    // Edit mode
    const tasks = TFStorage.getTasks();
    const task  = tasks.find(t => t.id === taskId);
    if (!task) { TFUI.showToast('Task not found.', 'error'); return; }
    if (title) title.textContent = 'Edit Task';
    populateTaskForm(task);
  } else {
    // New task mode
    if (title) title.textContent = 'Add New Task';
    const settings = TFStorage.getSettings();
    const priorityEl = document.getElementById('task-priority');
    if (priorityEl) priorityEl.value = settings.defaultPriority || 'Medium';
    if (prefillDate) {
      const dueDateEl = document.getElementById('task-dueDate');
      if (dueDateEl) dueDateEl.value = prefillDate;
    }
  }

  TFUI.openModal('task-modal-overlay');
};

const populateTaskForm = (task) => {
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
  };
  set('task-title',       task.title);
  set('task-description', task.description);
  set('task-priority',    task.priority);
  set('task-category',    task.category);
  set('task-dueDate',     task.dueDate);
  set('task-dueTime',     task.dueTime);

  // Disable dueTime if no dueDate
  const dueTimeInput = document.getElementById('task-dueTime');
  if (dueTimeInput) dueTimeInput.disabled = !task.dueDate;
};

const closeTaskModal = () => {
  TFUI.closeModal('task-modal-overlay');
  _editingTaskId = null;
  _pendingScheduleDate = null;
  document.getElementById('add-task-btn')?.focus();
};

const handleTaskFormSubmit = (e) => {
  e.preventDefault();
  const form = e.target;

  const data = {
    title:       form.querySelector('[name="title"]')?.value || '',
    description: form.querySelector('[name="description"]')?.value || '',
    priority:    form.querySelector('[name="priority"]')?.value || 'Medium',
    category:    form.querySelector('[name="category"]')?.value || '',
    dueDate:     form.querySelector('[name="dueDate"]')?.value || null,
    dueTime:     form.querySelector('[name="dueTime"]')?.value || null,
  };

  // Strip empty strings to null/empty
  if (!data.dueDate)  data.dueDate = null;
  if (!data.dueTime)  data.dueTime = null;
  if (!data.category) data.category = '';

  const { valid, errors } = TFTasks.validateTask(data);
  if (!valid) {
    TFUI.showFormErrors(form, errors);
    // Focus the first errored field
    const firstErr = form.querySelector('[class*="--error"]');
    if (firstErr) firstErr.focus();
    return;
  }

  let tasks = TFStorage.getTasks();

  // Warn about past deadline (non-blocking)
  if (data.dueDate) {
    const deadline = TFUtils.parseDateTime(data.dueDate, data.dueTime);
    if (deadline && deadline < new Date()) {
      TFUI.showToast('Note: This task has a past deadline.', 'warning', 5000);
    }
  }

  if (_editingTaskId) {
    // Warn if another task has an identical title (excluding self)
    const duplicate = tasks.find(t =>
      t.id !== _editingTaskId &&
      t.title.trim().toLowerCase() === data.title.trim().toLowerCase()
    );
    if (duplicate) {
      TFUI.showToast(`A task named "${data.title.trim()}" already exists.`, 'warning', 5000);
    }

    TFNotifications.clearTaskNotifs(_editingTaskId);
    TFCountdown.clearOverdueAlert(_editingTaskId);
    tasks = TFTasks.updateTask(tasks, _editingTaskId, {
      title:       data.title.trim(),
      description: (data.description || '').trim(),
      priority:    data.priority,
      category:    (data.category || '').trim(),
      dueDate:     data.dueDate,
      dueTime:     data.dueTime,
    });
    TFStorage.saveTasks(tasks);
    TFUI.showToast('Task updated.', 'success');
  } else {
    // Warn about duplicate title on create
    const duplicate = tasks.find(t =>
      t.title.trim().toLowerCase() === data.title.trim().toLowerCase()
    );
    if (duplicate) {
      TFUI.showToast(`A task named "${data.title.trim()}" already exists.`, 'warning', 5000);
    }

    const newTask = TFTasks.createTask(data);
    tasks = [...tasks, newTask];
    TFStorage.saveTasks(tasks);
    TFUI.showToast('Task created!', 'success');
  }

  closeTaskModal();
  onTasksChanged();
};

/* ── Confirm (Delete) Modal ───────────────────────────────── */

let _deleteTargetId = null;

const wireConfirmModal = () => {
  document.getElementById('confirm-cancel-btn')?.addEventListener('click', closeConfirmModal);
  document.getElementById('confirm-modal-close')?.addEventListener('click', closeConfirmModal);

  document.getElementById('confirm-delete-btn')?.addEventListener('click', () => {
    if (!_deleteTargetId) return;

    if (_deleteTargetId === '__clear__') {
      TFStorage.clearAll();
      closeConfirmModal();
      onTasksChanged();
      applyTheme();
      TFUI.showToast('All data cleared.', 'info');
      _deleteTargetId = null;
      return;
    }

    let tasks = TFStorage.getTasks();
    tasks = TFTasks.deleteTask(tasks, _deleteTargetId);
    TFStorage.saveTasks(tasks);
    TFNotifications.clearTaskNotifs(_deleteTargetId);
    closeConfirmModal();
    onTasksChanged();
    TFUI.showToast('Task deleted.', 'success');
  });

  document.getElementById('confirm-modal-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'confirm-modal-overlay') closeConfirmModal();
  });
  document.getElementById('confirm-modal-overlay')?.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeConfirmModal();
  });
};

const openConfirmModal = (taskId, taskTitle) => {
  _deleteTargetId = taskId;
  const msgEl = document.getElementById('confirm-message');
  if (msgEl) {
    msgEl.textContent = `Delete "${taskTitle}"? This cannot be undone.`;
  }
  TFUI.openModal('confirm-modal-overlay');
};

const closeConfirmModal = () => {
  TFUI.closeModal('confirm-modal-overlay');
  _deleteTargetId = null;
};

/* ── Task list event delegation ───────────────────────────── */

const wireGlobalEvents = () => {
  // Delegate task actions from task list
  document.addEventListener('click', handleTaskAction);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const target = e.target;
      if (target.dataset.action && target.dataset.id) {
        e.preventDefault();
        handleTaskAction(e);
      }
    }
  });
};

const handleTaskAction = (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const action = btn.dataset.action;
  const id     = btn.dataset.id;

  if (action === 'toggle') {
    let tasks = TFStorage.getTasks();
    tasks = TFTasks.toggleComplete(tasks, id);
    TFStorage.saveTasks(tasks);
    onTasksChanged();
  }

  if (action === 'edit') {
    openTaskModal(id);
  }

  if (action === 'delete') {
    const tasks = TFStorage.getTasks();
    const task  = tasks.find(t => t.id === id);
    if (task) openConfirmModal(id, task.title);
  }

  if (action === 'add-from-schedule') {
    _pendingScheduleDate = btn.dataset.date;
    openTaskModal(null, _pendingScheduleDate);
  }
};

/* ── Tasks Section ────────────────────────────────────────── */

const refreshTasksView = () => {
  const allTasks  = TFStorage.getTasks();
  const filtered  = TFTasks.applyFilters(allTasks, _filters);
  const container = document.getElementById('task-list');

  // Update count label
  const countLabel = document.getElementById('tasks-count-label');
  if (countLabel) {
    const total = allTasks.length;
    const shown = filtered.length;
    if (_filters.search || _filters.status !== 'all' || _filters.priority !== 'all' || _filters.category !== 'all') {
      countLabel.textContent = `Showing ${shown} of ${total} task${total !== 1 ? 's' : ''}`;
    } else {
      countLabel.textContent = `${total} task${total !== 1 ? 's' : ''} total`;
    }
  }

  const emptyMsg = _filters.search
    ? `No tasks match "${TFUtils.escapeHtml(_filters.search)}". Try a different search term.`
    : (allTasks.length === 0
        ? 'No tasks yet. Click "+ Add Task" to create your first task!'
        : 'No tasks match your current filters. Try adjusting them.');

  if (container) {
    TFUI.renderTaskList(container, filtered, emptyMsg);
  }
  updateFilterCategoryOptions(allTasks);
  TFCountdown.restartCountdownTimer();
};

const updateFilterCategoryOptions = (tasks) => {
  const sel = document.getElementById('filter-category');
  if (!sel) return;
  const cats = [...new Set(tasks.map(t => t.category).filter(Boolean))].sort();
  const current = sel.value;
  sel.innerHTML = '<option value="all">All Categories</option>';
  cats.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    if (cat === current) opt.selected = true;
    sel.appendChild(opt);
  });
};

/* ── Wire filter/sort bar ─────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  // Filter bar bindings
  const bind = (id, key) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', (e) => {
      _filters[key] = e.target.value;
      refreshTasksView();
    });
  };

  bind('filter-status',   'status');
  bind('filter-priority', 'priority');
  bind('filter-category', 'category');
  bind('sort-field',      'sortField');
  bind('sort-dir',        'sortDir');

  // Reset filters button
  document.getElementById('reset-filters-btn')?.addEventListener('click', () => {
    _filters = { status: 'all', priority: 'all', category: 'all', search: '', sortField: 'dueDate', sortDir: 'asc' };
    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
    setVal('filter-status',   'all');
    setVal('filter-priority', 'all');
    setVal('filter-category', 'all');
    setVal('sort-field',      'dueDate');
    setVal('sort-dir',        'asc');
    const searchInput = document.getElementById('header-search');
    if (searchInput) searchInput.value = '';
    refreshTasksView();
  });
});

/* ── Completed Section ────────────────────────────────────── */

const renderCompletedView = () => {
  const allTasks  = TFStorage.getTasks();
  const tasks     = allTasks
    .filter(t => t.status === 'completed')
    .sort((a, b) => {
      // Most recently completed first
      const da = new Date(a.completedAt || a.updatedAt);
      const db = new Date(b.completedAt || b.updatedAt);
      return db - da;
    });

  const container = document.getElementById('completed-task-list');

  // Update count in header
  const heading = document.getElementById('comp-heading');
  if (heading) heading.textContent = `Completed Tasks (${tasks.length})`;

  if (container) {
    TFUI.renderTaskList(
      container,
      tasks,
      'No completed tasks yet. Start checking things off!'
    );
  }
};

/* ── Schedule Section ─────────────────────────────────────── */

const wireSchedulePage = () => {
  document.getElementById('schedule-prev-btn')?.addEventListener('click', () => {
    TFSchedule.navigate('prev');
    renderScheduleView();
  });
  document.getElementById('schedule-next-btn')?.addEventListener('click', () => {
    TFSchedule.navigate('next');
    renderScheduleView();
  });
  document.getElementById('schedule-today-btn')?.addEventListener('click', () => {
    TFSchedule.navigate('today');
    renderScheduleView();
  });
  document.getElementById('schedule-view-day')?.addEventListener('click', () => {
    TFSchedule.setView('day');
    updateScheduleViewBtns();
    renderScheduleView();
  });
  document.getElementById('schedule-view-week')?.addEventListener('click', () => {
    TFSchedule.setView('week');
    updateScheduleViewBtns();
    renderScheduleView();
  });

  // Handle "show more" overflow day navigation
  document.addEventListener('taskflow:schedule-day', (e) => {
    updateScheduleViewBtns();
    renderScheduleView();
  });
};

const updateScheduleViewBtns = () => {
  const state = TFSchedule.getState();
  document.getElementById('schedule-view-day')?.classList.toggle('btn--primary',  state.view === 'day');
  document.getElementById('schedule-view-day')?.classList.toggle('btn--ghost',    state.view !== 'day');
  document.getElementById('schedule-view-week')?.classList.toggle('btn--primary', state.view === 'week');
  document.getElementById('schedule-view-week')?.classList.toggle('btn--ghost',   state.view !== 'week');
};

const renderScheduleView = () => {
  const container = document.getElementById('schedule-content');
  if (!container) return;
  const tasks = TFStorage.getTasks();
  const state = TFSchedule.getState();

  if (state.view === 'day') {
    TFSchedule.renderDayView(container, state.currentDate, tasks, (dateStr) => {
      openTaskModal(null, dateStr);
    });
  } else {
    TFSchedule.renderWeekView(container, state.currentDate, tasks, (dateStr) => {
      openTaskModal(null, dateStr);
    });
  }

  // Update nav label
  const navLabel = document.getElementById('schedule-nav-label');
  if (navLabel) {
    const { dateToString, formatDate, formatWeekRange, getWeekDays } = TFUtils;
    const todayStr = TFUtils.todayString();
    if (state.view === 'day') {
      const ds = dateToString(state.currentDate);
      const isToday = ds === todayStr;
      navLabel.textContent = isToday ? 'Today – ' + formatDate(ds) : formatDate(ds);
    } else {
      const days = getWeekDays(state.currentDate);
      const isCurrent = days.some(d => dateToString(d) === todayStr);
      navLabel.textContent = (isCurrent ? 'Current week – ' : '') + formatWeekRange(days);
    }
  }
};

/* ── Settings Page ────────────────────────────────────────── */

const wireSettingsPage = () => {
  document.getElementById('settings-theme')?.addEventListener('change', (e) => {
    const theme = e.target.checked ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    const settings = TFStorage.getSettings();
    TFStorage.saveSettings({ ...settings, theme });
    // Destroy and re-render charts with new theme colours
    TFDashboard.destroyCharts();
    TFDashboard.refreshDashboard();
    TFUI.showToast(`Switched to ${theme} theme.`, 'info');
  });

  document.getElementById('settings-default-priority')?.addEventListener('change', (e) => {
    const settings = TFStorage.getSettings();
    TFStorage.saveSettings({ ...settings, defaultPriority: e.target.value });
  });

  document.getElementById('settings-notif-btn')?.addEventListener('click', async () => {
    const result = await TFNotifications.requestPermission();
    const msgMap = {
      granted:     'Notifications enabled!',
      denied:      'Notifications blocked in browser settings.',
      default:     'Permission not granted yet.',
      unsupported: 'Browser notifications are not supported.',
    };
    TFUI.showToast(msgMap[result] || 'Unknown result.', result === 'granted' ? 'success' : 'warning');
    renderSettingsPage();
  });

  document.getElementById('settings-clear-btn')?.addEventListener('click', () => {
    openConfirmModal('__clear__', 'ALL tasks and settings');
  });
};

const renderSettingsPage = () => {
  const settings = TFStorage.getSettings();

  const themeToggle = document.getElementById('settings-theme');
  if (themeToggle) themeToggle.checked = settings.theme === 'light';

  const defPrio = document.getElementById('settings-default-priority');
  if (defPrio) defPrio.value = settings.defaultPriority || 'Medium';

  const notifStatus = document.getElementById('settings-notif-status');
  if (notifStatus) {
    const perm = TFNotifications.getPermission();
    const statusMap = {
      granted:     '✅ Enabled',
      denied:      '❌ Blocked (change in browser settings)',
      default:     '🔔 Not yet requested',
      unsupported: '⚠️ Not supported by your browser',
    };
    notifStatus.textContent = statusMap[perm] || 'Unknown';
  }
};

/* ── Reactive refresh ─────────────────────────────────────── */

/**
 * Called after any task data change — refreshes active view + dashboard.
 */
const onTasksChanged = () => {
  const section = _currentSection;
  if (section === 'section-tasks')     refreshTasksView();
  if (section === 'section-completed') renderCompletedView();
  if (section === 'section-schedule')  renderScheduleView();
  TFDashboard.refreshDashboard();
  TFCountdown.restartCountdownTimer();
};

/* ── Start ────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', init);
