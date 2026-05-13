create table public.functional_units (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  building_id uuid not null references public.buildings(id) on delete restrict,
  type text not null,
  identifier text not null,
  floor text null,
  unit_number text null,
  status text not null default 'active',
  occupancy_status text not null default 'sin_datos',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz null,

  constraint functional_units_type_check
    check (type in ('departamento', 'cochera', 'baulera', 'local', 'encargado')),
  constraint functional_units_status_check
    check (status in ('active', 'archived')),
  constraint functional_units_occupancy_status_check
    check (occupancy_status in ('vacia', 'habitada', 'en_obra', 'sin_datos')),
  constraint functional_units_archived_at_check
    check (
      (status = 'archived' and archived_at is not null)
      or
      (status = 'active' and archived_at is null)
    ),
  constraint functional_units_tenant_building_identifier_key
    unique (tenant_id, building_id, identifier)
);

create index functional_units_tenant_id_idx
  on public.functional_units (tenant_id);

create index functional_units_building_id_idx
  on public.functional_units (building_id);

create index functional_units_status_idx
  on public.functional_units (status);

create index functional_units_building_id_status_idx
  on public.functional_units (building_id, status);

alter table public.functional_units enable row level security;

create or replace function public.prevent_functional_unit_tenant_or_building_change()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if old.tenant_id is distinct from new.tenant_id then
    raise exception 'functional_units.tenant_id cannot be changed.';
  end if;

  if old.building_id is distinct from new.building_id then
    raise exception 'functional_units.building_id cannot be changed.';
  end if;

  return new;
end;
$$;

create or replace function public.validate_functional_unit_building_tenant()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1
    from public.buildings b
    where b.id = new.building_id
      and b.tenant_id = new.tenant_id
  ) then
    raise exception 'functional_units.tenant_id must match buildings.tenant_id.';
  end if;

  return new;
end;
$$;

create or replace function public.prevent_archived_functional_unit_edit()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if old.status = 'archived' then
    if new.status = 'active'
      and new.archived_at is null
      and new.tenant_id = old.tenant_id
      and new.building_id = old.building_id
      and new.type = old.type
      and new.identifier = old.identifier
      and new.floor is not distinct from old.floor
      and new.unit_number is not distinct from old.unit_number
      and new.occupancy_status = old.occupancy_status
    then
      return new;
    end if;

    raise exception 'Archived functional units are read-only and can only be unarchived.';
  end if;

  return new;
end;
$$;

create trigger functional_units_set_updated_at
before update on public.functional_units
for each row
execute function public.set_updated_at();

create trigger functional_units_validate_building_tenant
before insert or update on public.functional_units
for each row
execute function public.validate_functional_unit_building_tenant();

create trigger functional_units_prevent_tenant_or_building_change
before update on public.functional_units
for each row
execute function public.prevent_functional_unit_tenant_or_building_change();

create trigger functional_units_prevent_archived_edit
before update on public.functional_units
for each row
execute function public.prevent_archived_functional_unit_edit();

create policy functional_units_select_tenant_admin_or_superadmin
on public.functional_units
for select
to authenticated
using (
  public.is_superadmin()
  or public.is_active_tenant_admin(tenant_id)
);

create or replace function public.create_functional_unit(
  p_building_id uuid,
  p_type text,
  p_identifier text,
  p_floor text default null,
  p_unit_number text default null,
  p_occupancy_status text default 'sin_datos'
)
returns public.functional_units
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_user_id uuid := auth.uid();
  v_tenant_id uuid;
  v_functional_unit public.functional_units%rowtype;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication required.';
  end if;

  if p_building_id is null then
    raise exception 'Building id is required.';
  end if;

  if nullif(trim(p_identifier), '') is null then
    raise exception 'Functional unit identifier is required.';
  end if;

  select tm.tenant_id
  into v_tenant_id
  from public.tenant_members tm
  join public.tenants t on t.id = tm.tenant_id
  where tm.user_id = v_actor_user_id
    and tm.role = 'tenant_admin'
    and tm.status = 'active'
    and t.status = 'active'
  limit 1;

  if v_tenant_id is null then
    raise exception 'Active tenant_admin membership required.';
  end if;

  if not exists (
    select 1
    from public.buildings b
    where b.id = p_building_id
      and b.tenant_id = v_tenant_id
      and b.status = 'active'
  ) then
    raise exception 'Building not found.';
  end if;

  insert into public.functional_units (
    tenant_id,
    building_id,
    type,
    identifier,
    floor,
    unit_number,
    occupancy_status,
    status,
    archived_at
  )
  values (
    v_tenant_id,
    p_building_id,
    p_type,
    trim(p_identifier),
    nullif(trim(p_floor), ''),
    nullif(trim(p_unit_number), ''),
    coalesce(nullif(trim(p_occupancy_status), ''), 'sin_datos'),
    'active',
    null
  )
  returning * into v_functional_unit;

  insert into public.audit_logs (
    actor_user_id,
    actor_role,
    tenant_id,
    building_id,
    action,
    entity_type,
    entity_id,
    metadata
  )
  values (
    v_actor_user_id,
    'tenant_admin',
    v_tenant_id,
    p_building_id,
    'functional_unit_created',
    'functional_unit',
    v_functional_unit.id,
    jsonb_build_object(
      'type', v_functional_unit.type,
      'identifier', v_functional_unit.identifier,
      'floor', v_functional_unit.floor,
      'unit_number', v_functional_unit.unit_number,
      'occupancy_status', v_functional_unit.occupancy_status
    )
  );

  return v_functional_unit;
