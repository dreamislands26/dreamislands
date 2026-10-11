# Ranking Model v1 — gate package (report, rules, weights, simulation)

Date: 2026-10-11. Status: gate APPROVED 2026-10-11. Schema migration and hypothesis population are applied in Supabase (see `Ranking_v1_01_migration.sql`, `Ranking_v1_04_population.sql`). Production ranking is NOT switched: the frontend does not read the new tables yet. The 08.10 temporary protection (no medical programs in the WS top-3) stays until v1 passes the six-case smoke behind a feature flag.
Decisions: detox / weight / aesthetics are goals/outcomes under `preventive_longevity`; `aesthetic-reset` has no automatic ICP; the 6 `medical_wellness` programs stay `medical_level_verified=false` until human/source confirmation; WS focus -> goal/outcome -> eligibility -> ICP/trigger scoring (not via legacy track).
Companion files: `Ranking_v1_01_migration.sql`, `Ranking_v1_02_classification_matrix.csv` (62 rows).

## 0. Three findings that change the plan

1. **Name clash.** `programs.cohort` is a foreign key to `tracks` (reset, performance, mind, immersion, longevity, medical, sport_chill). The spec's cohort (6 B2C ICPs) is a different thing. In the schema the new concept is called `icp`; `cohort` keeps meaning "track". No existing table is renamed.
2. **Taxonomy gaps against the WS itself.** The WS focus list is: Beauty & Aesthetics, Body & Detox, Longevity, Performance & Energy, Sleep & Recovery, Weight & Metabolic Health. The 6 frozen ICPs do not contain detox, weight or aesthetics. In the matrix these programs are mapped to the nearest ICP (`preventive_longevity`) and flagged `TAXO_GAP`. Recommendation (needs your OK, taxonomy stays frozen): treat detox, weight and aesthetics as **goals/outcomes under `preventive_longevity`**, not as new ICPs.
3. **Track is not reliable for ranking.** 8 programs sit in a track that does not match their content (flag `TRACK_MISMATCH`), e.g. the medical-coordination package in `reset`, `mile-medical-wellness-journey` in `immersion`, `aesthetic-reset` in `medical`, and the whole `longevity` track contains one program. Any cohort-only match returns 1 result for Longevity.

## 1. Missing / hypothesis / confirmed

| Dimension | confirmed | hypothesis | missing |
|---|---|---|---|
| track (cohort) | 62 | | |
| destination, duration, price | 61 / 62 / 62 | | 1 (no property link: `performance-reset`) |
| medical_level | 2 (`bm-package-a`, `bm-package-b`: property type = network_coordinator) | 60 | 0 |
| ICP (primary) | 0 | 62 | 0 |
| trigger (primary) | 0 | 62 | 0 |
| goal (program_goals) | 0 (54 rows, all `verified=false`, all relevance 1.00) | 54 | 8 |
| outcome (program_outcomes) | most rows verified | 4 programs without rows | 4 |
| proof | 14 published reviews on 4 programs (`detox-reset` 11) | | 58 programs have none |
| sale mode | 27 have an active variant | | 35 are request-only (no active variant) |

The matrix proposes values for every gap; all of them are `hypothesis`. Only a human sets `verified=true`.

## 2. Medical classification (manual review list, do before scoring)

| Program | Proposed level | Why | Needs human decision |
|---|---|---|---|
| `bm-package-a-outpatient-fast-track`, `bm-package-b-surgery-full-process` | medical (confirmed) | linked to Better Migrate (network_coordinator) | no |
| `xian-mile-medical-wellness-10d` | medical_wellness | name says medical, inventory is a wellness resort | yes |
| `mile-medical-wellness-journey` ($8,000, 14d) | medical_wellness | same | yes |
| `mile-executive-health-recovery` ($5,500), `mile-luxury-preventive-health-program` ($10,000) | medical_wellness | executive / preventive health, likely diagnostics | yes: do they include diagnostics? |
| `longevity-protocol` | medical_wellness | preventive program, contraindications present, 1 review | yes: **highest value** (it is the only program in the longevity track) |
| `aesthetic-reset` | medical_wellness | track `medical`, goal `medical`, but wellness property in Thailand | yes |
| all others (52) | wellness | no medical signal in property type or content | spot-check the 19 that have contraindications |

Rule used in the simulation: a `hypothesis` medical level may **block** a program from a wellness top-3 but may never **permit** one (safety cannot rest on inference).

## 3. Proposed eligibility rules (deterministic, run before any scoring)

- **E1** active, published, market b2c (B2B inventory is never mixed into B2C scoring).
- **E2 medical gate.** Wellness intent: `wellness` always eligible; `medical_wellness` eligible only if `medical_level_verified = true` and ICP is `preventive_longevity` and no medical signal is active; `medical` never; `NULL` (unclassified) excluded (fail closed). Medical intent: Medical block (section 5), CTA `submit_case`.
- **E3 medical-intent signals** (any one): the guest picks a medical intent in the Wellness Journey, a `medical_flags` row exists for the assessment, or the entry came from the Medical China funnel. The assessment does not diagnose; it only offers a medical review pathway.
- **E4 goal gate.** If at least 3 programs have goal fit > 0, programs with goal fit = 0 are not eligible for the top-3.
- **E5 hard constraints only when the guest marks them required:** destination, maximum duration, budget band. Otherwise they only score.
- **E6 safety notes.** If a program has contraindications or the guest's risk sub-score is low, show a screening note; do not exclude and never state a diagnosis.
- **E7 request-only** programs stay eligible; CTA becomes `request_dates`.
- **E8 diversity.** At most 2 of the 3 results from the same property.
- **E9 price is never an eligibility or primary ranking factor.** Budget band is a constraint/value signal only.

