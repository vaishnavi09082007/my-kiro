/* ============================================================
   TaskFlow – countdown.js
   Live countdown timer engine
   ============================================================ */

'use strict';

let _timerInterval = null;

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
 * Updates all countdown elements in the DOM.
 */
const tickCountdowns = () => {
  const elements = document.querySelectorAll('[data-countdown]');
  elements.forEach(el => {
    const taskId = el.dataset.countdown;
    const tasks  = window.TFStorage.getTasks();
    const task   = tasks.find(t => t.id === taskId);
    if (!task || task.status === 'completed') {
      el.textContent = '';
      return;
    }

    const tr = calculateTimeRemaining(task.dueDate, task.dueTime);
    if (!tr) { el.textContent = ''; return; }

    const text = window.TFUI.formatCountdown(tr);
    el.textContent = text;

    // Update CSS class based on urgency
    el.classList.remove('task-card__countdown--overdue', 'task-card__countdown--soon');
    if (tr.overdue) {
      el.classList.add('task-card__countdown--overdue');
      // Also update the card's overdue styling
      const card = el.closest('.task-card');
      if (card && !card.classList.contains('task-card--overdue')) {
        card.classList.add('task-card--overdue');
        // Update status badge
        const statusBadge = card.querySelector('.badge[class*="status-badge"]');
        if (statusBadge) {
          statusBadge.className = 'badge status-badge--overdue';
          statusBadge.textContent = 'Overdue';
        }
      }
    } else if (!tr.overdue && tr.days === 0 && tr.hours < 24) {
      el.classList.add('task-card__countdown--soon');
    }
  });
};

/**
 * Starts the global countdown timer (1-second interval).
 * Calling again while running is safe — won't create duplicate intervals.
 */
const startCountdownTimer = () => {
  if (_timerInterval) return;
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
 */
const restartCountdownTimer = () => {
  stopCountdownTimer();
  startCountdownTimer();
};

window.TFCountdown = {
  calculateTimeRemaining,
  startCountdownTimer,
  stopCountdownTimer,
  restartCountdownTimer,
  tickCountdowns,
};
