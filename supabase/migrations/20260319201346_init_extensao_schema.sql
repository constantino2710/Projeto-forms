create extension if not exists pgcrypto;

create type public.user_role as enum ('admin', 'user');
create type public.project_status as enum (
  'rascunho',
  'submetido',
  'em_avaliacao',
  'em_ajustes',
  'aprovado',
  'reprovado'
);
create type public.project_member_type as enum (
  'docente',
  'discente',
  'tecnico',
  'parceiro_externo'
);
create type public.document_status as enum (
  'pendente',
  'enviado',
  'rejeitado',
  'aprovado'
);
create type public.review_decision as enum (
  'aprovado',
  'reprovado',
  'em_ajustes'
);
create type public.audit_action as enum (
  'criou_projeto',
  'submeteu_projeto',
  'aprovou_projeto',
  'reprovou_projeto',
  'solicitou_ajuste',
  'enviou_documento',
  'atualizou_projeto'
);
create type public.notification_type as enum (
  'submissao',
  'pendencia',
  'aprovacao',
  'reprovacao'
);
create type public.notification_status as enum (
  'enviado',
  'falhou',
  'reenviado'
);

create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null unique,
  role public.user_role not null default 'user',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_email_format check (position('@' in email) > 1)
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.users (id) on delete restrict,
  title text not null,
  thematic_area text not null,
  course text,
  period_start date not null,
  period_end date not null,
  target_audience text not null,
  budget numeric(14, 2) not null default 0,
  status public.project_status not null default 'rascunho',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_period_check check (period_end >= period_start),
  constraint projects_budget_check check (budget >= 0)
);

create table public.project_team (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  member_name text not null,
  member_type public.project_member_type not null,
  project_role text not null,
  workload_hours numeric(6, 2),
  created_at timestamptz not null default now(),
  constraint project_team_workload_check check (
    workload_hours is null or workload_hours >= 0
  )
);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  description text not null,
  workload_hours numeric(6, 2) not null,
  activity_date date not null,
  participants text not null,
  result_notes text,
  created_by_user_id uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint activities_workload_check check (workload_hours > 0)
);

create table public.project_documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  document_name text not null,
  document_type text not null,
  status public.document_status not null default 'pendente',
  reviewer_note text,
  file_url text,
  submitted_at timestamptz,
  created_by_user_id uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  reviewer_user_id uuid not null references public.users (id) on delete restrict,
  opinion text not null,
  decision public.review_decision not null,
  reviewed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  project_id uuid not null references public.projects (id) on delete cascade,
  actor_user_id uuid references public.users (id) on delete set null,
  action public.audit_action not null,
  description text,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  type public.notification_type not null,
  status public.notification_status not null default 'enviado',
  attempts integer not null default 1,
  sent_at timestamptz not null default now(),
  provider_message text,
  created_at timestamptz not null default now(),
  constraint notifications_attempts_check check (attempts >= 1)
);