## 4. Proposed scoring (after eligibility), 0-100

| Component | Weight | Rule |
|---|---|---|
| Intent fit | 25 | program ICP = guest ICP: primary 1.0, secondary 0.5, none 0 |
| Goal fit | 25 | primary outcome match 1.0, secondary outcome 0.6, goal-code match 0.8 (take the max) |
| Trigger fit | 15 | guest trigger = program primary 1.0, secondary 0.6, none 0.2 |
| Evidence / quality | 15 | published reviews: 5+ = 1.0, 1-4 = 0.7, none = 0.4 (0.2 if no certified partner) |
| Constraint fit | 15 | duration gap <=1 day 1.0, <=3 0.7, <=7 0.4, else 0.2 |
| Commercial relevance | 5 | bookable priced variant 1.0, request-only 0.5 |

Confidence multiplier on Intent, Goal and Trigger: `confirmed` 1.0, `hypothesis` 0.5, `missing` 0 (no points). While everything is hypothesis the maximum possible score is 67.5; scores are comparable only relative to each other until rows are confirmed. Tie-break: smaller duration gap, then more reviews, then `programs.sort_order`.

Explainability payload stored in `journey_match.why`, for example:
`{"version":"v1","icp":"preventive_longevity","goal":"metabolic-health","matched_on":["primary outcome","trigger outcome_aware","11 published reviews"],"notes":["screening note: contraindications listed"],"confidence":"hypothesis"}`

## 5. Presentation rules

- Wellness block: top-3 from E1-E9, CTA by program (`Reserve` / `Request dates`).
- Medical support block, shown only on a medical signal (E3): label "Medical support / Clinical pathway", CTA "Submit Your Case", no price comparison with wellness programs, no diagnostic wording.
- Summary clamped to 2 lines in the card (source text untouched). Already live.

## 6. Before / after simulation

Method: "before" = cohort-based, price ascending, with the 08.10 protection (medical packages excluded). "After" = rules and weights above applied to the hypothesis matrix. The WS focus-to-track mapping lives in the intake code and was not verified; I assumed Weight -> reset (this matches what we observed live), Sleep -> mind, Performance -> performance, Longevity -> longevity, Aesthetics -> medical. Treat "before" as indicative; "after" is computed from the matrix.

| Case (7-8 days unless noted) | Before (current) | After (v1, hypothesis rules) | Reading |
|---|---|---|---|
| **Weight & Metabolic Health** (8d) | Forest Detox 5N, Urban Stress Reset 7D, Signature Program | Detox Reset (63.0), Weight Reset (58.5), Forest Detox 5N (51.5) | Goal-relevant instead of cheapest; both lead programs carry screening notes |
| **Sleep & Recovery** (7d) | Pu'er Forest & Tea ($309), Xishuangbanna Hot Springs ($327), Why Nam Meditation 3D ($450) | Sleep & NS Reset (63.0), Wudang 5-Day Dao (54.0), Xi'an & Wudang Closed Retreat (41.8) | Sleep outcome now drives the result; the third slot only exists because of the goal gate (E4) |
| **Performance & Energy** (7d) | Active Recovery 5D, Hot Spring Recovery 7D, Club Med Performance Reset 5D | Club Med Performance Reset 5D (49.0), Club Med Sport & Recovery Cycle 10D (49.0), then a tie at 47.5 | E8 limits Club Med to 2; ties show the data cannot separate these programs yet (no intensity, sport type, budget band) |
| **Longevity** (8d) | Longevity Protocol only (1 program) | Mile 7D6N Deep Recovery (58.5), Mile Deep Thermal 10D (54.0), Detox & Anti-Aging 3D (49.5). If `longevity-protocol` is confirmed eligible it becomes #1 (63.0) | Biggest dependency on the medical-level review in section 2 |
| **Beauty & Aesthetics** (8d) | Aesthetic Reset only | No eligible match (the only candidate is blocked by E2; no ICP fits) -> transparent "no close match" state with a coordinator CTA | Exposes the taxonomy gap; needs a decision, not more scoring |
| **Medical intent** (any focus) | Outpatient Fast-track ($521) can rank #1 by price | Wellness top-3 unchanged, plus a separate Medical support block with the two Better Migrate packages and `Submit Your Case` | Meets the acceptance criterion: price cannot win a wellness slot |

## 7. Acceptance criteria check (what this package already shows)

- A cheap medical service cannot win a wellness match by price: yes (E2, E9).
- Explicit medical intent can produce a medical pathway: yes (E3, Medical block).
- Every recommendation can explain why: payload defined, needs implementation.
- One program, several ICPs/triggers: supported by `program_icps` / `program_triggers` (primary + secondary).
- B2B and B2C scoring distinct: E1; B2B fields deferred to a second migration.
- Locale-independent: ranking runs on codes, no copy.
- No logic added to the RU generator: confirmed.
- Existing URLs and inventory architecture preserved: yes, migration is additive.

## 8. Decisions needed from you to pass the gate

1. OK for the schema diff in `Ranking_v1_01_migration.sql` (names: `icps`, `triggers`, `program_icps`, `program_triggers`, 4 columns on `programs`, 5 columns on `journey_match`, view `program_proof_v`).
2. Detox / weight / aesthetics as goals under `preventive_longevity` (finding 2).
3. Human review of the 7 medical_wellness candidates in section 2; at minimum `longevity-protocol`.
4. Confirm or correct the FOCUS-to-track mapping used in the simulation (or give me the intake route source and I recompute "before" exactly).

After that: apply migration, populate from the matrix (all `verified=false` except what you confirm), implement eligibility first, then scoring behind a feature flag, then smoke on the representative cases above.
