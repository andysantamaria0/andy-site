-- 026: Access Request Approval Status

ALTER TABLE public.access_requests
  ADD COLUMN status text NOT NULL DEFAULT 'pending',
  ADD COLUMN reviewed_at timestamptz;
