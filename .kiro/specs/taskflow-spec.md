# TaskFlow – Smart Task Manager & Schedule Planner
## Product Specification v1.0

---

## 1. Problem Statement

Busy individuals struggle to track tasks, deadlines, and daily/weekly schedules in a single unified view. Existing tools are either too complex (project management suites) or too simple (plain to-do lists). People miss deadlines because they have no real-time countdown, no visual schedule, and no at-a-glance productivity picture.

TaskFlow solves this by combining task management, live countdown reminders, a visual schedule planner, and a productivity dashboard into one lightweight, browser-based application that requires no sign-up or server.

---

## 2. Target User

- Students managing assignment deadlines and study schedules
- Freelancers tracking client deliverables
- Professionals organising daily work tasks
- Anyone who wants a simple, offline-capable task planner without installing desktop software

**Primary persona:** A university student or early-career professional who wants to see their week at a glance, knows exactly how much time remains before each deadline, and gets a gentle nudge before missing one.

---

## 3. Main Features

### 3.1 Task Management
- Create, edit, delete tasks
- Mark tasks complete / reopen
- Fields: title, description, priority (Low / Medium / High), category, due date, due time, status
- Search tasks by title or description
- Filter by status, priority, category
- Sort by due date, priority, title, creation date

### 3.2 Time Reminder & Countdown
- Live countdown (days, hours, minutes, seconds) for each upcoming task
- "Overdue" state when deadline passes — no negative countdown
- Visual distinction: overdue tasks styled differently
- Browser Notification API support with graceful permission request
- In-app notification fallback when browser notifications unavailable or denied
- Reminder fires at: 1 day before, 1 hour before

### 3.3 Schedule Planner
- Day view: all tasks for a selected date, sorted by time
- Week view: Monday–Sunday grid with tasks per day
- Navigation: previous/today/next
- Click task to open details modal
- "Add task" shortcut directly from a planner day slot

### 3.4 Productivity Dashboard
- Summary cards: total, completed, pending, overdue, high-priority
- Completion percentage with progress bar
- Today's tasks list
- Upcoming tasks (next 7 days)
- Overdue tasks list
- Weekly bar chart (tasks created vs completed per day)
- Category breakdown doughnut chart
- All values computed live from real task data — no hardcoded statistics

---

## 4. User Stories

| ID | As a… | I want to… | So that… |
|----|-------|-----------|---------|
| US-01 | user | add a task with title, due date, and priority | I can track what needs to be done |
| US-02 | user | edit any field of an existing task | I can correct mistakes or update plans |
| US-03 | user | delete a task | I can remove tasks that are no longer relevant |
| US-04 | user | mark a task complete | I can track my progress |
| US-05 | user | reopen a completed task | I can resume work if needed |
| US-06 | user | see a live countdown on upcoming tasks | I always know how much time remains |
| US-07 | user | be notified before a deadline | I don't miss important tasks |
| US-08 | user | view all tasks for a specific day | I can plan my daily schedule |
| US-09 | user | view the whole week on one screen | I can spot busy periods in advance |
| US-10 | user | see a dashboard with task statistics | I can understand my productivity at a glance |
| US-11 | user | search and filter tasks | I can quickly find what I'm looking for |
| US-12 | user | have my tasks persist across browser refreshes | I don't lose data when I close the browser |
| US-13 | user | use the app on mobile or tablet | I can manage tasks from any device |

---

## 5. Functional Requirements

### FR-01 Task Creation
- User can open a modal form and fill in: title (required), description (optional), priority (required, default: Medium), category (optional, free text), due date (optional), due time (optional)
- System assigns a unique ID, createdAt timestamp, and status = "pending" on creation
- Task is saved to localStorage immediately on confirm

### FR-02 Task Editing
- All fields editable via the same modal form pre-filled with existing values
- Changes saved to localStorage immediately

### FR-03 Task Deletion
- User confirms deletion via a confirmation prompt
- Task removed from localStorage and UI immediately

### FR-04 Task Completion
- Toggle complete/incomplete without opening the edit modal
- completedAt timestamp recorded when completing; cleared when reopening

### FR-05 Search
- Real-time filter as user types in the search box
- Searches title and description (case-insensitive)

### FR-06 Filter
- Filter by: status (all / pending / completed / overdue), priority (all / Low / Medium / High), category (all / any existing category)

### FR-07 Sort
- Sort by: due date (asc/desc), priority (High→Low or Low→High), title (A-Z / Z-A), created date (newest/oldest)

### FR-08 Countdown
- Displayed on each task card when due date+time is set and task is not complete
- Updates every second using setInterval
- Shows "Overdue" badge when current time > due date+time

### FR-09 Notifications
- On app load, check Notification.permission
- If "default", show a non-intrusive in-app prompt to enable notifications
- If "granted", schedule notifications for tasks due in 24h and 1h
- If "denied" or unavailable, show in-app toast reminders only

### FR-10 Schedule Planner
- Day view renders all tasks whose due date = selected date
- Week view renders Mon–Sun of the selected week; each day column lists tasks
- Clicking any task opens the task detail/edit modal
- "Add task" from a day slot pre-fills the due date field

### FR-11 Dashboard
- Recalculates all stats on every task data change
- Charts use Chart.js (loaded via CDN)
- Weekly bar chart covers Mon–Sun of the current week
- Category doughnut shows distribution of tasks by category

### FR-12 Persistence
- All task data stored in localStorage key "taskflow_tasks"
- Data loaded on app start; corrupted data caught and reset gracefully

---

## 6. Non-Functional Requirements

