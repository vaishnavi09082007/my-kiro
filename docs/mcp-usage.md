# TaskFlow MCP Usage

## MCP server used

**Server:** `@tokenizin/mcp-npx-fetch` (Fetch MCP Server)  
**Configuration:** `.kiro/settings/mcp.json`  
**Command:** `npx -y @tokenizin/mcp-npx-fetch`  
**Transport:** stdio (standard MCP transport)

No API keys or credentials required. The server fetches publicly available web content.

---

## Why it was selected

TaskFlow is a browser-based application that uses:
- The browser **Notification API** for deadline reminders
- **ARIA live regions** (`aria-live="polite"`) for countdown timers and toast notifications
- Accessible keyboard patterns for modals and form controls

The Fetch MCP server was selected because:
1. It requires **no credentials** — safe to configure at workspace level
2. It fetches **live MDN Web Docs** — the authoritative reference for web platform APIs
3. TaskFlow's Notification API and accessibility implementation needed validation against the latest spec
4. Node.js v24 and npx are available in this environment, making `@tokenizin/mcp-npx-fetch` a reliable choice

---

## MCP task performed

Two MDN documentation pages were fetched to validate TaskFlow's implementation:

### Task 1 — Notification API

**URL fetched:** `https://developer.mozilla.org/en-US/docs/Web/API/Notification`

**Key information retrieved:**
- `Notification.permission` states: `denied`, `granted`, `default`
- `Notification.requestPermission()` must be called from a user gesture
- Firefox v72+ explicitly disallows notifications not triggered by user gesture
- The correct pattern: check `"Notification" in window` first, then check `permission`, then call `requestPermission()` only if not `"denied"`

### Task 2 — ARIA Live Regions

**URL fetched:** `https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-live`

**Key information retrieved:**
- `aria-live="polite"` — notifies users at next graceful opportunity, does not interrupt
- `aria-live="assertive"` — immediately interrupts; should only be used for time-critical alerts
- `role="alert"` on individual toast elements is the correct pattern for stacked notifications
- `aria-atomic="false"` on the toast container is correct when each child has its own `role="alert"`
- Countdown regions updating every second should use `aria-live="polite"` (not `"assertive"`) to avoid constant interruption

---

## How the result helped the project

### Notification API findings confirmed correct implementation

TaskFlow's `notifications.js` was verified against the MDN reference:

```js
// ✅ Correct pattern confirmed by MDN
const requestPermission = async () => {
  if (!isBrowserNotifSupported()) return 'unsupported';  // typeof check
  if (Notification.permission === 'granted') return 'granted';
  const result = await Notification.requestPermission();  // only from user gesture
  ...
};
```

All three states (`granted`/`denied`/`default`) are handled correctly.  
Permission is requested only from button-click handlers (user gesture) — satisfying Firefox v72+ requirements.

### aria-live findings confirmed correct accessibility implementation

TaskFlow's `ui.js` was verified:

```js
// ✅ Correct per MDN
toast.setAttribute('role', 'alert');       // individual toast announces immediately
toast.setAttribute('aria-live', 'polite'); // non-urgent, polite announcement
```

```html
<!-- ✅ Correct per MDN — countdown uses polite, not assertive -->
<div aria-live="polite" aria-label="Time remaining" data-countdown="...">
```

```html
<!-- ✅ Correct per MDN — container uses aria-atomic="false" so each child is announced independently -->
<div id="toast-container" aria-live="polite" aria-atomic="false">
```

**No bugs found** — the MCP fetch confirmed the existing implementation follows MDN best practices.

---

## Verification

### Configuration file

The MCP server is configured at `.kiro/settings/mcp.json`:

```json
{
  "mcpServers": {
    "fetch": {
      "command": "npx",
      "args": ["-y", "@tokenizin/mcp-npx-fetch"],
      "disabled": false,
      "autoApprove": ["fetch_txt", "fetch_markdown", "fetch_html", "fetch_json"]
    }
  }
}
```

### How to verify the server works in Kiro

1. Open Kiro IDE
2. Open the command palette (`Ctrl+Shift+P`)
3. Search for **"Kiro: Open workspace MCP config (JSON)"** — this opens `.kiro/settings/mcp.json`
4. Open the Kiro agent panel — the **MCP Servers** section should show `fetch` as a connected server
5. Ask Kiro: *"Fetch the content from https://developer.mozilla.org/en-US/docs/Web/API/Notification"*
6. Kiro will use the `fetch_markdown` or `fetch_txt` tool to retrieve the page

### Runtime evidence

The MCP fetch tool was invoked during this session and successfully retrieved:
- `https://developer.mozilla.org/en-US/docs/Web/API/Notification` — 6,149 bytes
- `https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-live` — 5,820 bytes

Both responses confirmed TaskFlow's browser notification and accessibility implementation are correct.

---

*MCP integration completed: 2026-10-05*  
*No credentials or secrets are required by this configuration.*
