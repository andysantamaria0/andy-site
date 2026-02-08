-- ============================================
-- Vialoure: Featured Trip on Landing Page
-- ============================================

-- 1. Add featured column
alter table public.trips
  add column featured boolean default false;

-- 2. Partial unique index: only one trip can be featured at a time
create unique index trips_one_featured
  on public.trips (featured) where (featured = true);

-- 3. RLS policy: anonymous users can read featured trips
create policy "Featured trips are publicly readable"
  on public.trips for select
  using (featured = true);
