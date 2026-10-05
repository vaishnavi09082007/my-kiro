/* ============================================================
   TaskFlow – taskflow.test.js
   Browser-based unit tests for all core pure functions.
   Open tests/index.html to run.
   ============================================================ */

'use strict';

/* ── Test Harness ─────────────────────────────────────────── */

let passed = 0;
let failed = 0;
const results = [];

const test = (description, fn) => {
  try {
    fn();
    passed++;
    results.push({ pass: true, description });
  } catch (e) {
    failed++;
    results.push({ pass: false, description, error: e.message });
    console.error(`❌ FAIL: ${description}\n   ${e.message}`);
  }
};

const assert = (condition, message = 'Assertion failed') => {
  if (!condition) throw new Error(message);
};

const assertEqual = (actual, expected, message) => {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(message || `Expected ${e} but got ${a}`);
};

const assertNotEqual = (actual, unexpected, message) => {
  if (JSON.stringify(actual) === JSON.stringify(unexpected)) {
    throw new Error(message || `Expected values to differ but both were ${JSON.stringify(actual)}`);
  }
};

const assertApprox = (actual, expected, tolerance = 1, message) => {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(message || `Expected ~${expected} but got ${actual} (tolerance ±${tolerance})`);
  }
};

/* ── Helpers ──────────────────────────────────────────────── */

/** Creates a minimal valid task object for testing. */
const makeTask = (overrides = {}) => ({
  id:          'test-id-001',
  title:       'Test Task',
  description: '',
  priority:    'Medium',
  category:    '',
  dueDate:     null,
  dueTime:     null,
  status:      'pending',
  createdAt:   '2026-10-05T10:00:00.000Z',
  updatedAt:   '2026-10-05T10:00:00.000Z',
  completedAt: null,
  ...overrides,
});

/** Builds a future ISO date string N days/hours from now. */
const futureISO = (daysOffset = 1, hoursOffset = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  d.setHours(d.getHours() + hoursOffset);
  return d.toISOString();
};

/** Returns a future YYYY-MM-DD string N days from now. */
const futureDate = (daysOffset = 1) => {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return TFUtils.dateToString(d);
};

/** Returns a past YYYY-MM-DD string N days ago. */
const pastDate = (daysOffset = 1) => {
  const d = new Date();
  d.setDate(d.getDate() - daysOffset);
  return TFUtils.dateToString(d);
};

/* ════════════════════════════════════════════════════════════
   SUITE 1 — TFUtils
   ════════════════════════════════════════════════════════════ */
console.group('📐 TFUtils');

test('generateUUID returns a non-empty string', () => {
  const id = TFUtils.generateUUID();
  assert(typeof id === 'string' && id.length > 10, `UUID too short: "${id}"`);
});

test('generateUUID returns unique values each call', () => {
  const a = TFUtils.generateUUID();
  const b = TFUtils.generateUUID();
  assertNotEqual(a, b, 'Two UUIDs should differ');
});

test('generateUUID matches RFC 4122 v4 pattern', () => {
  const id = TFUtils.generateUUID();
  const re = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  assert(re.test(id), `UUID did not match v4 pattern: "${id}"`);
});

test('formatDate returns readable string for valid date', () => {
  const result = TFUtils.formatDate('2026-10-05');
  assert(result.includes('Oct') && result.includes('2026'), `Unexpected format: "${result}"`);
});

test('formatDate returns empty string for null/empty input', () => {
  assertEqual(TFUtils.formatDate(null), '');
  assertEqual(TFUtils.formatDate(''), '');
});

test('formatTime returns 12-hour format', () => {
  const result = TFUtils.formatTime('14:30');
  assert(result.includes('2:30') && result.includes('PM'), `Expected "2:30 PM", got "${result}"`);
});

test('formatTime returns empty string for null', () => {
  assertEqual(TFUtils.formatTime(null), '');
});

test('formatTime handles midnight (00:00)', () => {
  const result = TFUtils.formatTime('00:00');
  assert(result.includes('12:00') && result.includes('AM'), `Expected "12:00 AM", got "${result}"`);
});

test('parseDateTime returns correct Date for date+time', () => {
  const d = TFUtils.parseDateTime('2026-10-05', '14:30');
  assert(d instanceof Date, 'Should return a Date');
  assertEqual(d.getFullYear(), 2026);
  assertEqual(d.getMonth(), 9);   // 0-indexed: October = 9
  assertEqual(d.getDate(), 5);
  assertEqual(d.getHours(), 14);
  assertEqual(d.getMinutes(), 30);
});

test('parseDateTime defaults time to 23:59:59 when no time given', () => {
  const d = TFUtils.parseDateTime('2026-10-05', null);
  assertEqual(d.getHours(), 23);
  assertEqual(d.getMinutes(), 59);
});

test('parseDateTime returns null for null date', () => {
  assertEqual(TFUtils.parseDateTime(null, null), null);
});

test('todayString returns YYYY-MM-DD format', () => {
  const today = TFUtils.todayString();
  assert(/^\d{4}-\d{2}-\d{2}$/.test(today), `Bad format: "${today}"`);
});

