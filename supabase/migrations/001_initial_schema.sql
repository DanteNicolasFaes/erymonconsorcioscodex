create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text null,
  global_role text null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint profiles_global_role_check
    check (global_role in ('superadmin') or global_role is null),
  constraint profiles_status_check
    check (status in ('pending', 'active', 'rejected', 'disabled'))
);

create table public.admin_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text null,
  email text not null,
  phone text null,
  company_name text not null,
  cuit text null,
  status text not null default 'pending',
  reviewed_by uuid null references auth.users(id),
  reviewed_at timestamptz null,
  rejection_reason text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint admin_requests_status_check
    check (status in ('pending', 'approved', 'rejected')),
  constraint admin_requests_user_id_key
    unique (user_id)
);

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text null,
  cuit text null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint tenants_status_check
    check (status in ('active', 'suspended', 'archived'))
);

create table public.tenant_members (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint tenant_members_role_check
    check (role = 'tenant_admin'),
  constraint tenant_members_status_check
    check (status in ('active', 'disabled')),
  constraint tenant_members_tenant_id_user_id_key
    unique (tenant_id, user_id)
);

create table public.buildings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  name text not null,
  address text null,
  cuit text null,
  status text not null default 'active',
  archived_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint buildings_status_check
    check (status in ('active', 'archived')),
  constraint buildings_archived_at_check
    check (
      (status = 'archived' and archived_at is not null)
      or
      (status = 'active' and archived_at is null)
    )
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid null references auth.users(id) on delete set null,
  actor_role text null,
  tenant_id uuid null references public.tenants(id) on delete set null,
  building_id uuid null references public.buildings(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid null,
  metadata jsonb null,
  created_at timestamptz not null default now()
);

create index admin_requests_status_created_at_idx
  on public.admin_requests (status, created_at);

create index admin_requests_user_id_status_idx
  on public.admin_requests (user_id, status);

create index tenants_status_idx
  on public.tenants (status);

create index tenant_members_user_id_status_idx
  on public.tenant_members (user_id, status);

create index tenant_members_tenant_id_status_idx
  on public.tenant_members (tenant_id, status);

create index buildings_tenant_id_status_idx
  on public.buildings (tenant_id, status);

create index buildings_tenant_id_name_idx
  on public.buildings (tenant_id, name);

create index audit_logs_actor_user_id_created_at_idx
  on public.audit_logs (actor_user_id, created_at desc);

create index audit_logs_tenant_id_created_at_idx
  on public.audit_logs (tenant_id, created_at desc);

create index audit_logs_building_id_created_at_idx
  on public.audit_logs (building_id, created_at desc);

create index audit_logs_action_created_at_idx
  on public.audit_logs (action, created_at desc);
