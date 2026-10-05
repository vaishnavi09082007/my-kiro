/* ============================================================
   TaskFlow – countdown.js
   Live countdown timer engine
   ============================================================ */

'use strict';

let _timerInterval = null;
let _taskCache     = [];  // cached task list to avoid localStorage reads every second
let _overdueAlerted = new Set(); // track tasks we've shown "just became overdue" toast for

/**
 * Calculates time remaining until a deadline.
 * @param {string} dueDate - YYYY-MM-DD
 * @param {string|null} dueTime - HH:MM or null
 * @returns {{ days, hours, minutes, seconds, overdue: boolean } | null}
 */
const calculateTimeRemaining = (dueDate, dueTime) => {
  if (!dueDate) return null;
  const deadline = window.TFUtils.parseDateTime(dueDate, dueTime);
  if (!deadline) return null;

  const now  = new Date();
  const diff = deadline - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, overdue: true };
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days    = Math.floor(totalSeconds / 86400);
  const hours   = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds, overdue: false };
};

/**
 * Refreshes the internal task cache.
 * Call this whenever tasks change (add/edit/delete/complete).
 */
const refreshTaskCache = () => {
  _taskCache = window.TFStorage.getTasks();
};

/**
 * Updates all countdown elements in the DOM.
 * Uses cached tasks — call refreshTaskCache() after any data change.
 */
const tickCountdowns = () => {
  const elements = document.querySelectorAll('[data-countdown]');
  if (!elements.length) return;

  elements.forEach(el => {
    const taskId = el.dataset.countdown;
    const task   = _taskCache.find(t => t.id === taskId);

    if (!task || task.status === 'completed') {
      el.textContent = '';
      return;
    }

    const tr = calculateTimeRemaining(task.dueDate, task.dueTime);
    if (!tr) { el.textContent = ''; return; }

    const text = window.TFUI.formatCountdown(tr);
    el.textContent = text;

    // Update CSS classes based on urgency
    el.classList.remove('task-card__countdown--overdue', 'task-card__countdown--soon');

    if (tr.overdue) {
      el.classList.add('task-card__countdown--overdue');

      // Update the card's overdue styling if not already done
      const card = el.closest('.task-card');
      if (card && !card.classList.contains('task-card--overdue')) {
        card.classList.add('task-card--overdue');
        const statusBadge = card.querySelector('.badge[class*="status-badge"]');
        if (statusBadge) {
          statusBadge.className = 'badge status-badge--overdue';
          statusBadge.textContent = 'Overdue';
        }
      }

      // Fire a one-time in-app toast when a task first becomes overdue this session
      if (!_overdueAlerted.has(taskId)) {
        _overdueAlerted.add(taskId);
        window.TFUI.showToast(`"${task.title}" is now overdue!`, 'error', 6000);
        window.TFNotifications.updateNotifBell(true);
      }

    } else if (tr.days === 0 && tr.hours < 2) {
      // Less than 2 hours remaining — show amber
      el.classList.add('task-card__countdown--soon');
    }
  });
};

/**
 * Starts the global countdown timer (1-second interval).
 * Calling again while running is safe — won't create duplicate intervals.
 */
const startCountdownTimer = () => {
  refreshTaskCache();
  if (_timerInterval) return;
  tickCountdowns(); // immediate first tick
  _timerInterval = setInterval(tickCountdowns, 1000);
};

/**
 * Stops the countdown timer.
 */
const stopCountdownTimer = () => {
  if (_timerInterval) {
    clearInterval(_timerInterval);
    _timerInterval = null;
  }
};

/**
 * Restarts the timer (useful after page re-render).
 * Also refreshes the task cache so new/edited tasks are reflected.
 */
const restartCountdownTimer = () => {
  refreshTaskCache();
  stopCountdownTimer();
  startCountdownTimer();
};

/**
 * Clears the "just became overdue" alert cache for a task.
 * Call this when a task is edited (deadline may have changed).
 * @param {string} taskId
 */
const clearOverdueAlert = (taskId) => {
  _overdueAlerted.delete(taskId);
};

window.TFCountdown = {
  calculateTimeRemaining,
  refreshTaskCache,
  startCountdownTimer,
  stopCountdownTimer,
  restartCountdownTimer,
  tickCountdowns,
  clearOverdueAlert,
};
