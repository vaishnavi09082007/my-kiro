# TaskFlow – Smart Task Manager & Schedule Planner

A polished, responsive, single-page web application for managing tasks, tracking deadlines, and planning your week — with no build tools or sign-up required.

## Quick Start

Open `index.html` in any modern browser. No installation needed.

## Features

- **Task Management** — Add, edit, delete, complete tasks with priority, category, due date, and time
- **Live Countdown** — Real-time days/hours/minutes/seconds countdown to every deadline
- **Overdue Detection** — Tasks past their deadline are automatically flagged
- **Browser Reminders** — Optional browser notifications at 24h and 1h before deadline
- **Schedule Planner** — Day view and week view showing tasks by date/time
- **Productivity Dashboard** — Stats, charts, today's tasks, upcoming tasks, overdue list
- **Search, Filter & Sort** — Find and organise tasks instantly
- **Dark/Light Theme** — Toggle in Settings
- **Responsive** — Works on desktop, tablet, and mobile
- **Offline** — All data stays in your browser via localStorage

## Project Structure

```
index.html          — Application entry point
css/
  main.css          — Design tokens, reset, typography
  layout.css        — Sidebar, header, content area
  components.css    — Cards, modals, badges, forms, toasts
  responsive.css    — Media queries
js/
  utils.js          — Pure utilities (UUID, dates, formatters)
  storage.js        — localStorage I/O
  tasks.js          — Task business logic (CRUD, filter, sort)
  ui.js             — DOM rendering helpers
  countdown.js      — Countdown timer engine
  notifications.js  — Browser + in-app notifications
  schedule.js       — Schedule planner views
  dashboard.js      — Analytics + Chart.js charts
  app.js            — Application bootstrap, event wiring
tests/
  taskflow.test.js  — Unit tests for core logic
  index.html        — Test runner page
.kiro/
  specs/            — Product specification
  steering/         — Development guidelines
  hooks/            — Kiro hooks (University tracking)
  agents/           — Custom QA agent
```

## Technology

- HTML5, CSS3 (custom properties, flexbox, grid)
- Vanilla JavaScript ES6+ (no framework)
- [Chart.js 4.4.4](https://www.chartjs.org/) — dashboard charts
- localStorage — data persistence

## Running Tests

Open `tests/index.html` in a browser. Results appear in the page and browser console.

## Data

All tasks are stored in `localStorage` under key `taskflow_tasks`.
To reset, use Settings → Clear Data or open DevTools → Application → Local Storage.

## Kiro University

This project was built as part of [Kiro University](https://kiro.dev) using Kiro's spec-driven development, steering files, hooks, and custom agents.
