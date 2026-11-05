-- 25: performance advisors from the 06.11.2026 speed audit. No change in who can see or write what.
--
-- 1. RLS policies that called auth.uid() / auth.role() once per ROW now call them once per query:
--    the call is wrapped in (select ...), which Postgres evaluates as an init plan. Same condition, same
--    roles, same command; only the call is wrapped (ALTER POLICY keeps name, roles and command).
-- 2. reviews had two identical partial indexes on featured; reviews_featured_idx is dropped.
-- 3. Indexes for the 47 foreign keys that had none (all tables are small, so these build instantly).
--
-- Not done on purpose: merging "multiple permissive policies" (changes access logic) and dropping
-- "unused" indexes (they may serve reports that simply have not run yet).

do $$
declare
  p record;
  q text;
  w text;
  stmt text;
begin
  for p in
    select tablename, policyname, cmd, qual, with_check
    from pg_policies
    where schemaname = 'public' and policyname in (
    'profiles_self_read',
    'guest_own_assessments',
    'users_self_read',
    'bookings_self_read',
    'guest_own_outcomes',
    'wbs_question_config_service_write',
    'bookings_read',
    'wbs_daily_read',
    'partner_properties_self_read',
    'property_requests_self_read',
    'property_requests_partner_insert',
    'journey_search_owner_insert',
    'journey_search_owner_update',
    'journey_search_owner_select',
    'journey_search_goals_owner_insert',
    'journey_search_goals_owner_select',
    'journeys_owner_insert',
    'journeys_owner_select',
    'journey_match_owner_insert',
    'journey_match_owner_update',
    'journey_match_owner_select'
    )
  loop
    q := regexp_replace(regexp_replace(p.qual, 'auth\.uid\(\)', '(select auth.uid())', 'g'), 'auth\.role\(\)', '(select auth.role())', 'g');
    w := regexp_replace(regexp_replace(p.with_check, 'auth\.uid\(\)', '(select auth.uid())', 'g'), 'auth\.role\(\)', '(select auth.role())', 'g');
    stmt := format('alter policy %I on public.%I', p.policyname, p.tablename);
    if q is not null then stmt := stmt || format(' using (%s)', q); end if;
    if w is not null then stmt := stmt || format(' with check (%s)', w); end if;
    execute stmt;
  end loop;
end $$;

drop index if exists public.reviews_featured_idx;

create index if not exists idx_agent_playbooks_goal_id on public.agent_playbooks (goal_id);
create index if not exists idx_agent_playbooks_property_id on public.agent_playbooks (property_id);
create index if not exists idx_analytics_events_journey_id on public.analytics_events (journey_id);
create index if not exists idx_analytics_events_search_id on public.analytics_events (search_id);
create index if not exists idx_analytics_events_variant_id on public.analytics_events (variant_id);
create index if not exists idx_assessments_journey_id on public.assessments (journey_id);
create index if not exists idx_assessments_matched_program_id on public.assessments (matched_program_id);
create index if not exists idx_booking_financials_variant_id on public.booking_financials (variant_id);
create index if not exists idx_booking_requests_journey_id on public.booking_requests (journey_id);
create index if not exists idx_booking_specialists_specialist_id on public.booking_specialists (specialist_id);
create index if not exists idx_bookings_program_id on public.bookings (program_id);
create index if not exists idx_bookings_user_id on public.bookings (user_id);
create index if not exists idx_content_variant_media_media_asset_id on public.content_variant_media (media_asset_id);
create index if not exists idx_journey_match_program_id on public.journey_match (program_id);
create index if not exists idx_journey_search_selected_program_id on public.journey_search (selected_program_id);
create index if not exists idx_journey_search_user_id on public.journey_search (user_id);
create index if not exists idx_journey_search_goals_goal_id on public.journey_search_goals (goal_id);
create index if not exists idx_journeys_program_id on public.journeys (program_id);
create index if not exists idx_journeys_property_id on public.journeys (property_id);
create index if not exists idx_journeys_user_id on public.journeys (user_id);
create index if not exists idx_medical_flags_assessment_id on public.medical_flags (assessment_id);
create index if not exists idx_outcomes_assessment_id on public.outcomes (assessment_id);
create index if not exists idx_page_media_slots_media_id on public.page_media_slots (media_id);
create index if not exists idx_partner_applications_linked_property_id on public.partner_applications (linked_property_id);
create index if not exists idx_partner_password_resets_reset_by on public.partner_password_resets (reset_by);
create index if not exists idx_price_points_currency on public.price_points (currency);
create index if not exists idx_profiles_partner_property_id on public.profiles (partner_property_id);
create index if not exists idx_program_goals_goal_id on public.program_goals (goal_id);
create index if not exists idx_program_icps_icp_code on public.program_icps (icp_code);
create index if not exists idx_program_journey_steps_program_id on public.program_journey_steps (program_id);
create index if not exists idx_program_outcomes_outcome_slug on public.program_outcomes (outcome_slug);
create index if not exists idx_program_properties_property_id on public.program_properties (property_id);
create index if not exists idx_program_specialists_specialist_id on public.program_specialists (specialist_id);
create index if not exists idx_program_triggers_trigger_code on public.program_triggers (trigger_code);
create index if not exists idx_programs_cohort on public.programs (cohort);
create index if not exists idx_programs_operator_partner_id on public.programs (operator_partner_id);
create index if not exists idx_programs_performance_subtype_id on public.programs (performance_subtype_id);
create index if not exists idx_properties_parent_id on public.properties (parent_id);
create index if not exists idx_property_requests_linked_property_id on public.property_requests (linked_property_id);
create index if not exists idx_property_tracks_track_id on public.property_tracks (track_id);
create index if not exists idx_specialist_outcomes_program_id on public.specialist_outcomes (program_id);
create index if not exists idx_specialist_outcomes_specialist_id on public.specialist_outcomes (specialist_id);
create index if not exists idx_specialists_property_id on public.specialists (property_id);
create index if not exists idx_user_revisions_edited_by on public.user_revisions (edited_by);
create index if not exists idx_users_goal_id on public.users (goal_id);
create index if not exists idx_users_interested_program_id on public.users (interested_program_id);
create index if not exists idx_users_latest_assessment_id on public.users (latest_assessment_id);
