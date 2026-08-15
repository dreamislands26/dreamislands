# Brief

## What Dream Islands Travel is

Dream Islands Travel (DIT) is an outcome-driven wellness travel platform for Southeast Asia — positioned as "Strava for wellness travel." It matches a guest's goals to curated, certified wellness programs on islands across SEA, and tracks outcomes before, during, and after the trip, turning one-off wellness trips into repeatable, measurable journeys.

**Category framing (the team's own positioning):**
- **Not**: an OTA, a retreat marketplace, or a wellness concierge.
- **Is**: an outcome-driven execution layer — baseline scoring → decision compression → execution (booking + payment + servicing) → outcome tracking.

## History & traction

- Started **February 2024** with a deliberately experimental phase: DIT directly rented/leased and operated wellness properties itself for ~2.5 months to validate ~30 hypotheses about unit economics and guest behavior, before moving to an asset-light model.
- From **June 2024**, partnered with a small number of highly differentiated wellness properties (starting detox-focused). Over ~15 months: **203 guests served, $234K total revenue**, ~$1,150 avg booking value, 6.5-day avg stay, ~$180 ADR (full package), ~20% upsell penetration.
- Guest funnel at 15 months: 128,875 visitors → 2,800 subscribers (2.17%) → 203 paid (7.25% of subscribers).
- Guest geography: Indonesia 29.6%, Malaysia 23.6%, Hong Kong + China 17.2%, Singapore 14.8%, USA + other 8.9%, Vietnam 5.9%.

## Current phase — Scale & Grow

Expanding supply in a structured way: 10+ additional properties onboarding, 30+ new wellness programs, new destinations (Phu Quoc, Cebu, Boracay, Bali, Singapore, Bintan, Penang), while holding the line on program quality and consistent outcomes.

As of **2026-07-28** (live platform, Supabase):

| Component | State |
|---|---|
| Platform | LIVE · panel.dreamislands.org |
| Properties | 30 (China 12, Thailand 6, Indonesia 4, Philippines 3, Singapore 2, Malaysia 2, Vietnam 1) |
| Programs | 56 · 8 composite · 382 program–service links |
| Services | 136 |
| Guests | 24 in platform (500+ contact base outside platform, not yet imported) |
| Bookings | 11 · $10,580 GMV |
| Backend | Supabase / PostgreSQL 17 |
| Partners onboarded | 2 (self-serve not yet implemented) |

> Note: an earlier infrastructure proposal (Jan 2026, Notion "Infrastructure Stack") specified Python/FastAPI, Kafka, Kubernetes — superseded. The live MVP runs on Supabase/PostgreSQL 17, and this project designs the Business Central production layer going forward.

## Product model

- **Core logic**: Outcomes → Programs → Progress → Repeat.
- **Cohorts** (a guest is matched into one, and can progress across them): Reset & Recovery Seekers (body-first), Performance & Lifestyle Optimizers (body + mind), Mind & Emotional Balance Seekers (mind-first), Soul/Meaning & Community Explorers (mind + soul).
- **Packaging**: standardized SKUs by length/purpose — RESET (3–5d, entry/trial), REBUILD (7–10d, core product), TRANSFORM (14–21d, high LTV) — each combining a pre-trip baseline, on-trip program, and post-trip continuation.
- **Supply model**: DIT doesn't "list properties" — it certifies programs, tagging each property by cohort compatibility, outcome capability, data compliance, and repeat-journey readiness.
- **Wellness Baseline Score (WBS)**: the before/during/after measurement system (baseline → in-trip adherence/engagement → +2/+6/+12-week outcome tracking) — the platform's core data asset and retention loop (data lock-in, "Strava logic": streaks, progress, personal benchmarks).
- **Moat**: outcome data across cohorts, supply standards/certification, repeat-journey graph, cross-cohort progression, proprietary SEA wellness behavior dataset — explicitly not scale-of-listings (that's the OTA moat).

## Team & responsibility split

Mark — business development, partner/client operations, SG entity & legal, investor relations. Oleg — platform/product build (Supabase MVP). Design/Marketing ("Мареша") — content, brand, pitch materials. Gigi (Cura) — front-of-house AI communication (WhatsApp/LINE/Instagram intake). **Dmitry** — architecture, integrations, enterprise platform (Business Central), security, scalability, migration.

Claude Code = speed, hypothesis testing, MVP. Dmitry = architecture, integrations, enterprise platform, security, scalability, migration. Work is not duplicated: the MVP keeps evolving while the production path to Business Central is built in parallel.

## This SDD: Enterprise Architecture on Business Central

The MVP above validates the business model. The next phase is a production-grade operating platform able to support thousands of guests, hundreds of partners, multiple countries, B2B and B2C, an AI recommendation engine, financial reporting, partner operations, and investor reporting — built on Microsoft Business Central alongside the live Supabase MVP.

- **Enterprise architecture** — component map (BC, Supabase, AI layer, Partner/Customer Portals, Public Website, Booking Engine, CRM, Analytics, Payment layer, Identity & Auth, API layer), responsibilities, integration map, data ownership.
- **Canonical data model** — production model across Geography, Supply, Products, Customers, Commerce, Operations, Outcomes, built from the existing Supabase schema.
- **Business Central modules** — which domains live in BC (Finance, Partner Management, Operations, CRM, Reporting) vs. stay in Supabase.
- **API strategy** — versioned, authenticated API layer: Website → Booking → BC → Partner Portal → AI → Analytics.
- **AI platform** — targeted AI services (WBS interpretation, recommendation engine, concierge, follow-up generation, partner assistant, sales copilot), meeting Cura (Gigi) at a single `/api/intake` integration point.
- **BC integration roadmap** — phased: read-only → bookings → finance → partner ops → analytics → full migration.
- **Security** — auth, partner isolation, medical data handling, GDPR, PDPA (Thailand + Singapore), audit logs.
- **Technical debt review** — what in the MVP stays, gets rewritten, becomes a microservice, or moves to BC vs. stays in Supabase.
- **Investor readiness** — architecture overview, scalability assumptions, security overview, data governance, AI architecture, roadmap — for due diligence.

---
Sources: Notion (workspace **dit**) — "Dream Islands Travel (DIT)", "Dream Islands – Product Requirements Document (PRD v1)", "Infrastructure Stack"; `DIT_Enterprise_Scope_Dmitry.docx` (28 Jul 2026); Notion — "DIT Task Tracker — Q3/Q4 2026".
