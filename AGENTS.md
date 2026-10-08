# Dream Islands Travel — Enterprise Architecture — agent instructions

This file is the single entry point for every coding agent and every new session.
Keep it under 100 lines: it is read every time, so every line costs context.

## What this project is

Production enterprise architecture for Dream Islands Travel (DIT) on Microsoft Business Central, built alongside the live Supabase MVP (panel.dreamislands.org). Read `specs/brief.md` for the full scope.

The owner is **Dmitry Katson**. Anything the specs mark as an **owner decision** is put to
the owner. An agent never settles it alone.

## Division of responsibility

Claude Code = speed, hypothesis testing, MVP (Supabase). Dmitry = architecture, integrations, enterprise platform (Business Central), security, scalability, migration. Work is not duplicated — the MVP keeps evolving while this production path is built in parallel.

## Source of truth

- Scope brief (original): `DIT_Enterprise_Scope_Dmitry.docx`
- Task tracker: Notion — "DIT Task Tracker — Q3/Q4 2026" (Enterprise Architecture epic), workspace **dit**

## Governing documents

| Document | Holds | When to read |
|---|---|---|
| `specs/brief.md` | Problem, users, numbered requirements, non-goals, constraints, success criteria | Every session |
| `specs/tech-design.md` | Principles and invariants; current architecture; one decision section per requirement | Every session: the principles, then the sections your feature touches |
| `specs/roadmap.md` | Ordered feature queue, status, next feature number, backlog | Every session |
| `specs/conventions.md` | Stack, code, test, naming, secrets and git rules | Before writing code or tests |
| `specs/features/NN-slug/` | One folder per feature: `requirements.md`, `plan.md`, `acceptance.md` | The feature in hand |
| `CHANGELOG.md` | One plain-language entry per finished feature or fix, newest first | When finalising |

## The loop

Anything that adds or changes behaviour is a feature and goes through the same loop:

**Spec → Tests → Implement → Verify → Docs → Finalise**

| Step | What happens | Skill |
|---|---|---|
| Spec | Branch `spec/NN-slug`; write the three documents; the owner approves before any code | `create-feature-spec` |
| Tests | Every acceptance criterion becomes a failing test, or a named manual check | `implement-feature` |
| Implement | Build what the plan says; log every divergence in `plan.md` as it happens | `implement-feature` |
| Verify | Full suite green; the feature is reached through the product's real entry point | `implement-feature` |
| Docs | User-facing docs describe what was actually built | `finalise-feature` |
| Finalise | Tech design brought up to date, changelog, roadmap status, commit, merge | `finalise-feature` |

Before the first feature, `create-constitution` writes the brief, tech design, roadmap and conventions.
After each merge, `replan-roadmap` re-checks the queue before the next spec.

Skills live in `.claude/skills/<name>/SKILL.md`. If your tool does not load them
automatically, open the file and follow it step by step.

A roadmap row in this repo is a workstream. Each workstream is a feature for this loop
and lives in `specs/features/NN-slug/`.

## Rules

- **No code before an approved spec.** The three documents exist and the owner has said yes.
- **The spec is the source of truth.** If the code has to differ, change the requirement
  first or log the divergence in `plan.md`. Never leave spec and code disagreeing.
- **Done means reachable.** A feature is done when its acceptance criteria pass *and* a
  user or caller can reach it through the real entry point. Passing tests on code that
  nothing calls is not done.
- **Status honesty.** `partial`, with what is missing, beats `done` with a footnote.
- **Platform first.** Use what the platform, framework and existing code already provide
  before writing something new. Cite the evidence in `tech-design.md`.
- **Don't guess.** If a platform fact is unverified, say so and say what you checked.
- **Bug fixes** to a finished feature need no new folder: add the acceptance criterion
  that would have caught the bug to that feature, see its test fail, fix it, and commit
  `fix: F{NN} …`. Full steps: `specs/README.md`, "Changing a finished feature".
- **Never commit secrets.** See `specs/conventions.md`.

## Commands

<!-- Filled by create-constitution. Skills run these by purpose, so keep the left column as is. -->

| Purpose | Command |
|---|---|
| Install | _tbd_ |
| Build | _tbd_ |
| Test: all | _tbd_ |
| Test: one feature | _tbd_ |
| Lint / format | _tbd_ |
| Run locally | _tbd_ |

<!-- sdd-template 0.1.0 -->
