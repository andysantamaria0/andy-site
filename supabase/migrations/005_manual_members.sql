-- ============================================
-- Manual Members: allow trip members without accounts
-- ============================================

-- Make user_id nullable so manual members can be added
ALTER TABLE trip_members ALTER COLUMN user_id DROP NOT NULL;

-- Add direct fields for manual members
ALTER TABLE trip_members ADD COLUMN display_name text;
ALTER TABLE trip_members ADD COLUMN email text;
ALTER TABLE trip_members ADD COLUMN phone text;

-- Drop old unique constraint, add partial unique index (nulls are always distinct)
ALTER TABLE trip_members DROP CONSTRAINT trip_members_trip_id_user_id_key;
CREATE UNIQUE INDEX trip_members_trip_user_unique ON trip_members(trip_id, user_id) WHERE user_id IS NOT NULL;

-- Update INSERT policy: owners can also insert manual members (user_id is null)
DROP POLICY "Users can add themselves as members" ON trip_members;
CREATE POLICY "Users can add themselves or owners add manual members"
  ON trip_members FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    OR (user_id IS NULL AND trip_id IN (SELECT public.get_my_owned_trip_ids()))
  );

-- Update UPDATE policy: owners can update manual members too
-- The existing policy checks auth.uid() = user_id which won't match null,
-- but the OR branch (owned trips) covers it. No change needed.
