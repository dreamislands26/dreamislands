# Technical Design — DIT Enterprise Platform

> Process-first design. Every process below gets classified (external / internal), then designed: how it's automated, which system it lives in, whether PTE objects are required, what's exposed via API/MCP, which AI agents touch it. Decisions are numbered (D-xx) so specs can cite them. Discovery material lives in `tech-design-draft.md`.

## Table of Contents

- [How to read this](#how-to-read-this)
- [Process Inventory](#process-inventory)
- **A. Supply**
  - [P-01 Partner acquisition & onboarding](#p-01-partner-acquisition--onboarding)
  - [P-02 Partner certification & contracting](#p-02-partner-certification--contracting)
  - [P-03 Catalog & program management](#p-03-catalog--program-management)
  - [P-04 Capacity & availability management](#p-04-capacity--availability-management)
- **B. Demand**
  - [P-05 Marketing & attribution](#p-05-marketing--attribution)
  - [P-06 Guest intake & WBS assessment](#p-06-guest-intake--wbs-assessment)
  - [P-07 Matching & recommendation](#p-07-matching--recommendation)
  - [P-08 Sales pipeline & CRM](#p-08-sales-pipeline--crm)
- **C. Booking & Money**
  - [P-09 Reservation & booking](#p-09-reservation--booking)
  - [P-10 Guest payments — deposit, balance, refunds](#p-10-guest-payments--deposit-balance-refunds)
  - [P-11 Commission calculation & settlement](#p-11-commission-calculation--settlement)
  - [P-12 Partner payouts](#p-12-partner-payouts)
  - [P-13 Accounting & reporting](#p-13-accounting--reporting)
- **D. Fulfillment & Outcomes**
  - [P-14 Pre-trip fulfillment ops](#p-14-pre-trip-fulfillment-ops)
  - [P-15 On-trip servicing & check-ins](#p-15-on-trip-servicing--check-ins)
  - [P-16 Post-trip outcomes & follow-up](#p-16-post-trip-outcomes--follow-up)
  - [P-17 Repeat & retention](#p-17-repeat--retention)
- **E. Partner-facing**
  - [P-18 Partner dashboard & reporting](#p-18-partner-dashboard--reporting)
- **Cross-cutting (synthesized from processes)**
  - [X-1 Architecture overview](#x-1-architecture-overview)
  - [X-2 Entity map](#x-2-entity-map)
  - [X-3 API & MCP registry](#x-3-api--mcp-registry)
  - [X-4 Security & compliance](#x-4-security--compliance)
  - [X-5 Migration roadmap](#x-5-migration-roadmap)

---

## How to read this

Each process section uses the same template:

| Field | Meaning |
|---|---|
| Type | External (guest/partner-facing) or Internal (back-office) |
| Trigger & actors | What starts it, who participates |
| Target flow | The designed process steps (not necessarily as-is) |
| System | System of record + where business logic executes |
| Automation | What runs without a human, and how |
| PTE | Custom BC objects required (tables, pages, codeunits) — or "standard BC" |
| API / MCP | What this process exposes or consumes |
| AI agents | Which agents participate and what they're allowed to do |
| Decisions | D-xx numbered decisions with one-line rationale |
| Open questions | What blocks completion |

Status legend in the inventory: 🟢 live in MVP · 🟡 partial/manual · ⚪ not built.

---

## Process Inventory

| ID | Process | Type | Today | Target system |
|---|---|---|---|---|
| P-01 | Partner acquisition & onboarding | External | 🟡 manual, team-driven | TBD |
| P-02 | Partner certification & contracting | Internal | 🟡 Notion checklist | TBD |
| P-03 | Catalog & program management | Internal | 🟢 Supabase, team-entered | TBD |
| P-04 | Capacity & availability management | Internal | ⚪ none (no availability check) | TBD |
| P-05 | Marketing & attribution | External | 🟢 GA4/Ads/Meta + di_attr | TBD |
| P-06 | Guest intake & WBS assessment | External | 🟢 WBS form live | TBD |
| P-07 | Matching & recommendation | External | 🟡 n8n prototype logic | TBD |
| P-08 | Sales pipeline & CRM | Internal | 🟡 Notion-era, manual | TBD |
| P-09 | Reservation & booking | External | 🟢 live, flawed (no availability) | TBD |
| P-10 | Guest payments — deposit, balance, refunds | External | 🟡 deposit only; balance undocumented | TBD |
| P-11 | Commission calculation & settlement | Internal | 🟢 commercial_terms + booking_financials | TBD |
| P-12 | Partner payouts | Internal | ⚪ undocumented | TBD |
| P-13 | Accounting & reporting | Internal | ⚪ outside platform | TBD |
| P-14 | Pre-trip fulfillment ops | Internal | 🟡 Notion ops board | TBD |
| P-15 | On-trip servicing & check-ins | External | ⚪ designed only | TBD |
| P-16 | Post-trip outcomes & follow-up | External | ⚪ designed only | TBD |
| P-17 | Repeat & retention | External | ⚪ designed only | TBD |
| P-18 | Partner dashboard & reporting | External | ⚪ not started | TBD |

---

# A. Supply

## P-01 Partner acquisition & onboarding

- **Type:** External
- **Trigger & actors:**
- **Target flow:**
- **System:**
- **Automation:**
- **PTE:**
- **API / MCP:**
- **AI agents:**
- **Decisions:**
- **Open questions:**

## P-02 Partner certification & contracting

- **Type:** Internal
- **Trigger & actors:**
- **Target flow:**
- **System:**
- **Automation:**
- **PTE:**
- **API / MCP:**
- **AI agents:**
- **Decisions:**
- **Open questions:**

## P-03 Catalog & program management

- **Type:** Internal
- **Trigger & actors:**
- **Target flow:**
- **System:**
- **Automation:**
- **PTE:**
- **API / MCP:**
- **AI agents:**
- **Decisions:**
- **Open questions:**

## P-04 Capacity & availability management

- **Type:** Internal
- **Trigger & actors:**
- **Target flow:**
- **System:**
- **Automation:**
- **PTE:**
- **API / MCP:**
- **AI agents:**
- **Decisions:**
- **Open questions:**

---

# B. Demand

## P-05 Marketing & attribution

- **Type:** External
- **Trigger & actors:**
- **Target flow:**
- **System:**
- **Automation:**
- **PTE:**
- **API / MCP:**
- **AI agents:**
- **Decisions:**
- **Open questions:**

## P-06 Guest intake & WBS assessment

- **Type:** External
- **Trigger & actors:**
- **Target flow:**
- **System:**
- **Automation:**
- **PTE:**
- **API / MCP:**
- **AI agents:**
- **Decisions:**
- **Open questions:**

## P-07 Matching & recommendation

- **Type:** External
- **Trigger & actors:**
- **Target flow:**
- **System:**
- **Automation:**
- **PTE:**
- **API / MCP:**
- **AI agents:**
- **Decisions:**
- **Open questions:**

## P-08 Sales pipeline & CRM

- **Type:** Internal
- **Trigger & actors:**
- **Target flow:**
- **System:**
- **Automation:**
- **PTE:**
- **API / MCP:**
- **AI agents:**
- **Decisions:**
- **Open questions:**

---

# C. Booking & Money

## P-09 Reservation & booking

- **Type:** External
- **Trigger & actors:**
- **Target flow:**
- **System:**
- **Automation:**
- **PTE:**
- **API / MCP:**
- **AI agents:**
- **Decisions:**
- **Open questions:**

## P-10 Guest payments — deposit, balance, refunds

- **Type:** External
- **Trigger & actors:**
- **Target flow:**
- **System:**
- **Automation:**
- **PTE:**
- **API / MCP:**
- **AI agents:**
- **Decisions:**
- **Open questions:** balance collection process undefined (deposit → rest: when, how, where?); currency policy (USD display / THB charge / multi-country)

## P-11 Commission calculation & settlement

- **Type:** Internal
- **Trigger & actors:**
- **Target flow:**
- **System:**
- **Automation:**
- **PTE:**
- **API / MCP:**
- **AI agents:**
- **Decisions:**
- **Open questions:**

## P-12 Partner payouts

- **Type:** Internal
- **Trigger & actors:**
- **Target flow:**
- **System:**
- **Automation:**
- **PTE:**
- **API / MCP:**
- **AI agents:**
- **Decisions:**
- **Open questions:** payout execution undefined (schedule, method, reconciliation — ask Mark)

## P-13 Accounting & reporting

- **Type:** Internal
- **Trigger & actors:**
- **Target flow:**
- **System:**
- **Automation:**
- **PTE:**
- **API / MCP:**
- **AI agents:**
- **Decisions:**
- **Open questions:**

---

# D. Fulfillment & Outcomes

## P-14 Pre-trip fulfillment ops

- **Type:** Internal
- **Trigger & actors:**
- **Target flow:**
- **System:**
- **Automation:**
- **PTE:**
- **API / MCP:**
- **AI agents:**
- **Decisions:**
- **Open questions:**

## P-15 On-trip servicing & check-ins

- **Type:** External
- **Trigger & actors:**
- **Target flow:**
- **System:**
- **Automation:**
- **PTE:**
- **API / MCP:**
- **AI agents:**
- **Decisions:**
- **Open questions:**

## P-16 Post-trip outcomes & follow-up

- **Type:** External
- **Trigger & actors:**
- **Target flow:**
- **System:**
- **Automation:**
- **PTE:**
- **API / MCP:**
- **AI agents:**
- **Decisions:**
- **Open questions:**

## P-17 Repeat & retention

- **Type:** External
- **Trigger & actors:**
- **Target flow:**
- **System:**
- **Automation:**
- **PTE:**
- **API / MCP:**
- **AI agents:**
- **Decisions:**
- **Open questions:**

---

# E. Partner-facing

## P-18 Partner dashboard & reporting

- **Type:** External
- **Trigger & actors:**
- **Target flow:**
- **System:**
- **Automation:**
- **PTE:**
- **API / MCP:**
- **AI agents:**
- **Decisions:**
- **Open questions:**

---

# Cross-cutting (synthesized from processes)

## X-1 Architecture overview

_Component diagram + responsibilities. Written last — synthesis of P-01…P-18 System decisions._

## X-2 Entity map

_Canonical entities accumulated from PTE decisions across processes (standard BC table / table extension / custom table)._

## X-3 API & MCP registry

_Consolidated list of API pages exposed, their consumers (REST / MCP), auth model. Accumulated from API/MCP rows._

## X-4 Security & compliance

_Auth, partner isolation, medical data handling, GDPR, PDPA (TH+SG), audit. Applied per process, consolidated here._

## X-5 Migration roadmap

_Phasing of P-xx from current state to target system (6-phase frame from scope doc as starting point)._
