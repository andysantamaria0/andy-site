-- ============================================
-- Vialoure Phase 1: Foundation
-- ============================================

-- =====================
-- 1. Create all tables
-- =====================

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  avatar_url text,
  email text,
  created_at timestamptz default now()
);

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  destination text not null,
  start_date date,
  end_date date,
  cover_image_url text,
  currency text default 'USD',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.trip_members (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  stay_start date,
  stay_end date,
  color text default '#4A35D7',
  joined_at timestamptz default now(),
  unique (trip_id, user_id)
);

-- =====================
-- 2. Enable RLS
-- =====================

alter table public.profiles enable row level security;
alter table public.trips enable row level security;
alter table public.trip_members enable row level security;

-- =====================
-- 3. Helper function to break RLS recursion
-- Security definer runs as the function owner (postgres),
-- bypassing RLS on the queried table.
-- =====================

create or replace function public.get_my_trip_ids()
returns setof uuid
language sql
security definer
set search_path = ''
stable
as $$
  select trip_id from public.trip_members where user_id = auth.uid();
$$;

create or replace function public.get_my_owned_trip_ids()
returns setof uuid
language sql
security definer
set search_path = ''
stable
as $$
  select trip_id from public.trip_members where user_id = auth.uid() and role = 'owner';
$$;

-- =====================
-- 4. Profiles policies
-- =====================

create policy "Profiles are publicly readable"
  on public.profiles for select
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- =====================
-- 5. Trips policies
-- =====================

create policy "Authenticated users can create trips"
  on public.trips for insert
  to authenticated
  with check (auth.uid() = created_by);

create policy "Trip members can view trips"
  on public.trips for select
  using (
    auth.uid() = created_by
    or id in (select public.get_my_trip_ids())
  );

create policy "Trip owners can update trips"
  on public.trips for update
  using (
    exists (
      select 1 from public.trip_members
      where trip_members.trip_id = trips.id
        and trip_members.user_id = auth.uid()
        and trip_members.role = 'owner'
    )
  );

-- =====================
-- 6. Trip Members policies
-- =====================

create policy "Members can view trip members"
  on public.trip_members for select
  using ( trip_id in (select public.get_my_trip_ids()) );

create policy "Users can add themselves as members"
  on public.trip_members for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Members can update own membership"
  on public.trip_members for update
  using (auth.uid() = user_id);

create policy "Owners can remove members or self-remove"
  on public.trip_members for delete
  using (
    auth.uid() = user_id
    or trip_id in (select public.get_my_owned_trip_ids())
  );

-- =====================
-- 7. Functions & Triggers
-- =====================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url',
    new.email
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trips_updated_at
  before update on public.trips
  for each row execute function public.update_updated_at();