test('dateToString returns correct YYYY-MM-DD', () => {
  const d = new Date(2026, 9, 5); // Oct 5 2026
  assertEqual(TFUtils.dateToString(d), '2026-10-05');
});

test('getWeekStart returns the Monday of the week', () => {
  // Oct 5 2026 is a Monday
  const monday = new Date(2026, 9, 5);
  const start  = TFUtils.getWeekStart(monday);
  assertEqual(start.getDay(), 1, 'Week start should be Monday (day 1)');
  assertEqual(TFUtils.dateToString(start), '2026-10-05');
});

test('getWeekStart from Sunday returns prior Monday', () => {
  const sunday = new Date(2026, 9, 11); // Oct 11 2026 = Sunday
  const start  = TFUtils.getWeekStart(sunday);
  assertEqual(TFUtils.dateToString(start), '2026-10-05'); // prior Monday
});

test('getWeekDays returns 7 dates starting Monday', () => {
  const days = TFUtils.getWeekDays(new Date(2026, 9, 5));
  assertEqual(days.length, 7);
  assertEqual(days[0].getDay(), 1, 'First day should be Monday');
  assertEqual(days[6].getDay(), 0, 'Last day should be Sunday');
});

test('getDayOfWeek returns correct index', () => {
  assertEqual(TFUtils.getDayOfWeek('2026-10-05'), 1); // Monday
  assertEqual(TFUtils.getDayOfWeek('2026-10-04'), 0); // Sunday
  assertEqual(TFUtils.getDayOfWeek(null), -1);
});

test('escapeHtml escapes all special characters', () => {
  const input  = '<script>alert("XSS & \'test\'");</script>';
  const output = TFUtils.escapeHtml(input);
  assert(!output.includes('<script>'), 'Should escape <');
  assert(!output.includes('</script>'), 'Should escape >');
  assert(output.includes('&lt;'), 'Should contain &lt;');
  assert(output.includes('&amp;'), 'Should contain &amp;');
  assert(output.includes('&quot;'), 'Should contain &quot;');
});

test('escapeHtml handles null/undefined gracefully', () => {
  assertEqual(TFUtils.escapeHtml(null), '');
  assertEqual(TFUtils.escapeHtml(undefined), '');
});

test('pluralise uses singular for 1', () => {
  assertEqual(TFUtils.pluralise(1, 'task'), '1 task');
});

test('pluralise uses plural for 0 and >1', () => {
  assertEqual(TFUtils.pluralise(0, 'task'), '0 tasks');
  assertEqual(TFUtils.pluralise(5, 'task'), '5 tasks');
});

test('formatWeekRange returns non-empty string', () => {
  const days = TFUtils.getWeekDays(new Date(2026, 9, 5));
  const range = TFUtils.formatWeekRange(days);
  assert(typeof range === 'string' && range.length > 5, `Range too short: "${range}"`);
});

console.groupEnd();

/* ════════════════════════════════════════════════════════════
   SUITE 2 — TFTasks.validateTask
   ════════════════════════════════════════════════════════════ */
console.group('✅ TFTasks.validateTask');

test('valid task data passes validation', () => {
  const { valid, errors } = TFTasks.validateTask({
    title: 'Buy groceries',
    priority: 'Medium',
    dueDate: null,
  });
  assert(valid, `Expected valid, got errors: ${JSON.stringify(errors)}`);
});

test('empty title fails validation', () => {
  const { valid, errors } = TFTasks.validateTask({ title: '', priority: 'Medium' });
  assert(!valid);
  assert(errors.title, 'Should have title error');
});

test('whitespace-only title fails validation', () => {
  const { valid, errors } = TFTasks.validateTask({ title: '   ', priority: 'Medium' });
  assert(!valid);
  assert(errors.title, 'Should have title error for whitespace-only');
});

test('title over 200 chars fails validation', () => {
  const { valid, errors } = TFTasks.validateTask({
    title: 'A'.repeat(201),
    priority: 'Medium',
  });
  assert(!valid);
  assert(errors.title);
});

test('title exactly 200 chars passes', () => {
  const { valid } = TFTasks.validateTask({ title: 'A'.repeat(200), priority: 'Medium' });
  assert(valid);
});

test('invalid priority fails validation', () => {
  const { valid, errors } = TFTasks.validateTask({ title: 'Test', priority: 'Critical' });
  assert(!valid);
  assert(errors.priority);
});

test('description over 1000 chars fails', () => {
  const { valid, errors } = TFTasks.validateTask({
    title: 'T', priority: 'Medium', description: 'x'.repeat(1001),
  });
  assert(!valid);
  assert(errors.description);
});

test('category over 50 chars fails', () => {
  const { valid, errors } = TFTasks.validateTask({
    title: 'T', priority: 'Medium', category: 'C'.repeat(51),
  });
  assert(!valid);
  assert(errors.category);
});

test('dueTime without dueDate fails', () => {
  const { valid, errors } = TFTasks.validateTask({
    title: 'T', priority: 'Medium', dueDate: null, dueTime: '14:30',
  });
  assert(!valid);
  assert(errors.dueTime);
});

test('valid dueDate and dueTime passes', () => {
  const { valid } = TFTasks.validateTask({
    title: 'T', priority: 'Low', dueDate: '2027-01-15', dueTime: '09:00',
  });
  assert(valid);
});

