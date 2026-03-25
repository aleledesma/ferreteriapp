-- Remove legacy app-level user tables that are not used.
-- Supabase authentication uses auth.users and is intentionally untouched.

drop table if exists public."Users";
drop table if exists public."User";
