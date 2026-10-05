---
inclusion: always
---

# TaskFlow – UI Conventions

## Design Tokens (CSS Custom Properties)

All visual values live in `css/main.css` under `:root`. Never hardcode colours or spacing in component CSS.

### Colour Palette (Dark Theme Default)
```css
--color-bg-primary:    #0f1117;   /* main background */
--color-bg-secondary:  #1a1d27;   /* sidebar, cards */
--color-bg-tertiary:   #252836;   /* inputs, hover states */
--color-border:        #2e3147;
--color-text-primary:  #e8eaf0;
--color-text-secondary:#9ca3af;
--color-text-muted:    #6b7280;
--color-accent:        #6366f1;   /* indigo — primary action */
--color-accent-hover:  #4f52d6;
--color-success:       #22c55e;   /* completed / low priority */
--color-warning:       #f59e0b;   /* medium priority */
--color-danger:        #ef4444;   /* high priority / overdue */
--color-info:          #3b82f6;   /* pending badge */
```

### Spacing Scale
```css
--space-1: 4px;   --space-2: 8px;   --space-3: 12px;
--space-4: 16px;  --space-5: 20px;  --space-6: 24px;
--space-8: 32px;  --space-10: 40px; --space-12: 48px;
```

### Typography
```css
--font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-size-xs:   11px;  --font-size-sm: 13px;
--font-size-base: 15px;  --font-size-md: 17px;
--font-size-lg:   20px;  --font-size-xl: 24px;
--font-size-2xl:  30px;
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
--line-height-base: 1.5;
--line-height-tight: 1.25;
```

### Radius & Shadow
```css
--radius-sm: 6px;   --radius-md: 10px;
--radius-lg: 16px;  --radius-full: 9999px;
--shadow-sm: 0 1px 3px rgba(0,0,0,0.3);
--shadow-md: 0 4px 12px rgba(0,0,0,0.4);
--shadow-lg: 0 8px 24px rgba(0,0,0,0.5);
```

## Priority Colours

| Priority | Background | Text | CSS modifier class |
|----------|-----------|------|--------------------|
| Low | `--color-success` (10% opacity bg) | `--color-success` | `.priority-badge--low` |
| Medium | `--color-warning` (10% opacity bg) | `--color-warning` | `.priority-badge--medium` |
| High | `--color-danger` (10% opacity bg) | `--color-danger` | `.priority-badge--high` |

## Status Badges

| Status | Colour | Class |
|--------|--------|-------|
| Pending | `--color-info` | `.status-badge--pending` |
| Completed | `--color-success` | `.status-badge--completed` |
| Overdue | `--color-danger` | `.status-badge--overdue` |

## Component Patterns

### Buttons
- Primary: filled accent background, white text — `.btn--primary`
- Secondary: outlined, accent border — `.btn--secondary`
- Danger: outlined red — `.btn--danger`
- Icon-only: square, transparent, `aria-label` required — `.btn--icon`
- Minimum tap target: 44×44 px (mobile)

### Task Card
- Border-left accent coloured by priority
- Shows: title, priority badge, category chip, due date, countdown
- Action row: complete toggle, edit button, delete button
- Overdue card: red left border + subtle red background tint + "Overdue" badge

### Modal
- Overlay: `rgba(0,0,0,0.6)` backdrop
- Panel: `--color-bg-secondary`, `--radius-lg`, `--shadow-lg`
- Focus trapped inside while open
- Close on Escape key or overlay click
- Title in heading tag (`<h2>`)

### Form Controls
- Label above input, not placeholder-only
- Error message: `--color-danger`, displayed below field with `role="alert"`
- Required fields marked with `*` in label
- Input focus ring: `2px solid --color-accent`

### Toast Notifications
- Bottom-right corner, stack vertically
- Auto-dismiss after 4 seconds
- Types: success (green), error (red), warning (amber), info (blue)
- Dismiss button (`×`) with `aria-label="Dismiss notification"`

### Empty States
- Centred illustration (CSS-drawn or emoji) + heading + helper text
- Action button if relevant (e.g. "Add your first task")

### Progress Bar
- Height: 8px, `--radius-full`
- Background: `--color-bg-tertiary`
- Fill: `--color-accent` → `--color-success` as percentage increases

## Animation Guidelines
- Modal: fade + scale in (200ms ease-out)
- Toast: slide in from right (200ms), fade out (300ms)
- Card hover: subtle translateY(-2px) + shadow increase (150ms)
- All wrapped in `@media (prefers-reduced-motion: no-preference)`

## Light Theme
- Override all `--color-*` variables via `[data-theme="light"]` on `<html>`
- Light background: `#f8fafc`, cards: `#ffffff`, text: `#111827`
- Toggle stored in `taskflow_settings.theme`

## Responsive Layout Rules
- **< 640px (mobile):** sidebar hidden; hamburger button reveals drawer; single-column cards
- **640–1024px (tablet):** sidebar collapsible (icon-only when collapsed); 2-column card grid
- **> 1024px (desktop):** sidebar always visible (240px wide); 3-column card grid
- Schedule week view collapses to day view on < 768px
