-- Granular, server-enforced Club Member access. Apply after the existing 20261005 username migrations.

create table if not exists public.club_member_permissions (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  club_slug text not null references public.clubs(slug) on delete cascade,
  can_create_events boolean not null default false,
  can_edit_events boolean not null default false,
  can_manage_rsvps boolean not null default false,
  can_edit_club boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

alter table public.club_member_permissions enable row level security;
revoke all on public.club_member_permissions from anon, authenticated;

create or replace function public.has_club_permission(p_club_id uuid, p_permission text)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin() or exists (
    select 1
    from public.profiles profile
    join public.club_member_permissions permission on permission.user_id = profile.id
    join public.clubs club on club.slug = permission.club_slug
    where profile.id = auth.uid()
      and profile.role = 'committee'
      and club.id = p_club_id
      and case p_permission
        when 'create_events' then permission.can_create_events
        when 'edit_events' then permission.can_edit_events
        when 'manage_rsvps' then permission.can_manage_rsvps
        when 'edit_club' then permission.can_edit_club
        else false
      end
  );
$$;

create or replace function public.can_manage_club(target_club_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_club_permission(target_club_id, 'edit_events')
      or public.has_club_permission(target_club_id, 'manage_rsvps');
$$;

drop policy if exists "Organizers create events for their club" on public.events;
drop policy if exists "Organizers update their club events" on public.events;
drop policy if exists "Organizers delete their club events" on public.events;
drop policy if exists "Organizers manage RSVP questions" on public.rsvp_questions;
drop policy if exists "Participants can read their RSVPs and organizers can track them" on public.rsvps;
drop policy if exists "Authorized members create club events" on public.events;
drop policy if exists "Authorized members edit club events" on public.events;
drop policy if exists "Authorized members delete club events" on public.events;
drop policy if exists "Authorized members manage RSVP questions" on public.rsvp_questions;
drop policy if exists "Participants and RSVP managers read RSVPs" on public.rsvps;
drop policy if exists "RSVP managers edit RSVPs" on public.rsvps;
drop policy if exists "RSVP managers delete RSVPs" on public.rsvps;
create policy "Authorized members create club events" on public.events for insert to authenticated
  with check ((select auth.uid()) = created_by and public.has_club_permission(club_id, 'create_events'));
create policy "Authorized members edit club events" on public.events for update to authenticated
  using (public.has_club_permission(club_id, 'edit_events')) with check (public.has_club_permission(club_id, 'edit_events'));
create policy "Authorized members delete club events" on public.events for delete to authenticated
  using (public.has_club_permission(club_id, 'edit_events'));
create policy "Authorized members manage RSVP questions" on public.rsvp_questions for all to authenticated
  using (exists (select 1 from public.events where events.id = event_id and public.has_club_permission(events.club_id, 'edit_events')))
  with check (exists (select 1 from public.events where events.id = event_id and public.has_club_permission(events.club_id, 'edit_events')));
create policy "Participants and RSVP managers read RSVPs" on public.rsvps for select to authenticated
  using ((select auth.uid()) = user_id or exists (select 1 from public.events where events.id = event_id and public.has_club_permission(events.club_id, 'manage_rsvps')));
create policy "RSVP managers edit RSVPs" on public.rsvps for update to authenticated
  using (exists (select 1 from public.events where events.id = event_id and public.has_club_permission(events.club_id, 'manage_rsvps')))
  with check (exists (select 1 from public.events where events.id = event_id and public.has_club_permission(events.club_id, 'manage_rsvps')));
create policy "RSVP managers delete RSVPs" on public.rsvps for delete to authenticated
  using (exists (select 1 from public.events where events.id = event_id and public.has_club_permission(events.club_id, 'manage_rsvps')));

drop policy if exists "Admins manage clubs" on public.clubs;
drop policy if exists "Admins manage all clubs" on public.clubs;
drop policy if exists "Authorized members edit their club" on public.clubs;
create policy "Admins manage all clubs" on public.clubs for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Authorized members edit their club" on public.clubs for update to authenticated
  using (public.has_club_permission(id, 'edit_club')) with check (public.has_club_permission(id, 'edit_club'));

create or replace function public.list_access_accounts()
returns table (id uuid, name text, username text, email text, role public.user_role, club_slug text, can_create_events boolean, can_edit_events boolean, can_manage_rsvps boolean, can_edit_club boolean, is_owner boolean)
language sql stable security definer set search_path = public, auth as $$
  select profile.id, profile.name, profile.username, account.email, profile.role, profile.club_slug,
    coalesce(permission.can_create_events, false), coalesce(permission.can_edit_events, false),
    coalesce(permission.can_manage_rsvps, false), coalesce(permission.can_edit_club, false),
    exists (select 1 from public.approval_admins owner where owner.email = lower(account.email))
  from public.profiles profile
  join auth.users account on account.id = profile.id
  left join public.club_member_permissions permission on permission.user_id = profile.id
  where public.is_admin()
  order by profile.role desc, profile.name asc;
$$;

create or replace function public.save_club_member_access(p_user_id uuid, p_club_slug text, p_can_create_events boolean, p_can_edit_events boolean, p_can_manage_rsvps boolean, p_can_edit_club boolean)
returns public.club_member_permissions language plpgsql security definer set search_path = public as $$
declare result public.club_member_permissions;
begin
  if not public.is_admin() then raise exception 'Faculty/Admin access is required.'; end if;
  if auth.uid() = p_user_id then raise exception 'You cannot change your own club membership here.'; end if;
  if not exists (select 1 from public.clubs where slug = p_club_slug) then raise exception 'Choose a valid club.'; end if;
  if exists (select 1 from public.profiles where id = p_user_id and role = 'admin') then raise exception 'Only the owner can change a Faculty/Admin account.'; end if;
  update public.profiles set role = 'committee', club_slug = p_club_slug where id = p_user_id;
  if not found then raise exception 'That account no longer exists.'; end if;
  insert into public.club_member_permissions (user_id, club_slug, can_create_events, can_edit_events, can_manage_rsvps, can_edit_club, updated_by)
  values (p_user_id, p_club_slug, p_can_create_events, p_can_edit_events, p_can_manage_rsvps, p_can_edit_club, auth.uid())
  on conflict (user_id) do update set club_slug = excluded.club_slug, can_create_events = excluded.can_create_events, can_edit_events = excluded.can_edit_events, can_manage_rsvps = excluded.can_manage_rsvps, can_edit_club = excluded.can_edit_club, updated_at = now(), updated_by = auth.uid()
  returning * into result;
  return result;
end;
$$;

create or replace function public.remove_club_member(p_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Faculty/Admin access is required.'; end if;
  if auth.uid() = p_user_id then raise exception 'You cannot remove yourself.'; end if;
  if exists (select 1 from public.profiles where id = p_user_id and role = 'admin') then raise exception 'Only the owner can change a Faculty/Admin account.'; end if;
  update public.profiles set role = 'participant', club_slug = null where id = p_user_id and role = 'committee';
  if not found then raise exception 'That account is not a Club Member.'; end if;
  delete from public.club_member_permissions where user_id = p_user_id;
end;
$$;

create or replace function public.set_faculty_admin_role(p_user_id uuid, p_make_admin boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_approval_admin() then raise exception 'Only the primary owner can change Faculty/Admin access.'; end if;
  if auth.uid() = p_user_id then raise exception 'You cannot change your own Faculty/Admin access.'; end if;
  if exists (select 1 from public.profiles profile join auth.users account on account.id = profile.id join public.approval_admins owner on owner.email = lower(account.email) where profile.id = p_user_id) then raise exception 'The protected owner account cannot be changed.'; end if;
  update public.profiles set role = case when p_make_admin then 'admin'::public.user_role else 'participant'::public.user_role end, club_slug = null where id = p_user_id;
  if not found then raise exception 'That account no longer exists.'; end if;
  delete from public.club_member_permissions where user_id = p_user_id;
end;
$$;

revoke all on function public.has_club_permission(uuid, text), public.list_access_accounts(), public.save_club_member_access(uuid, text, boolean, boolean, boolean, boolean), public.remove_club_member(uuid), public.set_faculty_admin_role(uuid, boolean) from public;
grant execute on function public.has_club_permission(uuid, text), public.list_access_accounts(), public.save_club_member_access(uuid, text, boolean, boolean, boolean, boolean), public.remove_club_member(uuid), public.set_faculty_admin_role(uuid, boolean) to authenticated;
