-- ============================================
-- Vialoure: Suggestions / Possibilities
-- ============================================

CREATE TABLE IF NOT EXISTS public.suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  leg_id uuid REFERENCES public.trip_legs(id) ON DELETE SET NULL,
  suggestion_type text NOT NULL CHECK (suggestion_type IN ('logistics', 'event', 'expense')),
  title text NOT NULL,
  subtitle text,
  group_key text,
  group_label text,
  price_amount numeric(10,2),
  price_currency text,
  price_note text,
  payload jsonb NOT NULL DEFAULT '{}',
  source text DEFAULT 'manual' CHECK (source IN ('manual', 'smart_paste', 'email')),
  source_email_id uuid REFERENCES public.inbound_emails(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'dismissed')),
  approved_entity_id uuid,
  approved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at timestamptz,
  notes text,
  url text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ---- Enable RLS ----
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;

-- Members can view suggestions for their trips
CREATE POLICY "Members can view trip suggestions"
  ON public.suggestions FOR SELECT
  USING ( trip_id IN (SELECT public.get_my_trip_ids()) );

-- Members can create suggestions for their trips
CREATE POLICY "Members can create suggestions"
  ON public.suggestions FOR INSERT
  TO authenticated
  WITH CHECK ( trip_id IN (SELECT public.get_my_trip_ids()) );

-- Creator or owner can update suggestions
CREATE POLICY "Creator or owner can update suggestions"
  ON public.suggestions FOR UPDATE
  USING (
    auth.uid() = created_by
    OR trip_id IN (SELECT public.get_my_owned_trip_ids())
  );

-- Creator or owner can delete suggestions
CREATE POLICY "Creator or owner can delete suggestions"
  ON public.suggestions FOR DELETE
  USING (
    auth.uid() = created_by
    OR trip_id IN (SELECT public.get_my_owned_trip_ids())
  );

-- ---- Indexes ----
CREATE INDEX idx_suggestions_trip_status ON public.suggestions(trip_id, status);
CREATE INDEX idx_suggestions_trip_group ON public.suggestions(trip_id, group_key);
CREATE INDEX idx_suggestions_leg ON public.suggestions(leg_id);

-- ---- updated_at trigger ----
CREATE TRIGGER suggestions_updated_at
  BEFORE UPDATE ON public.suggestions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
