-- ============================================
-- 012: Admin Roles & Feature Permissions
-- ============================================

-- 1. Add role to profiles
ALTER TABLE profiles ADD COLUMN role text NOT NULL DEFAULT 'user'
  CHECK (role IN ('user', 'super_admin'));

-- 2. Helper function: is_super_admin()
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role = 'super_admin'
  );
$$;

-- 3. Features table
CREATE TABLE features (
  id text PRIMARY KEY,
  label text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general',
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. Feature role permissions table
CREATE TABLE feature_role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id text NOT NULL REFERENCES features(id) ON DELETE CASCADE,
  role text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  UNIQUE (feature_id, role)
);

-- 5. RLS for features
ALTER TABLE features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read features"
  ON features FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admins can insert features"
  ON features FOR INSERT
  TO authenticated
  WITH CHECK (is_super_admin());

CREATE POLICY "Super admins can update features"
  ON features FOR UPDATE
  TO authenticated
  USING (is_super_admin());

CREATE POLICY "Super admins can delete features"
  ON features FOR DELETE
  TO authenticated
  USING (is_super_admin());

-- 6. RLS for feature_role_permissions
ALTER TABLE feature_role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read feature_role_permissions"
  ON feature_role_permissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admins can insert feature_role_permissions"
  ON feature_role_permissions FOR INSERT
  TO authenticated
  WITH CHECK (is_super_admin());

CREATE POLICY "Super admins can update feature_role_permissions"
  ON feature_role_permissions FOR UPDATE
  TO authenticated
  USING (is_super_admin());

CREATE POLICY "Super admins can delete feature_role_permissions"
  ON feature_role_permissions FOR DELETE
  TO authenticated
  USING (is_super_admin());

-- 7. Seed features
INSERT INTO features (id, label, description, category) VALUES
  ('calendar',         'Calendar',          'Shared trip calendar with events and logistics',      'core'),
  ('expenses',         'Expenses',          'Track shared expenses and settle balances',            'core'),
  ('members',          'Members',           'Trip member management and stay dates',                'core'),
  ('inbox',            'Inbox',             'Inbound message parsing and management',               'core'),
  ('smart_paste',      'Smart Paste',       'AI-powered paste to add members, events, logistics',   'ai'),
  ('ai_parsing',       'AI Parsing',        'Automatic parsing of inbound emails, SMS, and voice',  'ai'),
  ('flight_tracking',  'Flight Tracking',   'Live flight status and progress via FlightAware',      'ai'),
  ('concierge_email',  'Email Concierge',   'Receive trip info via email forwarding',               'concierge'),
  ('concierge_sms',    'SMS Concierge',     'Receive trip info via text message',                   'concierge'),
  ('concierge_voice',  'Voice Concierge',   'Receive trip info via phone call / voicemail',         'concierge'),
  ('featured_trip',    'Featured Trip',     'Display a featured trip on the landing page',          'general'),
  ('happening_now',    'Happening Now',     'Real-time trip activity widget',                       'general');

-- 8. Seed permissions for both roles (all enabled by default)
INSERT INTO feature_role_permissions (feature_id, role, enabled)
SELECT f.id, r.role, true
FROM features f
CROSS JOIN (VALUES ('user'), ('super_admin')) AS r(role);

-- 9. Bootstrap super_admin
UPDATE profiles SET role = 'super_admin' WHERE email IN ('andy@fractalbootcamp.com', 'andyjsantamaria@gmail.com');
