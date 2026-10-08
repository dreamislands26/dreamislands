-- Removes everything seeded into the "Test Property (DI internal)" sandbox.
-- The property row and the partner-test@dit.local account are left in place —
-- drop those by hand if the sandbox itself is being retired.
-- Child rows are deleted before their parents; every seeded row is tagged
-- either by source = 'test-seed' or by the property/slug prefix.

begin;

delete from booking_specialists
 where booking_id in (select id from bookings where source = 'test-seed');

delete from user_wbs_daily
 where user_id in (select id from users where source = 'test-seed');

delete from bookings where source = 'test-seed';

delete from specialist_outcomes
 where specialist_id in (
   select id from specialists
    where property_id = '35d1a8b3-073b-4a4b-bc9e-652531eaebd1'
 );

delete from program_specialists
 where program_id in (select id from programs where slug like 'test-%');

delete from program_properties
 where property_id = '35d1a8b3-073b-4a4b-bc9e-652531eaebd1';

delete from users where source = 'test-seed';
delete from programs where slug like 'test-%';
delete from specialists where property_id = '35d1a8b3-073b-4a4b-bc9e-652531eaebd1';
delete from accommodation_rates where property_id = '35d1a8b3-073b-4a4b-bc9e-652531eaebd1';

commit;
