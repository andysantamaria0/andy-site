-- ============================================
-- 018b: Repair Missing Trip Tables
-- ============================================
-- This migration re-creates all trip-related objects that should exist
-- from migrations 001-018 but are missing in production.
-- All statements are idempotent (IF NOT EXISTS / CREATE OR REPLACE / DO blocks).
-- Tables created with their FINAL schema (all column additions baked in).
--
-- NOT included (handled by pending 019 & 020):
--   - auto_applied_at, auto_applied_items on inbound_emails (019)
--   - expenses, settlements, settlement_shares tables (020)
--   - venmo_username, cashapp_tag, zelle_identifier on trip_members (020)
-- ============================================

-- =============================================
-- 1. TABLES
-- =============================================

-- 1a. trips (001 + 007 featured + 008 inbound_email + 010 trip_code/keywords)
CREATE TABLE IF NOT EXISTS public.trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  destination text NOT NULL,
  start_date date,
  end_date date,
  cover_image_url text,
  currency text DEFAULT 'USD',
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  featured boolean DEFAULT false,
  inbound_email text UNIQUE,
  trip_code text UNIQUE,
  trip_keywords text[] DEFAULT '{}'
);

-- 1b. trip_members (001 + 004 luggage + 005 manual members + 016 staying_at)
CREATE TABLE IF NOT EXISTS public.trip_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  stay_start date,
  stay_end date,
  color text DEFAULT '#4A35D7',
  joined_at timestamptz DEFAULT now(),
  luggage_count integer DEFAULT 0,
  display_name text,
  email text,
  phone text,
  staying_at text
);

-- 1c. logistics (002)
CREATE TABLE IF NOT EXISTS public.logistics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'other' CHECK (type IN ('flight', 'train', 'bus', 'car', 'accommodation', 'other')),
  title text NOT NULL,
  details jsonb DEFAULT '{}',
  start_time timestamptz,
  end_time timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 1d. events (003 + 004 cost fields + 017 place fields)
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text NOT NULL DEFAULT 'other' CHECK (category IN ('dinner_out', 'dinner_home', 'activity', 'outing', 'party', 'sightseeing', 'other')),
  event_date date NOT NULL,
  start_time time,
  end_time time,
  location text,
  notes text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  has_cost boolean NOT NULL DEFAULT false,
  cost_amount numeric(10,2),
  cost_currency text,
  cost_paid_by uuid REFERENCES public.trip_members(id) ON DELETE SET NULL,
  use_friends_card boolean NOT NULL DEFAULT false,
  split_type text DEFAULT 'equal' CHECK (split_type IN ('host_covers', 'equal', 'custom_amount', 'custom_percent')),
  place_id text,
  place_address text,
  place_lat numeric(10,7),
  place_lng numeric(10,7)
);

-- 1e. event_attendees (003)
CREATE TABLE IF NOT EXISTS public.event_attendees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.trip_members(id) ON DELETE CASCADE,
  UNIQUE (event_id, member_id)
);

-- 1f. event_cost_splits (004)
CREATE TABLE IF NOT EXISTS public.event_cost_splits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.trip_members(id) ON DELETE CASCADE,
  amount numeric(10,2),
  percentage numeric(5,2),
  UNIQUE (event_id, member_id)
);

-- 1g. event_invites (004)
CREATE TABLE IF NOT EXISTS public.event_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  created_at timestamptz DEFAULT now()
);

-- 1h. inbound_emails (008 + 010 concierge columns + 015 whatsapp columns)
CREATE TABLE IF NOT EXISTS public.inbound_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  from_email text,
  from_name text,
  subject text,
  text_body text,
  html_body text,
  message_id text,
  raw_payload jsonb,
  sender_member_id uuid REFERENCES public.trip_members(id) ON DELETE SET NULL,
  sender_profile_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  parsed_data jsonb,
  parse_error text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'dismissed')),
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  channel text NOT NULL DEFAULT 'email',
  reply_to text,
  reply_sent boolean DEFAULT false,
  reply_sent_at timestamptz,
  twilio_message_sid text,
  whatsapp_group_id text,
  whatsapp_group_name text,
  whatsapp_sender_name text
);

