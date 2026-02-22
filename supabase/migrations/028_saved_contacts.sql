-- ============================================
-- Saved Contacts (per-user address book)
-- ============================================

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  email text,
  phone text,
  created_at timestamptz default now()
);

-- Prevent duplicate contact names per user
create unique index if not exists idx_contacts_owner_name
  on public.contacts (owner_id, lower(display_name));

create index if not exists idx_contacts_owner
  on public.contacts (owner_id);

alter table public.contacts enable row level security;

create policy "Users can view own contacts"
  on public.contacts for select
  using (owner_id = auth.uid());

create policy "Users can insert own contacts"
  on public.contacts for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "Users can update own contacts"
  on public.contacts for update
  using (owner_id = auth.uid());

create policy "Users can delete own contacts"
  on public.contacts for delete
  using (owner_id = auth.uid());
