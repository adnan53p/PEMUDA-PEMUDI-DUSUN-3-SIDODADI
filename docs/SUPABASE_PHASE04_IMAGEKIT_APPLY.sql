-- Phase 04B: switch external binary media from Cloudflare R2 to ImageKit.
-- Apply AFTER Phase 01, Phase 02 audit corrections, Phase 03, and the Phase 04 RPC
-- already applied on this project. This patch is safe to run once.
--
-- Binary media stays OUTSIDE Supabase Storage:
--   - activity photos -> ImageKit public files
--   - transaction evidence -> ImageKit private files (served by short-lived signed URL)
--   - video -> YouTube / Google Drive link
-- Supabase stores relational metadata and ImageKit file identifiers only.

-- PostgreSQL enum values must be committed before they can be used by constraints/functions.
alter type public.media_provider add value if not exists 'imagekit';

begin;

-- Keep legacy Cloudflare rows readable, but new application writes use ImageKit.
do $$
declare
  v_constraint text;
begin
  for v_constraint in
    select c.conname
    from pg_constraint c
    where c.conrelid = 'public.activity_media'::regclass
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) ilike '%cloudflare_r2%'
      and pg_get_constraintdef(c.oid) ilike '%provider%'
  loop
    execute format('alter table public.activity_media drop constraint %I', v_constraint);
  end loop;
end $$;

alter table public.activity_media
  add constraint activity_media_provider_type_chk
  check (
    (type = 'photo' and provider in ('imagekit', 'cloudflare_r2'))
    or
    (type = 'video' and provider in ('youtube', 'google_drive'))
  );

alter table public.transaction_evidence
  add column if not exists external_file_id text;

alter table public.transaction_evidence
  drop constraint if exists transaction_evidence_provider_check;
alter table public.transaction_evidence
  add constraint transaction_evidence_provider_check
  check (provider in ('imagekit', 'cloudflare_r2', 'external_url', 'metadata_only'));

-- Replace activity-media RPC so ImageKit fileId can be persisted for safe deletion.
drop function if exists public.rpc_add_activity_media(uuid,public.media_type,public.media_provider,text,text,boolean,boolean);
drop function if exists public.rpc_add_activity_media(uuid,public.media_type,public.media_provider,text,text,text,boolean,boolean);

