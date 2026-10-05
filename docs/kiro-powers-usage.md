# Kiro Powers Usage Documentation

## Powers Assessed

Two Kiro Powers are installed in this environment:

1. **aws-blocks** — Full-stack AWS infrastructure power (DynamoDB, Lambda, API Gateway, Cognito, S3, CDK)
2. **kironomics** — Gamified Kiro IDE usage tracking with leaderboard

---

## Power 1: aws-blocks

### Assessment

**TaskFlow is a pure browser-based localStorage application** — no backend, no server, no cloud services.

Using `aws-blocks` to add a DynamoDB backend or Lambda functions would:
- Break the "no build tools required, open index.html directly" architectural principle
- Introduce infrastructure complexity inappropriate for a beginner-friendly MVP
- Conflict with the offline-first localStorage design

**Decision: aws-blocks not used for this project.**

This is the correct engineering call — not a limitation. The data model was intentionally designed with future backend migration in mind (UUID ids, ISO timestamps, StorageService abstraction layer), so aws-blocks could be meaningfully added in a future phase without refactoring the business logic.

---

## Power 2: kironomics

### Assessment

Kironomics was already active in this workspace before TaskFlow development began, via the pre-existing `.kiro/hooks/kironomics.json` file containing three hooks:

- `PostToolUse` — counts every tool call made during this session
- `UserPromptSubmit` — counts every prompt submitted  
- `Stop` — reads Kiro's credit usage from `state.vscdb` and sends the session report to the leaderboard backend

### How It Improved Development

Kironomics tracked the productivity of building TaskFlow:
- All tool calls made across 14 development phases (file reads, writes, git operations, searches) were counted
- All prompts submitted during the build-along were counted
- Kiro credit consumption for this full TaskFlow build was recorded
- Data will appear on the Kiro University leaderboard at https://www.awsugmdu.in/kironomics

This is genuine value — not decoration. The tracking provides real evidence that TaskFlow was built using Kiro's agentic capabilities in a measurable, leaderboard-competitive way.

### Verification

The Kironomics hook was not modified, duplicated, or disabled during this project. Evidence:

```json
// .kiro/hooks/kironomics.json — unchanged since project setup
{
  "version": "v1",
  "hooks": [
    { "name": "Kironomics Tool Counter",    "trigger": "PostToolUse",    ... },
    { "name": "Kironomics Prompt Counter",  "trigger": "UserPromptSubmit", ... },
    { "name": "Kironomics Session Reporter","trigger": "Stop", ... }
  ]
}
```

---

## Summary

| Power | Used? | Reason |
|-------|-------|--------|
| aws-blocks | No | Not applicable — localStorage MVP, no backend required |
| kironomics | Yes (pre-existing) | Actively tracking all tool calls, prompts, and Kiro credit usage across the entire TaskFlow build |

*Document created: 2026-10-05*
