/* ============================================================
   TaskFlow – utils.js
   Pure utility functions: UUID, dates, formatters
   ============================================================ */

'use strict';

/**
 * Generates a UUID v4 string.
 * @returns {string}
 */
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
};

/**
 * Formats a YYYY-MM-DD date string for display.
 * @param {string} dateStr - YYYY-MM-DD
 * @returns {string} e.g. "Oct 5, 2026"
 */
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    // Parse as local date to avoid UTC offset shifting the day
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

/**
 * Formats a HH:MM time string for display.
 * @param {string} timeStr - HH:MM
 * @returns {string} e.g. "2:30 PM"
 */
const formatTime = (timeStr) => {
  if (!timeStr) return '';
  try {
    const [h, m] = timeStr.split(':').map(Number);
    const d = new Date(2000, 0, 1, h, m);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  } catch {
    return timeStr;
  }
};

/**
 * Formats a due date + time together for display.
 * @param {string|null} dateStr
 * @param {string|null} timeStr
 * @returns {string}
 */
const formatDueDateTime = (dateStr, timeStr) => {
  if (!dateStr) return 'No due date';
  const d = formatDate(dateStr);
  const t = timeStr ? ` at ${formatTime(timeStr)}` : '';
  return d + t;
};

/**
 * Parses date + optional time into a Date object.
 * @param {string} dateStr - YYYY-MM-DD
 * @param {string|null} timeStr - HH:MM or null
 * @returns {Date}
 */
const parseDateTime = (dateStr, timeStr) => {
  if (!dateStr) return null;
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    if (timeStr) {
      const [h, m] = timeStr.split(':').map(Number);
      return new Date(year, month - 1, day, h, m, 0, 0);
    }
    return new Date(year, month - 1, day, 23, 59, 59, 0);
  } catch {
    return null;
  }
};

/**
 * Returns today as YYYY-MM-DD string.
 * @returns {string}
 */
const todayString = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/**
 * Returns a YYYY-MM-DD string for a given Date object.
 * @param {Date} date
 * @returns {string}
 */
const dateToString = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * Returns the Monday of the week containing the given date.
 * @param {Date} date
 * @returns {Date}
 */
const getWeekStart = (date) => {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon ...
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Returns array of 7 Date objects for Mon–Sun of the week containing `date`.
 * @param {Date} date
 * @returns {Date[]}
 */
const getWeekDays = (date) => {
  const monday = getWeekStart(date);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
};

/**
 * Returns day-of-week index (0=Sun, 6=Sat) for a date string.
 * @param {string} dateStr - YYYY-MM-DD
 * @returns {number}
 */
const getDayOfWeek = (dateStr) => {
  if (!dateStr) return -1;
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
};

/**
 * Escapes HTML special characters to prevent XSS.
 * @param {*} str
 * @returns {string}
 */
const escapeHtml = (str) => {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * Pluralises a word based on count.
 * @param {number} n
 * @param {string} singular
 * @param {string} [plural]
 * @returns {string}
 */
const pluralise = (n, singular, plural) => {
  return `${n} ${n === 1 ? singular : (plural || singular + 's')}`;
};

/**
 * Formats a relative time string (e.g. "in 3 days", "2 hours ago").
 * @param {string} isoString
 * @returns {string}
 */
const relativeTime = (isoString) => {
  if (!isoString) return '';
  const diff = Date.now() - new Date(isoString).getTime();
  const abs = Math.abs(diff);
  const mins = Math.floor(abs / 60000);
  const hours = Math.floor(abs / 3600000);
  const days = Math.floor(abs / 86400000);
  const past = diff > 0;
  if (abs < 60000) return past ? 'just now' : 'in a moment';
  if (mins < 60)   return past ? `${mins}m ago` : `in ${mins}m`;
  if (hours < 24)  return past ? `${hours}h ago` : `in ${hours}h`;
  return past ? `${days}d ago` : `in ${days}d`;
};

/**
 * Formats a week range label e.g. "Sep 30 – Oct 6, 2026".
 * @param {Date[]} days - array of 7 dates
 * @returns {string}
 */
const formatWeekRange = (days) => {
  if (!days || days.length < 7) return '';
  const opts = { month: 'short', day: 'numeric' };
  const start = days[0].toLocaleDateString('en-US', opts);
  const end   = days[6].toLocaleDateString('en-US', { ...opts, year: 'numeric' });
  return `${start} – ${end}`;
};

// Export for use as global in non-module scripts
window.TFUtils = {
  generateUUID,
  formatDate,
  formatTime,
  formatDueDateTime,
  parseDateTime,
  todayString,
  dateToString,
  getWeekStart,
  getWeekDays,
  getDayOfWeek,
  escapeHtml,
  pluralise,
  relativeTime,
  formatWeekRange,
};
