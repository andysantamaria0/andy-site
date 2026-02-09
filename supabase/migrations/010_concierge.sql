-- Concierge: trip codes, keywords, multi-channel support, SMS conversations

-- Add trip_code and trip_keywords to trips
ALTER TABLE trips ADD COLUMN trip_code text UNIQUE;
ALTER TABLE trips ADD COLUMN trip_keywords text[] DEFAULT '{}';

-- Function to generate a trip code from name/destination
CREATE OR REPLACE FUNCTION generate_trip_code()
RETURNS trigger AS $$
DECLARE
  base_text text;
  code text;
  suffix int := 0;
BEGIN
  IF NEW.trip_code IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Pick shorter of name or destination
  base_text := CASE
    WHEN char_length(COALESCE(NEW.destination, '')) > 0
      AND char_length(NEW.destination) <= char_length(COALESCE(NEW.name, NEW.destination))
    THEN NEW.destination
    ELSE COALESCE(NEW.name, NEW.destination, 'trip')
  END;

  -- Lowercase, strip non-alphanumeric (keep spaces/hyphens), spaces to hyphens, truncate
  code := lower(base_text);
  code := regexp_replace(code, '[^a-z0-9 \-]', '', 'g');
  code := regexp_replace(code, '\s+', '-', 'g');
  code := regexp_replace(code, '-+', '-', 'g');
  code := trim(both '-' from code);
  code := left(code, 20);

  -- Ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM trips WHERE trip_code = code AND id != NEW.id) LOOP
    suffix := suffix + 1;
    code := left(regexp_replace(lower(base_text), '[^a-z0-9]', '-', 'g'), 16) || '-' || suffix::text;
    code := regexp_replace(code, '-+', '-', 'g');
    code := trim(both '-' from code);
  END LOOP;

  NEW.trip_code := code;

  -- Auto-seed keywords if empty
  IF NEW.trip_keywords IS NULL OR array_length(NEW.trip_keywords, 1) IS NULL THEN
    NEW.trip_keywords := ARRAY[]::text[];
    IF NEW.name IS NOT NULL AND NEW.name != '' THEN
      NEW.trip_keywords := array_append(NEW.trip_keywords, lower(NEW.name));
    END IF;
    IF NEW.destination IS NOT NULL AND NEW.destination != '' AND lower(NEW.destination) != lower(COALESCE(NEW.name, '')) THEN
      NEW.trip_keywords := array_append(NEW.trip_keywords, lower(NEW.destination));
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_trip_code
  BEFORE INSERT ON trips
  FOR EACH ROW
  EXECUTE FUNCTION generate_trip_code();

-- Backfill existing trips
DO $$
DECLARE
  r RECORD;
  base_text text;
  code text;
  suffix int;
BEGIN
  FOR r IN SELECT id, name, destination FROM trips WHERE trip_code IS NULL LOOP
    base_text := CASE
      WHEN char_length(COALESCE(r.destination, '')) > 0
        AND char_length(r.destination) <= char_length(COALESCE(r.name, r.destination))
      THEN r.destination
      ELSE COALESCE(r.name, r.destination, 'trip')
    END;

    code := lower(base_text);
    code := regexp_replace(code, '[^a-z0-9 \-]', '', 'g');
    code := regexp_replace(code, '\s+', '-', 'g');
    code := regexp_replace(code, '-+', '-', 'g');
    code := trim(both '-' from code);
    code := left(code, 20);

    suffix := 0;
    WHILE EXISTS (SELECT 1 FROM trips WHERE trip_code = code AND id != r.id) LOOP
      suffix := suffix + 1;
      code := left(regexp_replace(lower(base_text), '[^a-z0-9]', '-', 'g'), 16) || '-' || suffix::text;
      code := regexp_replace(code, '-+', '-', 'g');
      code := trim(both '-' from code);
    END LOOP;

    UPDATE trips SET
      trip_code = code,
      trip_keywords = ARRAY[lower(COALESCE(r.name, '')), lower(COALESCE(r.destination, ''))]
    WHERE id = r.id;
  END LOOP;
END $$;

-- Add concierge columns to inbound_emails
ALTER TABLE inbound_emails ADD COLUMN channel text NOT NULL DEFAULT 'email';
ALTER TABLE inbound_emails ADD COLUMN reply_to text;
ALTER TABLE inbound_emails ADD COLUMN reply_sent boolean DEFAULT false;
ALTER TABLE inbound_emails ADD COLUMN reply_sent_at timestamptz;
ALTER TABLE inbound_emails ADD COLUMN twilio_message_sid text;

-- SMS conversations table
CREATE TABLE sms_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text NOT NULL UNIQUE,
  trip_id uuid REFERENCES trips(id) ON DELETE SET NULL,
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sms_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage sms_conversations"
  ON sms_conversations FOR ALL
  WITH CHECK (true);

-- Indexes
CREATE INDEX idx_trips_trip_code ON trips(trip_code);
CREATE INDEX idx_sms_conversations_phone ON sms_conversations(phone_number);
CREATE INDEX idx_trip_members_email ON trip_members(lower(email));
CREATE INDEX idx_trip_members_phone ON trip_members(lower(phone));
CREATE UNIQUE INDEX idx_inbound_emails_twilio_sid ON inbound_emails(twilio_message_sid) WHERE twilio_message_sid IS NOT NULL;
