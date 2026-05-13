grant usage on schema public to authenticated;

grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.admin_requests to authenticated;
grant select, insert, update on public.tenants to authenticated;
grant select, insert, update on public.tenant_members to authenticated;
grant select, insert, update on public.buildings to authenticated;

grant select on public.audit_logs to authenticated;
