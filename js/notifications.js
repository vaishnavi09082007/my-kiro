/* ============================================================
   TaskFlow – notifications.js
   Browser + in-app notification logic
   ============================================================ */

'use strict';

// Track which task IDs we've already notified to prevent duplicates
const _notified = new Set();
let _reminderInterval = null;

/**
 * Returns true if the browser supports the Notification API.
 * @returns {boolean}
 */
const isBrowserNotifSupported = () => {
  return typeof Notification !== 'undefined';
};

/**
 * Returns the current notification permission state.
 * @returns {'granted'|'denied'|'default'|'unsupported'}
 */
const getPermission = () => {
  if (!isBrowserNotifSupported()) return 'unsupported';
  return Notification.permission;
};

/**
 * Requests browser notification permission.
 * Only call from a user gesture (button click).
 * @returns {Promise<string>} permission result
 */
const requestPermission = async () => {
  if (!isBrowserNotifSupported()) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  try {
    const result = await Notification.requestPermission();
    // Save preference
    const settings = window.TFStorage.getSettings();
    settings.notificationsEnabled = (result === 'granted');
    window.TFStorage.saveSettings(settings);
    return result;
  } catch (e) {
    console.warn('[TaskFlow] Notification permission request failed:', e.message);
    return 'denied';
  }
};

/**
 * Shows a browser notification (if permitted).
 * @param {string} title
 * @param {string} body
 */
const showBrowserNotification = (title, body) => {
  if (getPermission() !== 'granted') return;
  try {
    new Notification(title, {
      body,
      icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">✅</text></svg>',
      tag: 'taskflow-reminder',
    });
  } catch (e) {
    console.warn('[TaskFlow] Failed to show browser notification:', e.message);
  }
};

/**
 * Checks for tasks approaching deadlines and fires reminders.
 * Checks at: 24h before, 1h before.
 */
const checkReminders = () => {
  const tasks = window.TFStorage.getTasks();
  const now   = Date.now();

  tasks.forEach(task => {
    if (task.status === 'completed' || !task.dueDate) return;

    const deadline = window.TFUtils.parseDateTime(task.dueDate, task.dueTime);
    if (!deadline) return;

    const diff = deadline - now;
    if (diff <= 0) return; // already overdue — handled separately

    const notifKey24h = `${task.id}:24h`;
    const notifKey1h  = `${task.id}:1h`;

    // 24-hour reminder (fire between 23h50m and 24h10m remaining)
    if (diff > 23 * 3600000 && diff <= 24.2 * 3600000 && !_notified.has(notifKey24h)) {
      _notified.add(notifKey24h);
      const msg = `"${task.title}" is due tomorrow.`;
      showBrowserNotification('TaskFlow Reminder', msg);
      window.TFUI.showToast(msg, 'warning', 8000);
      updateNotifBell(true);
    }

    // 1-hour reminder (fire between 55min and 65min remaining)
    if (diff > 55 * 60000 && diff <= 65 * 60000 && !_notified.has(notifKey1h)) {
      _notified.add(notifKey1h);
      const msg = `"${task.title}" is due in about 1 hour.`;
      showBrowserNotification('TaskFlow Reminder ⏰', msg);
      window.TFUI.showToast(msg, 'warning', 10000);
      updateNotifBell(true);
    }
  });
};

/**
 * Updates the notification bell indicator.
 * @param {boolean} hasNew
 */
const updateNotifBell = (hasNew) => {
  const dot = document.querySelector('.notif-bell__dot');
  if (dot) dot.style.display = hasNew ? 'block' : 'none';
};

/**
 * Clears the notification bell indicator.
 */
const clearNotifBell = () => updateNotifBell(false);

/**
 * Clears the notification cache for a task (e.g. after editing).
 * @param {string} taskId
 */
const clearTaskNotifs = (taskId) => {
  _notified.delete(`${taskId}:24h`);
  _notified.delete(`${taskId}:1h`);
};

/**
 * Starts the reminder checker (checks every 60 seconds).
 */
const startReminderChecker = () => {
  if (_reminderInterval) return;
  checkReminders(); // run immediately on start
  _reminderInterval = setInterval(checkReminders, 60000);
};

/**
 * Stops the reminder checker.
 */
const stopReminderChecker = () => {
  if (_reminderInterval) {
    clearInterval(_reminderInterval);
    _reminderInterval = null;
  }
};

/**
 * Shows the in-app notification permission prompt banner.
 * Only shown if permission is 'default' (not yet asked).
 */
const showPermissionPrompt = () => {
  if (getPermission() !== 'default') return;
  const existing = document.getElementById('notif-prompt');
  if (existing) return;

  const banner = document.createElement('div');
  banner.id = 'notif-prompt';
  banner.setAttribute('role', 'alert');
  banner.style.cssText = `
    position: fixed; bottom: 80px; right: 20px; z-index: 350;
    background: var(--color-bg-secondary); border: 1px solid var(--color-border);
    border-left: 4px solid var(--color-accent); border-radius: var(--radius-md);
    padding: 12px 16px; max-width: 320px; box-shadow: var(--shadow-lg);
    font-size: var(--font-size-sm); color: var(--color-text-primary);
    display: flex; flex-direction: column; gap: 10px;
  `;
  banner.innerHTML = `
    <div>🔔 <strong>Enable reminders?</strong></div>
    <div style="color:var(--color-text-muted)">Get notified before task deadlines.</div>
    <div style="display:flex;gap:8px">
      <button id="notif-allow-btn" class="btn btn--primary btn--sm">Allow</button>
      <button id="notif-deny-btn"  class="btn btn--ghost btn--sm">Not now</button>
    </div>
  `;

  document.body.appendChild(banner);

  document.getElementById('notif-allow-btn').addEventListener('click', async () => {
    banner.remove();
    const result = await requestPermission();
    if (result === 'granted') {
      window.TFUI.showToast('Notifications enabled! You\'ll be reminded before deadlines.', 'success');
    }
  });

  document.getElementById('notif-deny-btn').addEventListener('click', () => {
    banner.remove();
  });
};

window.TFNotifications = {
  isBrowserNotifSupported,
  getPermission,
  requestPermission,
  showBrowserNotification,
  checkReminders,
  startReminderChecker,
  stopReminderChecker,
  clearTaskNotifs,
  updateNotifBell,
  clearNotifBell,
  showPermissionPrompt,
};
