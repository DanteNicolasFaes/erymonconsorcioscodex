/*
  Erymon Consorcios - controlled first superadmin seed

  STEPS TO CREATE THE FIRST SUPERADMIN:
  1. Create the user manually in Supabase Auth.
  2. Copy the user's UUID from auth.users.id.
  3. Replace PEGAR_ACA_TU_USER_UID with the real UUID.
  4. Run this seed only in dev/staging or another controlled environment.
  5. Never expose a public screen or public endpoint to create superadmins.

  This seed intentionally does not create tenants, tenant_members, buildings,
  admin_requests, or fake data.
*/

insert into public.profiles (
  id,
  email,
  full_name,
  global_role,
  status
)
values (
  'b959b940-1477-40bb-bd14-58caca0aef0b',
  'dn.faes@gmail.com',
  'Dante Faes',
  'superadmin',
  'active'
)
on conflict (id) do update
set
  email = excluded.email,
  full_name = excluded.full_name,
  global_role = 'superadmin',
  status = 'active',
  updated_at = now();