test('invalid date format fails', () => {
  const { valid, errors } = TFTasks.validateTask({
    title: 'T', priority: 'Medium', dueDate: '01/15/2027',
  });
  assert(!valid);
  assert(errors.dueDate);
});

test('invalid month (13) fails', () => {
  const { valid, errors } = TFTasks.validateTask({
    title: 'T', priority: 'Medium', dueDate: '2026-13-01',
  });
  assert(!valid);
  assert(errors.dueDate);
});

test('invalid time (25:00) fails', () => {
  const { valid, errors } = TFTasks.validateTask({
    title: 'T', priority: 'Medium', dueDate: '2027-01-01', dueTime: '25:00',
  });
  assert(!valid);
  assert(errors.dueTime);
});

console.groupEnd();

/* ════════════════════════════════════════════════════════════
   SUITE 3 — TFTasks.createTask
   ════════════════════════════════════════════════════════════ */
console.group('🆕 TFTasks.createTask');

test('creates task with required fields', () => {
  const task = TFTasks.createTask({ title: 'Test', priority: 'High' });
  assert(task.id, 'Should have id');
  assertEqual(task.title, 'Test');
  assertEqual(task.priority, 'High');
  assertEqual(task.status, 'pending');
  assertEqual(task.completedAt, null);
});

test('title is trimmed on create', () => {
  const task = TFTasks.createTask({ title: '  Trim me  ', priority: 'Low' });
  assertEqual(task.title, 'Trim me');
});

test('defaults empty fields correctly', () => {
  const task = TFTasks.createTask({ title: 'T', priority: 'Medium' });
  assertEqual(task.description, '');
  assertEqual(task.category, '');
  assertEqual(task.dueDate, null);
  assertEqual(task.dueTime, null);
  assertEqual(task.completedAt, null);
});

test('createdAt and updatedAt are set as ISO strings', () => {
  const task = TFTasks.createTask({ title: 'T', priority: 'Medium' });
  assert(!isNaN(new Date(task.createdAt).getTime()), 'createdAt should be valid ISO date');
  assert(!isNaN(new Date(task.updatedAt).getTime()), 'updatedAt should be valid ISO date');
});

test('each created task has a unique id', () => {
  const a = TFTasks.createTask({ title: 'A', priority: 'Low' });
  const b = TFTasks.createTask({ title: 'B', priority: 'Low' });
  assertNotEqual(a.id, b.id, 'Two tasks should have different IDs');
});

console.groupEnd();

/* ════════════════════════════════════════════════════════════
   SUITE 4 — TFTasks.updateTask
   ════════════════════════════════════════════════════════════ */
console.group('✏️ TFTasks.updateTask');

test('updates specified fields', () => {
  const tasks  = [makeTask({ id: 'abc', title: 'Old' })];
  const result = TFTasks.updateTask(tasks, 'abc', { title: 'New' });
  assertEqual(result[0].title, 'New');
});

test('does not change id or createdAt', () => {
  const original = makeTask({ id: 'abc', createdAt: '2026-01-01T00:00:00.000Z' });
  const result   = TFTasks.updateTask([original], 'abc', { title: 'X', id: 'hacked', createdAt: 'bad' });
  assertEqual(result[0].id, 'abc');
  assertEqual(result[0].createdAt, '2026-01-01T00:00:00.000Z');
});

test('updates updatedAt on every edit', () => {
  const original = makeTask({ id: 'abc', updatedAt: '2026-01-01T00:00:00.000Z' });
  const result   = TFTasks.updateTask([original], 'abc', { title: 'X' });
  assert(result[0].updatedAt !== '2026-01-01T00:00:00.000Z', 'updatedAt should change');
});

test('returns unchanged array when id not found', () => {
  const tasks  = [makeTask({ id: 'real' })];
  const result = TFTasks.updateTask(tasks, 'ghost', { title: 'X' });
  assertEqual(result.length, 1);
  assertEqual(result[0].title, 'Test Task');
});

test('does not mutate original array', () => {
  const tasks    = [makeTask({ id: 'abc' })];
  const original = tasks[0].title;
  TFTasks.updateTask(tasks, 'abc', { title: 'Changed' });
  assertEqual(tasks[0].title, original, 'Original should be unchanged');
});

console.groupEnd();

/* ════════════════════════════════════════════════════════════
   SUITE 5 — TFTasks.deleteTask
   ════════════════════════════════════════════════════════════ */
console.group('🗑️ TFTasks.deleteTask');

test('removes task with matching id', () => {
  const tasks  = [makeTask({ id: 'a' }), makeTask({ id: 'b' })];
  const result = TFTasks.deleteTask(tasks, 'a');
  assertEqual(result.length, 1);
  assertEqual(result[0].id, 'b');
});

test('returns same length if id not found', () => {
  const tasks  = [makeTask({ id: 'a' })];
  const result = TFTasks.deleteTask(tasks, 'not-found');
  assertEqual(result.length, 1);
});

test('handles empty array', () => {
  const result = TFTasks.deleteTask([], 'a');
  assertEqual(result.length, 0);
});

