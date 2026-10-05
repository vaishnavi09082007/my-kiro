---
inclusion: always
---

# TaskFlow – Security Rules

## Data Privacy

- All task data stays in the user's browser — zero server calls from application code
- Never send task data, user identifiers, or any PII to external services
- No analytics, telemetry, or tracking scripts beyond what Kiro University hooks already provide
- No third-party scripts except Chart.js from a reputable CDN (cdnjs or jsdelivr)

## Input Handling

- Sanitise all user input before inserting into the DOM
- Never use `innerHTML` with unsanitised user content — use `textContent` or create DOM nodes
- If `innerHTML` is unavoidable, escape HTML entities first:
  ```js
  const escapeHtml = (str) =>
    String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  ```
- Validate all inputs against the schema before saving (see data-model.md)
- Enforce field length limits to prevent localStorage bloat/DoS

## localStorage Security

- localStorage is not encrypted — do not store passwords, tokens, or sensitive PII
- Task titles and descriptions are user-controlled personal notes — acceptable for localStorage
- Always wrap localStorage reads in try/catch — storage can be disabled or full
- On corrupt/invalid JSON, reset gracefully to empty array — do not expose raw errors to the UI

## Notification Permissions

- Never request notification permission without a clear user action (button click)
- Do not repeatedly re-prompt after user denies
- Store `notificationsEnabled` in settings only after explicit grant

## Dependency Rules

- No npm packages installed for the browser app (no supply chain risk)
- CDN scripts loaded with `crossorigin="anonymous"` where possible
- Pin CDN URLs to specific versions, not `@latest`:
  ```html
  <!-- Good -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js"></script>
  <!-- Bad -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js@latest/..."></script>
  ```
- Review any new CDN dependency before adding it

## Secrets & Credentials

- No API keys, tokens, passwords, or credentials in any source file
- No `.env` files committed (covered in `.gitignore`)
- If future backend integration requires API keys, use environment variables server-side only — never expose in client-side JS

## Content Security

- No `eval()`, `new Function()`, or dynamic script injection
- No `document.write()`
- Event listeners attached via `addEventListener` — no inline `onclick` attributes in dynamically generated HTML
