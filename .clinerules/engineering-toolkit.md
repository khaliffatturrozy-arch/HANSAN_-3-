# HANSAN V3 — Engineering Toolkit Rules

Project-local Cline rules. Read before implementation. Applies to all work in HEADQUARTER (HQ), POS, and STAFF.

## Context and scope

- Read project rules and relevant task docs first.
- Inspect the target feature and its direct dependencies before editing.
- Search symbols/patterns before opening large files; do not repeatedly read unchanged files.
- One feature per task. Define scope and acceptance criteria before editing. Keep the diff focused.
- Do not load unrelated routes, modules, or historical reports.

## Anti-Slop (adapted from miqdadbadjuber/anti-slop, MIT)

- Reuse existing components, tokens, utilities, and established patterns in `src/components/ui`, `src/lib`, `src/config`, `src/styles/tokens.css`, and `tailwind.config.ts`.
- Avoid duplicate components, unnecessary abstractions, speculative architecture, and dead code.
- Prefer localized changes; avoid broad rewrites when a localized change suffices.
- Avoid unnecessary dependencies.
- Do not suppress TypeScript, lint, or test errors without a justified, documented reason.
- Avoid unsafe casts, swallowed exceptions, fake integrations, placeholder business logic, and misleading success states.
- Keep accessibility, responsive behavior, semantic HTML, and loading/error/empty states in scope where relevant.
- Avoid generic AI UI patterns: gratuitous gradients, excessive cards, arbitrary spacing, inconsistent radii, decorative elements without purpose.
- Preserve existing visual decisions and accepted sections unless the task explicitly requires a change.
- Remove unused code introduced by the current task; do not touch unrelated user work.
- Explain meaningful trade-offs concisely.
- Validate changes before declaring a task complete.

## Deterministic quality checks

- HQ/POS/STAFF: run `npm run lint` and `npm run typecheck` from the project directory.
- POS: also run `npm run test`.
- Optional on-demand: `npx aislop@latest scan` from a project directory (read-only). Treat hardcoded-secret findings as heuristic; verify before acting. Do not run `aislop fix` or `aislop agent` without review.
- Never replace existing project validation with a less comprehensive check.
- Do not modify production code to make validation pass.

## Token and context efficiency

- Do not repeatedly read the same unchanged file.
- Use existing reports in `docs/engineering-toolkit/` instead of repeating completed audits.
- Read additional context only when new evidence requires it.
- Avoid parallel agents for sequential, trivial, or context-dependent work.
- Do not delegate work that a deterministic local tool can do more cheaply and reliably.
- Prefer shell commands, repository search, existing lint scripts, and deterministic checks for objective questions.
- Use browser/visual inspection only when it materially improves verification.
- Maintain concise phase summaries; keep detailed logs in files, not in the agent conversation.
- Do not paste entire files or full command logs unless required to diagnose an issue.
- Never omit a critical error to save tokens.

## Boundaries

- This task scope is engineering toolkit setup only unless the user explicitly starts a product feature.
- Do not modify application features, business logic, database schemas, migrations, authentication, or authorization.
- Do not deploy, push, commit, merge, reset, stash, or rewrite Git history.
- Do not modify files outside the workspace without documented installation requirements.