create function public.rpc_add_activity_media(
  p_activity_id uuid,
  p_type public.media_type,
  p_provider public.media_provider,
  p_title text,
  p_public_url text,
  p_external_file_id text default null,
  p_is_cover boolean default false,
  p_public_visible boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
  v_sort integer;
  v_cover boolean;
begin
  if not public.is_admin_operator() then raise exception 'PERMISSION_DENIED'; end if;
  if p_activity_id is null or nullif(trim(p_title), '') is null or nullif(trim(p_public_url), '') is null then
    raise exception 'INVALID_MEDIA_INPUT';
  end if;
  if trim(p_public_url) !~* '^https://' then raise exception 'INVALID_MEDIA_URL'; end if;
  if p_type = 'photo' and p_provider <> 'imagekit' then raise exception 'PHOTO_PROVIDER_MUST_BE_IMAGEKIT'; end if;
  if p_type = 'photo' and nullif(trim(p_external_file_id), '') is null then raise exception 'IMAGEKIT_FILE_ID_REQUIRED'; end if;
  if p_type = 'video' and p_provider not in ('youtube', 'google_drive') then raise exception 'INVALID_VIDEO_PROVIDER'; end if;
  if not exists(select 1 from public.activities where id = p_activity_id) then raise exception 'ACTIVITY_NOT_FOUND'; end if;

  select coalesce(max(sort_order), 0) + 1
  into v_sort
  from public.activity_media
  where activity_id = p_activity_id and type = p_type;

  v_cover := p_type = 'photo' and (
    coalesce(p_is_cover, false)
    or not exists(select 1 from public.activity_media where activity_id = p_activity_id and type = 'photo' and is_cover)
  );

  if v_cover then
    update public.activity_media
    set is_cover = false
    where activity_id = p_activity_id and type = 'photo' and is_cover;
  end if;

  insert into public.activity_media(
    activity_id, type, provider, title, public_url, external_file_id,
    sort_order, is_cover, public_visible, created_by_user_id
  )
  values (
    p_activity_id, p_type, p_provider, trim(p_title), trim(p_public_url), nullif(trim(p_external_file_id), ''),
    v_sort, v_cover, coalesce(p_public_visible, true), auth.uid()
  )
  returning id into v_id;

  insert into public.audit_logs(actor_user_id, action, entity_type, entity_id, detail, after_data)
  values (
    auth.uid(),
    'add_activity_media',
    'activity_media',
    v_id,
    case when p_type = 'photo' then 'Menambahkan foto kegiatan dari ImageKit' else 'Menambahkan video kegiatan' end,
    jsonb_build_object('activity_id', p_activity_id, 'type', p_type, 'provider', p_provider)
  );

  return v_id;
end;
$$;

revoke all on function public.rpc_add_activity_media(uuid,public.media_type,public.media_provider,text,text,text,boolean,boolean) from public, anon;
grant execute on function public.rpc_add_activity_media(uuid,public.media_type,public.media_provider,text,text,text,boolean,boolean) to authenticated;

-- Replace evidence RPC so metadata records ImageKit as provider and retains fileId.
drop function if exists public.rpc_attach_transaction_evidence(uuid,text,text,text);
drop function if exists public.rpc_attach_transaction_evidence(uuid,text,text,text,text);

create function public.rpc_attach_transaction_evidence(
  p_transaction_id uuid,
  p_title text,
  p_url text,
  p_mime_type text default null,
  p_external_file_id text default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_tx public.financial_transactions%rowtype;
  v_evidence_id uuid;
begin
  if not public.current_profile_is_active() then raise exception 'PERMISSION_DENIED'; end if;
  if p_transaction_id is null or nullif(trim(p_title), '') is null or nullif(trim(p_url), '') is null then
    raise exception 'INVALID_EVIDENCE_INPUT';
  end if;
  if trim(p_url) !~* '^https://' then raise exception 'INVALID_EVIDENCE_URL'; end if;
  if p_mime_type is not null and p_mime_type not in ('image/jpeg','image/png','image/webp','application/pdf') then
    raise exception 'INVALID_EVIDENCE_TYPE';
  end if;

  select * into v_tx
  from public.financial_transactions
  where id = p_transaction_id;

  if v_tx.id is null then raise exception 'TRANSACTION_NOT_FOUND'; end if;
  if exists(select 1 from public.activities a where a.id = v_tx.activity_id and a.financial_locked) then
    raise exception 'ACTIVITY_LOCKED';
  end if;

  if public.is_admin_operator() then
    null;
  elsif public.is_active_humas() then
    if v_tx.created_by_user_id <> auth.uid() then raise exception 'PERMISSION_DENIED'; end if;
    if v_tx.assignment_id is null or not exists (
      select 1 from public.humas_assignments ha
      where ha.id = v_tx.assignment_id
        and ha.activity_id = v_tx.activity_id
        and ha.humas_user_id = auth.uid()
        and ha.is_active = true
    ) then
      raise exception 'ASSIGNMENT_NOT_FOUND';
    end if;
  else
    raise exception 'PERMISSION_DENIED';
  end if;

  select te.id into v_evidence_id
  from public.transaction_evidence te
  where te.transaction_id = p_transaction_id
  order by te.created_at asc
  limit 1
  for update;

  if v_evidence_id is null then
    insert into public.transaction_evidence(transaction_id, title, provider, url, mime_type, external_file_id)
    values (
      p_transaction_id, trim(p_title), 'imagekit', trim(p_url), p_mime_type,
      nullif(trim(p_external_file_id), '')
    );
  else
    update public.transaction_evidence
    set title = trim(p_title),
        provider = 'imagekit',
        url = trim(p_url),
        mime_type = p_mime_type,
        external_file_id = nullif(trim(p_external_file_id), '')
    where id = v_evidence_id;
  end if;

  insert into public.audit_logs(actor_user_id, action, entity_type, entity_id, detail, after_data)
  values (
    auth.uid(),
    'attach_transaction_evidence',
    'transaction_evidence',
    p_transaction_id,
    'Melampirkan bukti transaksi privat dari ImageKit',
    jsonb_build_object(
      'transaction_id', p_transaction_id,
      'mime_type', p_mime_type,
      'provider', 'imagekit',
      'has_external_file_id', nullif(trim(p_external_file_id), '') is not null
    )
  );
end;
$$;

revoke all on function public.rpc_attach_transaction_evidence(uuid,text,text,text,text) from public, anon;
grant execute on function public.rpc_attach_transaction_evidence(uuid,text,text,text,text) to authenticated;

commit;
