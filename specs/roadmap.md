# Roadmap

> Ordered queue of Enterprise Architecture workstreams (source: `DIT_Enterprise_Scope_Dmitry.docx`, 28 Jul 2026). Priority/Status/Owner synced from Notion — "DIT Task Tracker — Q3/Q4 2026" (Enterprise Architecture epic) as of 2026-08-07.

| # | Workstream | Delivers | Priority | Status | Owner | Notes |
|---|---|---|---|---|---|---|
| 1 | **Enterprise Architecture** | High-level architecture diagram, component responsibilities, integration map, data ownership across BC + Supabase + AI + Portals + Booking + CRM + Analytics + Payments + Auth + API. | P0 | Not started | Dmitry | Notion note: starts after Microsoft migration kickoff. Spec folder not created yet — see `tech-design.md#1-enterprise-architecture`, being worked on directly for now. |
| 2 | **Canonical Data Model** | Production data model — Geography, Supply, Products, Customers, Commerce, Operations, Outcomes — built from existing Supabase schema. | P0 | Not started | Dmitry | |
| 3 | **Business Central Modules** | Domain map of what lives in BC (Finance, Partner Mgmt, Operations, CRM, Reporting) vs. what stays in Supabase. | P0 | Not started | Dmitry | Notion: "Business Central Domain Map." |
| 4 | **API Strategy** | Versioned, authenticated API spec for Website → Booking → BC → Partner Portal → AI → Analytics, incl. webhooks and event architecture. | P1 | Not started | Dmitry | Notion: "API Specification." |
| 5 | **Security** | Auth, authorization, partner isolation, medical data handling, GDPR, PDPA (Thailand + Singapore), audit logs. | P1 | Not started | Dmitry | Notion: "Authentication & Roles + Partner isolation." |
| 6 | **AI Platform** | AI services architecture (not "AI everywhere"): WBS interpretation, recommendation engine, concierge, follow-up generation, partner assistant, sales copilot. Azure AI Foundry. | P2 | Not started | Dmitry | Intake integration point with Cura (Gigi) at `/api/intake`. |
| 7 | **BC Integration Roadmap** | 6-phase migration plan: read-only → bookings → finance → partner ops → analytics → full migration. | P2 | Not started | Dmitry | Notion: "Business Central Migration Roadmap (6 phases)." |
| 8 | **Technical Debt Review** | Audit of MVP: what stays, what's rewritten, what becomes a microservice, what belongs in BC vs. Supabase. | P2 | Not started | Dmitry | Notion: "Technical Debt Audit." |
| 9 | **Investor Readiness** | Architecture overview, scalability assumptions, security overview, data governance, AI architecture, roadmap — packaged for due diligence. | — | Not started | Dmitry | Not yet a separate Notion task; feeds the VC/Investor epic's pitch deck v3 and data room work. |

---

## Current approach

Working directly in `tech-design.md`, one workstream section at a time, before creating per-workstream `specs/YYYY-MM-DD-workstream-slug/` folders (requirements.md + plan.md + acceptance.md). Those folders get created once a workstream's design is concrete enough to spec — see `AGENTS.md` for the full SDD loop.

## Definition of "workstream done"

A workstream is done when its section in `tech-design.md` has real decisions (not TBD), any spec folder created for it is complete, its deliverables exist as reviewed artifacts (diagram, model, spec, etc.), and its row above is updated to **done** — mirror the same status update in the Notion tracker.
