-- Edição segura, auditoria, categorias personalizadas, comprovantes e saldo não negativo.

alter table public.categories
  add column if not exists is_active boolean not null default true,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();
create unique index if not exists uq_categories_scope_name_kind
  on public.categories(coalesce(group_id,'00000000-0000-0000-0000-000000000000'::uuid),lower(btrim(name)),kind);
drop trigger if exists trg_categories_updated_at on public.categories;
create trigger trg_categories_updated_at before update on public.categories
  for each row execute function public.set_updated_at();
alter table public.bills add column if not exists payment_receipt_path text;

create table public.audit_logs (
  id bigint generated always as identity primary key,
  group_id uuid not null references public.financial_groups(id) on delete cascade,
  actor_user_id uuid references public.profiles(id) on delete set null,
  entity_type text not null,
  entity_id uuid not null,
  action text not null check(action in ('insert','update','delete')),
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);
create index idx_audit_logs_group_created on public.audit_logs(group_id,created_at desc);
create index idx_audit_logs_entity on public.audit_logs(entity_type,entity_id,created_at desc);
alter table public.audit_logs enable row level security;
create policy audit_logs_select on public.audit_logs for select to authenticated using(public.is_group_member(group_id));

create or replace function public.capture_financial_audit()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare v_row jsonb;v_group uuid;v_id uuid;
begin
  v_row:=case when tg_op='DELETE' then to_jsonb(old) else to_jsonb(new) end;
  v_group:=(v_row->>'group_id')::uuid;
  if v_group is null and tg_table_name in('caixinha_deposits','caixinha_goals') then
    select c.group_id into v_group from public.caixinhas c where c.id=(v_row->>'caixinha_id')::uuid;
  end if;
  v_id:=(v_row->>'id')::uuid;
  if v_group is not null and v_id is not null then
    insert into public.audit_logs(group_id,actor_user_id,entity_type,entity_id,action,old_data,new_data)
    values(v_group,auth.uid(),tg_table_name,v_id,lower(tg_op),
      case when tg_op in('UPDATE','DELETE') then to_jsonb(old) end,
      case when tg_op in('INSERT','UPDATE') then to_jsonb(new) end);
  end if;
  return coalesce(new,old);
end;$$;

do $$ declare t text;begin
  foreach t in array array['financial_accounts','cards','categories','recurrences','transactions','bills','caixinhas','caixinha_deposits','caixinha_goals'] loop
    execute format('create trigger trg_%I_audit after insert or update or delete on public.%I for each row execute function public.capture_financial_audit()',t,t);
  end loop;
end$$;

create or replace function public.transaction_account_effect(
  p_kind text,p_status text,p_amount numeric,p_account uuid,p_destination uuid,p_target uuid
) returns numeric language sql immutable set search_path=public,pg_temp as $$
  select case when p_status not in('cleared','reconciled') then 0
    when p_kind='income' and p_account=p_target then p_amount
    when p_kind in('expense','card_payment') and p_account=p_target then -p_amount
    when p_kind='transfer' and p_account=p_target then -p_amount
    when p_kind='transfer' and p_destination=p_target then p_amount
    else 0 end;
$$;

create or replace function public.calculate_account_balance(p_account_id uuid,p_exclude_transaction uuid default null)
returns numeric language sql stable security definer set search_path=public,pg_temp as $$
  select a.initial_balance+coalesce(sum(public.transaction_account_effect(
    t.kind,t.status,t.amount,t.account_id,t.destination_account_id,a.id)),0)
  from public.financial_accounts a left join public.transactions t
    on (t.account_id=a.id or t.destination_account_id=a.id)
    and (p_exclude_transaction is null or t.id<>p_exclude_transaction)
  where a.id=p_account_id group by a.id,a.initial_balance;
$$;

create or replace function public.enforce_nonnegative_account_balance()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare v_account uuid;v_tx_id uuid;v_balance numeric;v_effect numeric;
begin
  v_tx_id:=case when tg_op='INSERT' then null else old.id end;
  for v_account in select distinct x from unnest(array[
    case when tg_op<>'INSERT' then old.account_id end,
    case when tg_op<>'INSERT' then old.destination_account_id end,
    case when tg_op<>'DELETE' then new.account_id end,
    case when tg_op<>'DELETE' then new.destination_account_id end
  ]) x where x is not null order by x loop
    perform pg_advisory_xact_lock(hashtextextended(v_account::text,0));
    select public.calculate_account_balance(v_account,v_tx_id) into v_balance;
    v_effect:=case when tg_op='DELETE' then 0 else public.transaction_account_effect(
      new.kind,new.status,new.amount,new.account_id,new.destination_account_id,v_account) end;
    if coalesce(v_balance,0)+coalesce(v_effect,0)<0 then
      raise exception using errcode='P0001',message=format(
        'Saldo insuficiente. Disponível: R$ %s; saldo após a operação: R$ %s.',
        to_char(coalesce(v_balance,0),'FM999G999G990D00'),to_char(coalesce(v_balance,0)+coalesce(v_effect,0),'FM999G999G990D00'));
    end if;
  end loop;
  return coalesce(new,old);
