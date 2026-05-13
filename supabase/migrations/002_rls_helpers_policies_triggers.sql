alter table public.profiles enable row level security;
alter table public.admin_requests enable row level security;
alter table public.tenants enable row level security;
alter table public.tenant_members enable row level security;
alter table public.buildings enable row level security;
alter table public.audit_logs enable row level security;

create or replace function public.is_superadmin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.global_role = 'superadmin'
      and p.status = 'active'
  );
$$;

create or replace function public.is_active_tenant_admin(target_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.tenant_members tm
    join public.tenants t on t.id = tm.tenant_id
    where tm.user_id = auth.uid()
      and tm.tenant_id = target_tenant_id
      and tm.role = 'tenant_admin'
      and tm.status = 'active'
      and t.status = 'active'
  );
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.log_audit_event(
  p_actor_user_id uuid default null,
  p_actor_role text default null,
  p_tenant_id uuid default null,
  p_building_id uuid default null,
  p_action text default null,
  p_entity_type text default null,
  p_entity_id uuid default null,
  p_metadata jsonb default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_user_id uuid := auth.uid();
  v_actor_role text := null;
  v_log_id uuid;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication required to write audit logs.';
  end if;

  if p_actor_user_id is not null and p_actor_user_id <> v_actor_user_id then
    raise exception 'Audit actor_user_id must match the authenticated user.';
  end if;

  if p_action is null or p_entity_type is null then
    raise exception 'Audit action and entity_type are required.';
  end if;

  if p_action not in (
    'admin_request_created',
    'admin_request_approved',
    'admin_request_rejected',
    'tenant_created',
    'tenant_activated',
    'tenant_admin_assigned',
    'tenant_admin_disabled',
    'user_approved',
    'user_rejected',
    'building_created',
    'building_updated',
    'building_archived',
    'building_unarchived'
  ) then
    raise exception 'Unsupported audit action: %', p_action;
  end if;

  if public.is_superadmin() then
    v_actor_role := 'superadmin';
  elsif p_tenant_id is not null and public.is_active_tenant_admin(p_tenant_id) then
    v_actor_role := 'tenant_admin';
  elsif p_tenant_id is null and p_action = 'admin_request_created' then
    v_actor_role := null;
  else
    raise exception 'User is not allowed to write this audit log.';
  end if;

  if p_actor_role is not null and p_actor_role <> v_actor_role then
    raise exception 'Audit actor_role does not match the authenticated role.';
  end if;

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
    v_actor_role,
    p_tenant_id,
    p_building_id,
    p_action,
    p_entity_type,
    p_entity_id,
    p_metadata
  )
  returning id into v_log_id;

  return v_log_id;
end;
$$;

