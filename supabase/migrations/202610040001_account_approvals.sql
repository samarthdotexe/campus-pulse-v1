-- Secure account settings, membership approval, and private user avatars.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'role_request_status') then
    create type public.role_request_status as enum ('pending', 'approved', 'rejected');
  end if;
end;
$$;

alter table public.profiles add column if not exists avatar_path text;

create table if not exists public.approval_admins (
  email text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);

insert into public.approval_admins (email)
values ('samarthrathod161207@gmail.com')
on conflict (email) do nothing;

create table if not exists public.role_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  requested_role public.user_role not null check (requested_role in ('committee', 'admin')),
  requested_club_slug text references public.clubs(slug) on delete set null,
  status public.role_request_status not null default 'pending',
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  check (
    (requested_role = 'committee' and requested_club_slug is not null)
    or (requested_role = 'admin' and requested_club_slug is null)
  ),
  check (
    (status = 'pending' and reviewed_by is null and reviewed_at is null)
    or (status in ('approved', 'rejected') and reviewed_by is not null and reviewed_at is not null)
  )
);

create unique index if not exists role_requests_one_pending_per_user_idx
  on public.role_requests (user_id)
  where status = 'pending';

create index if not exists role_requests_status_created_at_idx
  on public.role_requests (status, created_at);

alter table public.approval_admins enable row level security;
alter table public.role_requests enable row level security;

revoke all on public.approval_admins from anon, authenticated;
revoke all on public.role_requests from anon, authenticated;
revoke update on public.profiles from authenticated;
grant select on public.role_requests to authenticated;

create or replace function public.is_approval_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.approval_admins
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke all on function public.is_approval_admin() from public;
grant execute on function public.is_approval_admin() to authenticated;

create or replace function public.request_role(
  p_requested_role public.user_role,
  p_requested_club_slug text default null
)
returns public.role_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  request_row public.role_requests;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to request a role.';
  end if;

  if p_requested_role not in ('committee', 'admin') then
    raise exception 'Only Club Member or Faculty Member/Admin access can be requested.';
  end if;

  if (p_requested_role = 'committee' and nullif(trim(coalesce(p_requested_club_slug, '')), '') is null)
    or (p_requested_role = 'admin' and p_requested_club_slug is not null) then
    raise exception 'The requested role and club selection do not match.';
  end if;

  insert into public.role_requests (user_id, requested_role, requested_club_slug)
  values (
    auth.uid(),
    p_requested_role,
    case when p_requested_role = 'committee' then trim(p_requested_club_slug) else null end
  )
  returning * into request_row;

  return request_row;
exception
  when unique_violation then
    raise exception 'You already have a membership request awaiting review.';
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role public.user_role;
  requested_club_slug text;
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1), 'Campus member'));

  requested_role := case
    when new.raw_user_meta_data ->> 'requested_role' = 'committee' then 'committee'::public.user_role
    when new.raw_user_meta_data ->> 'requested_role' = 'admin' then 'admin'::public.user_role
    else null
  end;
  requested_club_slug := nullif(trim(coalesce(new.raw_user_meta_data ->> 'requested_club_slug', '')), '');

  if requested_role = 'committee' and requested_club_slug is not null then
    insert into public.role_requests (user_id, requested_role, requested_club_slug)
    values (new.id, requested_role, requested_club_slug);
  elsif requested_role = 'admin' and requested_club_slug is null then
    insert into public.role_requests (user_id, requested_role)
    values (new.id, requested_role);
  end if;

  return new;
end;
$$;

create or replace function public.decide_role_request(
  p_request_id uuid,
  p_decision public.role_request_status
)
returns public.role_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  request_row public.role_requests;
begin
  if not public.is_approval_admin() then
    raise exception 'Only an approved team email can review membership requests.';
  end if;

  if p_decision not in ('approved', 'rejected') then
    raise exception 'A membership request can only be approved or rejected.';
  end if;

  select * into request_row
  from public.role_requests
  where id = p_request_id and status = 'pending'
  for update;

  if not found then
    raise exception 'This membership request is no longer pending.';
  end if;

  if p_decision = 'approved' then
    update public.profiles
    set role = request_row.requested_role,
        club_slug = case when request_row.requested_role = 'committee' then request_row.requested_club_slug else null end
    where id = request_row.user_id;
  end if;

  update public.role_requests
  set status = p_decision,
      reviewed_by = auth.uid(),
      reviewed_at = now()
  where id = p_request_id
  returning * into request_row;

  return request_row;
end;
$$;

create or replace function public.update_my_profile(
  p_name text,
  p_avatar_path text default null
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_row public.profiles;
  normalized_name text := trim(coalesce(p_name, ''));
  normalized_avatar_path text := nullif(trim(coalesce(p_avatar_path, '')), '');
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to update your profile.';
  end if;

  if char_length(normalized_name) not between 2 and 80 then
    raise exception 'Your display name must contain between 2 and 80 characters.';
  end if;

  if normalized_avatar_path is not null
    and normalized_avatar_path not like auth.uid()::text || '/%' then
    raise exception 'You can only use an avatar stored in your own folder.';
  end if;

  update public.profiles
  set name = normalized_name,
      avatar_path = normalized_avatar_path
  where id = auth.uid()
  returning * into profile_row;

  return profile_row;
end;
$$;

create or replace function public.list_pending_role_requests()
returns table (
  id uuid,
  user_id uuid,
  requester_name text,
  requester_email text,
  requested_role public.user_role,
  requested_club_slug text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public, auth
as $$
  select request.id,
         request.user_id,
         profile.name,
         account.email,
         request.requested_role,
         request.requested_club_slug,
         request.created_at
  from public.role_requests request
  join public.profiles profile on profile.id = request.user_id
  join auth.users account on account.id = request.user_id
  where request.status = 'pending'
    and public.is_approval_admin()
  order by request.created_at asc;
$$;

revoke all on function public.request_role(public.user_role, text) from public;
revoke all on function public.decide_role_request(uuid, public.role_request_status) from public;
revoke all on function public.update_my_profile(text, text) from public;
revoke all on function public.list_pending_role_requests() from public;
grant execute on function public.request_role(public.user_role, text) to authenticated;
grant execute on function public.decide_role_request(uuid, public.role_request_status) to authenticated;
grant execute on function public.update_my_profile(text, text) to authenticated;
grant execute on function public.list_pending_role_requests() to authenticated;

create policy "Users can read their own role requests" on public.role_requests
  for select to authenticated
  using ((select auth.uid()) = user_id or (select public.is_approval_admin()));

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', false)
on conflict (id) do update set public = false;

create policy "Users read their own avatars" on storage.objects
  for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid()::text));

create policy "Users upload their own avatars" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid()::text));

create policy "Users update their own avatars" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid()::text))
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid()::text));

create policy "Users delete their own avatars" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid()::text));
