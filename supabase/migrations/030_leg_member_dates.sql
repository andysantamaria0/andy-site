-- Per-member date overrides on trip legs
-- NULL values fall back to the full leg dates

ALTER TABLE trip_leg_members
  ADD COLUMN stay_start date,
  ADD COLUMN stay_end   date;

ALTER TABLE trip_leg_members
  ADD CONSTRAINT tlm_stay_range_valid
  CHECK (stay_start IS NULL OR stay_end IS NULL OR stay_start <= stay_end);