-- 1i. sms_conversations (010)
CREATE TABLE IF NOT EXISTS public.sms_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text NOT NULL UNIQUE,
  trip_id uuid REFERENCES public.trips(id) ON DELETE SET NULL,
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- 1j. whatsapp_groups (015)
CREATE TABLE IF NOT EXISTS public.whatsapp_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id text NOT NULL UNIQUE,
  group_name text,
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  linked_by uuid REFERENCES auth.users(id),
  linked_at timestamptz DEFAULT now(),
  active boolean DEFAULT true
);

-- 1k. trip_photos (015)
CREATE TABLE IF NOT EXISTS public.trip_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  storage_url text,
  mime_type text,
  caption text,
  taken_at timestamptz,
  source_channel text,
  source_message_id uuid REFERENCES public.inbound_emails(id) ON DELETE SET NULL,
  uploaded_by_member_id uuid REFERENCES public.trip_members(id),
  uploaded_at timestamptz DEFAULT now()
);

-- 1l. travel_logs (015)
CREATE TABLE IF NOT EXISTS public.travel_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
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

-- =============================================
-- 2. IDEMPOTENT COLUMN ADDITIONS
-- =============================================
-- In case tables existed but were missing columns added by later migrations.

DO $$
BEGIN
  -- profiles.role (012)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='role') THEN
    ALTER TABLE public.profiles ADD COLUMN role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'super_admin'));
  END IF;

  -- trips columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='trips' AND column_name='featured') THEN
    ALTER TABLE public.trips ADD COLUMN featured boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='trips' AND column_name='inbound_email') THEN
    ALTER TABLE public.trips ADD COLUMN inbound_email text UNIQUE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='trips' AND column_name='trip_code') THEN
    ALTER TABLE public.trips ADD COLUMN trip_code text UNIQUE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='trips' AND column_name='trip_keywords') THEN
    ALTER TABLE public.trips ADD COLUMN trip_keywords text[] DEFAULT '{}';
  END IF;

  -- trip_members columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='trip_members' AND column_name='luggage_count') THEN
    ALTER TABLE public.trip_members ADD COLUMN luggage_count integer DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='trip_members' AND column_name='display_name') THEN
    ALTER TABLE public.trip_members ADD COLUMN display_name text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='trip_members' AND column_name='email') THEN
    ALTER TABLE public.trip_members ADD COLUMN email text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='trip_members' AND column_name='phone') THEN
    ALTER TABLE public.trip_members ADD COLUMN phone text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='trip_members' AND column_name='staying_at') THEN
    ALTER TABLE public.trip_members ADD COLUMN staying_at text;
  END IF;

  -- events columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='events' AND column_name='has_cost') THEN
    ALTER TABLE public.events ADD COLUMN has_cost boolean NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='events' AND column_name='cost_amount') THEN
    ALTER TABLE public.events ADD COLUMN cost_amount numeric(10,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='events' AND column_name='cost_currency') THEN
    ALTER TABLE public.events ADD COLUMN cost_currency text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='events' AND column_name='cost_paid_by') THEN
    ALTER TABLE public.events ADD COLUMN cost_paid_by uuid REFERENCES public.trip_members(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='events' AND column_name='use_friends_card') THEN
    ALTER TABLE public.events ADD COLUMN use_friends_card boolean NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='events' AND column_name='split_type') THEN
    ALTER TABLE public.events ADD COLUMN split_type text DEFAULT 'equal' CHECK (split_type IN ('host_covers', 'equal', 'custom_amount', 'custom_percent'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='events' AND column_name='place_id') THEN
    ALTER TABLE public.events ADD COLUMN place_id text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='events' AND column_name='place_address') THEN
    ALTER TABLE public.events ADD COLUMN place_address text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='events' AND column_name='place_lat') THEN
    ALTER TABLE public.events ADD COLUMN place_lat numeric(10,7);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='events' AND column_name='place_lng') THEN
    ALTER TABLE public.events ADD COLUMN place_lng numeric(10,7);
  END IF;

  -- inbound_emails columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='inbound_emails' AND column_name='channel') THEN
    ALTER TABLE public.inbound_emails ADD COLUMN channel text NOT NULL DEFAULT 'email';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='inbound_emails' AND column_name='reply_to') THEN
    ALTER TABLE public.inbound_emails ADD COLUMN reply_to text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='inbound_emails' AND column_name='reply_sent') THEN
    ALTER TABLE public.inbound_emails ADD COLUMN reply_sent boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='inbound_emails' AND column_name='reply_sent_at') THEN
    ALTER TABLE public.inbound_emails ADD COLUMN reply_sent_at timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='inbound_emails' AND column_name='twilio_message_sid') THEN
    ALTER TABLE public.inbound_emails ADD COLUMN twilio_message_sid text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='inbound_emails' AND column_name='whatsapp_group_id') THEN
    ALTER TABLE public.inbound_emails ADD COLUMN whatsapp_group_id text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='inbound_emails' AND column_name='whatsapp_group_name') THEN
    ALTER TABLE public.inbound_emails ADD COLUMN whatsapp_group_name text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='inbound_emails' AND column_name='whatsapp_sender_name') THEN
    ALTER TABLE public.inbound_emails ADD COLUMN whatsapp_sender_name text;
  END IF;
