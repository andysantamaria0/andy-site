-- ============================================
-- Vialoure: Expenses, Settlements & Payment Handles
-- ============================================

-- ---- Standalone expenses from receipts or manual entry ----
CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  paid_by_member_id uuid NOT NULL REFERENCES public.trip_members(id) ON DELETE CASCADE,
  description text NOT NULL,
  vendor text,
  amount numeric(10,2) NOT NULL,
  currency text DEFAULT 'USD',
  expense_date date NOT NULL,
  category text CHECK (category IN ('food','drinks','transport','accommodation','activities','groceries','supplies','other')),
  receipt_photo_id uuid REFERENCES public.trip_photos(id) ON DELETE SET NULL,
  source_inbound_email_id uuid REFERENCES public.inbound_emails(id) ON DELETE SET NULL,
  notes text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ---- Trip-wide settlement records ----
CREATE TABLE IF NOT EXISTS public.settlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  split_type text NOT NULL CHECK (split_type IN ('equal','percentage','custom')),
  settled_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  settled_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- ---- Per-member amounts from a settlement ----
CREATE TABLE IF NOT EXISTS public.settlement_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  settlement_id uuid NOT NULL REFERENCES public.settlements(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.trip_members(id) ON DELETE CASCADE,
  amount_owed numeric(10,2) NOT NULL,
  paid boolean DEFAULT false,
  paid_at timestamptz,
  UNIQUE (settlement_id, member_id)
);

-- ---- Payment handles on trip_members ----
ALTER TABLE public.trip_members ADD COLUMN venmo_username text;
ALTER TABLE public.trip_members ADD COLUMN cashapp_tag text;
ALTER TABLE public.trip_members ADD COLUMN zelle_identifier text;

-- ---- Enable RLS ----
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlement_shares ENABLE ROW LEVEL SECURITY;

-- ---- Expenses RLS ----

-- Members can view expenses for their trips
CREATE POLICY "Members can view trip expenses"
  ON public.expenses FOR SELECT
  USING ( trip_id IN (SELECT public.get_my_trip_ids()) );

-- Members can create expenses for their trips
CREATE POLICY "Members can create expenses"
  ON public.expenses FOR INSERT
  TO authenticated
  WITH CHECK ( trip_id IN (SELECT public.get_my_trip_ids()) );

-- Creator or owner can update expenses
CREATE POLICY "Creator or owner can update expenses"
  ON public.expenses FOR UPDATE
  USING (
    auth.uid() = created_by
    OR trip_id IN (SELECT public.get_my_owned_trip_ids())
  );

-- Creator or owner can delete expenses
CREATE POLICY "Creator or owner can delete expenses"
  ON public.expenses FOR DELETE
  USING (
    auth.uid() = created_by
    OR trip_id IN (SELECT public.get_my_owned_trip_ids())
  );

-- Service role can insert (for auto-accept from inbound webhook)
CREATE POLICY "Service role can insert expenses"
  ON public.expenses FOR INSERT
  WITH CHECK (true);

-- ---- Settlements RLS ----

-- Members can view settlements for their trips
CREATE POLICY "Members can view trip settlements"
  ON public.settlements FOR SELECT
  USING ( trip_id IN (SELECT public.get_my_trip_ids()) );

-- Owner can create settlements
CREATE POLICY "Owner can create settlements"
  ON public.settlements FOR INSERT
  TO authenticated
  WITH CHECK ( trip_id IN (SELECT public.get_my_owned_trip_ids()) );

-- Owner can update settlements
CREATE POLICY "Owner can update settlements"
  ON public.settlements FOR UPDATE
  USING ( trip_id IN (SELECT public.get_my_owned_trip_ids()) );

-- Owner can delete settlements
CREATE POLICY "Owner can delete settlements"
  ON public.settlements FOR DELETE
  USING ( trip_id IN (SELECT public.get_my_owned_trip_ids()) );

-- ---- Settlement Shares RLS ----

-- Members can view settlement shares for their trips (via join)
CREATE POLICY "Members can view settlement shares"
  ON public.settlement_shares FOR SELECT
  USING (
    settlement_id IN (
      SELECT id FROM public.settlements
      WHERE trip_id IN (SELECT public.get_my_trip_ids())
    )
  );

-- Owner can create settlement shares
CREATE POLICY "Owner can create settlement shares"
  ON public.settlement_shares FOR INSERT
  TO authenticated
  WITH CHECK (
    settlement_id IN (
      SELECT id FROM public.settlements
      WHERE trip_id IN (SELECT public.get_my_owned_trip_ids())
    )
  );

-- Owner can update settlement shares (mark as paid)
CREATE POLICY "Owner can update settlement shares"
  ON public.settlement_shares FOR UPDATE
  USING (
    settlement_id IN (
      SELECT id FROM public.settlements
      WHERE trip_id IN (SELECT public.get_my_owned_trip_ids())
    )
  );

-- ---- Indexes ----
CREATE INDEX idx_expenses_trip_date ON public.expenses(trip_id, expense_date);
CREATE INDEX idx_expenses_paid_by ON public.expenses(paid_by_member_id);
CREATE INDEX idx_settlements_trip ON public.settlements(trip_id);

-- ---- updated_at trigger on expenses ----
CREATE TRIGGER expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
