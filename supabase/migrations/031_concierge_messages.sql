-- 031: Concierge chat messages

CREATE TABLE public.concierge_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  sender_type text NOT NULL CHECK (sender_type IN ('user', 'concierge')),
  sender_member_id uuid REFERENCES public.trip_members(id) ON DELETE SET NULL,
  body text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_concierge_messages_trip ON public.concierge_messages(trip_id, created_at);

-- RLS: trip members can read messages for their trip
ALTER TABLE public.concierge_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trip members can read messages"
  ON public.concierge_messages FOR SELECT
  USING (
    trip_id IN (
      SELECT tm.trip_id FROM public.trip_members tm
      WHERE tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Trip members can insert messages"
  ON public.concierge_messages FOR INSERT
  WITH CHECK (
    trip_id IN (
      SELECT tm.trip_id FROM public.trip_members tm
      WHERE tm.user_id = auth.uid()
    )
    AND sender_type = 'user'
  );

-- Service role inserts concierge replies (no RLS needed for service role)