end;
$$;

create or replace function public.update_functional_unit(
  p_functional_unit_id uuid,
  p_type text,
  p_identifier text,
  p_floor text default null,
  p_unit_number text default null,
  p_occupancy_status text default 'sin_datos'
)
returns public.functional_units
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_user_id uuid := auth.uid();
  v_tenant_id uuid;
  v_old_functional_unit public.functional_units%rowtype;
  v_functional_unit public.functional_units%rowtype;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication required.';
  end if;

  if p_functional_unit_id is null then
    raise exception 'Functional unit id is required.';
  end if;

  if nullif(trim(p_identifier), '') is null then
    raise exception 'Functional unit identifier is required.';
  end if;

  select tm.tenant_id
  into v_tenant_id
  from public.tenant_members tm
  join public.tenants t on t.id = tm.tenant_id
  where tm.user_id = v_actor_user_id
    and tm.role = 'tenant_admin'
    and tm.status = 'active'
    and t.status = 'active'
  limit 1;

  if v_tenant_id is null then
    raise exception 'Active tenant_admin membership required.';
  end if;

  select *
  into v_old_functional_unit
  from public.functional_units
  where id = p_functional_unit_id
    and tenant_id = v_tenant_id
  for update;

  if not found then
    raise exception 'Functional unit not found.';
  end if;

  if v_old_functional_unit.status = 'archived' then
    raise exception 'Archived functional units are read-only.';
  end if;

  if not exists (
    select 1
    from public.buildings b
    where b.id = v_old_functional_unit.building_id
      and b.tenant_id = v_tenant_id
      and b.status = 'active'
  ) then
    raise exception 'Building not found.';
  end if;

  update public.functional_units
  set type = p_type,
      identifier = trim(p_identifier),
      floor = nullif(trim(p_floor), ''),
      unit_number = nullif(trim(p_unit_number), ''),
      occupancy_status = coalesce(nullif(trim(p_occupancy_status), ''), 'sin_datos')
  where id = p_functional_unit_id
    and tenant_id = v_tenant_id
    and status = 'active'
  returning * into v_functional_unit;

  insert into public.audit_logs (
    actor_user_id,
    actor_role,
    tenant_id,
    building_id,
    action,
    entity_type,
    entity_id,
    metadata
  )
  values (
    v_actor_user_id,
    'tenant_admin',
    v_tenant_id,
    v_functional_unit.building_id,
    'functional_unit_updated',
    'functional_unit',
    v_functional_unit.id,
    jsonb_build_object(
      'old', jsonb_build_object(
        'type', v_old_functional_unit.type,
        'identifier', v_old_functional_unit.identifier,
        'floor', v_old_functional_unit.floor,
        'unit_number', v_old_functional_unit.unit_number,
        'occupancy_status', v_old_functional_unit.occupancy_status
      ),
      'new', jsonb_build_object(
        'type', v_functional_unit.type,
        'identifier', v_functional_unit.identifier,
        'floor', v_functional_unit.floor,
        'unit_number', v_functional_unit.unit_number,
        'occupancy_status', v_functional_unit.occupancy_status
      )
    )
  );

  return v_functional_unit;
end;
$$;

