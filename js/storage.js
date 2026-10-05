/* ============================================================
   TaskFlow – storage.js
   All localStorage I/O — single source of truth for persistence
   ============================================================ */

'use strict';

const TASKS_KEY    = 'taskflow_tasks';
const SETTINGS_KEY = 'taskflow_settings';

const DEFAULT_SETTINGS = {
  theme:                'dark',
  notificationsEnabled: false,
  defaultPriority:      'Medium',
};

/**
 * Applies schema migration defaults so old saved tasks work with new fields.
 * @param {object[]} tasks
 * @returns {object[]}
 */
const migrateTasks = (tasks) => {
  if (!Array.isArray(tasks)) return [];
  return tasks
    .filter(t => t && typeof t === 'object' && t.id && t.title)
    .map(t => ({
      description:  '',
      category:     '',
      dueTime:      null,
      completedAt:  null,
      ...t,
      updatedAt: t.updatedAt || t.createdAt || new Date().toISOString(),
    }));
};

/**
 * Loads all tasks from localStorage.
 * Returns [] on any error (corrupt data, disabled storage).
 * @returns {object[]}
 */
const getTasks = () => {
  try {
    const raw = localStorage.getItem(TASKS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return migrateTasks(parsed);
  } catch (e) {
    console.warn('[TaskFlow] Failed to load tasks from storage:', e.message);
    return [];
  }
};

/**
 * Saves the full tasks array to localStorage.
 * @param {object[]} tasks
 * @returns {boolean} success
 */
const saveTasks = (tasks) => {
  try {
    localStorage.setItem(TASKS_KEY, JSON.stringify(Array.isArray(tasks) ? tasks : []));
    return true;
  } catch (e) {
    console.warn('[TaskFlow] Failed to save tasks:', e.message);
    return false;
  }
};

/**
 * Loads settings from localStorage, merged with defaults.
 * @returns {object}
 */
const getSettings = () => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    console.warn('[TaskFlow] Failed to load settings:', e.message);
    return { ...DEFAULT_SETTINGS };
  }
};

/**
 * Saves settings to localStorage.
 * @param {object} settings
 * @returns {boolean} success
 */
const saveSettings = (settings) => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch (e) {
    console.warn('[TaskFlow] Failed to save settings:', e.message);
    return false;
  }
};

/**
 * Clears all TaskFlow data (used for reset/testing).
 */
const clearAll = () => {
  try {
    localStorage.removeItem(TASKS_KEY);
    localStorage.removeItem(SETTINGS_KEY);
  } catch (e) {
    console.warn('[TaskFlow] Failed to clear storage:', e.message);
  }
};

window.TFStorage = { getTasks, saveTasks, getSettings, saveSettings, clearAll };
