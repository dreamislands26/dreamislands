-- ============================================================
-- DIT — cohort subcategories on properties.
-- Cohorts (tracks) are already stored per property in properties.cohort_tags
-- (mirrored in property_tracks). Subcategories exist only for Performance
-- (performance_subtypes); this stores which of them a property offers.
-- Additive: existing readers of properties are unaffected.
-- ============================================================

alter table public.properties
  add column if not exists performance_subtype_ids smallint[] not null default '{}';

comment on column public.properties.performance_subtype_ids is
  'performance_subtypes.id values this property offers; meaningful when cohort_tags includes the Performance track.';
