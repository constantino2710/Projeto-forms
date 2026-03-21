create table if not exists public.app_project_attachments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.app_projects (id) on delete cascade,
  owner_app_user_id uuid not null references public.app_users (id) on delete cascade,
  file_name text not null,
  storage_path text not null unique,
  mime_type text,
  size_bytes bigint not null,
  created_at timestamptz not null default now(),
  constraint app_project_attachments_size_positive check (size_bytes > 0)
);

create index if not exists idx_app_project_attachments_project
  on public.app_project_attachments (project_id, created_at desc);

create index if not exists idx_app_project_attachments_owner
  on public.app_project_attachments (owner_app_user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'app-project-attachments',
  'app-project-attachments',
  false,
  20971520,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'image/png',
    'image/jpeg',
    'image/webp'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
