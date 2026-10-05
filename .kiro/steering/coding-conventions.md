---
inclusion: always
---

# TaskFlow – Coding Conventions

## JavaScript

### Style
- ES6+ syntax throughout: `const`/`let`, arrow functions, template literals, destructuring, spread, optional chaining
- Never use `var`
- Use `async/await` over raw Promise chains
- Semicolons required
- Single quotes for strings; template literals when interpolating
- 2-space indentation

### Naming
| Type | Convention | Example |
|------|-----------|---------|
| Variables / functions | camelCase | `filterTasks`, `dueDate` |
| Constants (module-level) | UPPER_SNAKE_CASE | `STORAGE_KEY`, `PRIORITY_LEVELS` |
| CSS classes (from JS) | kebab-case | `task-card`, `priority-high` |
| DOM element variables | prefix `el` | `elModal`, `elTaskList` |
| Boolean variables | prefix `is`/`has`/`can` | `isOverdue`, `hasNotification` |

### Functions
- Each function does one thing
- Pure functions (no side effects) preferred in `tasks.js` and `utils.js`
- Maximum 30 lines per function; extract helpers if longer
- Always handle edge cases: null/undefined input, empty arrays, invalid dates

### Error Handling
- Wrap all localStorage operations in try/catch
- Wrap all date parsing in try/catch
- Never swallow errors silently — log with `console.warn` at minimum
- Show user-facing error as a toast, not an alert()

### Comments
- JSDoc comments on all exported functions:
  ```js
  /**
   * Calculates time remaining until a task deadline.
   * @param {string} dueDate - YYYY-MM-DD
   * @param {string} dueTime - HH:MM (24-hour), optional
   * @returns {{ days, hours, minutes, seconds, overdue: boolean }}
   */
  ```
- Inline comments only for non-obvious logic
- No TODO comments in committed code — use GitHub Issues instead

## HTML

- Semantic elements: `<main>`, `<nav>`, `<section>`, `<article>`, `<header>`, `<footer>`, `<aside>`
- Every form input has a matching `<label>` via `for`/`id`
- `aria-label` on icon-only buttons
- `role` attributes only where native semantics are insufficient
- No inline styles — all styling via CSS classes

## CSS

- All colours, spacing, font sizes defined as CSS custom properties in `:root`
- BEM-inspired naming: `.block`, `.block__element`, `.block--modifier`
- Mobile-first: base styles for mobile, `@media (min-width: ...)` for larger screens
- No `!important` except in utility overrides
- Transitions defined with `prefers-reduced-motion` fallback:
  ```css
  @media (prefers-reduced-motion: no-preference) {
    .modal { transition: opacity 0.2s ease; }
  }
  ```

## File Organisation
- One responsibility per file (see architecture.md)
- No file should exceed 400 lines; split if larger
- Import/dependency order: utilities → storage → business logic → UI
