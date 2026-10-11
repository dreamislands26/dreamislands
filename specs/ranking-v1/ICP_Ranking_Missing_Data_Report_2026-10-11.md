# ICP × Trigger × UVP Ranking Model v1 — mapping and missing-data report

Date: 2026-10-11. Source: Supabase `xbzrtofanbrahasxbisf`, published and active programs (62). Read-only audit, nothing changed in production by this step.
Gate from the spec: this report comes before any change to production ranking output.

## 1. What already exists (reuse, do not duplicate)

| Spec attribute | Existing structure | State |
|---|---|---|
| cohort | `programs.cohort` (1–7), tracks (7), outcomes_taxonomy (7) | 62/62 filled |
| goal[] | `goals` (7: recover, health, fitness, nutrition, rhythm, leisure, medical) + `program_goals` (54 links) | 54 of 62 programs |
| outcome | `outcomes_taxonomy` (7) + `program_outcomes` (116 links, weight, verified) | 58 of 62 programs |
| medical_level | none. Derived today from linked property `entity_type` (`network_coordinator`, `hospital_clinic`) | 2 programs |
| destination | via `program_properties` → `properties.country` | 61 of 62 (1 program has no property link) |
| duration, price | `programs.duration_days`, `price_usd`, `program_variants` | filled |
| proof | `reviews`, `media_assets` (no per-program proof field) | partial |
| performance attrs | `program_performance_attributes` | 0 rows |
| audience / eligibility | `target_guest`, `contraindications` (text) | 28 and 19 of 62 |

## 2. Attributes with no structure yet (additive schema needed)

`market` (b2c / b2b / both), `trigger[]`, `pain_point[]`, `proof[]`, `cta_type`, `medical_level`, `intensity`, `budget_band`, and all B2B fields (`partner_type[]`, `distribution_model`, `commission/net_rate`, `group_fit`, `white_label`, `corporate_fit`, `medical_referral_fit`).
Smallest change: lookup tables `triggers`, `icp_cohorts` plus link tables `program_triggers`, `program_icps` (same pattern as `program_goals`: relevance, source, verified), and three columns on `programs`: `market`, `medical_level`, `cta_type`. `budget_band` and `intensity` can be computed from price and existing fields, not stored.

## 3. Missing data in current inventory (62 programs)

- **No goals (8):** all newly added China wellness programs: `mile-deep-thermal-wellness-10d`, `xian-mile-medical-wellness-10d`, `huizhou-lingnan-lakeside-wellness`, `puer-forest-tea-wellness`, `puer-xishuangbanna-combined-journey`, `xian-wudang-closed-retreat-10d`, `xishuangbanna-hotsprings-dai-wellness`, `sanya-island-tcm-wellness`.
- **No outcomes (4):** `bm-package-a-outpatient-fast-track`, `bm-package-b-surgery-full-process`, `village-hotel-sentosa-sport-chill-3d`, `village-hotel-sentosa-sport-chill-5d`.
- **Goal links all unverified (54 of 54) and all relevance = 1.00.** Goal fit cannot discriminate yet: every link weighs the same. Outcome links are mostly verified (only 1 program has none).
- **Audience text:** 34 programs without `goal` and `target_guest` text; 43 without `contraindications`. Eligibility rules cannot rely on contraindications today.
- **Medical:** 2 programs flagged by property type. Ambiguous cases to classify by hand: `xian-mile-medical-wellness-10d` (name says medical, linked inventory is wellness), the 3 programs linked to the `medical` goal, and the 2 programs in cohort 6 (Medical & Surgical track), of which only `bm-package-b` is flagged by property.
- **1 published program has no property link.**
- **Wellness graph for China is thinner than the rest:** all 8 programs without goals are China; the board's China hub promises "by goal" navigation, so this blocks it too.

## 4. Current matching behavior (already changed on 2026-10-08)

Top-3 by cohort, now filtered to non-medical programs (interim). Still cohort-only and price-ordered. `journey_match` already has columns `goal_fit`, `evidence_fit`, `destination_fit`, `duration_fit`, `rank`, `clicked` (25 rows), which fits the explainability payload.

## 5. Proposed execution order (each step needs approval before the next)

1. Freeze taxonomy v1 (ICP list, triggers, goal/outcome vocabulary, CTA mapping). Needs owner sign-off; items inferred without interviews are tagged "(hypothesis)".
2. Additive migration (section 2). No change to existing URLs or tables.
3. Populate: fill the 8 + 4 gaps above, set relevance weights, mark verified only by a human.
4. Eligibility rules (deterministic), then weighted scoring, then `Why this matches`, then medical pathway block with `Submit Your Case`.
5. WS smoke across wellness and medical-intent cases; production smoke and regression.

Not in this step: B2B matching, GSC overlay, Tanya Samui and indexation work (P0 acquisition list), RU cleanup. They depend on step 1–4 being stable or on separate approvals.
