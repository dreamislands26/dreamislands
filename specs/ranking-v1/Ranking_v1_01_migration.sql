-- Ranking Model v1 — additive migration. APPLIED 2026-10-11 to Supabase xbzrtofanbrahasxbisf as `ranking_v1_additive_schema`
-- (applied without the begin/commit wrapper, the migration tool adds its own transaction). Population (62 programs, hypothesis) was run separately.
-- Project: xbzrtofanbrahasxbisf. Diff is against the live schema as read on 2026-10-11.
-- Principles: reuse tracks / goals / outcomes_taxonomy / program_goals / program_outcomes / journey_match / reviews / media_assets.
-- Nothing is dropped. One existing CHECK is widened (program_goals.source). All new objects are additive.
-- Naming: programs.cohort is a FK to tracks(id) (reset, performance, mind, immersion, longevity, medical, sport_chill).
--         The spec's "cohort" (ICP cohort) is therefore called ICP in the schema, to avoid a second meaning of "cohort".

begin;

-- 1. Reuse notes (no change): confirmed vs hypothesis uses the existing `verified` boolean on program_goals / program_outcomes.
--    verified = true  -> confirmed (supplier / product source / human review)
--    verified = false -> hypothesis (inferred)
--    no row           -> missing
--    Allow marking inferred rows explicitly:
alter table public.program_goals drop constraint program_goals_source_check;
alter table public.program_goals add constraint program_goals_source_check
  check (source = any (array['migrated_track','manual','partner','outcomes','inferred']));

