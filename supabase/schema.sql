create extension if not exists pgcrypto;

create table if not exists public.ledger_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  initial_principal numeric(14, 2) not null default 0,
  currency text not null default 'CNY',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('income', 'expense')),
  color text not null,
  icon text not null,
  is_system boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  amount numeric(14, 2) not null check (amount > 0),
  category_id text not null,
  occurred_at timestamptz not null,
  note text not null default '',
  source text not null check (source in ('manual', 'wechat_import', 'alipay_import')),
  payment_channel text not null check (payment_channel in ('wechat', 'alipay', 'cash', 'bank_card', 'other')),
  external_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.import_batches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null check (source in ('wechat', 'alipay')),
  file_name text not null,
  status text not null check (status in ('previewing', 'imported', 'failed')),
  total_rows integer not null default 0,
  imported_rows integer not null default 0,
  duplicate_rows integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists categories_user_type_idx on public.categories(user_id, type);
create index if not exists transactions_user_occurred_idx on public.transactions(user_id, occurred_at desc);
create unique index if not exists transactions_external_key_idx
  on public.transactions(user_id, source, external_key)
  where external_key is not null;

alter table public.ledger_settings enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.import_batches enable row level security;

create policy "ledger_settings_select_own" on public.ledger_settings for select using (auth.uid() = user_id);
create policy "ledger_settings_insert_own" on public.ledger_settings for insert with check (auth.uid() = user_id);
create policy "ledger_settings_update_own" on public.ledger_settings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "ledger_settings_delete_own" on public.ledger_settings for delete using (auth.uid() = user_id);

create policy "categories_select_own" on public.categories for select using (auth.uid() = user_id);
create policy "categories_insert_own" on public.categories for insert with check (auth.uid() = user_id);
create policy "categories_update_own" on public.categories for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "categories_delete_own" on public.categories for delete using (auth.uid() = user_id);

create policy "transactions_select_own" on public.transactions for select using (auth.uid() = user_id);
create policy "transactions_insert_own" on public.transactions for insert with check (auth.uid() = user_id);
create policy "transactions_update_own" on public.transactions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "transactions_delete_own" on public.transactions for delete using (auth.uid() = user_id);

create policy "import_batches_select_own" on public.import_batches for select using (auth.uid() = user_id);
create policy "import_batches_insert_own" on public.import_batches for insert with check (auth.uid() = user_id);
create policy "import_batches_update_own" on public.import_batches for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "import_batches_delete_own" on public.import_batches for delete using (auth.uid() = user_id);
