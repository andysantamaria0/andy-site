-- ============================================
-- 015: WhatsApp Groups, Trip Photos, Travel Logs
-- ============================================

-- 1. WhatsApp group mapping
CREATE TABLE whatsapp_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id text NOT NULL UNIQUE,
  group_name text,
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  linked_by uuid REFERENCES auth.users(id),
  linked_at timestamptz DEFAULT now(),
  active boolean DEFAULT true
);

ALTER TABLE whatsapp_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trip members can view whatsapp_groups"
  ON whatsapp_groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = whatsapp_groups.trip_id
        AND trip_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Trip owners can manage whatsapp_groups"
  ON whatsapp_groups FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = whatsapp_groups.trip_id
        AND trip_members.user_id = auth.uid()
        AND trip_members.role = 'owner'
    )
  );

CREATE POLICY "Service role can insert whatsapp_groups"
  ON whatsapp_groups FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_whatsapp_groups_group_id ON whatsapp_groups(group_id);
CREATE INDEX idx_whatsapp_groups_trip_id ON whatsapp_groups(trip_id);

-- 2. Trip photos
CREATE TABLE trip_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  storage_url text,
  mime_type text,
  caption text,
  taken_at timestamptz,
  source_channel text,
  source_message_id uuid REFERENCES inbound_emails(id) ON DELETE SET NULL,
  uploaded_by_member_id uuid REFERENCES trip_members(id),
  uploaded_at timestamptz DEFAULT now()
);

ALTER TABLE trip_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trip members can view trip_photos"
  ON trip_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = trip_photos.trip_id
        AND trip_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can insert trip_photos"
  ON trip_photos FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_trip_photos_trip_id ON trip_photos(trip_id);

-- 3. Travel logs
CREATE TABLE travel_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  log_date date NOT NULL,
  title text,
  body text NOT NULL,
  photo_ids uuid[] DEFAULT '{}',
  event_ids uuid[] DEFAULT '{}',
  status text DEFAULT 'published',
  edited_body text,
  edited_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE (trip_id, log_date)
);

ALTER TABLE travel_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trip members can view travel_logs"
  ON travel_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = travel_logs.trip_id
        AND trip_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Trip owners can update travel_logs"
  ON travel_logs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = travel_logs.trip_id
        AND trip_members.user_id = auth.uid()
        AND trip_members.role = 'owner'
    )
  );

CREATE POLICY "Service role can insert travel_logs"
  ON travel_logs FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_travel_logs_trip_date ON travel_logs(trip_id, log_date);

-- 4. Extend inbound_emails for WhatsApp metadata
ALTER TABLE inbound_emails ADD COLUMN whatsapp_group_id text;
ALTER TABLE inbound_emails ADD COLUMN whatsapp_group_name text;
ALTER TABLE inbound_emails ADD COLUMN whatsapp_sender_name text;

-- 5. Seed feature flags
INSERT INTO features (id, label, description, category) VALUES
  ('concierge_whatsapp', 'WhatsApp Concierge', 'Receive trip info via WhatsApp messages and groups', 'concierge'),
  ('travel_log',         'Travel Log',         'Auto-generated daily literary journal entries',       'general')
ON CONFLICT (id) DO NOTHING;

INSERT INTO feature_role_permissions (feature_id, role, enabled)
SELECT f.id, r.role, true
FROM (VALUES ('concierge_whatsapp'), ('travel_log')) AS f(id)
CROSS JOIN (VALUES ('user'), ('super_admin')) AS r(role)
ON CONFLICT (feature_id, role) DO NOTHING;
