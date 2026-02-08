-- ============================================
-- Claim flow: allow users to claim manual member spots
-- ============================================

-- Replace the UPDATE policy so users can also claim unclaimed members matching their email
DROP POLICY IF EXISTS "Members update own or owners update any" ON trip_members;

CREATE POLICY "Members update own, owners update any, or claim by email"
  ON trip_members FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id
    OR trip_id IN (SELECT public.get_my_owned_trip_ids())
    OR (user_id IS NULL AND lower(email) = lower(auth.email()))
  );
