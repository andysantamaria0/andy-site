-- Add inbound email address column to trips
ALTER TABLE trips ADD COLUMN inbound_email text UNIQUE;

-- Create inbound_emails table
CREATE TABLE inbound_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  from_email text,
  from_name text,
  subject text,
  text_body text,
  html_body text,
  message_id text,
  raw_payload jsonb,
  sender_member_id uuid REFERENCES trip_members(id) ON DELETE SET NULL,
  sender_profile_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  parsed_data jsonb,
  parse_error text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'dismissed')),
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_inbound_emails_trip_status ON inbound_emails(trip_id, status);
CREATE UNIQUE INDEX idx_inbound_emails_message_id ON inbound_emails(message_id) WHERE message_id IS NOT NULL;

-- RLS
ALTER TABLE inbound_emails ENABLE ROW LEVEL SECURITY;

-- Trip members can read inbound emails for their trips
CREATE POLICY "Trip members can view inbound emails"
  ON inbound_emails FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = inbound_emails.trip_id
        AND trip_members.user_id = auth.uid()
    )
  );

-- Trip owners can update inbound email status
CREATE POLICY "Trip owners can update inbound emails"
  ON inbound_emails FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = inbound_emails.trip_id
        AND trip_members.user_id = auth.uid()
        AND trip_members.role = 'owner'
    )
  );

-- Service role can insert (webhook uses service role key)
CREATE POLICY "Service role can insert inbound emails"
  ON inbound_emails FOR INSERT
  WITH CHECK (true);

-- Function to generate inbound email address from trip id
CREATE OR REPLACE FUNCTION generate_inbound_email()
RETURNS trigger AS $$
BEGIN
  IF NEW.inbound_email IS NULL THEN
    NEW.inbound_email := 'trip-' || SUBSTRING(NEW.id::text, 1, 8) || '@inbound.andysantamaria.com';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate inbound_email on trip insert
CREATE TRIGGER set_inbound_email
  BEFORE INSERT ON trips
  FOR EACH ROW
  EXECUTE FUNCTION generate_inbound_email();

-- Backfill existing trips with generated addresses
UPDATE trips
SET inbound_email = 'trip-' || SUBSTRING(id::text, 1, 8) || '@inbound.andysantamaria.com'
WHERE inbound_email IS NULL;
