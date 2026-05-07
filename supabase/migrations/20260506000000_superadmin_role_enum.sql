do $$
begin
  if not exists (
    select 1
    from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    where t.typname = 'user_role'
      and e.enumlabel = 'superadmin'
  ) then
    alter type public.user_role add value 'superadmin';
  end if;
end;
$$;