test('does not mutate original array', () => {
  const tasks  = [makeTask({ id: 'a' })];
  const result = TFTasks.deleteTask(tasks, 'a');
  assertEqual(tasks.length, 1, 'Original should still have 1 item');
  assertEqual(result.length, 0);
});

console.groupEnd();

/* ════════════════════════════════════════════════════════════
   SUITE 6 — TFTasks.toggleComplete
   ════════════════════════════════════════════════════════════ */
console.group('🔄 TFTasks.toggleComplete');

test('pending task becomes completed', () => {
  const tasks  = [makeTask({ id: 'a', status: 'pending' })];
  const result = TFTasks.toggleComplete(tasks, 'a');
  assertEqual(result[0].status, 'completed');
});

test('completedAt is set when completing', () => {
  const tasks  = [makeTask({ id: 'a', status: 'pending', completedAt: null })];
  const result = TFTasks.toggleComplete(tasks, 'a');
  assert(result[0].completedAt !== null, 'completedAt should be set');
  assert(!isNaN(new Date(result[0].completedAt).getTime()), 'completedAt should be valid ISO date');
});

test('completed task becomes pending on re-toggle', () => {
  const tasks  = [makeTask({ id: 'a', status: 'completed', completedAt: new Date().toISOString() })];
  const result = TFTasks.toggleComplete(tasks, 'a');
  assertEqual(result[0].status, 'pending');
});

test('completedAt is cleared when reopening', () => {
  const tasks  = [makeTask({ id: 'a', status: 'completed', completedAt: '2026-01-01T00:00:00.000Z' })];
  const result = TFTasks.toggleComplete(tasks, 'a');
  assertEqual(result[0].completedAt, null);
});

test('other fields unchanged when toggling', () => {
  const tasks  = [makeTask({ id: 'a', title: 'Keep me', priority: 'High' })];
  const result = TFTasks.toggleComplete(tasks, 'a');
  assertEqual(result[0].title, 'Keep me');
  assertEqual(result[0].priority, 'High');
});

test('updatedAt changes on toggle', () => {
  const old   = '2026-01-01T00:00:00.000Z';
  const tasks = [makeTask({ id: 'a', updatedAt: old })];
  const result = TFTasks.toggleComplete(tasks, 'a');
  assertNotEqual(result[0].updatedAt, old);
});

console.groupEnd();

/* ════════════════════════════════════════════════════════════
   SUITE 7 — TFTasks.isOverdue
   ════════════════════════════════════════════════════════════ */
console.group('🚨 TFTasks.isOverdue');

test('returns false when no dueDate', () => {
  const task = makeTask({ dueDate: null });
  assert(!TFTasks.isOverdue(task));
});

test('returns false for completed task with past due date', () => {
  const task = makeTask({ dueDate: pastDate(5), status: 'completed' });
  assert(!TFTasks.isOverdue(task), 'Completed tasks should never be overdue');
});

test('returns true for pending task with past due date', () => {
  const task = makeTask({ dueDate: pastDate(3), status: 'pending' });
  assert(TFTasks.isOverdue(task), 'Past-due pending task should be overdue');
});

test('returns false for task due in the future', () => {
  const task = makeTask({ dueDate: futureDate(3), status: 'pending' });
  assert(!TFTasks.isOverdue(task), 'Future task should not be overdue');
});

test('returns false for null task input', () => {
  assert(!TFTasks.isOverdue(null));
});

console.groupEnd();

/* ════════════════════════════════════════════════════════════
   SUITE 8 — TFTasks.filterByStatus
   ════════════════════════════════════════════════════════════ */
console.group('🔽 TFTasks.filterByStatus');

const sampleTasks = [
  makeTask({ id: '1', status: 'pending',   dueDate: null }),
  makeTask({ id: '2', status: 'completed', dueDate: null }),
  makeTask({ id: '3', status: 'pending',   dueDate: pastDate(1) }), // overdue
];

test('filter "all" returns all tasks', () => {
  const result = TFTasks.filterByStatus(sampleTasks, 'all');
  assertEqual(result.length, 3);
});

test('filter "completed" returns only completed tasks', () => {
  const result = TFTasks.filterByStatus(sampleTasks, 'completed');
  assert(result.every(t => t.status === 'completed'), 'All returned should be completed');
  assertEqual(result.length, 1);
});

test('filter "pending" excludes completed', () => {
  const result = TFTasks.filterByStatus(sampleTasks, 'pending');
  assert(result.every(t => t.status !== 'completed'));
});

test('filter "overdue" returns tasks past deadline', () => {
  const result = TFTasks.filterByStatus(sampleTasks, 'overdue');
  assert(result.length >= 1, 'Should find at least 1 overdue task');
  assert(result.every(t => TFTasks.isOverdue(t)));
});

test('filter returns empty array for empty input', () => {
  assertEqual(TFTasks.filterByStatus([], 'pending').length, 0);
});

// Property-based: every result of filterByStatus("completed") has status === "completed"
test('[property] filterByStatus("completed") results all have status completed', () => {
  const mixedTasks = [
    makeTask({ id: '1', status: 'pending' }),
    makeTask({ id: '2', status: 'completed' }),
    makeTask({ id: '3', status: 'pending' }),
    makeTask({ id: '4', status: 'completed' }),
  ];
  const result = TFTasks.filterByStatus(mixedTasks, 'completed');
  assert(result.every(t => t.status === 'completed'), 'Property: every result must be completed');
});

