-- Campus Pulse: shared campus event data, roles, and RSVP responses.
-- Apply this migration from the Supabase SQL Editor or Supabase CLI.

create type public.user_role as enum ('participant', 'committee', 'admin');
create type public.question_type as enum ('text', 'textarea', 'select', 'checkbox', 'radio');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role public.user_role not null default 'participant',
  club_slug text,
  created_at timestamptz not null default now()
);

create table public.clubs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null unique,
  tagline text not null,
  description text not null,
  category text not null,
  member_count integer not null default 0 check (member_count >= 0),
  color text not null default '#1de9b6' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add constraint profiles_club_slug_fkey foreign key (club_slug) references public.clubs(slug) on delete set null;

create table public.events (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete restrict,
  title text not null,
  description text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text not null,
  capacity integer not null check (capacity > 0),
  cover_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.rsvp_questions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  label text not null,
  type public.question_type not null,
  required boolean not null default false,
  options jsonb not null default '[]'::jsonb,
  position integer not null default 0,
  unique (event_id, position)
);

create table public.rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  answers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create index events_club_id_idx on public.events(club_id);
create index events_starts_at_idx on public.events(starts_at);
create index rsvps_event_id_idx on public.rsvps(event_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1), 'Campus member'));
  return new;
end;
$$;

create trigger create_profile_after_signup
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

create or replace function public.can_manage_club(target_club_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin() or exists (
    select 1
    from public.profiles profile
    join public.clubs club on club.slug = profile.club_slug
    where profile.id = (select auth.uid())
      and profile.role = 'committee'
      and club.id = target_club_id
  );
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger clubs_set_updated_at before update on public.clubs
for each row execute function public.set_updated_at();
create trigger events_set_updated_at before update on public.events
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.clubs enable row level security;
alter table public.events enable row level security;
alter table public.rsvp_questions enable row level security;
alter table public.rsvps enable row level security;

revoke all on public.profiles, public.clubs, public.events, public.rsvp_questions, public.rsvps from anon, authenticated;
grant select on public.clubs, public.events, public.rsvp_questions to anon, authenticated;
grant select on public.profiles to authenticated;
grant update (name, club_slug) on public.profiles to authenticated;
grant select, insert, update, delete on public.clubs, public.events, public.rsvp_questions, public.rsvps to authenticated;

create policy "Users can read their own profile" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "Users can update their own profile details" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "Anyone can read clubs" on public.clubs for select to anon, authenticated using (true);
create policy "Admins manage clubs" on public.clubs for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Anyone can read events" on public.events for select to anon, authenticated using (true);
create policy "Organizers create events for their club" on public.events for insert to authenticated with check ((select auth.uid()) = created_by and (select public.can_manage_club(club_id)));
create policy "Organizers update their club events" on public.events for update to authenticated using ((select public.can_manage_club(club_id))) with check ((select public.can_manage_club(club_id)));
create policy "Organizers delete their club events" on public.events for delete to authenticated using ((select public.can_manage_club(club_id)));

create policy "Anyone can read RSVP questions" on public.rsvp_questions for select to anon, authenticated using (true);
create policy "Organizers manage RSVP questions" on public.rsvp_questions for all to authenticated using (exists (select 1 from public.events where events.id = event_id and public.can_manage_club(events.club_id))) with check (exists (select 1 from public.events where events.id = event_id and public.can_manage_club(events.club_id)));

create policy "Participants can read their RSVPs and organizers can track them" on public.rsvps for select to authenticated using ((select auth.uid()) = user_id or exists (select 1 from public.events where events.id = event_id and public.can_manage_club(events.club_id)));
create policy "Participants create their own RSVPs" on public.rsvps for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Participants update their own RSVPs" on public.rsvps for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Participants cancel their own RSVPs" on public.rsvps for delete to authenticated using ((select auth.uid()) = user_id);

-- After creating your first auth user, promote it in the SQL Editor:
-- update public.profiles set role = 'admin' where id = 'YOUR_AUTH_USER_UUID';