END $$;

-- =============================================
-- 3. ENABLE RLS
-- =============================================

ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_cost_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inbound_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_logs ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 4. FUNCTIONS
-- =============================================

CREATE OR REPLACE FUNCTION public.get_my_trip_ids()
RETURNS setof uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT trip_id FROM public.trip_members WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_my_owned_trip_ids()
RETURNS setof uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT trip_id FROM public.trip_members WHERE user_id = auth.uid() AND role = 'owner';
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url, email)
  VALUES (
    NEW.id,
    coalesce(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
    NEW.raw_user_meta_data ->> 'avatar_url',
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- generate_inbound_email — v2 from 009 (root domain)
CREATE OR REPLACE FUNCTION public.generate_inbound_email()
RETURNS trigger AS $$
BEGIN
  IF NEW.inbound_email IS NULL THEN
    NEW.inbound_email := 'trip-' || SUBSTRING(NEW.id::text, 1, 8) || '@andysantamaria.com';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- generate_trip_code (010)
CREATE OR REPLACE FUNCTION public.generate_trip_code()
RETURNS trigger AS $$
DECLARE
  base_text text;
  code text;
  suffix int := 0;
BEGIN
  IF NEW.trip_code IS NOT NULL THEN
    RETURN NEW;
  END IF;

  base_text := CASE
    WHEN char_length(COALESCE(NEW.destination, '')) > 0
      AND char_length(NEW.destination) <= char_length(COALESCE(NEW.name, NEW.destination))
    THEN NEW.destination
    ELSE COALESCE(NEW.name, NEW.destination, 'trip')
  END;

  code := lower(base_text);
  code := regexp_replace(code, '[^a-z0-9 \-]', '', 'g');
  code := regexp_replace(code, '\s+', '-', 'g');
  code := regexp_replace(code, '-+', '-', 'g');
  code := trim(both '-' from code);
  code := left(code, 20);

  WHILE EXISTS (SELECT 1 FROM public.trips WHERE trip_code = code AND id != NEW.id) LOOP
    suffix := suffix + 1;
    code := left(regexp_replace(lower(base_text), '[^a-z0-9]', '-', 'g'), 16) || '-' || suffix::text;
    code := regexp_replace(code, '-+', '-', 'g');
    code := trim(both '-' from code);
  END LOOP;

  NEW.trip_code := code;

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

-- =============================================
-- 5. TRIGGERS
-- =============================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS trips_updated_at ON public.trips;
CREATE TRIGGER trips_updated_at
  BEFORE UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS logistics_updated_at ON public.logistics;
CREATE TRIGGER logistics_updated_at
  BEFORE UPDATE ON public.logistics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS events_updated_at ON public.events;
CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS set_inbound_email ON public.trips;
CREATE TRIGGER set_inbound_email
  BEFORE INSERT ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.generate_inbound_email();

DROP TRIGGER IF EXISTS set_trip_code ON public.trips;
CREATE TRIGGER set_trip_code
  BEFORE INSERT ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.generate_trip_code();

-- =============================================
-- 6. RLS POLICIES (idempotent via DO blocks)
-- =============================================

-- Helper: drop-and-recreate pattern ensures final policy state
-- We use DROP POLICY IF EXISTS + CREATE POLICY for each.

-- ---- trips policies ----

DROP POLICY IF EXISTS "Authenticated users can create trips" ON public.trips;
CREATE POLICY "Authenticated users can create trips"
  ON public.trips FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Trip members can view trips" ON public.trips;
CREATE POLICY "Trip members can view trips"
  ON public.trips FOR SELECT
  USING (
    auth.uid() = created_by
    OR id IN (SELECT public.get_my_trip_ids())
  );

DROP POLICY IF EXISTS "Trip owners can update trips" ON public.trips;
CREATE POLICY "Trip owners can update trips"
  ON public.trips FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.trip_members
      WHERE trip_members.trip_id = trips.id
        AND trip_members.user_id = auth.uid()
        AND trip_members.role = 'owner'
    )
  );

