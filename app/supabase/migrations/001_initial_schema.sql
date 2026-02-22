-- ============================================
-- Letifi Database Schema
-- Supabase Postgres + RLS
-- ============================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================
-- ACCOUNTS
-- ============================================
create table public.accounts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  company_name text,
  phone text,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

alter table public.accounts enable row level security;

create policy "Users can view own account"
  on public.accounts for select
  using (user_id = auth.uid());

create policy "Users can insert own account"
  on public.accounts for insert
  with check (user_id = auth.uid());

create policy "Users can update own account"
  on public.accounts for update
  using (user_id = auth.uid());

-- ============================================
-- PROPERTIES
-- ============================================
create type property_type as enum ('house', 'flat', 'hmo', 'room');
create type ownership_type as enum ('personal', 'company');

create table public.properties (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  nickname text not null,
  address_line_1 text not null,
  address_line_2 text,
  city text not null,
  county text,
  postcode text not null,
  property_type property_type not null default 'house',
  bedrooms integer,
  ownership ownership_type not null default 'personal',
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.properties enable row level security;

create policy "Users can view own properties"
  on public.properties for select
  using (account_id in (select id from public.accounts where user_id = auth.uid()));

create policy "Users can insert own properties"
  on public.properties for insert
  with check (account_id in (select id from public.accounts where user_id = auth.uid()));

create policy "Users can update own properties"
  on public.properties for update
  using (account_id in (select id from public.accounts where user_id = auth.uid()));

create policy "Users can delete own properties"
  on public.properties for delete
  using (account_id in (select id from public.accounts where user_id = auth.uid()));

-- ============================================
-- TENANCIES
-- ============================================
create type tenancy_type as enum ('ast', 'periodic', 'contractual_periodic', 'company_let');
create type deposit_scheme as enum ('dps', 'tds', 'mydeposits', 'other');

create table public.tenancies (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  tenant_name text not null,
  tenant_email text,
  tenant_phone text,
  tenancy_type tenancy_type not null default 'ast',
  start_date date not null,
  end_date date,
  rent_amount numeric(10,2) not null,
  rent_frequency text not null default 'monthly' check (rent_frequency in ('weekly', 'monthly')),
  rent_due_day integer check (rent_due_day between 1 and 31),
  payment_method text,
  deposit_amount numeric(10,2),
  deposit_scheme deposit_scheme,
  deposit_protected_date date,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tenancies enable row level security;

create policy "Users can view own tenancies"
  on public.tenancies for select
  using (account_id in (select id from public.accounts where user_id = auth.uid()));

create policy "Users can insert own tenancies"
  on public.tenancies for insert
  with check (account_id in (select id from public.accounts where user_id = auth.uid()));

create policy "Users can update own tenancies"
  on public.tenancies for update
  using (account_id in (select id from public.accounts where user_id = auth.uid()));

create policy "Users can delete own tenancies"
  on public.tenancies for delete
  using (account_id in (select id from public.accounts where user_id = auth.uid()));

-- ============================================
-- COMPLIANCE RECORDS
-- ============================================
create type compliance_type as enum (
  'gas_safety',
  'eicr',
  'epc',
  'smoke_co_alarm',
  'deposit_protection',
  'right_to_rent',
  'legionella',
  'property_licence'
);

create type compliance_status as enum ('valid', 'due_soon', 'overdue', 'not_set');

create table public.compliance_records (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  compliance_type compliance_type not null,
  status compliance_status not null default 'not_set',
  last_completed_date date,
  due_date date,
  reminder_days integer not null default 30,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.compliance_records enable row level security;

create policy "Users can view own compliance"
  on public.compliance_records for select
  using (account_id in (select id from public.accounts where user_id = auth.uid()));

create policy "Users can insert own compliance"
  on public.compliance_records for insert
  with check (account_id in (select id from public.accounts where user_id = auth.uid()));

create policy "Users can update own compliance"
  on public.compliance_records for update
  using (account_id in (select id from public.accounts where user_id = auth.uid()));

create policy "Users can delete own compliance"
  on public.compliance_records for delete
  using (account_id in (select id from public.accounts where user_id = auth.uid()));

-- ============================================
-- MONEY ENTRIES (Income + Expenses)
-- ============================================
create type money_type as enum ('income', 'expense');
create type expense_category as enum (
  'rent_income',
  'other_income',
  'mortgage_interest',
  'repairs_maintenance',
  'insurance',
  'utilities',
  'management_fees',
  'legal_professional',
  'travel',
  'advertising',
  'ground_rent_service_charge',
  'council_tax',
  'other_expense'
);

create table public.money_entries (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  property_id uuid references public.properties(id) on delete set null,
  entry_type money_type not null,
  category expense_category not null,
  amount numeric(10,2) not null,
  entry_date date not null,
  description text,
  notes text,
  tax_year text, -- e.g. '2024-25'
  quarter integer check (quarter between 1 and 4),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.money_entries enable row level security;

create policy "Users can view own money entries"
  on public.money_entries for select
  using (account_id in (select id from public.accounts where user_id = auth.uid()));

create policy "Users can insert own money entries"
  on public.money_entries for insert
  with check (account_id in (select id from public.accounts where user_id = auth.uid()));

create policy "Users can update own money entries"
  on public.money_entries for update
  using (account_id in (select id from public.accounts where user_id = auth.uid()));

create policy "Users can delete own money entries"
  on public.money_entries for delete
  using (account_id in (select id from public.accounts where user_id = auth.uid()));

-- ============================================
-- DOCUMENTS
-- ============================================
create table public.documents (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  property_id uuid references public.properties(id) on delete set null,
  tenancy_id uuid references public.tenancies(id) on delete set null,
  compliance_id uuid references public.compliance_records(id) on delete set null,
  file_name text not null,
  file_type text not null,
  file_size integer,
  storage_path text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.documents enable row level security;

create policy "Users can view own documents"
  on public.documents for select
  using (account_id in (select id from public.accounts where user_id = auth.uid()));

create policy "Users can insert own documents"
  on public.documents for insert
  with check (account_id in (select id from public.accounts where user_id = auth.uid()));

create policy "Users can update own documents"
  on public.documents for update
  using (account_id in (select id from public.accounts where user_id = auth.uid()));

create policy "Users can delete own documents"
  on public.documents for delete
  using (account_id in (select id from public.accounts where user_id = auth.uid()));

-- ============================================
-- STORAGE BUCKET
-- ============================================
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false);

create policy "Users can upload documents"
  on storage.objects for insert
  with check (
    bucket_id = 'documents'
    and auth.uid() is not null
  );

create policy "Users can view own documents"
  on storage.objects for select
  using (
    bucket_id = 'documents'
    and auth.uid() is not null
  );

create policy "Users can delete own documents"
  on storage.objects for delete
  using (
    bucket_id = 'documents'
    and auth.uid() is not null
  );

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply triggers
create trigger update_accounts_updated_at before update on public.accounts
  for each row execute function public.update_updated_at();

create trigger update_properties_updated_at before update on public.properties
  for each row execute function public.update_updated_at();

create trigger update_tenancies_updated_at before update on public.tenancies
  for each row execute function public.update_updated_at();

create trigger update_compliance_updated_at before update on public.compliance_records
  for each row execute function public.update_updated_at();

create trigger update_money_entries_updated_at before update on public.money_entries
  for each row execute function public.update_updated_at();

create trigger update_documents_updated_at before update on public.documents
  for each row execute function public.update_updated_at();

-- Function to get user's account_id
create or replace function public.get_account_id()
returns uuid as $$
  select id from public.accounts where user_id = auth.uid() limit 1;
$$ language sql security definer;

-- Function to compute UK tax year quarter from a date
create or replace function public.get_uk_tax_quarter(d date)
returns integer as $$
begin
  -- UK tax year: Q1=Apr-Jun, Q2=Jul-Sep, Q3=Oct-Dec, Q4=Jan-Mar
  case extract(month from d)
    when 4, 5, 6 then return 1;
    when 7, 8, 9 then return 2;
    when 10, 11, 12 then return 3;
    when 1, 2, 3 then return 4;
  end case;
end;
$$ language plpgsql immutable;

-- Function to compute UK tax year string from a date
create or replace function public.get_uk_tax_year(d date)
returns text as $$
declare
  y integer := extract(year from d);
  m integer := extract(month from d);
begin
  if m >= 4 then
    return y::text || '-' || ((y + 1) % 100)::text;
  else
    return (y - 1)::text || '-' || (y % 100)::text;
  end if;
end;
$$ language plpgsql immutable;

-- ============================================
-- INDEXES
-- ============================================
create index idx_properties_account on public.properties(account_id);
create index idx_tenancies_property on public.tenancies(property_id);
create index idx_tenancies_account on public.tenancies(account_id);
create index idx_compliance_property on public.compliance_records(property_id);
create index idx_compliance_account on public.compliance_records(account_id);
create index idx_money_account on public.money_entries(account_id);
create index idx_money_property on public.money_entries(property_id);
create index idx_money_date on public.money_entries(entry_date);
create index idx_documents_account on public.documents(account_id);
create index idx_documents_property on public.documents(property_id);