create or replace function public.archive_functional_unit(
  p_functional_unit_id uuid
)
returns public.functional_units
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_user_id uuid := auth.uid();
  v_tenant_id uuid;
  v_old_functional_unit public.functional_units%rowtype;
  v_functional_unit public.functional_units%rowtype;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication required.';
  end if;

  if p_functional_unit_id is null then
    raise exception 'Functional unit id is required.';
  end if;

  select tm.tenant_id
  into v_tenant_id
  from public.tenant_members tm
  join public.tenants t on t.id = tm.tenant_id
  where tm.user_id = v_actor_user_id
    and tm.role = 'tenant_admin'
    and tm.status = 'active'
    and t.status = 'active'
  limit 1;

  if v_tenant_id is null then
    raise exception 'Active tenant_admin membership required.';
  end if;

  select *
  into v_old_functional_unit
  from public.functional_units
  where id = p_functional_unit_id
    and tenant_id = v_tenant_id
  for update;

  if not found then
    raise exception 'Functional unit not found.';
  end if;

  if v_old_functional_unit.status = 'archived' then
    return v_old_functional_unit;
  end if;

  if not exists (
    select 1
    from public.buildings b
    where b.id = v_old_functional_unit.building_id
      and b.tenant_id = v_tenant_id
      and b.status = 'active'
  ) then
    raise exception 'Building not found.';
  end if;

  update public.functional_units
  set status = 'archived',
      archived_at = now()
  where id = p_functional_unit_id
    and tenant_id = v_tenant_id
    and status = 'active'
  returning * into v_functional_unit;

  insert into public.audit_logs (
    actor_user_id,
    actor_role,
    tenant_id,
    building_id,
    action,
    entity_type,
    entity_id,
    metadata
  )
  values (
    v_actor_user_id,
    'tenant_admin',
    v_tenant_id,
    v_functional_unit.building_id,
    'functional_unit_archived',
    'functional_unit',
    v_functional_unit.id,
    jsonb_build_object('archived_at', v_functional_unit.archived_at)
  );

  return v_functional_unit;
end;
$$;

create or replace function public.unarchive_functional_unit(
  p_functional_unit_id uuid
)
returns public.functional_units
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_user_id uuid := auth.uid();
  v_tenant_id uuid;
  v_old_functional_unit public.functional_units%rowtype;
  v_functional_unit public.functional_units%rowtype;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication required.';
  end if;

  if p_functional_unit_id is null then
    raise exception 'Functional unit id is required.';
  end if;

  select tm.tenant_id
  into v_tenant_id
  from public.tenant_members tm
  join public.tenants t on t.id = tm.tenant_id
  where tm.user_id = v_actor_user_id
    and tm.role = 'tenant_admin'
    and tm.status = 'active'
    and t.status = 'active'
  limit 1;

  if v_tenant_id is null then
    raise exception 'Active tenant_admin membership required.';
  end if;

  select *
  into v_old_functional_unit
  from public.functional_units
  where id = p_functional_unit_id
    and tenant_id = v_tenant_id
  for update;

  if not found then
    raise exception 'Functional unit not found.';
  end if;

  if v_old_functional_unit.status = 'active' then
    return v_old_functional_unit;
  end if;

  if not exists (
    select 1
    from public.buildings b
    where b.id = v_old_functional_unit.building_id
      and b.tenant_id = v_tenant_id
      and b.status = 'active'
  ) then
    raise exception 'Building not found.';
  end if;

  update public.functional_units
  set status = 'active',
      archived_at = null
  where id = p_functional_unit_id
    and tenant_id = v_tenant_id
    and status = 'archived'
  returning * into v_functional_unit;

  insert into public.audit_logs (
    actor_user_id,
    actor_role,
    tenant_id,
    building_id,
    action,
    entity_type,
    entity_id,
    metadata
  )
  values (
    v_actor_user_id,
    'tenant_admin',
    v_tenant_id,
    v_functional_unit.building_id,
    'functional_unit_unarchived',
    'functional_unit',
    v_functional_unit.id,
    jsonb_build_object('previous_archived_at', v_old_functional_unit.archived_at)
  );

  return v_functional_unit;
end;
$$;

revoke all on public.functional_units from anon;
revoke insert, update, delete on public.functional_units from authenticated;
grant select on public.functional_units to authenticated;

revoke all on function public.prevent_functional_unit_tenant_or_building_change() from public;
revoke all on function public.prevent_functional_unit_tenant_or_building_change() from authenticated;

revoke all on function public.validate_functional_unit_building_tenant() from public;
revoke all on function public.validate_functional_unit_building_tenant() from authenticated;

revoke all on function public.prevent_archived_functional_unit_edit() from public;
revoke all on function public.prevent_archived_functional_unit_edit() from authenticated;

revoke all on function public.create_functional_unit(uuid, text, text, text, text, text) from public;
grant execute on function public.create_functional_unit(uuid, text, text, text, text, text) to authenticated;

revoke all on function public.update_functional_unit(uuid, text, text, text, text, text) from public;
grant execute on function public.update_functional_unit(uuid, text, text, text, text, text) to authenticated;

revoke all on function public.archive_functional_unit(uuid) from public;
grant execute on function public.archive_functional_unit(uuid) to authenticated;

revoke all on function public.unarchive_functional_unit(uuid) from public;
grant execute on function public.unarchive_functional_unit(uuid) to authenticated;
