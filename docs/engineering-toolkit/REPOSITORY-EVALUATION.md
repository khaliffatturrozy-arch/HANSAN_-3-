# HANSAN V3 — Repository Evaluation

Phase 1 candidate repository evaluation. License and compatibility findings based on actual inspection of public repositories and npm metadata.

## Comparison table

| Repository | Primary purpose | Verified compatibility | License status | Installation method | Runtime/context cost | Decision | Reason |
|---|---|---|---|---|---|---|---|
| miqdadbadjuber/anti-slop | Rulebook/skill that filters generic AI-generated UI, text, and code | Cline supported via native `.cline-plugin` (skills folder beside package.json); Cline also reads `.clinerules/skills` | MIT (verified via npm and GitHub) | `npx antislop-ai` interactive installer, or manual copy of rules/skills; core file works anywhere | Low if kept concise; full library is large (40 rules + 6 skills) | ADOPT (adapted) | MIT, active (v3.2.24, published recently), supports Cline directly. Adopted as concise project-local rules; full library not injected into every task. |
| nextlevelbuilder/ui-ux-pro-max-skill | Design intelligence skill (styles, palettes, typography, UX guidelines) | Cline NOT in official compatible agents list (Claude Code, AdaL). Cline skills dirs (`.cline/skills`, `.agents/skills`, `.clinerules/skills`) are technically compatible locations, but skill depends on Python 3 search scripts | MIT (verified) | `npx ui-ux-pro-max-cli init --ai <agent>` or manual copy; requires Python 3.x | Medium-High: large reference library + Python runtime | OPTIONAL (deferred full install) | Official Cline support unverified; Python available. Created a concise HANSAN UI/UX contract as the source of truth instead of importing the full library. Manual install remains documented if needed. |
| scanaislop/aislop | Deterministic code-quality checker (50+ rules, 10 languages, CLI/CI) | Compatible with JS/TS/Next.js stack; run via `npx aislop@latest scan` | MIT (verified) | Zero-config: `npx aislop@latest scan`; optional `.aislop/config.yml` | Medium: pulls Biome/oxlint/knip on demand; scan ~2-3s on this repo | ADOPT (on-demand) | Verified to run locally and produce actionable findings on HQ (73/100) and POS (75/100). Not added as a dependency; invoked on demand. False positives documented. |
| coreycoto/git-slop | Rust CLI that finds files costing too much context (token defragmenter) | Requires Rust/Cargo toolchain, which is not installed in this environment | MIT (verified) | Cargo install or prebuilt binary; none available here | High (Rust toolchain + compile) | DEFER | No Rust toolchain available; 5 stars/early stage. Token proxies measured manually instead. Re-evaluate when a prebuilt Windows binary is available. |
| aladicf/better-web-ui | Agent skill library for web frontend design | Generic skill layout (`.agents/skills`, `.claude/skills`, etc.); no Cline-specific installer | Custom better-web-ui license (MIT-based + source-availability and no-resale restrictions) | Manual copy from canonical `skills/` | Medium | REJECT (for redistribution) | License adds no-resale/source-availability restrictions; not suitable for a sellable product portfolio. Reviewed for ideas only; no content copied. |

## Detailed findings

### A. Anti-Slop
- Source: https://github.com/miqdadbadjuber/anti-slop (MIT, 7.5k stars, active).
- Supports Cline natively via `.cline-plugin/` (Cline picks up the `skills/` folder beside `package.json` by itself).
- Provides 40 rules in 3 tiers + 6 optional skills. Adopted as a concise, enforceable rule set in `.clinerules/`, not the full library, to control token cost.
- Decision: ADOPT (adapted). Full library kept out of default context; referenced by URL and rule numbers only.

### B. UI/UX Pro Max
- Source: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill (MIT, 142k stars).
- Official compatible agents list does not include Cline. Cline's skills directories could host it, but native support is not verified.
- Requires Python 3.x (available here) and a large reference library; CLI installer targets specific agents.
- Decision: OPTIONAL/DEFERRED. Created a concise HANSAN UI/UX contract instead. Manual install documented below.

### C. ais lop
- Source: https://github.com/scanaislop/aislop (MIT, 710 stars, active).
- Verified locally: `npx aislop@latest scan` runs on HQ (73/100, Needs Work) and POS (75/100, Healthy) in ~2-3s.
- Adds value beyond existing lint/typecheck: catches unused imports, duplicate imports, hardcoded-secret heuristic, dead-code hints.
- Limitations: hardcoded-secret findings are heuristic false positives on dev defaults; dependency audit skipped (npm not on PATH inside aislop spawn); knip skipped without config.
- Decision: ADOPT as on-demand check. Not added as dependency.

### D. git-slop
- Source: https://github.com/coreycoto/git-slop (MIT, 5 stars, very early).
- Rust/Cargo required; not installed. Deferred. Manual token proxies used instead.

### E. better-web-ui
- Source: https://github.com/aladicf/better-web-ui (custom license with no-resale restrictions).
- Reviewed for ideas only. No content copied or redistributed due to license restrictions and resale implications.

## Manual install notes (optional)

- Anti-Slop full library (optional): run `npx -y antislop-ai` from a project directory and select desired skills; or copy `skills/<name>/` into `.clinerules/skills/`. Verify before adopting.
- UI/UX Pro Max (optional, if Cline compatibility is later verified): `npx ui-ux-pro-max-cli init --ai claude` then relocate skill to `.cline/skills/ui-ux-pro-max` or `.clinerules/skills/ui-ux-pro-max`; requires Python 3.x. Keep HANSAN tokens as source of truth.
- git-slop (optional): install Rust toolchain first, then `cargo install git-slop` or use a prebuilt binary. Re-evaluate value before adoption.
