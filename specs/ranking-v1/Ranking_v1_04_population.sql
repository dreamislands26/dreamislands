-- Ranking Model v1 — hypothesis population. APPLIED 2026-10-11 to Supabase xbzrtofanbrahasxbisf (after Ranking_v1_01_migration.sql).
-- All inferred rows: verified=false. Only the two Better Migrate packages have medical_level_verified=true.
-- Abbreviations. ICP: BE burnout_exec, PL preventive_longevity, MD medical_decision, PA performance_active, MR mind_reset, TR transformational.
-- Triggers: pa problem_aware, oa outcome_aware, ta treatment_aware, dl destination_led, pl property_led, el experience_led, cl constraint_led, ll life_event_led.
-- medical_level: w wellness, mw medical_wellness, m medical. CTA: f find_my_program, e explore_programs, c check_up, s submit_case.
-- Row format: slug|medical_level|cta|icp_primary|icp_secondary|trigger_primary|trigger_secondary
-- aesthetic-reset intentionally has no ICP (decision 2026-10-11).

create temp table _m on commit drop as
select split_part(l,'|',1) slug, split_part(l,'|',2) ml, split_part(l,'|',3) cta,
 nullif(split_part(l,'|',4),'') i1, nullif(split_part(l,'|',5),'') i2,
 nullif(split_part(l,'|',6),'') t1, nullif(split_part(l,'|',7),'') t2
from regexp_split_to_table($d$bm-package-a-outpatient-fast-track|m|s|MD||ta|dl
como-shambala-executive-burnout-reset-3d|w|f|BE|MR|pa|pl
como-shambala-executive-burnout-reset-5d|w|f|BE|MR|pa|pl
detox-reset|w|f|PL|BE|oa|el
happi-village-penang-forest-detox-5n|w|f|PL|MR|oa|el
happi-village-penang-urban-stress-reset-7d|w|f|BE|MR|pa|cl
mile-3d2n-detox-anti-aging|w|f|PL|TR|oa|el
mile-5d4n-wellness-escape|w|e|TR|BE|el|pa
mile-deep-thermal-wellness-10d|w|f|PL|TR|oa|el
signature-program|w|f|BE|PL|pa|pl
wudang-executive-burnout-recovery|w|f|BE|TR|pa|dl
ayo-ayo-wellness-active-recovery-5d|w|f|PA||ll|cl
ayo-ayo-wellness-hot-spring-recovery-7d|w|f|PA|MR|ll|el
club-med-bintan-performance-reset-5d|w|f|PA||oa|pl
club-med-bintan-sport-recovery-cycle-10d|w|f|PA||oa|pl
club-med-bintan-triathlon-prep-14d|w|f|PA||ll|pl
club-med-bintan-triathlon-prep-7d|w|f|PA||ll|pl
mile-executive-health-recovery|mw|c|PL|BE|oa|ta
mile-luxury-preventive-health-program|mw|c|PL||oa|ta
movenpick-cebu-ironman-prep-camp-14d|w|f|PA||ll|pl
movenpick-cebu-ironman-prep-camp-7d|w|f|PA||ll|pl
weight-reset|w|f|PL||oa|el
xian-mile-medical-wellness-10d|mw|c|PL|TR|oa|ta
huizhou-lingnan-lakeside-wellness|w|f|MR|TR|el|dl
langkawi-nature-retreat-digital-detox-10d|w|f|MR||pa|el
langkawi-nature-retreat-nature-detox-7d|w|f|MR||pa|el
mile-wellness-escape-short|w|f|MR|TR|pa|cl
mokka-bali-creative-reset-10d|w|f|MR|TR|el|pl
mokka-bali-fasting-clarity-7d|w|f|MR|PL|oa|el
movenpick-resort-spa-boracay-community-wellness-week-7d|w|f|MR|TR|pa|pl
movenpick-resort-spa-boracay-mindfulness-reset-10d|w|f|MR||pa|pl
movenpick-resort-spa-boracay-mindfulness-reset-7d|w|f|MR||pa|pl
puer-forest-tea-wellness|w|e|TR|MR|el|dl
puer-xishuangbanna-combined-journey|w|e|TR|MR|el|dl
sleep-nervous-system-reset|w|f|MR|BE|pa|oa
the-shells-resort-spa-phu-quoc-emotional-recovery-14d|w|f|MR||ll|pl
the-shells-resort-spa-phu-quoc-long-stay-mental-reset-21d|w|f|MR|TR|ll|cl
the-shells-resort-spa-phu-quoc-stress-relief-reset-10d|w|f|MR|BE|pa|pl
udara-bali-yoga-detox-spa-emotional-reset-14d|w|f|MR||ll|el
udara-bali-yoga-detox-spa-emotional-reset-7d|w|f|MR||pa|el
udara-bali-yoga-detox-spa-yoga-detox-10d|w|f|MR|PL|oa|el
udara-bali-yoga-detox-spa-yoga-detox-5d|w|f|MR|PL|oa|el
why-nam-beach-meditation-reset-3d|w|f|MR||pa|el
why-nam-beach-meditation-reset-5d|w|f|MR||pa|el
why-nam-beach-yoga-nature-immersion-3d|w|f|MR|TR|el|pl
why-nam-beach-yoga-nature-immersion-5d|w|f|MR|TR|el|pl
wudang-3-day-mind-reset|w|f|MR|TR|pa|el
wudang-5-day-dao-wellness|w|f|MR|TR|pa|el
xian-wudang-closed-retreat-10d|w|e|TR|MR|el|dl
xian-wudang-wellness-journey-11d|w|e|TR|MR|dl|el
xishuangbanna-hotsprings-dai-wellness|w|e|TR|MR|el|dl
mile-7d6n-deep-recovery|w|f|PL|TR|oa|el
mile-medical-wellness-journey|mw|c|PL||oa|ta
performance-reset|w|f|PA||oa|cl
sanya-island-tcm-wellness|w|e|TR|MR|el|dl
wudang-10-day-deep-internal-practice|w|e|TR|PL|el|dl
wudang-7-day-tai-chi-longevity|w|e|TR|PL|el|oa
longevity-protocol|mw|c|PL||oa|ta
aesthetic-reset|mw|c|||oa|ta
bm-package-b-surgery-full-process|m|s|MD||ta|dl
village-hotel-sentosa-sport-chill-3d|w|f|PA|TR|ll|cl
village-hotel-sentosa-sport-chill-5d|w|f|PA|TR|ll|cl$d$, E'\n') l;

