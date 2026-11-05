-- ============================================================
-- DIT — public partner application (Mark's vision interview, B1):
-- a property applies at /partners/apply → CRM record + primary partner
-- profile → qualify → structure programmes → verify & contract → live.
--
-- Separate from for_properties_leads (demo requests) and property_requests
-- (a signed-in partner adding a property); an approved application would later
-- create the partner account and the property and link them here.
-- Additive: no existing table is changed.
-- ============================================================

create table if not exists public.partner_applications (
  id                  uuid primary key default gen_random_uuid(),
  -- application as sent
  property_name       text not null,
  property_type       text,
  country             text not null,
  city                text,
  website             text,
  offerings           text[] not null default '{}',
  programs            jsonb not null default '[]',   -- [{name, nights, priceFrom}]
  practitioners       jsonb not null default '[]',   -- [{name, specialty}]
  contact_name        text not null,
  contact_role        text,
  contact_email       text not null,
  contact_phone       text,
  source              text check (source in ('outbound','referral','event','inbound')),
  -- primary profile, computed on submit
  cohorts             int[] not null default '{}',
  medical             boolean not null default false,
  completeness        int not null default 0 check (completeness between 0 and 100),
  checks              jsonb not null default '[]',   -- [{key, label, status: ok|missing|review, note}]
  -- CRM
  stage               text not null default 'new'
                        check (stage in ('new','qualify','structure','verify','live','declined')),
  owner_email         text,                           -- team member who first moved it
  linked_property_id  uuid references public.properties(id) on delete set null,
  consent_at          timestamptz not null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table if not exists public.partner_application_stage_events (
  id              uuid primary key default gen_random_uuid(),
  application_id  uuid not null references public.partner_applications(id) on delete cascade,
  stage           text not null,
  changed_by      text not null,                     -- admin email, or 'application form'
  created_at      timestamptz not null default now()
);

create index if not exists partner_applications_stage_idx on public.partner_applications(stage);
create index if not exists partner_applications_created_idx on public.partner_applications(created_at desc);
create index if not exists partner_application_stage_events_app_idx on public.partner_application_stage_events(application_id);

-- Written and read by the API with the service role only; no policies, so the anon key sees nothing.
alter table public.partner_applications enable row level security;
alter table public.partner_application_stage_events enable row level security;

-- New tables here no longer get API grants by default: give them to the service role only.
grant select, insert, update, delete on public.partner_applications to service_role;
grant select, insert, update, delete on public.partner_application_stage_events to service_role;
