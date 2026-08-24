-- Phase 04: External media integration.
-- Binary media stays OUTSIDE Supabase Storage:
--   - activity photos + transaction evidence -> Cloudflare R2
--   - video -> YouTube / Google Drive link
-- Supabase stores metadata and secure relational references only.

begin;

create or replace function public.rpc_attach_transaction_evidence(
  p_transaction_id uuid,
  p_title text,
  p_url text,
  p_mime_type text default null
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
  if not public.current_profile_is_active() then
    raise exception 'PERMISSION_DENIED';
  end if;
  if p_transaction_id is null or nullif(trim(p_title), '') is null or nullif(trim(p_url), '') is null then
    raise exception 'INVALID_EVIDENCE_INPUT';
  end if;
  if trim(p_url) !~* '^https://' then
    raise exception 'INVALID_EVIDENCE_URL';
  end if;
  if p_mime_type is not null and p_mime_type not in ('image/jpeg','image/png','image/webp','application/pdf') then
    raise exception 'INVALID_EVIDENCE_TYPE';
  end if;

  select * into v_tx
  from public.financial_transactions
  where id = p_transaction_id;

  if v_tx.id is null then
    raise exception 'TRANSACTION_NOT_FOUND';
  end if;
  if exists (select 1 from public.activities a where a.id = v_tx.activity_id and a.financial_locked) then
    raise exception 'ACTIVITY_LOCKED';
  end if;

  if public.is_admin_operator() then
    null;
  elsif public.is_active_humas() then
    if v_tx.created_by_user_id <> auth.uid() then
      raise exception 'PERMISSION_DENIED';
    end if;
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
    insert into public.transaction_evidence(transaction_id, title, provider, url, mime_type)
    values (p_transaction_id, trim(p_title), 'cloudflare_r2', trim(p_url), p_mime_type);
  else
    update public.transaction_evidence
    set title = trim(p_title), provider = 'cloudflare_r2', url = trim(p_url), mime_type = p_mime_type
    where id = v_evidence_id;
  end if;

  insert into public.audit_logs(actor_user_id, action, entity_type, entity_id, detail, after_data)
  values (
    auth.uid(),
    'attach_transaction_evidence',
    'transaction_evidence',
    p_transaction_id,
    'Melampirkan bukti transaksi dari Cloudflare R2',
    jsonb_build_object('transaction_id', p_transaction_id, 'mime_type', p_mime_type)
  );
end;
$$;

revoke all on function public.rpc_attach_transaction_evidence(uuid,text,text,text) from public, anon;
grant execute on function public.rpc_attach_transaction_evidence(uuid,text,text,text) to authenticated;

commit;
