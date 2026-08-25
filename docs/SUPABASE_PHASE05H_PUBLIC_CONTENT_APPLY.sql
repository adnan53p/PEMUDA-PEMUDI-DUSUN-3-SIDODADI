begin;

create table if not exists public.public_site_content (
  content_key text primary key,
  content jsonb not null default '{}'::jsonb,
  updated_by_user_id uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint public_site_content_key_check check (content_key in ('homepage_managed')),
  constraint public_site_content_object_check check (jsonb_typeof(content) = 'object')
);

alter table public.public_site_content enable row level security;

drop policy if exists public_site_content_public_select on public.public_site_content;
create policy public_site_content_public_select
on public.public_site_content
for select
to anon, authenticated
using (true);

drop policy if exists public_site_content_superadmin_insert on public.public_site_content;
create policy public_site_content_superadmin_insert
on public.public_site_content
for insert
to authenticated
with check (public.is_superadmin());

drop policy if exists public_site_content_superadmin_update on public.public_site_content;
create policy public_site_content_superadmin_update
on public.public_site_content
for update
to authenticated
using (public.is_superadmin())
with check (public.is_superadmin());

grant select on public.public_site_content to anon, authenticated;
grant insert, update on public.public_site_content to authenticated;

commit;