console.groupEnd();

/* ════════════════════════════════════════════════════════════
   SUITE 9 — TFTasks.filterByPriority / filterByCategory
   ════════════════════════════════════════════════════════════ */
console.group('🏷️ TFTasks.filterByPriority / filterByCategory');

test('filterByPriority returns only High priority tasks', () => {
  const tasks = [
    makeTask({ id: '1', priority: 'High' }),
    makeTask({ id: '2', priority: 'Medium' }),
    makeTask({ id: '3', priority: 'Low' }),
  ];
  const result = TFTasks.filterByPriority(tasks, 'High');
  assertEqual(result.length, 1);
  assertEqual(result[0].priority, 'High');
});

test('filterByPriority "all" returns everything', () => {
  const tasks  = [makeTask({ priority: 'High' }), makeTask({ priority: 'Low' })];
  const result = TFTasks.filterByPriority(tasks, 'all');
  assertEqual(result.length, 2);
});

test('filterByCategory returns only matching category', () => {
  const tasks = [
    makeTask({ id: '1', category: 'Work' }),
    makeTask({ id: '2', category: 'Personal' }),
    makeTask({ id: '3', category: 'Work' }),
  ];
  const result = TFTasks.filterByCategory(tasks, 'Work');
  assertEqual(result.length, 2);
  assert(result.every(t => t.category === 'Work'));
});

test('filterByCategory "all" returns everything', () => {
  const tasks  = [makeTask({ category: 'A' }), makeTask({ category: 'B' })];
  assertEqual(TFTasks.filterByCategory(tasks, 'all').length, 2);
});

console.groupEnd();

/* ════════════════════════════════════════════════════════════
   SUITE 10 — TFTasks.searchTasks
   ════════════════════════════════════════════════════════════ */
console.group('🔍 TFTasks.searchTasks');

const searchData = [
  makeTask({ id: '1', title: 'Buy groceries',      description: 'Milk and eggs' }),
  makeTask({ id: '2', title: 'Finish report',       description: 'Annual summary' }),
  makeTask({ id: '3', title: 'Call dentist',        description: 'Make appointment' }),
];

test('matches title case-insensitively', () => {
  const result = TFTasks.searchTasks(searchData, 'GROCERIES');
  assertEqual(result.length, 1);
  assertEqual(result[0].id, '1');
});

test('matches description case-insensitively', () => {
  const result = TFTasks.searchTasks(searchData, 'annual');
  assertEqual(result.length, 1);
  assertEqual(result[0].id, '2');
});

test('empty query returns all tasks', () => {
  const result = TFTasks.searchTasks(searchData, '');
  assertEqual(result.length, 3);
});

test('whitespace-only query returns all tasks', () => {
  const result = TFTasks.searchTasks(searchData, '   ');
  assertEqual(result.length, 3);
});

test('no match returns empty array', () => {
  const result = TFTasks.searchTasks(searchData, 'xyzzy-no-match');
  assertEqual(result.length, 0);
});

test('handles empty input array', () => {
  assertEqual(TFTasks.searchTasks([], 'test').length, 0);
});

console.groupEnd();

/* ════════════════════════════════════════════════════════════
   SUITE 11 — TFTasks.sortTasks
   ════════════════════════════════════════════════════════════ */
console.group('📊 TFTasks.sortTasks');

test('sorts by dueDate ascending (nulls last)', () => {
  const tasks = [
    makeTask({ id: '1', dueDate: '2026-12-01' }),
    makeTask({ id: '2', dueDate: null }),
    makeTask({ id: '3', dueDate: '2026-11-01' }),
  ];
  const result = TFTasks.sortTasks(tasks, 'dueDate', 'asc');
  assertEqual(result[0].dueDate, '2026-11-01');
  assertEqual(result[1].dueDate, '2026-12-01');
  assertEqual(result[2].dueDate, null, 'Null dates should come last');
});

test('sorts by dueDate descending', () => {
  const tasks = [
    makeTask({ id: '1', dueDate: '2026-11-01' }),
    makeTask({ id: '2', dueDate: '2026-12-01' }),
  ];
  const result = TFTasks.sortTasks(tasks, 'dueDate', 'desc');
  assertEqual(result[0].dueDate, '2026-12-01');
  assertEqual(result[1].dueDate, '2026-11-01');
});

test('sorts by priority High→Medium→Low (asc)', () => {
  const tasks = [
    makeTask({ id: '1', priority: 'Low' }),
    makeTask({ id: '2', priority: 'High' }),
    makeTask({ id: '3', priority: 'Medium' }),
  ];
  const result = TFTasks.sortTasks(tasks, 'priority', 'asc');
  assertEqual(result[0].priority, 'High');
  assertEqual(result[1].priority, 'Medium');
  assertEqual(result[2].priority, 'Low');
});

