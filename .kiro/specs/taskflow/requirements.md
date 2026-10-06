# TaskFlow Requirements

## Problem Statement

Busy individuals struggle to track tasks, deadlines, and daily/weekly schedules in a single unified view. Existing tools are either too complex (project management suites) or too simple (plain to-do lists). People miss deadlines because there is no real-time countdown, no visual schedule, and no at-a-glance productivity picture.

## Target Users

- Students managing assignment deadlines and study schedules
- Freelancers tracking client deliverables
- Professionals organising daily work tasks
- Anyone who wants a simple, offline-capable task planner without installing desktop software

---

## Task Management

### Create Task

WHEN a user fills in the task title and clicks Save Task
THE SYSTEM SHALL create a new task with a UUID, createdAt timestamp, and status "pending"

WHEN a user submits an empty or whitespace-only title
THE SYSTEM SHALL display an inline error and prevent saving

WHEN a user submits a title longer than 200 characters
THE SYSTEM SHALL display a validation error stating the limit

WHEN a user sets a due time without a due date
THE SYSTEM SHALL display a validation error requiring a due date

WHEN a user saves a valid task
THE SYSTEM SHALL immediately render the task in the task list without a page reload

### Edit Task

WHEN a user clicks the edit button on a task
THE SYSTEM SHALL open the modal pre-filled with all existing task field values

WHEN a user saves an edited task
THE SYSTEM SHALL update the task in localStorage and refresh the task card immediately

WHEN a user edits a task's due date or due time
THE SYSTEM SHALL clear the reminder notification cache for that task

### Delete Task

WHEN a user clicks Delete on a task
THE SYSTEM SHALL show a confirmation dialog before removing

WHEN a user confirms deletion
THE SYSTEM SHALL remove the task from localStorage and the UI immediately

WHEN a user cancels the deletion dialog
THE SYSTEM SHALL leave the task unchanged

### Complete and Reopen

WHEN a user clicks the complete toggle on a pending task
THE SYSTEM SHALL set status to "completed", record completedAt, and visually distinguish the task

WHEN a user clicks the reopen toggle on a completed task
THE SYSTEM SHALL set status to "pending" and clear completedAt

WHEN a task is completed
THE SYSTEM SHALL stop displaying a countdown timer for that task

### Search

WHEN a user types in the search box
THE SYSTEM SHALL filter the task list in real time to show only tasks whose title or description contains the query (case-insensitive)

WHEN the search box is cleared
THE SYSTEM SHALL restore the full task list according to active filters

### Filter

WHEN a user selects a status filter (pending / completed / overdue / all)
THE SYSTEM SHALL display only tasks matching that status

WHEN a user selects a priority filter (Low / Medium / High / all)
THE SYSTEM SHALL display only tasks matching that priority

WHEN a user selects a category filter
THE SYSTEM SHALL display only tasks in that category

### Sort

WHEN a user selects a sort option (due date, priority, title, created date)
THE SYSTEM SHALL re-order the task list accordingly

WHEN a user selects ascending or descending direction
THE SYSTEM SHALL re-order tasks in the chosen direction

WHEN tasks are sorted by due date ascending
THE SYSTEM SHALL place tasks with no due date last

---

## Time Reminder and Countdown

### Countdown Display

WHEN a pending task has a future due date
THE SYSTEM SHALL display a live countdown showing days, hours, minutes, and seconds

WHEN a countdown reaches zero
THE SYSTEM SHALL immediately replace it with an "Overdue" indicator

WHEN the countdown is running
THE SYSTEM SHALL never show negative values

WHEN a task is marked complete
THE SYSTEM SHALL stop the countdown for that task

### Overdue State

WHEN the current time exceeds a task's deadline and the task is pending
THE SYSTEM SHALL visually distinguish the task card with overdue styling

WHEN the current time exceeds a task's deadline
THE SYSTEM SHALL show "Overdue" text instead of a countdown

### Reminders

WHEN a pending task is 24 hours from its deadline
THE SYSTEM SHALL fire an in-app reminder toast

WHEN a pending task is 1 hour from its deadline
THE SYSTEM SHALL fire an in-app reminder toast

WHEN a pending task is 10 minutes from its deadline
THE SYSTEM SHALL fire an urgent in-app reminder toast

WHEN the browser Notification API is available and permission is granted
THE SYSTEM SHALL also fire a browser notification at 24h, 1h, and 10m before deadline

