# Dream Islands Content OS v1

Status: implementation branch. Ranking v1 remains a separate production concern.

## Purpose

Turn the existing Dream Islands commercial graph into a fact-grounded content production loop. Content starts from guest demand, not from a list of programmes.

Canonical hierarchy:

`business priority -> ICP -> trigger -> content pillar -> programme/destination -> evidence -> story -> channel -> format -> CTA -> performance -> learning`

## Source of truth

Supabase is the machine-readable source of truth. Content generation must retrieve facts before writing copy. Existing entities are reused: `programs`, `properties`, `program_properties`, `services`, `program_services`, `specialists`, `reviews`, `guest_feedback`, `media_assets`, `goals`, `program_goals`, `outcomes_taxonomy`, `program_outcomes`, `icps`, `program_icps`, `triggers`, `program_triggers`, `bookings`, and analytics tables.

Do not create a second social taxonomy for ICP, triggers, goals or programmes.

## V1 workflow

1. Strategy chooses a commercial narrative and allocation.
2. Retrieval assembles programme/property/destination facts, taxonomy, proof and approved media.
3. Angle generation creates story candidates against a guest trigger.
4. Copy generation receives a structured content brief, never an empty prompt.
5. Media selection links existing `media_assets`; it does not duplicate media storage.
6. QA checks facts, brand, medical boundary, duplication and evidence status.
7. Human approves the variant.
8. Publication is recorded.
9. Performance is joined back to the brief and commercial outcome.

V1 stops at `human approve -> publish`. Autonomous social posting is explicitly out of scope for the first production milestone.

## Database layer

Production foundation tables created 2026-10-11:

- `content_briefs`
- `content_variants`
- `content_variant_media`
- `content_publications`
- `content_performance`

All five have RLS enabled. `content_variant_media` references the existing `media_assets` table.

## Evidence states

- `confirmed`: supported by a verified source/product fact.
- `hypothesis`: useful taxonomy or working classification that still needs human/source verification.
- `missing`: required evidence is absent; do not turn it into a factual claim.

Generated copy may not upgrade evidence status.

## Medical boundary

- `wellness`: normal wellness content after factual QA.
- `medical_wellness`: restricted claims and human approval. Screening language where relevant.
- `medical`: mandatory human approval; no wellness-style outcome claims; clinical source required; primary CTA is `Submit Your Case`.

Ranking v1 rules remain authoritative for discovery. Content OS does not weaken them.

## Commercial pilot

Initial narratives:

1. Tanya Samui: burnout/detox/reset -> Thailand -> Tanya -> programme inquiry.
2. China Wellness: longevity/preventive -> China -> Mile/Sanya/Wudang/Xi'an -> programme.
3. Medical China: medical decision -> China -> hospital/pathway -> `Submit Your Case`.

Initial channels: Instagram, TikTok, YouTube Shorts, LinkedIn.

## KPI hierarchy

North star: attributable gross margin per content unit.

Supporting chain: bookings/qualified leads -> WhatsApp or Submit Your Case starts -> landing visits -> saves/shares/watch time -> impressions/followers.

## Safety gates

- No invented price, treatment, outcome, facility, practitioner credential or medical claim.
- No `medical_wellness` or `medical` auto-publication.
- No autonomous posting in v1.
- Missing evidence fails closed.
- Existing public Ranking v1 and WS behaviour must not be changed by Content OS work.
