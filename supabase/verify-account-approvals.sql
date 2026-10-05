-- Run after 202610040001_account_approvals.sql in the Supabase SQL Editor.
-- This file intentionally creates no users or persistent test records.

do $$
begin
  if to_regclass('public.approval_admins') is null then
    raise exception 'approval_admins table is missing';
  end if;

  if to_regclass('public.role_requests') is null then
    raise exception 'role_requests table is missing';
  end if;

  if to_regprocedure('public.is_approval_admin()') is null then
    raise exception 'is_approval_admin() is missing';
  end if;

  if to_regprocedure('public.request_role(public.user_role,text)') is null then
    raise exception 'request_role(user_role, text) is missing';
  end if;

  if to_regprocedure('public.decide_role_request(uuid,public.role_request_status)') is null then
    raise exception 'decide_role_request(uuid, role_request_status) is missing';
  end if;

  if to_regprocedure('public.update_my_profile(text,text)') is null then
    raise exception 'update_my_profile(text, text) is missing';
  end if;

  if not exists (
    select 1 from public.approval_admins
    where email = 'samarthrathod161207@gmail.com'
  ) then
    raise exception 'initial approver is missing';
  end if;

  if not exists (
    select 1 from storage.buckets
    where id = 'avatars' and public = false
  ) then
    raise exception 'private avatars bucket is missing';
  end if;
end;
$$;

-- Manual policy checks (use real non-production accounts only):
-- 1. A participant creates a Club Member request with request_role('committee', '<club-slug>').
-- 2. Attempt direct UPDATE of profiles.role and role_requests.status as that participant; both must fail.
-- 3. Sign in as samarthrathod161207@gmail.com and decide_role_request(..., 'approved').
-- 4. Verify the requester profile has the approved role and that an unrelated user cannot call the decision RPC.