create or replace function public.approve_admin_request(
  p_admin_request_id uuid,
  p_tenant_name text default null,
  p_tenant_legal_name text default null,
  p_tenant_cuit text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_request public.admin_requests%rowtype;
  v_tenant_id uuid;
  v_tenant_name text;
begin
  if not public.is_superadmin() then
    raise exception 'Only superadmins can approve admin requests.';
  end if;

  select *
  into v_request
  from public.admin_requests
  where id = p_admin_request_id
  for update;

  if not found then
    raise exception 'Admin request not found.';
  end if;

  if v_request.status <> 'pending' then
    raise exception 'Only pending admin requests can be approved.';
  end if;

  v_tenant_name := coalesce(nullif(trim(p_tenant_name), ''), v_request.company_name);

  update public.admin_requests
  set status = 'approved',
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      rejection_reason = null
  where id = v_request.id;

  update public.profiles
  set status = 'active',
      full_name = coalesce(public.profiles.full_name, v_request.full_name),
      email = v_request.email
  where id = v_request.user_id;

  if not found then
    raise exception 'Profile not found for admin request user.';
  end if;

  insert into public.tenants (
    name,
    legal_name,
    cuit,
    status
  )
  values (
    v_tenant_name,
    coalesce(nullif(trim(p_tenant_legal_name), ''), v_request.company_name),
    coalesce(nullif(trim(p_tenant_cuit), ''), v_request.cuit),
    'active'
  )
  returning id into v_tenant_id;

  insert into public.tenant_members (
    tenant_id,
    user_id,
    role,
    status
  )
  values (
    v_tenant_id,
    v_request.user_id,
    'tenant_admin',
    'active'
  );

  insert into public.audit_logs (
    actor_user_id,
    actor_role,
    tenant_id,
    action,
    entity_type,
    entity_id,
    metadata
  )
  values
    (
      auth.uid(),
      'superadmin',
      v_tenant_id,
      'admin_request_approved',
      'admin_request',
      v_request.id,
      jsonb_build_object('approved_user_id', v_request.user_id)
    ),
    (
      auth.uid(),
      'superadmin',
      v_tenant_id,
      'tenant_created',
      'tenant',
      v_tenant_id,
      jsonb_build_object('admin_request_id', v_request.id)
    ),
    (
      auth.uid(),
      'superadmin',
      v_tenant_id,
      'tenant_admin_assigned',
      'tenant_member',
      v_request.user_id,
      jsonb_build_object('admin_request_id', v_request.id, 'role', 'tenant_admin')
    ),
    (
      auth.uid(),
      'superadmin',
      v_tenant_id,
      'user_approved',
      'profile',
      v_request.user_id,
      jsonb_build_object('admin_request_id', v_request.id)
    );

  return v_tenant_id;
end;
$$;

create or replace function public.reject_admin_request(
  p_admin_request_id uuid,
  p_rejection_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_request public.admin_requests%rowtype;
begin
  if not public.is_superadmin() then
    raise exception 'Only superadmins can reject admin requests.';
  end if;

  select *
  into v_request
  from public.admin_requests
  where id = p_admin_request_id
  for update;

  if not found then
    raise exception 'Admin request not found.';
  end if;

  if v_request.status <> 'pending' then
    raise exception 'Only pending admin requests can be rejected.';
  end if;

  update public.admin_requests
  set status = 'rejected',
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      rejection_reason = nullif(trim(p_rejection_reason), '')
  where id = v_request.id;

  update public.profiles
  set status = 'rejected',
      full_name = coalesce(public.profiles.full_name, v_request.full_name),
      email = v_request.email
  where id = v_request.user_id;

  if not found then
    raise exception 'Profile not found for admin request user.';
  end if;

  insert into public.audit_logs (
    actor_user_id,
    actor_role,
    action,
    entity_type,
    entity_id,
    metadata
  )
  values
    (
      auth.uid(),
      'superadmin',
      'admin_request_rejected',
      'admin_request',
      v_request.id,
      jsonb_build_object('rejected_user_id', v_request.user_id)
    ),
    (
      auth.uid(),
      'superadmin',
      'user_rejected',
      'profile',
      v_request.user_id,
      jsonb_build_object('admin_request_id', v_request.id)
    );
end;
$$;

create or replace function public.prevent_building_tenant_id_change()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if old.tenant_id is distinct from new.tenant_id then
    raise exception 'buildings.tenant_id cannot be changed.';
  end if;

  return new;
end;
$$;

create or replace function public.prevent_archived_building_edit()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if old.status = 'archived' then
    if new.status = 'active'
      and new.archived_at is null
      and new.tenant_id = old.tenant_id
      and new.name = old.name
      and new.address is not distinct from old.address
      and new.cuit is not distinct from old.cuit
    then
      return new;
    end if;

    raise exception 'Archived buildings are read-only and can only be unarchived.';
  end if;

  return new;
end;
$$;

create or replace function public.prevent_audit_logs_update()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  raise exception 'audit_logs is append-only and cannot be updated.';
end;
$$;

create or replace function public.prevent_audit_logs_delete()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  raise exception 'audit_logs is append-only and cannot be deleted.';
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create trigger admin_requests_set_updated_at
before update on public.admin_requests
for each row
execute function public.set_updated_at();

create trigger tenants_set_updated_at
before update on public.tenants
for each row
execute function public.set_updated_at();

create trigger tenant_members_set_updated_at
before update on public.tenant_members
for each row
execute function public.set_updated_at();

create trigger buildings_set_updated_at
before update on public.buildings
for each row
execute function public.set_updated_at();

create trigger buildings_prevent_tenant_id_change
before update on public.buildings
for each row
execute function public.prevent_building_tenant_id_change();

create trigger buildings_prevent_archived_edit
before update on public.buildings
for each row
execute function public.prevent_archived_building_edit();

create trigger audit_logs_prevent_update
before update on public.audit_logs
for each row
execute function public.prevent_audit_logs_update();

create trigger audit_logs_prevent_delete
before delete on public.audit_logs
for each row
execute function public.prevent_audit_logs_delete();

create policy profiles_select_own_or_superadmin
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or public.is_superadmin()
);

create policy profiles_insert_own_pending
on public.profiles
for insert
to authenticated
with check (
  id = auth.uid()
  and global_role is null
  and status = 'pending'
  and email = auth.jwt() ->> 'email'
);

create policy profiles_update_superadmin
on public.profiles
for update
to authenticated
using (public.is_superadmin())
with check (public.is_superadmin());

create policy admin_requests_insert_own_pending
on public.admin_requests
for insert
to authenticated
with check (
  user_id = auth.uid()
  and status = 'pending'
  and email = auth.jwt() ->> 'email'
);

create policy admin_requests_select_own_or_superadmin
on public.admin_requests
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_superadmin()
);