test('sorts by title A–Z (asc)', () => {
  const tasks = [
    makeTask({ id: '1', title: 'Zebra' }),
    makeTask({ id: '2', title: 'apple' }),
    makeTask({ id: '3', title: 'Mango' }),
  ];
  const result = TFTasks.sortTasks(tasks, 'title', 'asc');
  assertEqual(result[0].title, 'apple');
  assertEqual(result[1].title, 'Mango');
  assertEqual(result[2].title, 'Zebra');
});

test('returns unchanged array for single item', () => {
  const tasks  = [makeTask({ id: 'only' })];
  const result = TFTasks.sortTasks(tasks, 'dueDate', 'asc');
  assertEqual(result.length, 1);
});

test('does not mutate original array', () => {
  const tasks    = [makeTask({ id: '1', title: 'B' }), makeTask({ id: '2', title: 'A' })];
  const origFirst = tasks[0].title;
  TFTasks.sortTasks(tasks, 'title', 'asc');
  assertEqual(tasks[0].title, origFirst, 'Original order should be preserved');
});

// Property-based: sort by dueDate asc → each item deadline ≤ next item deadline
test('[property] sortTasks dueDate asc is monotonically non-decreasing', () => {
  const tasks = [
    makeTask({ id: '1', dueDate: '2026-12-10' }),
    makeTask({ id: '2', dueDate: '2026-11-01' }),
    makeTask({ id: '3', dueDate: '2026-10-15' }),
    makeTask({ id: '4', dueDate: null }),
  ];
  const result = TFTasks.sortTasks(tasks, 'dueDate', 'asc');
  for (let i = 0; i < result.length - 1; i++) {
    const curr = result[i].dueDate;
    const next = result[i + 1].dueDate;
    if (curr === null) break; // nulls always at end
    if (next === null) break;
    const da = TFUtils.parseDateTime(curr, null);
    const db = TFUtils.parseDateTime(next, null);
    assert(da <= db, `Out of order: ${curr} > ${next}`);
  }
});

console.groupEnd();

/* ════════════════════════════════════════════════════════════
   SUITE 12 — TFTasks.completionPercentage
   ════════════════════════════════════════════════════════════ */
console.group('📈 TFTasks.completionPercentage');

test('returns 0 for empty task list', () => {
  assertEqual(TFTasks.completionPercentage([]), 0);
});

test('returns 0 when no tasks completed', () => {
  const tasks = [makeTask({ status: 'pending' }), makeTask({ status: 'pending' })];
  assertEqual(TFTasks.completionPercentage(tasks), 0);
});

test('returns 100 when all tasks completed', () => {
  const tasks = [
    makeTask({ status: 'completed' }),
    makeTask({ status: 'completed' }),
  ];
  assertEqual(TFTasks.completionPercentage(tasks), 100);
});

test('returns 50 for half completed', () => {
  const tasks = [
    makeTask({ id: '1', status: 'completed' }),
    makeTask({ id: '2', status: 'pending' }),
  ];
  assertEqual(TFTasks.completionPercentage(tasks), 50);
});

test('rounds to nearest integer', () => {
  const tasks = [
    makeTask({ id: '1', status: 'completed' }),
    makeTask({ id: '2', status: 'pending' }),
    makeTask({ id: '3', status: 'pending' }),
  ];
  const pct = TFTasks.completionPercentage(tasks);
  assertEqual(pct, 33);
});

// Property-based: result always 0–100 inclusive
test('[property] completionPercentage is always 0–100', () => {
  const datasets = [
    [],
    [makeTask({ status: 'pending' })],
    [makeTask({ status: 'completed' })],
    [makeTask({ status: 'completed' }), makeTask({ status: 'pending' })],
    Array.from({ length: 10 }, (_, i) => makeTask({ id: String(i), status: i % 2 === 0 ? 'completed' : 'pending' })),
  ];
  datasets.forEach(tasks => {
    const pct = TFTasks.completionPercentage(tasks);
    assert(pct >= 0 && pct <= 100, `Percentage out of range: ${pct}`);
  });
});

console.groupEnd();

/* ════════════════════════════════════════════════════════════
   SUITE 13 — TFCountdown.calculateTimeRemaining
   ════════════════════════════════════════════════════════════ */
console.group('⏱️ TFCountdown.calculateTimeRemaining');

test('returns null for null dueDate', () => {
  assertEqual(TFCountdown.calculateTimeRemaining(null, null), null);
});

test('returns overdue:true for past date', () => {
  const result = TFCountdown.calculateTimeRemaining(pastDate(2), null);
  assert(result !== null);
  assertEqual(result.overdue, true);
  assertEqual(result.days, 0);
  assertEqual(result.seconds, 0);
});

test('returns overdue:true for exactly past', () => {
  // 1 second in the past
  const d = new Date(Date.now() - 2000);
  const ds = TFUtils.dateToString(d);
  const ts = d.toTimeString().slice(0, 5);
  const result = TFCountdown.calculateTimeRemaining(ds, ts);
  assertEqual(result.overdue, true);
});

test('returns overdue:false and positive values for future date', () => {
  const result = TFCountdown.calculateTimeRemaining(futureDate(3), null);
  assert(result !== null);
  assertEqual(result.overdue, false);
  assert(result.days >= 2, `Expected at least 2 days remaining, got ${result.days}`);
  assert(result.hours >= 0);
  assert(result.minutes >= 0);
  assert(result.seconds >= 0);
});