DROP POLICY IF EXISTS "Featured trips are publicly readable" ON public.trips;
CREATE POLICY "Featured trips are publicly readable"
  ON public.trips FOR SELECT
  USING (featured = true);

-- ---- trip_members policies (final state after 005 + 006) ----

DROP POLICY IF EXISTS "Members can view trip members" ON public.trip_members;
CREATE POLICY "Members can view trip members"
  ON public.trip_members FOR SELECT
  USING ( trip_id IN (SELECT public.get_my_trip_ids()) );

DROP POLICY IF EXISTS "Users can add themselves as members" ON public.trip_members;
DROP POLICY IF EXISTS "Users can add themselves or owners add manual members" ON public.trip_members;
CREATE POLICY "Users can add themselves or owners add manual members"
  ON public.trip_members FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    OR (user_id IS NULL AND trip_id IN (SELECT public.get_my_owned_trip_ids()))
  );

DROP POLICY IF EXISTS "Members can update own membership" ON public.trip_members;
DROP POLICY IF EXISTS "Members update own or owners update any" ON public.trip_members;
DROP POLICY IF EXISTS "Members update own, owners update any, or claim by email" ON public.trip_members;
CREATE POLICY "Members update own, owners update any, or claim by email"
  ON public.trip_members FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id
    OR trip_id IN (SELECT public.get_my_owned_trip_ids())
    OR (user_id IS NULL AND lower(email) = lower(auth.email()))
  );

DROP POLICY IF EXISTS "Owners can remove members or self-remove" ON public.trip_members;
CREATE POLICY "Owners can remove members or self-remove"
  ON public.trip_members FOR DELETE
  USING (
    auth.uid() = user_id
    OR trip_id IN (SELECT public.get_my_owned_trip_ids())
  );

-- ---- logistics policies ----

DROP POLICY IF EXISTS "Members can view trip logistics" ON public.logistics;
CREATE POLICY "Members can view trip logistics"
  ON public.logistics FOR SELECT
  USING ( trip_id IN (SELECT public.get_my_trip_ids()) );

DROP POLICY IF EXISTS "Members can create logistics" ON public.logistics;
CREATE POLICY "Members can create logistics"
  ON public.logistics FOR INSERT
  TO authenticated
  WITH CHECK ( trip_id IN (SELECT public.get_my_trip_ids()) );

DROP POLICY IF EXISTS "Users can update own logistics" ON public.logistics;
CREATE POLICY "Users can update own logistics"
  ON public.logistics FOR UPDATE
  USING (
    auth.uid() = user_id
    OR trip_id IN (SELECT public.get_my_owned_trip_ids())
  );

DROP POLICY IF EXISTS "Users can delete own logistics" ON public.logistics;
CREATE POLICY "Users can delete own logistics"
  ON public.logistics FOR DELETE
  USING (
    auth.uid() = user_id
    OR trip_id IN (SELECT public.get_my_owned_trip_ids())
  );

-- ---- events policies ----

DROP POLICY IF EXISTS "Members can view trip events" ON public.events;
CREATE POLICY "Members can view trip events"
  ON public.events FOR SELECT
  USING ( trip_id IN (SELECT public.get_my_trip_ids()) );

DROP POLICY IF EXISTS "Members can create events" ON public.events;
CREATE POLICY "Members can create events"
  ON public.events FOR INSERT
  TO authenticated
  WITH CHECK ( trip_id IN (SELECT public.get_my_trip_ids()) );

DROP POLICY IF EXISTS "Creators or owners can update events" ON public.events;
CREATE POLICY "Creators or owners can update events"
  ON public.events FOR UPDATE
  USING (
    auth.uid() = created_by
    OR trip_id IN (SELECT public.get_my_owned_trip_ids())
  );

DROP POLICY IF EXISTS "Creators or owners can delete events" ON public.events;
CREATE POLICY "Creators or owners can delete events"
  ON public.events FOR DELETE
  USING (
    auth.uid() = created_by
    OR trip_id IN (SELECT public.get_my_owned_trip_ids())
  );

-- ---- event_attendees policies ----

