-- Content OS v1: ground every content brief in the Wellness Score journey.
-- Applied to production Supabase on 2026-10-11 as migration content_os_v1_ws_grounding.

alter table public.content_briefs
  add column if not exists ws_focus text,
  add column if not exists ws_dimensions text[] not null default '{}'::text[],
  add column if not exists ws_stage text,
  add column if not exists ws_cta text;

alter table public.content_briefs
  drop constraint if exists content_briefs_ws_stage_check;

alter table public.content_briefs
  add constraint content_briefs_ws_stage_check
  check (ws_stage is null or ws_stage in ('awareness','assessment','consideration','conversion','medical'));

comment on column public.content_briefs.ws_focus is
  'Canonical WS focus this content grounds the guest toward; must map to Ranking v1 focus when populated.';
comment on column public.content_briefs.ws_dimensions is
  'Relevant WS dimensions/sub-scores, e.g. body, recovery, metabolic, mind, risk.';
comment on column public.content_briefs.ws_stage is
  'Role of this content in the WS-to-program journey.';
comment on column public.content_briefs.ws_cta is
  'WS-aware CTA intent; medical boundary remains authoritative.';