WHEN browser notification permission is denied or unavailable
THE SYSTEM SHALL rely on in-app toasts only without throwing errors

---

## Schedule Planner

### Day View

WHEN the schedule planner is in day view
THE SYSTEM SHALL display all tasks whose due date matches the selected date

WHEN tasks exist for the selected date
THE SYSTEM SHALL sort them by due time ascending, placing all-day tasks last

WHEN no tasks exist for the selected date
THE SYSTEM SHALL display an empty state message

### Week View

WHEN the schedule planner is in week view
THE SYSTEM SHALL display a Monday-through-Sunday grid for the selected week

WHEN tasks exist on a day in the week
THE SYSTEM SHALL display them inside that day column, sorted by time

WHEN a day column has more than 4 tasks
THE SYSTEM SHALL show an overflow indicator linking to the day view

### Navigation

WHEN a user clicks the Previous button in day view
THE SYSTEM SHALL navigate to the previous day

WHEN a user clicks the Next button in day view
THE SYSTEM SHALL navigate to the next day

WHEN a user clicks the Previous button in week view
THE SYSTEM SHALL navigate to the previous week

WHEN a user clicks Today
THE SYSTEM SHALL navigate to today's date

### Create and Open From Planner

WHEN a user clicks the add button in a day slot
THE SYSTEM SHALL open the task modal with the due date pre-filled

WHEN a user clicks a task in the schedule planner
THE SYSTEM SHALL open the task edit modal for that task

---

## Dashboard

### Statistics Cards

WHEN the dashboard is rendered
THE SYSTEM SHALL display the total number of tasks

WHEN the dashboard is rendered
THE SYSTEM SHALL display the number of completed tasks

WHEN the dashboard is rendered
THE SYSTEM SHALL display the number of pending tasks

WHEN the dashboard is rendered
THE SYSTEM SHALL display the number of overdue tasks

WHEN the dashboard is rendered
THE SYSTEM SHALL display the number of high-priority pending tasks

WHEN the dashboard is rendered
THE SYSTEM SHALL display the number of tasks due today

### Progress and Lists

WHEN the dashboard is rendered
THE SYSTEM SHALL calculate and display the completion percentage

WHEN any task data changes
THE SYSTEM SHALL recalculate and update all dashboard statistics without a page reload

WHEN the dashboard is rendered
THE SYSTEM SHALL list today's tasks, upcoming tasks (next 7 days), and overdue tasks

WHEN the dashboard reminders panel is rendered
THE SYSTEM SHALL list tasks due within the next 24 hours

### Charts

WHEN the dashboard is rendered and Chart.js is available
THE SYSTEM SHALL display a weekly bar chart showing tasks created vs completed per day of the current week

WHEN the dashboard is rendered and Chart.js is available
THE SYSTEM SHALL display a category doughnut chart showing task distribution by category

WHEN Chart.js is not available (offline)
THE SYSTEM SHALL display a graceful fallback message instead of a broken chart

---

## Data Persistence

WHEN a user adds, edits, deletes, or toggles a task
THE SYSTEM SHALL immediately save the updated task array to localStorage key "taskflow_tasks"

WHEN the application loads
THE SYSTEM SHALL read tasks from localStorage and apply schema migration to handle missing fields

WHEN localStorage contains corrupt JSON
THE SYSTEM SHALL reset to an empty task list without throwing an unhandled error

---

## Responsiveness

WHEN the viewport width is below 640 px
THE SYSTEM SHALL hide the sidebar and show a hamburger menu button

WHEN the hamburger menu is tapped
THE SYSTEM SHALL slide in the sidebar as a drawer with a backdrop overlay

WHEN the viewport is between 640 px and 1024 px
THE SYSTEM SHALL show a collapsible sidebar and a 2-column task grid

WHEN the viewport exceeds 1024 px
THE SYSTEM SHALL show the full sidebar and a 3-column task grid

---

## Accessibility

WHEN any form input is rendered
THE SYSTEM SHALL associate a visible label with that input via for/id attributes

WHEN a modal is opened
THE SYSTEM SHALL move focus to the first focusable element and trap Tab focus within the modal

WHEN Escape is pressed while a modal is open
THE SYSTEM SHALL close the modal and return focus to the trigger element

WHEN a form validation error occurs
THE SYSTEM SHALL display the error message with role="alert" so screen readers announce it

WHEN an icon-only button is rendered
THE SYSTEM SHALL include a descriptive aria-label attribute
