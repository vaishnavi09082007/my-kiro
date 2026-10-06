# TaskFlow Design

## Architecture

TaskFlow is a pure client-side single-page application (SPA). It runs entirely in the browser with no server, no build step, and no framework dependencies. The application loads by opening `index.html` directly.

### Technology Stack

| Layer | Technology |
|-------|-----------|
| Markup | HTML5 — semantic elements, ARIA attributes |
| Styling | CSS3 — custom properties, flexbox, grid, glassmorphism |
| Logic | Vanilla JavaScript (ES6+) — modular IIFE/global pattern |
| Charts | Chart.js 4.4.4 via CDN (pinned version) |
| Persistence | `localStorage` — key `taskflow_tasks` and `taskflow_settings` |

### Module Structure

```
js/
├── utils.js         Pure utility functions (UUID, dates, formatters)
├── storage.js       All localStorage I/O — single storage service
├── tasks.js         Business logic: CRUD, filter, sort, search, stats
├── ui.js            DOM rendering helpers — no business logic
├── countdown.js     Live countdown timer engine (1-second interval)
├── notifications.js Browser + in-app notification logic
├── schedule.js      Schedule planner day/week view rendering
├── dashboard.js     Analytics calculations + Chart.js rendering
└── app.js           Bootstrap, event wiring, navigation
```

### CSS Structure

```
css/
├── main.css         Design tokens, reset, typography
├── layout.css       Sidebar, header, content area
├── components.css   Cards, buttons, badges, modals, forms, toasts
├── responsive.css   Breakpoints and animations
└── landing.css      Landing page styles
```

---

## Data Flow

```
User Action
  → app.js event handler
    → tasks.js (business logic / validation)
      → storage.js (persist to localStorage)
    → ui.js (re-render affected component)
    → dashboard.js (recalculate stats + update charts)
    → countdown.js (refresh task cache, restart timer)
```

All modules communicate through a global namespace (`window.TFUtils`, `window.TFStorage`, `window.TFTasks`, etc.) since ES modules are not available when opening HTML files directly from the filesystem.

---

## Interfaces

### Storage Service (`storage.js`)

```js
TFStorage.getTasks()         → Task[]
TFStorage.saveTasks(tasks)   → boolean
TFStorage.getTaskById(id)    → Task | null
TFStorage.getSettings()      → Settings
TFStorage.saveSettings(s)    → boolean
TFStorage.clearAll()         → void
```

### Task Business Logic (`tasks.js`)

```js
TFTasks.validateTask(data)                           → { valid, errors }
TFTasks.createTask(data)                             → Task
TFTasks.updateTask(tasks, id, changes)               → Task[]
TFTasks.deleteTask(tasks, id)                        → Task[]
TFTasks.toggleComplete(tasks, id)                    → Task[]
TFTasks.isOverdue(task)                              → boolean
TFTasks.getDisplayStatus(task)                       → 'pending'|'completed'|'overdue'
TFTasks.filterByStatus(tasks, filter)                → Task[]
TFTasks.filterByPriority(tasks, priority)            → Task[]
TFTasks.filterByCategory(tasks, category)            → Task[]
TFTasks.searchTasks(tasks, query)                    → Task[]
TFTasks.sortTasks(tasks, field, direction)           → Task[]
TFTasks.applyFilters(tasks, filters)                 → Task[]
TFTasks.completionPercentage(tasks)                  → number (0–100)
TFTasks.calcStats(tasks)                             → StatsObject
```

### Countdown Engine (`countdown.js`)

```js
TFCountdown.calculateTimeRemaining(dueDate, dueTime) → { days, hours, minutes, seconds, overdue }
TFCountdown.startCountdownTimer()                    → void
TFCountdown.restartCountdownTimer()                  → void
TFCountdown.clearOverdueAlert(taskId)                → void
```

---

## Data Models

### Task Object

```typescript
interface Task {
  id:          string;   // UUID v4
  title:       string;   // 1–200 chars, trimmed
  description: string;   // optional, max 1000 chars
  priority:    'Low' | 'Medium' | 'High';
  category:    string;   // optional, max 50 chars
  dueDate:     string | null;  // YYYY-MM-DD
  dueTime:     string | null;  // HH:MM (24-hour), requires dueDate
  status:      'pending' | 'completed';
  createdAt:   string;   // ISO 8601
  updatedAt:   string;   // ISO 8601
  completedAt: string | null;  // ISO 8601
}
```

### Settings Object

```typescript
interface Settings {
  theme:                'dark' | 'light';
  notificationsEnabled: boolean;
  defaultPriority:      'Low' | 'Medium' | 'High';
}
```

### Derived / Computed Fields (never stored)

| Field | Computation |
|-------|------------|
| `isOverdue` | `status !== 'completed' && dueDate && parseDateTime(dueDate, dueTime) < new Date()` |
| `displayStatus` | `'overdue'` if `isOverdue`, else stored `status` |
| `timeRemaining` | Computed by `countdown.js` every second |

---

## Error Handling

| Scenario | Handling |
|----------|----------|
| Corrupt localStorage JSON | `try/catch` in `storage.js`; returns `[]`; logs `console.warn` |
| Invalid task form data | `validateTask()` returns `{ valid: false, errors }`; inline field errors shown |
| Chart.js CDN unavailable | `typeof Chart === 'undefined'` check; fallback message rendered |
| Notification API unavailable | `typeof Notification === 'undefined'` check; in-app toasts used instead |
| Unknown task ID | Operations return unchanged array; UI shows error toast |

---

## Unit Testing Strategy

Tests live in `tests/taskflow.test.js` and run in the browser via `tests/index.html`.

A lightweight custom harness provides `test()`, `assert()`, and `assertEqual()`.

### Test Coverage (114 tests, 16 suites)

| Suite | Functions tested |
|-------|-----------------|
| TFUtils | UUID, formatDate, formatTime, parseDateTime, dateToString, getWeekDays, escapeHtml |
| Validation | All field rules, cross-field rules, boundary conditions |
| createTask | Defaults, trimming, ID uniqueness, timestamps |
| updateTask | Field updates, immutability, updatedAt refresh |
| deleteTask | Removal, unknown ID, no mutation |
| toggleComplete | Status flip, completedAt, other fields unchanged |
| isOverdue | Past/future/completed/no-date cases |
| filterByStatus | all/pending/completed/overdue, empty input |
| filterByPriority & category | Matching, all filter |
| searchTasks | Title match, description match, empty/no-match |
| sortTasks | dueDate asc (nulls last), desc, priority order, title A–Z |
| completionPercentage | 0/half/100/rounding |
| calculateTimeRemaining | Future/past/null, components non-negative |
| TFStorage | Round-trip, corrupt JSON, getTaskById |
| TFDashboard analytics | weeklyChartData, categoryChartData |
| calcStats integration | Mixed task states, todayList, upcomingList |

### Property-Based Tests

See `tests/taskflow.test.js` — property-based suites verify invariants hold across all valid input combinations:

| Property | Invariant |
|----------|-----------|
| `completionPercentage` | Result always in `[0, 100]` |
| `filterByStatus('completed')` | Every result has `status === 'completed'` |
| `sortTasks` ascending | Result is monotonically non-decreasing |
| `calculateTimeRemaining` future | Always `overdue: false`, all values `≥ 0` |
| `calculateTimeRemaining` past | Always `overdue: true` |
