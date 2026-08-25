begin;

create table if not exists public.site_media (
  slot text primary key,
  title text not null,
  provider public.media_provider not null default 'imagekit',
  url text not null,
  external_file_id text not null,
  public_visible boolean not null default true,
  updated_by_user_id uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint site_media_slot_check check (slot in ('hero','profile','organization')),
  constraint site_media_provider_check check (provider = 'imagekit'),
  constraint site_media_url_check check (url ~* '^https://'),
  constraint site_media_external_file_id_check check (length(trim(external_file_id)) > 0)
);

alter table public.site_media enable row level security;

drop policy if exists site_media_public_select on public.site_media;
create policy site_media_public_select
on public.site_media
for select
to anon, authenticated
using (public_visible = true or public.is_superadmin());

drop policy if exists site_media_superadmin_insert on public.site_media;
create policy site_media_superadmin_insert
on public.site_media
for insert
to authenticated
with check (public.is_superadmin());

drop policy if exists site_media_superadmin_update on public.site_media;
create policy site_media_superadmin_update
on public.site_media
for update
to authenticated
using (public.is_superadmin())
with check (public.is_superadmin());

drop policy if exists site_media_superadmin_delete on public.site_media;
create policy site_media_superadmin_delete
on public.site_media
for delete
to authenticated
using (public.is_superadmin());

grant select on public.site_media to anon, authenticated;
grant insert, update, delete on public.site_media to authenticated;

commit;
