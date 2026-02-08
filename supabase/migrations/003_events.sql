-- ============================================
-- Vialoure Phase 2: Events & Calendar
-- ============================================

-- ---- Events table ----
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  title text not null,
  category text not null default 'other' check (category in ('dinner_out', 'dinner_home', 'activity', 'outing', 'party', 'sightseeing', 'other')),
  event_date date not null,
  start_time time,
  end_time time,
  location text,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ---- Event attendees junction table ----
create table if not exists public.event_attendees (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  member_id uuid not null references public.trip_members(id) on delete cascade,
  unique (event_id, member_id)
);

-- ---- Enable RLS ----
alter table public.events enable row level security;
alter table public.event_attendees enable row level security;

-- ---- Events policies ----

create policy "Members can view trip events"
  on public.events for select
  using ( trip_id in (select public.get_my_trip_ids()) );

create policy "Members can create events"
  on public.events for insert
  to authenticated
  with check ( trip_id in (select public.get_my_trip_ids()) );

create policy "Creators or owners can update events"
  on public.events for update
  using (
    auth.uid() = created_by
    or trip_id in (select public.get_my_owned_trip_ids())
  );

create policy "Creators or owners can delete events"
  on public.events for delete
  using (
    auth.uid() = created_by
    or trip_id in (select public.get_my_owned_trip_ids())
  );

-- ---- Event attendees policies ----

create policy "Members can view event attendees"
  on public.event_attendees for select
  using (
    event_id in (
      select id from public.events
      where trip_id in (select public.get_my_trip_ids())
    )
  );

create policy "Members can manage event attendees"
  on public.event_attendees for insert
  to authenticated
  with check (
    event_id in (
      select id from public.events
      where trip_id in (select public.get_my_trip_ids())
    )
  );

create policy "Members can delete event attendees"
  on public.event_attendees for delete
  using (
    event_id in (
      select id from public.events
      where trip_id in (select public.get_my_trip_ids())
    )
  );

-- ---- Trigger for updated_at ----
create trigger events_updated_at
  before update on public.events
  for each row execute function public.update_updated_at();