| ID | Requirement |
|----|------------|
| NFR-01 | Application must load and function with no network connection after first load (except CDN assets) |
| NFR-02 | UI must be responsive: functional on screens from 320 px to 2560 px wide |
| NFR-03 | No build tools required — pure HTML/CSS/JS; open index.html directly in a browser |
| NFR-04 | Task operations (add, edit, delete, complete) must feel instant (< 100 ms perceived latency) |
| NFR-05 | No user data leaves the browser — zero server calls from application code |
| NFR-06 | Countdown timer must be accurate to within ±1 second |
| NFR-07 | Application must not throw unhandled JavaScript errors under normal use |
| NFR-08 | Data model designed so a REST API backend can replace localStorage with minimal refactoring |
| NFR-09 | WCAG 2.1 AA colour contrast ratios maintained throughout |
| NFR-10 | All interactive elements accessible via keyboard (Tab, Enter, Escape, arrow keys where appropriate) |

---

## 7. UI Requirements

### Layout
- Sidebar navigation (collapsible on mobile): Dashboard, Tasks, Schedule, Completed, Settings
- Header: app logo/title, current date, global search bar, notification bell, theme toggle (light/dark)
- Main content area adapts to selected page

### Styling
- Design system: CSS custom properties (variables) for colours, spacing, typography
- Dark/light theme toggle; default dark
- Colour-coded priorities: Low = green, Medium = amber, High = red
- Status badges: pending (blue), completed (green), overdue (red)
- Smooth transitions on sidebar collapse, modal open/close, card hover

### Components
- Task card: title, priority badge, category chip, due date, countdown, action buttons
- Modal: add/edit task form with validation messages
- Confirmation dialog for destructive actions
- Toast notification for in-app reminders and success/error feedback
- Progress bar for completion percentage
- Charts: weekly bar + category doughnut (Chart.js)

### Responsive Breakpoints
- Mobile: < 640 px — sidebar becomes bottom nav or hamburger drawer
- Tablet: 640 px – 1024 px — sidebar collapsible, 2-column card grid
- Desktop: > 1024 px — full sidebar visible, 3-column card grid

---

## 8. Data Model

### Task Object
```json
{
  "id":          "string (UUID v4)",
  "title":       "string (required, 1–200 chars)",
  "description": "string (optional, max 1000 chars)",
  "priority":    "Low | Medium | High",
  "category":    "string (optional, max 50 chars)",
  "dueDate":     "string (YYYY-MM-DD) | null",
  "dueTime":     "string (HH:MM, 24-hour) | null",
  "status":      "pending | completed | overdue",
  "createdAt":   "ISO 8601 datetime string",
  "updatedAt":   "ISO 8601 datetime string",
  "completedAt": "ISO 8601 datetime string | null"
}
```

### localStorage Schema
```
Key:   "taskflow_tasks"
Value: JSON array of Task objects
```

### Settings Object (localStorage key: "taskflow_settings")
```json
{
  "theme":               "dark | light",
  "notificationsEnabled": "boolean",
  "defaultPriority":     "Low | Medium | High"
}
```

### Future Backend Compatibility
- Each task has a UUID `id` suitable as a primary key
- `createdAt` / `updatedAt` / `completedAt` ISO timestamps map cleanly to database columns
- Storage layer abstracted via a `StorageService` module — swap localStorage for fetch() calls without changing task logic

---

## 9. Validation Rules

| Field | Rule |
|-------|------|
| title | Required; 1–200 characters; must not be only whitespace |
| description | Optional; max 1000 characters |
| priority | Required; must be one of: Low, Medium, High |
| category | Optional; max 50 characters; alphanumeric + spaces + hyphens |
| dueDate | Optional; if provided must be valid calendar date (YYYY-MM-DD) |
| dueTime | Optional; only valid if dueDate is also provided; must be valid 24-hour HH:MM |
| status | Derived field; not directly editable by user |

**Cross-field rules:**
- dueTime cannot be set without dueDate
- A task with dueDate in the past can be created/edited (user may be logging historical items) — system shows warning but allows save

**Error display:**
- Inline error messages below each invalid field
- Form submit button disabled until all required fields pass validation
- Toast notification on successful save/delete

---

## 10. Acceptance Criteria

| ID | Given | When | Then |
|----|-------|------|------|
| AC-01 | App is open | User fills required fields and clicks "Save Task" | Task appears in the task list immediately; persists after refresh |
| AC-02 | Task exists | User clicks Edit, changes title, saves | Task card updates with new title; updatedAt refreshed |
| AC-03 | Task exists | User clicks Delete and confirms | Task removed from list and localStorage |
| AC-04 | Task exists | User clicks complete toggle | Task moves to completed state; completedAt recorded |
| AC-05 | Completed task exists | User clicks reopen | Task returns to pending; completedAt cleared |
| AC-06 | Task has future due date+time | Timer ticks every second | Countdown shows correct d/h/m/s |
| AC-07 | Task due date+time has passed | Countdown reaches zero | "Overdue" badge shown; no negative values |
| AC-08 | Browser notifications granted | Task is 1 hour from deadline | Browser notification fires |
| AC-09 | Browser notifications denied | Task is 1 hour from deadline | In-app toast reminder shown |
| AC-10 | Schedule week view open | Tasks with due dates exist | Tasks appear in correct day columns |
| AC-11 | Dashboard open | Tasks exist | All stat cards show correct computed values |
| AC-12 | User types in search box | Matching tasks exist | Only matching tasks shown in real time |
| AC-13 | User applies priority filter | Tasks of mixed priorities exist | Only matching-priority tasks shown |
| AC-14 | User refreshes browser | Tasks were previously saved | All tasks reload correctly from localStorage |
| AC-15 | App opens on 375px wide screen | All pages visited | No horizontal scroll; all controls usable |

---

*Specification created: 2026-10-05*
*Version: 1.0*
*Author: Kiro (AI development partner)*
