-- ============================================
-- 022: Repair Missing Platform Tables
-- ============================================
-- Creates features, feature_role_permissions, and flight_status_cache
-- which were missing from the production database.
-- All statements are idempotent.
-- ============================================

-- 0. is_super_admin helper (from 012) — needed by policies below
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'super_admin'
  );
$$;

-- 1. features (from 012)
CREATE TABLE IF NOT EXISTS public.features (
  id text PRIMARY KEY,
  label text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general',
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.features ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read features" ON public.features;
CREATE POLICY "Authenticated users can read features"
  ON public.features FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Super admins can insert features" ON public.features;
CREATE POLICY "Super admins can insert features"
  ON public.features FOR INSERT
  TO authenticated
  WITH CHECK (is_super_admin());

DROP POLICY IF EXISTS "Super admins can update features" ON public.features;
CREATE POLICY "Super admins can update features"
  ON public.features FOR UPDATE
  TO authenticated
  USING (is_super_admin());

DROP POLICY IF EXISTS "Super admins can delete features" ON public.features;
CREATE POLICY "Super admins can delete features"
  ON public.features FOR DELETE
  TO authenticated
  USING (is_super_admin());

-- 2. feature_role_permissions (from 012)
CREATE TABLE IF NOT EXISTS public.feature_role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id text NOT NULL REFERENCES public.features(id) ON DELETE CASCADE,
  role text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  UNIQUE (feature_id, role)
);

ALTER TABLE public.feature_role_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read feature_role_permissions" ON public.feature_role_permissions;
CREATE POLICY "Authenticated users can read feature_role_permissions"
  ON public.feature_role_permissions FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Super admins can insert feature_role_permissions" ON public.feature_role_permissions;
CREATE POLICY "Super admins can insert feature_role_permissions"
  ON public.feature_role_permissions FOR INSERT
  TO authenticated
  WITH CHECK (is_super_admin());

DROP POLICY IF EXISTS "Super admins can update feature_role_permissions" ON public.feature_role_permissions;
CREATE POLICY "Super admins can update feature_role_permissions"
  ON public.feature_role_permissions FOR UPDATE
  TO authenticated
  USING (is_super_admin());

DROP POLICY IF EXISTS "Super admins can delete feature_role_permissions" ON public.feature_role_permissions;
CREATE POLICY "Super admins can delete feature_role_permissions"
  ON public.feature_role_permissions FOR DELETE
  TO authenticated
  USING (is_super_admin());

-- 3. Seed features (idempotent with ON CONFLICT)
INSERT INTO public.features (id, label, description, category) VALUES
  ('calendar',           'Calendar',          'Shared trip calendar with events and logistics',      'core'),
  ('expenses',           'Expenses',          'Track shared expenses and settle balances',            'core'),
  ('members',            'Members',           'Trip member management and stay dates',                'core'),
  ('inbox',              'Inbox',             'Inbound message parsing and management',               'core'),
  ('smart_paste',        'Smart Paste',       'AI-powered paste to add members, events, logistics',   'ai'),
  ('ai_parsing',         'AI Parsing',        'Automatic parsing of inbound emails, SMS, and voice',  'ai'),
  ('flight_tracking',    'Flight Tracking',   'Live flight status and progress via FlightAware',      'ai'),
  ('concierge_email',    'Email Concierge',   'Receive trip info via email forwarding',               'concierge'),
  ('concierge_sms',      'SMS Concierge',     'Receive trip info via text message',                   'concierge'),
  ('concierge_voice',    'Voice Concierge',   'Receive trip info via phone call / voicemail',         'concierge'),
  ('featured_trip',      'Featured Trip',     'Display a featured trip on the landing page',          'general'),
  ('happening_now',      'Happening Now',     'Real-time trip activity widget',                       'general'),
  ('concierge_whatsapp', 'WhatsApp Concierge','Receive trip info via WhatsApp messages and groups',   'concierge'),
  ('travel_log',         'Travel Log',        'Auto-generated daily literary journal entries',         'general')
ON CONFLICT (id) DO NOTHING;

-- 4. Seed permissions for both roles
INSERT INTO public.feature_role_permissions (feature_id, role, enabled)
SELECT f.id, r.role, true
FROM public.features f
CROSS JOIN (VALUES ('user'), ('super_admin')) AS r(role)
ON CONFLICT (feature_id, role) DO NOTHING;

-- 5. flight_status_cache (from 011)
CREATE TABLE IF NOT EXISTS public.flight_status_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flight_number text NOT NULL,
  flight_date date NOT NULL,
  status text,
  departure_airport text,
  arrival_airport text,
  scheduled_departure timestamptz,
  estimated_departure timestamptz,
  actual_departure timestamptz,
  scheduled_arrival timestamptz,
  estimated_arrival timestamptz,
  actual_arrival timestamptz,
  delay_minutes integer DEFAULT 0,
  gate_departure text,
  gate_arrival text,
  terminal_departure text,
  terminal_arrival text,
  progress_percent integer DEFAULT 0,
  latitude double precision,
  longitude double precision,
  raw_response jsonb,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (flight_number, flight_date)
);

ALTER TABLE public.flight_status_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on flight_status_cache" ON public.flight_status_cache;
CREATE POLICY "Service role full access on flight_status_cache"
  ON public.flight_status_cache
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_flight_cache_lookup
  ON public.flight_status_cache (flight_number, flight_date);

-- 6. Bootstrap super_admin
UPDATE public.profiles SET role = 'super_admin' WHERE email = 'andyjsantamaria@gmail.com';