create policy admin_requests_update_superadmin
on public.admin_requests
for update
to authenticated
using (public.is_superadmin())
with check (public.is_superadmin());

create policy tenants_select_member_or_superadmin
on public.tenants
for select
to authenticated
using (
  public.is_superadmin()
  or public.is_active_tenant_admin(id)
);

create policy tenants_insert_superadmin
on public.tenants
for insert
to authenticated
with check (public.is_superadmin());

create policy tenants_update_superadmin
on public.tenants
for update
to authenticated
using (public.is_superadmin())
with check (public.is_superadmin());

create policy tenant_members_select_own_or_superadmin
on public.tenant_members
for select
to authenticated
using (
  public.is_superadmin()
  or user_id = auth.uid()
);

create policy tenant_members_insert_superadmin
on public.tenant_members
for insert
to authenticated
with check (public.is_superadmin());

create policy tenant_members_update_superadmin
on public.tenant_members
for update
to authenticated
using (public.is_superadmin())
with check (public.is_superadmin());

create policy buildings_select_tenant_admin_or_superadmin
on public.buildings
for select
to authenticated
using (
  public.is_superadmin()
  or public.is_active_tenant_admin(tenant_id)
);

create policy buildings_insert_tenant_admin
on public.buildings
for insert
to authenticated
with check (
  public.is_active_tenant_admin(tenant_id)
);

create policy buildings_update_tenant_admin_or_superadmin
on public.buildings
for update
to authenticated
using (
  public.is_superadmin()
  or public.is_active_tenant_admin(tenant_id)
)
with check (
  public.is_superadmin()
  or public.is_active_tenant_admin(tenant_id)
);

create policy audit_logs_select_superadmin
on public.audit_logs
for select
to authenticated
using (public.is_superadmin());

revoke all on function public.is_superadmin() from public;
grant execute on function public.is_superadmin() to authenticated;

revoke all on function public.is_active_tenant_admin(uuid) from public;
grant execute on function public.is_active_tenant_admin(uuid) to authenticated;

revoke all on function public.set_updated_at() from public;
revoke all on function public.set_updated_at() from authenticated;

revoke all on function public.prevent_building_tenant_id_change() from public;
revoke all on function public.prevent_building_tenant_id_change() from authenticated;

revoke all on function public.prevent_archived_building_edit() from public;
revoke all on function public.prevent_archived_building_edit() from authenticated;

revoke all on function public.prevent_audit_logs_update() from public;
revoke all on function public.prevent_audit_logs_update() from authenticated;

revoke all on function public.prevent_audit_logs_delete() from public;
revoke all on function public.prevent_audit_logs_delete() from authenticated;

revoke all on function public.approve_admin_request(uuid, text, text, text) from public;
grant execute on function public.approve_admin_request(uuid, text, text, text) to authenticated;

revoke all on function public.reject_admin_request(uuid, text) from public;
grant execute on function public.reject_admin_request(uuid, text) to authenticated;

revoke all on function public.log_audit_event(uuid, text, uuid, uuid, text, text, uuid, jsonb) from public;
revoke all on function public.log_audit_event(uuid, text, uuid, uuid, text, text, uuid, jsonb) from authenticated;
