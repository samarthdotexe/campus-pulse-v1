-- Keep sign-up available during a rolling deployment where an older client does
-- not yet submit username metadata. Newly deployed clients always submit it.

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
  if normalized_username = '' then
    normalized_username := 'member_' || replace(left(new.id::text, 12), '-', '');
  end if;

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
