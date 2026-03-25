alter table public.app_users
  add column if not exists email text;
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'app_users_email_format'
  ) then
    alter table public.app_users
      add constraint app_users_email_format
      check (email is null or position('@' in email) > 1);
  end if;
end $$;
create unique index if not exists idx_app_users_email_unique
  on public.app_users (lower(email))
  where email is not null;
