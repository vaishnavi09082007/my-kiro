---
inclusion: always
---

# TaskFlow – Accessibility Rules

## Standard

Target: **WCAG 2.1 Level AA** throughout.

Full validation requires manual testing with assistive technologies and expert accessibility review. These rules cover the minimum required in code.

## Colour Contrast

- Normal text (< 18pt / < 14pt bold): minimum 4.5:1 contrast ratio against background
- Large text (≥ 18pt / ≥ 14pt bold): minimum 3:1
- UI components and focus indicators: minimum 3:1
- Never convey information by colour alone — always pair with text, icon, or pattern
  - Priority: colour badge AND text label ("High", not just red)
  - Overdue: red styling AND "Overdue" text badge

## Semantic HTML

- Page structure: `<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>`
- Headings in logical order: one `<h1>` per page, `<h2>` for sections, `<h3>` for subsections
- Lists of tasks use `<ul>` / `<li>`
- Data tables (if any) use `<th scope="col/row">` and `<caption>`
- Forms use `<fieldset>` + `<legend>` for groups of related inputs

## Forms

- Every input has a visible `<label>` connected via matching `for`/`id`
- Required fields: add `required` attribute AND mark label with `*`
- Error messages: `role="alert"` so screen readers announce them immediately
- Validation summary at top of form when multiple errors exist
- `aria-describedby` on inputs that have associated helper text
- Disabled state: use `disabled` attribute, not just visual styling

## Keyboard Navigation

- All interactive elements reachable via Tab in logical DOM order
- Focus indicator visible at all times — never `outline: none` without a styled replacement
- Modal dialogs:
  - Focus moves to modal on open (first focusable element or heading)
  - Tab cycles within modal only (focus trap)
  - Escape closes modal and returns focus to trigger element
- Dropdown / filter menus: arrow keys navigate options, Enter selects, Escape closes
- Task cards: all action buttons (complete, edit, delete) keyboard accessible

## ARIA

- Use native HTML semantics first; ARIA only when native element is insufficient
- `aria-label` on icon-only buttons: `<button aria-label="Delete task: Buy groceries">`
- `aria-expanded` on toggles (sidebar collapse, accordion)
- `aria-current="page"` on active nav link
- `aria-live="polite"` on regions that update dynamically (countdown, toast container)
- `aria-hidden="true"` on decorative icons/SVGs
- Modal: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to modal title

## Images & Icons

- Decorative icons: `aria-hidden="true"`
- Informative icons (used without adjacent text): `aria-label` on the button/link parent
- No `<img>` tags without `alt` attribute

## Motion

- Wrap all CSS transitions and animations in:
  ```css
  @media (prefers-reduced-motion: no-preference) {
    /* transitions here */
  }
  ```
- Countdown timer: DOM text updates only — no flashing or rapid animation

## Touch Targets

- Minimum 44×44 CSS pixels for all interactive elements on mobile
- Adequate spacing between adjacent tap targets (≥ 8px gap)

## Screen Reader Testing Checklist (manual, pre-release)

- [ ] Navigate app using keyboard only — all features reachable
- [ ] Task list announced correctly by screen reader
- [ ] Modal opens, traps focus, and closes correctly
- [ ] Form errors announced on submission
- [ ] Countdown region updates announced (not too frequently — `aria-live="polite"`)
- [ ] Toast notifications announced
- [ ] Theme toggle works without mouse
