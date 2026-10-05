---
inclusion: always
---

# TaskFlow – Git & Commit Conventions

## Branch Strategy

- All development on `master` branch (matches existing repo setup)
- Feature branches only if collaborating: `feature/<short-description>`
- Never force-push to `master`

## Commit Message Format

Follow Conventional Commits:

```
<type>: <short description (≤72 chars, imperative mood)>

[optional body — what and why, not how]
```

### Types

| Type | When to use |
|------|------------|
| `feat` | New user-facing feature |
| `fix` | Bug fix |
| `docs` | Documentation, spec, steering files only |
| `style` | CSS/formatting changes — no logic change |
| `refactor` | Code restructuring — no feature/fix change |
| `test` | Adding or updating tests |
| `chore` | Build, config, tooling, hooks, CI |
| `perf` | Performance improvement |

### Examples

```
feat: add task countdown timer with overdue detection
fix: prevent negative countdown values after deadline passes
docs: add TaskFlow product specification
test: add sorting and filtering unit tests
chore: add PostFileSave hook for HTML validation
style: improve mobile card layout spacing
```

## What to Commit

✅ Always commit:
- Application source files (`index.html`, `css/`, `js/`)
- Test files (`tests/`)
- Documentation (`.kiro/specs/`, `.kiro/steering/`)
- `.gitignore`
- `README.md`
- `.kiro/hooks/*.json` (University hooks — always tracked)
- `.kiro/ugmdu.json` (University manifest — always tracked)
- `.kiro/agents/` (custom agents)

❌ Never commit:
- `.env` files or any file containing secrets/tokens/credentials
- `node_modules/`
- Build output (`dist/`, `build/`)
- OS files (`.DS_Store`, `Thumbs.db`)
- Editor files (`.vscode/settings.json` with personal settings)
- Temporary or generated files

## Phase Commit Checklist

Before each phase commit:
1. `git status` — confirm only intended files are staged
2. `git diff --staged` — review every change
3. Ensure no secrets, tokens, or credentials are present
4. Run relevant tests/checks
5. Commit with conventional message
6. `git push origin master`

## Commit Frequency

- One commit per phase minimum
- Additional commits allowed for significant sub-features within a phase
- Never commit broken/non-functional code to master
- Working tree must be clean at end of each phase
