-- Flight status cache for FlightAware AeroAPI responses
-- Used by /api/flights/[flightNumber] with a 5-minute TTL

create table if not exists flight_status_cache (
  id uuid primary key default gen_random_uuid(),
  flight_number text not null,
  flight_date date not null,
  status text,                        -- 'scheduled', 'en_route', 'landed', 'arrived', 'cancelled'
  departure_airport text,             -- IATA code, e.g. 'SFO'
  arrival_airport text,               -- IATA code, e.g. 'FCO'
  scheduled_departure timestamptz,
  estimated_departure timestamptz,
  actual_departure timestamptz,
  scheduled_arrival timestamptz,
  estimated_arrival timestamptz,
  actual_arrival timestamptz,
  delay_minutes integer default 0,
  gate_departure text,
  gate_arrival text,
  terminal_departure text,
  terminal_arrival text,
  progress_percent integer default 0,
  latitude double precision,
  longitude double precision,
  raw_response jsonb,
  fetched_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (flight_number, flight_date)
);

-- Index for quick lookups
create index if not exists idx_flight_cache_lookup
  on flight_status_cache (flight_number, flight_date);

-- Allow API route (service role) full access
alter table flight_status_cache enable row level security;

create policy "Service role full access on flight_status_cache"
  on flight_status_cache
  for all
  using (true)
  with check (true);
