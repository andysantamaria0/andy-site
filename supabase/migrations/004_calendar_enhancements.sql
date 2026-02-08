-- ============================================
-- Vialoure Phase 3: Calendar Enhancements
-- Costs, splits, invites, luggage
-- ============================================

-- ---- Add cost columns to events ----
ALTER TABLE public.events ADD COLUMN has_cost boolean NOT NULL DEFAULT false;
ALTER TABLE public.events ADD COLUMN cost_amount numeric(10,2);
ALTER TABLE public.events ADD COLUMN cost_currency text;
ALTER TABLE public.events ADD COLUMN cost_paid_by uuid REFERENCES public.trip_members(id) ON DELETE SET NULL;
ALTER TABLE public.events ADD COLUMN use_friends_card boolean NOT NULL DEFAULT false;
ALTER TABLE public.events ADD COLUMN split_type text DEFAULT 'equal'
  CHECK (split_type IN ('host_covers', 'equal', 'custom_amount', 'custom_percent'));

-- ---- Event cost splits ----
CREATE TABLE IF NOT EXISTS public.event_cost_splits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.trip_members(id) ON DELETE CASCADE,
  amount numeric(10,2),
  percentage numeric(5,2),
  UNIQUE (event_id, member_id)
);

ALTER TABLE public.event_cost_splits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view event cost splits"
  ON public.event_cost_splits FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM public.events
      WHERE trip_id IN (SELECT public.get_my_trip_ids())
    )
  );

CREATE POLICY "Members can create event cost splits"
  ON public.event_cost_splits FOR INSERT
  TO authenticated
  WITH CHECK (
    event_id IN (
      SELECT id FROM public.events
      WHERE trip_id IN (SELECT public.get_my_trip_ids())
    )
  );

CREATE POLICY "Members can update event cost splits"
  ON public.event_cost_splits FOR UPDATE
  USING (
    event_id IN (
      SELECT id FROM public.events
      WHERE trip_id IN (SELECT public.get_my_trip_ids())
    )
  );

CREATE POLICY "Members can delete event cost splits"
  ON public.event_cost_splits FOR DELETE
  USING (
    event_id IN (
      SELECT id FROM public.events
      WHERE trip_id IN (SELECT public.get_my_trip_ids())
    )
  );

-- ---- Event invites (external non-members) ----
CREATE TABLE IF NOT EXISTS public.event_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.event_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view event invites"
  ON public.event_invites FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM public.events
      WHERE trip_id IN (SELECT public.get_my_trip_ids())
    )
  );

CREATE POLICY "Members can create event invites"
  ON public.event_invites FOR INSERT
  TO authenticated
  WITH CHECK (
    event_id IN (
      SELECT id FROM public.events
      WHERE trip_id IN (SELECT public.get_my_trip_ids())
    )
  );

CREATE POLICY "Members can update event invites"
  ON public.event_invites FOR UPDATE
  USING (
    event_id IN (
      SELECT id FROM public.events
      WHERE trip_id IN (SELECT public.get_my_trip_ids())
    )
  );

CREATE POLICY "Members can delete event invites"
  ON public.event_invites FOR DELETE
  USING (
    event_id IN (
      SELECT id FROM public.events
      WHERE trip_id IN (SELECT public.get_my_trip_ids())
    )
  );

-- ---- Luggage count on trip_members ----
ALTER TABLE public.trip_members ADD COLUMN luggage_count integer DEFAULT 0;
