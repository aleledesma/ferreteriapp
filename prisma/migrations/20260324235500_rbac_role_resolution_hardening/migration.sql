-- Harden role resolution for Supabase custom claims + RBAC.
-- 1) Add DB source-of-truth helper for current user's app role.
-- 2) Make authorize() prefer DB role and only then JWT custom claims.
-- 3) Emit compatible custom-claim keys in access token hook.

create or replace function public.get_app_role_for_user(target_user_id uuid)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  role_name text;
begin
  select roles.name
    into role_name
  from public.app_user_roles user_roles
  join public.app_roles roles
    on roles.id = user_roles.role_id
  where user_roles.user_id = target_user_id;

  return coalesce(role_name, 'INACTIVE');
end;
$$;

grant execute
  on function public.get_app_role_for_user(uuid)
  to supabase_auth_admin;

revoke execute
  on function public.get_app_role_for_user(uuid)
  from authenticated, anon, public;

create or replace function public.get_my_app_role()
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  return public.get_app_role_for_user(auth.uid());
end;
$$;

grant execute
  on function public.get_my_app_role()
  to authenticated;

grant execute
  on function public.get_my_app_role()
  to supabase_auth_admin;

revoke execute
  on function public.get_my_app_role()
  from anon, public;

create or replace function public.authorize(requested_permission text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  user_role text;
  has_permission boolean;
begin
  user_role := upper(public.get_my_app_role());

  select exists (
    select 1
    from public.app_roles roles
    join public.app_role_permissions role_permissions
      on role_permissions.role_id = roles.id
    join public.app_permissions permissions
      on permissions.id = role_permissions.permission_id
    where roles.name = user_role
      and permissions.name in (requested_permission, '*')
  )
  into has_permission;

  return coalesce(has_permission, false);
end;
$$;

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  claims jsonb;
  role_name text;
begin
  role_name := upper(
    public.get_app_role_for_user((event ->> 'user_id')::uuid)
  );
  claims := coalesce(event -> 'claims', '{}'::jsonb);

  claims := jsonb_set(claims, '{app_role}', to_jsonb(role_name), true);
  claims := jsonb_set(claims, '{user_role}', to_jsonb(role_name), true);

  if jsonb_typeof(claims -> 'app_metadata') is null then
    claims := jsonb_set(claims, '{app_metadata}', '{}'::jsonb, true);
  end if;

  claims := jsonb_set(claims, '{app_metadata,app_role}', to_jsonb(role_name), true);
  claims := jsonb_set(claims, '{app_metadata,user_role}', to_jsonb(role_name), true);

  event := jsonb_set(event, '{claims}', claims, true);
  return event;
end;
$$;
