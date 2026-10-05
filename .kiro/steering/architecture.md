---
inclusion: always
---

# TaskFlow – Architecture Guidelines

## Technology Stack

- **HTML5** — semantic markup, single `index.html` entry point
- **CSS3** — custom properties, flexbox, grid, no CSS framework
- **Vanilla JavaScript (ES6+)** — modules via `<script type="module">` or IIFE pattern
- **Chart.js** — loaded from CDN for dashboard charts
- **No build tools required** — app must open directly from `index.html` in any modern browser

## File Structure

```
d:\my-kiro\
├── index.html              # Single entry point
├── css/
│   ├── main.css            # Global reset, variables, typography
│   ├── layout.css          # Sidebar, header, content area
│   ├── components.css      # Cards, modals, badges, buttons, forms
│   └── responsive.css      # Media queries
├── js/
│   ├── app.js              # Bootstrap: initialise modules, wire events
│   ├── storage.js          # StorageService — all localStorage I/O
│   ├── tasks.js            # Task CRUD logic (pure functions where possible)
│   ├── ui.js               # DOM rendering helpers
│   ├── countdown.js        # Countdown timer engine
│   ├── notifications.js    # Browser + in-app notification logic
│   ├── schedule.js         # Schedule planner (day/week view)
│   ├── dashboard.js        # Analytics calculations + chart rendering
│   └── utils.js            # Date helpers, UUID generator, formatters
├── tests/
│   └── taskflow.test.js    # Pure-function unit tests (no framework needed)
├── .kiro/
│   ├── hooks/              # Kiro hooks — DO NOT DELETE
│   ├── specs/              # Product specification
│   ├── steering/           # These steering files
│   └── ugmdu.json          # University tracking — DO NOT TOUCH
├── .gitignore
└── README.md
```

## Module Responsibilities

| Module | Responsibility |
|--------|---------------|
| `storage.js` | All reads/writes to localStorage; exposes `getTasks()`, `saveTasks()`, `getSettings()`, `saveSettings()` |
| `tasks.js` | Business logic: createTask, updateTask, deleteTask, toggleComplete, filterTasks, sortTasks, searchTasks, isOverdue |
| `ui.js` | Render task cards, modals, toasts, badges; no business logic |
| `countdown.js` | Start/stop timers; calculate time remaining; update DOM |
| `notifications.js` | Check permission, request permission, schedule/send notifications, show in-app toasts |
| `schedule.js` | Compute day/week slot data; render planner views |
| `dashboard.js` | Aggregate stats from tasks; render Chart.js charts |
| `utils.js` | Pure utility functions: generateUUID, formatDate, formatTime, parseDateTime, getDayOfWeek |
| `app.js` | Wires everything together; handles navigation; listens to global events |

## Data Flow

```
User Action → app.js event handler
  → tasks.js (business logic / validation)
    → storage.js (persist to localStorage)
  → ui.js (re-render affected components)
  → dashboard.js (recalculate stats)
  → countdown.js (update timers if needed)
```

## Design Principles

1. **Separation of concerns** — business logic never touches the DOM; UI code never writes to storage directly
2. **Pure functions preferred** — especially in `tasks.js` and `utils.js`; easier to test
3. **Single source of truth** — task array in `storage.js`; all views read from it
4. **Progressive enhancement** — app works without notifications; charts degrade gracefully if Chart.js fails to load
5. **No magic globals** — modules expose explicit APIs; avoid polluting `window`

## Future Backend Migration Path

- Replace `storage.js` methods with `async` fetch calls to a REST API
- All callers already `await` storage operations (or will be updated to do so)
- Task UUIDs are backend-compatible primary keys
- ISO timestamps on all records eliminate timezone ambiguity
