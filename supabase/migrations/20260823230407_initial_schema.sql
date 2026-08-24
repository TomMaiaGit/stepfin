-- =========================================================
-- StepFin - schemas.sql (Supabase / PostgreSQL)
-- =========================================================

-- ---------- Função + trigger de updated_at ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- Helpers de RLS ----------
-- Criados após as tabelas base (ver adiante). Placeholder de ordem:

-- =========================================================
-- 1. profiles
-- =========================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone_whatsapp text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_profiles_email check (position('@' in email) > 1)
);
create index if not exists idx_profiles_email on public.profiles(email);

create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

-- =========================================================
-- 2. financial_groups
-- =========================================================
create table if not exists public.financial_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_financial_groups_owner_id on public.financial_groups(owner_id);

create trigger trg_financial_groups_updated_at
before update on public.financial_groups
for each row execute function public.set_updated_at();

alter table public.financial_groups enable row level security;

-- =========================================================
-- 3. group_members
-- =========================================================
create table if not exists public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.financial_groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member',
  permission_level text not null default 'read_write',
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_group_members_group_user unique (group_id, user_id),
  constraint chk_group_members_role check (role in ('owner', 'member')),
  constraint chk_group_members_permission check (permission_level in ('read_only', 'read_write'))
);
create index if not exists idx_group_members_group_id on public.group_members(group_id);
create index if not exists idx_group_members_user_id on public.group_members(user_id);

create trigger trg_group_members_updated_at
before update on public.group_members
for each row execute function public.set_updated_at();

alter table public.group_members enable row level security;

-- =========================================================
-- Helpers de RLS (dependem de group_members / financial_groups)
-- =========================================================
create or replace function public.is_group_member(p_group_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.group_members gm
    where gm.group_id = p_group_id
      and gm.user_id = auth.uid()
  );
$$;

create or replace function public.has_write_permission(p_group_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.group_members gm
    where gm.group_id = p_group_id
      and gm.user_id = auth.uid()
      and gm.permission_level = 'read_write'
  );
$$;

create or replace function public.is_group_owner(p_group_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.financial_groups fg
    where fg.id = p_group_id
      and fg.owner_id = auth.uid()
  );
$$;

-- =========================================================
-- 4. group_invitations
-- =========================================================
create table if not exists public.group_invitations (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.financial_groups(id) on delete cascade,
  invited_email text not null,
  invited_by uuid not null references public.profiles(id) on delete cascade,
  permission_level text not null default 'read_write',
  token text not null,
  status text not null default 'pending',
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_group_invitations_token unique (token),
  constraint chk_group_invitations_permission check (permission_level in ('read_only', 'read_write')),
  constraint chk_group_invitations_status check (status in ('pending', 'accepted', 'expired', 'revoked')),
  constraint chk_group_invitations_expiry check (expires_at > created_at)
);
create index if not exists idx_group_invitations_group_id on public.group_invitations(group_id);
create index if not exists idx_group_invitations_email on public.group_invitations(invited_email);

create trigger trg_group_invitations_updated_at
before update on public.group_invitations
for each row execute function public.set_updated_at();

alter table public.group_invitations enable row level security;

-- =========================================================
-- 5. cards
-- =========================================================
create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.financial_groups(id) on delete cascade,
  owner_member_id uuid not null references public.group_members(id) on delete cascade,
  name text not null,
  card_type text not null default 'credit',
  closing_day int,
  due_day int,
  credit_limit numeric(14,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_cards_type check (card_type in ('credit', 'debit')),
  constraint chk_cards_closing_day check (closing_day is null or closing_day between 1 and 31),
  constraint chk_cards_due_day check (due_day is null or due_day between 1 and 31),
  constraint chk_cards_credit_limit check (credit_limit is null or credit_limit >= 0)
);
create index if not exists idx_cards_group_id on public.cards(group_id);
create index if not exists idx_cards_owner_member_id on public.cards(owner_member_id);

create trigger trg_cards_updated_at
before update on public.cards
for each row execute function public.set_updated_at();

alter table public.cards enable row level security;

-- =========================================================
-- 6. categories
-- =========================================================
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.financial_groups(id) on delete cascade,
  name text not null,
  icon text,
  color text,
  kind text not null default 'expense',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_categories_kind check (kind in ('expense', 'income'))
);
create index if not exists idx_categories_group_id on public.categories(group_id);

