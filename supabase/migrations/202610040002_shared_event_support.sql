-- Shared RSVP metrics and organizer-only attendee reporting.
-- Apply after 202610030001_initial_schema.sql.

alter table public.events
  add column if not exists rsvp_count integer not null default 0 check (rsvp_count >= 0);

update public.events event
set rsvp_count = (
  select count(*)::integer
  from public.rsvps rsvp
  where rsvp.event_id = event.id
);

create or replace function public.sync_event_rsvp_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.events set rsvp_count = rsvp_count + 1 where id = new.event_id;
    return new;
  end if;

  if tg_op = 'DELETE' then
    update public.events set rsvp_count = greatest(rsvp_count - 1, 0) where id = old.event_id;
    return old;
  end if;

  if new.event_id is distinct from old.event_id then
    update public.events set rsvp_count = greatest(rsvp_count - 1, 0) where id = old.event_id;
    update public.events set rsvp_count = rsvp_count + 1 where id = new.event_id;
  end if;
  return new;
end;
$$;

drop trigger if exists rsvps_sync_event_rsvp_count on public.rsvps;
create trigger rsvps_sync_event_rsvp_count
after insert or delete or update of event_id on public.rsvps
for each row execute function public.sync_event_rsvp_count();

create or replace function public.get_organizer_rsvps()
returns table (
  id uuid,
  event_id uuid,
  user_id uuid,
  participant_name text,
  answers jsonb,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select rsvp.id, rsvp.event_id, rsvp.user_id, profile.name, rsvp.answers, rsvp.created_at
  from public.rsvps rsvp
  join public.events event on event.id = rsvp.event_id
  join public.profiles profile on profile.id = rsvp.user_id
  where public.can_manage_club(event.club_id)
  order by rsvp.created_at desc;
$$;

revoke all on function public.get_organizer_rsvps() from public;
grant execute on function public.get_organizer_rsvps() to authenticated;

-- SQL Editor verification (run as appropriate authenticated roles):
-- select id, title, rsvp_count from public.events; -- public event reads include a count.
-- select * from public.get_organizer_rsvps(); -- only admins or matching committee members receive rows.
-- insert into public.rsvps (event_id, user_id, answers) values ('EVENT_UUID', auth.uid(), '{}');
-- select rsvp_count from public.events where id = 'EVENT_UUID'; -- count increases by one.