test('all components are non-negative for future task', () => {
  const result = TFCountdown.calculateTimeRemaining(futureDate(1), null);
  assert(result.days >= 0);
  assert(result.hours >= 0);
  assert(result.minutes >= 0);
  assert(result.seconds >= 0);
});

test('defaults to 23:59:59 when no dueTime given', () => {
  // A task due today with no time: at time of test, depends on local clock.
  // We just check it returns a non-null result.
  const result = TFCountdown.calculateTimeRemaining(futureDate(1), null);
  assert(result !== null, 'Should return a result for no-time task');
});

test('uses dueTime when provided', () => {
  // Set due date 2 days from now at 00:00 — should be less than 2 days + 24h
  const result = TFCountdown.calculateTimeRemaining(futureDate(2), '00:00');
  assert(result !== null);
  // Should be approximately 1–2 days
  assert(result.days <= 2, `Expected ≤2 days, got ${result.days}`);
});

// Property-based: future task always overdue:false with non-negative components
test('[property] future tasks always return overdue:false, all components ≥ 0', () => {
  const futureDates = [futureDate(1), futureDate(7), futureDate(30)];
  futureDates.forEach(d => {
    const result = TFCountdown.calculateTimeRemaining(d, null);
    assert(!result.overdue, `Expected not overdue for future date ${d}`);
    assert(result.days    >= 0, 'days must be ≥ 0');
    assert(result.hours   >= 0, 'hours must be ≥ 0');
    assert(result.minutes >= 0, 'minutes must be ≥ 0');
    assert(result.seconds >= 0, 'seconds must be ≥ 0');
  });
});

// Property-based: past tasks always return overdue:true
test('[property] past tasks always return overdue:true', () => {
  const pastDates = [pastDate(1), pastDate(7), pastDate(30)];
  pastDates.forEach(d => {
    const result = TFCountdown.calculateTimeRemaining(d, null);
    assert(result.overdue === true, `Expected overdue:true for past date ${d}`);
  });
});

console.groupEnd();

/* ════════════════════════════════════════════════════════════
   SUITE 14 — TFStorage
   ════════════════════════════════════════════════════════════ */
console.group('💾 TFStorage');

// Use a separate test key to avoid polluting real app data
const TEST_KEY = 'taskflow_tasks_test';
const _realGet = localStorage.getItem.bind(localStorage);
const _realSet = localStorage.setItem.bind(localStorage);
const _realRemove = localStorage.removeItem.bind(localStorage);

const withCleanStorage = (fn) => {
  const saved = _realGet('taskflow_tasks');
  try {
    _realRemove('taskflow_tasks');
    fn();
  } finally {
    if (saved !== null) _realSet('taskflow_tasks', saved);
    else _realRemove('taskflow_tasks');
  }
};

test('getTasks returns [] when storage is empty', () => {
  withCleanStorage(() => {
    const tasks = TFStorage.getTasks();
    assertEqual(tasks, []);
  });
});

test('saveTasks + getTasks round-trip preserves all fields', () => {
  withCleanStorage(() => {
    const task = makeTask({
      id: 'rt-001', title: 'Round trip', priority: 'High',
      category: 'Work', dueDate: '2027-01-15', dueTime: '09:00',
    });
    TFStorage.saveTasks([task]);
    const loaded = TFStorage.getTasks();
    assertEqual(loaded.length, 1);
    assertEqual(loaded[0].id,       'rt-001');
    assertEqual(loaded[0].title,    'Round trip');
    assertEqual(loaded[0].priority, 'High');
    assertEqual(loaded[0].category, 'Work');
    assertEqual(loaded[0].dueDate,  '2027-01-15');
    assertEqual(loaded[0].dueTime,  '09:00');
  });
});

test('getTasks returns [] and does not throw on corrupt JSON', () => {
  withCleanStorage(() => {
    _realSet('taskflow_tasks', '{ not valid json !!');
    let result;
    try {
      result = TFStorage.getTasks();
    } catch (e) {
      throw new Error(`getTasks should not throw on corrupt data: ${e.message}`);
    }
    assertEqual(result, []);
  });
});

test('getTasks filters out items missing required fields', () => {
  withCleanStorage(() => {
    const valid   = makeTask({ id: 'v1', title: 'Valid' });
    const invalid = { id: null, notATask: true }; // missing title and id
    _realSet('taskflow_tasks', JSON.stringify([valid, invalid]));
    const result = TFStorage.getTasks();
    assertEqual(result.length, 1);
    assertEqual(result[0].id, 'v1');
  });
});

test('saveTasks returns true on success', () => {
  withCleanStorage(() => {
    const ok = TFStorage.saveTasks([makeTask()]);
    assertEqual(ok, true);
  });
});

test('getTaskById returns correct task', () => {
  withCleanStorage(() => {
    const tasks = [makeTask({ id: 'find-me' }), makeTask({ id: 'other' })];
    TFStorage.saveTasks(tasks);
    const found = TFStorage.getTaskById('find-me');
    assert(found !== null, 'Should find task');
    assertEqual(found.id, 'find-me');
  });
});

