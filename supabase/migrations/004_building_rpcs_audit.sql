create or replace function public.create_building(
  p_name text,
  p_address text default null,
  p_cuit text default null
)
returns public.buildings
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_user_id uuid := auth.uid();
  v_tenant_id uuid;
  v_building public.buildings%rowtype;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication required.';
  end if;

  if nullif(trim(p_name), '') is null then
    raise exception 'Building name is required.';
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

  insert into public.buildings (
    tenant_id,
    name,
    address,
    cuit,
    status,
    archived_at
  )
  values (
    v_tenant_id,
    trim(p_name),
    nullif(trim(p_address), ''),
    nullif(trim(p_cuit), ''),
    'active',
    null
  )
  returning * into v_building;

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
    v_building.id,
    'building_created',
    'building',
    v_building.id,
    jsonb_build_object(
      'name', v_building.name,
      'address', v_building.address,
      'cuit', v_building.cuit
    )
  );

  return v_building;
end;
$$;

create or replace function public.update_building(
  p_building_id uuid,
  p_name text,
  p_address text default null,
  p_cuit text default null
)
returns public.buildings
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_user_id uuid := auth.uid();
  v_tenant_id uuid;
  v_old_building public.buildings%rowtype;
  v_building public.buildings%rowtype;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication required.';
  end if;

  if p_building_id is null then
    raise exception 'Building id is required.';
  end if;

  if nullif(trim(p_name), '') is null then
    raise exception 'Building name is required.';
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
  into v_old_building
  from public.buildings
  where id = p_building_id
    and tenant_id = v_tenant_id
  for update;

  if not found then
    raise exception 'Building not found.';
  end if;

  if v_old_building.status = 'archived' then
    raise exception 'Archived buildings are read-only.';
  end if;

  update public.buildings
  set name = trim(p_name),
      address = nullif(trim(p_address), ''),
      cuit = nullif(trim(p_cuit), '')
  where id = p_building_id
    and tenant_id = v_tenant_id
    and status = 'active'
  returning * into v_building;

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
    v_building.id,
    'building_updated',
    'building',
    v_building.id,
    jsonb_build_object(
      'old', jsonb_build_object(
        'name', v_old_building.name,
        'address', v_old_building.address,
        'cuit', v_old_building.cuit
      ),
      'new', jsonb_build_object(
        'name', v_building.name,
        'address', v_building.address,
        'cuit', v_building.cuit
      )
    )
  );

  return v_building;
end;
$$;

create or replace function public.archive_building(
  p_building_id uuid
)
returns public.buildings
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_user_id uuid := auth.uid();
  v_tenant_id uuid;
  v_old_building public.buildings%rowtype;
  v_building public.buildings%rowtype;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication required.';
  end if;

  if p_building_id is null then
    raise exception 'Building id is required.';
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
  into v_old_building
  from public.buildings
  where id = p_building_id
    and tenant_id = v_tenant_id
  for update;

  if not found then
    raise exception 'Building not found.';
  end if;

  if v_old_building.status = 'archived' then
    return v_old_building;
  end if;

  update public.buildings
  set status = 'archived',
      archived_at = now()
  where id = p_building_id
    and tenant_id = v_tenant_id
    and status = 'active'
  returning * into v_building;

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
    v_building.id,
    'building_archived',
    'building',
    v_building.id,
    jsonb_build_object('archived_at', v_building.archived_at)
  );

  return v_building;
end;
$$;

create or replace function public.unarchive_building(
  p_building_id uuid
)
returns public.buildings
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_user_id uuid := auth.uid();
  v_tenant_id uuid;
  v_old_building public.buildings%rowtype;
  v_building public.buildings%rowtype;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication required.';
  end if;

  if p_building_id is null then
    raise exception 'Building id is required.';
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
  into v_old_building
  from public.buildings
  where id = p_building_id
    and tenant_id = v_tenant_id
  for update;

  if not found then
    raise exception 'Building not found.';
  end if;

  if v_old_building.status = 'active' then
    return v_old_building;
  end if;

  update public.buildings
  set status = 'active',
      archived_at = null
  where id = p_building_id
    and tenant_id = v_tenant_id
    and status = 'archived'
  returning * into v_building;

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
    v_building.id,
    'building_unarchived',
    'building',
    v_building.id,
    jsonb_build_object('previous_archived_at', v_old_building.archived_at)
  );

  return v_building;
end;
$$;

revoke insert, update on public.buildings from authenticated;
grant select on public.buildings to authenticated;

revoke all on function public.create_building(text, text, text) from public;
grant execute on function public.create_building(text, text, text) to authenticated;

revoke all on function public.update_building(uuid, text, text, text) from public;
grant execute on function public.update_building(uuid, text, text, text) to authenticated;

revoke all on function public.archive_building(uuid) from public;
grant execute on function public.archive_building(uuid) to authenticated;

revoke all on function public.unarchive_building(uuid) from public;
grant execute on function public.unarchive_building(uuid) to authenticated;