create trigger trg_categories_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

alter table public.categories enable row level security;

-- =========================================================
-- 7. fixed_expenses
-- =========================================================
create table if not exists public.fixed_expenses (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.financial_groups(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  description text not null,
  amount numeric(14,2) not null,
  recurrence_day int not null,
  is_active boolean not null default true,
  created_by uuid not null references public.group_members(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_fixed_expenses_amount check (amount > 0),
  constraint chk_fixed_expenses_recurrence_day check (recurrence_day between 1 and 31)
);
create index if not exists idx_fixed_expenses_group_id on public.fixed_expenses(group_id);
create index if not exists idx_fixed_expenses_category_id on public.fixed_expenses(category_id);

create trigger trg_fixed_expenses_updated_at
before update on public.fixed_expenses
for each row execute function public.set_updated_at();

alter table public.fixed_expenses enable row level security;

-- =========================================================
-- 8. spreadsheet_imports (antes de transactions por causa da FK source_import_id)
-- =========================================================
create table if not exists public.spreadsheet_imports (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.financial_groups(id) on delete cascade,
  member_id uuid not null references public.group_members(id) on delete cascade,
  file_path text not null,
  status text not null default 'processing',
  rows_imported int default 0,
  summary jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_spreadsheet_imports_status check (status in ('processing', 'completed', 'failed')),
  constraint chk_spreadsheet_imports_rows check (rows_imported >= 0)
);
create index if not exists idx_spreadsheet_imports_group_id on public.spreadsheet_imports(group_id);

create trigger trg_spreadsheet_imports_updated_at
before update on public.spreadsheet_imports
for each row execute function public.set_updated_at();

alter table public.spreadsheet_imports enable row level security;

-- =========================================================
-- 9. transactions
-- =========================================================
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.financial_groups(id) on delete cascade,
  member_id uuid not null references public.group_members(id) on delete cascade,
  card_id uuid references public.cards(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  description text not null,
  amount numeric(14,2) not null,
  transaction_date date not null,
  kind text not null default 'expense',
  entry_method text not null default 'manual',
  receipt_file_path text,
  is_shared boolean not null default false,
  source_import_id uuid references public.spreadsheet_imports(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_transactions_amount check (amount > 0),
  constraint chk_transactions_kind check (kind in ('expense', 'income')),
  constraint chk_transactions_entry_method check (entry_method in ('manual', 'photo', 'pdf', 'spreadsheet', 'ofx', 'csv'))
);
create index if not exists idx_transactions_group_id on public.transactions(group_id);
create index if not exists idx_transactions_member_id on public.transactions(member_id);
create index if not exists idx_transactions_card_id on public.transactions(card_id);
create index if not exists idx_transactions_category_id on public.transactions(category_id);
create index if not exists idx_transactions_date on public.transactions(group_id, transaction_date desc);

create trigger trg_transactions_updated_at
before update on public.transactions
for each row execute function public.set_updated_at();

alter table public.transactions enable row level security;

-- =========================================================
-- 10. transaction_splits
-- =========================================================
create table if not exists public.transaction_splits (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  owed_by_member_id uuid references public.group_members(id) on delete set null,
  owed_by_name text,
  share_amount numeric(14,2) not null,
  is_settled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_transaction_splits_amount check (share_amount > 0),
  constraint chk_transaction_splits_debtor check (
    (owed_by_member_id is not null and owed_by_name is null)
    or (owed_by_member_id is null and nullif(btrim(owed_by_name), '') is not null)
  )
);
create index if not exists idx_transaction_splits_transaction_id on public.transaction_splits(transaction_id);
create index if not exists idx_transaction_splits_owed_by_member_id on public.transaction_splits(owed_by_member_id);

create trigger trg_transaction_splits_updated_at
before update on public.transaction_splits
for each row execute function public.set_updated_at();

alter table public.transaction_splits enable row level security;

-- =========================================================
-- 11. bills
-- =========================================================
create table if not exists public.bills (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.financial_groups(id) on delete cascade,
  description text not null,
  amount numeric(14,2) not null,
  due_date date not null,
  source_type text not null default 'manual',
  barcode text,
  document_file_path text,
  status text not null default 'pending',
  paid_at timestamptz,
  created_by uuid not null references public.group_members(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_bills_amount check (amount > 0),
  constraint chk_bills_source_type check (source_type in ('manual', 'dda_pdf', 'dda_photo')),
  constraint chk_bills_status check (status in ('pending', 'paid', 'rescheduled', 'overdue')),
  constraint chk_bills_paid_at check ((status = 'paid') = (paid_at is not null))
);
create index if not exists idx_bills_group_id on public.bills(group_id);
create index if not exists idx_bills_due_date on public.bills(group_id, due_date);
create index if not exists idx_bills_status on public.bills(status);

create trigger trg_bills_updated_at
before update on public.bills
for each row execute function public.set_updated_at();

alter table public.bills enable row level security;

-- =========================================================
-- 12. caixinhas
-- =========================================================
create table if not exists public.caixinhas (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.financial_groups(id) on delete cascade,
  name text not null,
  current_balance numeric(14,2) not null default 0,
  created_by uuid not null references public.group_members(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_caixinhas_balance check (current_balance >= 0)
);
create index if not exists idx_caixinhas_group_id on public.caixinhas(group_id);

create trigger trg_caixinhas_updated_at
before update on public.caixinhas
for each row execute function public.set_updated_at();

alter table public.caixinhas enable row level security;

-- =========================================================
-- 13. caixinha_deposits
-- =========================================================
create table if not exists public.caixinha_deposits (
  id uuid primary key default gen_random_uuid(),
  caixinha_id uuid not null references public.caixinhas(id) on delete cascade,
  member_id uuid not null references public.group_members(id) on delete cascade,
  amount numeric(14,2) not null,
  deposit_date date not null default current_date,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_caixinha_deposits_amount check (amount <> 0)
);
create index if not exists idx_caixinha_deposits_caixinha_id on public.caixinha_deposits(caixinha_id);
create index if not exists idx_caixinha_deposits_date on public.caixinha_deposits(caixinha_id, deposit_date desc);

create trigger trg_caixinha_deposits_updated_at
before update on public.caixinha_deposits
for each row execute function public.set_updated_at();

alter table public.caixinha_deposits enable row level security;

-- =========================================================
-- 14. caixinha_goals
-- =========================================================
create table if not exists public.caixinha_goals (
  id uuid primary key default gen_random_uuid(),
  caixinha_id uuid not null references public.caixinhas(id) on delete cascade,
  goal_name text not null,
  target_amount numeric(14,2) not null,
  target_date date,
  monthly_target numeric(14,2),
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_caixinha_goals_target check (target_amount > 0),
  constraint chk_caixinha_goals_monthly check (monthly_target is null or monthly_target > 0),
  constraint chk_caixinha_goals_status check (status in ('active', 'completed', 'cancelled'))
);
create index if not exists idx_caixinha_goals_caixinha_id on public.caixinha_goals(caixinha_id);

create trigger trg_caixinha_goals_updated_at
before update on public.caixinha_goals
for each row execute function public.set_updated_at();

alter table public.caixinha_goals enable row level security;

-- =========================================================
-- 15. notifications
-- =========================================================
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.financial_groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  related_bill_id uuid references public.bills(id) on delete set null,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_notifications_user_id on public.notifications(user_id, is_read);
create index if not exists idx_notifications_group_id on public.notifications(group_id);

create trigger trg_notifications_updated_at
before update on public.notifications
for each row execute function public.set_updated_at();

alter table public.notifications enable row level security;

-- =========================================================
-- 16. ai_conversations
-- =========================================================
create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.financial_groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  question text not null,
  answer text,
  insight_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_ai_conversations_group_id on public.ai_conversations(group_id);
create index if not exists idx_ai_conversations_user_id on public.ai_conversations(user_id);

create trigger trg_ai_conversations_updated_at
before update on public.ai_conversations
for each row execute function public.set_updated_at();

alter table public.ai_conversations enable row level security;

-- =========================================================
-- 17. notification_preferences
-- =========================================================
create table if not exists public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  days_before_due int not null default 3,
  channel_email boolean not null default true,
  channel_whatsapp boolean not null default false,
  channel_in_app boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_notification_prefs_user unique (user_id),
  constraint chk_notification_prefs_days check (days_before_due between 0 and 90)
);

create trigger trg_notification_preferences_updated_at
before update on public.notification_preferences
for each row execute function public.set_updated_at();

alter table public.notification_preferences enable row level security;

-- =========================================================
-- POLICIES
-- =========================================================

-- ---------- profiles ----------
create policy "profiles_select" on public.profiles
for select to authenticated
using (
  id = auth.uid()
  or exists (
    select 1 from public.group_members gm_self
    join public.group_members gm_other on gm_other.group_id = gm_self.group_id
    where gm_self.user_id = auth.uid() and gm_other.user_id = profiles.id
  )
);
create policy "profiles_insert" on public.profiles
for insert to authenticated
with check (id = auth.uid());
create policy "profiles_update" on public.profiles
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- ---------- financial_groups ----------
create policy "financial_groups_select" on public.financial_groups
for select to authenticated
using (public.is_group_member(id) or owner_id = auth.uid());
create policy "financial_groups_insert" on public.financial_groups
for insert to authenticated
with check (owner_id = auth.uid());
create policy "financial_groups_update" on public.financial_groups
for update to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());
create policy "financial_groups_delete" on public.financial_groups
for delete to authenticated
using (owner_id = auth.uid());

-- ---------- group_members ----------
create policy "group_members_select" on public.group_members
for select to authenticated
using (user_id = auth.uid() or public.is_group_owner(group_id));
create policy "group_members_insert" on public.group_members
for insert to authenticated
with check (public.is_group_owner(group_id));
create policy "group_members_update" on public.group_members
for update to authenticated
using (public.is_group_owner(group_id))
with check (public.is_group_owner(group_id));
create policy "group_members_delete" on public.group_members
for delete to authenticated
using (public.is_group_owner(group_id));

-- ---------- group_invitations ----------
create policy "group_invitations_select" on public.group_invitations
for select to authenticated
using (
  public.is_group_owner(group_id)
  or invited_email = (select email from public.profiles where id = auth.uid())
);
create policy "group_invitations_insert" on public.group_invitations
for insert to authenticated
with check (public.is_group_owner(group_id));
create policy "group_invitations_update" on public.group_invitations
for update to authenticated
using (public.is_group_owner(group_id))
with check (public.is_group_owner(group_id));
create policy "group_invitations_delete" on public.group_invitations
for delete to authenticated
using (public.is_group_owner(group_id));

-- ---------- cards ----------
create policy "cards_select" on public.cards
for select to authenticated
using (public.is_group_member(group_id));
create policy "cards_insert" on public.cards
for insert to authenticated
with check (public.has_write_permission(group_id));
create policy "cards_update" on public.cards
for update to authenticated
using (public.has_write_permission(group_id))
with check (public.has_write_permission(group_id));
create policy "cards_delete" on public.cards
for delete to authenticated
using (public.has_write_permission(group_id));

-- ---------- categories ----------
create policy "categories_select" on public.categories
for select to authenticated
using (group_id is null or public.is_group_member(group_id));
create policy "categories_insert" on public.categories
for insert to authenticated
with check (group_id is not null and public.has_write_permission(group_id));
create policy "categories_update" on public.categories
for update to authenticated
using (group_id is not null and public.has_write_permission(group_id))
with check (group_id is not null and public.has_write_permission(group_id));
create policy "categories_delete" on public.categories
for delete to authenticated
using (group_id is not null and public.has_write_permission(group_id));

-- ---------- fixed_expenses ----------
create policy "fixed_expenses_select" on public.fixed_expenses
for select to authenticated
using (public.is_group_member(group_id));
create policy "fixed_expenses_insert" on public.fixed_expenses
for insert to authenticated
with check (public.has_write_permission(group_id));
create policy "fixed_expenses_update" on public.fixed_expenses
for update to authenticated
using (public.has_write_permission(group_id))
with check (public.has_write_permission(group_id));
create policy "fixed_expenses_delete" on public.fixed_expenses
for delete to authenticated
using (public.has_write_permission(group_id));

-- ---------- spreadsheet_imports ----------
create policy "spreadsheet_imports_select" on public.spreadsheet_imports
for select to authenticated
using (public.is_group_member(group_id));
create policy "spreadsheet_imports_insert" on public.spreadsheet_imports
for insert to authenticated
with check (public.has_write_permission(group_id));
create policy "spreadsheet_imports_update" on public.spreadsheet_imports
for update to authenticated
using (public.has_write_permission(group_id))
with check (public.has_write_permission(group_id));
create policy "spreadsheet_imports_delete" on public.spreadsheet_imports
for delete to authenticated
using (public.has_write_permission(group_id));

-- ---------- transactions ----------
create policy "transactions_select" on public.transactions
for select to authenticated
using (public.is_group_member(group_id));
create policy "transactions_insert" on public.transactions
for insert to authenticated
with check (public.has_write_permission(group_id));
create policy "transactions_update" on public.transactions
for update to authenticated
using (public.has_write_permission(group_id))
with check (public.has_write_permission(group_id));
create policy "transactions_delete" on public.transactions
for delete to authenticated
using (
  public.is_group_owner(group_id)
  or exists (
    select 1 from public.group_members gm
    where gm.id = transactions.member_id and gm.user_id = auth.uid()
  )
);

-- ---------- transaction_splits ----------
create policy "transaction_splits_select" on public.transaction_splits
for select to authenticated
using (
  exists (
    select 1 from public.transactions t
    where t.id = transaction_splits.transaction_id
      and public.is_group_member(t.group_id)
  )
);
create policy "transaction_splits_insert" on public.transaction_splits
for insert to authenticated
with check (
  exists (
    select 1 from public.transactions t
    where t.id = transaction_splits.transaction_id
      and public.has_write_permission(t.group_id)
  )
);
create policy "transaction_splits_update" on public.transaction_splits
for update to authenticated
using (
  exists (
    select 1 from public.transactions t
    where t.id = transaction_splits.transaction_id
      and public.has_write_permission(t.group_id)
  )
)
with check (
  exists (
    select 1 from public.transactions t
    where t.id = transaction_splits.transaction_id
      and public.has_write_permission(t.group_id)
  )
);
create policy "transaction_splits_delete" on public.transaction_splits
for delete to authenticated
using (
  exists (
    select 1 from public.transactions t
    where t.id = transaction_splits.transaction_id
      and public.has_write_permission(t.group_id)
  )
);

-- ---------- bills ----------
create policy "bills_select" on public.bills
for select to authenticated
using (public.is_group_member(group_id));
create policy "bills_insert" on public.bills
for insert to authenticated
with check (public.has_write_permission(group_id));
create policy "bills_update" on public.bills
for update to authenticated
using (public.has_write_permission(group_id))
with check (public.has_write_permission(group_id));
create policy "bills_delete" on public.bills
for delete to authenticated
using (public.has_write_permission(group_id));

-- ---------- caixinhas ----------
create policy "caixinhas_select" on public.caixinhas
for select to authenticated
using (public.is_group_member(group_id));
create policy "caixinhas_insert" on public.caixinhas
for insert to authenticated
with check (public.has_write_permission(group_id));
create policy "caixinhas_update" on public.caixinhas
for update to authenticated
using (public.has_write_permission(group_id))
with check (public.has_write_permission(group_id));
create policy "caixinhas_delete" on public.caixinhas
for delete to authenticated
using (public.has_write_permission(group_id));

-- ---------- caixinha_deposits ----------
create policy "caixinha_deposits_select" on public.caixinha_deposits
for select to authenticated
using (
  exists (
    select 1 from public.caixinhas c
    where c.id = caixinha_deposits.caixinha_id
      and public.is_group_member(c.group_id)
  )
);
create policy "caixinha_deposits_insert" on public.caixinha_deposits
for insert to authenticated
with check (
  exists (
    select 1 from public.caixinhas c
    where c.id = caixinha_deposits.caixinha_id
      and public.has_write_permission(c.group_id)
  )
);
create policy "caixinha_deposits_update" on public.caixinha_deposits
for update to authenticated
using (
  exists (
    select 1 from public.caixinhas c
    where c.id = caixinha_deposits.caixinha_id
      and public.has_write_permission(c.group_id)
  )
)
with check (
  exists (
    select 1 from public.caixinhas c
    where c.id = caixinha_deposits.caixinha_id
      and public.has_write_permission(c.group_id)
  )
);
create policy "caixinha_deposits_delete" on public.caixinha_deposits
for delete to authenticated
using (
  exists (
    select 1 from public.caixinhas c
    where c.id = caixinha_deposits.caixinha_id
      and public.has_write_permission(c.group_id)
  )
);

-- ---------- caixinha_goals ----------
create policy "caixinha_goals_select" on public.caixinha_goals
for select to authenticated
using (
  exists (
    select 1 from public.caixinhas c
    where c.id = caixinha_goals.caixinha_id
      and public.is_group_member(c.group_id)
  )
);
create policy "caixinha_goals_insert" on public.caixinha_goals
for insert to authenticated
with check (
  exists (
    select 1 from public.caixinhas c
    where c.id = caixinha_goals.caixinha_id
      and public.has_write_permission(c.group_id)
  )
);
create policy "caixinha_goals_update" on public.caixinha_goals
for update to authenticated
using (
  exists (
    select 1 from public.caixinhas c
    where c.id = caixinha_goals.caixinha_id
      and public.has_write_permission(c.group_id)
  )
)
with check (
  exists (
    select 1 from public.caixinhas c
    where c.id = caixinha_goals.caixinha_id
      and public.has_write_permission(c.group_id)
  )
);
create policy "caixinha_goals_delete" on public.caixinha_goals
for delete to authenticated
using (
  exists (
    select 1 from public.caixinhas c
    where c.id = caixinha_goals.caixinha_id
      and public.has_write_permission(c.group_id)
  )
);

-- ---------- notifications ----------
create policy "notifications_select" on public.notifications
for select to authenticated
using (user_id = auth.uid());
create policy "notifications_update" on public.notifications
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
create policy "notifications_delete" on public.notifications
for delete to authenticated
using (user_id = auth.uid());

-- ---------- ai_conversations ----------
create policy "ai_conversations_select" on public.ai_conversations
for select to authenticated
using (user_id = auth.uid());
create policy "ai_conversations_delete" on public.ai_conversations
for delete to authenticated
using (user_id = auth.uid());

-- ---------- notification_preferences ----------
create policy "notification_preferences_select" on public.notification_preferences
for select to authenticated
using (user_id = auth.uid());
create policy "notification_preferences_insert" on public.notification_preferences
for insert to authenticated
with check (user_id = auth.uid());
create policy "notification_preferences_update" on public.notification_preferences
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- =========================================================
-- FUNÇÕES DE NEGÓCIO, TRIGGERS E GRANTS
-- =========================================================

-- Cria o perfil automaticamente no primeiro cadastro.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(nullif(public.profiles.full_name, ''), excluded.full_name),
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert or update of email, raw_user_meta_data on auth.users
for each row execute function public.handle_new_user();

-- Cria grupo e titular na mesma transação.
create or replace function public.create_financial_group(group_name text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_group_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Autenticação necessária';
  end if;
  if nullif(btrim(group_name), '') is null then
    raise exception 'Nome do grupo é obrigatório';
  end if;
  if not exists (select 1 from public.profiles where id = auth.uid()) then
    raise exception 'Perfil do usuário não encontrado';
  end if;

  insert into public.financial_groups (name, owner_id)
  values (btrim(group_name), auth.uid())
  returning id into v_group_id;

  insert into public.group_members (group_id, user_id, role, permission_level)
  values (v_group_id, auth.uid(), 'owner', 'read_write');

  return v_group_id;
end;
$$;

-- Aceita somente convite pendente, vigente e destinado ao e-mail autenticado.
create or replace function public.accept_invitation(token text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_invitation public.group_invitations%rowtype;
  v_email text;
begin
  if auth.uid() is null then
    raise exception 'Autenticação necessária';
  end if;
  select lower(email) into v_email from public.profiles where id = auth.uid();

  select * into v_invitation
  from public.group_invitations gi
  where gi.token = $1
  for update;

  if not found then raise exception 'Convite inválido'; end if;
  if v_invitation.status <> 'pending' then raise exception 'Convite não está pendente'; end if;
  if v_invitation.expires_at <= now() then
    update public.group_invitations set status = 'expired' where id = v_invitation.id;
    raise exception 'Convite expirado';
  end if;
  if lower(v_invitation.invited_email) <> v_email then
    raise exception 'Convite destinado a outro usuário';
  end if;

  insert into public.group_members (group_id, user_id, role, permission_level)
  values (v_invitation.group_id, auth.uid(), 'member', v_invitation.permission_level)
  on conflict (group_id, user_id) do update
    set permission_level = excluded.permission_level,
        updated_at = now();

  update public.group_invitations
  set status = 'accepted'
  where id = v_invitation.id;

  return v_invitation.group_id;
end;
$$;

-- Garante que só o dono real receba o papel owner.
create or replace function public.validate_group_member_role()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_owner_id uuid;
begin
  select owner_id into v_owner_id from public.financial_groups where id = new.group_id;
  if new.role = 'owner' and new.user_id <> v_owner_id then
    raise exception 'Somente o titular do grupo pode ter papel owner';
  end if;
  if new.user_id = v_owner_id and (new.role <> 'owner' or new.permission_level <> 'read_write') then
    raise exception 'O titular deve permanecer owner com permissão de escrita';
  end if;
  return new;
end;
$$;

create trigger trg_validate_group_member_role
before insert or update on public.group_members
for each row execute function public.validate_group_member_role();

-- Mantém o saldo da caixinha como soma atômica dos aportes e retiradas.
create or replace function public.sync_caixinha_balance()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_caixinha_id uuid := coalesce(new.caixinha_id, old.caixinha_id);
begin
  update public.caixinhas c
  set current_balance = coalesce((
        select sum(d.amount) from public.caixinha_deposits d
        where d.caixinha_id = v_caixinha_id
      ), 0),
      updated_at = now()
  where c.id = v_caixinha_id;
  return coalesce(new, old);
end;
$$;

create trigger trg_sync_caixinha_balance
after insert or update or delete on public.caixinha_deposits
for each row execute function public.sync_caixinha_balance();

create or replace function public.initialize_caixinha_balance()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.current_balance := 0;
  return new;
end;
$$;

create trigger trg_initialize_caixinha_balance
before insert on public.caixinhas
for each row execute function public.initialize_caixinha_balance();

create or replace function public.record_caixinha_deposit(
  caixinha_id uuid,
  amount numeric,
  deposit_date date default current_date,
  note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_group_id uuid;
  v_member_id uuid;
  v_deposit_id uuid;
  v_balance numeric;
begin
  if amount is null or amount = 0 then raise exception 'O valor deve ser diferente de zero'; end if;
  select group_id, current_balance into v_group_id, v_balance
  from public.caixinhas where id = caixinha_id for update;
  if not found then raise exception 'Caixinha não encontrada'; end if;
  if not public.has_write_permission(v_group_id) then raise exception 'Sem permissão de escrita'; end if;
  if v_balance + amount < 0 then raise exception 'Saldo insuficiente para a retirada'; end if;
  select id into v_member_id from public.group_members
  where group_id = v_group_id and user_id = auth.uid();

  insert into public.caixinha_deposits (caixinha_id, member_id, amount, deposit_date, note)
  values (caixinha_id, v_member_id, amount, coalesce(deposit_date, current_date), nullif(btrim(note), ''))
  returning id into v_deposit_id;
  return v_deposit_id;
end;
$$;

create or replace function public.mark_bill_paid(bill_id uuid)
returns public.bills
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_bill public.bills;
begin
  select * into v_bill from public.bills where id = bill_id for update;
  if not found then raise exception 'Conta não encontrada'; end if;
  if not public.has_write_permission(v_bill.group_id) then raise exception 'Sem permissão de escrita'; end if;
  update public.bills set status = 'paid', paid_at = now()
  where id = bill_id returning * into v_bill;
  return v_bill;
end;
$$;

-- Valida o grupo do devedor e impede que divisões ultrapassem o lançamento.
create or replace function public.after_transaction_split_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_transaction_id uuid := coalesce(new.transaction_id, old.transaction_id);
  v_group_id uuid;
  v_amount numeric;
  v_total numeric;
begin
  select group_id, amount into v_group_id, v_amount
  from public.transactions where id = v_transaction_id for update;

  if tg_op <> 'DELETE' and new.owed_by_member_id is not null and not exists (
    select 1 from public.group_members
    where id = new.owed_by_member_id and group_id = v_group_id
  ) then
    raise exception 'O membro da divisão não pertence ao grupo da transação';
  end if;

  select coalesce(sum(share_amount), 0) into v_total
  from public.transaction_splits where transaction_id = v_transaction_id;
  if v_total > v_amount then raise exception 'A soma das divisões excede o valor da transação'; end if;

  update public.transactions
  set is_shared = (v_total > 0), updated_at = now()
  where id = v_transaction_id;
  return coalesce(new, old);
end;
$$;

create trigger trg_after_transaction_split_change
after insert or update or delete on public.transaction_splits
for each row execute function public.after_transaction_split_change();

create or replace function public.get_group_dashboard(group_id uuid, month date)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare v_start date := date_trunc('month', coalesce($2, current_date))::date;
begin
  if not public.is_group_member($1) then raise exception 'Sem acesso ao grupo'; end if;
  return jsonb_build_object(
    'month', v_start,
    'income', coalesce((select sum(amount) from public.transactions where group_id=$1 and kind='income' and transaction_date>=v_start and transaction_date<v_start+interval '1 month'),0),
    'expenses', coalesce((select sum(amount) from public.transactions where group_id=$1 and kind='expense' and transaction_date>=v_start and transaction_date<v_start+interval '1 month'),0),
    'pending_bills', coalesce((select sum(amount) from public.bills where group_id=$1 and status in ('pending','overdue')),0),
    'caixinhas_balance', coalesce((select sum(current_balance) from public.caixinhas where group_id=$1),0),
    'expenses_by_category', coalesce((select jsonb_agg(x order by x.total desc) from (
      select coalesce(c.name,'Sem categoria') as category, sum(t.amount) as total
      from public.transactions t left join public.categories c on c.id=t.category_id
      where t.group_id=$1 and t.kind='expense' and t.transaction_date>=v_start and t.transaction_date<v_start+interval '1 month'
      group by coalesce(c.name,'Sem categoria')
    ) x), '[]'::jsonb)
  );
end;
$$;

-- O saldo é derivado dos movimentos; clientes só podem editar o nome da caixinha.
revoke update on public.caixinhas from authenticated;
grant update (name) on public.caixinhas to authenticated;

revoke all on function public.create_financial_group(text) from public;
revoke all on function public.accept_invitation(text) from public;
revoke all on function public.record_caixinha_deposit(uuid, numeric, date, text) from public;
revoke all on function public.mark_bill_paid(uuid) from public;
revoke all on function public.get_group_dashboard(uuid, date) from public;
grant execute on function public.create_financial_group(text) to authenticated;
grant execute on function public.accept_invitation(text) to authenticated;
grant execute on function public.record_caixinha_deposit(uuid, numeric, date, text) to authenticated;
grant execute on function public.mark_bill_paid(uuid) to authenticated;
grant execute on function public.get_group_dashboard(uuid, date) to authenticated;

-- =========================================================
-- STORAGE PRIVADO (caminho obrigatório: <group_id>/<arquivo>)
-- =========================================================
insert into storage.buckets (id, name, public)
values
  ('receipts', 'receipts', false),
  ('bill-documents', 'bill-documents', false),
  ('spreadsheets', 'spreadsheets', false)
on conflict (id) do update set public = false;

create policy "group_files_select" on storage.objects
for select to authenticated
using (
  bucket_id in ('receipts', 'bill-documents', 'spreadsheets')
  and public.is_group_member(((storage.foldername(name))[1])::uuid)
);
create policy "group_files_insert" on storage.objects
for insert to authenticated
with check (
  bucket_id in ('receipts', 'bill-documents', 'spreadsheets')
  and public.has_write_permission(((storage.foldername(name))[1])::uuid)
);
create policy "group_files_update" on storage.objects
for update to authenticated
using (
  bucket_id in ('receipts', 'bill-documents', 'spreadsheets')
  and public.has_write_permission(((storage.foldername(name))[1])::uuid)
)
with check (
  bucket_id in ('receipts', 'bill-documents', 'spreadsheets')
  and public.has_write_permission(((storage.foldername(name))[1])::uuid)
);
create policy "group_files_delete" on storage.objects
for delete to authenticated
using (
  bucket_id in ('receipts', 'bill-documents', 'spreadsheets')
  and public.has_write_permission(((storage.foldername(name))[1])::uuid)
);