update programs p set market='b2c',
 medical_level = case m.ml when 'w' then 'wellness' when 'mw' then 'medical_wellness' else 'medical' end,
 medical_level_verified = (m.slug in ('bm-package-a-outpatient-fast-track','bm-package-b-surgery-full-process')),
 cta_type = case m.cta when 'f' then 'find_my_program' when 'e' then 'explore_programs' when 'c' then 'check_up' else 'submit_case' end
from _m m where p.slug=m.slug;

create temp table _ic(a text, c text);
insert into _ic values ('BE','burnout_exec'),('PL','preventive_longevity'),('MD','medical_decision'),('PA','performance_active'),('MR','mind_reset'),('TR','transformational');
create temp table _tr(a text, c text);
insert into _tr values ('pa','problem_aware'),('oa','outcome_aware'),('ta','treatment_aware'),('dl','destination_led'),('pl','property_led'),('el','experience_led'),('cl','constraint_led'),('ll','life_event_led');

insert into program_icps(program_id,icp_code,fit,source,verified)
select p.id, ic.c, 'primary','inferred',false from _m m join programs p on p.slug=m.slug join _ic ic on ic.a=m.i1;
insert into program_icps(program_id,icp_code,fit,source,verified)
select p.id, ic.c, 'secondary','inferred',false from _m m join programs p on p.slug=m.slug join _ic ic on ic.a=m.i2 on conflict do nothing;
insert into program_triggers(program_id,trigger_code,fit,source,verified)
select p.id, t.c, 'primary','inferred',false from _m m join programs p on p.slug=m.slug join _tr t on t.a=m.t1;
insert into program_triggers(program_id,trigger_code,fit,source,verified)
select p.id, t.c, 'secondary','inferred',false from _m m join programs p on p.slug=m.slug join _tr t on t.a=m.t2 on conflict do nothing;

-- Gap fill (inferred, unverified). program_goals.relevance is smallint (existing values are all 1), so secondary weights come from outcome weight, not relevance.
-- goal ids: 1 recover, 2 health, 3 fitness, 4 nutrition, 5 rhythm, 6 leisure, 7 medical
insert into program_goals(program_id,goal_id,relevance,source,verified)
select p.id, v.g, 1, 'inferred', false from (values
 ('mile-deep-thermal-wellness-10d',2),('xian-mile-medical-wellness-10d',2),('huizhou-lingnan-lakeside-wellness',5),
 ('puer-forest-tea-wellness',6),('puer-xishuangbanna-combined-journey',5),('xian-wudang-closed-retreat-10d',5),
 ('xishuangbanna-hotsprings-dai-wellness',1),('sanya-island-tcm-wellness',6),('detox-reset',4)) v(slug,g)
join programs p on p.slug=v.slug on conflict do nothing;
insert into program_outcomes(program_id,outcome_slug,weight,source,verified)
select p.id,'rebuild-your-body','primary','inferred',false from programs p
where p.slug in ('village-hotel-sentosa-sport-chill-3d','village-hotel-sentosa-sport-chill-5d') on conflict do nothing;
