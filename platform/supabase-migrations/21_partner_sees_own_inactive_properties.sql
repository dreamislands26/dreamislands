-- ============================================================
-- DIT — a partner could only reach properties through the blanket
-- `active = true` branch of properties_read, so deactivating a property
-- silently blanked its own partner's panel: every child row stayed visible
-- (specialists, rooms and program links scope off current_user_properties(),
-- which has no active gate) while the property row itself disappeared, and
-- /partner/properties rendered an empty list.
--
-- Linked properties are now always visible to their own partner. Visibility
-- for admins, guests and anon is unchanged.
-- ============================================================

drop policy if exists properties_read on public.properties;

create policy properties_read on public.properties
  for select
  using (
    current_user_role() = 'admin'::user_role
    or active = true
    or (
      current_user_role() = 'partner'::user_role
      and id = any (current_user_properties())
    )
  );

notify pgrst, 'reload schema';
