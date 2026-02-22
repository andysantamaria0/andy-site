-- ============================================
-- Trip Legs & Multi-Person Logistics
-- ============================================

-- =====================
-- 1. New tables
-- =====================

-- trip_legs — ordered destinations within a trip
create table if not exists public.trip_legs (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  destination text not null,
  start_date date,
  end_date date,
  leg_order integer not null default 1,
  accommodation_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (trip_id, leg_order)
);

alter table public.trip_legs enable row level security;

create policy "Members can view trip legs"
  on public.trip_legs for select
  using ( trip_id in (select public.get_my_trip_ids()) );

create policy "Owners can create trip legs"
  on public.trip_legs for insert
  to authenticated
  with check ( trip_id in (select public.get_my_owned_trip_ids()) );

create policy "Owners can update trip legs"
  on public.trip_legs for update
  using ( trip_id in (select public.get_my_owned_trip_ids()) );

create policy "Owners can delete trip legs"
  on public.trip_legs for delete
  using ( trip_id in (select public.get_my_owned_trip_ids()) );

create trigger trip_legs_updated_at
  before update on public.trip_legs
  for each row execute function public.update_updated_at();

-- trip_leg_members — which members are on which legs
create table if not exists public.trip_leg_members (
  id uuid primary key default gen_random_uuid(),
  leg_id uuid not null references public.trip_legs(id) on delete cascade,
  member_id uuid not null references public.trip_members(id) on delete cascade,
  staying_at text,
  unique (leg_id, member_id)
);

alter table public.trip_leg_members enable row level security;

create policy "Members can view trip leg members"
  on public.trip_leg_members for select
  using (
    leg_id in (
      select tl.id from public.trip_legs tl
      where tl.trip_id in (select public.get_my_trip_ids())
    )
  );

create policy "Owners can create trip leg members"
  on public.trip_leg_members for insert
  to authenticated
  with check (
    leg_id in (
      select tl.id from public.trip_legs tl
      where tl.trip_id in (select public.get_my_owned_trip_ids())
    )
  );

create policy "Owners can update trip leg members"
  on public.trip_leg_members for update
  using (
    leg_id in (
      select tl.id from public.trip_legs tl
      where tl.trip_id in (select public.get_my_owned_trip_ids())
    )
  );

create policy "Owners can delete trip leg members"
  on public.trip_leg_members for delete
  using (
    leg_id in (
      select tl.id from public.trip_legs tl
      where tl.trip_id in (select public.get_my_owned_trip_ids())
    )
  );

-- logistics_travelers — multiple people per logistics entry
create table if not exists public.logistics_travelers (
  id uuid primary key default gen_random_uuid(),
  logistics_id uuid not null references public.logistics(id) on delete cascade,
  member_id uuid not null references public.trip_members(id) on delete cascade,
  unique (logistics_id, member_id)
);

alter table public.logistics_travelers enable row level security;

create policy "Members can view logistics travelers"
  on public.logistics_travelers for select
  using (
    logistics_id in (
      select l.id from public.logistics l
      where l.trip_id in (select public.get_my_trip_ids())
    )
  );

create policy "Members can create logistics travelers"
  on public.logistics_travelers for insert
  to authenticated
  with check (
    logistics_id in (
      select l.id from public.logistics l
      where l.trip_id in (select public.get_my_trip_ids())
    )
  );

create policy "Owners can update logistics travelers"
  on public.logistics_travelers for update
  using (
    logistics_id in (
      select l.id from public.logistics l
      where l.trip_id in (select public.get_my_owned_trip_ids())
    )
  );

create policy "Owners can delete logistics travelers"
  on public.logistics_travelers for delete
  using (
    logistics_id in (
      select l.id from public.logistics l
      where (l.trip_id in (select public.get_my_owned_trip_ids()) or auth.uid() = l.user_id)
    )
  );

-- =====================
-- 2. Column additions
-- =====================

-- leg_id FK on logistics, events, expenses
alter table public.logistics add column if not exists leg_id uuid references public.trip_legs(id) on delete set null;
alter table public.events add column if not exists leg_id uuid references public.trip_legs(id) on delete set null;
alter table public.expenses add column if not exists leg_id uuid references public.trip_legs(id) on delete set null;

-- Update logistics type check constraint to add 'ferry'
alter table public.logistics drop constraint if exists logistics_type_check;
alter table public.logistics add constraint logistics_type_check
  check (type in ('flight', 'train', 'bus', 'car', 'accommodation', 'ferry', 'other'));

-- =====================
-- 3. Indexes
-- =====================

create index if not exists idx_trip_legs_trip_order on public.trip_legs(trip_id, leg_order);
create index if not exists idx_trip_leg_members_leg on public.trip_leg_members(leg_id);
create index if not exists idx_trip_leg_members_member on public.trip_leg_members(member_id);
create index if not exists idx_logistics_travelers_logistics on public.logistics_travelers(logistics_id);
create index if not exists idx_logistics_travelers_member on public.logistics_travelers(member_id);
create index if not exists idx_logistics_leg on public.logistics(leg_id) where leg_id is not null;
create index if not exists idx_events_leg on public.events(leg_id) where leg_id is not null;
create index if not exists idx_expenses_leg on public.expenses(leg_id) where leg_id is not null;

-- =====================
-- 4. Backfill existing data
-- =====================

-- Create one default leg per existing trip
insert into public.trip_legs (trip_id, destination, start_date, end_date, leg_order)
select id, coalesce(destination, name, 'TBD'), start_date, end_date, 1
from public.trips
on conflict (trip_id, leg_order) do nothing;

-- Assign all existing members to their trip's default leg
insert into public.trip_leg_members (leg_id, member_id, staying_at)
select tl.id, tm.id, tm.staying_at
from public.trip_members tm
join public.trip_legs tl on tl.trip_id = tm.trip_id and tl.leg_order = 1
on conflict (leg_id, member_id) do nothing;

-- Create logistics_travelers rows from existing logistics.user_id -> matching trip_members
insert into public.logistics_travelers (logistics_id, member_id)
select l.id, tm.id
from public.logistics l
join public.trip_members tm on tm.trip_id = l.trip_id and tm.user_id = l.user_id
on conflict (logistics_id, member_id) do nothing;