-- 2. ICP lookup (replaces the spec's per-program pain_point / UVP: they belong to the ICP, not to a program)
create table public.icps (
  code         text primary key,
  market       text not null check (market in ('b2c','b2b')),
  label        text not null,
  main_trigger text,
  pain_jtbd    text,
  uvp          text,
  primary_cta  text,
  sort_order   int  not null default 0,
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

-- 3. Trigger lookup (8 purchase-trigger dimensions)
create table public.triggers (
  code        text primary key,
  label       text not null,
  description text,
  sort_order  int  not null default 0
);

-- 4. Program <-> ICP and Program <-> trigger (same shape as program_goals: fit, source, verified)
create table public.program_icps (
  program_id uuid not null references public.programs(id) on delete cascade,
  icp_code   text not null references public.icps(code),
  fit        text not null default 'primary' check (fit in ('primary','secondary')),
  source     text not null default 'inferred' check (source in ('inferred','manual','partner')),
  verified   boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (program_id, icp_code)
);
create table public.program_triggers (
  program_id   uuid not null references public.programs(id) on delete cascade,
  trigger_code text not null references public.triggers(code),
  fit          text not null default 'primary' check (fit in ('primary','secondary')),
  source       text not null default 'inferred' check (source in ('inferred','manual','partner')),
  verified     boolean not null default false,
  created_at   timestamptz not null default now(),
  primary key (program_id, trigger_code)
);

-- 5. Four columns on programs (market, medical_level, medical_level_verified, cta_type). Nullable except the verified flag: NULL = missing = fails closed in eligibility.
alter table public.programs
  add column market text check (market in ('b2c','b2b','both')),
  add column medical_level text check (medical_level in ('wellness','medical_wellness','medical')),
  add column medical_level_verified boolean not null default false,
  add column cta_type text check (cta_type in ('find_my_program','explore_programs','check_up','submit_case','request_dates'));

-- 6. Proof is computed from existing sources, no new proof table:
--    published reviews, `properties.certified` of linked properties, specialists (media_assets can be added to the view later).
create view public.program_proof_v with (security_invoker = true) as
select pr.id as program_id,
       (select count(*) from public.reviews r where r.program_id = pr.id and r.status = 'published') as reviews_published,
       (select round(avg(r.rating)::numeric, 2) from public.reviews r where r.program_id = pr.id and r.status = 'published') as rating_avg,
       (select count(*) from public.program_specialists ps where ps.program_id = pr.id) as specialists,
       (select bool_or(p.certified) from public.program_properties pp
          join public.properties p on p.id = pp.property_id where pp.program_id = pr.id) as partner_certified
from public.programs pr;

-- 7. Explainability on the existing matching log (journey_match already has goal_fit, evidence_fit, destination_fit, duration_fit, rank)
alter table public.journey_match
  add column intent_fit numeric,
  add column trigger_fit numeric,
  add column score numeric,
  add column ranking_version text,
  add column why jsonb;

-- 8. RLS: same pattern as goals / program_goals (RLS on, public read)
alter table public.icps enable row level security;
alter table public.triggers enable row level security;
alter table public.program_icps enable row level security;
alter table public.program_triggers enable row level security;
create policy icps_public_read on public.icps for select using (true);
create policy triggers_public_read on public.triggers for select using (true);
create policy program_icps_public_read on public.program_icps for select using (true);
create policy program_triggers_public_read on public.program_triggers for select using (true);

-- 9. Seed vocabulary (B2C ICPs; B2B ICPs live in the same table, market = 'b2b', populated in a later migration)
insert into public.icps (code, market, label, main_trigger, pain_jtbd, uvp, primary_cta, sort_order) values
 ('burnout_exec',      'b2c','Burnout / Executive Recovery','Exhaustion, poor sleep, chronic stress','A normal holiday does not restore capacity','Structured recovery matched by goal, time and destination','find_my_program',1),
 ('preventive_longevity','b2c','Preventive Health / Longevity','Want to understand health before a problem appears','Fragmented check-ups and generic wellness','Diagnostics + prevention + structured recovery','check_up',2),
 ('medical_decision',  'b2c','Medical Decision / Second Opinion','Diagnosis, treatment recommendation or unresolved medical question','Hospital selection, uncertainty, language and navigation','One case to the appropriate Chinese clinic/hospital with a coordinated pathway','submit_case',3),
 ('performance_active','b2c','Performance / Active Recovery','Race, training load, recovery need','Recovery is disconnected from travel and training','Sport + recovery + destination in one structured program','find_my_program',4),
 ('mind_reset',        'b2c','Mind / Emotional Reset','Anxiety, overload, poor sleep, digital noise','Cannot properly disconnect and reset','Curated environment + structured practices + sufficient recovery time','find_my_program',5),
 ('transformational',  'b2c','Transformational Wellness Travel','Want a meaningful trip rather than a generic hotel stay','Wellness travel is either generic spa or overly hardcore retreat','Verified, distinctive Asian wellness experiences not easily assembled from a generic OTA','explore_programs',6);

insert into public.triggers (code, label, sort_order) values
 ('problem_aware','Problem-aware (burnout, stress, poor sleep, anxiety)',1),
 ('outcome_aware','Outcome-aware (longevity, detox, performance, weight/metabolic)',2),
 ('treatment_aware','Treatment-aware (diagnosis, surgery, second opinion, check-up)',3),
 ('destination_led','Destination-led (China, Bali, Thailand ...)',4),
 ('property_led','Property-led (named resort/property)',5),
 ('experience_led','Experience-led (TCM, Tai Chi, yoga, hot springs, meditation ...)',6),
 ('constraint_led','Constraint-led (duration, budget, origin market, dates)',7),
 ('life_event_led','Life-event-led (post-burnout, post-treatment, race, sabbatical, milestone)',8);

commit;

-- Population (separate step, after the 62-row matrix is approved): INSERT into program_icps / program_triggers,
-- UPDATE programs SET market / medical_level / cta_type, and set program_goals.relevance (1.0 primary, 0.6 secondary).
-- Rollback: drop view program_proof_v; drop tables program_triggers, program_icps, triggers, icps; alter table programs drop the 4 columns;
--           alter table journey_match drop the 5 columns; restore program_goals_source_check without 'inferred'.
