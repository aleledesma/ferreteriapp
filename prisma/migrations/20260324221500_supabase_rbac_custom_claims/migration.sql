-- Prisma migration: Supabase RBAC + custom claims
-- Incluye objetos no expresables en Prisma Schema (funciones, trigger, grants, policies).

create table if not exists public.app_roles (
  id bigserial primary key,
  name text not null unique,
  is_system boolean not null default true,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint app_roles_name_uppercase check (name = upper(name))
);

create table if not exists public.app_permissions (
  id bigserial primary key,
  name text not null unique,
  description text null,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.app_role_permissions (
  role_id bigint not null references public.app_roles(id) on delete cascade,
  permission_id bigint not null references public.app_permissions(id) on delete cascade,
  created_at timestamptz not null default timezone('utc'::text, now()),
  primary key (role_id, permission_id)
);

create table if not exists public.app_user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role_id bigint not null references public.app_roles(id),
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_app_role_permissions_role_id
  on public.app_role_permissions(role_id);

create index if not exists idx_app_role_permissions_permission_id
  on public.app_role_permissions(permission_id);

create index if not exists idx_app_user_roles_role_id
  on public.app_user_roles(role_id);

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
  user_role := coalesce(upper((auth.jwt() ->> 'app_role')), 'INACTIVE');

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
  select roles.name
    into role_name
  from public.app_user_roles user_roles
  join public.app_roles roles
    on roles.id = user_roles.role_id
  where user_roles.user_id = (event ->> 'user_id')::uuid;

  claims := coalesce(event -> 'claims', '{}'::jsonb);

  claims := jsonb_set(
    claims,
    '{app_role}',
    to_jsonb(coalesce(role_name, 'INACTIVE')),
    true
  );

  event := jsonb_set(event, '{claims}', claims, true);
  return event;
end;
$$;

create or replace function public.assign_default_inactive_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  inactive_role_id bigint;
begin
  select id
    into inactive_role_id
  from public.app_roles
  where name = 'INACTIVE';

  if inactive_role_id is null then
    raise exception 'No existe el rol INACTIVE en public.app_roles';
  end if;

  insert into public.app_user_roles(user_id, role_id)
  values (new.id, inactive_role_id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_assign_inactive on auth.users;

create trigger on_auth_user_created_assign_inactive
after insert on auth.users
for each row
execute function public.assign_default_inactive_role();

grant usage on schema public to authenticated;
grant usage on schema public to supabase_auth_admin;

grant execute
  on function public.authorize(text)
  to authenticated;

revoke execute
  on function public.authorize(text)
  from anon, public;

grant execute
  on function public.custom_access_token_hook(jsonb)
  to supabase_auth_admin;

revoke execute
  on function public.custom_access_token_hook(jsonb)
  from authenticated, anon, public;

revoke all on table public.app_roles from anon, public;
revoke all on table public.app_permissions from anon, public;
revoke all on table public.app_role_permissions from anon, public;
revoke all on table public.app_user_roles from anon, public;

grant select on table public.app_roles to authenticated;
grant select on table public.app_permissions to authenticated;
grant select on table public.app_role_permissions to authenticated;
grant select on table public.app_user_roles to authenticated;

grant select on table public.app_roles to supabase_auth_admin;
grant select on table public.app_user_roles to supabase_auth_admin;

alter table public.app_user_roles enable row level security;

drop policy if exists "app_user_roles_select_own" on public.app_user_roles;
create policy "app_user_roles_select_own"
on public.app_user_roles
for select
to authenticated
using (
  auth.uid() = user_id
  or (select public.authorize('*'))
);

drop policy if exists "app_user_roles_manage_admin" on public.app_user_roles;
create policy "app_user_roles_manage_admin"
on public.app_user_roles
for all
to authenticated
using ((select public.authorize('*')))
with check ((select public.authorize('*')));

drop policy if exists "app_user_roles_auth_admin_select" on public.app_user_roles;
create policy "app_user_roles_auth_admin_select"
on public.app_user_roles
for select
to supabase_auth_admin
using (true);
