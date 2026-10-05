---
inclusion: always
---

# TaskFlow – Testing Conventions

## Philosophy

- Test behaviour, not implementation details
- Every pure function in `tasks.js`, `utils.js`, and `dashboard.js` must have tests
- Tests live in `tests/taskflow.test.js`
- Tests run directly in the browser via a minimal test harness (no Node, no npm)
- Pass/fail output logged to the browser console and rendered in `tests/index.html`

## Test Runner

A lightweight custom harness lives in `tests/taskflow.test.js`:

```js
let passed = 0, failed = 0;

const test = (description, fn) => {
  try {
    fn();
    console.log(`✅ PASS: ${description}`);
    passed++;
  } catch (e) {
    console.error(`❌ FAIL: ${description}\n   ${e.message}`);
    failed++;
  }
};

const assert = (condition, message = 'Assertion failed') => {
  if (!condition) throw new Error(message);
};

const assertEqual = (actual, expected, message) => {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a !== e) throw new Error(message || `Expected ${e} but got ${a}`);
};
```

## Required Test Coverage

### Task Creation
- Creates task with correct defaults (status: pending, createdAt set, id is UUID)
- Trims whitespace from title
- Rejects empty title
- Rejects title > 200 characters
- Sets completedAt to null on creation

### Task Completion / Reopening
- Sets status to "completed" and records completedAt
- Clears completedAt when task reopened
- Does not change other fields when toggling

### Task Deletion
- Removes task by id from array
- Returns unchanged array if id not found
- Does not mutate original array

### Filtering
- Returns only pending tasks when filter = "pending"
- Returns only completed tasks when filter = "completed"
- Overdue filter returns tasks whose deadline has passed and status != completed
- Returns all tasks when filter = "all"
- Empty array input returns empty array

### Sorting
- Sorts by due date ascending (null dates go last)
- Sorts by due date descending
- Sorts by priority (High → Medium → Low)
- Sorts by title A–Z (case-insensitive)
- Handles array with single item
- Handles array with equal values (stable sort)

### Countdown Calculation
- Returns correct d/h/m/s for known future timestamp
- Returns `{ overdue: true }` for past timestamp
- Returns `{ overdue: true }` for exactly now
- Handles null dueDate gracefully (returns null)
- Handles missing dueTime (defaults to 23:59:59)

### Overdue Detection
- Task with past due date and status pending → isOverdue true
- Task with future due date → isOverdue false
- Completed task with past due date → isOverdue false
- Task with no due date → isOverdue false

### Completion Percentage
- 0 tasks → 0%
- All completed → 100%
- Half completed → 50%
- Rounds to nearest integer

### Search
- Matches title (case-insensitive)
- Matches description (case-insensitive)
- Empty query returns all tasks
- No match returns empty array

### localStorage Persistence
- getTasks returns [] when storage empty
- saveTasks + getTasks round-trip preserves all fields
- Corrupted JSON in storage returns [] without throwing

### Date Utilities
- formatDate("2026-10-05") → "Oct 5, 2026" (locale-friendly)
- parseDateTime("2026-10-05", "14:30") → correct Date object
- getDayOfWeek returns 0–6 correctly

## Property-Based Thinking

For these functions, verify properties that must hold for all valid inputs:

| Function | Property |
|----------|----------|
| `filterTasks(tasks, 'completed')` | Every returned task has `status === 'completed'` |
| `sortTasks(tasks, 'dueDate', 'asc')` | Result is ordered: each item's deadline ≤ next item's deadline |
| `completionPercentage(tasks)` | Result is always 0–100 inclusive |
| `calculateTimeRemaining(past)` | Always returns `overdue: true` |
| `calculateTimeRemaining(future)` | Returns `overdue: false`, all values ≥ 0 |

## Test File Structure

```js
// ── Imports ──────────────────────────────────────────────────────
// (inline or script tag — no module imports needed for test file)

// ── Harness ──────────────────────────────────────────────────────
// test(), assert(), assertEqual() definitions

// ── Suites ───────────────────────────────────────────────────────
// Group tests with console.group / console.groupEnd

// ── Summary ──────────────────────────────────────────────────────
console.log(`\nResults: ${passed} passed, ${failed} failed`);
```

## Rules

- Fix all failing tests before committing
- Never skip a test to make CI green — fix the code
- Do not test UI rendering — only test pure functions and data logic
- Do not create tests that always pass regardless of logic (meaningless assertions)