DROP POLICY IF EXISTS "Members can view event attendees" ON public.event_attendees;
CREATE POLICY "Members can view event attendees"
  ON public.event_attendees FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM public.events
      WHERE trip_id IN (SELECT public.get_my_trip_ids())
    )
  );

DROP POLICY IF EXISTS "Members can manage event attendees" ON public.event_attendees;
CREATE POLICY "Members can manage event attendees"
  ON public.event_attendees FOR INSERT
  TO authenticated
  WITH CHECK (
    event_id IN (
      SELECT id FROM public.events
      WHERE trip_id IN (SELECT public.get_my_trip_ids())
    )
  );

DROP POLICY IF EXISTS "Members can delete event attendees" ON public.event_attendees;
CREATE POLICY "Members can delete event attendees"
  ON public.event_attendees FOR DELETE
  USING (
    event_id IN (
      SELECT id FROM public.events
      WHERE trip_id IN (SELECT public.get_my_trip_ids())
    )
  );

-- ---- event_cost_splits policies ----

DROP POLICY IF EXISTS "Members can view event cost splits" ON public.event_cost_splits;
CREATE POLICY "Members can view event cost splits"
  ON public.event_cost_splits FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM public.events
      WHERE trip_id IN (SELECT public.get_my_trip_ids())
    )
  );

DROP POLICY IF EXISTS "Members can create event cost splits" ON public.event_cost_splits;
CREATE POLICY "Members can create event cost splits"
  ON public.event_cost_splits FOR INSERT
  TO authenticated
  WITH CHECK (
    event_id IN (
      SELECT id FROM public.events
      WHERE trip_id IN (SELECT public.get_my_trip_ids())
    )
  );

DROP POLICY IF EXISTS "Members can update event cost splits" ON public.event_cost_splits;
CREATE POLICY "Members can update event cost splits"
  ON public.event_cost_splits FOR UPDATE
  USING (
    event_id IN (
      SELECT id FROM public.events
      WHERE trip_id IN (SELECT public.get_my_trip_ids())
    )
  );

DROP POLICY IF EXISTS "Members can delete event cost splits" ON public.event_cost_splits;
CREATE POLICY "Members can delete event cost splits"
  ON public.event_cost_splits FOR DELETE
  USING (
    event_id IN (
      SELECT id FROM public.events
      WHERE trip_id IN (SELECT public.get_my_trip_ids())
    )
  );

-- ---- event_invites policies ----

DROP POLICY IF EXISTS "Members can view event invites" ON public.event_invites;
CREATE POLICY "Members can view event invites"
  ON public.event_invites FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM public.events
      WHERE trip_id IN (SELECT public.get_my_trip_ids())
    )
  );

DROP POLICY IF EXISTS "Members can create event invites" ON public.event_invites;
CREATE POLICY "Members can create event invites"
  ON public.event_invites FOR INSERT
  TO authenticated
  WITH CHECK (
    event_id IN (
      SELECT id FROM public.events
      WHERE trip_id IN (SELECT public.get_my_trip_ids())
    )
  );

DROP POLICY IF EXISTS "Members can update event invites" ON public.event_invites;
CREATE POLICY "Members can update event invites"
  ON public.event_invites FOR UPDATE
  USING (
    event_id IN (
      SELECT id FROM public.events
      WHERE trip_id IN (SELECT public.get_my_trip_ids())
    )
  );

DROP POLICY IF EXISTS "Members can delete event invites" ON public.event_invites;
CREATE POLICY "Members can delete event invites"
  ON public.event_invites FOR DELETE
  USING (
    event_id IN (
      SELECT id FROM public.events
      WHERE trip_id IN (SELECT public.get_my_trip_ids())
    )
  );

-- ---- inbound_emails policies ----

DROP POLICY IF EXISTS "Trip members can view inbound emails" ON public.inbound_emails;
CREATE POLICY "Trip members can view inbound emails"
  ON public.inbound_emails FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trip_members
      WHERE trip_members.trip_id = inbound_emails.trip_id
        AND trip_members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Trip owners can update inbound emails" ON public.inbound_emails;
CREATE POLICY "Trip owners can update inbound emails"
  ON public.inbound_emails FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.trip_members
      WHERE trip_members.trip_id = inbound_emails.trip_id
        AND trip_members.user_id = auth.uid()
        AND trip_members.role = 'owner'
    )
  );

