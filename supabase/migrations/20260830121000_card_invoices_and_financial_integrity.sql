-- Faturas de cartão e reforços de integridade financeira.

alter table public.transactions drop constraint chk_transactions_kind;
alter table public.transactions drop constraint chk_transaction_flow;
alter table public.transactions drop constraint chk_transaction_card_payment;
alter table public.transactions add constraint chk_transactions_kind
  check (kind in ('expense','income','transfer','card_payment'));
alter table public.transactions add constraint chk_transaction_flow check (
  (kind='transfer' and account_id is not null and destination_account_id is not null and account_id<>destination_account_id and card_id is null)
  or (kind='income' and destination_account_id is null and card_id is null)
  or (kind='expense' and destination_account_id is null)
  or (kind='card_payment' and account_id is not null and destination_account_id is null and card_id is not null)
);
alter table public.transactions add constraint chk_transaction_card_payment check (
  card_id is null
  or (kind='expense' and account_id is null and payment_method='credit')
  or (kind='card_payment' and account_id is not null and payment_method='transfer')
);

create table public.card_invoices (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.financial_groups(id) on delete cascade,
  card_id uuid not null references public.cards(id) on delete cascade,
  reference_month date not null,
  closing_date date not null,
  due_date date not null,
  total_amount numeric(14,2) not null default 0,
  status text not null default 'open' check (status in ('open','closed','paid','overdue','cancelled')),
  paid_at timestamptz,
  payment_account_id uuid references public.financial_accounts(id) on delete set null,
  paid_transaction_id uuid references public.transactions(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(card_id, reference_month)
);
create index idx_card_invoices_group_due on public.card_invoices(group_id,due_date,status);
alter table public.card_invoices enable row level security;
create policy card_invoices_select on public.card_invoices for select to authenticated using(public.is_group_member(group_id));
create policy card_invoices_insert on public.card_invoices for insert to authenticated with check(public.has_write_permission(group_id));
create policy card_invoices_update on public.card_invoices for update to authenticated using(public.has_write_permission(group_id)) with check(public.has_write_permission(group_id));
create policy card_invoices_delete on public.card_invoices for delete to authenticated using(public.has_write_permission(group_id));
create trigger trg_card_invoices_updated_at before update on public.card_invoices for each row execute function public.set_updated_at();

alter table public.transactions add column invoice_id uuid references public.card_invoices(id) on delete set null;
create index idx_transactions_invoice on public.transactions(invoice_id);

create or replace function public.assign_card_invoice()
returns trigger language plpgsql security definer set search_path=public,pg_temp
as $$
declare v_card public.cards; v_reference date; v_close date; v_due date; v_invoice uuid; v_closing_day int; v_due_day int;
begin
  if new.kind<>'expense' or new.card_id is null then return new; end if;
  select * into v_card from public.cards where id=new.card_id;
  if not found then raise exception 'Cartão não encontrado'; end if;
  v_closing_day:=coalesce(v_card.closing_day,25);
  v_due_day:=coalesce(v_card.due_day,5);
  v_reference := date_trunc('month',new.transaction_date)::date;
  if extract(day from new.transaction_date)>v_closing_day then v_reference:=(v_reference+interval '1 month')::date; end if;
  v_close := make_date(extract(year from v_reference)::int,extract(month from v_reference)::int,
    least(v_closing_day,extract(day from(date_trunc('month',v_reference)+interval '1 month - 1 day'))::int));
  v_due := make_date(extract(year from v_reference)::int,extract(month from v_reference)::int,
    least(v_due_day,extract(day from(date_trunc('month',v_reference)+interval '1 month - 1 day'))::int));
  if v_due<=v_close then v_due:=(v_due+interval '1 month')::date; end if;
  insert into public.card_invoices(group_id,card_id,reference_month,closing_date,due_date)
    values(new.group_id,new.card_id,v_reference,v_close,v_due)
    on conflict(card_id,reference_month) do update set updated_at=now()
    returning id into v_invoice;
  new.invoice_id:=v_invoice;
  return new;
end;
$$;
create trigger trg_assign_card_invoice before insert or update of card_id,transaction_date
on public.transactions for each row execute function public.assign_card_invoice();

create or replace function public.refresh_card_invoice_total()
returns trigger language plpgsql security definer set search_path=public,pg_temp
as $$
begin
  if tg_op in ('UPDATE','DELETE') and old.invoice_id is not null then
    update public.card_invoices set total_amount=coalesce((
      select sum(amount) from public.transactions
      where invoice_id=old.invoice_id and kind='expense' and status<>'cancelled'
    ),0) where id=old.invoice_id;
  end if;
  if tg_op in ('INSERT','UPDATE') and new.invoice_id is not null then
    update public.card_invoices set total_amount=coalesce((
      select sum(amount) from public.transactions
      where invoice_id=new.invoice_id and kind='expense' and status<>'cancelled'
    ),0) where id=new.invoice_id;
  end if;
  return coalesce(new,old);
end;
$$;
create trigger trg_refresh_card_invoice after insert or update or delete
on public.transactions for each row execute function public.refresh_card_invoice_total();

-- Associa compras antigas às faturas sem alterar seus valores ou datas.
update public.transactions
set transaction_date=transaction_date
where kind='expense' and card_id is not null and invoice_id is null;

create or replace function public.pay_card_invoice(p_invoice_id uuid,p_account_id uuid,p_payment_date date default current_date)
returns public.card_invoices language plpgsql security definer set search_path=public,pg_temp
as $$
declare v_invoice public.card_invoices;v_member uuid;v_tx uuid;
begin
  select * into v_invoice from public.card_invoices where id=p_invoice_id for update;
  if not found then raise exception 'Fatura não encontrada'; end if;
  if not public.has_write_permission(v_invoice.group_id) then raise exception 'Sem permissão de escrita'; end if;
  if v_invoice.status='paid' then return v_invoice; end if;
  if not exists(select 1 from public.financial_accounts where id=p_account_id and group_id=v_invoice.group_id)
    then raise exception 'Conta financeira inválida'; end if;
  select id into v_member from public.group_members where group_id=v_invoice.group_id and user_id=auth.uid();
  insert into public.transactions(group_id,member_id,account_id,card_id,description,amount,transaction_date,kind,payment_method,status)
  values(v_invoice.group_id,v_member,p_account_id,v_invoice.card_id,'Pagamento de fatura',v_invoice.total_amount,p_payment_date,'card_payment','transfer','cleared')
  returning id into v_tx;
  update public.card_invoices set status='paid',paid_at=now(),payment_account_id=p_account_id,paid_transaction_id=v_tx
  where id=p_invoice_id returning * into v_invoice;
  return v_invoice;
end;
$$;

create or replace function public.get_account_balances(p_group_id uuid)
returns table(id uuid,name text,account_type text,color text,include_in_available boolean,balance numeric)
language sql stable security definer set search_path=public,pg_temp
as $$
  select a.id,a.name,a.account_type,a.color,a.include_in_available,
    a.initial_balance+coalesce(sum(case
      when t.kind='income' and t.account_id=a.id and t.status in('cleared','reconciled') then t.amount
      when t.kind in('expense','card_payment') and t.account_id=a.id and t.status in('cleared','reconciled') then -t.amount
      when t.kind='transfer' and t.account_id=a.id and t.status in('cleared','reconciled') then -t.amount
      when t.kind='transfer' and t.destination_account_id=a.id and t.status in('cleared','reconciled') then t.amount
      else 0 end),0)::numeric
  from public.financial_accounts a
  left join public.transactions t on t.account_id=a.id or t.destination_account_id=a.id
  where a.group_id=p_group_id and public.is_group_member(p_group_id)
  group by a.id;
$$;

create or replace function public.record_caixinha_deposit(caixinha_id uuid,amount numeric,deposit_date date default current_date,note text default null)
returns uuid language plpgsql security definer set search_path=public,pg_temp
as $$
declare v_box public.caixinhas;v_member uuid;v_id uuid;v_account_balance numeric;v_reserved numeric;
begin
  if amount is null or amount=0 then raise exception 'O valor deve ser diferente de zero'; end if;
  select * into v_box from public.caixinhas where id=caixinha_id for update;
  if not found then raise exception 'Caixinha não encontrada'; end if;
  if not public.has_write_permission(v_box.group_id) then raise exception 'Sem permissão de escrita'; end if;
  if v_box.current_balance+amount<0 then raise exception 'Saldo insuficiente na caixinha'; end if;
  if amount>0 and v_box.funding_account_id is not null then
    select balance into v_account_balance from public.get_account_balances(v_box.group_id) where id=v_box.funding_account_id;
    select coalesce(sum(current_balance),0) into v_reserved from public.caixinhas
      where funding_account_id=v_box.funding_account_id and is_active and id<>caixinha_id;
    if v_reserved+v_box.current_balance+amount>v_account_balance then raise exception 'O aporte excede o saldo disponível da conta'; end if;
  end if;
  select id into v_member from public.group_members where group_id=v_box.group_id and user_id=auth.uid();
  insert into public.caixinha_deposits(caixinha_id,member_id,amount,deposit_date,note,account_id)
  values(caixinha_id,v_member,amount,coalesce(deposit_date,current_date),nullif(btrim(note),''),v_box.funding_account_id)
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.assign_card_invoice() from public,anon,authenticated;
revoke all on function public.refresh_card_invoice_total() from public,anon,authenticated;
revoke all on function public.pay_card_invoice(uuid,uuid,date) from public,anon;
grant execute on function public.pay_card_invoice(uuid,uuid,date) to authenticated;