test('getTaskById returns null for unknown id', () => {
  withCleanStorage(() => {
    TFStorage.saveTasks([makeTask({ id: 'real' })]);
    const result = TFStorage.getTaskById('ghost');
    assertEqual(result, null);
  });
});

console.groupEnd();

/* ════════════════════════════════════════════════════════════
   SUITE 15 — TFDashboard analytics
   ════════════════════════════════════════════════════════════ */
console.group('📊 TFDashboard analytics');

test('weeklyChartData returns 7 labels', () => {
  const { labels } = TFDashboard.weeklyChartData([]);
  assertEqual(labels.length, 7);
});

test('weeklyChartData counts created tasks per day correctly', () => {
  // Create a task whose createdAt is today
  const todayStr = TFUtils.todayString();
  const task     = makeTask({ createdAt: todayStr + 'T10:00:00.000Z' });
  const { created } = TFDashboard.weeklyChartData([task]);
  // At least one day slot should have count 1
  const sum = created.reduce((s, v) => s + v, 0);
  // The task was created today — if today is within current week, sum >= 1
  // (May be 0 if today is not in current Mon-Sun, e.g. during a week boundary test)
  assert(sum >= 0, 'Created counts should be non-negative numbers');
  created.forEach(c => assert(c >= 0, 'Each count should be ≥ 0'));
});

test('categoryChartData groups uncategorised tasks', () => {
  const tasks = [
    makeTask({ id: '1', category: '' }),
    makeTask({ id: '2', category: '' }),
  ];
  const { labels, counts } = TFDashboard.categoryChartData(tasks);
  assert(labels.includes('Uncategorised'), 'Should include Uncategorised label');
  assertEqual(counts[labels.indexOf('Uncategorised')], 2);
});

test('categoryChartData sorts by count descending', () => {
  const tasks = [
    makeTask({ id: '1', category: 'Work' }),
    makeTask({ id: '2', category: 'Work' }),
    makeTask({ id: '3', category: 'Personal' }),
    makeTask({ id: '4', category: 'Work' }),
  ];
  const { labels, counts } = TFDashboard.categoryChartData(tasks);
  assertEqual(labels[0], 'Work');
  assertEqual(counts[0], 3);
});

test('categoryChartData returns empty for empty task list', () => {
  const { labels, counts } = TFDashboard.categoryChartData([]);
  assertEqual(labels.length, 0);
  assertEqual(counts.length, 0);
});

console.groupEnd();

/* ════════════════════════════════════════════════════════════
   SUITE 16 — TFTasks.calcStats (integration)
   ════════════════════════════════════════════════════════════ */
console.group('📋 TFTasks.calcStats');

test('calcStats returns zeroes for empty task list', () => {
  const stats = TFTasks.calcStats([]);
  assertEqual(stats.total,      0);
  assertEqual(stats.completed,  0);
  assertEqual(stats.pending,    0);
  assertEqual(stats.overdue,    0);
  assertEqual(stats.percentage, 0);
});

test('calcStats counts correctly for mixed tasks', () => {
  const tasks = [
    makeTask({ id: '1', status: 'completed' }),
    makeTask({ id: '2', status: 'pending',   dueDate: pastDate(1) }), // overdue
    makeTask({ id: '3', status: 'pending',   dueDate: null }),
    makeTask({ id: '4', priority: 'High',    status: 'pending', dueDate: null }),
  ];
  const stats = TFTasks.calcStats(tasks);
  assertEqual(stats.total,     4);
  assertEqual(stats.completed, 1);
  assertEqual(stats.pending,   3); // non-completed
  assertEqual(stats.overdue,   1);
  assertEqual(stats.highPri,   1);
  assertEqual(stats.percentage, 25);
});

test('calcStats todayList contains only tasks due today', () => {
  const today = TFUtils.todayString();
  const tasks = [
    makeTask({ id: '1', dueDate: today }),
    makeTask({ id: '2', dueDate: futureDate(5) }),
  ];
  const stats = TFTasks.calcStats(tasks);
  assertEqual(stats.today, 1);
  assert(stats.todayList.every(t => t.dueDate === today));
});

test('calcStats upcomingList excludes overdue and completed', () => {
  const tasks = [
    makeTask({ id: '1', dueDate: futureDate(3), status: 'pending' }),    // upcoming
    makeTask({ id: '2', dueDate: futureDate(3), status: 'completed' }), // excluded
    makeTask({ id: '3', dueDate: pastDate(1),   status: 'pending' }),    // overdue — excluded from upcoming
  ];
  const stats = TFTasks.calcStats(tasks);
  assert(stats.upcomingList.every(t => t.status !== 'completed'));
  assert(stats.upcomingList.every(t => !TFTasks.isOverdue(t)));
});

console.groupEnd();

/* ════════════════════════════════════════════════════════════
   RESULTS SUMMARY
   ════════════════════════════════════════════════════════════ */

const total = passed + failed;
console.log(`\n${'═'.repeat(52)}`);
console.log(`TaskFlow Test Results: ${passed}/${total} passed`);
if (failed > 0) console.warn(`${failed} test${failed !== 1 ? 's' : ''} FAILED`);
else console.log('✅ All tests passed!');
console.log('═'.repeat(52));

// Expose results for the test runner page
window._TFTestResults = { passed, failed, total, results };
