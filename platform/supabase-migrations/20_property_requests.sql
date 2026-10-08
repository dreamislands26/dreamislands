-- ============================================================
-- DIT — partner-initiated requests to add a new property.
-- The row is the durable record: sendEmail() swallows delivery failures by
-- design, so the partner seeing their pending request in the list is what
-- actually guarantees the request cannot be lost.
-- Approval does not create the property — an admin creates it and links it back
-- via linked_property_id.
-- ============================================================

create table if not exists property_requests (
  id                 uuid primary key default gen_random_uuid(),
  requested_by       uuid not null references profiles(id) on delete cascade,
  property_name      text not null,
  island             text,
  country            text,
  description        text,
  contact_name       text,
  contact_phone      text,
  status             text not null default 'pending'
                       check (status in ('pending','in_review','approved','rejected')),
  admin_note         text,
  linked_property_id uuid references properties(id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists property_requests_requested_by_idx on property_requests(requested_by);

alter table property_requests enable row level security;

drop policy if exists "property_requests_self_read"      on property_requests;
drop policy if exists "property_requests_partner_insert" on property_requests;
drop policy if exists "property_requests_admin_write"    on property_requests;

create policy "property_requests_self_read" on property_requests
  for select to authenticated using (
    requested_by = auth.uid() or current_user_role() = 'admin'
  );

create policy "property_requests_partner_insert" on property_requests
  for insert to authenticated with check (
    requested_by = auth.uid() and current_user_role() = 'partner'
  );

create policy "property_requests_admin_write" on property_requests
  for all to authenticated
  using (current_user_role() = 'admin')
  with check (current_user_role() = 'admin');
