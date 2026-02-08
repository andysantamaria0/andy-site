-- ============================================
-- Vialoure Phase 1.5: Logistics + Admin
-- ============================================

-- ---- Logistics table ----
create table if not exists public.logistics (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null default 'other' check (type in ('flight', 'train', 'bus', 'car', 'accommodation', 'other')),
  title text not null,
  details jsonb default '{}',
  start_time timestamptz,
  end_time timestamptz,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.logistics enable row level security;

-- Members can view all logistics for their trips
create policy "Members can view trip logistics"
  on public.logistics for select
  using ( trip_id in (select public.get_my_trip_ids()) );

-- Members can create logistics (owners can create for anyone via the admin flow)
create policy "Members can create logistics"
  on public.logistics for insert
  to authenticated
  with check ( trip_id in (select public.get_my_trip_ids()) );

-- Users can edit their own logistics; owners can edit any
create policy "Users can update own logistics"
  on public.logistics for update
  using (
    auth.uid() = user_id
    or trip_id in (select public.get_my_owned_trip_ids())
  );

-- Users can delete their own; owners can delete any
create policy "Users can delete own logistics"
  on public.logistics for delete
  using (
    auth.uid() = user_id
    or trip_id in (select public.get_my_owned_trip_ids())
  );

create trigger logistics_updated_at
  before update on public.logistics
  for each row execute function public.update_updated_at();

-- ---- Allow owners to update any member's stay dates ----
drop policy if exists "Members can update own membership" on public.trip_members;

create policy "Members update own or owners update any"
  on public.trip_members for update
  using (
    auth.uid() = user_id
    or trip_id in (select public.get_my_owned_trip_ids())
  );
