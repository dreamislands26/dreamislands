# Technical Design

> Single source of truth for architecture decisions. **The design is process-first: §0 documents the end-to-end guest journey and internal processes (discovered from Notion, 2026-08-07), and every layer decision in §1–§9 must trace back to a process step in §0.** Each workstream's `plan.md` will reference a section here by anchor once decisions are made. Sections §1–§9 start pre-seeded with scope from `brief.md`; decisions get filled in as each workstream is designed.

---

## 0. Business Process Map

*Sources: Notion (workspace dit) — "Dream Islands Travel (DIT)" / GTM framework, "How we track outcomes & progress", "Guests (CRM)", "Operations & SOPs", "Partners & Supply", "Journey Archetypes", "dream-islands-n8n-guide", "Booking Conversion Audit (Aug 2026)", DIT Task Tracker. Documentation spans three eras — Notion-ops (Jan 2026), n8n agent sprint (Mar 2026), live Supabase platform (Jul 2026); this section is the stitched-together current picture.*

### 0.1 Guest journey — end to end

Canonical funnel (stated in GTM framework):

```
Awareness → Baseline Completed (WBS) → Program Match → Human Touch (Concierge)
→ Booking → During-Journey Tracking → Post-Journey Score → Next Journey Recommendation
```

| # | Stage | As-is | Status |
|---|---|---|---|
| 1 | **Discover** | Content as category education (LinkedIn SG/HK, IG/TikTok SEA, WeChat/Xiaohongshu China); cohort channels — founder/doctor referrals (Reset & Recovery), Strava/Garmin/CrossFit communities (Performance), creators/podcasts (Mind Balance); B2B2C (corporate offsites, startup communities); supply-led (property alumni as distribution nodes); WhatsApp/Instagram → Cura (Gigi). WBS assessment = lead magnet. | Live (channels); Cura intake tech-ready but 0 leads through it |
| 2 | **Intake & match** | WBS form on site (5–7 min: sleep, stress, energy, movement, lifestyle, burnout flags) → score → archetype (RESET_RECOVERY / PERFORMANCE_LIFESTYLE / MIND_BALANCE / ADVENTURE_WELLNESS) → ranked program recommendations. n8n prototype documented the pipeline: Parse → Score → Match → personalized recommendation email in ~20s. | Live (16 guests through form as of late Jul) |
| 3 | **Convert / book** | Program detail page → 3 CTAs (Reserve / WhatsApp / Assessment) → ReserveModal (arrival date, guests, single email-or-WhatsApp field) → immediate Stripe **deposit** charge in THB (price advertised in USD). WhatsApp path = human/Cura-assisted alternative. Bookings $500–$10K. | Live — with known process flaws, see §0.3 |
| 4 | **Pre-trip ops** | Booked → ops board entry auto-created, due = start − 7 days, ops owner assigned. Guest stage: Lead → Qualified → Booked → Traveling → Completed → Repeat. | Notion/manual (DIT OS era) |
| 5 | **On-trip** | Designed: daily 30–60s check-ins → adherence %, engagement score, fatigue delta, drop-off risk signals; intensity adjustments by operator. | **Not built** |
| 6 | **Post-trip** | Designed: feedback request on completion (score ≥ 8 → repeat candidate); WBS re-measure at +2/+6/+12 weeks → WBS delta, outcome classification, repeat-intent probability, next-program fit score. Data: self-reported primary + optional wearables (WHOOP/Strava/Apple Health), non-clinical, consent-based. | **Not built** (user panel, partner outcome dashboard: "Not started") |
| 7 | **Repeat** | Designed: next-journey recommendation, wellness history across trips, streaks/progress ("Strava logic") → data lock-in. | **Not built** |

**Key architectural finding:** the front half (1–4) is live code with real money — it gets *migrated* to BC. The back half (5–7) — the actual moat — exists only on paper: it's *greenfield* and can be designed BC-native from day one.

### 0.2 Internal processes

**Sales & CRM** — Leads & Deals pipeline; on Qualified → Guest record auto-created (name, journey archetype, deal value copied; ops notified). Guest lifecycle stages as above.

**Ops fulfillment** (DIT OS automations, currently Notion/Make-era, to become BC workflows): payment received → ops board entry; stage Booked → prep task (due start − 7d, owner assigned); task blocked > 24h → escalation to CEO + incident log; journey completed → feedback request; repeat intent → CRM follow-up.

**Partner lifecycle** — onboarding form → normalized canonical partner record; **certification checklist**: contract signed → SOP aligned → pricing locked → emergency protocol → quality audit passed → Certified. Partner attributes: type (Hotel/Clinic/Coach/Experience), monthly capacity, commercial terms, SLA tier (A/B/C), risk notes. Monitoring: monthly capacity − active guests < 3 → "at risk" alert + follow-up task. Reality check: 2 partners onboarded, data entered by team; self-serve not built.

**Finance & settlement** (live, Jul 2026, Supabase): Stripe webhook → `booking_payment_transactions` (idempotent ledger, one row per Stripe event, unique on provider + event_id + type) → `booking_financials` (gross / paid / discount / refund / supplier_payable / DI revenue / net revenue / contribution margin, versioned by calculation_version) using `commercial_terms` commission chain: **variant → program → property → default**. Refunds handled via charge.refunded.

**Marketing & attribution** (live): GA4 + Google Ads + Meta Pixel with Consent Mode v2; server-side purchase events (Measurement Protocol) from Stripe webhook; `di_attr` cookie — full UTM set + click IDs, 180-day first-touch; `analytics_events`/`analytics_sessions` event log.

### 0.3 Known process flaws & gaps — do NOT migrate as-is

