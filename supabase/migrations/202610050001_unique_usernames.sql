-- A username is a stable, case-insensitive identifier for every Campus Pulse member.

alter table public.profiles add column if not exists username text;

alter table public.profiles
  add constraint profiles_username_format_check
  check (username is null or username ~ '^[a-z0-9_]{3,30}$') not valid;

create unique index if not exists profiles_username_case_insensitive_key
  on public.profiles (lower(username))
  where username is not null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role public.user_role;
  requested_club_slug text;
  normalized_username text := lower(trim(coalesce(new.raw_user_meta_data ->> 'username', '')));
begin
  if normalized_username !~ '^[a-z0-9_]{3,30}$' then
    raise exception 'Choose a username with 3–30 lowercase letters, numbers, or underscores.';
  end if;

  insert into public.profiles (id, name, username)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1), 'Campus member'), normalized_username);

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

drop function if exists public.update_my_profile(text, text);

create function public.update_my_profile(
  p_name text,
  p_username text,
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
  normalized_username text := lower(trim(coalesce(p_username, '')));
  normalized_avatar_path text := nullif(trim(coalesce(p_avatar_path, '')), '');
begin
  if auth.uid() is null then raise exception 'You must be signed in to update your profile.'; end if;
  if char_length(normalized_name) not between 2 and 80 then raise exception 'Your display name must contain between 2 and 80 characters.'; end if;
  if normalized_username !~ '^[a-z0-9_]{3,30}$' then raise exception 'Use 3–30 lowercase letters, numbers, or underscores for your username.'; end if;
  if normalized_avatar_path is not null and normalized_avatar_path not like auth.uid()::text || '/%' then raise exception 'You can only use an avatar stored in your own folder.'; end if;

  update public.profiles set name = normalized_name, username = normalized_username, avatar_path = normalized_avatar_path
  where id = auth.uid() returning * into profile_row;
  return profile_row;
exception when unique_violation then
  raise exception 'That username is already taken.';
end;
$$;

revoke all on function public.update_my_profile(text, text, text) from public;
grant execute on function public.update_my_profile(text, text, text) to authenticated;
