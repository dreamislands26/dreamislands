-- ============================================================
-- DIT — guest cabinet (magic link via Resend).
-- handle_new_user used to link EVERY public.users row with the new email.
-- A guest who took the assessment twice has two rows, and uq_users_auth_user
-- then aborts auth-user creation, so they can never sign in to /me.
-- Link only the most recent row, and match email case-insensitively.
-- ============================================================

create or replace function handle_new_user() returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role)
  values (
    new.id,
    case
      when new.email in ('olegoonline@gmail.com','9679108@gmail.com') then 'admin'::user_role
      else 'user'::user_role
    end
  )
  on conflict (id) do nothing;

  update public.users set auth_user_id = new.id
   where id = (
     select id from public.users
      where lower(email) = lower(new.email) and auth_user_id is null
      order by created_at desc
      limit 1
   );

  return new;
end;
$$;