1. **Deposit charged before any availability check** (confirmed in code). Target: reservation → availability confirmation → deposit.
2. **No post-payment confirmation** — no on-page state, no guest email; loop never closes after payment.
3. **Balance collection is undocumented** — deposit is charged, but when/how the remaining amount is paid (pre-trip? on-site to property?) is described nowhere. Must be defined before Finance design.
4. **Partner payout execution is undocumented** — supplier_payable is *calculated*, but the actual payout process (schedule, method, reconciliation) is invisible. Must be defined before Finance design.
5. **Currency policy undefined** — USD advertised, THB charged; multi-currency/multi-country model needed (platform targets several countries).
6. **Cancellation/refund policy not surfaced** to guests (mechanics exist technically; policy process doesn't).

### 0.4 Design principle

The target architecture is derived from the **target** versions of §0.1 + §0.2 (with §0.3 fixed), not from the current implementation. Process step → owning layer → owning component: every entity, API, and agent in §1–§9 must be traceable to a process step here.

---

## 1. Enterprise Architecture

**Scope (from brief):**

| Component | Role |
|---|---|
| Business Central | Finance, partner contracts, operations, CRM, reporting |
| Supabase | MVP data, WBS, real-time, edge functions |
| AI layer | WBS interpretation, recommendation, concierge |
| Partner Portal | Partner dashboard, outcome data, self-serve |
| Customer Portal | User panel, journey history, WBS profile |
| Public Website | Landing pages, booking flow, WBS form |
| Booking Engine | Inventory, availability, booking, deposits |
| CRM | Organizations, leads, opportunities |
| Analytics | Revenue, margins, partner performance |
| Payment layer | Deposits, commissions, payouts |
| Identity & Auth | Roles, partner isolation, medical data |
| API layer | Versioning, authentication, webhooks, events |

**Direction (brainstorm 2026-08-07, to be confirmed):** maximum in Business Central + PTE extensions (data storage + business logic); Supabase retired unless a gap is found BC can't cover; AI agents live separately and access BC through the official BC MCP server; required data exposed via API pages — one API contract serving both REST consumers (portals/website) and MCP (agents).

**Decisions:** _TBD — being worked layer by layer._

---

## 2. Canonical Data Model

**Scope (from brief):**

| Domain | Entities |
|---|---|
| Geography | Countries, Destinations |
| Supply | Partner Organizations, Properties, Clinics, Hospitals, Practitioners |
| Products | Programs, Variants, Activities, Tracks, Outcomes |
| Customers | Profiles, WBS, Goals, Preferences |
| Commerce | Bookings, Payments, Commissions, Invoices |
| Operations | Transfers, Concierge, Journey Timeline |
| Outcomes | Progress, Assessments, Follow-ups |

**Existing Supabase schema (starting point):** `properties` (with `parent_id` hierarchy), `programs` (single + composite), `program_properties`, `program_services`, `specialists`, `specialist_outcomes`, `bookings`, `users`, `assessments`, `wbs_question_config`; plus (Jul 2026) `commercial_terms`, `booking_financials`, `booking_payment_transactions`, `analytics_events`, `analytics_sessions`.

**Product taxonomy (from Journey Archetypes):** Programs = combinations of reusable **Journey Modules** (Sport/Medical, Movement, Mental, Nutrition, Experience) with entry/exit criteria, contraindications, measurable outcomes, upsells. Rule: "if a request doesn't map to an archetype → reject or redesign."

**Decisions:** _TBD_

---

## 3. Business Central Modules

| BC Module | Covers |
|---|---|
| Finance | Invoices, commissions, payouts, accounting |
| Partner Management | Contracts, legal entities, tax |
| Operations | Bookings, reservations, availability |
| CRM | Organizations, leads, opportunities |
| Reporting | Revenue, margins, partner performance |

**Decisions:** _TBD_

---

## 4. API Strategy

**Flow:** Website → Booking → Business Central → Partner Portal → AI → Analytics

**Requirements:** Versioning, authentication, webhooks, event architecture.

**Decisions:** _TBD_

---

## 5. Security

Authentication, authorization, partner isolation, medical data (special care), GDPR, PDPA (Thailand + Singapore), audit logs.

**Decisions:** _TBD_

---

## 6. AI Platform

| AI service | Function |
|---|---|
| WBS interpretation | Interprets guest baseline score |
| Recommendation engine | Matches guest → program |
| Concierge | Guides guest pre/on/post-trip |
| Follow-up generation | Automated post-trip follow-up |
| Partner assistant | Assists partner in dashboard |
| Sales copilot | Sales assistant |

**Integration point:** `/api/intake` — Gigi (Cura) owns front-of-house communication (WhatsApp/LINE/Instagram intake); Dmitry owns the AI brain (profiling, matching, recommendation). One integration closes both ends — no duplicated work.

**Prior art:** the Mar 2026 n8n pipeline (Parse → Score → Match → Email agents, ~20s) is the working prototype of intake & match; its logic informs the agent design here.

**Decisions:** _TBD_

---

## 7. BC Integration Roadmap

| Phase | Content |
|---|---|
| Phase 1 | Read-only integrations |
| Phase 2 | Bookings |
| Phase 3 | Finance |
| Phase 4 | Partner Operations |
| Phase 5 | Analytics |
| Phase 6 | Full migration |

**Decisions:** _TBD_

---

## 8. Technical Debt Review

Review of MVP to determine: what stays, what gets rewritten, what becomes a microservice, what belongs in BC, what stays in Supabase.

**Decisions:** _TBD_

---

## 9. Investor Readiness

Deliverables: architecture overview, scalability assumptions, security overview, data governance, AI architecture, roadmap — for due diligence.

**Decisions:** _TBD_
