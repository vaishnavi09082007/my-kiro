# TaskFlow QA Agent

## Overview

The TaskFlow QA Agent (`taskflow-qa`) is a custom Kiro agent that performs thorough, independent code quality audits of the TaskFlow project. It is not decorative — it reads every source file, applies strict checks, and produces a structured report with actionable findings.

## Location

`.kiro/agents/taskflow-qa.md`

## How to Invoke

In the Kiro IDE:
1. Open the Kiro agent panel
2. Select **TaskFlow QA Agent** from the agent list (name: `taskflow-qa`)
3. Ask it to run: `"Run a full QA audit of the TaskFlow codebase"`

Or in chat, mention the agent by name: `@taskflow-qa run the audit`

## What It Checks

The agent performs 7 sequential audit steps:

### 1. Bug & Logic Review
- Off-by-one errors in countdown arithmetic
- Timezone pitfalls in date parsing
- Overdue detection edge cases
- Status lifecycle correctness (completedAt, updatedAt)
- Immutability — no direct task mutation
- Filter/sort/search pipeline correctness
- Completion percentage divide-by-zero protection
- validateTask() boundary conditions and cross-field rules

### 2. Storage Review
- All localStorage calls wrapped in try/catch
- Graceful handling of corrupt JSON
- Migration function applied to loaded tasks
- No sensitive data in storage
- Correct storage key names

### 3. Security / XSS Review
- innerHTML with unsanitised user content
- eval(), document.write(), dynamic script injection
- Inline onclick attributes in generated HTML
- escapeHtml() implementation correctness

### 4. Accessibility Review
- All inputs have connected labels
- Required fields marked with `required` attribute and `*` in label
- Error messages use role="alert"
- Icon-only buttons have aria-label
- Modal focus trapping (Tab cycles within modal, Escape closes)
- aria-live on countdown and toast regions
- aria-current on active nav link
- aria-expanded on collapse toggles
- Heading hierarchy

### 5. Dashboard Calculations Review
- All stats computed from live task data — no hardcoded values
- Today's tasks use local date comparison
- Division-by-zero on empty task list

### 6. Missing Test Coverage
Cross-references tests/taskflow.test.js against the required coverage matrix from the testing steering file

## Output Format

The agent produces a structured report:

```
══════════════════════════════════════════════════════
  TASKFLOW QA REPORT
══════════════════════════════════════════════════════

── BUGS FOUND ─────────────────────────────────────────
── ACCESSIBILITY ISSUES ───────────────────────────────
── SECURITY CONCERNS ──────────────────────────────────
── MISSING TEST COVERAGE ──────────────────────────────
── OVERALL VERDICT ────────────────────────────────────
  Status: Ready | Needs Work | Critical Issues
  Rationale: ...
══════════════════════════════════════════════════════
```

## Verdict Levels

| Verdict | Meaning |
|---------|---------|
| **Ready** | All sections read "None found." or only trivial style nits |
| **Needs Work** | Real but non-critical issues — missing tests, minor a11y gaps |
| **Critical Issues** | XSS vulnerabilities, data-loss bugs, security holes, broken core functionality |

## Example Usage

```
# Full audit
@taskflow-qa Run a complete QA audit

# Focused audit
@taskflow-qa Check only the accessibility of index.html
@taskflow-qa Review the countdown calculation logic in countdown.js for off-by-one errors
@taskflow-qa Check if the dashboard stats have any hardcoded values
```

## Agent Permissions

The agent has **read-only** access (`tools: ["read"]`). It cannot modify files — it only reports findings. You fix the issues; the agent flags them.
