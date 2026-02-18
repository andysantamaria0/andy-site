-- Add onboarding tracking columns to trip_members
ALTER TABLE trip_members ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;
ALTER TABLE trip_members ADD COLUMN IF NOT EXISTS onboarding_step text;