end;$$;
create trigger trg_transactions_nonnegative_balance before insert or update or delete on public.transactions
  for each row execute function public.enforce_nonnegative_account_balance();

create or replace function public.enforce_initial_balance_edit()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare v_current numeric;
begin
  if new.initial_balance<>old.initial_balance then
    perform pg_advisory_xact_lock(hashtextextended(new.id::text,0));
    v_current:=public.calculate_account_balance(new.id,null);
    if v_current+(new.initial_balance-old.initial_balance)<0 then raise exception 'O novo saldo inicial deixaria a conta negativa';end if;
  end if;
  return new;
end;$$;
create trigger trg_financial_accounts_initial_balance_guard before update of initial_balance on public.financial_accounts
  for each row execute function public.enforce_initial_balance_edit();

drop function if exists public.mark_bill_paid(uuid,uuid,numeric,date);
create function public.mark_bill_paid(
  bill_id uuid,p_account_id uuid,p_actual_amount numeric default null,
  p_payment_date date default current_date,p_receipt_file_path text default null
) returns public.bills language plpgsql security definer set search_path=public,pg_temp as $$
declare v_bill public.bills;v_member_id uuid;v_transaction_id uuid;v_amount numeric;
begin
  select * into v_bill from public.bills where id=bill_id for update;
  if not found then raise exception 'Conta não encontrada';end if;
  if not public.has_write_permission(v_bill.group_id) then raise exception 'Sem permissão de escrita';end if;
  if v_bill.status='paid' then raise exception 'Conta já está paga';end if;
  if not exists(select 1 from public.financial_accounts where id=p_account_id and group_id=v_bill.group_id and is_active)
    then raise exception 'Conta financeira inválida';end if;
  if p_receipt_file_path is not null and split_part(p_receipt_file_path,'/',1)<>v_bill.group_id::text
    then raise exception 'Caminho de comprovante inválido';end if;
  v_amount:=coalesce(p_actual_amount,v_bill.amount);
  select id into v_member_id from public.group_members where group_id=v_bill.group_id and user_id=auth.uid();
  insert into public.transactions(group_id,member_id,account_id,category_id,description,amount,transaction_date,kind,payment_method,status,receipt_file_path)
  values(v_bill.group_id,v_member_id,p_account_id,v_bill.category_id,v_bill.description,v_amount,p_payment_date,'expense','bank_slip','cleared',p_receipt_file_path)
  returning id into v_transaction_id;
  update public.bills set status='paid',paid_at=now(),paid_transaction_id=v_transaction_id,
    actual_amount=v_amount,payment_date=p_payment_date,payment_receipt_path=p_receipt_file_path
  where id=bill_id returning * into v_bill;
  return v_bill;
end;$$;

create index if not exists idx_transactions_group_filters on public.transactions(group_id,transaction_date desc,kind,status,category_id,account_id);
create index if not exists idx_bills_group_filters on public.bills(group_id,due_date desc,status,category_id,account_id);
create index if not exists idx_bills_payment_date on public.bills(group_id,payment_date desc) where payment_date is not null;

revoke all on table public.audit_logs from anon;
revoke all on function public.capture_financial_audit() from public,anon,authenticated;
revoke all on function public.transaction_account_effect(text,text,numeric,uuid,uuid,uuid) from public,anon,authenticated;
revoke all on function public.calculate_account_balance(uuid,uuid) from public,anon,authenticated;
revoke all on function public.enforce_nonnegative_account_balance() from public,anon,authenticated;
revoke all on function public.enforce_initial_balance_edit() from public,anon,authenticated;
revoke all on function public.mark_bill_paid(uuid,uuid,numeric,date,text) from public,anon;
grant execute on function public.mark_bill_paid(uuid,uuid,numeric,date,text) to authenticated;
