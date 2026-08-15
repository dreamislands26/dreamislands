# Dream Islands Travel — Enterprise Architecture — Project Rules

## What this project is

Production enterprise architecture for Dream Islands Travel (DIT) on Microsoft Business Central, built alongside the live Supabase MVP (panel.dreamislands.org). Read `specs/brief.md` for the full scope.

## SDD process

This project uses Spec-Driven Development — same convention as `Workshop-Agentic-Coding-AL`. Before designing or building anything for a workstream:

1. Read `specs/tech-design.md` and `specs/roadmap.md`.
2. Every workstream lives in `specs/YYYY-MM-DD-workstream-slug/`.
3. Create `requirements.md` + `plan.md` + `acceptance.md` before any implementation work.
4. Loop: Spec → Plan → Implement/Design → Review → Docs → update `roadmap.md` status.

## Division of responsibility

Claude Code = speed, hypothesis testing, MVP (Supabase). Dmitry = architecture, integrations, enterprise platform (Business Central), security, scalability, migration. Work is not duplicated — the MVP keeps evolving while this production path is built in parallel.

## Source of truth

- Scope brief (original): `DIT_Enterprise_Scope_Dmitry.docx`
- Task tracker: Notion — "DIT Task Tracker — Q3/Q4 2026" (Enterprise Architecture epic), workspace **dit**
