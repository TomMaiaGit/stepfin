-- StepFin: contas financeiras, recorrências unificadas e fluxos coerentes.

create table public.financial_accounts (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.financial_groups(id) on delete cascade,
  owner_member_id uuid references public.group_members(id) on delete set null,
  name text not null,
  institution text,
  account_type text not null default 'checking'
    check (account_type in ('checking','savings','cash','wallet','investment','other')),
  initial_balance numeric(14,2) not null default 0,
  include_in_available boolean not null default true,
  color text not null default '#0f7556',
  icon text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_financial_accounts_group on public.financial_accounts(group_id, is_active);
alter table public.financial_accounts enable row level security;
create policy financial_accounts_select on public.financial_accounts for select to authenticated
using (public.is_group_member(group_id));
create policy financial_accounts_insert on public.financial_accounts for insert to authenticated
with check (public.has_write_permission(group_id));
create policy financial_accounts_update on public.financial_accounts for update to authenticated
using (public.has_write_permission(group_id)) with check (public.has_write_permission(group_id));
create policy financial_accounts_delete on public.financial_accounts for delete to authenticated
using (public.has_write_permission(group_id));
create trigger trg_financial_accounts_updated_at before update on public.financial_accounts
for each row execute function public.set_updated_at();

-- O cadastro antigo é preservado e passa a representar regras recorrentes.
alter table public.fixed_expenses rename to recurrences;
alter index if exists idx_fixed_expenses_group_id rename to idx_recurrences_group_id;
alter index if exists idx_fixed_expenses_category_id rename to idx_recurrences_category_id;
alter table public.recurrences rename constraint chk_fixed_expenses_amount to chk_recurrences_amount;
alter table public.recurrences rename constraint chk_fixed_expenses_recurrence_day to chk_recurrences_day;

alter table public.recurrences
  add column recurrence_type text not null default 'expense'
    check (recurrence_type in ('expense','income')),
  add column frequency text not null default 'monthly'
    check (frequency in ('weekly','monthly','yearly')),
  add column amount_mode text not null default 'fixed'
    check (amount_mode in ('fixed','estimated','variable')),
  add column start_date date not null default current_date,
  add column end_date date,
  add column next_due_date date,
  add column account_id uuid references public.financial_accounts(id) on delete set null,
  add column card_id uuid references public.cards(id) on delete set null,
  add column payment_method text
    check (payment_method is null or payment_method in ('cash','pix','debit','credit','bank_slip','transfer','other')),
  add column auto_generate boolean not null default true,
  add constraint chk_recurrences_destination check (not (account_id is not null and card_id is not null));
update public.recurrences
set next_due_date = make_date(
  extract(year from current_date)::int,
  extract(month from current_date)::int,
  least(recurrence_day, extract(day from (date_trunc('month', current_date) + interval '1 month - 1 day'))::int)
)
where next_due_date is null;
create index idx_recurrences_next_due on public.recurrences(group_id, next_due_date)
where is_active and auto_generate;

alter table public.cards
  add column issuer text,
  add column last_four text check (last_four is null or last_four ~ '^[0-9]{4}$'),
  add column brand text,
  add column payment_account_id uuid references public.financial_accounts(id) on delete set null,
  add column color text not null default '#6f5bd3',
  add column is_active boolean not null default true;

alter table public.transactions drop constraint if exists chk_transactions_kind;
alter table public.transactions
  add column account_id uuid references public.financial_accounts(id) on delete restrict,
  add column destination_account_id uuid references public.financial_accounts(id) on delete restrict,
  add column payment_method text
    check (payment_method is null or payment_method in ('cash','pix','debit','credit','bank_slip','transfer','other')),
  add column status text not null default 'cleared'
    check (status in ('scheduled','pending','cleared','reconciled','cancelled')),
  add column notes text,
  add column installment_number int check (installment_number is null or installment_number > 0),
  add column installment_count int check (installment_count is null or installment_count > 0),
  add column transfer_key uuid,
  add constraint chk_transactions_kind check (kind in ('expense','income','transfer')),
  add constraint chk_transaction_flow check (
    (kind = 'transfer' and account_id is not null and destination_account_id is not null and account_id <> destination_account_id and card_id is null)
    or (kind = 'income' and destination_account_id is null and card_id is null)
    or (kind = 'expense' and destination_account_id is null)
  ),
  add constraint chk_transaction_card_payment check (
    card_id is null or (kind = 'expense' and account_id is null and payment_method = 'credit')
  );
create index idx_transactions_account_date on public.transactions(account_id, transaction_date desc);
create index idx_transactions_destination_date on public.transactions(destination_account_id, transaction_date desc);
create index idx_transactions_card_date on public.transactions(card_id, transaction_date desc);

alter table public.bills
  add column recurrence_id uuid references public.recurrences(id) on delete set null,
  add column competence date,
  add column category_id uuid references public.categories(id) on delete set null,
  add column account_id uuid references public.financial_accounts(id) on delete set null,
  add column card_id uuid references public.cards(id) on delete set null,
  add column paid_transaction_id uuid references public.transactions(id) on delete set null,
  add column actual_amount numeric(14,2) check (actual_amount is null or actual_amount > 0),
  add column payment_date date,
  add column notes text;
alter table public.bills drop constraint if exists chk_bills_status;
alter table public.bills add constraint chk_bills_status
  check (status in ('scheduled','pending','paid','overdue','rescheduled','cancelled'));
update public.bills set source_type='dda' where source_type in ('dda_pdf','dda_photo');
alter table public.bills drop constraint if exists chk_bills_source_type;
alter table public.bills add constraint chk_bills_source_type
  check (source_type in ('manual','dda','recurrence','card_invoice'));
create unique index uq_bills_recurrence_competence
  on public.bills(recurrence_id, competence) where recurrence_id is not null;

alter table public.caixinhas
  add column description text,
  add column goal_type text not null default 'custom'
    check (goal_type in ('emergency','travel','purchase','education','home','vehicle','investment','debt','custom')),
  add column funding_account_id uuid references public.financial_accounts(id) on delete set null,
  add column color text not null default '#65dfb1',
  add column icon text,
  add column priority int not null default 3 check (priority between 1 and 5),
  add column is_active boolean not null default true;
alter table public.caixinha_deposits
  add column account_id uuid references public.financial_accounts(id) on delete set null;

-- Categorias globais iniciais para que novos lançamentos não comecem vazios.
insert into public.categories (group_id, name, icon, color, kind) values
  (null,'Moradia','house','#4F86C6','expense'),
  (null,'Alimentação','utensils','#E68A3F','expense'),
  (null,'Transporte','car','#8B6FC0','expense'),
  (null,'Saúde','heart-pulse','#D95D6A','expense'),
  (null,'Educação','graduation-cap','#3B9B89','expense'),
  (null,'Lazer','party-popper','#C96AA4','expense'),
  (null,'Assinaturas','repeat','#6B7C93','expense'),
  (null,'Outros','shapes','#7A8984','expense'),
  (null,'Salário','wallet','#2B956F','income'),
  (null,'Rendimentos','trending-up','#1F8A70','income'),
  (null,'Reembolso','undo-2','#4C84C4','income'),
  (null,'Outras receitas','circle-dollar-sign','#4A9D74','income')
on conflict do nothing;

-- Saldo por conta sem armazenar valor derivado.
create or replace function public.get_account_balances(p_group_id uuid)
returns table (
  id uuid, name text, account_type text, color text, include_in_available boolean,
  balance numeric
)
language sql stable security definer set search_path = public, pg_temp
as $$
  select a.id, a.name, a.account_type, a.color, a.include_in_available,
    a.initial_balance
    + coalesce(sum(case
        when t.kind='income' and t.account_id=a.id and t.status in ('cleared','reconciled') then t.amount
        when t.kind='expense' and t.account_id=a.id and t.status in ('cleared','reconciled') then -t.amount
        when t.kind='transfer' and t.account_id=a.id and t.status in ('cleared','reconciled') then -t.amount
        when t.kind='transfer' and t.destination_account_id=a.id and t.status in ('cleared','reconciled') then t.amount
        else 0 end),0)::numeric as balance
  from public.financial_accounts a
  left join public.transactions t on t.account_id=a.id or t.destination_account_id=a.id
  where a.group_id=p_group_id and public.is_group_member(p_group_id)
  group by a.id;
$$;

create or replace function public.generate_recurrence_bills(p_until date default (current_date + 45))
returns int language plpgsql security definer set search_path = public, pg_temp
as $$
declare r public.recurrences; v_due date; v_count int := 0;
begin
  for r in select * from public.recurrences
    where is_active and auto_generate and next_due_date <= p_until
      and public.has_write_permission(group_id)
  loop
    v_due := r.next_due_date;
    while v_due <= p_until and (r.end_date is null or v_due <= r.end_date) loop
      insert into public.bills (
        group_id, description, amount, due_date, source_type, status, created_by,
        recurrence_id, competence, category_id, account_id, card_id
      ) values (
        r.group_id, r.description, r.amount, v_due, 'recurrence', 'scheduled', r.created_by,
        r.id, date_trunc('month',v_due)::date, r.category_id, r.account_id, r.card_id
      ) on conflict (recurrence_id, competence) where recurrence_id is not null do nothing;
      if found then v_count := v_count + 1; end if;
      v_due := case r.frequency
        when 'weekly' then v_due + 7
        when 'yearly' then (v_due + interval '1 year')::date
        else (v_due + interval '1 month')::date end;
    end loop;
    update public.recurrences set next_due_date=v_due where id=r.id;
  end loop;
  return v_count;
end;
$$;

drop function if exists public.mark_bill_paid(uuid);
create function public.mark_bill_paid(
  bill_id uuid,
  p_account_id uuid,
  p_actual_amount numeric default null,
  p_payment_date date default current_date
)
returns public.bills language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_bill public.bills; v_member_id uuid; v_transaction_id uuid;
begin
  select * into v_bill from public.bills where id=bill_id for update;
  if not found then raise exception 'Conta não encontrada'; end if;
  if not public.has_write_permission(v_bill.group_id) then raise exception 'Sem permissão de escrita'; end if;
  if v_bill.status='paid' then return v_bill; end if;
  if not exists(select 1 from public.financial_accounts where id=p_account_id and group_id=v_bill.group_id)
    then raise exception 'Conta financeira inválida'; end if;
  select id into v_member_id from public.group_members where group_id=v_bill.group_id and user_id=auth.uid();
  insert into public.transactions(group_id,member_id,account_id,category_id,description,amount,transaction_date,kind,payment_method,status)
  values(v_bill.group_id,v_member_id,p_account_id,v_bill.category_id,v_bill.description,coalesce(p_actual_amount,v_bill.amount),p_payment_date,'expense','bank_slip','cleared')
  returning id into v_transaction_id;
  update public.bills set status='paid',paid_at=now(),payment_date=p_payment_date,
    actual_amount=coalesce(p_actual_amount,amount),account_id=p_account_id,paid_transaction_id=v_transaction_id
  where id=bill_id returning * into v_bill;
  return v_bill;
end;
$$;

revoke all on function public.get_account_balances(uuid) from public, anon;
revoke all on function public.generate_recurrence_bills(date) from public, anon;
revoke all on function public.mark_bill_paid(uuid,uuid,numeric,date) from public, anon;
grant execute on function public.get_account_balances(uuid) to authenticated;
grant execute on function public.generate_recurrence_bills(date) to authenticated;
grant execute on function public.mark_bill_paid(uuid,uuid,numeric,date) to authenticated;
