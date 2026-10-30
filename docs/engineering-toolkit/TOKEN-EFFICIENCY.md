# HANSAN V3 — Token and Context Efficiency

## Context selection

- Read project rules (`.clinerules/`) and relevant task documentation first.
- Inspect the target feature and its direct dependencies before editing.
- Search for symbols and patterns before opening large files.
- Do not repeatedly read the same unchanged file.
- Do not load unrelated routes, modules, or historical reports.
- Use existing reports in `docs/engineering-toolkit/` instead of repeating completed audits.
- Read additional context only when new evidence requires it.

## Task boundaries

- One feature per task.
- Define scope and acceptance criteria before editing.
- Keep the diff focused.
- Avoid parallel agents for work that is sequential, trivial, or context-dependent.
- Do not delegate work that can be completed more cheaply and reliably by a deterministic local tool.

## Tool selection

- Prefer shell commands, repository search, existing lint scripts, and deterministic checks for objective questions.
- Use browser or visual inspection only when it materially improves verification.
- Use MCP services only when they offer capabilities unavailable locally and justify their cost.
- Avoid repeated research after relevant facts are established.

## Reporting

- Maintain concise phase summaries.
- Record changed files, tests, failures, unresolved decisions, and next steps.
- Keep detailed logs in files rather than repeatedly printing them into the agent conversation.
- Do not paste entire files or full command logs unless required to diagnose an issue.
- Never omit a critical error merely to save tokens.

## Token measurement

- Actual LLM token usage is NOT available through the current Cline configuration or provider telemetry. This limitation is stated explicitly; do not fabricate token metrics.
- Use measurable proxies: files read, duplicate reads, number of commands, changed-line count, validation duration, context size.
- Baseline proxies (HQ): 26 source files, 705 lines under `src/`. Large files to avoid reading: `package-lock.json` (226 KB), `tsconfig.tsbuildinfo` (84 KB).
- Do not claim a specific percentage reduction without comparable baseline and post-change measurements.
- Repeatable measurement method for future feature tasks:
  1. Count files read and lines read during the task.
  2. Count duplicate reads of the same file.
  3. Count commands run and validation duration.
  4. Count changed lines (insertions/deletions).
  5. Record these in the task report under `docs/engineering-toolkit/`.

## Prompt compression

- Remove duplicate instructions; keep frequently needed rules concise.
- Move specialized instructions into scoped reference files (already done: UI contract in `ui-ux-quality.md`).
- Avoid copying full documentation into every task prompt.
- Do not remove rules necessary for security, data integrity, or design consistency.

## Adopted tools and their cost

- Anti-Slop: adopted as concise rules only; full library (40 rules + 6 skills) not loaded by default.
- ais lop: on-demand via `npx`; not a dependency. Adds ~2-3s per scan.
- UI/UX Pro Max: not installed; optional manual install documented in `REPOSITORY-EVALUATION.md`.
- git-slop: deferred (Rust toolchain missing).
- better-web-ui: rejected for redistribution (license).