create index idx_projects_owner_user_id on public.projects (owner_user_id);
create index idx_projects_status on public.projects (status);
create index idx_projects_thematic_area on public.projects (thematic_area);
create index idx_project_team_project_id on public.project_team (project_id);
create index idx_activities_project_id on public.activities (project_id);
create index idx_activities_activity_date on public.activities (activity_date);
create index idx_project_documents_project_id on public.project_documents (project_id);
create index idx_project_documents_status on public.project_documents (status);
create index idx_reviews_project_id on public.reviews (project_id);
create index idx_reviews_reviewer_user_id on public.reviews (reviewer_user_id);
create index idx_audit_log_project_id on public.audit_log (project_id);
create index idx_audit_log_actor_user_id on public.audit_log (actor_user_id);
create index idx_notifications_user_id on public.notifications (user_id);
create index idx_notifications_project_id on public.notifications (project_id);
create index idx_notifications_status on public.notifications (status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
as $$
  select role
  from public.users
  where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(public.current_user_role() = 'admin', false)
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create or replace function public.handle_project_audit_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.audit_log (project_id, actor_user_id, action, description)
    values (
      new.id,
      auth.uid(),
      'criou_projeto',
      'Projeto criado com status rascunho.'
    );
    return new;
  end if;

  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    insert into public.audit_log (project_id, actor_user_id, action, description)
    values (
      new.id,
      auth.uid(),
      case new.status
        when 'submetido' then 'submeteu_projeto'
        when 'aprovado' then 'aprovou_projeto'
        when 'reprovado' then 'reprovou_projeto'
        when 'em_ajustes' then 'solicitou_ajuste'
        else 'atualizou_projeto'
      end,
      'Status alterado de ' || old.status || ' para ' || new.status || '.'
    );
  end if;

  return new;
end;
$$;

create or replace function public.handle_document_audit_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' and new.status = 'enviado' then
    insert into public.audit_log (project_id, actor_user_id, action, description)
    values (
      new.project_id,
      new.created_by_user_id,
      'enviou_documento',
      'Documento enviado: ' || new.document_name || '.'
    );
  elsif tg_op = 'UPDATE'
    and new.status = 'enviado'
    and old.status is distinct from new.status then
    insert into public.audit_log (project_id, actor_user_id, action, description)
    values (
      new.project_id,
      coalesce(new.created_by_user_id, auth.uid()),
      'enviou_documento',
      'Documento marcado como enviado: ' || new.document_name || '.'
    );
  end if;

  return new;
end;
$$;

create trigger trg_users_updated_at
before update on public.users
for each row
execute function public.set_updated_at();

create trigger trg_projects_updated_at
before update on public.projects
for each row
execute function public.set_updated_at();

create trigger trg_project_documents_updated_at
before update on public.project_documents
for each row
execute function public.set_updated_at();

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_auth_user();

create trigger trg_project_audit_log
after insert or update on public.projects
for each row
execute function public.handle_project_audit_log();

create trigger trg_document_audit_log
after insert or update on public.project_documents
for each row
execute function public.handle_document_audit_log();

alter table public.users enable row level security;
alter table public.projects enable row level security;
alter table public.project_team enable row level security;
alter table public.activities enable row level security;
alter table public.project_documents enable row level security;
alter table public.reviews enable row level security;
alter table public.audit_log enable row level security;
alter table public.notifications enable row level security;

create policy users_select_self_or_admin
on public.users
for select
to authenticated
using (id = auth.uid() or public.is_admin());

create policy users_insert_self_or_admin
on public.users
for insert
to authenticated
with check (id = auth.uid() or public.is_admin());

create policy users_update_self_or_admin
on public.users
for update
to authenticated
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

create policy projects_select_owner_or_admin
on public.projects
for select
to authenticated
using (owner_user_id = auth.uid() or public.is_admin());

create policy projects_insert_owner_or_admin
on public.projects
for insert
to authenticated
with check (owner_user_id = auth.uid() or public.is_admin());

create policy projects_update_owner_or_admin
on public.projects
for update
to authenticated
using (owner_user_id = auth.uid() or public.is_admin())
with check (owner_user_id = auth.uid() or public.is_admin());

create policy projects_delete_owner_or_admin
on public.projects
for delete
to authenticated
using (owner_user_id = auth.uid() or public.is_admin());

create policy project_team_manage_owner_or_admin
on public.project_team
for all
to authenticated
using (
  exists (
    select 1
    from public.projects p
    where p.id = project_team.project_id
      and (p.owner_user_id = auth.uid() or public.is_admin())
  )
)
with check (
  exists (
    select 1
    from public.projects p
    where p.id = project_team.project_id
      and (p.owner_user_id = auth.uid() or public.is_admin())
  )
);

create policy activities_manage_owner_or_admin
on public.activities
for all
to authenticated
using (
  exists (
    select 1
    from public.projects p
    where p.id = activities.project_id
      and (p.owner_user_id = auth.uid() or public.is_admin())
  )
)
with check (
  exists (
    select 1
    from public.projects p
    where p.id = activities.project_id
      and (p.owner_user_id = auth.uid() or public.is_admin())
  )
);

create policy documents_manage_owner_or_admin
on public.project_documents
for all
to authenticated
using (
  exists (
    select 1
    from public.projects p
    where p.id = project_documents.project_id
      and (p.owner_user_id = auth.uid() or public.is_admin())
  )
)
with check (
  exists (
    select 1
    from public.projects p
    where p.id = project_documents.project_id
      and (p.owner_user_id = auth.uid() or public.is_admin())
  )
);

create policy reviews_select_owner_or_admin
on public.reviews
for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.projects p
    where p.id = reviews.project_id
      and p.owner_user_id = auth.uid()
  )
);

create policy reviews_manage_admin_only
on public.reviews
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy audit_log_select_owner_or_admin
on public.audit_log
for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.projects p
    where p.id = audit_log.project_id
      and p.owner_user_id = auth.uid()
  )
);

create policy audit_log_insert_owner_or_admin
on public.audit_log
for insert
to authenticated
with check (
  actor_user_id = auth.uid()
  and (
    public.is_admin()
    or exists (
      select 1
      from public.projects p
      where p.id = audit_log.project_id
        and p.owner_user_id = auth.uid()
    )
  )
);

create policy notifications_select_owner_or_admin
on public.notifications
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy notifications_manage_admin_only
on public.notifications
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