DROP POLICY IF EXISTS "Service role can insert inbound emails" ON public.inbound_emails;
CREATE POLICY "Service role can insert inbound emails"
  ON public.inbound_emails FOR INSERT
  WITH CHECK (true);

-- ---- sms_conversations policies ----

DROP POLICY IF EXISTS "Service role can manage sms_conversations" ON public.sms_conversations;
CREATE POLICY "Service role can manage sms_conversations"
  ON public.sms_conversations FOR ALL
  WITH CHECK (true);

-- ---- whatsapp_groups policies ----

DROP POLICY IF EXISTS "Trip members can view whatsapp_groups" ON public.whatsapp_groups;
CREATE POLICY "Trip members can view whatsapp_groups"
  ON public.whatsapp_groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trip_members
      WHERE trip_members.trip_id = whatsapp_groups.trip_id
        AND trip_members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Trip owners can manage whatsapp_groups" ON public.whatsapp_groups;
CREATE POLICY "Trip owners can manage whatsapp_groups"
  ON public.whatsapp_groups FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.trip_members
      WHERE trip_members.trip_id = whatsapp_groups.trip_id
        AND trip_members.user_id = auth.uid()
        AND trip_members.role = 'owner'
    )
  );

DROP POLICY IF EXISTS "Service role can insert whatsapp_groups" ON public.whatsapp_groups;
CREATE POLICY "Service role can insert whatsapp_groups"
  ON public.whatsapp_groups FOR INSERT
  WITH CHECK (true);

-- ---- trip_photos policies ----

DROP POLICY IF EXISTS "Trip members can view trip_photos" ON public.trip_photos;
CREATE POLICY "Trip members can view trip_photos"
  ON public.trip_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trip_members
      WHERE trip_members.trip_id = trip_photos.trip_id
        AND trip_members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service role can insert trip_photos" ON public.trip_photos;
CREATE POLICY "Service role can insert trip_photos"
  ON public.trip_photos FOR INSERT
  WITH CHECK (true);

-- ---- travel_logs policies ----

DROP POLICY IF EXISTS "Trip members can view travel_logs" ON public.travel_logs;
CREATE POLICY "Trip members can view travel_logs"
  ON public.travel_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trip_members
      WHERE trip_members.trip_id = travel_logs.trip_id
        AND trip_members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Trip owners can update travel_logs" ON public.travel_logs;
CREATE POLICY "Trip owners can update travel_logs"
  ON public.travel_logs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.trip_members
      WHERE trip_members.trip_id = travel_logs.trip_id
        AND trip_members.user_id = auth.uid()
        AND trip_members.role = 'owner'
    )
  );

DROP POLICY IF EXISTS "Service role can insert travel_logs" ON public.travel_logs;
CREATE POLICY "Service role can insert travel_logs"
  ON public.travel_logs FOR INSERT
  WITH CHECK (true);

-- =============================================
-- 7. INDEXES
-- =============================================

-- trips
CREATE UNIQUE INDEX IF NOT EXISTS trips_one_featured ON public.trips (featured) WHERE (featured = true);
CREATE INDEX IF NOT EXISTS idx_trips_trip_code ON public.trips(trip_code);

-- trip_members
CREATE UNIQUE INDEX IF NOT EXISTS trip_members_trip_user_unique ON public.trip_members(trip_id, user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_trip_members_email ON public.trip_members(lower(email));
CREATE INDEX IF NOT EXISTS idx_trip_members_phone ON public.trip_members(lower(phone));

-- inbound_emails
CREATE INDEX IF NOT EXISTS idx_inbound_emails_trip_status ON public.inbound_emails(trip_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_inbound_emails_message_id ON public.inbound_emails(message_id) WHERE message_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_inbound_emails_twilio_sid ON public.inbound_emails(twilio_message_sid) WHERE twilio_message_sid IS NOT NULL;

-- sms_conversations
CREATE INDEX IF NOT EXISTS idx_sms_conversations_phone ON public.sms_conversations(phone_number);

-- whatsapp_groups
CREATE INDEX IF NOT EXISTS idx_whatsapp_groups_group_id ON public.whatsapp_groups(group_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_groups_trip_id ON public.whatsapp_groups(trip_id);

-- trip_photos
CREATE INDEX IF NOT EXISTS idx_trip_photos_trip_id ON public.trip_photos(trip_id);

-- travel_logs
CREATE INDEX IF NOT EXISTS idx_travel_logs_trip_date ON public.travel_logs(trip_id, log_date);
